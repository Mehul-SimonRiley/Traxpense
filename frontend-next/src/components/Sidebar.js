"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiDollarSign, FiGrid, FiPieChart, FiBarChart2, FiCalendar, FiSettings, FiLogOut } from 'react-icons/fi';
import styles from '@/styles/DashboardLayout.module.css';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { label: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { label: 'Transactions', icon: FiDollarSign, path: '/dashboard/transactions' },
    { label: 'Categories', icon: FiGrid, path: '/dashboard/categories' },
    { label: 'Budgets', icon: FiPieChart, path: '/dashboard/budgets' },
    { label: 'Reports', icon: FiBarChart2, path: '/dashboard/reports' },
    { label: 'Calendar', icon: FiCalendar, path: '/dashboard/calendar' },
    { label: 'Settings', icon: FiSettings, path: '/dashboard/settings' },
];

export default function Sidebar({ isOpen }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${!isOpen ? styles.hiddenLabel : ''}`}
                            title={!isOpen ? item.label : ''}
                        >
                            <Icon className={styles.navIcon} />
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    );
                })}

                <div style={{ marginTop: 'auto' }}>
                    <button
                        onClick={handleLogout}
                        className={`${styles.navItem} ${!isOpen ? styles.hiddenLabel : ''}`}
                        title={!isOpen ? 'Logout' : ''}
                    >
                        <FiLogOut className={styles.navIcon} />
                        <span className={styles.navLabel}>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}
