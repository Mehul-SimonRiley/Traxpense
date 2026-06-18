"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const email = formData.email.trim();
        const password = formData.password;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            toast.error('Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters');
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await login(email, password);
            toast.success('Welcome back!');
        } catch (err) {
            setError(err.message || 'Failed to login');
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className={styles.container}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Sign in to continue your journey</p>

                {error && (
                    <motion.div
                        className={styles.error}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.linkText}>
                    Don't have an account?
                    <Link href="/register" className={styles.link}>
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
