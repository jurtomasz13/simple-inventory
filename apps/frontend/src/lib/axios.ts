import axios from "axios";

const defaultApiUrl = `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");

    if (token && config.headers) {
        config.headers.Authorization =`Bearer ${token}`; 
    }

    return config;
});

let isRedirectingToLogin = false;

export function getDemoLoginUrl() {
    const redirect = encodeURIComponent(window.location.href);
    return `${api.defaults.baseURL}/auth/login-dummy?redirect=${redirect}`;
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isRedirectingToLogin) {
            isRedirectingToLogin = true;
            localStorage.removeItem("accessToken");
            window.location.assign(getDemoLoginUrl());
        }

        return Promise.reject(error);
    }
);
