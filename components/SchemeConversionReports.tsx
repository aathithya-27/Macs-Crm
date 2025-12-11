import React, { useMemo, useState, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Member, Lead, SchemeMaster, InsuranceTypeMaster } from '../types.ts';
import { IndianRupee, FileText as FileTextIcon, Star, Donut } from 'lucide-react';

export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700/50">
                <p className="font-bold text-gray-800 dark:text-white mb-1">{label}</p>
                {payload.map((p: any, i: number) => {
                    const value = typeof p.value === 'number'
                        ? p.name.toLowerCase().includes('premium') || p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('profit')
                            ? `₹${p.value.toLocaleString('en-IN')}`
                            : p.value.toLocaleString()
                        : p.value;
                    return (
                        <p key={i} style={{ color: p.color || p.fill }} className="text-sm font-medium">{`${p.name}: ${value}`}</p>
                    )
                })}
            </div>
        );
    }
    return null;
};


export const SchemeConversionReports: React.FC<{
    members: Member[];
    leads: Lead[];
    schemes: SchemeMaster[];
    insuranceTypes: InsuranceTypeMaster[];
}> = ({ members, leads, schemes, insuranceTypes }) => {
    const [topSchemesView, setTopSchemesView] = useState<'chart' | 'table'>('chart');

    const schemeInfoMap = useMemo(() => new Map(schemes.map(s => [s.id, { name: s.name, type: s.type, insuranceTypeId: s.insuranceTypeId }])), [schemes]);
    const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

    const getParentInsuranceType = useCallback((typeId: string | null | undefined): InsuranceTypeMaster | null => {
        if (!typeId) return null;
        let current = insuranceTypeMap.get(typeId);
        if (!current) return null;
        while (current.parentId && insuranceTypeMap.has(current.parentId)) {
            current = insuranceTypeMap.get(current.parentId)!;
        }
        return current;
    }, [insuranceTypeMap]);

    const schemeAnalysis = useMemo(() => {
        const schemeMap = new Map<string, { count: number; premium: number; type: string }>();
        const typeCounts = new Map<string, number>();

        const parentTypes = insuranceTypes.filter(it => !it.parentId && it.active);
        parentTypes.forEach(pt => typeCounts.set(pt.name, 0));

        members.forEach(member => member.policies.forEach(policy => {
            const schemeInfo = schemeInfoMap.get(policy.schemeId || '');
            const parentType = getParentInsuranceType(schemeInfo?.insuranceTypeId);

            if (!parentType) return;

            const policyTypeForReport = parentType.name;
            const schemeName = schemeInfo?.name || 'Unspecified';

            const currentScheme = schemeMap.get(schemeName) || { count: 0, premium: 0, type: policyTypeForReport };
            currentScheme.count += 1;
            currentScheme.premium += policy.premium;
            schemeMap.set(schemeName, currentScheme);

            typeCounts.set(policyTypeForReport, (typeCounts.get(policyTypeForReport) || 0) + 1);
        }));

        const allSchemes = Array.from(schemeMap.entries()).map(([name, data]) => ({ name, ...data }));
        const totalPremium = allSchemes.reduce((sum, s) => sum + s.premium, 0);

        return {
            allSchemes: allSchemes.sort((a, b) => b.premium - a.premium),
            topByPremium: [...allSchemes].sort((a,b) => b.premium - a.premium).slice(0, 5),
            topByCount: [...allSchemes].sort((a,b) => b.count - a.count).slice(0, 5),
            typeDistribution: Array.from(typeCounts.entries()).map(([name, value]) => ({ name, value })),
            totalPolicies: members.reduce((sum, m) => sum + m.policies.length, 0),
            totalPremium,
            mostPopular: allSchemes.length > 0 ? [...allSchemes].sort((a,b) => b.premium - a.premium)[0].name : 'N/A',
        };
    }, [members, schemeInfoMap, getParentInsuranceType, insuranceTypes]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#84cc16', '#a855f7'];
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

    const StatCard = ({ title, value, icon, subtext = '' }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string }) => (<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">{icon}</div><div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p></div></div>{subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}</div>);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Premium" value={`₹${schemeAnalysis.totalPremium.toLocaleString('en-IN')}`} icon={<IndianRupee size={20} />} />
                <StatCard title="Total Policies Sold" value={schemeAnalysis.totalPolicies} icon={<FileTextIcon size={20} />} />
                <StatCard title="Most Popular Scheme" value={schemeAnalysis.mostPopular} subtext="(by premium)" icon={<Star size={20} />} />
                <StatCard title="Policy Types" value={schemeAnalysis.typeDistribution.length} icon={<Donut size={20} />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold text-center mb-4 text-gray-800 dark:text-white">Policy Type Distribution</h4><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={schemeAnalysis.typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label>{schemeAnalysis.typeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Top 5 Schemes by Premium</h4>
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
                            <button onClick={() => setTopSchemesView('chart')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${topSchemesView === 'chart' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Chart</button>
                            <button onClick={() => setTopSchemesView('table')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${topSchemesView === 'table' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Table</button>
                        </div>
                    </div>
                     {topSchemesView === 'chart' ? (
                        <ResponsiveContainer width="100%" height={250}><BarChart data={schemeAnalysis.topByPremium} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fill: tickColor, fontSize: 12 }} /><YAxis dataKey="name" type="category" tick={{ fill: tickColor, fontSize: 12 }} width={100} /><Tooltip content={<CustomTooltip />} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}/><Bar dataKey="premium" name="Total Premium" fill="#3B82F6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                     ) : (
                         <div className="overflow-x-auto max-h-[250px]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Scheme Name</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Policies Sold</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {schemeAnalysis.topByPremium.map(s => (
                                        <tr key={s.name}>
                                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{s.count}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold mb-4 text-gray-800 dark:text-white">All Schemes Data</h4><div className="overflow-x-auto max-h-80"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm"><thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr><th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Scheme Name</th><th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Policy Type</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Policies Sold</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{schemeAnalysis.allSchemes.map(s=>(<tr key={s.name}><td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td><td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.type}</td><td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{s.count}</td><td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td></tr>))}</tbody></table></div></div>
        </div>
    );
};
