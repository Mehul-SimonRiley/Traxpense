"use client";

import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';
import styles from '@/styles/DashboardLayout.module.css';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/utils/format';

export default function Header({ toggleSidebar, isOpen }) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();


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
                    <img 
                        src={theme === 'dark' ? '/logo_white.png' : '/logo_black.png'} 
                        alt="Traxpense Logo" 
                        className={styles.logoIcon}
                        style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                    />
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
