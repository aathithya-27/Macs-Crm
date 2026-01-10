import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Member, Lead, LeadSourceMaster, User } from '../types.ts';
import { Users, Filter, Phone, Tag, Briefcase, Search, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6'];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

const SortIcon = ({ columnKey, sortConfig }: { columnKey: string, sortConfig: SortConfig }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
        ? <ArrowUp size={14} className="ml-1 text-blue-500" /> 
        : <ArrowDown size={14} className="ml-1 text-blue-500" />;
};

const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12} fontWeight="bold" dy={4}>
                {`${payload.name}: ${value}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={10}>
                {`(${(percent * 100).toFixed(0)}%)`}
            </text>
        </g>
    );
};

export const LeadAnalyticsReports: React.FC<{
    members: Member[];
    allLeads: Lead[];
    leadSources: LeadSourceMaster[];
    users: User[];
}> = ({ members, allLeads, leadSources, users }) => {
    
    const [selectedSource, setSelectedSource] = useState<string>('All');
    const [tableSearch, setTableSearch] = useState<string>(''); 
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const sourceMap = useMemo(() => new Map(leadSources.map(s => [s.id, s.name])), [leadSources]);

    const analytics = useMemo(() => {
        const sourceStats = new Map<string, { count: number; value: number; individuals: any[] }>();

        const getSourceName = (id?: string) => {
            if (!id) return 'Direct / Unknown';
            const name = sourceMap.get(id);
            return name || 'Direct / Unknown';
        };

        allLeads.forEach(l => {
            const sourceName = getSourceName(l.leadSource?.sourceId);
            const entry = sourceStats.get(sourceName) || { count: 0, value: 0, individuals: [] };
            entry.count++;
            entry.value += l.estimatedValue || 0;
            entry.individuals.push({
                id: l.id, name: l.name, type: 'Lead', status: l.status || 'New', stage: l.status, 
                value: l.estimatedValue, advisor: l.assignedTo, phone: l.phone, source: sourceName
            });
            sourceStats.set(sourceName, entry);
        });

        members.filter(m => m.leadSource).forEach(m => {
            const sourceName = getSourceName(m.leadSource?.sourceId);
            const premium = m.policies.reduce((sum, p) => sum + p.premium, 0);
            const entry = sourceStats.get(sourceName) || { count: 0, value: 0, individuals: [] };
            entry.count++;
            entry.value += premium;
            entry.individuals.push({
                id: m.id, name: m.name, type: 'Customer', status: 'Converted', stage: 'Won', 
                value: premium, advisor: m.assignedTo[0], phone: m.mobile, source: sourceName
            });
            sourceStats.set(sourceName, entry);
        });

        const chartData = Array.from(sourceStats.entries())
            .map(([name, d]) => ({ name, ...d }))
            .sort((a,b) => b.count - a.count);

        return { chartData };
    }, [members, allLeads, sourceMap]);

    const filteredList = useMemo(() => {
        let list = [];
        if (selectedSource === 'All') {
            list = analytics.chartData.flatMap(a => a.individuals);
        } else {
            list = analytics.chartData.find(a => a.name === selectedSource)?.individuals || [];
        }

        if (tableSearch) {
            const searchLower = tableSearch.toLowerCase();
            list = list.filter(item => {
                const advisorName = (userMap.get(item.advisor) || 'Unassigned').toLowerCase();
                const valueStr = item.value.toString();
                
                return (
                    item.name.toLowerCase().includes(searchLower) ||
                    item.source.toLowerCase().includes(searchLower) ||
                    item.type.toLowerCase().includes(searchLower) ||
                    item.stage.toLowerCase().includes(searchLower) ||
                    advisorName.includes(searchLower) ||
                    valueStr.includes(searchLower) ||
                    item.phone.includes(searchLower)
                );
            });
        }

        if (sortConfig) {
            list.sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof typeof a] || '';
                let valB: any = b[sortConfig.key as keyof typeof b] || '';

                if (sortConfig.key === 'advisor') {
                    valA = userMap.get(a.advisor) || '';
                    valB = userMap.get(b.advisor) || '';
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return list;
    }, [analytics, selectedSource, tableSearch, userMap, sortConfig]);

    const paginatedList = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredList.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredList, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    const handleResetFilter = () => {
        if (selectedSource !== 'All') {
            setSelectedSource('All');
        }
    };

    const handleChartClick = (data: any, index: number, e: React.MouseEvent) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        setSelectedSource(data.name);
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {}
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Users className="text-pink-500"/> Lead Analytics</h2>
                <p className="text-sm text-gray-500">Analysis of lead sources by volume and detailed conversion tracking.</p>
            </div>

            {}
            <div 
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg relative transition-colors cursor-pointer"
                onClick={handleResetFilter} 
                title="Click outside the chart to reset filter"
            >
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">Lead Volume by Source</h4>
                    {selectedSource !== 'All' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleResetFilter(); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        >
                            <RotateCcw size={12} /> Reset Filter
                        </button>
                    )}
                </div>
                
                <div className="h-[300px] sm:h-[400px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={analytics.chartData} 
                                dataKey="count" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={80} 
                                outerRadius={120} 
                                paddingAngle={2}
                                label={renderCustomizedLabel} 
                                labelLine={true}
                                onClick={handleChartClick}
                                className="cursor-pointer outline-none filter drop-shadow-lg"
                            >
                                {analytics.chartData.map((e, i) => (
                                    <Cell 
                                        key={i} 
                                        fill={COLORS[i % COLORS.length]} 
                                        strokeWidth={selectedSource === e.name ? 3 : 0}
                                        stroke={selectedSource === e.name ? "#333" : "none"}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-gray-400 mt-[-20px] italic">
                    {selectedSource === 'All' ? 'Click on chart segments to filter table below' : 'Click outside the chart to reset filter'}
                </p>
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    
                    {}
                    <div className="flex items-center gap-4">
                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Tag size={16} className="text-blue-500"/> Source Details
                        </h4>
                        <select 
                            className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700 dark:text-gray-200"
                            value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}
                        >
                            <option value="All">All Sources</option>
                            {analytics.chartData.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                        </select>
                    </div>

                    {}
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search name, phone, advisor..." 
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px]">
                    <div className="min-w-[900px]"> {}
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase">S.No</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('name')}>
                                        <div className="flex items-center">Name <SortIcon columnKey="name" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('source')}>
                                        <div className="flex items-center">Lead Source <SortIcon columnKey="source" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('type')}>
                                        <div className="flex items-center">Customer/Lead <SortIcon columnKey="type" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('stage')}>
                                        <div className="flex items-center">Stage <SortIcon columnKey="stage" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('advisor')}>
                                        <div className="flex items-center">Advisor <SortIcon columnKey="advisor" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('value')}>
                                        <div className="flex items-center justify-end">Value <SortIcon columnKey="value" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedList.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">{((currentPage - 1) * itemsPerPage) + i + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-600">
                                                {item.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.type === 'Customer' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">{item.stage}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                            <Briefcase size={14} className="text-gray-400"/> {userMap.get(item.advisor) || 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.value || 0)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <a href={`tel:${item.phone}`} className="inline-flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-50 px-3 py-1 rounded-full">
                                                <Phone size={14}/> {item.phone}
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedList.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No data found matching your filter.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} records
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 text-sm border rounded-md ${
                                        currentPage === page 
                                        ? 'bg-blue-500 text-white border-blue-500' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};