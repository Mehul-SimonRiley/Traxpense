"use client"

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FiMenu, FiDollarSign, FiHome, FiGrid, FiPieChart, FiLogOut, FiCalendar, FiSettings, FiBarChart2 } from 'react-icons/fi';
import DashboardTab from './tabs/DashboardTab';
import CategoriesTab from './tabs/CategoriesTab';
import BudgetsTab from './tabs/BudgetsTab';
import TransactionsTab from './tabs/TransactionsTab';
import ReportsTab from './tabs/ReportsTab';
import CalendarTab from './tabs/CalendarTab';
import SettingsTab from './tabs/SettingsTab';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import Verification from './components/Verification';
import { authService } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

const AppContent = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getInitials = (user) => {
        if (!user?.name) return '';
        return user.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    };

    const tabs = [
        {
            value: 'dashboard',
            label: 'Dashboard',
            component: DashboardTab,
            icon: <FiHome />
        },
        {
            value: 'transactions',
            label: 'Transactions',
            component: TransactionsTab,
            icon: <FiDollarSign />
        },
        {
            value: 'categories',
            label: 'Categories',
            component: CategoriesTab,
            icon: <FiGrid />
        },
        {
            value: 'budgets',
            label: 'Budgets',
            component: BudgetsTab,
            icon: <FiPieChart />
        },
        {
            value: 'reports',
            label: 'Reports',
            component: ReportsTab,
            icon: <FiBarChart2 />
        },
        {
            value: 'calendar',
            label: 'Calendar',
            component: CalendarTab,
            icon: <FiCalendar />
        },
        {
            value: 'settings',
            label: 'Settings',
            component: SettingsTab,
            icon: <FiSettings />
        }
    ];

    const renderTabContent = () => {
        const tab = tabs.find(t => t.value === activeTab);
        return tab ? <tab.component key={tab.value} /> : null;
    };

    return (
        <div className="min-h-screen" style={{ backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto relative h-16">
                    {/* Left: Hamburger menu */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-4 sm:pl-6 lg:pl-8">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <FiMenu className="h-6 w-6" />
                        </button>
                    </div>
                    {/* Center: Logo */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                        <FiDollarSign className="h-8 w-8 text-blue-600" />
                        <span className="ml-2 text-xl font-bold text-gray-900">Traxpense</span>
                    </div>
                    {/* Right: User avatar */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-4 sm:pr-6 lg:pr-8">
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="flex items-center space-x-3 focus:outline-none"
                        >
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium">{getInitials(user)}</span>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white bg-opacity-80 rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
                        <div className="text-lg font-semibold mb-4">Settings Tab is still under development for now.</div>
                        <div className="text-gray-600 mb-6">Thanks for your patience.</div>
                        <button
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 focus:outline-none"
                            onClick={() => {
                                setShowSettingsModal(false);
                                setActiveTab('dashboard');
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="flex">
                {/* Sidebar */}
                <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out bg-white bg-opacity-80 shadow-sm`}>
                    <nav className="mt-5 px-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    if (tab.value === 'settings') {
                                        setShowSettingsModal(true);
                                    } else {
                                        setActiveTab(tab.value);
                                    }
                                }}
                                className={`
                                    ${activeTab === tab.value
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mb-1
                                `}
                            >
                                {tab.icon}
                                <span className="ml-3">{tab.label}</span>
                            </button>
                        ))}
                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mb-1 text-gray-600 hover:bg-gray-50"
                        >
                            <FiLogOut className="mr-3" />
                            <span className="ml-3">Logout</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4">
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
};

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify" element={<Verification />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <AppContent />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
                <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            </AuthProvider>
        </Router>
    );
} 