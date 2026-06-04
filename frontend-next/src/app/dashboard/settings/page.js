"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    FiSave, FiUser, FiSettings, FiBell, FiShield,
    FiEye, FiEyeOff, FiCamera, FiCheck, FiX, FiMail, FiSmartphone
} from "react-icons/fi";
import settingsService from "@/services/settingsService";
import LoadingSpinner from "@/components/LoadingSpinner";
import AnimatedButton from "@/components/AnimatedButton";
import styles from "@/styles/Settings.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'react-toastify';
import { getAvatarUrl } from "@/utils/format";
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { user, setUser } = useAuth();
    const [activeSection, setActiveSection] = useState("profile");
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    // Profile Settings State
    const [profileData, setProfileData] = useState({
        firstName: "", lastName: "", email: "", phone: "",
        avatar: "", bio: "", dateOfBirth: "", occupation: "", location: "",
    });

    // Security Settings State
    const [securityData, setSecurityData] = useState({
        currentPassword: "", newPassword: "", confirmPassword: "",
        twoFactorEnabled: false, loginNotifications: true, sessionTimeout: "30",
    });

    // Preferences State
    const [preferencesData, setPreferencesData] = useState({
        language: "en", dateFormat: "MM/DD/YYYY", timeFormat: "12", timezone: "America/New_York",
    });

    // Notification Settings State
    const [notificationData, setNotificationData] = useState({
        emailNotifications: {
            budgetAlerts: true, monthlyReports: true, transactionReminders: false,
            securityAlerts: true, promotionalEmails: false,
        },
        pushNotifications: {
            newTransactions: true, budgetLimits: true, billReminders: true, weeklyDigest: false,
        },
        notificationFrequency: "immediate",
        quietHours: { enabled: true, startTime: "22:00", endTime: "08:00" },
    });

    const settingsNavigation = [
        { id: "profile", label: "Profile", icon: FiUser },
        { id: "security", label: "Security", icon: FiShield },
        { id: "preferences", label: "Preferences", icon: FiSettings },
        { id: "notifications", label: "Notifications", icon: FiBell },
    ];

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await settingsService.getSettings();
            const settings = response.data;

            setProfileData({
                firstName: settings.name?.split(' ')[0] || '',
                lastName: settings.name?.split(' ').slice(1).join(' ') || '',
                email: settings.email || '',
                phone: settings.phone || '',
                avatar: settings.profile_picture || '',
                bio: settings.bio || '',
                dateOfBirth: settings.date_of_birth || '',
                occupation: settings.occupation || '',
                location: settings.location || '',
            });

            setSecurityData(prev => ({
                ...prev,
                twoFactorEnabled: settings.two_factor_enabled || false,
                loginNotifications: settings.login_notifications || true,
                sessionTimeout: settings.session_timeout?.toString() || '30',
            }));

            setPreferencesData({
                language: settings.language || 'en',
                dateFormat: settings.date_format || 'MM/DD/YYYY',
                timeFormat: settings.time_format || '12',
                timezone: settings.timezone || 'America/New_York',
            });

            setNotificationData(prev => ({
                ...prev,
                emailNotifications: settings.email_notifications || prev.emailNotifications,
                pushNotifications: settings.push_notifications || prev.pushNotifications,
                notificationFrequency: settings.notification_frequency || 'immediate',
                quietHours: settings.quiet_hours || prev.quietHours,
            }));

        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async (section, data) => {
        try {
            setIsLoading(true);
            setSaveStatus(null);
            setErrorMessage("");

            switch (section) {
                case 'profile':
                    await settingsService.updateProfile({
                        name: `${data.firstName} ${data.lastName}`.trim(),
                        email: data.email,
                        phone: data.phone,
                        bio: data.bio,
                        date_of_birth: data.dateOfBirth,
                        occupation: data.occupation,
                        location: data.location,
                    });
                    break;
                case 'security':
                    await settingsService.updateSecurity({
                        current_password: data.currentPassword,
                        new_password: data.newPassword,
                        two_factor_enabled: data.twoFactorEnabled,
                        login_notifications: data.loginNotifications,
                        session_timeout: parseInt(data.sessionTimeout),
                    });
                    // Clear password fields on success
                    setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                    break;
                case 'preferences':
                    await settingsService.updatePreferences({
                        language: data.language,
                        date_format: data.dateFormat,
                        time_format: data.timeFormat,
                        timezone: data.timezone,
                    });
                    break;
                case 'notifications':
                    await settingsService.updateNotifications({
                        email_notifications: data.emailNotifications,
                        push_notifications: data.pushNotifications,
                        notification_frequency: data.notificationFrequency,
                        quiet_hours: data.quietHours,
                    });
                    break;
                default:
                    throw new Error('Invalid section');
            }

            setSaveStatus('success');
            toast.success('Settings saved successfully!');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error(`Error saving ${section} settings:`, error);
            setSaveStatus('error');
            const msg = error.response?.data?.message || error.message || "Failed to save settings";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const response = await settingsService.uploadProfilePicture(file);
            const newAvatarPath = response.data.profile_picture;
            setProfileData(prev => ({ ...prev, avatar: newAvatarPath }));
            if (user) {
                setUser({ ...user, profile_picture: newAvatarPath });
                localStorage.setItem('user', JSON.stringify({ ...user, profile_picture: newAvatarPath }));
            }
            toast.success('Profile picture updated successfully');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error('Failed to upload profile picture');
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading && !profileData.email) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner text="Loading settings..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Settings</h1>
                {saveStatus && (
                    <div className={`${styles.statusMessage} ${styles[saveStatus]}`}>
                        {saveStatus === "success" ? (
                            <><FiCheck /> Settings saved successfully!</>
                        ) : (
                            <><FiX /> {errorMessage}</>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.container}>
                {/* Sidebar Navigation */}
                <div className={styles.card}>
                    <nav className={styles.sidebarNav}>
                        {settingsNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ""}`}
                                    onClick={() => setActiveSection(item.id)}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className={styles.card}>
                    {/* Profile Section */}
                    {activeSection === "profile" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <div className={styles.contentHeader}>
                                <h2 className={styles.sectionTitle}>Profile Settings</h2>
                                <p className={styles.sectionDescription}>Manage your personal information and profile details</p>
                            </div>
                            <div className={styles.contentBody}>
                                <div className={styles.avatarSection}>
                                    <div className={styles.avatarWrapper}>
                                        <div className={styles.avatar}>
                                            {profileData.avatar ? (
                                                <img
                                                    src={(() => {
                                                        const url = getAvatarUrl(profileData.avatar);
                                                        console.log('Avatar Path:', profileData.avatar, 'Resolved URL:', url);
                                                        return url;
                                                    })()}
                                                    alt="Avatar"
                                                    className={styles.avatarImage}
                                                    onError={(e) => {
                                                        console.error('Avatar load error for:', e.target.src);
                                                        e.target.onerror = null;
                                                        e.target.src = "https://ui-avatars.com/api/?name=" + (profileData.firstName || 'User');
                                                    }}
                                                />
                                            ) : (
                                                <span>{(profileData.firstName?.[0] || 'U')}</span>
                                            )}
                                        </div>
                                        <label className={styles.uploadButton}>
                                            <FiCamera className="w-4 h-4 text-gray-600" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[var(--text-primary)]">Profile Picture</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">Upload a new picture (Max 5MB)</p>
                                    </div>
                                </div>

                                <div className={styles.grid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>First Name</label>
                                        <input className={styles.input} type="text" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} placeholder="First Name" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Last Name</label>
                                        <input className={styles.input} type="text" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} placeholder="Last Name" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Email</label>
                                        <input className={styles.input} type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} placeholder="Email" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Phone</label>
                                        <input className={styles.input} type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="Phone" />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                                        <label className={styles.label}>Bio</label>
                                        <textarea className={styles.textarea} value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} placeholder="Tell us about yourself..." />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.footer}>
                                <AnimatedButton onClick={() => saveSettings('profile', profileData)} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Profile'}
                                </AnimatedButton>
                            </div>
                        </motion.div>
                    )}

                    {/* Security Section */}
                    {activeSection === "security" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <div className={styles.contentHeader}>
                                <h2 className={styles.sectionTitle}>Security Settings</h2>
                                <p className={styles.sectionDescription}>Manage password and security preferences</p>
                            </div>
                            <div className={styles.contentBody}>
                                <div className={styles.grid}>
                                    <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                                        <label className={styles.label}>Current Password</label>
                                        <div className={styles.passwordInputWrapper}>
                                            <input className={styles.input} type={showCurrentPassword ? "text" : "password"} value={securityData.currentPassword} onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })} placeholder="Current Password" />
                                            <button type="button" className={styles.togglePassword} onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>New Password</label>
                                        <div className={styles.passwordInputWrapper}>
                                            <input className={styles.input} type={showNewPassword ? "text" : "password"} value={securityData.newPassword} onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })} placeholder="New Password" />
                                            <button type="button" className={styles.togglePassword} onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Confirm New Password</label>
                                        <div className={styles.passwordInputWrapper}>
                                            <input className={styles.input} type={showConfirmPassword ? "text" : "password"} value={securityData.confirmPassword} onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })} placeholder="Confirm Password" />
                                            <button type="button" className={styles.togglePassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.footer}>
                                <AnimatedButton onClick={() => saveSettings('security', securityData)} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Update Security'}
                                </AnimatedButton>
                            </div>
                        </motion.div>
                    )}

                    {/* Preferences Section */}
                    {activeSection === "preferences" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <div className={styles.contentHeader}>
                                <h2 className={styles.sectionTitle}>Preferences</h2>
                                <p className={styles.sectionDescription}>Customize your localization settings</p>
                            </div>
                            <div className={styles.contentBody}>
                                <div className={styles.grid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Language</label>
                                        <select className={styles.select} value={preferencesData.language} onChange={(e) => setPreferencesData({ ...preferencesData, language: e.target.value })}>
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                            <option value="fr">Français</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Date Format</label>
                                        <select className={styles.select} value={preferencesData.dateFormat} onChange={(e) => setPreferencesData({ ...preferencesData, dateFormat: e.target.value })}>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.footer}>
                                <AnimatedButton onClick={() => saveSettings('preferences', preferencesData)} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Preferences'}
                                </AnimatedButton>
                            </div>
                        </motion.div>
                    )}

                    {/* Notifications Section */}
                    {activeSection === "notifications" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                            <div className={styles.contentHeader}>
                                <h2 className={styles.sectionTitle}>Notifications</h2>
                                <p className={styles.sectionDescription}>Control your email and push notifications</p>
                            </div>
                            <div className={styles.contentBody}>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium text-[var(--text-primary)] mb-4">Email Notifications</h3>
                                        <div className="space-y-3">
                                            {Object.entries(notificationData.emailNotifications).map(([key, value]) => (
                                                <div key={key} className={styles.notificationItem}>
                                                    <div className={styles.notificationInfo}>
                                                        <h4 style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, " $1")}</h4>
                                                    </div>
                                                    <label className={styles.toggleSwitch}>
                                                        <input
                                                            type="checkbox"
                                                            className={styles.toggleInput}
                                                            checked={value}
                                                            onChange={(e) => setNotificationData({
                                                                ...notificationData,
                                                                emailNotifications: {
                                                                    ...notificationData.emailNotifications,
                                                                    [key]: e.target.checked
                                                                }
                                                            })}
                                                        />
                                                        <span className={styles.toggleSlider}></span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.footer}>
                                <AnimatedButton onClick={() => saveSettings('notifications', notificationData)} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Notifications'}
                                </AnimatedButton>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
