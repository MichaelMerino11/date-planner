import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = 'http://192.168.100.191:3000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (name: string, email: string, password: string) =>
    api.post("/api/auth/register", { name, email, password }),

  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),

  linkCouple: (email: string, password: string, invite_code: string) =>
    api.post("/api/auth/link-couple", { email, password, invite_code }),
};

export default api;
