"use client";

import React, { useState, useEffect } from 'react';
import { FiEdit2, FiPlus, FiX } from "react-icons/fi";
import { budgetsAPI, categoriesAPI } from "@/services/transactionsService";
import { formatCurrency } from '@/utils/format';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import AnimatedButton from '@/components/AnimatedButton';
import Modal from '@/components/Modal';
import CustomSelect from '@/components/CustomSelect';
import styles from '@/styles/Budgets.module.css';
import { toast } from 'react-toastify';

const formatLocalDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export default function BudgetsPage() {
    const [timeframe, setTimeframe] = useState("month");
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [newBudget, setNewBudget] = useState({
        category_id: "",
        amount: "",
        start_date: formatLocalDate(new Date()),
        end_date: formatLocalDate(new Date())
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCustomPeriod, setShowCustomPeriod] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({
        start_date: formatLocalDate(new Date()),
        end_date: formatLocalDate(new Date())
    });

    useEffect(() => {
        fetchData();
    }, [timeframe, customDateRange]);

    useEffect(() => {
        const handleTransactionAdded = () => {
            fetchBudgets();
        };
        window.addEventListener('transactionAdded', handleTransactionAdded);
        return () => {
            window.removeEventListener('transactionAdded', handleTransactionAdded);
        };
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([fetchBudgets(), fetchCategories()]);
        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Failed to load budgets data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBudgets = async () => {
        try {
            let data = await budgetsAPI.getAll();

            // Filter budgets based on timeframe
            const now = new Date();
            if (timeframe === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                data = data.filter(budget =>
                    new Date(budget.start_date) <= endOfMonth &&
                    new Date(budget.end_date) >= startOfMonth
                );
            } else if (timeframe === 'next-month') {
                const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                data = data.filter(budget =>
                    new Date(budget.start_date) <= endOfNextMonth &&
                    new Date(budget.end_date) >= startOfNextMonth
                );
            } else if (timeframe === 'previous-month') {
                const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                data = data.filter(budget =>
                    new Date(budget.start_date) <= endOfPrevMonth &&
                    new Date(budget.end_date) >= startOfPrevMonth
                );
            } else if (timeframe === 'all') {
                // No filtering needed for 'all'
            }

            setBudgets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching budgets:', err);
            toast.error('Failed to load budgets');
            setBudgets([]);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesAPI.getAll();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Optional: toast error for categories
        }
    };

    const handleAddBudget = async () => {
        const categoryId = newBudget.category_id;
        const amountStr = newBudget.amount?.toString().trim();
        const startDate = newBudget.start_date;
        const endDate = newBudget.end_date;

        if (!categoryId) {
            toast.error('Please select a category');
            return;
        }
        if (!amountStr) {
            toast.error('Amount is required');
            return;
        }
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Budget amount must be a positive number greater than 0');
            return;
        }
        if (!startDate) {
            toast.error('Start date is required');
            return;
        }
        if (!endDate) {
            toast.error('End date is required');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error('End date must be on or after start date');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                category_id: parseInt(categoryId),
                amount: amount,
                start_date: startDate,
                end_date: endDate
            };

            await budgetsAPI.create(payload);
            setNewBudget({
                category_id: "",
                amount: "",
                start_date: formatLocalDate(new Date()),
                end_date: formatLocalDate(new Date())
            });
            setShowAddForm(false);
            fetchBudgets();
            toast.success('Budget added successfully');
        } catch (err) {
            console.error("Error adding budget:", err);
            toast.error("Failed to add budget");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditBudget = async () => {
        if (!editingBudget) return;

        const categoryId = editingBudget.category_id;
        const amountStr = editingBudget.amount?.toString().trim();
        const startDate = editingBudget.start_date;
        const endDate = editingBudget.end_date;

        if (!categoryId) {
            toast.error('Please select a category');
            return;
        }
        if (!amountStr) {
            toast.error('Amount is required');
            return;
        }
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Budget amount must be a positive number greater than 0');
            return;
        }
        if (!startDate) {
            toast.error('Start date is required');
            return;
        }
        if (!endDate) {
            toast.error('End date is required');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error('End date must be on or after start date');
            return;
        }

        setIsSubmitting(true);
        try {
            await budgetsAPI.update(editingBudget.id, {
                category_id: parseInt(categoryId),
                amount: amount,
                start_date: startDate,
                end_date: endDate
            });
            setEditingBudget(null);
            fetchBudgets();
            toast.success('Budget updated successfully');
        } catch (err) {
            console.error("Error updating budget:", err);
            toast.error("Failed to update budget");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteBudget = async (id) => {
        if (window.confirm("Are you sure you want to delete this budget?")) {
            try {
                await budgetsAPI.delete(id);
                setBudgets(prev => prev.filter(b => b.id !== id));
                toast.success("Budget deleted");
            } catch (err) {
                console.error("Error deleting budget:", err);
                toast.error("Failed to delete budget");
            }
        }
    };

    const handleTimeframeChange = (value) => {
        setTimeframe(value);
    };

    if (isLoading && budgets.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner text="Loading budgets..." />
            </div>
        );
    }

    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + Number(budget.spent || budget.current_spending || 0), 0);
    const remaining = totalBudget - totalSpent;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Budget Planner</h1>
                <div className={styles.headerActions}>
                    <div className="flex flex-col sm:flex-row gap-3 items-center" style={{ width: '180px' }}>
                        <CustomSelect
                            value={timeframe}
                            onChange={handleTimeframeChange}
                            options={[
                                { value: "month", label: "This Month" },
                                { value: "previous-month", label: "Previous Month" },
                                { value: "next-month", label: "Next Month" },
                                { value: "all", label: "All Time History" }
                            ]}
                        />
                    </div>
                    <AnimatedButton
                        onClick={() => setShowAddForm(true)}
                        icon={FiPlus}
                    >
                        Set Budget
                    </AnimatedButton>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>Budget Summary</div>
                <div className={styles.cardBody}>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}>Total Budget</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalBudget)}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}>Total Spent</div>
                            <div className={`${styles.summaryValue} text-red-600`}>{formatCurrency(totalSpent)}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}>Remaining</div>
                            <div className={`${styles.summaryValue} ${remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(remaining)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>Overall Progress</div>
                <div className={styles.cardBody}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', height: '10px', width: '100%', overflow: 'hidden', position: 'relative', marginTop: '0.5rem' }}>
                        <div
                            style={{
                                width: `${Math.min((totalSpent / totalBudget) * 100 || 0, 100)}%`,
                                height: '100%',
                                background: totalSpent > totalBudget 
                                    ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)' 
                                    : 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                                borderRadius: '10px',
                                transition: 'width 0.8s ease-in-out',
                                boxShadow: totalSpent > totalBudget ? '0 0 10px rgba(239, 68, 68, 0.5)' : '0 0 10px rgba(99, 102, 241, 0.5)'
                            }}
                        ></div>
                    </div>
                    <div className={styles.progressLabels} style={{ marginTop: '0.5rem' }}>
                        <span>{formatCurrency(0)}</span>
                        <span>{formatCurrency(totalBudget)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>Budget Categories</div>
                <div className={styles.cardBody}>
                    {budgets.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No budgets set for this period.</p>
                    ) : (
                        <div className={styles.budgetList}>
                            <AnimatePresence>
                                {budgets.map((budget, index) => {
                                    const spent = parseFloat(budget.spent || budget.current_spending || 0);
                                    const amount = parseFloat(budget.amount);
                                    const percent = amount > 0 ? (spent / amount) * 100 : 0;
                                    const categoryName = categories.find(c => c.id === budget.category_id)?.name || budget.category_name || "Unknown";

                                    return (
                                        <motion.div
                                            key={budget.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className={styles.budgetItem}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', marginBottom: '1rem', gap: '1.5rem' }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <h3 className={styles.budgetName} style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', margin: 0 }}>{categoryName}</h3>
                                                </div>
                                                <div className={styles.budgetStats} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem', margin: '0.4rem 0' }}>
                                                    <div>Spent: <strong style={{ color: 'white' }}>{formatCurrency(spent)}</strong></div>
                                                    <div>Limit: <strong style={{ color: 'white' }}>{formatCurrency(amount)}</strong></div>
                                                    <div style={{ marginTop: '4px', fontSize: '0.8rem', fontWeight: '500', color: percent > 100 ? '#ef4444' : '#10b981' }}>
                                                        {percent > 100 
                                                            ? `Over budget by ${formatCurrency(spent - amount)}` 
                                                            : `${formatCurrency(amount - spent)} remaining`}
                                                    </div>
                                                </div>
                                                <div className={styles.budgetActions} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => setEditingBudget(budget)}
                                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                    >
                                                        <FiEdit2 size={12} /> Edit
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handleDeleteBudget(budget.id)}
                                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                    >
                                                        <FiX size={12} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
                                                        <circle
                                                            cx="35"
                                                            cy="35"
                                                            r="28"
                                                            fill="transparent"
                                                            stroke="rgba(255, 255, 255, 0.05)"
                                                            strokeWidth="5"
                                                        />
                                                        <circle
                                                            cx="35"
                                                            cy="35"
                                                            r="28"
                                                            fill="transparent"
                                                            stroke={percent > 100 ? '#ef4444' : 'url(#progressGrad-' + budget.id + ')'}
                                                            strokeWidth="5"
                                                            strokeDasharray={2 * Math.PI * 28}
                                                            strokeDashoffset={2 * Math.PI * 28 - (Math.min(percent, 100) / 100) * 2 * Math.PI * 28}
                                                            strokeLinecap="round"
                                                            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                                                        />
                                                        <defs>
                                                            <linearGradient id={'progressGrad-' + budget.id} x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#6366f1" />
                                                                <stop offset="100%" stopColor="#a855f7" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                    <span style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>
                                                        {Math.round(percent)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Budget Modal */}
            <Modal
                isOpen={showAddForm}
                onClose={() => setShowAddForm(false)}
                title="Add New Budget"
            >
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Category</label>
                        <select
                            className={styles.input} // reusing styles.input for select similar to dashboard
                            value={newBudget.category_id}
                            onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Amount</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="0.00"
                            value={newBudget.amount}
                            onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Start Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={newBudget.start_date}
                            onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>End Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={newBudget.end_date}
                            onChange={(e) => setNewBudget({ ...newBudget, end_date: e.target.value })}
                        />
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <AnimatedButton
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AnimatedButton>
                    <AnimatedButton
                        onClick={handleAddBudget}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Budget'}
                    </AnimatedButton>
                </div>
            </Modal>

            {/* Edit Budget Modal */}
            <Modal
                isOpen={!!editingBudget}
                onClose={() => setEditingBudget(null)}
                title="Edit Budget"
            >
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Category</label>
                        <select
                            className={styles.input}
                            value={editingBudget?.category_id || ''}
                            onChange={(e) => setEditingBudget({ ...editingBudget, category_id: e.target.value })}
                        >
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Amount</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={editingBudget?.amount || ''}
                            onChange={(e) => setEditingBudget({ ...editingBudget, amount: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Start Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={editingBudget?.start_date || ''}
                            onChange={(e) => setEditingBudget({ ...editingBudget, start_date: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>End Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={editingBudget?.end_date || ''}
                            onChange={(e) => setEditingBudget({ ...editingBudget, end_date: e.target.value })}
                        />
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <AnimatedButton
                        variant="outline"
                        onClick={() => setEditingBudget(null)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AnimatedButton>
                    <AnimatedButton
                        onClick={handleEditBudget}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </AnimatedButton>
                </div>
            </Modal>

        </motion.div>
    );
}
