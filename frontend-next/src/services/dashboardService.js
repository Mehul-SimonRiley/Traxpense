import api from '../lib/api';

// Fetch dashboard summary
const getSummary = async () => {
    try {
        const response = await api.get('/dashboard/summary');
        const data = response.data || {};
        return {
            totalExpenses: parseFloat(data.total_expenses || 0),
            totalIncome: parseFloat(data.total_income || 0),
            currentBalance: parseFloat(data.current_balance || 0),
            savings: data.savings || 0,
            expenseTrend: data.expense_trend || "",
            incomeTrend: data.income_trend || "",
            balanceTrend: data.balance_trend || "",
            savingsRate: data.savings_rate || "0%"
        };
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return {
            totalExpenses: 0,
            totalIncome: 0,
            currentBalance: 0,
            savings: 0,
            expenseTrend: "",
            incomeTrend: "",
            balanceTrend: "",
            savingsRate: "0%"
        };
    }
};

const getDashboardData = async (timeframe = "all", customDateRange = null) => {
    try {
        let url = '/dashboard';
        const params = new URLSearchParams();

        if (timeframe === "today") {
            params.append('timeframe', 'today');
        } else if (timeframe === "month") {
            params.append('timeframe', 'month');
        } else if (timeframe === "custom" && customDateRange) {
            params.append('timeframe', 'custom');
            params.append('start_date', customDateRange.start_date);
            params.append('end_date', customDateRange.end_date);
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
};

const getInsights = async () => {
    try {
        const response = await api.get('/insights');
        return response.data;
    } catch (error) {
        console.error('Error fetching insights:', error);
        return [];
    }
}

const dashboardService = {
    getSummary,
    getDashboardData,
    getInsights
};

export default dashboardService;
