"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // We can optionally verify the token with an API call here
                // or just decode it. For now, rely on API 401s to log us out
                // failing that, we try to fetch the profile
                try {
                    const response = await api.get('/auth/profile');
                    setUser(response.data);
                } catch (err) {
                    console.error("Auth check failed:", err);
                    logout();
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        router.push('/dashboard');
        return user;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
