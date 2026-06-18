import api from '../lib/api';
import { transactionsAPI } from './transactionsService';

export const getTransactions = async (startDate, endDate) => {
    try {
        // Re-use transactionsAPI.getAll but with specific date range filters
        const transactions = await transactionsAPI.getAll({
            start_date: startDate,
            end_date: endDate
        });
        return transactions;
    } catch (error) {
        console.error('Error fetching calendar transactions:', error);
        return [];
    }
};

export const calendarService = {
    getTransactions
};

export default calendarService;
