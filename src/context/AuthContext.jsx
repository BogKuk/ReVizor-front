import React, { createContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);

    const login = (newAccessToken, newRefreshToken) => {
        if (newAccessToken) {
            setAccessToken(newAccessToken);
            localStorage.setItem('accessToken', newAccessToken);
        }
        if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
            localStorage.setItem('refreshToken', newRefreshToken);
        }
    };

    const logout = () => {
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const refreshAccessToken = useCallback(async () => {
        if (!refreshToken) {
            return null;
        }
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/authorization/refresh',
                {},
                { headers: { Authorization: `Bearer ${refreshToken}` } }
            );

            const authHeader = response.headers?.authorization || '';
            const newAccessToken = authHeader.startsWith('Bearer ')
                ? authHeader.slice('Bearer '.length)
                : null;

            if (newAccessToken) {
                setAccessToken(newAccessToken);
                localStorage.setItem('accessToken', newAccessToken);
                return newAccessToken;
            }
            return null;
        } catch {
            logout();
            return null;
        }
    }, [refreshToken]);

    useEffect(() => {
        const reqId = axios.interceptors.request.use((config) => {
            if (accessToken) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        });

        const resId = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const original = error.config;
                if (error.response && error.response.status === 401 && !original.__retry) {
                    original.__retry = true;
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        original.headers = original.headers || {};
                        original.headers.Authorization = `Bearer ${newToken}`;
                        return axios(original);
                    }
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(reqId);
            axios.interceptors.response.eject(resId);
        };
    }, [accessToken, refreshToken, refreshAccessToken]);

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, login, logout, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};
