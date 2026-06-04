"use client";

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from '@/styles/DashboardLayout.module.css';
import { FiPlus } from 'react-icons/fi';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleQuickAdd = () => {
        // We will tie this to the actual transaction modal soon.
        console.log("Global Quick Add clicked");
        alert("Global Quick Add Modal Coming Soon!");
    };

    return (
        <div className={styles.dashboardContainer}>
            <Sidebar isOpen={sidebarOpen} />
            <div className={styles.mainContent}>
                <Header
                    isOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className={styles.scrollArea}>
                    {children}
                </main>
                <button className={styles.fab} onClick={handleQuickAdd} title="Quick Add Transaction">
                    <FiPlus />
                </button>
            </div>
        </div>
    );
}
