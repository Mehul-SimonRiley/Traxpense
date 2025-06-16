"use client"

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    // Always show dashboard tab on mount (e.g., after login)
    useEffect(() => {
        setActiveTab('dashboard');
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            // The redirect will be handled by the AuthContext
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect to login even if there's an error
            window.location.href = '/login';
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
            <header className="dashboard-header">
                {/* Left: Hamburger menu */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="menu-button"
                >
                    <FiMenu className="h-6 w-6" />
                </button>

                {/* Center: Logo */}
                <div className="logo">
                    <FiDollarSign className="h-8 w-8 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900">Traxpense</span>
                </div>

                {/* Right: User avatar */}
                <div className="header-actions">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="avatar-button"
                    >
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium">{getInitials(user)}</span>
                        </div>
                    </button>
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
                <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out bg-white bg-opacity-80 shadow-sm`}>
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
                                title={sidebarOpen ? '' : tab.label}
                            >
                                {tab.icon}
                                <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>{tab.label}</span>
                            </button>
                        ))}
                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mb-1 text-gray-600 hover:bg-gray-50"
                            title={sidebarOpen ? '' : 'Logout'}
                        >
                            <FiLogOut className="mr-3" />
                            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>Logout</span>
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