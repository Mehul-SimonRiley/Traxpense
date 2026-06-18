"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from '@/styles/DashboardLayout.module.css';
import txStyles from '@/styles/Transactions.module.css';
import { FiPlus } from 'react-icons/fi';
import Modal from '@/components/Modal';
import AnimatedButton from '@/components/AnimatedButton';
import { transactionsAPI, categoriesAPI } from '@/services/transactionsService';
import { toast } from 'react-toastify';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category_id: "",
        type: "expense",
        notes: "",
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesAPI.getAll();
                setCategories(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching categories in layout:", err);
            }
        };
        fetchCategories();
    }, []);

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
        try {
            const transactionData = {
                description,
                amount,
                date,
                category_id: parseInt(categoryId),
                type: newTransaction.type,
                notes: newTransaction.notes?.trim() || ""
            };

            await transactionsAPI.create(transactionData);

            // Dispatch global event for pages to refetch
            window.dispatchEvent(new CustomEvent('transactionAdded'));

            setNewTransaction({
                description: "",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                category_id: "",
                type: "expense",
                notes: "",
            });
            setIsQuickAddOpen(false);
            toast.success("Transaction added successfully");
        } catch (err) {
            console.error("Error adding transaction in layout:", err);
            toast.error("Failed to add transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <Sidebar isOpen={sidebarOpen} />
            <div className={styles.mainContent}>
                <Header
                    isOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className={styles.scrollArea}>
                    {children}
                </main>
                <button 
                    className={styles.fab} 
                    onClick={() => setIsQuickAddOpen(true)} 
                    title="Quick Add Transaction"
                >
                    <FiPlus />
                </button>
            </div>

            {/* Quick Add Modal */}
            <Modal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                title="Quick Add Transaction"
            >
                <div className={txStyles.formGrid}>
                    <div className={txStyles.fullWidth}>
                        <label className={txStyles.filterLabel}>Description</label>
                        <input
                            type="text"
                            className={txStyles.input}
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            placeholder="E.g. Lunch at Cafe"
                        />
                    </div>
                    <div>
                        <label className={txStyles.filterLabel}>Amount</label>
                        <input
                            type="number"
                            className={txStyles.input}
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className={txStyles.filterLabel}>Date</label>
                        <input
                            type="date"
                            className={txStyles.input}
                            value={newTransaction.date}
                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={txStyles.filterLabel}>Category</label>
                        <select
                            className={txStyles.select}
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
                        <label className={txStyles.filterLabel}>Type</label>
                        <select
                            className={txStyles.select}
                            value={newTransaction.type}
                            onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <div className={txStyles.fullWidth}>
                        <label className={txStyles.filterLabel}>Notes</label>
                        <textarea
                            className={txStyles.input}
                            rows="2"
                            value={newTransaction.notes}
                            onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                            placeholder="Optional notes..."
                        />
                    </div>
                </div>
                <div className={txStyles.modalFooter}>
                    <AnimatedButton
                        variant="outline"
                        onClick={() => setIsQuickAddOpen(false)}
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
        </div>
    );
}
