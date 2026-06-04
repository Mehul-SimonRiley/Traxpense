"use client";

import { FiMenu, FiDollarSign, FiSun, FiMoon, FiBell } from 'react-icons/fi';
import styles from '@/styles/DashboardLayout.module.css';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/utils/format';
import { useNotifications } from '@/context/NotificationContext';
import { useState, useRef, useEffect } from 'react';

export default function Header({ toggleSidebar, isOpen }) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (user) => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button onClick={toggleSidebar} className={styles.menuButton}>
                    <FiMenu size={24} />
                </button>
                <div className={styles.logo}>
                    <FiDollarSign className={styles.logoIcon} />
                    <span>Traxpense</span>
                </div>
            </div>

            <div className={styles.headerRight}>
                <button
                    onClick={toggleTheme}
                    className={styles.themeToggle}
                    aria-label="Toggle Theme"
                >
                    {theme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
                </button>

                <div className={styles.notificationWrapper} ref={notifRef}>
                    <button
                        className={styles.themeToggle}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <FiBell size={20} />
                        {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className={styles.notificationDropdown}>
                            <div className={styles.notificationHeader}>
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className={styles.markReadBtn}>Mark all read</button>
                                )}
                            </div>
                            <div className={styles.notificationList}>
                                {notifications.length === 0 ? (
                                    <div className={styles.emptyNotif}>No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.unreadNotif : ''}`} onClick={() => markAsRead(n.id)}>
                                            <div className={styles.notifContent}>
                                                <strong>{n.title}</strong>
                                                <p>{n.message}</p>
                                            </div>
                                            {!n.read && <div className={styles.unreadDot} />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.userProfile}>
                    <button
                        className={styles.avatarButton}
                        onClick={() => router.push('/dashboard/settings')}
                    >
                        <div className={styles.avatar}>
                            <div className={styles.avatar}>
                                {user?.profile_picture ? (
                                    <img
                                        src={getAvatarUrl(user.profile_picture)}
                                        alt="Profile"
                                        className={styles.headerAvatarImg}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    />
                                ) : (
                                    getInitials(user)
                                )}
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
