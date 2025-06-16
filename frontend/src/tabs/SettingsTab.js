"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  FiSave,
  FiUser,
  FiSettings,
  FiBell,
  FiDollarSign,
  FiShield,
  FiEye,
  FiEyeOff,
  FiCamera,
  FiMail,
  FiSmartphone,
  FiCheck,
  FiX,
} from "react-icons/fi"
import settingsService from "../services/settingsService"
import LoadingSpinner from "../components/LoadingSpinner"
import "./SettingsTab.css"

export default function SettingsTab({ onError }) {
  const [activeSection, setActiveSection] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success', 'error', or null

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    dateOfBirth: "",
    occupation: "",
    location: "",
  })

  // Security Settings State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: "30", // minutes
  })

  // Preferences State
  const [preferencesData, setPreferencesData] = useState({
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12", // 12 or 24
    timezone: "America/New_York",
  })

  // Currency Settings State
  const [currencyData, setCurrencyData] = useState({
    primaryCurrency: "USD",
    currencyDisplay: "symbol", // symbol, code, name
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
    showCurrencySymbol: true,
  })

  // Notification Settings State
  const [notificationData, setNotificationData] = useState({
    emailNotifications: {
      budgetAlerts: true,
      monthlyReports: true,
      transactionReminders: false,
      securityAlerts: true,
      promotionalEmails: false,
    },
    pushNotifications: {
      newTransactions: true,
      budgetLimits: true,
      billReminders: true,
      weeklyDigest: false,
    },
    notificationFrequency: "immediate", // immediate, daily, weekly
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "08:00",
    },
  })

  const settingsNavigation = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiShield },
    { id: "preferences", label: "Preferences", icon: FiSettings },
    // Removed from navigation, but data structure kept for backend integration
    // { id: "currency", label: "Currency", icon: FiDollarSign },
    { id: "notifications", label: "Notifications", icon: FiBell },
  ]

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  ]

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
  ]

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
  ]

  // Fetch settings on component mount
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getSettings();
      const settings = response.data;

      // Update profile data
      setProfileData({
        firstName: settings.name?.split(' ')[0] || '',
        lastName: settings.name?.split(' ')[1] || '',
        email: settings.email || '',
        phone: settings.phone || '',
        avatar: settings.profile_picture || '',
        bio: settings.bio || '',
        dateOfBirth: settings.date_of_birth || '',
        occupation: settings.occupation || '',
        location: settings.location || '',
      });

      // Update security data
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: settings.two_factor_enabled || false,
        loginNotifications: settings.login_notifications || true,
        sessionTimeout: settings.session_timeout?.toString() || '30',
      });

      // Update preferences data
      setPreferencesData({
        language: settings.language || 'en',
        dateFormat: settings.date_format || 'MM/DD/YYYY',
        timeFormat: settings.time_format || '12',
        timezone: settings.timezone || 'America/New_York',
      });

      // Update currency data
      setCurrencyData({
        primaryCurrency: settings.primary_currency || 'USD',
        currencyDisplay: settings.currency_display || 'symbol',
        decimalSeparator: settings.decimal_separator || '.',
        thousandsSeparator: settings.thousands_separator || ',',
        decimalPlaces: settings.decimal_places || 2,
        showCurrencySymbol: settings.show_currency_symbol || true,
      });

      // Update notification data
      setNotificationData({
        emailNotifications: settings.email_notifications || {
          budgetAlerts: true,
          monthlyReports: true,
          transactionReminders: false,
          securityAlerts: true,
          promotionalEmails: false,
        },
        pushNotifications: settings.push_notifications || {
          newTransactions: true,
          budgetLimits: true,
          billReminders: true,
          weeklyDigest: false,
        },
        notificationFrequency: settings.notification_frequency || 'immediate',
        quietHours: settings.quiet_hours || {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      if (onError) onError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings function
  const saveSettings = async (section, data) => {
      try {
      setIsLoading(true);
      setSaveStatus(null);

      switch (section) {
        case 'profile':
          await settingsService.updateProfile({
            name: `${data.firstName} ${data.lastName}`,
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
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      setSaveStatus('error');
      if (onError) onError(`Failed to save ${section} settings`);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const response = await settingsService.uploadProfilePicture(file);
      setProfileData({ ...profileData, avatar: response.data.profile_picture });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setSaveStatus('error');
      if (onError) onError('Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-overlay transparent">
        <LoadingSpinner text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="transparent">
      <div className="flex justify-between items-center mb-6">
      <h1 className="page-title">Settings</h1>
        {saveStatus && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md ${
              saveStatus === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {saveStatus === "success" ? <FiCheck /> : <FiX />}
            {saveStatus === "success" ? "Settings saved successfully!" : "Failed to save settings"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="card lg:col-span-1">
          <div className="card-content p-0">
            <nav className="divide-y">
              {settingsNavigation.map((item) => {
                const Icon = item.icon
                return (
                <button
                    key={item.id}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors settings-tab-item ${
                      activeSection === item.id ? "active" : ""
                    }`}
                    onClick={() => setActiveSection(item.id)}
                >
                    <Icon className="w-5 h-5" />
                    {item.label}
                </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="card lg:col-span-3">
          {/* Profile Settings */}
          {activeSection === "profile" && (
            <>
              <div className="card-header">
                <h2 className="card-title">Profile Settings</h2>
                <p className="text-sm text-muted">Manage your personal information and profile details</p>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 gap-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar || "/placeholder.svg"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          `${profileData.firstName?.[0] || ""}${profileData.lastName?.[0] || ""}`
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer border">
                        <FiCamera className="w-4 h-4 text-gray-600" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      </label>
                    </div>
                    <div>
                      <h3 className="font-medium">Profile Picture</h3>
                      <p className="text-sm text-muted">Upload a new profile picture. Max size: 5MB</p>
                    </div>
                </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-input"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Occupation</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileData.occupation}
                        onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                        placeholder="Enter your occupation"
                      />
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="Enter your location"
                      />
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Bio</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => saveSettings("profile", profileData)}
                  disabled={isLoading}
                >
                  <FiSave className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </>
          )}

          {/* Security Settings */}
          {activeSection === "security" && (
            <>
              <div className="card-header">
                <h2 className="card-title">Security Settings</h2>
                <p className="text-sm text-muted">Manage your account security and privacy</p>
                </div>
              <div className="card-content">
                <div className="space-y-6">
                  {/* Change Password */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            className="form-input pr-10"
                            value={securityData.currentPassword}
                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="form-input pr-10"
                            value={securityData.newPassword}
                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-input pr-10"
                            value={securityData.confirmPassword}
                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Enable 2FA</h4>
                        <p className="text-sm text-muted">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={securityData.twoFactorEnabled}
                          onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Security Preferences */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Security Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Login Notifications</h4>
                          <p className="text-sm text-muted">Get notified when someone logs into your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={securityData.loginNotifications}
                            onChange={(e) => setSecurityData({ ...securityData, loginNotifications: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        </div>
                      <div className="form-group">
                        <label className="form-label">Session Timeout (minutes)</label>
                        <select
                          className="form-select"
                          value={securityData.sessionTimeout}
                          onChange={(e) => setSecurityData({ ...securityData, sessionTimeout: e.target.value })}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="480">8 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => saveSettings("security", securityData)}
                  disabled={isLoading}
                >
                  <FiSave className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Security Settings"}
                </button>
              </div>
            </>
          )}

          {/* Preferences Settings */}
          {activeSection === "preferences" && (
            <>
              <div className="card-header">
                <h2 className="card-title">Preferences</h2>
                <p className="text-sm text-muted">Customize your app experience</p>
                </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Language</label>
                      <select
                        className="form-select"
                        value={preferencesData.language}
                        onChange={(e) => setPreferencesData({ ...preferencesData, language: e.target.value })}
                      >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date Format</label>
                      <select
                        className="form-select"
                      value={preferencesData.dateFormat}
                      onChange={(e) => setPreferencesData({ ...preferencesData, dateFormat: e.target.value })}
                      >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD MMM YYYY">DD MMM YYYY</option>
                      </select>
                    </div>

                    <div className="form-group">
                    <label className="form-label">Time Format</label>
                      <select
                        className="form-select"
                      value={preferencesData.timeFormat}
                      onChange={(e) => setPreferencesData({ ...preferencesData, timeFormat: e.target.value })}
                      >
                      <option value="12">12-hour (AM/PM)</option>
                      <option value="24">24-hour</option>
                      </select>
                    </div>

                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select
                      className="form-select"
                      value={preferencesData.timezone}
                      onChange={(e) => setPreferencesData({ ...preferencesData, timezone: e.target.value })}
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => saveSettings("preferences", preferencesData)}
                  disabled={isLoading}
                >
                  <FiSave className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </>
          )}

          {/* Notification Settings */}
          {activeSection === "notifications" && (
            <>
              <div className="card-header">
                <h2 className="card-title">Notification Settings</h2>
                <p className="text-sm text-muted">Manage how and when you receive notifications</p>
              </div>
              <div className="card-content">
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FiMail className="w-5 h-5" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notificationData.emailNotifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h4>
                            <p className="text-sm text-muted">
                              {key === "budgetAlerts" && "Get notified when you exceed budget limits"}
                              {key === "monthlyReports" && "Receive monthly expense summaries"}
                              {key === "transactionReminders" && "Reminders for recurring transactions"}
                              {key === "securityAlerts" && "Important security notifications"}
                              {key === "promotionalEmails" && "Updates about new features and tips"}
                            </p>
                </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                              className="sr-only peer"
                              checked={value}
                            onChange={(e) =>
                                setNotificationData({
                                  ...notificationData,
                                  emailNotifications: {
                                    ...notificationData.emailNotifications,
                                    [key]: e.target.checked,
                                  },
                                })
                            }
                          />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FiSmartphone className="w-5 h-5" />
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notificationData.pushNotifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h4>
                            <p className="text-sm text-muted">
                              {key === "newTransactions" && "Instant notifications for new transactions"}
                              {key === "budgetLimits" && "Alerts when approaching budget limits"}
                              {key === "billReminders" && "Reminders for upcoming bills"}
                              {key === "weeklyDigest" && "Weekly summary of your expenses"}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                              className="sr-only peer"
                              checked={value}
                            onChange={(e) =>
                                setNotificationData({
                                  ...notificationData,
                                  pushNotifications: {
                                    ...notificationData.pushNotifications,
                                    [key]: e.target.checked,
                                  },
                                })
                            }
                          />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Notification Frequency</label>
                        <select
                          className="form-select"
                          value={notificationData.notificationFrequency}
                            onChange={(e) =>
                            setNotificationData({ ...notificationData, notificationFrequency: e.target.value })
                            }
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>

                    <div className="form-group">
                        <div className="flex items-center justify-between mb-2">
                          <label className="form-label">Quiet Hours</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                              className="sr-only peer"
                              checked={notificationData.quietHours.enabled}
                            onChange={(e) =>
                                setNotificationData({
                                  ...notificationData,
                                  quietHours: {
                                    ...notificationData.quietHours,
                                    enabled: e.target.checked,
                                  },
                                })
                            }
                          />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {notificationData.quietHours.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                          <input
                              type="time"
                              className="form-input"
                              value={notificationData.quietHours.startTime}
                            onChange={(e) =>
                                setNotificationData({
                                  ...notificationData,
                                  quietHours: {
                                    ...notificationData.quietHours,
                                    startTime: e.target.value,
                                  },
                                })
                            }
                          />
                          <input
                              type="time"
                              className="form-input"
                              value={notificationData.quietHours.endTime}
                            onChange={(e) =>
                                setNotificationData({
                                  ...notificationData,
                                  quietHours: {
                                    ...notificationData.quietHours,
                                    endTime: e.target.value,
                                  },
                                })
                            }
                          />
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => saveSettings("notifications", notificationData)}
                  disabled={isLoading}
                >
                  <FiSave className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Notification Settings"}
                </button>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
