import api from '../lib/api';

// Transactions API
export const transactionsAPI = {
    getAll: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value)
            })
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
            const response = await api.get(`/transactions${queryString}`)
            return response.data || []
        } catch (error) {
            console.error('Error fetching transactions:', error)
            throw error
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/transactions/${id}`)
            return response.data
        } catch (error) {
            console.error('Error fetching transaction:', error)
            throw error
        }
    },
    create: async (transactionData) => {
        try {
            const response = await api.post("/transactions", transactionData)
            return response.data
        } catch (error) {
            console.error('Error creating transaction:', error)
            throw error
        }
    },
    update: async (id, transactionData) => {
        try {
            const response = await api.put(`/transactions/${id}`, transactionData)
            return response.data
        } catch (error) {
            console.error('Error updating transaction:', error)
            throw error
        }
    },
    delete: async (id) => {
        try {
            await api.delete(`/transactions/${id}`)
            return true
        } catch (error) {
            console.error('Error deleting transaction:', error)
            throw error
        }
    },
}

// Categories API
export const categoriesAPI = {
    getAll: async () => {
        try {
            const response = await api.get('/categories')
            return response.data || []
        } catch (error) {
            console.error('Error fetching categories:', error)
            return []
        }
    },
    getById: async (id) => {
        return api.get(`/categories/${id}`)
    },
    create: async (categoryData) => {
        try {
            const response = await api.post('/categories', categoryData)
            return response.data
        } catch (error) {
            console.error('Error creating category:', error)
            throw error
        }
    },
    update: async (id, categoryData) => {
        try {
            const response = await api.put(`/categories/${id}`, categoryData)
            return response.data
        } catch (error) {
            console.error('Error updating category:', error)
            throw error
        }
    },
    delete: async (id) => {
        try {
            await api.delete(`/categories/${id}`)
            return true
        } catch (error) {
            console.error('Error deleting category:', error)
            throw error
        }
    },
    getExpenseBreakdown: async () => {
        try {
            const response = await api.get('/categories/breakdown')
            return response.data || []
        } catch (error) {
            console.error('Error fetching expense breakdown:', error)
            return []
        }
    },
}

// Budgets API
export const budgetsAPI = {
    getAll: async () => {
        try {
            const response = await api.get("/budgets");
            const budgets = response.data || [];
            // Calculate current spending for each budget
            const budgetsWithSpending = await Promise.all(
                budgets.map(async (budget) => {
                    const transactions = await transactionsAPI.getAll({
                        category: budget.category_id,
                        start_date: budget.start_date,
                        end_date: budget.end_date
                    });
                    const spent = transactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    return {
                        ...budget,
                        spent,
                        percentage: (spent / budget.amount) * 100
                    };
                })
            );
            return budgetsWithSpending;
        } catch (error) {
            console.error('Error fetching budgets:', error);
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/budgets/${id}`)
            return response.data
        } catch (error) {
            console.error('Error fetching budget:', error)
            throw error
        }
    },
    create: async (budgetData) => {
        try {
            const response = await api.post("/budgets", budgetData)
            return response.data
        } catch (error) {
            console.error('Error creating budget:', error)
            throw error
        }
    },
    update: async (id, budgetData) => {
        try {
            const response = await api.put(`/budgets/${id}`, budgetData)
            return response.data
        } catch (error) {
            console.error('Error updating budget:', error)
            throw error
        }
    },
    delete: async (id) => {
        try {
            await api.delete(`/budgets/${id}`)
            return true
        } catch (error) {
            console.error('Error deleting budget:', error)
            throw error
        }
    }
}

const transactionsService = {
    transactions: transactionsAPI,
    categories: categoriesAPI,
    budgets: budgetsAPI
};

export default transactionsAPI;
