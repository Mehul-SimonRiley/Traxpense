"use client";

import React, { useState, useEffect } from "react";
import { FiBarChart2, FiPieChart, FiTrendingUp } from "react-icons/fi";
import { getExpenseVsIncome, getCategoryBreakdown, getSpendingTrends } from '@/services/reportsService';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import styles from '@/styles/Reports.module.css';
import { toast } from 'react-toastify';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function ReportsPage() {
    const [reportType, setReportType] = useState("expense-income");
    const [timeRange, setTimeRange] = useState("all");
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            try {
                let response;
                if (reportType === "expense-income") {
                    response = await getExpenseVsIncome(timeRange);
                } else if (reportType === "category-breakdown") {
                    response = await getCategoryBreakdown(timeRange);
                } else if (reportType === "spending-trends") {
                    response = await getSpendingTrends(timeRange);
                }

                if (!response) {
                    // Set empty defaults if response is null to prevent crashes
                    if (reportType === "expense-income") {
                        setReportData({ totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0, monthlyComparison: [] });
                    } else if (reportType === "category-breakdown") {
                        setReportData({ topCategories: [] });
                    } else {
                        setReportData({ monthlySpending: [], categoryTrends: [] });
                    }
                } else {
                    setReportData(response);
                }

            } catch (err) {
                console.error("Error fetching report data:", err);
                toast.error("Failed to load report data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
    }, [reportType, timeRange]);

    if (isLoading && !reportData) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner text="Loading report data..." />
            </div>
        );
    }

    // Helper to safely access data properties
    const safeData = reportData || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Financial Reports</h1>
                <select
                    className={styles.select}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last 12 Months</option>
                </select>
            </div>

            <div className={styles.controls}>
                <button
                    className={`${styles.controlBtn} ${reportType === 'expense-income' ? styles.active : ''}`}
                    onClick={() => setReportType('expense-income')}
                >
                    <FiBarChart2 /> Expense vs Income
                </button>
                <button
                    className={`${styles.controlBtn} ${reportType === 'category-breakdown' ? styles.active : ''}`}
                    onClick={() => setReportType('category-breakdown')}
                >
                    <FiPieChart /> Category Breakdown
                </button>
                <button
                    className={`${styles.controlBtn} ${reportType === 'spending-trends' ? styles.active : ''}`}
                    onClick={() => setReportType('spending-trends')}
                >
                    <FiTrendingUp /> Spending Trends
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={reportType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={styles.card}
                >
                    {/* Expense vs Income Report */}
                    {reportType === 'expense-income' && (
                        <>
                            <div className={styles.cardHeader}>Expense vs Income</div>
                            <div className={styles.cardContent}>
                                <div className={styles.chartContainer}>
                                    <Bar
                                        data={{
                                            labels: (safeData.monthlyComparison || []).map(m => m.name),
                                            datasets: [
                                                {
                                                    label: 'Income',
                                                    data: (safeData.monthlyComparison || []).map(m => m.income),
                                                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                                },
                                                {
                                                    label: 'Expenses',
                                                    data: (safeData.monthlyComparison || []).map(m => m.expenses),
                                                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                                },
                                            ],
                                        }}
                                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
                                    />
                                </div>

                                <div className={styles.grid}>
                                    <div>
                                        <h3 className={styles.summaryTitle}>Summary</h3>
                                        <div className={styles.statsGrid}>
                                            <div className={styles.statItem}>
                                                <div className={styles.statLabel}>Total Income</div>
                                                <div className={`${styles.statValue} ${styles.textIncome}`}>₹{safeData.totalIncome}</div>
                                            </div>
                                            <div className={styles.statItem}>
                                                <div className={styles.statLabel}>Total Expenses</div>
                                                <div className={`${styles.statValue} ${styles.textExpense}`}>₹{safeData.totalExpenses}</div>
                                            </div>
                                            <div className={styles.statItem}>
                                                <div className={styles.statLabel}>Net Savings</div>
                                                <div className={styles.statValue}>₹{safeData.netSavings}</div>
                                            </div>
                                            <div className={styles.statItem}>
                                                <div className={styles.statLabel}>Savings Rate</div>
                                                <div className={styles.statValue}>{safeData.savingsRate}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className={styles.summaryTitle}>Monthly Comparison</h3>
                                        <div className={styles.tableContainer}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Month</th>
                                                        <th>Income</th>
                                                        <th>Expenses</th>
                                                        <th>Savings</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(safeData.monthlyComparison || []).map((month) => (
                                                        <tr key={month.name}>
                                                            <td>{month.name}</td>
                                                            <td className={styles.textIncome}>₹{month.income}</td>
                                                            <td className={styles.textExpense}>₹{month.expenses}</td>
                                                            <td>₹{month.savings}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Category Breakdown Report */}
                    {reportType === 'category-breakdown' && (
                        <>
                            <div className={styles.cardHeader}>Category Breakdown</div>
                            <div className={styles.cardContent}>
                                <div className={styles.grid}>
                                    <div>
                                        <div className={styles.chartContainer}>
                                            <Pie
                                                data={{
                                                    labels: (safeData.topCategories || []).map(c => c.name),
                                                    datasets: [{
                                                        data: (safeData.topCategories || []).map(c => c.amount),
                                                        backgroundColor: [
                                                            '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15'
                                                        ],
                                                    }],
                                                }}
                                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={styles.summaryTitle}>Top Spending Categories</h3>
                                        <div className={styles.tableContainer}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th>Amount</th>
                                                        <th>% of Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(safeData.topCategories || []).map((category) => (
                                                        <tr key={category.name}>
                                                            <td>{category.name}</td>
                                                            <td className={styles.textExpense}>₹{category.amount}</td>
                                                            <td>{category.percentage}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Spending Trends Report */}
                    {reportType === 'spending-trends' && (
                        <>
                            <div className={styles.cardHeader}>Spending Trends</div>
                            <div className={styles.cardContent}>
                                <div className={styles.chartContainer}>
                                    <Line
                                        data={{
                                            labels: (safeData.monthlySpending || []).map(m => m.name),
                                            datasets: [{
                                                label: 'Spending',
                                                data: (safeData.monthlySpending || []).map(m => m.amount),
                                                borderColor: 'rgba(239, 68, 68, 1)',
                                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                tension: 0.3,
                                            }],
                                        }}
                                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }}
                                    />
                                </div>

                                <div className={styles.grid}>
                                    <div>
                                        <h3 className={styles.summaryTitle}>Monthly Spending</h3>
                                        <div className={styles.tableContainer}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Month</th>
                                                        <th>Amount</th>
                                                        <th>Change</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(safeData.monthlySpending || []).map((month) => (
                                                        <tr key={month.name}>
                                                            <td>{month.name}</td>
                                                            <td className={styles.textExpense}>₹{month.amount}</td>
                                                            <td>{month.change}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className={styles.summaryTitle}>Category Trends</h3>
                                        <div className={styles.tableContainer}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th>This Month</th>
                                                        <th>Last Month</th>
                                                        <th>Change</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(safeData.categoryTrends || []).map((trend) => (
                                                        <tr key={trend.category}>
                                                            <td>{trend.category}</td>
                                                            <td>₹{trend.thisMonth}</td>
                                                            <td>₹{trend.lastMonth}</td>
                                                            <td>{trend.change}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
