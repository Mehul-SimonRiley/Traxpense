"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { FiCreditCard, FiDollarSign, FiDownload, FiPieChart, FiPlus, FiTrendingUp, FiTrendingDown, FiCalendar } from "react-icons/fi"
import { formatCurrency, formatDate } from '../utils/format'
import { LineChart, BarChart, PieChart, createExpenseBreakdownData, createIncomeExpenseTrendData, createSingleTrendData, createBudgetVsActualData } from '../components/Charts'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from "framer-motion"
import dashboardService from '../services/dashboardService'
import Modal from '../components/Modal'
import AnimatedButton from '../components/AnimatedButton'

export default function DashboardTab({ onError }) {
  console.log('DashboardTab component rendered');
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("all") // Changed default from "month" to "all"
  const [showCustomPeriod, setShowCustomPeriod] = useState(false)
  const [customDateRange, setCustomDateRange] = useState({
    start_date: "",
    end_date: ""
  })
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
  })

  const fetchDashboardData = useCallback(async () => {
    console.log('fetchDashboardData called');
    console.log('Dependencies during fetchDashboardData call:', 'timeframe:', timeframe, 'customDateRange:', customDateRange, 'onError:', onError);
      setIsLoading(true)
      try {
      let data
      switch (timeframe) {
        case "today":
          data = await dashboardService.getDashboardData("today")
          break
        case "month":
          data = await dashboardService.getDashboardData("month")
          break
        case "custom":
          if (customDateRange.start_date && customDateRange.end_date) {
            data = await dashboardService.getDashboardData("custom", customDateRange)
          } else {
            data = await dashboardService.getDashboardData()
          }
          break
        default:
          data = await dashboardService.getDashboardData()
      }
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
        }));
      } else {
        console.warn("Fetched dashboard data is null or undefined.");
      }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      setDashboardData({
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
      });
      } finally {
        setIsLoading(false)
      }
  }, [timeframe, customDateRange, onError])

  // Use a ref to hold the latest fetchDashboardData function
  const fetchDashboardDataRef = useRef(fetchDashboardData);
  useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData; // Update the ref whenever fetchDashboardData changes
  }, [fetchDashboardData]);

  useEffect(() => {
    console.log('DashboardTab useEffect running');
    // Call the function only once when component mounts
    fetchDashboardDataRef.current();
  }, []) // Empty dependency array, as we only want to fetch on mount

  const handleTimeframeChange = (newTimeframe) => {
    if (newTimeframe !== "all") {
      alert("This feature is under development. Showing All Time data for now.");
      setTimeframe("all"); // Always revert to 'all'
    } else {
      setTimeframe(newTimeframe);
    }
    setShowCustomPeriod(false); // Close custom period if opened
  };

  const handleCustomPeriodSubmit = () => {
    if (customDateRange.start_date && customDateRange.end_date) {
      setShowCustomPeriod(false)
    }
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-64"
      >
        <LoadingSpinner text="Loading dashboard..." />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 transparent"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Expense Dashboard</h1>
        <div className="flex gap-2">
          <select
            className="form-select"
            value={timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today" title="Under development">Today</option>
            <option value="month" title="Under development">This Month</option>
            <option value="custom" title="Under development">Custom Period</option>
          </select>
        </div>
      </div>

      {/* Financial Overview Cards - Horizontal Layout */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="card transparent"
        >
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <h3 className="text-2xl font-bold">{formatCurrency(dashboardData.summary.currentBalance)}</h3>
                <p className="text-xs text-gray-500">{dashboardData.summary.balanceTrend}</p>
              </div>
              <FiDollarSign className="text-2xl text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="card transparent"
        >
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <h3 className="text-2xl font-bold text-green-500">{formatCurrency(dashboardData.summary.totalIncome)}</h3>
                <p className="text-xs text-gray-500">{dashboardData.summary.incomeTrend}</p>
          </div>
              <FiTrendingUp className="text-2xl text-green-500" />
        </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="card transparent"
        >
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <h3 className="text-2xl font-bold text-red-500">{formatCurrency(dashboardData.summary.totalExpenses)}</h3>
                <p className="text-xs text-gray-500">{dashboardData.summary.expenseTrend}</p>
              </div>
              <FiTrendingDown className="text-2xl text-red-500" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="card transparent"
        >
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Savings</p>
                <h3 className="text-2xl font-bold text-blue-500">{formatCurrency(dashboardData.summary.savings)}</h3>
                <p className="text-xs text-gray-500">Rate: {dashboardData.summary.savingsRate}</p>
              </div>
              <FiCreditCard className="text-2xl text-blue-500" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-6 flex flex-col"
        >
          {/* Expense Distribution Chart */}
          <div className="card flex-grow transparent">
            <div className="card-content flex justify-center items-center">
              <div className="w-64 h-64 md:w-80 md:h-80">
              <PieChart
                data={createExpenseBreakdownData(dashboardData.categoryBreakdown)}
                  title="Expense Distribution by Category"
                />
          </div>
        </div>
          </div>

          {/* Income vs Expenses Chart */}
          <div className="card flex-grow transparent">
            <div className="card-content flex justify-center items-center">
              {Array.isArray(dashboardData.expenseTrends) && Array.isArray(dashboardData.incomeTrends) && (
                <div className="w-full max-w-sm">
              <BarChart
                    data={createIncomeExpenseTrendData(dashboardData.expenseTrends ?? [], dashboardData.incomeTrends ?? [])}
                    title="Income vs Expenses Over Time"
              />
              </div>
            )}
          </div>
        </div>
        </motion.div>

        {/* Right Column - Recent Transactions and Expense Trends */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Recent Transactions */}
          <div className="card transparent">
          <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
          </div>
          <div className="card-content">
              {dashboardData.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                {dashboardData.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.category}</p>
                    </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                          {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
            )}
          </div>
          </div>

          {/* Expense Trends - Based on the screenshot, this is on the right */}
        <div className="card transparent">
          <div className="card-header">
              <h3 className="card-title">Expense Trends</h3>
          </div>
            <div className="card-content">
               {dashboardData.expenseTrends.length > 0 ? (
              <LineChart
                   data={createSingleTrendData(dashboardData.expenseTrends, 'Expenses', 'rgb(255, 99, 132)')}
                   title="Expense Trends"
              />
            ) : (
                 <p className="text-gray-500 text-center py-4">No trend data available</p>
            )}
          </div>
        </div>
        </motion.div>
      </div>

      {/* Custom Period Modal */}
      <Modal
        isOpen={showCustomPeriod}
        onClose={() => setShowCustomPeriod(false)}
        title="Select Custom Period"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={customDateRange.start_date}
              onChange={(e) => setCustomDateRange(prev => ({
                ...prev,
                start_date: e.target.value
              }))}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={customDateRange.end_date}
              onChange={(e) => setCustomDateRange(prev => ({
                ...prev,
                end_date: e.target.value
              }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <AnimatedButton
              onClick={() => setShowCustomPeriod(false)}
              variant="secondary"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              onClick={handleCustomPeriodSubmit}
              disabled={!customDateRange.start_date || !customDateRange.end_date}
            >
              Show Data
            </AnimatedButton>
      </div>
    </div>
      </Modal>
    </motion.div>
  )
}
