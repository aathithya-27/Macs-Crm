import React, { useMemo, useState } from 'react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, 
    BarChart, Bar, CartesianGrid, XAxis, YAxis, Sector
} from 'recharts';
import { Member, SchemeMaster, InsuranceTypeMaster, User, MutualFundScheme, AMC } from '../types.ts';
import { FileText, Phone, X, MapPin, User as UserIcon, Search, PieChart as PieIcon, BarChart3, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Modal from './ui/Modal.tsx';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

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
                {`${payload.name}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={10}>
                {`${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
            </text>
        </g>
    );
};

const DrillDownContent: React.FC<{
    title: string;
    customers: Member[];
    onClose: () => void;
    userMap: Map<string, string>;
    businessVertical: 'All' | 'Insurance' | 'Mutual Funds';
}> = ({ title, customers, onClose, userMap, businessVertical }) => {
    const [modalSearch, setModalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    const filteredCustomers = useMemo(() => {
        let data = [...customers];

        if (modalSearch) {
            const lowerSearch = modalSearch.toLowerCase();
            data = data.filter(c => {
                const advisorNames = c.assignedTo.map(id => userMap.get(id) || '').join(' ').toLowerCase();
                const totalPremium = c.policies.reduce((sum, p) => sum + p.premium, 0).toString();
                const policyType = (c.policies[0]?.policyType || '').toLowerCase();
                const location = `${c.city || ''} ${c.area || ''}`.toLowerCase();
                
                return (
                    c.name.toLowerCase().includes(lowerSearch) ||
                    location.includes(lowerSearch) ||
                    advisorNames.includes(lowerSearch) ||
                    totalPremium.includes(lowerSearch) ||
                    policyType.includes(lowerSearch) ||
                    c.mobile.includes(lowerSearch)
                );
            });
        }

        if (sortConfig) {
            data.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                switch (sortConfig.key) {
                    case 'name': valA = a.name; valB = b.name; break;
                    case 'premium': 
                        valA = a.policies.reduce((sum, p) => sum + p.premium, 0); 
                        valB = b.policies.reduce((sum, p) => sum + p.premium, 0); 
                        break;
                    case 'policyType': 
                        valA = a.policies[0]?.policyType || ''; 
                        valB = b.policies[0]?.policyType || ''; 
                        break;
                    case 'location': 
                        valA = `${a.city} ${a.area}`; 
                        valB = `${b.city} ${b.area}`; 
                        break;
                    case 'advisor': 
                        valA = userMap.get(a.assignedTo[0] || '') || ''; 
                        valB = userMap.get(b.assignedTo[0] || '') || ''; 
                        break;
                    default: return 0;
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [customers, modalSearch, userMap, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="flex flex-col h-[80vh] w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden">
            {}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="text-sm text-blue-100 opacity-90">{customers.length} Customers Found</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={20}/>
                </button>
            </div>
            
            {}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="relative max-w-md w-full">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search name, location, premium, advisor..." 
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                    />
                </div>
            </div>

            {}
            <div className="flex-1 overflow-auto p-0">
                <div className="min-w-[800px]"> {}
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                        <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('name')}>
                                    <div className="flex items-center">Customer Name <SortIcon columnKey="name" sortConfig={sortConfig}/></div>
                                </th>
                                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('premium')}>
                                    <div className="flex items-center justify-end">Value <SortIcon columnKey="premium" sortConfig={sortConfig}/></div>
                                </th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('policyType')}>
                                    <div className="flex items-center">Type <SortIcon columnKey="policyType" sortConfig={sortConfig}/></div>
                                </th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('location')}>
                                    <div className="flex items-center">Location <SortIcon columnKey="location" sortConfig={sortConfig}/></div>
                                </th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => requestSort('advisor')}>
                                    <div className="flex items-center">Advisor <SortIcon columnKey="advisor" sortConfig={sortConfig}/></div>
                                </th>
                                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase">Contact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredCustomers.map((m, i) => {
                                let customerValue = 0;
                                let customerType = 'N/A';
                                
                                if (businessVertical === 'Insurance') {
                                    customerValue = m.policies.reduce((sum, p) => sum + p.premium, 0);
                                    customerType = m.policies[0]?.policyType || 'General';
                                } else if (businessVertical === 'Mutual Funds') {
                                    customerValue = m.mutualFundHoldings?.reduce((sum, mf) => sum + (mf.totalInvestment || 0), 0) || 0;
                                    customerType = m.mutualFundHoldings?.[0]?.investmentType || 'Lumpsum';
                                } else {
                                    const insuranceValue = m.policies.reduce((sum, p) => sum + p.premium, 0);
                                    const mutualFundValue = m.mutualFundHoldings?.reduce((sum, mf) => sum + (mf.totalInvestment || 0), 0) || 0;
                                    customerValue = insuranceValue + mutualFundValue;
                                    
                                    if (insuranceValue >= mutualFundValue && insuranceValue > 0) {
                                        customerType = m.policies[0]?.policyType || 'General';
                                    } else if (mutualFundValue > 0) {
                                        customerType = m.mutualFundHoldings?.[0]?.investmentType || 'Lumpsum';
                                    }
                                }
                                
                                return (
                                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-gray-200">
                                            {formatCurrency(customerValue)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {customerType}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-gray-400"/>
                                                {m.city || 'N/A'}, {m.area || ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <UserIcon size={14} className="text-gray-400"/>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {m.assignedTo.map(id => userMap.get(id)).join(', ') || 'Unassigned'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a href={`tel:${m.mobile}`} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-xs font-bold transition-colors">
                                                <Phone size={12}/> {m.mobile}
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredCustomers.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No customers found matching "{modalSearch}"</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const SchemeConversionReports: React.FC<{
    members: Member[];
    schemes: SchemeMaster[];
    insuranceTypes: InsuranceTypeMaster[];
    users: User[];
    leads: any[];
    mutualFundSchemes?: MutualFundScheme[];
    amcs?: AMC[];
}> = ({ members, schemes, insuranceTypes, users, mutualFundSchemes = [], amcs = [] }) => {
    
    const [drillDownData, setDrillDownData] = useState<{ title: string; customers: Member[] } | null>(null);
    const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [businessVertical, setBusinessVertical] = useState<'All' | 'Insurance' | 'Mutual Funds'>('All');

    const schemeInfoMap = useMemo(() => new Map(schemes.map(s => [s.id, { name: s.name, type: s.type, insuranceTypeId: s.insuranceTypeId }])), [schemes]);
    const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const mutualFundSchemeMap = useMemo(() => new Map(mutualFundSchemes.map(s => [s.id, s])), [mutualFundSchemes]);
    const amcMap = useMemo(() => new Map(amcs.map(a => [a.id, a.name])), [amcs]);

    const analysis = useMemo(() => {
        const typeStats = new Map<string, { count: number; premium: number; members: Member[]; vertical: 'Insurance' | 'Mutual Funds' }>();
        const schemeStats = new Map<string, { count: number; premium: number; members: Member[], typeName: string; vertical: 'Insurance' | 'Mutual Funds' }>();
        let totalSystemPremium = 0;

        members.forEach(member => {
            // Process Insurance Policies
            member.policies.forEach(policy => {
                const sInfo = schemeInfoMap.get(policy.schemeId || '');
                let typeName = 'Other';
                
                if (sInfo?.insuranceTypeId) {
                    let current = insuranceTypeMap.get(sInfo.insuranceTypeId);
                    while(current?.parentId) current = insuranceTypeMap.get(current.parentId);
                    if(current) typeName = current.name;
                } else if (policy.policyType) {
                    typeName = policy.policyType;
                }

                const sName = sInfo?.name || policy.schemeName || 'Unknown Scheme';
                const premium = policy.premium || 0;
                totalSystemPremium += premium;

                const tEntry = typeStats.get(typeName) || { count: 0, premium: 0, members: [], vertical: 'Insurance' as const };
                tEntry.count++;
                tEntry.premium += premium;
                if(!tEntry.members.find(m => m.id === member.id)) tEntry.members.push(member);
                typeStats.set(typeName, tEntry);

                const sEntry = schemeStats.get(sName) || { count: 0, premium: 0, members: [], typeName, vertical: 'Insurance' as const };
                sEntry.count++;
                sEntry.premium += premium;
                if(!sEntry.members.find(m => m.id === member.id)) sEntry.members.push(member);
                schemeStats.set(sName, sEntry);
            });

            // Process Mutual Fund Holdings
            member.mutualFundHoldings?.forEach(mf => {
                const investment = mf.totalInvestment || 0;
                totalSystemPremium += investment;
                
                const mfScheme = mutualFundSchemeMap.get(mf.schemeId);
                const schemeName = mfScheme?.name || `MF Scheme ${mf.schemeId}`;
                const typeName = mf.investmentType || 'Lumpsum'; // Use investment type instead of 'Mutual Funds'
                
                const tEntry = typeStats.get(typeName) || { count: 0, premium: 0, members: [], vertical: 'Mutual Funds' as const };
                tEntry.count++;
                tEntry.premium += investment;
                if(!tEntry.members.find(m => m.id === member.id)) tEntry.members.push(member);
                typeStats.set(typeName, tEntry);

                const sEntry = schemeStats.get(schemeName) || { count: 0, premium: 0, members: [], typeName, vertical: 'Mutual Funds' as const };
                sEntry.count++;
                sEntry.premium += investment;
                if(!sEntry.members.find(m => m.id === member.id)) sEntry.members.push(member);
                schemeStats.set(schemeName, sEntry);
            });
        });

        const types = Array.from(typeStats.entries()).map(([name, d]) => ({ name, ...d })).sort((a,b) => b.premium - a.premium);
        const allSchemes = Array.from(schemeStats.entries()).map(([name, d]) => ({ 
            name, 
            ...d,
            contribution: totalSystemPremium > 0 ? (d.premium / totalSystemPremium) * 100 : 0
        }));

        // Filter by business vertical
        let filteredSchemes = allSchemes;
        if (businessVertical !== 'All') {
            filteredSchemes = allSchemes.filter(s => s.vertical === businessVertical);
        }

        if (sortConfig) {
            filteredSchemes.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                switch(sortConfig.key) {
                    case 'name': valA = a.name; valB = b.name; break;
                    case 'typeName': valA = a.typeName; valB = b.typeName; break;
                    case 'count': valA = a.count; valB = b.count; break;
                    case 'premium': valA = a.premium; valB = b.premium; break;
                    case 'contribution': valA = a.contribution; valB = b.contribution; break;
                    default: return 0;
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            filteredSchemes.sort((a,b) => b.premium - a.premium);
        }

        const topSchemes = [...filteredSchemes].sort((a,b) => b.premium - a.premium).slice(0, 5);

        return { types, topSchemes, allSchemes: filteredSchemes };
    }, [members, schemeInfoMap, insuranceTypeMap, mutualFundSchemeMap, amcMap, sortConfig, businessVertical]);

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
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500"/> Scheme Conversion Analysis
                    </h2>
                    <p className="text-sm text-gray-500">Revenue breakdown by Insurance Type and Top Schemes.</p>
                </div>
                
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    {['All', 'Insurance', 'Mutual Funds'].map((vertical) => (
                        <button
                            key={vertical}
                            onClick={() => setBusinessVertical(vertical as any)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                                businessVertical === vertical 
                                ? 'bg-indigo-600 text-white shadow' 
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {vertical}
                        </button>
                    ))}
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg relative overflow-hidden">
                    
                    {}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                            {chartView === 'pie' ? `Top 5 ${businessVertical === 'All' ? 'Schemes' : businessVertical} (Pie)` : `Top 5 ${businessVertical === 'All' ? 'Schemes' : businessVertical} (Bar)`}
                        </h4>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button 
                                onClick={() => setChartView('pie')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${chartView === 'pie' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                <PieIcon size={14} /> Pie
                            </button>
                            <button 
                                onClick={() => setChartView('bar')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${chartView === 'bar' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                <BarChart3 size={14} /> Bar
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="h-[400px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartView === 'pie' ? (
                                <PieChart>
                                    <Pie 
                                        data={analysis.topSchemes}
                                        dataKey="premium" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={80} 
                                        outerRadius={120} 
                                        paddingAngle={5}
                                        label={renderCustomizedLabel} 
                                        labelLine={true}
                                        onClick={(data: any) => {
                                            if (data && data.payload) {
                                                setDrillDownData({ title: `Customers - ${data.name}`, customers: data.payload.members });
                                            }
                                        }}
                                        className="cursor-pointer outline-none filter drop-shadow-md"
                                    >
                                        {analysis.topSchemes.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0}/>)}
                                    </Pie>
                                </PieChart>
                            ) : (
                                <BarChart 
                                    data={analysis.topSchemes} 
                                    layout="vertical" 
                                    margin={{left: 0, right: 30, top: 10, bottom: 10}}
                                    onClick={(data: any) => {
                                        if(data && data.activePayload && data.activePayload[0]) {
                                            const payload = data.activePayload[0].payload;
                                            setDrillDownData({ title: `Customers enrolled in ${payload.name}`, customers: payload.members });
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1}/>
                                    <XAxis type="number" hide/>
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#6B7280', fontWeight: 500}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                                        formatter={(val: number) => formatCurrency(val)}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                                    />
                                    <Bar dataKey="premium" radius={[0, 6, 6, 0]} barSize={24}>
                                        {analysis.topSchemes.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2 italic">Click on any chart segment to view detailed customer list</p>
                </div>
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                    <h4 className="font-bold text-gray-800 dark:text-white">Detailed Scheme Analysis</h4>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]"> {}
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            <thead className="bg-white dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => requestSort('name')}>
                                        <div className="flex items-center">Scheme Name <SortIcon columnKey="name" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => requestSort('typeName')}>
                                        <div className="flex items-center">Vertical <SortIcon columnKey="typeName" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => requestSort('count')}>
                                        <div className="flex items-center justify-end">Count <SortIcon columnKey="count" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => requestSort('premium')}>
                                        <div className="flex items-center justify-end">Value <SortIcon columnKey="premium" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider pl-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={() => requestSort('contribution')}>
                                        <div className="flex items-center">Share % <SortIcon columnKey="contribution" sortConfig={sortConfig}/></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {analysis.allSchemes.map((scheme, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group" onClick={() => { setDrillDownData({ title: `Customers enrolled in ${scheme.name}`, customers: scheme.members }); }}>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{scheme.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs border font-medium ${
                                                    scheme.vertical === 'Insurance' 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                                                    : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                }`}>
                                                    {scheme.vertical}
                                                </span>
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-600">{scheme.typeName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300 font-medium">{scheme.count}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(scheme.premium)}</td>
                                        <td className="px-6 py-4 pl-8 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${scheme.contribution}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">{scheme.contribution.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {}
            {drillDownData && (
                <Modal isOpen={!!drillDownData} onClose={() => setDrillDownData(null)}>
                    <DrillDownContent 
                        title={drillDownData.title}
                        customers={drillDownData.customers}
                        onClose={() => setDrillDownData(null)}
                        userMap={userMap}
                        businessVertical={businessVertical}
                    />
                </Modal>
            )}
        </div>
    );
};