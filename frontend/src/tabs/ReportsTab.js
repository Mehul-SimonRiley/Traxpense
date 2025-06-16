"use client"

import React, { useState, useEffect } from "react"
import { FiBarChart2, FiDownload, FiPieChart, FiTrendingUp } from "react-icons/fi"
import { 
  getExpenseVsIncome, 
  getCategoryBreakdown, 
  getSpendingTrends 
} from '../services/reportsService';
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
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from "framer-motion"

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

export default function ReportsTab() {
  const [reportType, setReportType] = useState("expense-income")
  const [timeRange, setTimeRange] = useState("month")
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        let response;
        if (reportType === "expense-income") {
          response = await getExpenseVsIncome(timeRange);
          setReportData(response || {
            totalIncome: 0,
            totalExpenses: 0,
            netSavings: 0,
            savingsRate: 0,
            monthlyComparison: []
          });
        } else if (reportType === "category-breakdown") {
          response = await getCategoryBreakdown(timeRange);
          setReportData(response || {
            topCategories: []
          });
        } else if (reportType === "spending-trends") {
          response = await getSpendingTrends(timeRange);
          setReportData(response || {
            monthlySpending: [],
            categoryTrends: []
          });
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err.message || "Failed to load report data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [reportType, timeRange]);

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center items-center h-64"
      >
        <LoadingSpinner text="Loading report data..." />
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="reports-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="p-4 transparent"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-between items-center mb-6"
        >
        <h1 className="page-title">Financial Reports</h1>
          <motion.select
            whileHover={{ scale: 1.02 }}
            className="select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </motion.select>
        </motion.div>

        {/* Report Type Selection */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card mb-6 transparent"
        >
        <div className="card-content">
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn ${reportType === 'expense-income' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('expense-income')}
            >
                <FiBarChart2 className="mr-2" />
              Expense vs Income
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn ${reportType === 'category-breakdown' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('category-breakdown')}
            >
                <FiPieChart className="mr-2" />
              Category Breakdown
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn ${reportType === 'spending-trends' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('spending-trends')}
            >
                <FiTrendingUp className="mr-2" />
              Spending Trends
              </motion.button>
            </div>
          </div>
        </motion.div>

      {/* Report Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={reportType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="card transparent"
          >
            <div className="card-content">
              {reportType === 'expense-income' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
            <div className="card transparent">
              <div className="card-header">
                <h2 className="card-title">Expense vs Income</h2>
              </div>
              <div className="card-content">
                <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bar
                    data={{
                      labels: (reportData.monthlyComparison || []).map(m => m.name),
                      datasets: [
                        {
                          label: 'Income',
                          data: (reportData.monthlyComparison || []).map(m => m.income),
                          backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        },
                        {
                          label: 'Expenses',
                          data: (reportData.monthlyComparison || []).map(m => m.expenses),
                          backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        },
                      ],
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                    height={300}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted">Total Income</div>
                        <div className="text-xl font-bold text-income">₹{reportData.totalIncome}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted">Total Expenses</div>
                        <div className="text-xl font-bold text-expense">₹{reportData.totalExpenses}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted">Net Savings</div>
                        <div className="text-xl font-bold">₹{reportData.netSavings}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted">Savings Rate</div>
                        <div className="text-xl font-bold">{reportData.savingsRate}%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Monthly Comparison</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Income</th>
                          <th>Expenses</th>
                          <th>Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData.monthlyComparison || []).map((month) => (
                          <tr key={month.name}>
                            <td>{month.name}</td>
                            <td className="text-income">₹{month.income}</td>
                            <td className="text-expense">₹{month.expenses}</td>
                            <td>₹{month.savings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
                </motion.div>
          )}

              {reportType === 'category-breakdown' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
            <div className="card transparent">
              <div className="card-header">
                <h2 className="card-title">Category Breakdown</h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pie
                        data={{
                          labels: (reportData.topCategories || []).map(c => c.name),
                          datasets: [{
                            data: (reportData.topCategories || []).map(c => c.amount),
                            backgroundColor: [
                              '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15'
                            ],
                          }],
                        }}
                        options={{ responsive: true, plugins: { legend: { position: 'right' } } }}
                        height={300}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Spending Categories</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData.topCategories || []).map((category) => (
                          <tr key={category.name}>
                            <td>{category.name}</td>
                            <td className="text-expense">₹{category.amount}</td>
                            <td>{category.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
                </motion.div>
          )}

              {reportType === 'spending-trends' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
            <div className="card transparent">
              <div className="card-header">
                <h2 className="card-title">Spending Trends</h2>
              </div>
              <div className="card-content">
                <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Line
                    data={{
                      labels: (reportData.monthlySpending || []).map(m => m.name),
                      datasets: [{
                        label: 'Spending',
                        data: (reportData.monthlySpending || []).map(m => m.amount),
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        tension: 0.3,
                      }],
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                    height={300}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Monthly Spending</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Amount</th>
                          <th>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData.monthlySpending || []).map((month) => (
                          <tr key={month.name}>
                            <td>{month.name}</td>
                            <td className="text-expense">₹{month.amount}</td>
                            <td>{month.change}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Category Trends</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>This Month</th>
                          <th>Last Month</th>
                          <th>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData.categoryTrends || []).map((trend) => (
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
                </motion.div>
      )}
    </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
