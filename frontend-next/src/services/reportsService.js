import api from '../lib/api';

export const reportsAPI = {
    getExpenseVsIncome: async (timeRange) => {
        try {
            const response = await api.get(`/reports/income-vs-expense?timeRange=${timeRange}`)
            return response.data || {
                totalIncome: 0,
                totalExpenses: 0,
                netSavings: 0,
                savingsRate: 0,
                monthlyComparison: []
            }
        } catch (error) {
            console.error('Error fetching expense vs income report:', error)
            return {
                totalIncome: 0,
                totalExpenses: 0,
                netSavings: 0,
                savingsRate: 0,
                monthlyComparison: []
            }
        }
    },
    getCategoryBreakdown: async (timeRange) => {
        try {
            const response = await api.get(`/reports/spending-by-category?timeRange=${timeRange}`)
            return response.data || {
                topCategories: []
            }
        } catch (error) {
            console.error('Error fetching category breakdown report:', error)
            return {
                topCategories: []
            }
        }
    },
    getSpendingTrends: async (timeRange) => {
        try {
            const response = await api.get(`/reports/spending-trends?timeRange=${timeRange}`)
            return response.data || {
                monthlySpending: [],
                categoryTrends: []
            }
        } catch (error) {
            console.error('Error fetching spending trends report:', error)
            return {
                monthlySpending: [],
                categoryTrends: []
            }
        }
    }
};

export const { getExpenseVsIncome, getCategoryBreakdown, getSpendingTrends } = reportsAPI;
export default reportsAPI;
