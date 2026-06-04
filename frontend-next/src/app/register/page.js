"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const { register, login } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const name = formData.name.trim();
        const email = formData.email.trim();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        if (!name || name.length < 2) {
            setError('Full Name must be at least 2 characters');
            toast.error('Full Name must be at least 2 characters');
            return;
        }

        if (name.length > 100) {
            setError('Full Name must be under 100 characters');
            toast.error('Full Name must be under 100 characters');
            return;
        }

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

        if (password.length > 72) {
            setError('Password must be under 72 characters');
            toast.error('Password must be under 72 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register({
                name,
                email,
                password
            });
            toast.success('Registration successful! Logging you in...');

            // Auto login after register
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Registration failed');
            toast.error(err.message || 'Registration failed');
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
                <h1 className={styles.title}>Create Account</h1>
                <p className={styles.subtitle}>Start tracking your expenses today</p>

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
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                    </div>

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
                            placeholder="Create a password"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className={styles.linkText}>
                    Already have an account?
                    <Link href="/login" className={styles.link}>
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
