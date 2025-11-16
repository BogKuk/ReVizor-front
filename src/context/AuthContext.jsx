import React, { createContext, useState } from 'react';
import axios from 'axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);

    const login = (token) => {
        setAccessToken(token);
        localStorage.setItem("accessToken", token);
    };

    const logout = () => {
        setAccessToken(null);
        localStorage.removeItem('accessToken');
    };

    const refreshAccessToken = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/authorization/refresh', {}, {
                withCredentials: true, headers: { "Content-Type": "application/json" }// важно, чтобы cookie отправились
            });
            const token = response.data.access_token;
            setAccessToken(token);
            localStorage.setItem('accessToken', token);
            return token;
        } catch (err) {
            console.error('Не удалось обновить access token', err);
            logout();
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ accessToken, login, logout, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};