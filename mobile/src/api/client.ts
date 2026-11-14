import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SERVER_URL = 'http://192.168.1.37:5000';

export const api = axios.create({
  baseURL: DEFAULT_SERVER_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token and active AWS connection ID
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('opsradar_token');
  const connectionId = await AsyncStorage.getItem('opsradar_connection_id');
  const customUrl = await AsyncStorage.getItem('opsradar_server_url');

  if (customUrl) {
    config.baseURL = customUrl;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (connectionId) {
    config.headers['x-aws-connection-id'] = connectionId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

