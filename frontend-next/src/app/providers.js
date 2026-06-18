"use client";

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    {children}
                    <ToastContainer position="bottom-right" />
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
