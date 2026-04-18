import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use(async (config) => {
  // Enforce secure Clerk Session Tokens
  if (window.Clerk && window.Clerk.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch(e) {
      console.error("Failed to fetch Clerk token", e);
    }
  }
  
  return config;
});

export default api;