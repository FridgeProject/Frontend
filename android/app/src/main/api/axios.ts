import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { getAccessToken } from './authStorage';

const baseURL = '';

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

const showError = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('오류', message);
  }
};

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await getAccessToken(); // 🔐 토큰 가져오기
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    console.log('[요청]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error: AxiosError) => {
    console.log('[요청 에러]', error.message);
    showError('요청 중 오류가 발생했습니다.');
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[응답]', response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.log('[응답 에러]', error.message);

    if (error.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message;

      console.log('응답 상태 코드:', status);
      console.log('응답 헤더:', error.response.headers);

      switch (status) {
        case 401:
          showError('로그인이 필요합니다.');
          break;
        case 403:
          showError('접근 권한이 없습니다.');
          break;
        case 500:
          showError('서버 내부 오류가 발생했습니다.');
          break;
        default:
          showError(serverMessage || '알 수 없는 오류가 발생했습니다.');
      }
    } else if (error.request) {
      showError('서버로부터 응답이 없습니다.');
    } else {
      showError('요청을 준비하던 중 문제가 발생했습니다.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;