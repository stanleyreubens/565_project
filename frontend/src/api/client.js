// Location: frontend/src/api/client.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials for cookies if needed in the future
  // withCredentials: true
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration and other errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response: ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('API Network Error:', error.message);
      return Promise.reject(error);
    }
    
    // Handle status code errors
    if (error.response.status === 401) {
      // Redirect to login if token is invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Log error details in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;