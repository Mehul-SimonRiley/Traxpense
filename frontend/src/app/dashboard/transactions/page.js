"use client";

import React, { useState, useEffect } from "react";
import { FiFilter, FiPlus, FiTrash2, FiX, FiEdit2, FiSearch, FiDollarSign } from "react-icons/fi";
import { transactionsAPI, categoriesAPI } from "@/services/transactionsService";
import { formatCurrency, formatDate } from "@/utils/format";
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import AnimatedButton from '@/components/AnimatedButton';
import Modal from '@/components/Modal';
import styles from '@/styles/Transactions.module.css';
import { toast } from 'react-toastify';

export default function TransactionsPage() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netFlow: 0,
    });
    const [filters, setFilters] = useState({
        dateRange: "all",
        category: "all",
        type: "all",
        minAmount: "",
        maxAmount: "",
    });

    const [customDateRange, setCustomDateRange] = useState({
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [newTransaction, setNewTransaction] = useState({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category_id: "",
        type: "expense",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingStates, setLoadingStates] = useState({});

    useEffect(() => {
        fetchData();

        const handleTransactionAdded = () => {
            fetchTransactions();
        };
        window.addEventListener('transactionAdded', handleTransactionAdded);
        return () => {
            window.removeEventListener('transactionAdded', handleTransactionAdded);
        };
    }, []);

    useEffect(() => {
        if (!isLoading) {
            fetchTransactions();
        }
    }, [filters]);

    useEffect(() => {
        if (!isLoading && filters.dateRange === 'custom') {
            fetchTransactions();
        }
    }, [customDateRange]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const categoriesData = await categoriesAPI.getAll();
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            await fetchTransactions();
        } catch (err) {
            console.error("Error fetching initial data:", err);
            toast.error("Failed to load initial data");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const backendFilters = {};
            if (filters.category !== "all") backendFilters.category = filters.category;
            if (filters.type !== "all") backendFilters.type = filters.type;
            if (filters.dateRange !== "all") {
                const today = new Date();
                if (filters.dateRange === "month") {
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    backendFilters.start_date = startOfMonth.toISOString().split('T')[0];
                    backendFilters.end_date = today.toISOString().split('T')[0];
                } else if (filters.dateRange === "week") {
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                    backendFilters.start_date = startOfWeek.toISOString().split('T')[0];
                    backendFilters.end_date = today.toISOString().split('T')[0];
                } else if (filters.dateRange === "today") {
                    backendFilters.start_date = today.toISOString().split('T')[0];
                    backendFilters.end_date = today.toISOString().split('T')[0];
                } else if (filters.dateRange === "custom") {
                    backendFilters.start_date = customDateRange.start_date;
                    backendFilters.end_date = customDateRange.end_date;
                }
            }

            const data = await transactionsAPI.getAll(backendFilters);

            if (Array.isArray(data)) {
                setTransactions(data);

                const summaryData = data.reduce((acc, transaction) => {
                    if (transaction.type === 'income') {
                        acc.totalIncome += Number(transaction.amount);
                    } else {
                        acc.totalExpenses += Number(transaction.amount);
                    }
                    return acc;
                }, { totalIncome: 0, totalExpenses: 0, netFlow: 0 });

                summaryData.netFlow = summaryData.totalIncome - summaryData.totalExpenses;
                setSummary(summaryData);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            toast.error("Failed to load transactions");
        }
    };

    const handleAddTransaction = async () => {
        const description = newTransaction.description?.trim();
        const amountStr = newTransaction.amount?.toString().trim();
        const categoryId = newTransaction.category_id;
        const date = newTransaction.date;

        if (!description) {
            toast.error("Description is required");
            return;
        }
        if (description.length > 200) {
            toast.error("Description must be 200 characters or less");
            return;
        }
        if (!amountStr) {
            toast.error("Amount is required");
            return;
        }
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Amount must be a positive number greater than 0");
            return;
        }
        if (!categoryId) {
            toast.error("Please select a category");
            return;
        }
        if (!date) {
            toast.error("Please select a valid date");
            return;
        }

        setIsSubmitting(true);
        const tempId = Date.now();

        const optimisticTransaction = {
            id: tempId,
            ...newTransaction,
            description,
            amount,
            category_id: parseInt(categoryId),
            isOptimistic: true
        };

        setTransactions(prev => [optimisticTransaction, ...prev]);

        try {
            const transactionData = {
                description,
                amount,
                date,
                category_id: parseInt(categoryId),
                type: newTransaction.type,
                notes: newTransaction.notes?.trim() || ""
            };

            const response = await transactionsAPI.create(transactionData);

            setTransactions(prev =>
                prev.map(t => t.id === tempId ? response : t)
            );

            setNewTransaction({
                description: "",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                category_id: "",
                type: "expense",
                notes: "",
            });
            setShowAddForm(false);
            toast.success("Transaction added successfully");
        } catch (err) {
            console.error("Error adding transaction:", err);
            setTransactions(prev => prev.filter(t => t.id !== tempId));
            toast.error("Failed to add transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTransaction = async () => {
        if (!editingTransaction) return;

        const description = editingTransaction.description?.trim();
        const amountStr = editingTransaction.amount?.toString().trim();
        const categoryId = editingTransaction.category_id;
        const date = editingTransaction.date;

        if (!description) {
            toast.error("Description is required");
            return;
        }
        if (description.length > 200) {
            toast.error("Description must be 200 characters or less");
            return;
        }
        if (!amountStr) {
            toast.error("Amount is required");
            return;
        }
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Amount must be a positive number greater than 0");
            return;
        }
        if (!categoryId) {
            toast.error("Please select a category");
            return;
        }
        if (!date) {
            toast.error("Please select a valid date");
            return;
        }

        setIsSubmitting(true);
        const transactionId = editingTransaction.id;
        const originalTransaction = transactions.find(t => t.id === transactionId);

        const updatedTransaction = {
            ...editingTransaction,
            description,
            amount,
            category_id: parseInt(categoryId),
            notes: editingTransaction.notes?.trim() || ""
        };

        setTransactions(prev =>
            prev.map(t => t.id === transactionId ? { ...updatedTransaction, isOptimistic: true } : t)
        );

        try {
            const response = await transactionsAPI.update(transactionId, {
                description,
                amount,
                date,
                category_id: parseInt(categoryId),
                type: editingTransaction.type,
                notes: editingTransaction.notes?.trim() || ""
            });
            setTransactions(prev =>
                prev.map(t => t.id === transactionId ? response : t)
            );
            setEditingTransaction(null);
            toast.success("Transaction updated successfully");
        } catch (err) {
            console.error("Error updating transaction:", err);
            setTransactions(prev =>
                prev.map(t => t.id === transactionId ? originalTransaction : t)
            );
            toast.error("Failed to update transaction");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteTransaction = async (id) => {
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            setLoadingStates(prev => ({ ...prev, [id]: true }));
            const deletedTransaction = transactions.find(t => t.id === id);
            setTransactions(prev => prev.filter(t => t.id !== id));

            try {
                await transactionsAPI.delete(id);
                toast.success("Transaction deleted");
            } catch (err) {
                console.error("Error deleting transaction:", err);
                setTransactions(prev => [...prev, deletedTransaction]);
                toast.error("Failed to delete transaction");
            } finally {
                setLoadingStates(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    if (isLoading && transactions.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner text="Loading transactions..." />
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
                <h1 className={styles.pageTitle}>Transactions</h1>
                <div className={styles.headerActions}>
                    <div className={styles.filterContainer}>
                        <AnimatedButton
                            variant="outline"
                            onClick={() => setFilterOpen(!filterOpen)}
                            icon={FiFilter}
                        >
                            Filters
                        </AnimatedButton>
                        {filterOpen && (
                            <div className={styles.filtersDropdown}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-700">Filters</h3>
                                    <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <FiX />
                                    </button>
                                </div>
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Date Range</label>
                                    <select
                                        className={styles.select}
                                        value={filters.dateRange}
                                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="month">This Month</option>
                                        <option value="week">This Week</option>
                                        <option value="today">Today</option>
                                        <option value="custom">Custom Period</option>
                                    </select>
                                </div>
                                {filters.dateRange === 'custom' && (
                                    <div className="flex gap-2 items-center bg-gray-100 dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-white/10 w-full mb-4">
                                        <input
                                            type="date"
                                            className="bg-transparent text-sm w-full outline-none text-gray-700 dark:text-gray-300"
                                            value={customDateRange.start_date}
                                            onChange={(e) => setCustomDateRange({ ...customDateRange, start_date: e.target.value })}
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input
                                            type="date"
                                            className="bg-transparent text-sm w-full outline-none text-gray-700 dark:text-gray-300"
                                            value={customDateRange.end_date}
                                            onChange={(e) => setCustomDateRange({ ...customDateRange, end_date: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Category</label>
                                    <select
                                        className={styles.select}
                                        value={filters.category}
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Type</label>
                                    <select
                                        className={styles.select}
                                        value={filters.type}
                                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <AnimatedButton
                        onClick={() => setShowAddForm(true)}
                        icon={FiPlus}
                    >
                        Add Transaction
                    </AnimatedButton>
                </div>
            </div>

            <div className={styles.summaryGrid}>
                <motion.div whileHover={{ scale: 1.02 }} className={styles.card}>
                    <h3 className={styles.cardTitle}>Total Income</h3>
                    <p className={`${styles.cardValue} text-green-600`}>{formatCurrency(summary.totalIncome)}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className={styles.card}>
                    <h3 className={styles.cardTitle}>Total Expenses</h3>
                    <p className={`${styles.cardValue} text-red-600`}>{formatCurrency(summary.totalExpenses)}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className={styles.card}>
                    <h3 className={styles.cardTitle}>Net Flow</h3>
                    <p className={`${styles.cardValue} ${summary.netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(summary.netFlow)}
                    </p>
                </motion.div>
            </div>

            <div className={styles.transactionList}>
                <div className={styles.listHeader}>
                    Recent Transactions
                </div>
                <div className={styles.listBody}>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No transactions found matching your filters.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {transactions.map((transaction) => {
                                const category = categories.find(c => c.id === transaction.category_id);
                                return (
                                    <motion.div
                                        key={transaction.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`${styles.transactionItem} ${transaction.isOptimistic ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-start">
                                            <div className={styles.transactionIcon}>
                                                {category?.icon || "💵"}
                                            </div>
                                            <div className={styles.transactionDetails}>
                                                <h3>{transaction.description}</h3>
                                                <div className={styles.transactionMeta}>
                                                    <span>{formatDate(transaction.date)}</span>
                                                    <span>•</span>
                                                    <span>{category?.name || "Uncategorized"}</span>
                                                </div>
                                                {transaction.notes && (
                                                    <p className={styles.transactionNotes}>{transaction.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className={`${styles.transactionAmount} ${transaction.type === 'income' ? styles.income : styles.expense}`}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </p>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => setEditingTransaction(transaction)}
                                                    disabled={loadingStates[transaction.id]}
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                    disabled={loadingStates[transaction.id]}
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Add Transaction Modal */}
            <Modal
                isOpen={showAddForm}
                onClose={() => setShowAddForm(false)}
                title="Add New Transaction"
            >
                <div className={styles.formGrid}>
                    <div className={styles.fullWidth}>
                        <label className={styles.filterLabel}>Description</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            placeholder="E.g. Grocery Shopping"
                        />
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Amount</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={newTransaction.date}
                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Category</label>
                        <select
                            className={styles.select}
                            value={newTransaction.category_id}
                            onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Type</label>
                        <select
                            className={styles.select}
                            value={newTransaction.type}
                            onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <div className={styles.fullWidth}>
                        <label className={styles.filterLabel}>Notes</label>
                        <textarea
                            className={styles.input}
                            rows="3"
                            value={newTransaction.notes}
                            onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                            placeholder="Optional notes..."
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
                        onClick={handleAddTransaction}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Transaction'}
                    </AnimatedButton>
                </div>
            </Modal>

            {/* Edit Transaction Modal */}
            <Modal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                title="Edit Transaction"
            >
                <div className={styles.formGrid}>
                    <div className={styles.fullWidth}>
                        <label className={styles.filterLabel}>Description</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={editingTransaction?.description || ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Amount</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={editingTransaction?.amount || ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={editingTransaction?.date || ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Category</label>
                        <select
                            className={styles.select}
                            value={editingTransaction?.category_id || ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, category_id: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={styles.filterLabel}>Type</label>
                        <select
                            className={styles.select}
                            value={editingTransaction?.type || 'expense'}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value })}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <div className={styles.fullWidth}>
                        <label className={styles.filterLabel}>Notes</label>
                        <textarea
                            className={styles.input}
                            rows="3"
                            value={editingTransaction?.notes || ''}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                        />
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <AnimatedButton
                        variant="outline"
                        onClick={() => setEditingTransaction(null)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AnimatedButton>
                    <AnimatedButton
                        onClick={handleEditTransaction}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </AnimatedButton>
                </div>
            </Modal>
        </motion.div>
    );
}
