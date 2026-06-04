"use client";

import React, { useState, useEffect } from 'react';
import { FiEdit2, FiPlus, FiX } from "react-icons/fi";
import { budgetsAPI, categoriesAPI } from "@/services/transactionsService";
import { formatCurrency } from '@/utils/format';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import AnimatedButton from '@/components/AnimatedButton';
import Modal from '@/components/Modal';
import styles from '@/styles/Budgets.module.css';
import { toast } from 'react-toastify';

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
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCustomPeriod, setShowCustomPeriod] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [timeframe, customDateRange]);

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
            } else if (timeframe === 'custom') {
                data = data.filter(budget =>
                    new Date(budget.start_date) <= new Date(customDateRange.end_date) &&
                    new Date(budget.end_date) >= new Date(customDateRange.start_date)
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
        if (!newBudget.category_id || !newBudget.amount || !newBudget.start_date || !newBudget.end_date) {
            toast.error('Please fill all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                category_id: parseInt(newBudget.category_id),
                amount: parseFloat(newBudget.amount),
                start_date: newBudget.start_date,
                end_date: newBudget.end_date
            };

            await budgetsAPI.create(payload);
            setNewBudget({
                category_id: "",
                amount: "",
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
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

        setIsSubmitting(true);
        try {
            await budgetsAPI.update(editingBudget.id, editingBudget);
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
        if (value === 'custom') {
            setShowCustomPeriod(true);
        } else {
            setShowCustomPeriod(false);
            // Reset custom date range when switching away from custom
            setCustomDateRange({
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            });
        }
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
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <select
                            className={styles.select}
                            value={timeframe}
                            onChange={(e) => handleTimeframeChange(e.target.value)}
                        >
                            <option value="all">All Time History</option>
                            <option value="month">This Month</option>
                            <option value="next-month">Next Month</option>
                            <option value="custom">Custom Period</option>
                        </select>

                        {timeframe === 'custom' && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-2 items-center bg-black/20 p-1.5 rounded-lg border border-white/10"
                            >
                                <input
                                    type="date"
                                    className="bg-transparent text-sm text-gray-300 px-2 py-1 outline-none w-32"
                                    value={customDateRange.start_date}
                                    onChange={(e) => {
                                        setCustomDateRange({ ...customDateRange, start_date: e.target.value });
                                        // Auto-fetch could be added here, or wait for apply logic
                                    }}
                                />
                                <span className="text-gray-500 text-sm">-</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-sm text-gray-300 px-2 py-1 outline-none w-32"
                                    value={customDateRange.end_date}
                                    onChange={(e) => {
                                        setCustomDateRange({ ...customDateRange, end_date: e.target.value });
                                    }}
                                />
                            </motion.div>
                        )}
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
                    <div className={styles.overallProgress}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${Math.min((totalSpent / totalBudget) * 100 || 0, 100)}%`,
                                backgroundColor: totalSpent > totalBudget ? '#ef4444' : '#3b82f6'
                            }}
                        ></div>
                    </div>
                    <div className={styles.progressLabels}>
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
                                        >
                                            <div className={styles.budgetItemHeader}>
                                                <h3 className={styles.budgetName}>{categoryName}</h3>
                                                <div className={styles.budgetActions}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => setEditingBudget(budget)}
                                                    >
                                                        <FiEdit2 size={14} /> Edit
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handleDeleteBudget(budget.id)}
                                                    >
                                                        <FiX size={14} /> Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={styles.budgetStats}>
                                                <span>Spent: {formatCurrency(spent)}</span>
                                                <span>Budget: {formatCurrency(amount)}</span>
                                            </div>

                                            <div className={styles.overallProgress}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{
                                                        width: `${Math.min(percent, 100)}%`,
                                                        backgroundColor: percent > 100 ? '#ef4444' : '#3b82f6'
                                                    }}
                                                ></div>
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
