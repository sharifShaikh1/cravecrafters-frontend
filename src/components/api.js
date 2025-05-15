import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 15000, // Increased timeout
  withCredentials: true,
});

const retryRequest = async (config, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.request(config);
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Retrying request (${i + 1}/${retries}) after ${delay}ms due to: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Interceptor token:', token ? token.slice(0, 10) + '...' : 'No token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    console.log('API request config:', JSON.stringify(config, null, 2));
    return config;
  },
  (error) => {
    console.error('Interceptor request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API response:', JSON.stringify(response.data, null, 2));
    return response;
  },
  async (error) => {
    console.error('API error:', error.response ? error.response.data : error.message);
    if (error.message === 'Network Error' && !error.config.__isRetry) {
      error.config.__isRetry = true;
      return retryRequest(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;