import { isPlatform } from '@ionic/vue';

export const isAndroidNativeApp = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    typeof (window as any).cordova !== 'undefined' &&
    isPlatform('android') &&
    isPlatform('hybrid')
  );
};

export const parseNativeResponse = <T>(payload: unknown): T => {
  if (payload == null) {
    return payload as T;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) {
      return '' as unknown as T;
    }

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return payload as T;
    }
  }

  return payload as T;
};

export const parseFetchResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
};

export const throwFetchError = async (response: Response): Promise<never> => {
  const data = await parseFetchResponse(response);
  const error = new Error(`Request failed with status ${response.status}`);
  (error as any).status = response.status;
  (error as any).data = data;
  throw error;
};
