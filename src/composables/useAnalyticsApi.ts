import axios, { AxiosInstance } from 'axios';

const DEFAULT_BASE_URL = 'https://YOUR_API_URL/api/analista/reportes/';

type PostPayload = Record<string, unknown>;

type UseAnalyticsApiOptions = {
	/** Optional override for the analytics base URL */
	baseURL?: string;
	/** Optional function to resolve the auth token */
	getToken?: () => string | undefined;
};

export const useAnalyticsApi = (options?: UseAnalyticsApiOptions) => {
	const baseURL = (options?.baseURL ?? import.meta.env.VITE_ANALYTICS_API_URL ?? DEFAULT_BASE_URL).replace(/\/*$/, '/');

	const client: AxiosInstance = axios.create({
		baseURL,
		headers: {
			Accept: 'application/json',
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

	return {
		postReport,
	};
};
