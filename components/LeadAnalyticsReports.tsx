import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Member, LeadSourceMaster } from '../types.ts';
import { CustomTooltip } from './SchemeConversionReports.tsx'; // Importing the shared tooltip

export const LeadAnalyticsReports: React.FC<{ members: Member[]; leadSources: LeadSourceMaster[] }> = ({ members, leadSources }) => {
    const leadSourceAnalysis = useMemo(() => {
        const sourceMap = new Map<string, { count: number; members: { name: string; memberType: Member['memberType']; totalPremium: number, fullSource: string }[] }>();
        const leadSourceMap = new Map(leadSources.map(ls => [ls.id, ls]));
        const memberMap = new Map(members.map(m => [m.id, m.name]));

        const getRootSource = (sourceId: string): LeadSourceMaster | null => {
            let current = leadSourceMap.get(sourceId);
            if (!current) return null;
            while (current.parentId && leadSourceMap.has(current.parentId)) {
                current = leadSourceMap.get(current.parentId)!;
            }
            return current;
        };

        const getFullSourcePath = (sourceId: string): string => {
            const path: string[] = [];
            let current = leadSourceMap.get(sourceId);
            while (current) {
                path.unshift(current.name);
                current = current.parentId ? leadSourceMap.get(current.parentId) : undefined;
            }
            return path.join(' > ');
        };

        members.forEach(member => {
            if (!member.leadSource?.sourceId) {
                 const current = sourceMap.get('Unknown') || { count: 0, members: [] };
                 current.count++;
                 current.members.push({ name: member.name, memberType: member.memberType, totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0), fullSource: 'Unknown' });
                 sourceMap.set('Unknown', current);
                 return;
            }

            const rootSource = getRootSource(member.leadSource.sourceId);
            const sourceName = rootSource ? rootSource.name : 'Unknown';

            let fullSource = getFullSourcePath(member.leadSource.sourceId);
            let detailText = member.leadSource?.detail;

            if (member.referrerId) {
                const referrerName = memberMap.get(member.referrerId);
                if (referrerName) {
                    detailText = referrerName;
                }
            }

            if(detailText) fullSource += ` - ${detailText}`;

            const current = sourceMap.get(sourceName) || { count: 0, members: [] };
            current.count++;
            current.members.push({
                name: member.name,
                memberType: member.memberType,
                totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0),
                fullSource: fullSource
            });
            sourceMap.set(sourceName, current);
        });

        const distribution = Array.from(sourceMap.entries())
            .map(([name, data]) => ({ name, value: data.count, members: data.members }))
            .sort((a, b) => b.value - a.value);

        const allMembersBySource = Array.from(sourceMap.entries()).flatMap(([source, data]) => data.members.map(m => ({ ...m, source })));

        return { distribution, allMembersBySource };
    }, [members, leadSources]);

    const [sourceFilter, setSourceFilter] = useState('All');

    const filteredMembersBySource = useMemo(() => {
        if (sourceFilter === 'All') {
            return leadSourceAnalysis.allMembersBySource;
        }
        return leadSourceAnalysis.allMembersBySource.filter(m => m.source === sourceFilter);
    }, [sourceFilter, leadSourceAnalysis.allMembersBySource]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F43F5E', '#14B8A6'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <h4 className="font-semibold text-center mb-4 text-gray-800 dark:text-white">Lead Source Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={leadSourceAnalysis.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return ( <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold"> {`${(percent * 100).toFixed(0)}%`} </text> );
                            }}>
                                {leadSourceAnalysis.distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Customer Details by Lead Source</h4>
                        <div className="flex items-center gap-2">
                            <label htmlFor="source-filter" className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter:</label>
                            <select
                                id="source-filter"
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-800 dark:text-white focus:ring-blue-600 focus:border-blue-600 py-1"
                            >
                                <option value="All">All Sources</option>
                                {leadSourceAnalysis.distribution.map(source => (
                                    <option key={source.name} value={source.name}>{source.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Customer Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Lead Source</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredMembersBySource.map((m, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{m.name}</td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{m.fullSource}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{m.totalPremium.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
