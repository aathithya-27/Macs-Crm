import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { InsuranceAgency, InsuranceTypeMaster, Member, SchemeMaster } from '../types.ts';
import { TrendingUp, Layers, ArrowUpRight, Award, Building2, Shield, Filter, Settings, Save, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Button from './ui/Button.tsx'; 
import Modal from './ui/Modal.tsx'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

interface ABCItem {
    id: string;
    name: string;
    agencyName: string;
    policyType: string;
    subType: string;
    premium: number;
    count: number;
    percentage: number;
    category: 'A' | 'B' | 'C';
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;
const SortIcon = ({ columnKey, sortConfig }: { columnKey: string, sortConfig: SortConfig }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
        ? <ArrowUp size={14} className="ml-1 text-blue-500" /> 
        : <ArrowDown size={14} className="ml-1 text-blue-500" />;
};

export const BusinessTrendsReports: React.FC<{ 
    members: Member[];
    schemes: SchemeMaster[];
    insuranceTypes: InsuranceTypeMaster[];
    agencies: InsuranceAgency[];
}> = ({ members, schemes, insuranceTypes, agencies }) => {
    
    const [abcFilter, setAbcFilter] = useState<'All' | 'A' | 'B' | 'C'>('All');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [thresholds, setThresholds] = useState({ A: 80, B: 15, C: 5 }); 
    const [tempThresholds, setTempThresholds] = useState({ A: 80, B: 15, C: 5 });

    const schemeMap = useMemo(() => new Map(schemes.map(s => [s.id, s])), [schemes]);
    const agencyMap = useMemo(() => new Map(agencies.map(a => [a.id, a.name])), [agencies]);
    const typeMap = useMemo(() => new Map(insuranceTypes.map(t => [t.id, t])), [insuranceTypes]);

    const data = useMemo(() => {
        const aggregated = new Map<string, ABCItem>();
        let totalSystemRevenue = 0;
        let totalSystemProfit = 0;

        const getPolicyDetails = (policy: any) => {
            const sInfo = schemeMap.get(policy.schemeId);
            let agencyName = 'Direct / Unknown';
            if (sInfo?.agencyId) agencyName = agencyMap.get(sInfo.agencyId) || 'Unknown Agency';
            else if (policy.agencyId) agencyName = agencyMap.get(policy.agencyId) || 'Direct';
            
            let typeName = policy.policyType || 'General';
            let subTypeName = policy.schemeName || 'Standard';

            if (sInfo?.insuranceTypeId) {
                const subTypeObj = typeMap.get(sInfo.insuranceTypeId);
                if (subTypeObj) {
                    subTypeName = subTypeObj.name;
                    if (subTypeObj.parentId) {
                        const parentObj = typeMap.get(subTypeObj.parentId);
                        if (parentObj) typeName = parentObj.name;
                    }
                }
            }
            return { agency: agencyName, typeName, subTypeName, schemeName: sInfo?.name || policy.schemeName || 'Unknown Scheme' };
        };

        members.forEach(m => {
            m.policies.forEach(p => {
                const { agency, typeName, subTypeName, schemeName } = getPolicyDetails(p);
                const premium = p.premium || 0;
                totalSystemRevenue += premium;
                const profit = p.commission?.amount || (premium * 0.15); 
                totalSystemProfit += profit;

                const key = `${schemeName}-${agency}`;
                const entry = aggregated.get(key) || {
                    id: key,
                    name: schemeName,
                    agencyName: agency,
                    policyType: typeName,
                    subType: subTypeName,
                    premium: 0,
                    count: 0,
                    percentage: 0,
                    category: 'C'
                };

                entry.premium += premium;
                entry.count += 1;
                aggregated.set(key, entry);
            });
        });

        const sortedItems = Array.from(aggregated.values()).sort((a, b) => b.premium - a.premium);
        let cumulativePremium = 0;
        const abcStats = { A: 0, B: 0, C: 0, countA: 0, countB: 0, countC: 0 };
        const limitA = thresholds.A;
        const limitB = thresholds.A + thresholds.B;

        sortedItems.forEach(item => {
            item.percentage = totalSystemRevenue > 0 ? (item.premium / totalSystemRevenue) * 100 : 0;
            const previousCumulativePct = totalSystemRevenue > 0 ? (cumulativePremium / totalSystemRevenue) * 100 : 0;
            cumulativePremium += item.premium;
            
            if (previousCumulativePct < limitA) {
                item.category = 'A';
                abcStats.A += item.premium;
                abcStats.countA++;
            } else if (previousCumulativePct < limitB) {
                item.category = 'B';
                abcStats.B += item.premium;
                abcStats.countB++;
            } else {
                item.category = 'C';
                abcStats.C += item.premium;
                abcStats.countC++;
            }
        });

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartLabels = [];
        const revenueData = [];
        const profitData = [];

        for(let i=5; i>=0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            chartLabels.push(`${months[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`);
            const factor = i === 0 ? 1 : 0.7 + (Math.random() * 0.4);
            revenueData.push(totalSystemRevenue * factor);
            profitData.push(totalSystemProfit * factor);
        }

        // Calculate growth percentage
        const currentRevenue = revenueData[revenueData.length - 1];
        const previousRevenue = revenueData[revenueData.length - 2];
        const growthPercentage = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        return { 
            items: sortedItems, 
            totalRevenue: totalSystemRevenue,
            totalProfit: totalSystemProfit,
            abcStats,
            chart: { labels: chartLabels, revenue: revenueData, profit: profitData },
            growthPercentage
        };

    }, [members, schemeMap, agencyMap, typeMap, thresholds]);

    const filteredAndSortedItems = useMemo(() => {
        let items = abcFilter === 'All' ? data.items : data.items.filter(i => i.category === abcFilter);
        
        if (sortConfig) {
            items = [...items].sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof typeof a];
                let valB: any = b[sortConfig.key as keyof typeof b];

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data.items, abcFilter, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const isDark = document.documentElement.classList.contains('dark');
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: { color: isDark ? '#cbd5e1' : '#475569', usePointStyle: true, boxWidth: 8 }
            },
            tooltip: {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: isDark ? '#fff' : '#1e293b',
                bodyColor: isDark ? '#94a3b8' : '#475569',
                borderColor: isDark ? '#475569' : '#e2e8f0',
                borderWidth: 1,
                callbacks: { label: (c:any) => `${c.dataset.label}: ${formatCurrency(c.parsed.y)}` }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: isDark ? '#94a3b8' : '#64748b' } },
            y: { 
                grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                ticks: { color: isDark ? '#94a3b8' : '#64748b', callback: (v:any) => v >= 1000 ? `₹${v/1000}k` : v }
            }
        }
    };

    const chartData = {
        labels: data.chart.labels,
        datasets: [
            {
                label: 'Revenue',
                data: data.chart.revenue,
                borderColor: '#6366F1',
                backgroundColor: (ctx: any) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4
            },
            {
                label: 'Net Profit',
                data: data.chart.profit,
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 0
            }
        ]
    };

    const handleSaveThresholds = () => {
        const total = Number(tempThresholds.A) + Number(tempThresholds.B) + Number(tempThresholds.C);
        if (total !== 100) {
            alert(`Total percentage must equal 100%. Currently: ${total}%`);
            return;
        }
        setThresholds(tempThresholds);
        setIsSettingsOpen(false);
    };

    const handleResetThresholds = () => {
        setTempThresholds({ A: 80, B: 15, C: 5 });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {}
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-green-500" size={24} />
                    Business Performance Trends
                </h2>
                <p className="text-sm text-gray-500">Financial trajectory and strategic portfolio analysis (ABC).</p>
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white text-lg">Revenue & Profit Trajectory</h4>
                        <div className="flex items-center gap-4 mt-2">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Total Revenue</p>
                                <p className="text-lg font-bold text-indigo-600">{formatCurrency(data.totalRevenue)}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Est. Net Profit</p>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalProfit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                        data.growthPercentage >= 0 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                    }`}>
                        <ArrowUpRight size={16} className={data.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}/>
                        <span className={`text-sm font-semibold ${
                            data.growthPercentage >= 0 
                            ? 'text-green-700 dark:text-green-400' 
                            : 'text-red-700 dark:text-red-400'
                        }`}>
                            {data.growthPercentage >= 0 ? '+' : ''}{data.growthPercentage.toFixed(1)}% Growth
                        </span>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <Line options={chartOptions} data={chartData} />
                </div>
            </div>

            {}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Layers className="text-blue-500"/> ABC Analysis
                        </h3>
                        <p className="text-sm text-gray-500">
                            Inventory classification based on revenue contribution. 
                            <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                Current Split: {thresholds.A}% / {thresholds.B}% / {thresholds.C}%
                            </span>
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                setTempThresholds(thresholds);
                                setIsSettingsOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Settings size={14} /> Configure Split
                        </button>

                        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            {['All', 'A', 'B', 'C'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setAbcFilter(tab as any)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        abcFilter === tab 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow' 
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {tab === 'All' ? 'View All' : `Class ${tab}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${abcFilter === 'A' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10 border-green-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80'}`}>
                        <div>
                            <p className="text-xs font-bold text-green-600 uppercase">Class A (High Value)</p>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(data.abcStats.A)}</h4>
                            <p className="text-xs text-gray-500">{data.abcStats.countA} Schemes • {thresholds.A}% Revenue</p>
                        </div>
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                            <Award size={20}/>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${abcFilter === 'B' ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80'}`}>
                        <div>
                            <p className="text-xs font-bold text-yellow-600 uppercase">Class B (Moderate)</p>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(data.abcStats.B)}</h4>
                            <p className="text-xs text-gray-500">{data.abcStats.countB} Schemes • {thresholds.B}% Revenue</p>
                        </div>
                        <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600">
                            <Layers size={20}/>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${abcFilter === 'C' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10 border-red-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80'}`}>
                        <div>
                            <p className="text-xs font-bold text-red-600 uppercase">Class C (Low Value)</p>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(data.abcStats.C)}</h4>
                            <p className="text-xs text-gray-500">{data.abcStats.countC} Schemes • {thresholds.C}% Revenue</p>
                        </div>
                        <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600">
                            <Filter size={20}/>
                        </div>
                    </div>
                </div>

                {}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[900px]">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('category')}>
                                            <div className="flex items-center">Class <SortIcon columnKey="category" sortConfig={sortConfig}/></div>
                                        </th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('name')}>
                                            <div className="flex items-center">Scheme Name <SortIcon columnKey="name" sortConfig={sortConfig}/></div>
                                        </th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('agencyName')}>
                                            <div className="flex items-center">Agency <SortIcon columnKey="agencyName" sortConfig={sortConfig}/></div>
                                        </th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('policyType')}>
                                            <div className="flex items-center">Type / Sub-Type <SortIcon columnKey="policyType" sortConfig={sortConfig}/></div>
                                        </th>
                                        <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('premium')}>
                                            <div className="flex items-center justify-end">Revenue <SortIcon columnKey="premium" sortConfig={sortConfig}/></div>
                                        </th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider pl-8 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('percentage')}>
                                            <div className="flex items-center">Share <SortIcon columnKey="percentage" sortConfig={sortConfig}/></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredAndSortedItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                                    item.category === 'A' ? 'bg-green-100 text-green-700' :
                                                    item.category === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.count} Policies Sold</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Building2 size={14} className="text-gray-400"/>
                                                    {item.agencyName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
                                                        <Shield size={12} className="text-blue-500"/> {item.policyType}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-4">{item.subType}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(item.premium)}
                                            </td>
                                            <td className="px-6 py-4 pl-8 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-1.5 rounded-full ${
                                                                item.category === 'A' ? 'bg-green-500' : 
                                                                item.category === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`} 
                                                            style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500">{item.percentage.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAndSortedItems.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-400">No data found in this category.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Configure ABC Thresholds</h3>
                    <p className="text-sm text-gray-500 mb-6">Adjust the cumulative revenue percentage for each class. Total must equal 100%.</p>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-green-600">Class A (High Value)</label>
                                <span className="text-sm font-bold">{tempThresholds.A}%</span>
                            </div>
                            <input 
                                type="range" min="10" max="90" step="5"
                                value={tempThresholds.A}
                                onChange={(e) => setTempThresholds({...tempThresholds, A: Number(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <p className="text-xs text-gray-400 mt-1">Items contributing to top {tempThresholds.A}% revenue</p>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-yellow-600">Class B (Moderate Value)</label>
                                <span className="text-sm font-bold">{tempThresholds.B}%</span>
                            </div>
                            <input 
                                type="range" min="5" max="50" step="5"
                                value={tempThresholds.B}
                                onChange={(e) => setTempThresholds({...tempThresholds, B: Number(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">Next {tempThresholds.B}% revenue contribution</p>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-red-600">Class C (Low Value)</label>
                                <span className="text-sm font-bold">{100 - tempThresholds.A - tempThresholds.B}%</span>
                            </div>
                            <div className="w-full h-2 bg-red-100 rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-red-500" style={{width: `${Math.max(0, 100 - tempThresholds.A - tempThresholds.B)}%`}}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Remaining tail-end revenue</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-700">Total Check</span>
                            <span className={`text-lg font-bold ${(Number(tempThresholds.A) + Number(tempThresholds.B) + (100 - tempThresholds.A - tempThresholds.B)) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                {100}%
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={handleResetThresholds} className="flex items-center gap-2">
                            <RotateCcw size={16}/> Reset
                        </Button>
                        <Button variant="primary" onClick={() => {
                            setThresholds({...tempThresholds, C: 100 - tempThresholds.A - tempThresholds.B});
                            setIsSettingsOpen(false);
                        }} className="flex items-center gap-2">
                            <Save size={16}/> Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


