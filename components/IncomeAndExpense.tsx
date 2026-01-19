
import React, { useState, useMemo } from 'react';
import { 
    Member, Expense, ManualIncome, User, Company, 
    ManualCommission, Branch, AppModule, PermissionLevel, 
    DocumentNumbering, ManualReceipt, FinancialYear, BankMaster, 
    AccountCategory, AccountSubCategory, AccountHead
} from '../types.ts';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { 
    IndianRupee, TrendingUp, TrendingDown, Download, BarChart2, PieChart as PieChartIcon, 
    Search, ArrowUpDown, FilePlus2, Edit2, Trash2, Lock, Info 
} from 'lucide-react';
import PaymentVoucherModal, { VoucherSaveData } from './PaymentVoucherModal.tsx';
import ManualReceiptModal, { ReceiptSaveData } from './ManualReceiptModal.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';

type AnalysisTabType = 'analysis' | 'incomes' | 'expenses';


const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <input
            {...props}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${props.className}`}
        />
    </div>
);

const Button: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'light' | 'success' | 'danger';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
    as?: 'button' | 'span';
    size?: 'small' | 'medium';
    title?: string;
}> = ({ onClick, children, variant = 'primary', disabled = false, className = '', type = 'button', as = 'button', size = 'medium', title }) => {
    const baseClasses = "flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeClasses = { medium: "px-4 py-2 text-sm", small: "px-2.5 py-1.5 text-xs" };
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
        light: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500 border border-gray-300 dark:border-gray-600',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    const Tag = as;
    return (
        <Tag type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} title={title}>
            {children}
        </Tag>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700/50">
                <p className="font-bold text-gray-800 dark:text-white mb-1">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color || p.fill }} className="text-sm font-medium">{`${p.name}: ₹${p.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

const useSortableData = (items: any[], config = null) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(config);
    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };
    return { items: sortedItems, requestSort, sortConfig };
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; isProfit?: boolean }> = ({ title, value, icon, isProfit }) => {
    const valueColor = isProfit === undefined ? 'text-gray-800 dark:text-white' : isProfit ? 'text-green-600' : 'text-red-600';
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className={`text-2xl font-bold ${valueColor}`}>₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode; viewMode?: 'pie' | 'bar'; setViewMode?: (mode: 'pie' | 'bar') => void; }> = ({ title, children, viewMode, setViewMode }) => {
    const ViewButton = ({ mode, Icon }: { mode: 'pie' | 'bar', Icon: React.ElementType }) => (
        <button onClick={() => setViewMode && setViewMode(mode)} className={`p-1.5 rounded-md ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
            <Icon size={16} />
        </button>
    );
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
                {viewMode && setViewMode && (
                    <div className="flex items-center gap-2">
                        <ViewButton mode="pie" Icon={PieChartIcon} />
                        <ViewButton mode="bar" Icon={BarChart2} />
                    </div>
                )}
            </div>
            {children}
        </div>
    );
};

const DataTable: React.FC<{ data: any[]; columns: { header: string; accessor: string; className?: string; render?: (value: any, row: any, index: number) => React.ReactNode }[] }> = ({ data, columns }) => {
    const { items, requestSort, sortConfig } = useSortableData(data);
    return (
        <div className="h-full overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                    <tr>
                        {columns.map(col => (
                            <th key={col.header} className={`px-4 py-2 font-medium text-gray-500 dark:text-gray-400 ${col.className || 'text-left'}`}>
                                <button 
                                    onClick={() => requestSort(col.accessor)} 
                                    className={`flex items-center gap-2 hover:text-gray-800 dark:hover:text-gray-200 ${col.className?.includes('text-right') ? 'justify-end w-full' : ''}`}
                                >
                                    {col.header}
                                    <ArrowUpDown size={14} className={sortConfig?.key === col.accessor ? 'text-blue-500' : ''} />
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.length > 0 ? (
                        items.map((row, index) => (
                            <tr key={`${row.id || 'row'}-${index}`} className={row.isPaymentReturned ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                {columns.map((col, colIndex) => (
                                    <td key={`${col.accessor}-${index}-${colIndex}`} className={`px-4 py-2 text-gray-700 dark:text-gray-300 align-top ${col.className || 'text-left'}`}>
                                        {col.render ? col.render(row[col.accessor], row, index) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={columns.length} className="text-center py-8 text-gray-500">No data available.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const FilterControls: React.FC<{ 
    filters: any, 
    onFilterChange: (filters: any) => void, 
    branches?: Branch[],
    heads: AccountHead[]
}> = ({ filters, onFilterChange, branches, heads }) => {
    
    const filteredHeads = useMemo(() => {
        return heads.filter(h => !h.postingBank && !h.isCash);
    }, [heads]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Input label="Start Date" type="date" value={filters.startDate} onChange={e => onFilterChange({...filters, startDate: e.target.value})} />
            <Input label="End Date" type="date" value={filters.endDate} onChange={e => onFilterChange({...filters, endDate: e.target.value})} />
            
            {branches && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                    <select value={filters.branch_id} onChange={e => onFilterChange({ ...filters, branch_id: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm">
                        <option value="all">All Branches</option>
                        {branches.map(opt => <option key={opt.id} value={opt.id}>{opt.branch_name}</option>)}
                    </select>
                </div>
            )}

            <SearchableSelect
                label="Account Head (Category)"
                options={[{ value: 'all', label: 'All Categories' }, ...filteredHeads.map(h => ({ value: h.id, label: h.name }))]}
                value={filters.headId}
                onChange={value => onFilterChange({ ...filters, headId: value })}
                placeholder="Search categories..."
            />

            <div className="relative md:col-span-1">
                <Input label="Search" type="text" value={filters.searchTerm} onChange={e => onFilterChange({...filters, searchTerm: e.target.value})} placeholder="Search..." className="pl-10" />
                <Search className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            </div>
        </div>
    );
};


interface IncomeAndExpenseProps {
    allMembers: Member[];
    users: User[];
    bankMasters: BankMaster[];
    expenses: Expense[];
    manualIncomes: ManualIncome[];
    manualCommissions: ManualCommission[];
    manualReceipts: ManualReceipt[];
    
    onSaveReceipt: (receipt: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string }) => void;
    onDeleteManualReceipt: (receiptId: string) => void; 
    
    accountCategories: AccountCategory[];
    accountSubCategories: AccountSubCategory[];
    accountHeads: AccountHead[];
    
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (expenseId: string) => void;
    onDeleteVoucher: (voucherNo: string) => void;
    onAddManualIncome: (income: Omit<ManualIncome, 'id'>) => void;
    onUpdateManualIncome: (income: ManualIncome) => void;
    onDeleteManualIncome: (incomeId: string) => void;
    onAddManualCommission: (commission: Omit<ManualCommission, 'id'>) => void;
    onUpdateManualCommission: (commission: ManualCommission) => void;
    onDeleteManualCommission: (commissionId: string) => void;
    
    currentUser: User | null;
    companyInfo: Company | null;
    branches: Branch[];
    onSaveVoucher: (data: VoucherSaveData) => void;
    
    permissions: { [key in AppModule]?: PermissionLevel };
    activeFinancialYearId: string | null; 
    financialYears: FinancialYear[];
    trueCurrentFinancialYear: FinancialYear | null; 
    currentVoucherDocNumbering: DocumentNumbering | null;
    currentReceiptDocNumbering: DocumentNumbering | null;
    lastVoucherNumber: number; 
    lastReceiptNumber: number; 
}

const getAccountDetails = (headId: string, heads: AccountHead[], subs: AccountSubCategory[], cats: AccountCategory[]) => {
    const head = heads.find(h => h.id === headId);
    const sub = subs.find(s => s.id === head?.subCategoryId);
    const cat = cats.find(c => c.id === sub?.categoryId);
    return {
        headName: head?.name || 'Unknown',
        subName: sub?.name || 'Unknown',
        catName: cat?.name || 'Unknown'
    };
};

const AnalysisTab: React.FC<Pick<IncomeAndExpenseProps, 'expenses' | 'manualReceipts' | 'financialYears' | 'activeFinancialYearId' | 'accountCategories' | 'accountSubCategories' | 'accountHeads'>> = ({ expenses, manualReceipts, financialYears, activeFinancialYearId, accountCategories, accountSubCategories, accountHeads }) => {
    const [selectedFYId, setSelectedFYId] = useState(activeFinancialYearId || '');
    const [comparisonMode, setComparisonMode] = useState(false);
    const [compareFYId, setCompareFYId] = useState('');
    const [incomeViewMode, setIncomeViewMode] = useState<'pie' | 'bar'>('pie');
    const [expenseViewMode, setExpenseViewMode] = useState<'pie' | 'bar'>('pie');
    
    const getDataForFY = (fyId: string) => {
        const fy = financialYears.find(f => f.id === fyId);
        if (!fy) return { totalReceipts: 0, totalExpenses: 0, netFlow: 0, expensesBySubCat: [], incomeBySubCat: [], flattenedIncomes: [] };
        
        const fyStart = new Date(fy.fromDate);
        const fyEnd = new Date(fy.toDate);
        
        const receipts = manualReceipts.filter(r => {
            const d = new Date(r.date);
            return d >= fyStart && d <= fyEnd;
        });
        
        const expenseList = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= fyStart && d <= fyEnd;
        });

        const totalRec = receipts.reduce((sum, r) => sum + r.lineItems.reduce((s, i) => s + i.amount, 0), 0);
        const totalExp = expenseList.reduce((sum, e) => sum + e.amount, 0);

        const expCat: Record<string, number> = {};
        expenseList.forEach(e => { 
            const details = getAccountDetails(e.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
            const name = details.subName !== 'Unknown' ? details.subName : 'Uncategorized';
            expCat[name] = (expCat[name] || 0) + e.amount; 
        });

        const incCat: Record<string, number> = {};
        const flatIncomes: any[] = [];
        receipts.forEach(r => {
            r.lineItems.forEach(i => {
                const details = getAccountDetails(i.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
                const name = details.subName !== 'Unknown' ? details.subName : 'Uncategorized';
                incCat[name] = (incCat[name] || 0) + i.amount;
                flatIncomes.push({
                    id: `${r.id}-${i.id}`, 
                    date: new Date(r.date).toLocaleDateString('en-GB'), 
                    receiptNo: r.receiptNo,
                    party: r.receivedFrom || 'N/A', head: details.headName, amount: i.amount
                });
            });
        });
        flatIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            totalReceipts: totalRec, totalExpenses: totalExp, netFlow: totalRec - totalExp,
            expensesBySubCat: Object.entries(expCat).map(([name, value]) => ({ name, value })),
            incomeBySubCat: Object.entries(incCat).map(([name, value]) => ({ name, value })),
            flattenedIncomes: flatIncomes
        };
    };
    
    const primaryData = useMemo(() => getDataForFY(selectedFYId), [selectedFYId, expenses, manualReceipts, financialYears, accountCategories, accountSubCategories, accountHeads]);
    const compareData = useMemo(() => comparisonMode && compareFYId ? getDataForFY(compareFYId) : null, [comparisonMode, compareFYId, expenses, manualReceipts, financialYears, accountCategories, accountSubCategories, accountHeads]);
    
    const comparisonChartData = useMemo(() => {
        if (!compareData) return null;
        
        const allCategories = new Set([...primaryData.incomeBySubCat.map(i => i.name), ...compareData.incomeBySubCat.map(i => i.name)]);
        const incomeComparison = Array.from(allCategories).map(cat => ({
            name: cat,
            primary: primaryData.incomeBySubCat.find(i => i.name === cat)?.value || 0,
            compare: compareData.incomeBySubCat.find(i => i.name === cat)?.value || 0
        }));
        
        const allExpCategories = new Set([...primaryData.expensesBySubCat.map(e => e.name), ...compareData.expensesBySubCat.map(e => e.name)]);
        const expenseComparison = Array.from(allExpCategories).map(cat => ({
            name: cat,
            primary: primaryData.expensesBySubCat.find(e => e.name === cat)?.value || 0,
            compare: compareData.expensesBySubCat.find(e => e.name === cat)?.value || 0
        }));
        
        return { incomeComparison, expenseComparison };
    }, [primaryData, compareData]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316'];
    const selectedFY = financialYears.find(f => f.id === selectedFYId);
    const compareFY = financialYears.find(f => f.id === compareFYId);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Financial Year</label>
                        <select value={selectedFYId} onChange={e => setSelectedFYId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm">
                            {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.finYear}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex items-center">
                        <input type="checkbox" id="comparison" checked={comparisonMode} onChange={e => setComparisonMode(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="comparison" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Compare with another year</label>
                    </div>
                    
                    {comparisonMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compare with</label>
                            <select value={compareFYId} onChange={e => setCompareFYId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm">
                                <option value="">Select year to compare</option>
                                {financialYears.filter(fy => fy.id !== selectedFYId).map(fy => <option key={fy.id} value={fy.id}>{fy.finYear}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={`Total Receipts${selectedFY ? ` (${selectedFY.finYear})` : ''}`} value={primaryData.totalReceipts} icon={<TrendingUp />} isProfit={true} />
                <StatCard title={`Total Expenses${selectedFY ? ` (${selectedFY.finYear})` : ''}`} value={primaryData.totalExpenses} icon={<TrendingDown />} />
                <StatCard title={`Net Flow${selectedFY ? ` (${selectedFY.finYear})` : ''}`} value={primaryData.netFlow} icon={<IndianRupee />} isProfit={primaryData.netFlow >= 0} />
            </div>
            
            {comparisonMode && compareData && compareFY && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-300"><TrendingUp /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receipts Comparison</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{compareFY.finYear}: ₹{compareData.totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className={`text-sm font-medium ${compareData.totalReceipts > primaryData.totalReceipts ? 'text-red-600' : 'text-green-600'}`}>
                                    {compareData.totalReceipts > primaryData.totalReceipts ? '↓' : '↑'} {Math.abs(((primaryData.totalReceipts - compareData.totalReceipts) / (compareData.totalReceipts || 1)) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-300"><TrendingDown /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expenses Comparison</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{compareFY.finYear}: ₹{compareData.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className={`text-sm font-medium ${compareData.totalExpenses < primaryData.totalExpenses ? 'text-green-600' : 'text-red-600'}`}>
                                    {compareData.totalExpenses < primaryData.totalExpenses ? '↓' : '↑'} {Math.abs(((primaryData.totalExpenses - compareData.totalExpenses) / (compareData.totalExpenses || 1)) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300"><IndianRupee /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Flow Comparison</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white">{compareFY.finYear}: ₹{compareData.netFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className={`text-sm font-medium ${compareData.netFlow < primaryData.netFlow ? 'text-green-600' : 'text-red-600'}`}>
                                    {compareData.netFlow < primaryData.netFlow ? '↓' : '↑'} {Math.abs(((primaryData.netFlow - compareData.netFlow) / (Math.abs(compareData.netFlow) || 1)) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Income Analysis{selectedFY ? ` (${selectedFY.finYear})` : ''}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title={comparisonMode && compareData ? "Income Comparison by Sub-Category" : "Income by Sub-Category"} viewMode={incomeViewMode} setViewMode={setIncomeViewMode}>
                        <ResponsiveContainer width="100%" height={340}>
                            {comparisonMode && compareData && comparisonChartData ? (
                                <BarChart data={comparisonChartData.incomeComparison} margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="primary" name={selectedFY?.finYear || 'Primary'} fill="#10B981" />
                                    <Bar dataKey="compare" name={compareFY?.finYear || 'Compare'} fill="#3B82F6" />
                                </BarChart>
                            ) : incomeViewMode === 'pie' ? (
                                <PieChart>
                                    <Pie data={primaryData.incomeBySubCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>{primaryData.incomeBySubCat.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie>
                                    <Tooltip content={<CustomTooltip />} /><Legend />
                                </PieChart>
                            ) : (
                                <BarChart data={primaryData.incomeBySubCat} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Amount" fill="#10B981" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title="Recent Income Transactions">
                        <div className="h-[340px]">
                            <DataTable 
                                data={primaryData.flattenedIncomes.slice(0, 20)} 
                                columns={[
                                    { header: 'Date', accessor: 'date' }, 
                                    { header: 'Party', accessor: 'party' }, 
                                    { header: 'Head', accessor: 'head' }, 
                                    { header: 'Amount', accessor: 'amount', className: 'text-right', render: (val) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
                                ]} 
                            />
                        </div>
                    </ChartCard>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Expense Analysis{selectedFY ? ` (${selectedFY.finYear})` : ''}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title={comparisonMode && compareData ? "Expense Comparison by Sub-Category" : "Expenses by Sub-Category"} viewMode={expenseViewMode} setViewMode={setExpenseViewMode}>
                        <ResponsiveContainer width="100%" height={340}>
                            {comparisonMode && compareData && comparisonChartData ? (
                                <BarChart data={comparisonChartData.expenseComparison} margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="primary" name={selectedFY?.finYear || 'Primary'} fill="#EF4444" />
                                    <Bar dataKey="compare" name={compareFY?.finYear || 'Compare'} fill="#F59E0B" />
                                </BarChart>
                            ) : expenseViewMode === 'pie' ? (
                                <PieChart>
                                    <Pie data={primaryData.expensesBySubCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>{primaryData.expensesBySubCat.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie>
                                    <Tooltip content={<CustomTooltip />} /><Legend />
                                </PieChart>
                            ) : (
                                <BarChart data={primaryData.expensesBySubCat} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Amount" fill="#EF4444" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title="Recent Expense Transactions">
                        <div className="h-[340px]">
                            <DataTable 
                                data={expenses.filter(e => {
                                    if (!selectedFY) return false;
                                    const d = new Date(e.date);
                                    return d >= new Date(selectedFY.fromDate) && d <= new Date(selectedFY.toDate);
                                }).slice(0, 20).map(e => ({...e, date: new Date(e.date).toLocaleDateString('en-GB')}))} 
                                columns={[
                                    { header: 'Date', accessor: 'date' }, 
                                    { header: 'Party', accessor: 'paidTo' }, 
                                    { header: 'Head', accessor: 'accountHeadId', render: (id) => getAccountDetails(id, accountHeads, accountSubCategories, accountCategories).headName }, 
                                    { header: 'Amount', accessor: 'amount', className: 'text-right', render: (amt) => `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
                                ]} 
                            />
                        </div>
                    </ChartCard>
                </div>
            </div>
            
            {/* Income vs Expense Summary */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Income vs Expense Summary</h3>
                <ChartCard title={comparisonMode && compareData ? "Income vs Expense Comparison" : "Income vs Expense Overview"}>
                    <ResponsiveContainer width="100%" height={400}>
                        {comparisonMode && compareData && compareFY ? (
                            <BarChart data={[
                                { category: 'Income', [selectedFY?.finYear || 'Primary']: primaryData.totalReceipts, [compareFY.finYear]: compareData.totalReceipts },
                                { category: 'Expense', [selectedFY?.finYear || 'Primary']: primaryData.totalExpenses, [compareFY.finYear]: compareData.totalExpenses },
                                { category: 'Net Flow', [selectedFY?.finYear || 'Primary']: primaryData.netFlow, [compareFY.finYear]: compareData.netFlow }
                            ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey={selectedFY?.finYear || 'Primary'} fill="#10B981" />
                                <Bar dataKey={compareFY.finYear} fill="#3B82F6" />
                            </BarChart>
                        ) : (
                            <BarChart data={[
                                { category: 'Income', amount: primaryData.totalReceipts },
                                { category: 'Expense', amount: primaryData.totalExpenses },
                                { category: 'Net Flow', amount: primaryData.netFlow }
                            ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="amount">
                                    <Cell fill="#10B981" />
                                    <Cell fill="#EF4444" />
                                    <Cell fill={primaryData.netFlow >= 0 ? '#10B981' : '#EF4444'} />
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
};

const IncomesTab: React.FC<IncomeAndExpenseProps & { canCreate: boolean, canModify: boolean, canCreateNew: boolean, creationDisabledReason: string, activeFY: FinancialYear | null }> = (props) => {
    const { 
        allMembers, users, bankMasters, manualReceipts, 
        accountCategories, accountSubCategories, accountHeads,
        onSaveReceipt, onDeleteManualReceipt, companyInfo, currentUser,
        canCreate, canModify, canCreateNew, creationDisabledReason, 
        currentReceiptDocNumbering, lastReceiptNumber, trueCurrentFinancialYear, activeFY, branches 
    } = props;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '', branch_id: 'all', headId: 'all' });
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<ManualReceipt | null>(null);
    const [triggerReceiptExport, setTriggerReceiptExport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { items: sortedReceipts } = useSortableData(manualReceipts);

    const getPartyName = (rec: ManualReceipt) => {
        if (rec.partyType === 'Customer') return allMembers.find(m => m.id === rec.partyId)?.name || 'Unknown Customer';
        if (rec.partyType === 'Staff') return users.find(u => u.id === rec.partyId)?.name || 'Unknown Staff';
        return rec.receivedFrom || 'N/A';
    };

    const getInternalBankCashName = (bankId?: string) => {
        if (!bankId) return 'Unknown Bank/Cash';
        const bankCash = accountHeads.find(h => h.id === bankId);
        return bankCash ? bankCash.name : 'Unknown Bank/Cash';
    };
    
    const incomeHeads = useMemo(() => {
        return accountHeads.filter(h => !h.postingBank && !h.isCash);
    }, [accountHeads]);

    const toggleReturnStatus = (receipt: ManualReceipt) => {
        if (!canModify) return;
        const saveData: Omit<ReceiptSaveData, 'createdBy'> = {
            ...receipt,
            branch_id: receipt.branch_id || '',
            isPaymentReturned: !receipt.isPaymentReturned
        };
        onSaveReceipt(saveData);
    };

    const filteredReceipts = useMemo(() => {
        return sortedReceipts.filter(rec => {
            if (activeFY) {
                const rDate = new Date(rec.date);
                if (rDate < new Date(activeFY.fromDate) || rDate > new Date(activeFY.toDate)) return false;
            }
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            const rDate = new Date(rec.date);
            if (start && rDate < start) return false;
            if (end && rDate > end) return false;
            if (filters.branch_id !== 'all' && rec.branch_id !== filters.branch_id) return false;
            
            if (filters.headId !== 'all') {
                const hasMatchingLineItem = rec.lineItems.some(item => item.accountHeadId === filters.headId);
                if (!hasMatchingLineItem) return false;
            }

            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const party = getPartyName(rec).toLowerCase();
                const amounts = rec.lineItems.map(i => i.amount).join(' ');
                const match = [rec.receiptNo, rec.date, party, amounts, rec.docNo || ''].some(s => s.toLowerCase().includes(term));
                if (!match) return false;
            }
            return true;
        });
    }, [sortedReceipts, activeFY, filters, allMembers, users, accountHeads]);

    const totalReceiptAmount = useMemo(() => filteredReceipts.reduce((sum, r) => sum + r.lineItems.reduce((s, i) => s + i.amount, 0), 0), [filteredReceipts]);

    const paginatedReceipts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReceipts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReceipts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Top Section: Action Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Receipt</h3>
                <div className="flex items-center gap-4">
                    <Button onClick={() => { setEditingReceipt(null); setTriggerReceiptExport(false); setIsReceiptModalOpen(true); }} disabled={!canCreate || !canCreateNew} title={!canCreateNew ? creationDisabledReason : "Create Receipt"}>
                        <FilePlus2 size={16} /> Create Receipt
                    </Button>
                </div>
            </div>

            {/* Bottom Section: Log, Filters, Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4">Receipt Log</h3>
                
                <div className="my-4">
                    <StatCard title="Total Filtered Receipts" value={totalReceiptAmount} icon={<TrendingUp />} isProfit={true} />
                </div>
                
                <FilterControls 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    branches={branches}
                    heads={incomeHeads}
                />

                <div className="flex-1 overflow-y-auto mt-4 min-h-0">
                    <DataTable 
                        data={paginatedReceipts} 
                        columns={[
                            { header: 'S.No', accessor: 'id', render: (_, __, idx) => ((currentPage - 1) * itemsPerPage) + idx + 1 },
                            { header: 'Receipt #', accessor: 'receiptNo' },
                            { header: 'Date', accessor: 'date', render: (date) => new Date(date).toLocaleDateString('en-GB') },
                            { header: 'Income Details', accessor: 'lineItems', render: (items: any[]) => (
                                <div className="space-y-1">
                                    {items.map((i, idx) => {
                                        const details = getAccountDetails(i.accountHeadId, accountHeads, accountSubCategories, accountCategories);
                                        return (
                                            <div key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                                                {details.subName} &gt; <strong>{details.headName}</strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            )},
                            { header: 'Party', accessor: 'partyId', render: (_, row) => <span className="font-medium">{getPartyName(row)}</span> },
                            { header: 'Payment Mode (Source -> Bank/Cash)', accessor: 'lineItems', render: (items: any[]) => (
                                <div className="space-y-1 text-xs">
                                    {items.map((i, idx) => {
                                        const bankCashName = getInternalBankCashName(i.bankId);
                                        return (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span>{i.paymentMode}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium text-blue-600 dark:text-blue-400">{bankCashName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )},
                            { header: 'Ref/Doc No', accessor: 'docNo', render: (v) => v || '-' },
                            { header: 'Remarks', accessor: 'lineItems', render: (items: any[]) => (
                                <div className="space-y-1 text-xs text-gray-500">
                                    {items.map((i, idx) => <div key={idx} className="truncate max-w-[150px]" title={i.description || '-'}>{i.description || '-'}</div>)}
                                </div>
                            )},
                            { header: 'Amount', accessor: 'lineItems', className: 'text-right', render: (items: any[]) => <span className="font-bold text-green-600">₹{items.reduce((s, i) => s + i.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> },
                            { header: 'Return', accessor: 'isPaymentReturned', render: (val, row) => <input type="checkbox" checked={!!val} onChange={() => toggleReturnStatus(row)} disabled={!canModify} className="w-4 h-4 text-red-600 rounded cursor-pointer" /> },
                            { header: 'Actions', accessor: 'id', render: (id, row) => (
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => { setEditingReceipt(row); setTriggerReceiptExport(false); setIsReceiptModalOpen(true); }} className="p-1 text-blue-600 hover:text-blue-800" disabled={!canModify}><Edit2 size={16}/></button>
                                    <button onClick={() => { if(window.confirm('Delete receipt?')) onDeleteManualReceipt(id); }} className="p-1 text-red-600 hover:text-red-800" disabled={!canModify}><Trash2 size={16}/></button>
                                    <button onClick={() => { setEditingReceipt(row); setTriggerReceiptExport(true); setIsReceiptModalOpen(true); }} className="p-1 text-green-600 hover:text-green-800"><Download size={16}/></button>
                                </div>
                            )}
                        ]} 
                    />
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length} receipts
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                    disabled={currentPage === 1}
                                    variant="secondary"
                                    size="small"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                                    disabled={currentPage === totalPages}
                                    variant="secondary"
                                    size="small"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isReceiptModalOpen && (
                <ManualReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    companyInfo={companyInfo}
                    branches={branches}
                    currentUser={currentUser}
                    activeFinancialYearId={trueCurrentFinancialYear?.id || null}
                    docNumberingConfig={currentReceiptDocNumbering}
                    lastReceiptNumber={lastReceiptNumber}
                    onSave={onSaveReceipt}
                    receiptToEdit={editingReceipt}
                    triggerExport={triggerReceiptExport}
                    users={users}
                    allMembers={allMembers}
                    bankMasters={bankMasters}
                    
                    accountCategories={accountCategories}
                    accountSubCategories={accountSubCategories}
                    accountHeads={accountHeads}
                />
            )}
        </div>
    );
};

const ExpensesTab: React.FC<IncomeAndExpenseProps & { handleOpenVoucherModal: (expenses: Expense[] | null, shouldExport?: boolean) => void, canCreate: boolean, canModify: boolean, canCreateNew: boolean, creationDisabledReason: string, activeFY: FinancialYear | null }> = (props) => {
    const { expenses, onDeleteExpense, onDeleteVoucher, handleOpenVoucherModal, canCreate, canModify, branches, canCreateNew, creationDisabledReason, activeFY, allMembers, users, bankMasters, onUpdateExpense, accountCategories, accountSubCategories, accountHeads } = props;
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '', branch_id: 'all', headId: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const { items: sortedItems } = useSortableData(expenses);

    const getPartyName = (row: Expense) => {
        if (row.partyType === 'Customer') return allMembers.find(m => m.id === row.partyId)?.name || 'Unknown Customer';
        if (row.partyType === 'Staff') return users.find(u => u.id === row.partyId)?.name || 'Unknown Staff';
        return row.paidTo || 'N/A';
    };

    const getInternalBankCashName = (bankId?: string) => {
        if (!bankId) return 'Unknown Bank/Cash';
        const bankCash = accountHeads.find(h => h.id === bankId);
        return bankCash ? bankCash.name : 'Unknown Bank/Cash';
    };

    const expenseHeads = useMemo(() => {
        return accountHeads.filter(h => !h.postingBank && !h.isCash);
    }, [accountHeads]);

    const filteredExpenses = useMemo(() => {
        return sortedItems.filter(exp => {
            if (activeFY) {
                const expDate = new Date(exp.date);
                if (expDate < new Date(activeFY.fromDate) || expDate > new Date(activeFY.toDate)) return false;
            }
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (startDate && new Date(exp.date) < startDate) return false;
            if (endDate && new Date(exp.date) > endDate) return false;
            if (filters.branch_id !== 'all' && exp.branch_id !== filters.branch_id) return false;
            
            if (filters.headId !== 'all' && exp.accountHeadId !== filters.headId) return false;

            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const details = getAccountDetails(exp.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
                const vals = [
                    exp.date, details.subName, details.headName, 
                    getPartyName(exp), exp.amount, exp.description, exp.voucherNo
                ];
                return vals.some(val => String(val || '').toLowerCase().includes(term));
            }
            return true;
        });
    }, [sortedItems, filters, activeFY, accountHeads]);
    
    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), [filteredExpenses]);

    const paginatedExpenses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredExpenses, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Payment Voucher</h3>
                <div className="flex items-center gap-4">
                    <Button onClick={() => handleOpenVoucherModal(null)} disabled={!canCreate || !canCreateNew} title={!canCreateNew ? creationDisabledReason : "Create Voucher"}>
                        <FilePlus2 size={16} /> Create Voucher
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4">Expense Log</h3>
                <div className="my-4"><StatCard title="Total Filtered Expenses" value={totalExpenses} icon={<TrendingDown />} /></div>
                
                <FilterControls 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    branches={branches}
                    heads={expenseHeads}
                />

                <div className="flex-1 overflow-y-auto mt-4 min-h-0">
                    <DataTable 
                        data={paginatedExpenses} 
                        columns={[
                            { header: 'S.No', accessor: 'id', render: (_, __, idx) => ((currentPage - 1) * itemsPerPage) + idx + 1 },
                            { header: 'Voucher #', accessor: 'voucherNo', render: (v) => <span className="font-mono text-xs">{v}</span> },
                            { header: 'Date', accessor: 'date', render: (date) => new Date(date).toLocaleDateString('en-GB') },
                            { header: 'Party', accessor: 'partyId', render: (_, row) => <span className="font-medium">{getPartyName(row)}</span> },
                            { header: 'Account Head', accessor: 'accountHeadId', render: (id) => <span className="font-semibold">{getAccountDetails(id, accountHeads, accountSubCategories, accountCategories).headName}</span> },
                            { header: 'Payment Mode (Bank/Cash -> Mode)', accessor: 'modeOfPayment', render: (val, row) => {
                                const bankCashName = getInternalBankCashName(row.bankId);
                                return <div className="text-xs flex items-center gap-2"><span className="font-medium text-blue-600 dark:text-blue-400">{bankCashName}</span><span className="text-gray-400">→</span><span>{val}</span></div>
                            }},
                            { header: 'Doc/Ref No', accessor: 'docNo', render: (v) => v || '-' },
                            { header: 'Description', accessor: 'description', render: (v) => <span className="truncate max-w-[150px] inline-block" title={v}>{v || '-'}</span> },
                            { header: 'Amount', accessor: 'amount', className: 'text-right', render: (v) => <span className="font-bold text-red-600">₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> },
                            { header: 'Return', accessor: 'isPaymentReturned', render: (val, row) => <input type="checkbox" checked={!!val} onChange={() => onUpdateExpense({...row, isPaymentReturned: !val})} disabled={!canModify} className="w-4 h-4 text-red-600 rounded cursor-pointer" /> },
                            { header: 'Actions', accessor: 'id', render: (id, row) => (
                                <div className="flex gap-2 justify-center">
                                    {row.voucherNo ? (
                                        <>
                                            <button onClick={() => handleOpenVoucherModal(expenses.filter(e => e.voucherNo === row.voucherNo), false)} className="p-1 text-blue-600 hover:text-blue-800" disabled={!canModify}><Edit2 size={16}/></button>
                                            <button onClick={() => { if(window.confirm('Delete voucher?')) onDeleteVoucher(row.voucherNo!); }} className="p-1 text-red-600 hover:text-red-800" disabled={!canModify}><Trash2 size={16}/></button>
                                            <button onClick={() => handleOpenVoucherModal(expenses.filter(e => e.voucherNo === row.voucherNo), true)} className="p-1 text-green-600 hover:text-green-800"><Download size={16}/></button>
                                        </>
                                    ) : (
                                        <button onClick={() => { if(window.confirm('Delete expense?')) onDeleteExpense(row.id); }} className="p-1 text-red-600 hover:text-red-800" disabled={!canModify}><Trash2 size={16}/></button>
                                    )}
                                </div>
                            )}
                        ]} 
                    />
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} expenses
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                    disabled={currentPage === 1}
                                    variant="secondary"
                                    size="small"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                                    disabled={currentPage === totalPages}
                                    variant="secondary"
                                    size="small"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const IncomeAndExpense: React.FC<IncomeAndExpenseProps> = (props) => {
    const { 
        permissions, activeFinancialYearId, financialYears, trueCurrentFinancialYear,
        currentVoucherDocNumbering, expenses,
        onSaveVoucher
    } = props;

    const [activeTab, setActiveTab] = useState<AnalysisTabType>('analysis');
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [editingVoucherExpenses, setEditingVoucherExpenses] = useState<Expense[] | null>(null);
    const [triggerExport, setTriggerExport] = useState(false);

    const canView = permissions.incomeAndExpense !== 'none';
    const canCreate = permissions.incomeAndExpense === 'create' || permissions.incomeAndExpense === 'modify';
    const canModify = permissions.incomeAndExpense === 'modify';
    
    const isCreationAllowedByDate = !!trueCurrentFinancialYear;
    const isSessionInCurrentFY = activeFinancialYearId === trueCurrentFinancialYear?.id;
    const canCreateNew = isCreationAllowedByDate && isSessionInCurrentFY;
    const creationDisabledReason = !isCreationAllowedByDate ? "Outside Active FY" : (!isSessionInCurrentFY ? "Session in past FY" : "");
    
    const activeFYForSession = useMemo(() => financialYears.find(fy => fy.id === activeFinancialYearId) || null, [financialYears, activeFinancialYearId]);

    const handleOpenVoucherModal = (expensesToEdit: Expense[] | null = null, shouldExport: boolean = false) => {
        setEditingVoucherExpenses(expensesToEdit);
        setTriggerExport(shouldExport);
        setIsVoucherModalOpen(true);
    };

    if (!canView) return <div className="p-8 text-center text-red-500"><Lock size={48} className="mx-auto mb-4"/>Permission Denied</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Income & Expense</h2>
                {!canCreateNew && canCreate && <div className="flex items-center gap-2 p-2 bg-yellow-100 text-yellow-800 rounded-lg"><Info size={20}/> <span className="text-sm">{creationDisabledReason}</span></div>}
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700 inline-flex items-center gap-2 shrink-0">
                <button onClick={() => setActiveTab('analysis')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'}`}>Analysis</button>
                <button onClick={() => setActiveTab('incomes')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'incomes' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'}`}>Income</button>
                <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'expenses' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'}`}>Expense</button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'analysis' && <AnalysisTab {...props} />}
                {activeTab === 'incomes' && <IncomesTab {...props} canCreate={canCreate} canModify={canModify} canCreateNew={canCreateNew} creationDisabledReason={creationDisabledReason} activeFY={activeFYForSession} />}
                {activeTab === 'expenses' && <ExpensesTab {...props} handleOpenVoucherModal={handleOpenVoucherModal} canCreate={canCreate} canModify={canModify} canCreateNew={canCreateNew} creationDisabledReason={creationDisabledReason} activeFY={activeFYForSession} />}
            </div>

            {isVoucherModalOpen && (
                <PaymentVoucherModal
                    isOpen={isVoucherModalOpen}
                    onClose={() => setIsVoucherModalOpen(false)}
                    companyInfo={props.companyInfo}
                    branches={props.branches}
                    users={props.users}
                    allMembers={props.allMembers}
                    bankMasters={props.bankMasters}
                    
                    accountCategories={props.accountCategories}
                    accountSubCategories={props.accountSubCategories}
                    accountHeads={props.accountHeads}

                    lastVoucherNumber={props.lastVoucherNumber}
                    onSave={onSaveVoucher}
                    voucherToEdit={editingVoucherExpenses}
                    triggerExport={triggerExport}
                    canCreate={canCreate}
                    canModify={canModify}
                    activeFinancialYearId={trueCurrentFinancialYear?.id || null}
                    docNumberingConfig={currentVoucherDocNumbering}
                />
            )}
        </div>
    );
};

export default IncomeAndExpense;
