"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiCreditCard, FiDollarSign, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { formatCurrency, formatDate } from '@/utils/format';
import { LineChart, BarChart, PieChart, createExpenseBreakdownData, createIncomeExpenseTrendData, createSingleTrendData } from '@/components/Charts';
import SparklineCard from '@/components/SparklineCard';
import ModernBarChart from '@/components/charts/ModernBarChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from "framer-motion";
import dashboardService from '@/services/dashboardService';
import Modal from '@/components/Modal';
import AnimatedButton from '@/components/AnimatedButton';
import styles from '@/styles/Dashboard.module.css';
import { toast } from 'react-toastify';

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("all");
    const [showCustomPeriod, setShowCustomPeriod] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({
        start_date: "",
        end_date: ""
    });
    const [dashboardData, setDashboardData] = useState({
        summary: {
            totalExpenses: 0,
            totalIncome: 0,
            currentBalance: 0,
            savings: 0,
            expenseTrend: "",
            incomeTrend: "",
            balanceTrend: "",
            savingsRate: "0%",
        },
        budgetStatus: [],
        recentTransactions: [],
        categoryBreakdown: [],
        expenseTrends: [],
        incomeTrends: [],
        insights: [], /* New state for dynamic insights */
    });

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            let data;
            switch (timeframe) {
                case "today":
                    data = await dashboardService.getDashboardData("today");
                    break;
                case "month":
                    data = await dashboardService.getDashboardData("month");
                    break;
                case "custom":
                    if (customDateRange.start_date && customDateRange.end_date) {
                        data = await dashboardService.getDashboardData("custom", customDateRange);
                    } else {
                        data = await dashboardService.getDashboardData();
                    }
                    break;
                default:
                    data = await dashboardService.getDashboardData();
            }

            const insightsData = await dashboardService.getInsights();

            if (data) {
                setDashboardData(prevData => ({
                    ...prevData,
                    ...data,
                    expenseTrends: Array.isArray(data.expenseTrends) ? data.expenseTrends : prevData.expenseTrends || [],
                    incomeTrends: Array.isArray(data.incomeTrends) ? data.incomeTrends : prevData.incomeTrends || [],
                    budgetStatus: Array.isArray(data.budgetStatus) ? data.budgetStatus : prevData.budgetStatus || [],
                    recentTransactions: Array.isArray(data.recentTransactions) ? data.recentTransactions : prevData.recentTransactions || [],
                    categoryBreakdown: Array.isArray(data.categoryBreakdown) ? data.categoryBreakdown : prevData.categoryBreakdown || [],
                    summary: data.summary ? { ...prevData.summary, ...data.summary } : prevData.summary,
                    insights: insightsData || [],
                }));
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    }, [timeframe, customDateRange]);

    const fetchDashboardDataRef = useRef(fetchDashboardData);
    useEffect(() => {
        fetchDashboardDataRef.current = fetchDashboardData;
    }, [fetchDashboardData]);

    useEffect(() => {
        fetchDashboardDataRef.current();

        const handleTransactionAdded = () => {
            fetchDashboardDataRef.current();
        };
        window.addEventListener('transactionAdded', handleTransactionAdded);
        return () => {
            window.removeEventListener('transactionAdded', handleTransactionAdded);
        };
    }, []);

    const handleTimeframeChange = (newTimeframe) => {
        if (newTimeframe !== "all") {
            toast.info("Timeframe filtering is under development. Showing All Time data.");
            setTimeframe("all");
        } else {
            setTimeframe(newTimeframe);
        }
        setShowCustomPeriod(false);
    };

    const handleCustomPeriodSubmit = () => {
        if (customDateRange.start_date && customDateRange.end_date) {
            setShowCustomPeriod(false);
            // Trigger fetch via useEffect dependency
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner text="Loading dashboard..." />
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
                <h1 className={styles.pageTitle}>Expense Dashboard</h1>
                <div>
                    <select
                        className={styles.select}
                        value={timeframe}
                        onChange={(e) => handleTimeframeChange(e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Period</option>
                    </select>
                </div>
            </div>

            {/* Bento Grid Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={styles.bentoGrid}
            >
                {/* Top Row: Mini Stats */}
                <div className={`${styles.bentoItem} p-0 overflow-hidden`}>
                    <SparklineCard
                        title="Total Balance"
                        value={formatCurrency(dashboardData.summary.currentBalance)}
                        trend={dashboardData.summary.balanceTrend || '0%'}
                        isPositive={!String(dashboardData.summary.balanceTrend).includes('-')}
                        dataPoints={dashboardData.incomeTrends?.map(d => d.amount) || [10, 15, 12, 20, 18, 25, 22]}
                        colorHex="#fbbf24"
                    />
                </div>

                <div className={`${styles.bentoItem} p-0 overflow-hidden`}>
                    <SparklineCard
                        title="Total Income"
                        value={formatCurrency(dashboardData.summary.totalIncome)}
                        trend={dashboardData.summary.incomeTrend || '0%'}
                        isPositive={!String(dashboardData.summary.incomeTrend).includes('-')}
                        dataPoints={dashboardData.incomeTrends?.map(d => d.amount) || [5, 12, 8, 15, 22, 18, 30]}
                        colorHex="#60a5fa"
                    />
                </div>

                <div className={`${styles.bentoItem} p-0 overflow-hidden`}>
                    <SparklineCard
                        title="Total Expenses"
                        value={formatCurrency(dashboardData.summary.totalExpenses)}
                        trend={dashboardData.summary.expenseTrend || '0%'}
                        isPositive={String(dashboardData.summary.expenseTrend).includes('-')} // Less expense is positive
                        dataPoints={dashboardData.expenseTrends?.map(d => d.amount) || [20, 15, 25, 18, 22, 10, 5]}
                        colorHex="#34d399"
                    />
                </div>

                <div className={`${styles.bentoItem} p-0 overflow-hidden`}>
                    <SparklineCard
                        title="Total Savings"
                        value={formatCurrency(dashboardData.summary.savings)}
                        trend={dashboardData.summary.savingsRate || '0%'}
                        isPositive={true}
                        dataPoints={[0, 5, 10, 15, 20, 25, 30]} // Cumulative fake data if needed
                        colorHex="#a78bfa"
                    />
                </div>

                {/* Main Bar Chart (Spans 2 cols, 2 rows) */}
                <div className={`${styles.bentoItem} ${styles.colSpan2} ${styles.rowSpan2}`}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Income vs Expenses</h3>
                    </div>
                    <div className={styles.chartContainer}>
                        <BarChart
                            data={createIncomeExpenseTrendData(dashboardData.expenseTrends, dashboardData.incomeTrends)}
                            title=""
                        />
                    </div>
                </div>

                {/* Expense Distribution Modern Bar (Spans 2 cols, 2 rows) */}
                <div className={`${styles.bentoItem} ${styles.colSpan2} ${styles.rowSpan2}`}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Expense Distribution</h3>
                    </div>
                    <div className={styles.chartContainer}>
                        <ModernBarChart
                            data={{
                                labels: dashboardData.categoryBreakdown?.map(item => item.category) || [],
                                datasets: [{
                                    label: 'Expenses',
                                    data: dashboardData.categoryBreakdown?.map(item => item.amount) || [],
                                    backgroundColor: dashboardData.categoryBreakdown?.map(item => item.color) || ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
                                    borderRadius: 8,
                                }]
                            }}
                            title=""
                        />
                    </div>
                </div>

            </motion.div>

            {/* Custom Period Modal */}
            <Modal
                isOpen={showCustomPeriod}
                onClose={() => setShowCustomPeriod(false)}
                title="Select Custom Period"
            >
                <div className="flex flex-col gap-4">
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Start Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={customDateRange.start_date}
                            onChange={(e) => setCustomDateRange(prev => ({
                                ...prev,
                                start_date: e.target.value
                            }))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>End Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={customDateRange.end_date}
                            onChange={(e) => setCustomDateRange(prev => ({
                                ...prev,
                                end_date: e.target.value
                            }))}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <AnimatedButton
                            onClick={() => setShowCustomPeriod(false)}
                            variant="outline"
                        >
                            Cancel
                        </AnimatedButton>
                        <AnimatedButton
                            onClick={handleCustomPeriodSubmit}
                            disabled={!customDateRange.start_date || !customDateRange.end_date}
                            variant="primary"
                        >
                            Show Data
                        </AnimatedButton>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}
