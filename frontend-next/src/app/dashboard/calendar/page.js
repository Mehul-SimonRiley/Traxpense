"use client";

import React, { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getTransactions } from '@/services/calendarService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import styles from '@/styles/Calendar.module.css';

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true);
            try {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed

                // Helper to get days in month for the end date calculation
                const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();

                const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
                const endDate = `${year}-${month.toString().padStart(2, "0")}-${daysInMonth.toString().padStart(2, "0")}`;

                const data = await getTransactions(startDate, endDate);
                setTransactions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching calendar transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [currentMonth]);

    // Helper function to get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper function to get first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    // Get transactions for a specific day
    const getTransactionsForDay = (day) => {
        if (!day) return [];

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        // Format must match backend date format
        const dateString = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

        // Note: If backend times are included, we might need more robust date comparison.
        // Assuming backend returns 'YYYY-MM-DD' for 'date' field or we check start of string.
        return transactions.filter((transaction) => {
            if (!transaction.date) return false;
            return transaction.date.startsWith(dateString);
        });
    };

    // Format month name
    const formatMonth = () => {
        return currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
    };

    // Navigate to previous month
    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    // Navigate to next month
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Calendar days
    const calendarDays = generateCalendarDays();
    const today = new Date();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Financial Calendar</h1>
            </div>

            {/* Calendar Navigation */}
            <div className={styles.card}>
                <div className={styles.cardContent}>
                    <div className={styles.navigation}>
                        <button className={styles.navBtn} onClick={previousMonth}>
                            <FiChevronLeft /> Previous
                        </button>
                        <motion.h2
                            key={formatMonth()}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.currentMonth}
                        >
                            {formatMonth()}
                        </motion.h2>
                        <button className={styles.navBtn} onClick={nextMonth}>
                            Next <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className={styles.card}>
                <div className={styles.cardContent}>
                    {isLoading && transactions.length === 0 ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner text="Loading events..." />
                        </div>
                    ) : (
                        <>
                            <div className={styles.weekHeader}>
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div key={day} className={styles.dayLabel}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.daysGrid}>
                                <AnimatePresence>
                                    {calendarDays.map((day, index) => {
                                        const isToday = day &&
                                            today.getDate() === day &&
                                            today.getMonth() === currentMonth.getMonth() &&
                                            today.getFullYear() === currentMonth.getFullYear();

                                        const dayTransactions = getTransactionsForDay(day);
                                        const hasTransactions = dayTransactions.length > 0;

                                        return (
                                            <motion.div
                                                key={`${currentMonth.toISOString()}-${index}`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.2, delay: index * 0.01 }}
                                                className={`
                                    ${day ? styles.dayCell : styles.emptyCell} 
                                    ${isToday ? styles.today : ''} 
                                    ${hasTransactions ? styles.hasTransactions : ''}
                                `}
                                            >
                                                {day && (
                                                    <>
                                                        <div className={styles.dayNumber}>{day}</div>
                                                        <div className={styles.transactionList}>
                                                            {dayTransactions.map((transaction) => (
                                                                <div
                                                                    key={transaction.id}
                                                                    className={`${styles.transactionItem} ${transaction.type === 'expense' ? styles.expenseItem : styles.incomeItem}`}
                                                                    title={`${transaction.description}: ${transaction.amount}`}
                                                                >
                                                                    <span className={styles.transactionAmount}>
                                                                        {transaction.type === 'expense' ? "-" : "+"}
                                                                        {Math.abs(transaction.amount)}
                                                                    </span>
                                                                    {' '}{transaction.description || "Tx"}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
