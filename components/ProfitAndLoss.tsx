import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Member, Expense, ManualIncome, User, Policy, IncomeCategoryLevel1, IncomeCategoryLevel2, ExpenseCategoryLevel1, ExpenseCategoryLevel2, ExpenseCategoryLevel3, Company, ManualCommission, Branch, InsuranceTypeMaster, AppModule, PermissionLevel, DocumentNumbering, ManualReceipt, FinancialYear } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { IndianRupee, Plus, TrendingUp, TrendingDown, FileText, Download, BarChart2, PieChart as PieChartIcon, Table2, Search, ArrowUpDown, FilePlus2, ChevronDown, X as XIcon, Edit2, Trash2, Lock, Info } from 'lucide-react';
import PaymentVoucherModal, { VoucherSaveData } from './PaymentVoucherModal.tsx';
import ManualReceiptModal, { ReceiptSaveData } from './ManualReceiptModal.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';

// --- NEW: Global Type Definition for the file ---
type PnLTab = 'analysis' | 'incomes' | 'expenses';

// --- Reusable UI Components (Defined Globally within the file) ---

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
    title?: string; // NEW: Added title for tooltips
}> = ({ onClick, children, variant = 'primary', disabled = false, className = '', type = 'button', as = 'button', size = 'medium', title }) => {
    const baseClasses = "flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeClasses = {
        medium: "px-4 py-2 text-sm",
        small: "px-2.5 py-1.5 text-xs",
    };
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
                    <p key={i} style={{ color: p.color || p.fill }} className="text-sm font-medium">{`${p.name}: ₹${p.value.toLocaleString('en-IN')}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

// --- Custom hook for sorting ---
const useSortableData = (items: any[], config = null) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};


// --- Component Props Interfaces ---
interface ProfitAndLossProps {
    allMembers: Member[];
    expenses: Expense[];
    manualIncomes: ManualIncome[];
    manualCommissions: ManualCommission[];
    manualReceipts: ManualReceipt[];
    onSaveReceipt: (receipt: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string }) => void;
    onDeleteManualReceipt: (receiptId: string) => void; 
    expenseCategoriesLevel1: ExpenseCategoryLevel1[];
    expenseCategoriesLevel2: ExpenseCategoryLevel2[];
    expenseCategoriesLevel3: ExpenseCategoryLevel3[];
    incomeCategoriesLevel1: IncomeCategoryLevel1[];
    incomeCategoriesLevel2: IncomeCategoryLevel2[];
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
    insuranceTypes: InsuranceTypeMaster[];
    permissions: { [key in AppModule]?: PermissionLevel };
    
    // --- MODIFICATION START: Renamed and added props for clarity ---
    activeFinancialYearId: string | null; // The FY selected at LOGIN
    financialYears: FinancialYear[];
    trueCurrentFinancialYear: FinancialYear | null; // The FY based on CURRENT DATE
    currentVoucherDocNumbering: DocumentNumbering | null; // Numbering for CURRENT FY
    currentReceiptDocNumbering: DocumentNumbering | null; // Numbering for CURRENT FY
    lastVoucherNumber: number; // Count for CURRENT FY
    lastReceiptNumber: number; // Count for CURRENT FY
    // --- MODIFICATION END ---
}

interface AnalysisTabProps extends Pick<ProfitAndLossProps, 'allMembers' | 'manualCommissions' | 'manualIncomes' | 'expenses' | 'expenseCategoriesLevel1' | 'expenseCategoriesLevel2' | 'expenseCategoriesLevel3' | 'insuranceTypes' | 'manualReceipts' | 'financialYears'> {
    // MODIFIED: This now receives the SESSION FY ID
    activeFYId: string | null;
}
interface IncomesTabProps extends Pick<ProfitAndLossProps, 'allMembers' | 'manualIncomes' | 'manualCommissions' | 'incomeCategoriesLevel1' | 'incomeCategoriesLevel2' | 'currentUser' | 'onAddManualIncome' | 'onUpdateManualIncome' | 'onDeleteManualIncome' | 'onAddManualCommission' | 'onUpdateManualCommission' | 'onDeleteManualCommission' | 'insuranceTypes' | 'manualReceipts' | 'onSaveReceipt' | 'onDeleteManualReceipt' | 'companyInfo'> {
    canCreate: boolean;
    canModify: boolean;
    // MODIFIED: These props are for controlling CREATION rights based on the current date.
    canCreateNew: boolean;
    creationDisabledReason: string;
    // MODIFIED: These props are for passing the CORRECT numbering info for NEW receipts.
    currentReceiptDocNumbering: DocumentNumbering | null;
    lastReceiptNumber: number;
    trueCurrentFinancialYear: FinancialYear | null;
    // MODIFIED: This is the SESSION FY for filtering.
    activeFY: FinancialYear | null;
}
interface ExpensesTabProps extends Pick<ProfitAndLossProps, 'expenses' | 'expenseCategoriesLevel1' | 'expenseCategoriesLevel2' | 'expenseCategoriesLevel3' | 'onDeleteExpense' | 'onDeleteVoucher' | 'branches'> {
    handleOpenVoucherModal: (expensesToEdit: Expense[] | null, shouldExport?: boolean) => void;
    canCreate: boolean;
    canModify: boolean;
    // MODIFIED: Prop to control the "Create Voucher" button
    canCreateNew: boolean;
    creationDisabledReason: string;
    // MODIFIED: This is the SESSION FY for filtering.
    activeFY: FinancialYear | null;
}


// --- STANDALONE TAB COMPONENTS ---

const AnalysisTab: React.FC<AnalysisTabProps> = ({ allMembers, manualCommissions, manualIncomes, expenses, expenseCategoriesLevel1, expenseCategoriesLevel2, expenseCategoriesLevel3, insuranceTypes, manualReceipts, financialYears, activeFYId }) => {
    // --- MODIFICATION: Find the active FY object based on the ID from the session ---
    const activeFY = useMemo(() => financialYears.find(fy => fy.id === activeFYId), [financialYears, activeFYId]);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '' });
    const [incomeViewMode, setIncomeViewMode] = useState<'pie' | 'bar'>('pie');
    const [expenseViewMode, setExpenseViewMode] = useState<'pie' | 'bar'>('pie');
    
    const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

    const getPolicyTypeName = useCallback((insuranceTypeId?: string | null) => {
        if (!insuranceTypeId) return 'N/A';
        const type = insuranceTypeMap.get(insuranceTypeId);
        if (!type) return 'Unknown';
        if (type.parentId) {
            const parent = insuranceTypeMap.get(type.parentId);
            return parent ? `${parent.name} > ${type.name}` : type.name;
        }
        return type.name;
    }, [insuranceTypeMap]);

    const {
        totalIncome,
        totalExpenses,
        netProfit,
        allIncomes,
        incomeBySource,
        filteredExpenses,
        expenseByCategory,
    } = useMemo(() => {
        const inRange = (dateStr: string) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);

            if (activeFY) {
                if (d < new Date(activeFY.fromDate) || d > new Date(activeFY.toDate)) {
                    return false;
                }
            }
            
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start && d < start) return false;
            if (end && d > end) return false;

            return true;
        };

        const autoCommissions = allMembers.flatMap(m => m.policies.map(p => ({ ...p, memberName: m.name, policyTypeName: getPolicyTypeName(p.insuranceTypeId) }))).filter(p => p.commission?.status === 'Paid' && inRange(p.commission.paidDate || ''));
        const filteredManualCommissions = manualCommissions.filter(mc => inRange(mc.date));
        const filteredManualIncomes = manualIncomes.filter(mi => inRange(mi.date));
        const filteredManualReceipts = manualReceipts.filter(mr => inRange(mr.date));

        const allIncomes = [
            ...autoCommissions.map(p => ({ id: p.id, date: p.commission!.paidDate!, source: 'Auto Commission', details: `${p.memberName} - ${p.policyTypeName} - ${p.schemeName}`, amount: p.commission!.amount })),
            ...filteredManualCommissions.map(mc => {
                const member = allMembers.find(m => m.id === mc.memberId);
                const policy = member?.policies.find(p => p.id === mc.policyId);
                const policyTypeName = policy ? getPolicyTypeName(policy.insuranceTypeId) : 'N/A';
                return { id: mc.id, date: mc.date, source: 'Manual Commission', details: `${member?.name} - ${policyTypeName} - ${policy?.schemeName}`, amount: mc.amount };
            }),
            ...filteredManualIncomes.map(mi => ({ id: mi.id, date: mi.date, source: 'Other Income', details: mi.description, amount: mi.amount })),
            ...filteredManualReceipts.map(mr => ({ id: mr.id, date: mr.date, source: 'Manual Receipt', details: `Receipt from ${mr.receivedFrom}`, amount: mr.lineItems.reduce((sum, li) => sum + li.amount, 0) })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);
        
        const incomeBySource = allIncomes.reduce((acc, inc) => {
            acc[inc.source] = (acc[inc.source] || 0) + inc.amount;
            return acc;
        }, {} as Record<string, number>);
        const incomeSourceChartData = Object.entries(incomeBySource).map(([name, value]) => ({ name, value }));
        
        const filteredExpenses = expenses.filter(e => inRange(e.date));
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const l1Map = new Map(expenseCategoriesLevel1.map(c => [c.id, c.name]));

        const expenseByCategory = filteredExpenses.reduce((acc, exp) => {
            const categoryName = l1Map.get(exp.categoryLevel1Id || '') || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);
        const expenseByCategoryChartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

        const netProfit = totalIncome - totalExpenses;

        return { totalIncome, totalExpenses, netProfit, allIncomes, incomeBySource: incomeSourceChartData, filteredExpenses, expenseByCategory: expenseByCategoryChartData };
    }, [filters.startDate, filters.endDate, activeFY, allMembers, manualCommissions, manualIncomes, manualReceipts, expenses, expenseCategoriesLevel1, getPolicyTypeName]);
    
    const l1MapExp = useMemo(() => new Map(expenseCategoriesLevel1.map(c => [c.id, c.name])), [expenseCategoriesLevel1]);
    const l2MapExp = useMemo(() => new Map(expenseCategoriesLevel2.map(c => [c.id, c.name])), [expenseCategoriesLevel2]);
    const l3MapExp = useMemo(() => new Map(expenseCategoriesLevel3.map(c => [c.id, c.name])), [expenseCategoriesLevel3]);

    const getFullExpenseCategoryPathForTable = (expense: Expense): string => {
        const path = [];
        if (expense.categoryLevel1Id) path.push(l1MapExp.get(expense.categoryLevel1Id));
        if (expense.categoryLevel2Id) path.push(l2MapExp.get(expense.categoryLevel2Id));
        if (expense.categoryLevel3Id) path.push(l3MapExp.get(expense.categoryLevel3Id));
        return path.filter(Boolean).join(' > ') || 'Uncategorized';
    };

    const searchedIncomes = useMemo(() => {
        if (!filters.searchTerm) return allIncomes;
        const lowercasedSearchTerm = filters.searchTerm.toLowerCase();
        return allIncomes.filter(inc => [inc.date, inc.source, inc.details, inc.amount.toString()].some(val => String(val).toLowerCase().includes(lowercasedSearchTerm)));
    }, [allIncomes, filters.searchTerm]);

    const searchedExpenses = useMemo(() => {
        if (!filters.searchTerm) return filteredExpenses;
        const lowercasedSearchTerm = filters.searchTerm.toLowerCase();
        return filteredExpenses.filter(exp => {
            const categoryName = getFullExpenseCategoryPathForTable(exp);
            const valuesToSearch = [exp.date, categoryName, exp.paidTo || '', exp.amount.toString(), exp.description];
            return valuesToSearch.some(val => String(val).toLowerCase().includes(lowercasedSearchTerm));
        });
    }, [filteredExpenses, filters.searchTerm, getFullExpenseCategoryPathForTable]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316'];

    return (
        <div className="space-y-6">
            <FilterControls filters={filters} onFilterChange={setFilters} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Income" value={totalIncome} icon={<TrendingUp />} />
                <StatCard title="Total Expenses" value={totalExpenses} icon={<TrendingDown />} />
                <StatCard title="Net Profit / Loss" value={netProfit} icon={<IndianRupee />} isProfit={netProfit >= 0} />
            </div>
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Income Analysis</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Income by Source" viewMode={incomeViewMode} setViewMode={setIncomeViewMode}>
                            {incomeViewMode === 'pie' ? (
                                <ResponsiveContainer width="100%" height={340}>
                                    <PieChart>
                                        <Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                            {incomeBySource.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} /><Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height={340}>
                                    <BarChart data={incomeBySource} layout="vertical" margin={{ left: 120 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={120} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Amount" fill="#10B981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                        <ChartCard title="All Income Transactions">
                            <div className="h-[340px]"><DataTable data={searchedIncomes} columns={[{ header: 'Date', accessor: 'date' },{ header: 'Source', accessor: 'source' },{ header: 'Details', accessor: 'details' },{ header: 'Amount', accessor: 'amount', render: (val) => `₹${val.toLocaleString('en-IN')}` }]} /></div>
                        </ChartCard>
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Expense Analysis</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Expenses by Category" viewMode={expenseViewMode} setViewMode={setExpenseViewMode}>
                            {expenseViewMode === 'pie' ? (
                                <ResponsiveContainer width="100%" height={340}>
                                    <PieChart>
                                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                            {expenseByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} /><Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height={340}>
                                    <BarChart data={expenseByCategory} layout="vertical" margin={{ left: 120 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={120} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Amount" fill="#EF4444" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                        <ChartCard title="All Expense Transactions">
                            <div className="h-[340px]"><DataTable data={searchedExpenses} columns={[{ header: 'Date', accessor: 'date' },{ header: 'Category', accessor: 'id', render: (_, row) => getFullExpenseCategoryPathForTable(row) },{ header: 'Paid To', accessor: 'paidTo' },{ header: 'Amount', accessor: 'amount', render: (amt) => `₹${amt.toLocaleString('en-IN')}` },{ header: 'Description', accessor: 'description' }]} /></div>
                        </ChartCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IncomesTab: React.FC<IncomesTabProps> = (props) => {
    const { allMembers, manualIncomes, manualCommissions, incomeCategoriesLevel1, incomeCategoriesLevel2, currentUser, onAddManualIncome, onUpdateManualIncome, onDeleteManualIncome, onAddManualCommission, onUpdateManualCommission, onDeleteManualCommission, insuranceTypes, manualReceipts, onSaveReceipt, onDeleteManualReceipt, companyInfo, canCreate, canModify, canCreateNew, creationDisabledReason, currentReceiptDocNumbering, lastReceiptNumber, trueCurrentFinancialYear, activeFY } = props;

    const today = new Date().toISOString().split('T')[0];
    const [incomeForm, setIncomeForm] = useState({ date: today, categoryLevel1Id: '', categoryLevel2Id: '', amount: '', description: '', receivedFrom: '' });
    const [editingIncome, setEditingIncome] = useState<ManualIncome | null>(null);
    const [commissionForm, setCommissionForm] = useState({ date: today, policyId: '', amount: '', description: '' });
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [editingCommission, setEditingCommission] = useState<ManualCommission | null>(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '', insuranceTypeId: '', schemeName: '' });
    
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<ManualReceipt | null>(null);
    const [triggerReceiptExport, setTriggerReceiptExport] = useState(false);

    const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);
    const getPolicyTypeName = useCallback((insuranceTypeId?: string | null) => {
        if (!insuranceTypeId) return 'N/A';
        const type = insuranceTypeMap.get(insuranceTypeId);
        if (!type) return 'Unknown';
        if (type.parentId) {
            const parent = insuranceTypeMap.get(type.parentId);
            return parent ? `${parent.name} > ${type.name}` : type.name;
        }
        return type.name;
    }, [insuranceTypeMap]);

    const commissionIncome = useMemo(() => allMembers.flatMap(m => m.policies.map(p => ({...p, memberName: m.name, memberId: m.id, policyTypeName: getPolicyTypeName(p.insuranceTypeId)}))).filter(p => p.commission?.status === 'Paid'), [allMembers, getPolicyTypeName]);
    
    const memberPolicies = useMemo(() => {
        if (!selectedMemberId) return [];
        const member = allMembers.find(m => m.id === selectedMemberId);
        return member ? member.policies.map(p => ({...p, policyTypeName: getPolicyTypeName(p.insuranceTypeId)})) : [];
    }, [selectedMemberId, allMembers, getPolicyTypeName]);

    const customerOptions = useMemo(() => allMembers.map(m => ({ value: m.id, label: m.name })), [allMembers]);
    
    const insuranceTypeOptions = useMemo(() => insuranceTypes.filter(it => it.active).map(it => ({ value: it.id, label: getPolicyTypeName(it.id) })), [insuranceTypes, getPolicyTypeName]);
    const schemeNameOptions = useMemo(() => [...new Set(allMembers.flatMap(m => m.policies).map(p => p.schemeName).filter(Boolean))], [allMembers]);

    const level2Options = useMemo(() => incomeForm.categoryLevel1Id ? incomeCategoriesLevel2.filter(cat => cat.parentId === incomeForm.categoryLevel1Id && cat.active) : [], [incomeForm.categoryLevel1Id, incomeCategoriesLevel2]);

    const resetIncomeForm = () => {
        setIncomeForm({ date: today, categoryLevel1Id: '', categoryLevel2Id: '', amount: '', description: '', receivedFrom: '' });
        setEditingIncome(null);
    };

    const resetCommissionForm = () => {
        setCommissionForm({ date: today, policyId: '', amount: '', description: '' });
        setSelectedMemberId('');
        setEditingCommission(null);
    };

    const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setIncomeForm(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'categoryLevel1Id') { newState.categoryLevel2Id = ''; }
            return newState;
        });
    };

    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setCommissionForm({ ...commissionForm, [e.target.name]: e.target.value });
    };
    
    const handleIncomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!incomeForm.date || !incomeForm.categoryLevel1Id || !incomeForm.amount) {
            alert('Please fill in Date, an Income Category, and Amount.');
            return;
        }
        const incomeData = {
            date: incomeForm.date,
            categoryLevel1Id: incomeForm.categoryLevel1Id,
            categoryLevel2Id: incomeForm.categoryLevel2Id,
            amount: parseFloat(incomeForm.amount),
            description: incomeForm.description,
            receivedFrom: incomeForm.receivedFrom,
            createdBy: currentUser?.id || 'unknown',
        };
        if(editingIncome) {
            onUpdateManualIncome({ ...incomeData, id: editingIncome.id });
        } else {
            onAddManualIncome(incomeData);
        }
        resetIncomeForm();
    };

    const handleCommissionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commissionForm.date || !selectedMemberId || !commissionForm.policyId || !commissionForm.amount) {
            alert('Please fill all commission fields.');
            return;
        }
        const commissionData = {
            date: commissionForm.date,
            memberId: selectedMemberId,
            policyId: commissionForm.policyId,
            amount: parseFloat(commissionForm.amount),
            description: commissionForm.description,
            createdBy: currentUser?.id || 'unknown'
        };
        if (editingCommission) {
            onUpdateManualCommission({ ...commissionData, id: editingCommission.id });
        } else {
            onAddManualCommission(commissionData);
        }
        resetCommissionForm();
    };
    
    const handleEditIncome = (incomeId: string) => {
        const incomeToEdit = manualIncomes.find(i => i.id === incomeId);
        if(incomeToEdit) {
            setEditingIncome(incomeToEdit);
            setIncomeForm({
                date: incomeToEdit.date,
                categoryLevel1Id: incomeToEdit.categoryLevel1Id || '',
                categoryLevel2Id: incomeToEdit.categoryLevel2Id || '',
                amount: String(incomeToEdit.amount),
                description: incomeToEdit.description,
                receivedFrom: incomeToEdit.receivedFrom || ''
            });
        }
    };

    const handleEditCommission = (commissionId: string) => {
        const commissionToEdit = manualCommissions.find(c => c.id === commissionId);
        if(commissionToEdit) {
            setEditingCommission(commissionToEdit);
            setSelectedMemberId(commissionToEdit.memberId);
            setCommissionForm({
                date: commissionToEdit.date,
                policyId: commissionToEdit.policyId,
                amount: String(commissionToEdit.amount),
                description: commissionToEdit.description
            });
        }
    };

    const handleDeleteIncome = (incomeId: string) => {
        if(window.confirm('Are you sure you want to delete this income record?')) {
            onDeleteManualIncome(incomeId);
        }
    };

    const handleDeleteCommission = (commissionId: string) => {
        if(window.confirm('Are you sure you want to delete this commission record?')) {
            onDeleteManualCommission(commissionId);
        }
    };

    const handleOpenReceiptModal = (receipt: ManualReceipt | null = null, shouldExport: boolean = false) => {
        setEditingReceipt(receipt);
        setTriggerReceiptExport(shouldExport);
        setIsReceiptModalOpen(true);
    };

    const handleDeleteReceipt = (receiptId: string) => {
        if (window.confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
            onDeleteManualReceipt(receiptId);
        }
    };

    const level1Map = useMemo(() => new Map(incomeCategoriesLevel1.map(c => [c.id, c.name])), [incomeCategoriesLevel1]);
    const level2Map = useMemo(() => new Map(incomeCategoriesLevel2.map(c => [c.id, c.name])), [incomeCategoriesLevel2]);

    const getFullCategoryPath = (income: ManualIncome): string => {
        const path = [];
        if (income.categoryLevel1Id) path.push(level1Map.get(income.categoryLevel1Id));
        if (income.categoryLevel2Id) path.push(level2Map.get(income.categoryLevel2Id));
        return path.filter(Boolean).join(' > ');
    };

    const inRange = useCallback((dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);

        if (activeFY) {
            if (d < new Date(activeFY.fromDate) || d > new Date(activeFY.toDate)) {
                return false;
            }
        }
        
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        if (start && d < start) return false;
        if (end && d > end) return false;

        return true;
    }, [activeFY, filters.startDate, filters.endDate]);

    const filteredManualIncomes = useMemo(() => {
        return manualIncomes.filter(inc => {
            if (!inRange(inc.date)) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const categoryName = getFullCategoryPath(inc) || '';
                const valuesToSearch = [inc.date, categoryName, inc.receivedFrom || '', inc.amount.toString(), inc.description];
                return valuesToSearch.some(val => val.toLowerCase().includes(searchTerm));
            }
            return true;
        });
    }, [manualIncomes, filters.searchTerm, inRange, getFullCategoryPath]);

    const filteredManualCommissions = useMemo(() => {
        return manualCommissions.filter(comm => {
            if (!inRange(comm.date)) return false;

            const policy = allMembers.find(m => m.id === comm.memberId)?.policies.find(p => p.id === comm.policyId);
            const type = policy?.insuranceTypeId ? insuranceTypeMap.get(policy.insuranceTypeId) : null;

            if (filters.insuranceTypeId) {
                if (!type) return false;
                if (type.id !== filters.insuranceTypeId && type.parentId !== filters.insuranceTypeId) return false;
            }
            if (filters.schemeName && policy?.schemeName !== filters.schemeName) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const memberName = allMembers.find(m => m.id === comm.memberId)?.name || '';
                const policyName = policy?.schemeName || '';
                const policyTypeName = policy ? getPolicyTypeName(policy.insuranceTypeId) : '';
                 const valuesToSearch = [comm.date, memberName, policyTypeName, policyName, comm.amount.toString(), comm.description];
                return valuesToSearch.some(val => val.toLowerCase().includes(searchTerm));
            }
            return true;
        });
    }, [manualCommissions, filters, allMembers, insuranceTypeMap, inRange, getPolicyTypeName]);
    
    const filteredCommissionIncome = useMemo(() => {
        return commissionIncome.filter(p => { 
            if (!inRange(p.commission?.paidDate || '')) return false;

            const type = p.insuranceTypeId ? insuranceTypeMap.get(p.insuranceTypeId) : null;
            if (filters.insuranceTypeId) {
                if (!type) return false;
                if (type.id !== filters.insuranceTypeId && type.parentId !== filters.insuranceTypeId) return false;
            }
            if (filters.schemeName && p.schemeName !== filters.schemeName) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const valuesToSearch = [p.memberName, p.schemeName || '', p.policyTypeName || '', p.premium.toString(), p.coverage.toString(), p.commission?.paidDate || '', p.commission?.amount.toString() || ''];
                return valuesToSearch.some(val => String(val).toLowerCase().includes(searchTerm));
            }
            return true;
        });
    }, [commissionIncome, filters, insuranceTypeMap, inRange]);
    
    const filteredManualReceipts = useMemo(() => {
        return manualReceipts.filter(rec => {
            if (!inRange(rec.date)) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const totalAmount = rec.lineItems.reduce((sum, li) => sum + li.amount, 0).toString();
                const descriptions = rec.lineItems.map(li => li.description).join(' ');
                const paymentModes = rec.lineItems.map(li => li.paymentMode).join(' ');

                const valuesToSearch = [rec.receiptNo, rec.date, rec.receivedFrom, rec.address || '', totalAmount, descriptions, paymentModes];
                return valuesToSearch.some(val => val.toLowerCase().includes(searchTerm));
            }
            return true;
        });
    }, [manualReceipts, filters, inRange]);

    const totalAutoCommission = useMemo(() => filteredCommissionIncome.reduce((sum, p) => sum + (p.commission?.amount || 0), 0), [filteredCommissionIncome]);
    const totalManualCommission = useMemo(() => filteredManualCommissions.reduce((sum, c) => sum + c.amount, 0), [filteredManualCommissions]);
    const totalOtherIncome = useMemo(() => filteredManualIncomes.reduce((sum, i) => sum + i.amount, 0), [filteredManualIncomes]);
    const totalManualReceipts = useMemo(() => filteredManualReceipts.reduce((sum, r) => sum + r.lineItems.reduce((liSum, li) => liSum + li.amount, 0), 0), [filteredManualReceipts]);
    const grandTotalIncome = totalAutoCommission + totalManualCommission + totalOtherIncome + totalManualReceipts;
    
    const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
                    <StatCard title="Total Automated Commission" value={totalAutoCommission} icon={<TrendingUp />} />
                    <StatCard title="Total Manual Commission" value={totalManualCommission} icon={<TrendingUp />} />
                    <StatCard title="Total Other Income" value={totalOtherIncome} icon={<TrendingUp />} />
                    <StatCard title="Grand Total Income" value={grandTotalIncome} icon={<IndianRupee />} isProfit={true} />
                </div>
                {/* --- MODIFICATION START: Disable button based on new rules --- */}
                <div className="ml-6 flex-shrink-0">
                    <Button 
                        onClick={() => handleOpenReceiptModal(null)}
                        disabled={!canCreate || !canCreateNew}
                        title={!canCreateNew ? creationDisabledReason : "Create a new receipt"}
                    >
                        <FilePlus2 size={16} /> Create Receipt
                    </Button>
                </div>
                {/* --- MODIFICATION END --- */}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <FilterControls
                    filters={filters}
                    onFilterChange={setFilters}
                    insuranceTypeOptions={insuranceTypeOptions}
                    schemeNameOptions={schemeNameOptions}
                />
            </div>
            {/* --- MODIFICATION START: Disable forms based on new rules --- */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${(!canCreate || !canCreateNew) ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 relative">
                    {!canCreateNew && <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-800/50 z-10"></div>}
                    <h3 className="text-lg font-semibold mb-4">{editingIncome ? 'Edit' : 'Log'} Other Manual Income</h3>
                    <form onSubmit={handleIncomeSubmit} className="space-y-4">
                        <Input label="Date" type="date" name="date" value={incomeForm.date} onChange={handleIncomeChange} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Category</label>
                            <select name="categoryLevel1Id" value={incomeForm.categoryLevel1Id} onChange={handleIncomeChange} className={selectClasses} required>
                                <option value="">Select Income Category...</option>
                                {incomeCategoriesLevel1.filter(c => c.active).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        {incomeForm.categoryLevel1Id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Head</label>
                                <select name="categoryLevel2Id" value={incomeForm.categoryLevel2Id} onChange={handleIncomeChange} className={selectClasses} disabled={level2Options.length === 0}>
                                    <option value="">{level2Options.length === 0 ? "No sub-categories available" : "Select Income Head..."}</option>
                                    {level2Options.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        )}
                        <Input label="Amount (₹)" type="number" name="amount" value={incomeForm.amount} onChange={handleIncomeChange} required />
                        <Input label="Received From (Optional)" name="receivedFrom" value={incomeForm.receivedFrom} onChange={handleIncomeChange} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea name="description" value={incomeForm.description} onChange={handleIncomeChange} placeholder="Description..." className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white" rows={3}/>
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit" className="w-full" variant={editingIncome ? 'success' : 'primary'}><Plus size={16}/> {editingIncome ? 'Update Income' : 'Add Income'}</Button>
                            {editingIncome && <Button type="button" onClick={resetIncomeForm} className="w-full" variant="secondary">Cancel</Button>}
                        </div>
                    </form>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 relative">
                    {!canCreateNew && <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-800/50 z-10"></div>}
                    <h3 className="text-lg font-semibold mb-4">{editingCommission ? 'Edit' : 'Log'} Manual Commission</h3>
                    <form onSubmit={handleCommissionSubmit} className="space-y-4">
                        <Input label="Date" type="date" name="date" value={commissionForm.date} onChange={handleCommissionChange} required />
                        <SearchableSelect label="Customer" options={customerOptions} value={selectedMemberId} onChange={(value) => { setSelectedMemberId(value); setCommissionForm(prev => ({ ...prev, policyId: ''})); }} placeholder="Select Customer..." />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy</label>
                            <select name="policyId" value={commissionForm.policyId} onChange={handleCommissionChange} className={selectClasses} required disabled={!selectedMemberId || memberPolicies.length === 0}>
                                <option value="">{memberPolicies.length === 0 ? "No policies found" : "Select Policy..."}</option>
                                {memberPolicies.map(pol => <option key={pol.id} value={pol.id}>{pol.policyTypeName} - {pol.schemeName || 'Unnamed Policy'}</option>)}
                            </select>
                        </div>
                        <Input label="Commission Amount (₹)" type="number" name="amount" value={commissionForm.amount} onChange={handleCommissionChange} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea name="description" value={commissionForm.description} onChange={handleCommissionChange} placeholder="Description..." className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white" rows={3}/>
                        </div>
                         <div className="flex gap-4">
                            <Button type="submit" className="w-full" variant={editingCommission ? 'success' : 'primary'}><Plus size={16}/> {editingCommission ? 'Update Commission' : 'Add Commission'}</Button>
                            {editingCommission && <Button type="button" onClick={resetCommissionForm} className="w-full" variant="secondary">Cancel</Button>}
                        </div>
                    </form>
                </div>
            </div>
            {/* --- MODIFICATION END --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Other Manual Income Log</h3>
                    <div className="h-96">
                        <DataTable data={filteredManualIncomes} columns={[
                            { header: 'Date', accessor: 'date' },
                            { header: 'Income Source', accessor: 'id', render: (_, row) => getFullCategoryPath(row) },
                            { header: 'Amount', accessor: 'amount', render: (val) => `₹${val.toLocaleString('en-IN')}` },
                            { header: 'Actions', accessor: 'id', render: (id) => (
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditIncome(id)} className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={!canModify}><Edit2 size={16}/></button>
                                    <button onClick={() => handleDeleteIncome(id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={!canModify}><Trash2 size={16}/></button>
                                </div>
                            )}
                        ]} />
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Manual Commission Log</h3>
                    <div className="h-96">
                        <DataTable data={filteredManualCommissions} columns={[
                            { header: 'Date', accessor: 'date' },
                            { header: 'Customer', accessor: 'memberId', render: (val) => allMembers.find(m => m.id === val)?.name || 'N/A' },
                            { header: 'Policy Type', accessor: 'policyId', render: (_, row) => {
                                const member = allMembers.find(m => m.id === row.memberId);
                                const policy = member?.policies.find(p => p.id === row.policyId);
                                return policy ? getPolicyTypeName(policy.insuranceTypeId) : 'N/A';
                            }},
                            { header: 'Amount', accessor: 'amount', render: (val) => `₹${val.toLocaleString('en-IN')}` },
                            { header: 'Actions', accessor: 'id', render: (id) => (
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditCommission(id)} className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={!canModify}><Edit2 size={16}/></button>
                                    <button onClick={() => handleDeleteCommission(id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={!canModify}><Trash2 size={16}/></button>
                                </div>
                            )}
                        ]} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Automated Commission Income (Read-Only)</h3>
                <div className="h-96">
                    <DataTable data={filteredCommissionIncome} columns={[
                            { header: 'Customer', accessor: 'memberName' },
                            { header: 'Policy Type', accessor: 'policyTypeName' },
                            { header: 'Paid On', accessor: 'commission', render: (val) => val.paidDate || 'N/A' },
                            { header: 'Commission', accessor: 'commission', render: (val) => `₹${val.amount.toLocaleString('en-IN')}` },
                        ]} />
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Manual Receipt Log</h3>
                <div className="h-96">
                    <DataTable data={filteredManualReceipts} columns={[
                        { header: 'Receipt #', accessor: 'receiptNo' },
                        { header: 'Date', accessor: 'date' },
                        { header: 'Received From', accessor: 'receivedFrom' },
                        { header: 'Amount', accessor: 'lineItems', render: (items) => `₹${items.reduce((sum: number, i: any) => sum + i.amount, 0).toLocaleString('en-IN')}` },
                        { header: 'Actions', accessor: 'id', render: (id, row) => (
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenReceiptModal(row, false)} className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400" title="Edit Receipt" disabled={!canModify}><Edit2 size={16}/></button>
                                <button onClick={() => handleDeleteReceipt(id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400" title="Delete Receipt" disabled={!canModify}><Trash2 size={16}/></button>
                                <button onClick={() => handleOpenReceiptModal(row, true)} className="p-1 text-green-600 hover:text-green-800" title="Download Receipt"><Download size={16}/></button>
                            </div>
                        )}
                    ]} />
                </div>
            </div>
            
            {isReceiptModalOpen && (
                <ManualReceiptModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    companyInfo={companyInfo}
                    currentUser={currentUser}
                    // --- MODIFICATION: Pass the TRUE current FY id for saving new receipts ---
                    activeFinancialYearId={trueCurrentFinancialYear?.id || null}
                    docNumberingConfig={currentReceiptDocNumbering}
                    lastReceiptNumber={lastReceiptNumber}
                    onSave={onSaveReceipt}
                    receiptToEdit={editingReceipt}
                    triggerExport={triggerReceiptExport}
                />
            )}
        </div>
    );
};

const ExpensesTab: React.FC<ExpensesTabProps> = ({ expenses, expenseCategoriesLevel1, expenseCategoriesLevel2, expenseCategoriesLevel3, onDeleteExpense, onDeleteVoucher, handleOpenVoucherModal, canCreate, canModify, branches, canCreateNew, creationDisabledReason, activeFY }) => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '', branch_id: 'all' });
    const { items: sortedItems, requestSort, sortConfig } = useSortableData(expenses);

    const handleDelete = (item: Expense) => {
         if(window.confirm('Are you sure you want to delete this expense record?')) {
            onDeleteExpense(item.id);
        }
    };

    const handleDeleteVoucherClick = (voucherNo: string) => {
        if(window.confirm(`Are you sure you want to delete Voucher ${voucherNo}? This will delete all associated expenses.`)) {
            onDeleteVoucher(voucherNo);
        }
    };

    const l1Map = useMemo(() => new Map(expenseCategoriesLevel1.map(c => [c.id, c.name])), [expenseCategoriesLevel1]);
    const l2Map = useMemo(() => new Map(expenseCategoriesLevel2.map(c => [c.id, c.name])), [expenseCategoriesLevel2]);
    const l3Map = useMemo(() => new Map(expenseCategoriesLevel3.map(c => [c.id, c.name])), [expenseCategoriesLevel3]);

    const getFullExpenseCategoryPath = (expense: Expense): string => {
        const path = [];
        if (expense.categoryLevel1Id) path.push(l1Map.get(expense.categoryLevel1Id));
        if (expense.categoryLevel2Id) path.push(l2Map.get(expense.categoryLevel2Id));
        if (expense.categoryLevel3Id) path.push(l3Map.get(expense.categoryLevel3Id));
        return path.filter(Boolean).join(' > ') || 'Uncategorized';
    };
    
    const filteredExpenses = useMemo(() => {
        return sortedItems.filter(exp => {
            // --- MODIFICATION: Correctly filter by SESSION FY for viewing data ---
            if (activeFY) {
                const expDate = new Date(exp.date);
                if (expDate < new Date(activeFY.fromDate) || expDate > new Date(activeFY.toDate)) {
                    return false;
                }
            }

            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (startDate && new Date(exp.date) < startDate) return false;
            if (endDate && new Date(exp.date) > endDate) return false;

            if (filters.branch_id !== 'all' && exp.branch_id !== filters.branch_id) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const categoryName = getFullExpenseCategoryPath(exp);
                const valuesToSearch = [
                    exp.date, 
                    categoryName, 
                    exp.paidTo || '', 
                    exp.amount.toString(), 
                    exp.description, 
                    exp.voucherNo || '',
                    exp.expenseHead || '',
                    exp.modeOfPayment || ''
                ];
                return valuesToSearch.some(val => String(val).toLowerCase().includes(searchTerm));
            }
            return true;
        });
    }, [sortedItems, filters, activeFY, getFullExpenseCategoryPath]);
    
    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), [filteredExpenses]);


    return (
        <div className="space-y-6">
            {/* --- MODIFICATION START: Disable button based on new rules --- */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Payment Voucher</h3>
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => handleOpenVoucherModal(null)} 
                        disabled={!canCreate || !canCreateNew}
                        title={!canCreateNew ? creationDisabledReason : "Create a new voucher"}
                    >
                        <FilePlus2 size={16} />
                        Create Voucher
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create a new manual or auto-generated voucher from the voucher screen.</p>
                </div>
            </div>
            {/* --- MODIFICATION END --- */}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
                <h3 className="text-lg font-semibold mb-4">Expense Log</h3>
                <div className="my-4">
                    <StatCard title="Total Filtered Expenses" value={totalExpenses} icon={<TrendingDown />} />
                </div>
                <FilterControls filters={filters} onFilterChange={setFilters} branches={branches} />
                <div className="flex-grow overflow-y-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">SNO</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                    <button onClick={() => requestSort('date')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white">Date <ArrowUpDown size={12} /></button>
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                    <button onClick={() => requestSort('voucherNo')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white">Voucher # <ArrowUpDown size={12} /></button>
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                    <button onClick={() => requestSort('expenseHead')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white">Expense Head <ArrowUpDown size={12} /></button>
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                    <button onClick={() => requestSort('description')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white">Description <ArrowUpDown size={12} /></button>
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                     <button onClick={() => requestSort('paidTo')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white">Paid To <ArrowUpDown size={12} /></button>
                                </th>
                                                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                    <button onClick={() => requestSort('modeOfPayment')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white">Mode of Payment <ArrowUpDown size={12} /></button>
                                </th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                                    <button onClick={() => requestSort('amount')} className="flex items-center gap-1 ml-auto hover:text-gray-700 dark:hover:text-white">Amount <ArrowUpDown size={12} /></button>
                                </th>
                                <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredExpenses.map((exp, index) => {
                                const allVoucherExpenses = exp.voucherNo ? expenses.filter(e => e.voucherNo === exp.voucherNo) : [exp];
                                return (
                                    <tr key={exp.id}>
                                        <td className="px-4 py-2">{index + 1}</td>
                                        <td className="px-4 py-2">{exp.date}</td>
                                        <td className="px-4 py-2 font-mono">{exp.voucherNo || 'N/A'}</td>
                                        <td className="px-4 py-2">{exp.expenseHead || getFullExpenseCategoryPath(exp)}</td>
                                        <td className="px-4 py-2">{exp.description}</td>
                                        <td className="px-4 py-2">{exp.paidTo}</td>
                                        <td className="px-4 py-2">{exp.modeOfPayment || 'N/A'}</td>
                                        <td className="px-4 py-2 text-right">₹{exp.amount.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex justify-center gap-3">
                                                {exp.voucherNo ? (
                                                    <>
                                                        <button onClick={() => handleOpenVoucherModal(allVoucherExpenses, false)} className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed" title="Edit Voucher" disabled={!canModify}><Edit2 size={16}/></button>
                                                        <button onClick={() => handleDeleteVoucherClick(exp.voucherNo!)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed" title="Delete Voucher" disabled={!canModify}><Trash2 size={16}/></button>
                                                        <button onClick={() => handleOpenVoucherModal(allVoucherExpenses, true)} className="p-1 text-green-600 hover:text-green-800" title="Download Voucher"><Download size={16}/></button>
                                                    </>
                                                ) : (
                                                    <>
                                                       <button disabled className="p-1 text-gray-400 cursor-not-allowed" title="Create a voucher to edit this expense"><Edit2 size={16}/></button>
                                                       <button onClick={() => handleDelete(exp)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed" title="Delete Expense" disabled={!canModify}><Trash2 size={16}/></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Helper Sub-Components (Defined globally within the file) ---

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; isProfit?: boolean }> = ({ title, value, icon, isProfit }) => {
    const valueColor = isProfit === undefined ? 'text-gray-800 dark:text-white' : isProfit ? 'text-green-600' : 'text-red-600';
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className={`text-2xl font-bold ${valueColor}`}>₹{value.toLocaleString('en-IN')}</p>
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

const DataTable: React.FC<{ data: any[]; columns: { header: string; accessor: string; render?: (value: any, row: any) => React.ReactNode }[] }> = ({ data, columns }) => {
    const { items, requestSort, sortConfig } = useSortableData(data);
    
    return (
        <div className="h-full overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                    <tr>
                        {columns.map(col => (
                            <th key={col.header} className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                                <button onClick={() => requestSort(col.accessor)} className="flex items-center gap-2 hover:text-gray-800 dark:hover:text-gray-200">
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
                            <tr key={`${row.id || 'row'}-${index}`}>
                                {columns.map((col, colIndex) => (
                                    <td key={`${col.accessor}-${index}-${colIndex}`} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const FilterControls: React.FC<{
    filters: any,
    onFilterChange: (filters: any) => void,
    insuranceTypeOptions?: { value: string; label: string }[],
    schemeNameOptions?: string[],
    branches?: Branch[],
}> = ({ filters, onFilterChange, insuranceTypeOptions, schemeNameOptions, branches }) => {
    const hasPolicyFilters = insuranceTypeOptions || schemeNameOptions;
    const gridCols = `lg:grid-cols-${3 + (hasPolicyFilters ? 2 : 0) + (branches ? 1 : 0)}`;


    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg`}>
            <Input 
                label="Start Date" 
                type="date" 
                value={filters.startDate} 
                onChange={e => onFilterChange({...filters, startDate: e.target.value})} 
            />
            <Input 
                label="End Date" 
                type="date" 
                value={filters.endDate} 
                onChange={e => onFilterChange({...filters, endDate: e.target.value})}
            />
            {branches && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                    <select
                        value={filters.branch_id}
                        onChange={e => onFilterChange({ ...filters, branch_id: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="all">All Branches</option>
                        {branches.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.branch_name}</option>
                        ))}
                    </select>
                </div>
            )}
            <div className="relative md:col-span-1">
                <Input 
                    label="Search" 
                    type="text" 
                    value={filters.searchTerm} 
                    onChange={e => onFilterChange({...filters, searchTerm: e.target.value})}
                    placeholder="Search in tables..."
                    className="pl-10"
                />
                <Search className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
            </div>
            {insuranceTypeOptions && (
                 <SearchableSelect
                    label="Insurance Type"
                    options={[{ value: '', label: 'All Types' }, ...insuranceTypeOptions]}
                    value={filters.insuranceTypeId}
                    onChange={value => onFilterChange({ ...filters, insuranceTypeId: value })}
                    placeholder="Select Insurance Type..."
                 />
            )}
            {schemeNameOptions && (
                 <SearchableSelect
                    label="Policy Scheme"
                    options={[{ value: '', label: 'All Schemes' }, ...schemeNameOptions.map(opt => ({ value: opt, label: opt }))]}
                    value={filters.schemeName}
                    onChange={value => onFilterChange({ ...filters, schemeName: value })}
                    placeholder="Select Policy Scheme..."
                />
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
const ProfitAndLoss: React.FC<ProfitAndLossProps> = (props) => {
    // --- MODIFICATION START: Destructure new props and calculate permissions ---
    const { 
        permissions, 
        activeFinancialYearId, 
        financialYears,
        trueCurrentFinancialYear,
        currentVoucherDocNumbering,
        currentReceiptDocNumbering
    } = props;

    const [activeTab, setActiveTab] = useState<PnLTab>('analysis');
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [editingVoucherExpenses, setEditingVoucherExpenses] = useState<Expense[] | null>(null);
    const [triggerExport, setTriggerExport] = useState(false);

    const canView = permissions.profitAndLoss !== 'none';
    const canCreate = permissions.profitAndLoss === 'create' || permissions.profitAndLoss === 'modify';
    const canModify = permissions.profitAndLoss === 'modify';

    // Rule 1: Is there an active FY for today's date?
    const isCreationAllowedByDate = !!trueCurrentFinancialYear;
    // Rule 2: Is the user's current session the same as the true current FY?
    const isSessionInCurrentFY = activeFinancialYearId === trueCurrentFinancialYear?.id;

    const canCreateNew = isCreationAllowedByDate && isSessionInCurrentFY;

    const creationDisabledReason = useMemo(() => {
        if (!isCreationAllowedByDate) {
            return "Cannot create: The current date is outside of any active financial year. Please create a new FY in Master Data.";
        }
        if (!isSessionInCurrentFY) {
            const currentFYLabel = trueCurrentFinancialYear?.finYear || 'the current one';
            return `Cannot create: Your session is in a past financial year. Please log in to the ${currentFYLabel} to create new documents.`;
        }
        return "";
    }, [isCreationAllowedByDate, isSessionInCurrentFY, trueCurrentFinancialYear]);
    
    // Find the FY object for the user's SESSION (for filtering)
    const activeFYForSession = useMemo(() => financialYears.find(fy => fy.id === activeFinancialYearId) || null, [financialYears, activeFinancialYearId]);
    // --- MODIFICATION END ---


    const handleOpenVoucherModal = (expensesToEdit: Expense[] | null = null, shouldExport: boolean = false) => {
        setEditingVoucherExpenses(expensesToEdit);
        setTriggerExport(shouldExport);
        setIsVoucherModalOpen(true);
    };

    const TabButton = ({ label, tabName }: { label: string, tabName: PnLTab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tabName ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                <Lock size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Permission Denied</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">You do not have permission to view the Profit & Loss section.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Profit & Loss</h2>
                {/* --- NEW: Display a warning if creation is blocked --- */}
                {!canCreateNew && canCreate && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                        <Info size={20} className="text-yellow-600 dark:text-yellow-300"/>
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">{creationDisabledReason}</span>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700 inline-flex items-center gap-2">
                <TabButton label="Analysis" tabName="analysis" />
                <TabButton label="Income Details" tabName="incomes" />
                <TabButton label="Expense Details" tabName="expenses" />
            </div>
            <div className="mt-4">
                {activeTab === 'analysis' && <AnalysisTab {...props} activeFYId={activeFinancialYearId} />}
                {activeTab === 'incomes' && <IncomesTab {...props} canCreate={canCreate} canModify={canModify} canCreateNew={canCreateNew} creationDisabledReason={creationDisabledReason} activeFY={activeFYForSession} />}
                {activeTab === 'expenses' && <ExpensesTab {...props} handleOpenVoucherModal={handleOpenVoucherModal} canCreate={canCreate} canModify={canModify} canCreateNew={canCreateNew} creationDisabledReason={creationDisabledReason} activeFY={activeFYForSession} />}
            </div>

            {isVoucherModalOpen && (
                <PaymentVoucherModal
                    isOpen={isVoucherModalOpen}
                    onClose={() => setIsVoucherModalOpen(false)}
                    companyInfo={props.companyInfo}
                    branches={props.branches}
                    expenseCategoriesLevel1={props.expenseCategoriesLevel1}
                    expenseCategoriesLevel2={props.expenseCategoriesLevel2}
                    expenseCategoriesLevel3={props.expenseCategoriesLevel3}
                    lastVoucherNumber={props.lastVoucherNumber}
                    onSave={props.onSaveVoucher}
                    voucherToEdit={editingVoucherExpenses}
                    triggerExport={triggerExport}
                    canCreate={canCreate}
                    canModify={canModify}
                    // --- MODIFICATION: Pass the TRUE current FY for saving new vouchers ---
                    activeFinancialYearId={trueCurrentFinancialYear?.id || null}
                    docNumberingConfig={currentVoucherDocNumbering}
                />
            )}
        </div>
    );
};

export default ProfitAndLoss;