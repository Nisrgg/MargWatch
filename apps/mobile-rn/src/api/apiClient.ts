import axios from 'axios';
import { getApiBaseURL, apiConfig } from '../config/apiConfig';

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
