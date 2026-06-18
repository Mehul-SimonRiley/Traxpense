"use client";
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
);

export default function SparklineCard({ title, value, trend, isPositive, dataPoints, colorHex }) {
    const data = {
        labels: dataPoints.map((_, i) => `Day ${i + 1}`),
        datasets: [
            {
                data: dataPoints,
                borderColor: colorHex,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
                    gradient.addColorStop(0, `${colorHex}40`); // 25% opacity
                    gradient.addColorStop(1, `${colorHex}00`); // 0% opacity
                    return gradient;
                },
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.4 // Smooth curves
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                intersect: false,
                mode: 'index',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                displayColors: false,
            }
        },
        scales: {
            x: { display: false },
            y: { display: false }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    return (
        <div className="flex flex-col h-full justify-between p-1 bg-transparent">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight">{value}</div>
                </div>
                <div className={`text-sm font-semibold flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '↗' : '↘'} {trend}
                </div>
            </div>
            
            <div className="flex-1 w-full h-[60px] relative -mx-2 -mb-2">
                <Line data={data} options={options} />
            </div>
        </div>
    );
}
