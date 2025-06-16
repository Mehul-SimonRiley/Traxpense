"use client"

import React, { useState, useEffect } from "react"
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi"
import { getTransactions } from '../services/calendarService'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from "framer-motion"

export default function CalendarTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed
        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${month.toString().padStart(2, "0")}-${getDaysInMonth(year, currentMonth.getMonth()).toString().padStart(2, "0")}`;
        const data = await getTransactions(startDate, endDate);
        setTransactions(data);
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
    return new Date(year, month + 1, 0).getDate()
  }

  // Helper function to get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  // Get transactions for a specific day
  const getTransactionsForDay = (day) => {
    if (!day) return []

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1 // JavaScript months are 0-indexed
    const dateString = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

    return transactions.filter((transaction) => transaction.date === dateString)
  }

  // Format month name
  const formatMonth = () => {
    return currentMonth.toLocaleString("default", { month: "long", year: "numeric" })
  }

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Calendar days
  const calendarDays = generateCalendarDays()

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-64"
      >
        <LoadingSpinner text="Loading calendar events..." />
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
        <h1 className="page-title">Financial Calendar</h1>
      </div>

      {/* Calendar Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card mb-6 transparent"
      >
        <div className="card-content">
          <div className="flex justify-between items-center">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-outline" 
              onClick={previousMonth}
            >
              <FiChevronLeft />
              Previous
            </motion.button>
            <motion.h2 
              key={formatMonth()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold"
            >
              {formatMonth()}
            </motion.h2>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-outline" 
              onClick={nextMonth}
            >
              Next
              <FiChevronRight />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card transparent"
      >
        <div className="card-content">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <motion.div 
                key={day} 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center font-medium p-2"
              >
                {day}
              </motion.div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            <AnimatePresence>
              {calendarDays.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className={`border rounded-md p-2 min-h-[100px] ${day ? "bg-white bg-opacity-80" : "bg-gray-100 bg-opacity-80"}`}
                >
                  {day && (
                    <>
                      <div className="text-right font-medium mb-2">{day}</div>
                      <div className="space-y-1">
                        <AnimatePresence>
                          {getTransactionsForDay(day).map((transaction, idx) => (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.2, delay: idx * 0.05 }}
                              className={`text-xs p-1 rounded ${
                                transaction.type === "expense" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              <div className="truncate">{transaction.description}</div>
                              <div className="font-medium">
                                {transaction.type === "expense" ? "-" : "+"}₹{Math.abs(transaction.amount).toFixed(2)}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
