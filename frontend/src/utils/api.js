import axios from 'axios';

// Use direct URL since proxy isn't working
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - FIXED: Added missing quote
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response.data;
  },
  (error) => {
    console.error('❌ API Error:', error.message); // FIXED: Added missing quote
    return Promise.reject(error);
  }
);

// Test backend connection directly
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    console.log('✅ Backend is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

// Test API connection - use the correct endpoint
export const testProxyConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    // Test with a real endpoint that exists
    const response = await api.get('/rooms');
    console.log('✅ API connection working');
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
};

export const generateAnonymousUser = async () => {
  try {
    const response = await api.post('/auth/anonymous');
    return response;
  } catch (error) {
    console.error('Error generating anonymous user:', error);
    return null;
  }
};

export const getRooms = async () => {
  try {
    const response = await api.get('/rooms');
    console.log('📦 Rooms loaded:', response);
    
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await api.post('/rooms', roomData);
    return response;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const response = await api.delete(`/rooms/${roomId}`);
    return response;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

export const getRoomMessages = async (roomId) => {
  try {
    const response = await api.get(`/rooms/${roomId}/messages`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const getRoom = async (roomId) => {
  try {
    const response = await api.get(`/rooms/${roomId}`);
    return response;
  } catch (error) {
    console.error('Error fetching room:', error);
    return null;
  }
};

export default api;