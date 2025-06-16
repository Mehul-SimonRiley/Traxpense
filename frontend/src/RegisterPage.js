"use client"

/**
 * Registration Page Component
 *
 * This component provides a clean, modern registration form for new users.
 * It includes real-time validation, password strength checking, and is
 * designed to easily connect with a backend API.
 *
 * BACKEND INTEGRATION POINTS:
 * 1. Form submission - handleSubmit function
 * 2. Email validation - validateEmail function (optional)
 * 3. Password requirements - validateField function
 *
 * @author Your Name
 * @version 1.0
 */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiAlertCircle, FiCheck } from "react-icons/fi"
import { authService } from "./services/api"
import { toast } from "react-toastify"

export default function RegisterPage() {
  // Form state management
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  // UI state management
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isFormValid, setIsFormValid] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const navigate = useNavigate();

  /**
   * Password strength calculation
   * Returns score from 0-4 based on password complexity
   *
   * BACKEND NOTE: Ensure server-side validation matches these requirements
   *
   * @param {string} password - Password to evaluate
   * @returns {number} - Strength score (0-4)
   */
  const calculatePasswordStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return Math.min(score, 4)
  }

  /**
   * Real-time form validation
   * Validates individual fields and updates error state
   *
   * BACKEND NOTE: These validations should be duplicated on the server side
   *
   * @param {string} field - Field name to validate
   * @param {string|boolean} value - Field value to validate
   * @returns {string|null} - Error message or null if valid
   */
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Full name is required"
        if (value.trim().length < 2) return "Name must be at least 2 characters"
        return null

      case "email":
        if (!value) return "Email is required"
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return "Please enter a valid email address"
        return null

      case "password":
        if (!value) return "Password is required"
        if (value.length < 8) return "Password must be at least 8 characters"
        if (!/(?=.*[a-z])/.test(value)) return "Password must contain at least one lowercase letter"
        if (!/(?=.*[A-Z])/.test(value)) return "Password must contain at least one uppercase letter"
        if (!/(?=.*[0-9])/.test(value)) return "Password must contain at least one number"
        if (!/(?=.*[^A-Za-z0-9])/.test(value)) return "Password must contain at least one special character"
        return null

      case "confirmPassword":
        if (!value) return "Please confirm your password"
        if (value !== formData.password) return "Passwords do not match"
        return null

      case "agreeToTerms":
        if (!value) return "You must agree to the terms and conditions"
        return null

      default:
        return null
    }
  }

  /**
   * Handle input changes with real-time validation
   *
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === "checkbox" ? checked : value

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }))

    // Real-time validation
    const error = validateField(name, fieldValue)
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))

    // Update password strength for password field
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    // Revalidate confirm password if password changes
    if (name === "password" && formData.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword)
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }))
    }
  }

  /**
   * Check if form is valid for submission
   */
  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error !== null)
    const hasEmptyFields = Object.entries(formData).some(([key, value]) => {
      if (key === "agreeToTerms") return !value
      return !value.trim()
    })

    setIsFormValid(!hasErrors && !hasEmptyFields && formData.agreeToTerms)
  }, [formData, errors])

  /**
   * Handle form submission
   *
   * BACKEND INTEGRATION POINT:
   * This function should send the form data to your backend API
   *
   * Expected request:
   * POST /api/auth/register
   * Body: { name, email, password }
   *
   * Expected responses:
   * - 201 Created: Registration successful
   * - 400 Bad Request: Validation errors
   * - 409 Conflict: Email already exists
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitted(true)

    // Final validation before submission
    const newErrors = {}
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      console.log("Attempting to register with data:", { name: formData.name, email: formData.email });
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      console.log("Registration API call successful, response:", response);
      toast.success("Registration successful! Please check your email for verification.")
      setTimeout(() => {
        navigate('/verify', { state: { email: formData.email } })
      }, 1000)
    } catch (err) {
      console.error("Registration API call failed:", err);
      setErrors({
        api: err.error || "Registration failed. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get password strength color and text
   */
  const getPasswordStrengthInfo = () => {
    const strengthLevels = [
      { color: "bg-red-500", text: "Very Weak", textColor: "text-red-600" },
      { color: "bg-orange-500", text: "Weak", textColor: "text-orange-600" },
      { color: "bg-yellow-500", text: "Fair", textColor: "text-yellow-600" },
      { color: "bg-blue-500", text: "Good", textColor: "text-blue-600" },
      { color: "bg-green-500", text: "Strong", textColor: "text-green-600" },
    ]
    return strengthLevels[passwordStrength] || strengthLevels[0]
  }

  return (
    <div className="min-h-screen transparent flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">$</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Traxpense</h2>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white bg-opacity-80 py-8 px-6 shadow rounded-lg border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <FiAlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{errors.general}</span>
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.name && formSubmitted ? "border-red-300 bg-red-50" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter your full name"
                />
                {formData.name && !errors.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <FiCheck className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.name && formSubmitted && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email && formSubmitted ? "border-red-300 bg-red-50" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter your email address"
                />
                {formData.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <FiCheck className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.email && formSubmitted && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.password && formSubmitted ? "border-red-300 bg-red-50" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthInfo().textColor}`}>
                      {getPasswordStrengthInfo().text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthInfo().color}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {errors.password && formSubmitted && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.confirmPassword && formSubmitted ? "border-red-300 bg-red-50" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {formData.confirmPassword && !errors.confirmPassword && (
                  <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
                    <FiCheck className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.confirmPassword && formSubmitted && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-700">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
            {errors.agreeToTerms && formSubmitted && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading
                    ? "bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  "Sign up"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
