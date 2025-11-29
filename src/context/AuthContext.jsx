import React, { createContext, useEffect, useState } from 'react';
import axios from 'axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    axios.defaults.baseURL = 'http://127.0.0.1:8000';
    axios.defaults.withCredentials = true;

    const login = async (login, password) => {
        await axios.post('/authorization/login', { login, password }, {
            headers: { 'Content-Type': 'application/json' }
        });
        setIsAuthenticated(true);
    };

    const register = async (login, password) => {
        await axios.post('/authorization/register', { login, password }, {
            headers: { 'Content-Type': 'application/json' }
        });
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await axios.post('/authorization/logout', {}, {
                headers: { 'Content-Type': 'application/json' }
            });
        } finally {
            setIsAuthenticated(false);
        }
    };

    const refreshAccessToken = async () => {
        try {
            await axios.post('/authorization/refresh', {}, {
                headers: { 'Content-Type': 'application/json' }
            });
            setIsAuthenticated(true);
            return true;
        } catch {
            setIsAuthenticated(false);
            return false;
        }
    };

    useEffect(() => {
        refreshAccessToken();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, register, logout, refreshAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};
