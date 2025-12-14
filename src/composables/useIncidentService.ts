import { HTTP } from '@awesome-cordova-plugins/http';
import { useSession } from '@/composables/useSession';
import { isAndroidNativeApp, parseFetchResponse, throwFetchError, parseNativeResponse } from '@/utils/httpHelpers';
import { Capacitor } from '@capacitor/core';

export const useIncidentService = () => {
    const { authToken } = useSession();
    const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

    // Helper types
    type AudioEvidence = {
        id: number;
        dataUrl: string;
        createdAt: string;
        durationMs?: number;
        name: string;
        mimeType?: string | null;
        base64?: string | null;
        path?: string | null;
    };

    type PhotoEvidence = {
        base64String?: string;
        webPath?: string;
        path?: string;
        format: string;
    };

    const getAudioExtension = (mime?: string | null) => {
        if (!mime) return 'aac';
        const [, subtype] = mime.split('/');
        return subtype ? subtype.replace('+', '') : 'aac';
    };

    const base64ToBlob = (base64: string, mimeType: string) => {
        const byteCharacters = atob(base64);
        const blobParts: BlobPart[] = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i += 1) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            blobParts.push(new Uint8Array(byteNumbers));
        }
        return new Blob(blobParts, { type: mimeType });
    };

    const ensureWebAccessiblePath = (path?: string | null) => {
        if (!path) return null;
        if (path.startsWith('file://') || path.startsWith('content://')) {
            return Capacitor.convertFileSrc(path);
        }
        return path;
    };

    const photoToBlob = async (photo: PhotoEvidence) => {
        if (photo.base64String) {
            return base64ToBlob(photo.base64String, `image/${photo.format}`);
        }
        const sourceUrl = photo.webPath ?? ensureWebAccessiblePath(photo.path);
        if (!sourceUrl) throw new Error('No se encontró la imagen.');
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error('No se pudo procesar la imagen.');
        return response.blob();
    };

    const audioToBlob = async (audio: AudioEvidence) => {
        if (audio.base64) {
            return base64ToBlob(audio.base64, audio.mimeType ?? 'audio/aac');
        }
        if (audio.dataUrl?.startsWith('data:')) {
            const [, payload] = audio.dataUrl.split(',');
            if (payload) return base64ToBlob(payload, audio.mimeType ?? 'audio/aac');
        }
        const webPath = ensureWebAccessiblePath(audio.path ?? undefined);
        if (!webPath) throw new Error('No se encontró la ruta del audio.');
        const response = await fetch(webPath);
        if (!response.ok) throw new Error('No se pudo leer el archivo de audio.');
        return response.blob();
    };

    const createFormData = (usePonyfill: boolean) => {
        if (usePonyfill) {
            const ponyfills = (HTTP as unknown as { ponyfills?: { FormData?: new () => FormData } }).ponyfills;
            if (ponyfills?.FormData) {
                return new ponyfills.FormData() as unknown as FormData;
            }
        }
        return new FormData();
    };

    const buildIncidentFormData = async (
        incidentData: Record<string, unknown>,
        photos: PhotoEvidence[],
        audios: AudioEvidence[],
        usePonyfill = false
    ) => {
        const formData = createFormData(usePonyfill);
        formData.append(
            'incidente',
            new Blob([JSON.stringify(incidentData)], { type: 'application/json' })
        );

        await Promise.all(
            photos.map(async (photo, index) => {
                const blob = await photoToBlob(photo);
                const mimeType = blob.type || 'image/jpeg';
                const [, subtype] = mimeType.split('/');
                const extension = subtype ? subtype.replace('+', '') : 'jpg';
                formData.append('fotos', blob, `foto-${index + 1}.${extension}`);
            })
        );

        await Promise.all(
            audios.map(async (audio, index) => {
                const blob = await audioToBlob(audio);
                formData.append('audios', blob, `audio-${index + 1}.${getAudioExtension(audio.mimeType)}`);
            })
        );

        return formData;
    };

    const uploadIncident = async (
        incidentData: Record<string, unknown>,
        photos: PhotoEvidence[],
        audios: AudioEvidence[]
    ) => {
        if (!apiBaseUrl || !authToken.value) {
            throw new Error('Falta configuración de API o token de autenticación');
        }

        const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/api/incidentes`;
        const headers: Record<string, string> = {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken.value}`,
        };

        if (isAndroidNativeApp()) {
            const formData = await buildIncidentFormData(incidentData, photos, audios, true);
            const resp = await HTTP.sendRequest(endpoint, {
                method: 'post',
                serializer: 'multipart',
                headers,
                data: formData as unknown as Record<string, unknown>,
                responseType: 'text',
                timeout: 30, // 3 minutes timeout
            });
            const status = resp?.status ?? -1;
            const data = resp?.data ?? resp?.error ?? null;
            if (status < 200 || status >= 300) {
                throw { status, data };
            }
            return parseNativeResponse(data);
        } else {
            const formData = await buildIncidentFormData(incidentData, photos, audios, false);
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers,
            });
            if (!response.ok) {
                await throwFetchError(response);
            }
            return parseFetchResponse(response);
        }
    };

    return {
        uploadIncident,
    };
};
