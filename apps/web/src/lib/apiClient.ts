import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HTTP-Only cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});
