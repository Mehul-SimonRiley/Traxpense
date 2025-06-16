"use client"

import React, { useState, useEffect } from 'react'
import { FiEdit2, FiPlus, FiX } from "react-icons/fi"
import { budgetsAPI, categoriesAPI } from "../services/api"
import { formatCurrency } from '../utils/format'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from "framer-motion"
import AnimatedButton from '../components/AnimatedButton'
import Modal from '../components/Modal'

export default function BudgetsTab() {
  const [timeframe, setTimeframe] = useState("month")
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [newBudget, setNewBudget] = useState({
    category_id: "",
    amount: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomPeriod, setShowCustomPeriod] = useState(false)
  const [customDateRange, setCustomDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [timeframe, customDateRange])

  const fetchBudgets = async () => {
    try {
      setIsLoading(true)
      let data = await budgetsAPI.getAll()
      
      // Filter budgets based on timeframe
      const now = new Date()
      if (timeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        data = data.filter(budget => 
          new Date(budget.start_date) >= startOfMonth && 
          new Date(budget.end_date) <= endOfMonth
        )
      } else if (timeframe === 'next-month') {
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        data = data.filter(budget => 
          new Date(budget.start_date) >= startOfNextMonth && 
          new Date(budget.end_date) <= endOfNextMonth
        )
      } else if (timeframe === 'custom') {
        data = data.filter(budget => 
          new Date(budget.start_date) >= new Date(customDateRange.start_date) && 
          new Date(budget.end_date) <= new Date(customDateRange.end_date)
        )
      }
      
      setBudgets(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Error fetching budgets:', err)
      setError('Failed to load budgets')
      setBudgets([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      setCategories([])
    }
  }

  const handleAddBudget = async () => {
    setIsSubmitting(true)
    try {
      // Validate fields
      if (!newBudget.category_id || !newBudget.amount || !newBudget.start_date || !newBudget.end_date) {
        alert('Please fill all fields before adding a budget.')
        return
      }

      // Prepare payload for backend
      const payload = {
        category_id: parseInt(newBudget.category_id),
        amount: parseFloat(newBudget.amount),
        start_date: newBudget.start_date,
        end_date: newBudget.end_date
      }

      await budgetsAPI.create(payload)
      setNewBudget({
        category_id: "",
        amount: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      })
      setShowAddForm(false)
      fetchBudgets()
    } catch (err) {
      console.error("Error adding budget:", err)
      alert("Failed to add budget. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditBudget = async () => {
    if (!editingBudget) return
    
    setIsSubmitting(true)
    try {
      await budgetsAPI.update(editingBudget.id, editingBudget)
      setEditingBudget(null)
      fetchBudgets()
    } catch (err) {
      console.error("Error updating budget:", err)
      alert("Failed to update budget. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBudget = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        await budgetsAPI.delete(id)
        fetchBudgets()
      } catch (err) {
        console.error("Error deleting budget:", err)
        alert("Failed to delete budget. Please try again.")
      }
    }
  }

  const handleTimeframeChange = (value) => {
    setTimeframe(value)
    if (value === 'custom') {
      setShowCustomPeriod(true)
    } else {
      setShowCustomPeriod(false)
      // Reset custom date range when switching away from custom
      setCustomDateRange({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      })
    }
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-64"
      >
        <LoadingSpinner text="Loading budgets..." />
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

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.current_spending, 0)
  const remaining = totalBudget - totalSpent

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 transparent"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Budget Planner</h1>
        <div className="flex gap-2">
          <select
            className="form-select"
            value={timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value)}
            style={{ width: "180px" }}
          >
            <option value="month">This Month</option>
            <option value="next-month">Next Month</option>
            <option value="custom">Custom Period</option>
          </select>
          <AnimatedButton
            onClick={() => setShowAddForm(true)}
            icon={FiPlus}
          >
            Set Budget
          </AnimatedButton>
        </div>
      </div>

      {/* Budget Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow mb-6 transparent"
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Budget Summary</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow transparent">
              <h3 className="text-gray-500">Total Budget</h3>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow transparent">
              <h3 className="text-gray-500">Total Spent</h3>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow transparent">
              <h3 className="text-gray-500">Remaining</h3>
              <p className="text-2xl font-bold">{formatCurrency(remaining)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow mb-6 transparent"
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Budget Progress</h2>
        </div>
        <div className="p-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${Math.min((totalSpent / totalBudget) * 100 || 0, 100)}%`,
                backgroundColor: totalSpent > totalBudget ? '#ef4444' : '#3b82f6'
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <div>{formatCurrency(0)}</div>
            <div>{formatCurrency(totalBudget)}</div>
          </div>
        </div>
      </motion.div>

      {/* Budget Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow mb-6 transparent"
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Budget Categories</h2>
        </div>
        <div className="p-4">
          <AnimatePresence>
            {budgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="mb-4"
              >
                <div className="flex justify-between items-center">
                  <span>{budget.category_name}</span>
                  <div className="flex gap-2">
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBudget(budget)}
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <FiX size={14} />
                      Delete
                    </AnimatedButton>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <div>Budgeted: {formatCurrency(budget.amount)}</div>
                  <div>Spent: {formatCurrency(budget.current_spending)}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min((budget.current_spending / budget.amount) * 100 || 0, 100)}%`,
                      backgroundColor: budget.current_spending > budget.amount ? '#ef4444' : '#3b82f6'
                    }}
                  ></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Add Budget Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Budget"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="form-select w-full"
              value={newBudget.category_id}
              onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
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
              Amount
            </label>
            <input
              type="number"
              className="form-input w-full"
              placeholder="0.00"
              value={newBudget.amount}
              onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={newBudget.start_date}
              onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={newBudget.end_date}
              onChange={(e) => setNewBudget({ ...newBudget, end_date: e.target.value })}
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
            onClick={handleAddBudget}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Budget'}
          </AnimatedButton>
        </div>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        title="Edit Budget"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="form-select w-full"
              value={editingBudget?.category_id || ''}
              onChange={(e) => setEditingBudget({ ...editingBudget, category_id: e.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              className="form-input w-full"
              value={editingBudget?.amount || ''}
              onChange={(e) => setEditingBudget({ ...editingBudget, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={editingBudget?.start_date || ''}
              onChange={(e) => setEditingBudget({ ...editingBudget, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={editingBudget?.end_date || ''}
              onChange={(e) => setEditingBudget({ ...editingBudget, end_date: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <AnimatedButton
            variant="outline"
            onClick={() => setEditingBudget(null)}
            disabled={isSubmitting}
          >
            Cancel
          </AnimatedButton>
          <AnimatedButton
            onClick={handleEditBudget}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </AnimatedButton>
        </div>
      </Modal>

      {/* Custom Period Modal */}
      <Modal
        isOpen={showCustomPeriod}
        onClose={() => {
          setShowCustomPeriod(false)
          if (timeframe !== 'custom') {
            setTimeframe('month')
          }
        }}
        title="Select Custom Period"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={customDateRange.start_date}
              onChange={(e) => {
                setCustomDateRange({ ...customDateRange, start_date: e.target.value })
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="form-input w-full"
              value={customDateRange.end_date}
              onChange={(e) => {
                setCustomDateRange({ ...customDateRange, end_date: e.target.value })
              }}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <AnimatedButton
            variant="outline"
            onClick={() => {
              setShowCustomPeriod(false)
              if (timeframe !== 'custom') {
                setTimeframe('month')
              }
            }}
          >
            Cancel
          </AnimatedButton>
          <AnimatedButton
            onClick={() => {
              setTimeframe('custom')
              fetchBudgets()
              setShowCustomPeriod(false)
            }}
          >
            Show
          </AnimatedButton>
        </div>
      </Modal>
    </motion.div>
  )
}
