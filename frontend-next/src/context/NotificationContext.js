"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import settingsService from '@/services/settingsService';
import { useAuth } from '@/context/AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [preferences, setPreferences] = useState(null);

    useEffect(() => {
        // Fetch preferences only when authenticated
        const fetchPrefs = async () => {
            if (!user) return;
            try {
                const res = await settingsService.getSettings();
                setPreferences(res.data?.push_notifications || {});
            } catch (e) {
                console.error("Failed to load notification preferences", e);
            }
        };
        
        if (user) {
            fetchPrefs();
        }

        // Load some initial system notifications
        setNotifications([
            { id: 1, title: 'Welcome to Traxpense 2.0', message: 'Explore the new dashboard and features.', category: 'system', read: false, time: new Date().toISOString() },
            { id: 2, title: 'Feature Update', message: 'You can now view All Time history across budgets.', category: 'system', read: false, time: new Date(Date.now() - 86400000).toISOString() }
        ]);
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const addNotification = (title, message, category = 'system') => {
        if (preferences && preferences[category] === false) {
            return; // blocked by user settings
        }

        setNotifications(prev => [{
            id: Date.now(),
            title,
            message,
            category,
            read: false,
            time: new Date().toISOString()
        }, ...prev]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);
