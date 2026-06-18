"use client";

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
    Filler
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
    Legend,
    Filler
)

// Common chart options
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 2000,
        easing: 'easeOutQuart',
    },
    hover: {
        mode: 'index',
        intersect: false
    },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#94a3b8', // Slate 400
                font: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                usePointStyle: true,
                padding: 20
            }
        },
        title: {
            color: '#f8fafc',
            font: {
                family: "'Inter', sans-serif",
                size: 16,
                weight: '600'
            },
            padding: { top: 0, bottom: 20 }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            intersect: false,
            mode: 'index',
            cornerRadius: 8,
            titleFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
            bodyFont: { size: 13, family: "'Inter', sans-serif" }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false,
            },
            ticks: {
                color: '#64748b',
                font: { family: "'Inter', sans-serif" }
            }
        },
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                color: '#64748b',
                font: { family: "'Inter', sans-serif" }
            }
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

// Neon color palette
const neonColors = [
    'rgba(99, 102, 241, 0.8)', // Indigo
    'rgba(16, 185, 129, 0.8)', // Green
    'rgba(244, 63, 94, 0.8)', // Rose
    'rgba(245, 158, 11, 0.8)', // Amber
    'rgba(139, 92, 246, 0.8)', // Purple
    'rgba(6, 182, 212, 0.8)', // Cyan
    'rgba(236, 72, 153, 0.8)', // Pink
];

// Helper function to create expense breakdown data
export const createExpenseBreakdownData = (categoryBreakdown) => {
    return {
        labels: categoryBreakdown.map(item => item.name),
        datasets: [
            {
                label: 'Expenses by Category',
                data: categoryBreakdown.map(item => item.total),
                backgroundColor: categoryBreakdown.map((_, index) => neonColors[index % neonColors.length]),
                borderColor: '#0a0f1c', // Match dark background
                borderWidth: 2,
                hoverOffset: 15
            },
        ],
    }
}

// Helper function to create data for a single trend (e.g., Expense Trends)
export const createSingleTrendData = (trendData, label, color = '#ff4757') => {
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
                backgroundColor: color + '20', // Add some transparency hex
                fill: true,
                tension: 0.4,
                pointBackgroundColor: color,
                pointBorderColor: '#1c1c1e', // Match solid card background
                pointRadius: 4,
                pointHoverRadius: 6,
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
                backgroundColor: '#ff4757', // Solid Danger color
                hoverBackgroundColor: '#ff6b81',
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 12, // Match thin bars from reference
            },
            {
                label: 'Income',
                data: allLabels.map(month => {
                    const trend = incomes.find(item => item?.month === month);
                    return trend?.total ?? 0;
                }),
                backgroundColor: '#00d0b6', // Solid Teal Accent
                hoverBackgroundColor: '#00e5ff',
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 12,
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
