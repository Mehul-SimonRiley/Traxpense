import React from 'react'
import { Line, Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}

// Line Chart Component
export const LineChart = ({ data, title }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  }

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  )
}

// Bar Chart Component
export const BarChart = ({ data, title }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  }

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// Pie Chart Component
export const PieChart = ({ data, title }) => {
  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: title,
      },
    },
  }

  return <Pie data={data} options={options} />
}

// Helper function to create expense breakdown data
export const createExpenseBreakdownData = (categoryBreakdown) => {
  return {
    labels: categoryBreakdown.map(item => item.name),
    datasets: [
      {
        label: 'Expenses by Category',
        data: categoryBreakdown.map(item => item.total),
        backgroundColor: categoryBreakdown.map((_, index) => 
          `hsl(${index * 30}, 70%, 50%)`
        ),
      },
    ],
  }
}

// Helper function to create data for a single trend (e.g., Expense Trends)
export const createSingleTrendData = (trendData, label, color = 'rgb(255, 99, 132)') => {
  const trends = Array.isArray(trendData) ? trendData : [];

  const allLabels = Array.from(new Set([
    ...trends.map(item => item?.month).filter(Boolean),
  ])).sort();

  return {
    labels: allLabels,
    datasets: [
      {
        label: label,
        data: Array.isArray(allLabels) ? allLabels.map(month => {
          const trend = trends.find(item => item?.month === month);
          return trend?.total ?? 0;
        }) : [],
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.5)')
      },
    ],
  };
};

// Helper function to create trend data for Income vs Expenses
export const createIncomeExpenseTrendData = (expenseTrends, incomeTrends) => {
  // Ensure inputs are arrays, defaulting to empty array if undefined or null
  const expenses = Array.isArray(expenseTrends) ? expenseTrends : [];
  const incomes = Array.isArray(incomeTrends) ? incomeTrends : [];

  // Merge labels from both trends to ensure all months are included
  const allLabels = Array.from(new Set([
    ...expenses.map(item => item?.month).filter(Boolean),
    ...incomes.map(item => item?.month).filter(Boolean)
  ])).sort();

  return {
    labels: allLabels,
    datasets: [
      {
        label: 'Expenses',
        data: allLabels.map(month => {
          const trend = expenses.find(item => item?.month === month);
          return trend?.total ?? 0;
        }),
        backgroundColor: 'rgba(239, 68, 68, 0.5)', // Red for expenses
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Income',
        data: allLabels.map(month => {
          const trend = incomes.find(item => item?.month === month);
          return trend?.total ?? 0;
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.5)', // Green for income
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };
}

// Helper function to create budget vs actual data
export const createBudgetVsActualData = (budgetStatus) => {
  return {
    labels: budgetStatus.map(item => item.category),
    datasets: [
      {
        label: 'Budget',
        data: budgetStatus.map(item => item.budget),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Spent',
        data: budgetStatus.map(item => item.spent),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  }
} 