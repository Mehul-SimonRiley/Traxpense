"use client"

import React, { useState, useEffect } from "react"
import { FiChevronDown, FiEdit2, FiFilter, FiPlus, FiTrash2, FiX } from "react-icons/fi"
import { transactionsAPI, categoriesAPI } from "../services/api"
import { formatCurrency, formatDate } from "../utils/format"
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from "framer-motion"
import AnimatedButton from '../components/AnimatedButton'
import Modal from '../components/Modal'

export default function TransactionsTab({ onError }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
  })
  const [filters, setFilters] = useState({
    dateRange: "month",
    category: "all",
    type: "all",
    minAmount: "",
    maxAmount: "",
  })
  const [sortBy, setSortBy] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category_id: "",
    type: "expense",
    notes: "",
  })
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [optimisticTransactions, setOptimisticTransactions] = useState([])
  const [loadingStates, setLoadingStates] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch categories first for the dropdown
      const categoriesData = await categoriesAPI.getAll()
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])

      // Then fetch transactions
      await fetchTransactions()
    } catch (err) {
      console.error("Error fetching initial data:", err)
      setError("Failed to load transactions data")
      if (onError) onError("Failed to load transactions data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading) {
      fetchTransactions()
    }
  }, [filters, sortBy, sortDirection, currentPage])

  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Map frontend filters to backend filters
      const backendFilters = {}
      if (filters.category !== "all") {
        backendFilters.category = filters.category
      }
      if (filters.type !== "all") {
        backendFilters.type = filters.type
      }
      if (filters.dateRange !== "all") {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        backendFilters.start_date = startOfMonth.toISOString().split('T')[0]
        backendFilters.end_date = today.toISOString().split('T')[0]
      }

      const data = await transactionsAPI.getAll(backendFilters)
      console.log("Fetched transactions:", data) // Debug log
      
      if (Array.isArray(data)) {
        setTransactions(data)
        
        // Calculate summary
        const summary = data.reduce((acc, transaction) => {
          if (transaction.type === 'income') {
            acc.totalIncome += Number(transaction.amount)
          } else {
            acc.totalExpenses += Number(transaction.amount)
          }
          return acc
        }, { totalIncome: 0, totalExpenses: 0, netFlow: 0 })
        
        summary.netFlow = summary.totalIncome - summary.totalExpenses
        setSummary(summary)
      } else {
        console.error("Invalid transactions data format:", data)
        setError("Invalid data format received from server")
      }
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError("Failed to load transactions")
      if (onError) onError("Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    setIsSubmitting(true)
    const tempId = Date.now() // Temporary ID for optimistic update
    
    // Create optimistic transaction
    const optimisticTransaction = {
      id: tempId,
      ...newTransaction,
      amount: parseFloat(newTransaction.amount),
      category_id: parseInt(newTransaction.category_id),
      isOptimistic: true
    }
    
    // Update UI immediately with optimistic data
    setOptimisticTransactions(prev => [...prev, optimisticTransaction])
    setTransactions(prev => [...prev, optimisticTransaction])
    
    try {
      // Transform the data to match the backend's expected format
      const transactionData = {
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date,
        category_id: parseInt(newTransaction.category_id),
        type: newTransaction.type,
      }

      const response = await transactionsAPI.create(transactionData)
      
      // Replace optimistic transaction with real one
      setTransactions(prev => 
        prev.map(t => t.id === tempId ? response : t)
      )
      setOptimisticTransactions(prev => 
        prev.filter(t => t.id !== tempId)
      )
      
      setNewTransaction({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category_id: "",
        type: "expense",
        notes: "",
      })
      setShowAddForm(false)
    } catch (err) {
      console.error("Error adding transaction:", err)
      // Remove optimistic transaction on error
      setTransactions(prev => 
        prev.filter(t => t.id !== tempId)
      )
      setOptimisticTransactions(prev => 
        prev.filter(t => t.id !== tempId)
      )
      alert("Failed to add transaction. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTransaction = async () => {
    if (!editingTransaction) return
    
    setIsSubmitting(true)
    const transactionId = editingTransaction.id
    
    // Store original transaction for rollback
    const originalTransaction = transactions.find(t => t.id === transactionId)
    
    // Update UI immediately with optimistic data
    setTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...editingTransaction, isOptimistic: true } : t)
    )
    
    try {
      const response = await transactionsAPI.update(transactionId, editingTransaction)
      
      // Replace optimistic update with real one
      setTransactions(prev => 
        prev.map(t => t.id === transactionId ? response : t)
      )
      setEditingTransaction(null)
    } catch (err) {
      console.error("Error updating transaction:", err)
      // Rollback to original transaction on error
      setTransactions(prev => 
        prev.map(t => t.id === transactionId ? originalTransaction : t)
      )
      alert("Failed to update transaction. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setLoadingStates(prev => ({ ...prev, [id]: true }))
      
      // Store transaction for rollback
      const deletedTransaction = transactions.find(t => t.id === id)
      
      // Update UI immediately
      setTransactions(prev => prev.filter(t => t.id !== id))
      
      try {
        await transactionsAPI.delete(id)
      } catch (err) {
        console.error("Error deleting transaction:", err)
        // Rollback on error
        setTransactions(prev => [...prev, deletedTransaction])
        alert("Failed to delete transaction. Please try again.")
      } finally {
        setLoadingStates(prev => ({ ...prev, [id]: false }))
      }
    }
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-64"
      >
        <LoadingSpinner text="Loading transactions..." />
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
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
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="flex space-x-2">
          <AnimatedButton
            variant="outline"
            onClick={() => setFilterOpen(!filterOpen)}
            icon={FiFilter}
          >
            Filters
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setShowAddForm(true)}
            icon={FiPlus}
          >
            Add Transaction
          </AnimatedButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: "Total Income", value: summary.totalIncome, color: "text-green-600" },
          { title: "Total Expenses", value: summary.totalExpenses, color: "text-red-600" },
          { title: "Net Flow", value: summary.netFlow, color: summary.netFlow >= 0 ? "text-green-600" : "text-red-600" }
        ].map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white p-4 rounded-lg shadow transparent"
          >
            <h3 className="text-gray-500">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters and Add Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-between items-center mb-6"
      >
        <div className="flex items-center space-x-2">
          {filterOpen && (
            <div className="absolute bg-white p-4 rounded-lg shadow-lg z-10 mt-2">
              <div className="flex justify-end mb-2">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close Filters"
                >
                  <FiX />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    className="form-select w-full"
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  >
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                    <option value="today">Today</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="form-select w-full"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="form-select w-full"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      className="form-input w-1/2"
                      placeholder="Min"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    />
                    <input
                      type="number"
                      className="form-input w-1/2"
                      placeholder="Max"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Transaction Form */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Transaction"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={newTransaction.description}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, description: e.target.value })
              }
              placeholder="Transaction description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              className="form-input w-full"
              value={newTransaction.amount}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, amount: e.target.value })
              }
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={newTransaction.date}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="form-select w-full"
              value={newTransaction.category_id}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, category_id: e.target.value })
              }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="form-select w-full"
              value={newTransaction.type}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, type: e.target.value })
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="form-textarea w-full"
              value={newTransaction.notes}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, notes: e.target.value })
              }
              placeholder="Additional notes"
              rows="3"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
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
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </AnimatedButton>
        </div>
      </Modal>

      {/* Edit Transaction Form */}
      <Modal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Edit Transaction"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={editingTransaction?.description || ''}
              onChange={(e) =>
                setEditingTransaction({ ...editingTransaction, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              className="form-input w-full"
              value={editingTransaction?.amount || ''}
              onChange={(e) =>
                setEditingTransaction({ ...editingTransaction, amount: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={editingTransaction?.date || ''}
              onChange={(e) =>
                setEditingTransaction({ ...editingTransaction, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="form-select w-full"
              value={editingTransaction?.category_id || ''}
              onChange={(e) =>
                setEditingTransaction({ ...editingTransaction, category_id: e.target.value })
              }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="form-select w-full"
              value={editingTransaction?.type || 'expense'}
              onChange={(e) =>
                setEditingTransaction({ ...editingTransaction, type: e.target.value })
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="form-textarea w-full"
              value={editingTransaction?.notes || ''}
              onChange={(e) =>
                setEditingTransaction({ ...editingTransaction, notes: e.target.value })
              }
              rows="3"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
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

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow transparent"
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Transactions</h2>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500"
            >
              No transactions found. Add your first transaction to get started.
            </motion.p>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`border rounded-lg p-4 ${transaction.isOptimistic ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">
                            {categories.find(c => c.id === transaction.category_id)?.icon || "💰"}
                          </span>
                          <div>
                            <h3 className="font-bold">{transaction.description}</h3>
                            <p className="text-gray-500 text-sm">
                              {formatDate(transaction.date)} • 
                              {categories.find(c => c.id === transaction.category_id)?.name || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                        {transaction.notes && (
                          <p className="text-gray-500 mt-2 text-sm">{transaction.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className={`text-lg font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setEditingTransaction(transaction)}
                            disabled={loadingStates[transaction.id]}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn btn-outline btn-sm text-red-500"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            disabled={loadingStates[transaction.id]}
                          >
                            {loadingStates[transaction.id] ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <FiTrash2 />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

