"use client";

import React, { useState, useEffect } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { categoriesAPI } from "@/services/transactionsService";
import { budgetsAPI } from "@/services/transactionsService"; // Using the export from transactionsService which groups apis
import { formatCurrency } from "@/utils/format";
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import AnimatedButton from '@/components/AnimatedButton';
import Modal from '@/components/Modal';
import styles from '@/styles/Categories.module.css';
import { toast } from 'react-toastify';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({
        name: "",
        color: "#3b82f6",
        icon: "📊",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([fetchCategories(), fetchBudgets()]);
        } catch (err) {
            console.error("Error fetching initial data:", err);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesAPI.getAll();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
            toast.error("Failed to load categories");
        }
    };

    const fetchBudgets = async () => {
        try {
            // We need budgets to show spending progress on category cards
            // Note: The original React code tried to fetch budgets but the backend might not return them in the same way
            // Ideally we should integrate budget info into the category object or fetch separately.
            // For now, let's try to fetch all budgets.
            // Assuming budgetsAPI is available and working.

            // In the original file it imported budgetsAPI from ../services/api
            // We need to make sure we have access to it.
            const response = await budgetsAPI.getAll();

            const now = new Date();
            const activeBudgets = Array.isArray(response) ? response.filter(budget =>
                new Date(budget.start_date) <= now &&
                new Date(budget.end_date) >= now
            ) : [];
            setBudgets(activeBudgets);
        } catch (err) {
            console.error('Error fetching budgets:', err);
            // Don't block the UI if budgets fail, just show categories without budget info
        }
    }

    const handleAddCategory = async () => {
        const name = newCategory.name?.trim();
        const color = newCategory.color?.trim();
        const icon = newCategory.icon?.trim();

        if (!name) {
            toast.error("Category name is required");
            return;
        }
        if (name.length > 50) {
            toast.error("Category name must be 50 characters or less");
            return;
        }
        if (!color || !/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
            toast.error("Please enter or select a valid hex color");
            return;
        }
        if (!icon) {
            toast.error("Category icon (emoji) is required");
            return;
        }
        if (icon.length > 10) {
            toast.error("Category icon must be 10 characters or less");
            return;
        }

        setIsSubmitting(true);
        try {
            await categoriesAPI.create({
                name,
                color,
                icon
            });
            setNewCategory({
                name: "",
                color: "#3b82f6",
                icon: "📊",
            });
            setShowAddForm(false);
            fetchCategories();
            toast.success("Category added successfully");
        } catch (err) {
            console.error("Error adding category:", err);
            toast.error("Failed to add category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditCategory = async () => {
        if (!editingCategory) return;

        const name = editingCategory.name?.trim();
        const color = editingCategory.color?.trim();
        const icon = editingCategory.icon?.trim();

        if (!name) {
            toast.error("Category name is required");
            return;
        }
        if (name.length > 50) {
            toast.error("Category name must be 50 characters or less");
            return;
        }
        if (!color || !/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
            toast.error("Please enter or select a valid hex color");
            return;
        }
        if (!icon) {
            toast.error("Category icon (emoji) is required");
            return;
        }
        if (icon.length > 10) {
            toast.error("Category icon must be 10 characters or less");
            return;
        }

        setIsSubmitting(true);
        try {
            await categoriesAPI.update(editingCategory.id, {
                name,
                color,
                icon
            });
            setEditingCategory(null);
            fetchCategories();
            toast.success("Category updated successfully");
        } catch (err) {
            console.error("Error updating category:", err);
            toast.error("Failed to update category");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteCategory = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await categoriesAPI.delete(id);
                setCategories(prev => prev.filter(c => c.id !== id));
                toast.success("Category deleted");
            } catch (err) {
                console.error("Error deleting category:", err);
                toast.error("Failed to delete category");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner text="Loading categories..." />
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
                <h1 className={styles.pageTitle}>Categories</h1>
                <AnimatedButton
                    onClick={() => setShowAddForm(true)}
                    icon={FiPlus}
                >
                    Add Category
                </AnimatedButton>
            </div>

            <div className={styles.categoriesContainer}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Category List</h2>
                </div>

                {categories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No categories found. Add your first category to get started.</p>
                ) : (
                    <div className={styles.grid}>
                        <AnimatePresence>
                            {categories.map((category, index) => {
                                // Find active budget for this category
                                const budget = budgets.find(b => String(b.category_id) === String(category.id));
                                const spent = budget ? parseFloat(budget.spent || 0) : 0;
                                const amount = budget ? parseFloat(budget.amount || 0) : 0;
                                const percentage = amount > 0 ? (spent / amount) * 100 : 0;

                                return (
                                    <motion.div
                                        key={category.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className={styles.categoryCard}
                                        style={{ borderLeftColor: category.color || '#3b82f6' }}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div className={styles.categoryInfo}>
                                                <span className={styles.icon}>{category.icon || "📊"}</span>
                                                <h3 className={styles.categoryName}>{category.name}</h3>
                                            </div>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => setEditingCategory(category)}
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {budget ? (
                                            <div className={styles.budgetInfo}>
                                                <div className={styles.budgetStats}>
                                                    <span>Spent: {formatCurrency(spent)}</span>
                                                    <span>Budget: {formatCurrency(amount)}</span>
                                                </div>
                                                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', height: '8px', width: '100%', overflow: 'hidden', position: 'relative', marginTop: '0.75rem' }}>
                                                    <div
                                                        style={{
                                                            width: `${Math.min(percentage, 100)}%`,
                                                            height: '100%',
                                                            background: percentage > 100 
                                                                ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)' 
                                                                : `linear-gradient(90deg, ${category.color || '#6366f1'} 0%, #a855f7 100%)`,
                                                            borderRadius: '10px',
                                                            transition: 'width 0.8s ease-in-out',
                                                            boxShadow: percentage > 100 
                                                                ? '0 0 8px rgba(239, 68, 68, 0.4)' 
                                                                : `0 0 8px ${category.color || '#6366f1'}66`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={styles.noBudget}>No active budget</p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Add Category Modal */}
            <Modal
                isOpen={showAddForm}
                onClose={() => setShowAddForm(false)}
                title="Add New Category"
            >
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="Category name"
                        />
                    </div>
                    {/* Removed Budget input to separate concerns */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Color</label>
                        <input
                            type="color"
                            className={`${styles.input} ${styles.colorInput}`}
                            value={newCategory.color}
                            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Icon (Emoji)</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={newCategory.icon}
                            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                            placeholder="📊"
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
                        onClick={handleAddCategory}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save Category"}
                    </AnimatedButton>
                </div>
            </Modal>

            {/* Edit Category Modal */}
            <Modal
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                title="Edit Category"
            >
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={editingCategory?.name || ''}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        />
                    </div>
                    {/* Edit Budget usually happens in Budgets tab */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Color</label>
                        <input
                            type="color"
                            className={`${styles.input} ${styles.colorInput}`}
                            value={editingCategory?.color || '#3b82f6'}
                            onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Icon (Emoji)</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={editingCategory?.icon || '📊'}
                            onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                        />
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <AnimatedButton
                        variant="outline"
                        onClick={() => setEditingCategory(null)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </AnimatedButton>
                    <AnimatedButton
                        onClick={handleEditCategory}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </AnimatedButton>
                </div>
            </Modal>
        </motion.div>
    );
}
