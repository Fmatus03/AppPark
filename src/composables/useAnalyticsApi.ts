import axios, { AxiosInstance } from 'axios';

type PostPayload = Record<string, unknown>;

type UseAnalyticsApiOptions = {
	/** Optional override for the analytics base URL */
	baseURL?: string;
	/** Optional function to resolve the auth token */
	getToken?: () => string | undefined;
};

const appendAnalyticsPath = (base: string) => {
	const sanitizedBase = base.replace(/\/+$/, '');
	const hasAnalyticsPath = /\/api\/analista\/reportes\/?$/.test(sanitizedBase);
	const analyticsBase = hasAnalyticsPath ? sanitizedBase : `${sanitizedBase}/api/analista/reportes`;
	return `${analyticsBase.replace(/\/+$/, '')}/`;
};

export const useAnalyticsApi = (options?: UseAnalyticsApiOptions) => {
	const envBase = import.meta.env.VITE_PARK_APP_API_URL as string | undefined;
	const resolvedBase = options?.baseURL ?? envBase ?? '';
	const baseURL = appendAnalyticsPath(resolvedBase);

	const client: AxiosInstance = axios.create({
		baseURL,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	});

	client.interceptors.request.use((config) => {
		const token = options?.getToken?.();
		if (token) {
			config.headers = config.headers ?? {};
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	const postReport = async <TResponse>(endpoint: string, payload: PostPayload): Promise<TResponse> => {
		const normalizedEndpoint = endpoint.replace(/^\/*/, '');
		const { data } = await client.post<TResponse>(normalizedEndpoint, payload);
		return data;
	};

	const getReport = async <TResponse>(endpoint: string, params?: Record<string, unknown>): Promise<TResponse> => {
		const normalizedEndpoint = endpoint.replace(/^\/*/, '');
		const { data } = await client.get<TResponse>(normalizedEndpoint, { params });
		return data;
	};

	return {
		postReport,
		getReport,
	};
};
