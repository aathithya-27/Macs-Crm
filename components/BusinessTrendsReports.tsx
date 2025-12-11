import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend as ChartJsLegend,
  Filler,
} from 'chart.js';
import { Line as ChartJsLine } from 'react-chartjs-2';
import { Member } from '../types.ts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartJsTooltip,
  ChartJsLegend,
  Filler
);

export const BusinessTrendsReports: React.FC<{ members: Member[] }> = ({ members }) => {
    if (!Array.isArray(members)) {
        return (
            <div className="flex items-center justify-center h-full text-center text-red-500 border-2 border-dashed border-red-400 rounded-lg p-8">
                <div>
                    <h3 className="text-xl font-semibold">Could Not Load Business Trends</h3>
                    <p className="mt-2 text-sm">A data error occurred. The 'members' data required for this report is invalid or missing.</p>
                </div>
            </div>
        );
    }

    const abcData = useMemo(() => {
        const schemePremiums = new Map<string, number>();
        members
            .filter(m => m && Array.isArray(m.policies))
            .forEach(m => {
                m.policies.forEach(p => {
                    if (p) {
                        const name = p.schemeName || 'Unspecified';
                        schemePremiums.set(name, (schemePremiums.get(name) || 0) + (p.premium || 0));
                    }
                });
            });

        const totalPremium = Array.from(schemePremiums.values()).reduce((sum, p) => sum + p, 0);
        const sortedSchemes = Array.from(schemePremiums.entries()).map(([name, premium]) => ({ name, premium, percentage: totalPremium > 0 ? (premium / totalPremium) * 100 : 0 })).sort((a, b) => b.premium - a.premium);
        const categories: {A: any[], B: any[], C: any[]} = { A: [], B: [], C: [] };
        let cumulativePercentage = 0;
        sortedSchemes.forEach(scheme => {
            cumulativePercentage += scheme.percentage;
            if (cumulativePercentage <= 80) categories.A.push(scheme);
            else if (cumulativePercentage <= 95) categories.B.push(scheme);
            else categories.C.push(scheme);
        });
        return categories;
    }, [members]);

    const chartJsData = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dataPoints = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { name: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}'`, revenue: 0, profit: 0 };
        });

        let currentMonthRevenue = 0;
        let currentMonthProfit = 0;

        members
            .filter(m => m && Array.isArray(m.policies))
            .forEach(m => {
                m.policies.forEach(p => {
                    if (p) {
                        currentMonthRevenue += (p.premium || 0);
                        if (p.commission && p.commission.status === 'Paid') {
                            currentMonthProfit += (p.commission.amount || 0);
                        }
                    }
                });
            });

        if (dataPoints[5]) {
            dataPoints[5].revenue = isFinite(currentMonthRevenue) ? currentMonthRevenue : 0;
            dataPoints[5].profit = isFinite(currentMonthProfit) ? currentMonthProfit : 0;
        }

        for (let i = 4; i >= 0; i--) {
            if (dataPoints[i] && dataPoints[i + 1]) {
                const nextMonthRevenue = dataPoints[i + 1].revenue;
                const simulatedRevenue = Math.round(nextMonthRevenue * (0.8 + Math.random() * 0.2));
                dataPoints[i].revenue = isFinite(simulatedRevenue) ? simulatedRevenue : 0;
                const simulatedProfit = Math.round(dataPoints[i].revenue * (0.1 + Math.random() * 0.05));
                dataPoints[i].profit = isFinite(simulatedProfit) ? simulatedProfit : 0;
            }
        }

        return {
            labels: dataPoints.map(d => d.name),
            datasets: [
                {
                    label: 'Revenue',
                    data: dataPoints.map(d => d.revenue),
                    borderColor: '#8884d8',
                    backgroundColor: 'rgba(136, 132, 216, 0.5)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Profit',
                    data: dataPoints.map(d => d.profit),
                    borderColor: '#82ca9d',
                    backgroundColor: 'rgba(130, 202, 157, 0.5)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        };
    }, [members]);

    const isDarkMode = document.documentElement.classList.contains('dark');
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: isDarkMode ? '#cbd5e1' : '#475569' }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' },
                grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
            },
            y: {
                ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' },
                grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Business Trend Analysis</h3>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <h4 className="font-semibold mb-4 text-gray-800 dark:text-white">Profit & Loss Trend</h4>
                {}
                 <div style={{ height: '300px' }}>
                    <ChartJsLine options={chartOptions} data={chartJsData} />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">ABC Analysis (by Premium)</h3>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scheme Name</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase">Total Premium</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {abcData.A.map(s => (
                                <tr key={`A-${s.name}`}>
                                    <td className="px-4 py-2 font-bold text-green-600">A</td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {abcData.B.map(s => (
                                <tr key={`B-${s.name}`}>
                                    <td className="px-4 py-2 font-bold text-yellow-600">B</td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {abcData.C.map(s => (
                                <tr key={`C-${s.name}`}>
                                    <td className="px-4 py-2 font-bold text-red-600">C</td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
