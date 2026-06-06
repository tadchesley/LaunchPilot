import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_URL = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("lp_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("lp_token");
  }
}

// hydrate token from storage on load
const stored = typeof window !== "undefined" ? localStorage.getItem("lp_token") : null;
if (stored) {
  api.defaults.headers.common.Authorization = `Bearer ${stored}`;
}
