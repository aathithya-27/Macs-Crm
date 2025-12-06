import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Member, Expense, ManualIncome, User, IncomeCategoryLevel1, IncomeCategoryLevel2, 
    ExpenseCategoryLevel1, ExpenseCategoryLevel2, Company, 
    ManualCommission, Branch, InsuranceTypeMaster, AppModule, PermissionLevel, 
    DocumentNumbering, ManualReceipt, FinancialYear, BankMaster, DayBookEntry, OpeningBalance 
} from '../types.ts';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { 
    IndianRupee, TrendingUp, TrendingDown, Download, BarChart2, PieChart as PieChartIcon, 
    Search, ArrowUpDown, FilePlus2, Edit2, Trash2, Lock, Info, FileText, Printer, X, Save, User as UserIcon, Users as UsersIcon 
} from 'lucide-react';
import PaymentVoucherModal, { VoucherSaveData } from './PaymentVoucherModal.tsx';
import ManualReceiptModal, { ReceiptSaveData } from './ManualReceiptModal.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type PnLTab = 'analysis' | 'incomes' | 'expenses' | 'daybook' | 'openingBalance';

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


const useSortableData = (items: any[], config = null) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const getNestedValue = (obj: any, path: string) => {
                    return path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
                };

                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);

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



interface IncomeAndExpenseProps {
    allMembers: Member[];
    users: User[];
    bankMasters: BankMaster[];
    expenses: Expense[];
    manualIncomes: ManualIncome[];
    manualCommissions: ManualCommission[];
    manualReceipts: ManualReceipt[];
    openingBalances: OpeningBalance[]; 
    onSaveReceipt: (receipt: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string }) => void;
    onDeleteManualReceipt: (receiptId: string) => void; 
    expenseCategoriesLevel1: ExpenseCategoryLevel1[];
    expenseCategoriesLevel2: ExpenseCategoryLevel2[];
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
    onAddOpeningBalance: (data: Omit<OpeningBalance, 'id' | 'createdAt'>) => void;
    onUpdateOpeningBalance: (data: OpeningBalance) => void;
    onDeleteOpeningBalance: (id: string) => void;
    currentUser: User | null;
    companyInfo: Company | null;
    branches: Branch[];
    onSaveVoucher: (data: VoucherSaveData) => void;
    insuranceTypes: InsuranceTypeMaster[];
    permissions: { [key in AppModule]?: PermissionLevel };
    
    activeFinancialYearId: string | null; 
    financialYears: FinancialYear[];
    trueCurrentFinancialYear: FinancialYear | null; 
    currentVoucherDocNumbering: DocumentNumbering | null;
    currentReceiptDocNumbering: DocumentNumbering | null;
    lastVoucherNumber: number; 
    lastReceiptNumber: number; 
}

interface AnalysisTabProps extends Pick<IncomeAndExpenseProps, 'expenses' | 'manualReceipts' | 'financialYears'> {
    activeFYId: string | null;
}

interface IncomesTabProps extends Pick<IncomeAndExpenseProps, 'allMembers' | 'users' | 'bankMasters' | 'incomeCategoriesLevel1' | 'incomeCategoriesLevel2' | 'currentUser' | 'insuranceTypes' | 'manualReceipts' | 'onSaveReceipt' | 'onDeleteManualReceipt' | 'companyInfo' | 'branches'> {
    canCreate: boolean;
    canModify: boolean;
    canCreateNew: boolean;
    creationDisabledReason: string;
    currentReceiptDocNumbering: DocumentNumbering | null;
    lastReceiptNumber: number;
    trueCurrentFinancialYear: FinancialYear | null;
    activeFY: FinancialYear | null;
}

interface ExpensesTabProps extends Pick<IncomeAndExpenseProps, 'expenses' | 'expenseCategoriesLevel1' | 'expenseCategoriesLevel2' | 'onDeleteExpense' | 'onDeleteVoucher' | 'branches' | 'allMembers' | 'users' | 'bankMasters' | 'onUpdateExpense'> {
    handleOpenVoucherModal: (expensesToEdit: Expense[] | null, shouldExport?: boolean) => void;
    canCreate: boolean;
    canModify: boolean;
    canCreateNew: boolean;
    creationDisabledReason: string;
    activeFY: FinancialYear | null;
}



const AnalysisTab: React.FC<AnalysisTabProps> = ({ expenses, manualReceipts, financialYears, activeFYId }) => {
    const activeFY = useMemo(() => financialYears.find(fy => fy.id === activeFYId), [financialYears, activeFYId]);
    const [incomeViewMode, setIncomeViewMode] = useState<'pie' | 'bar'>('pie');
    const [expenseViewMode, setExpenseViewMode] = useState<'pie' | 'bar'>('pie');
    

    const { totalReceipts, totalExpenses, netFlow, expensesByCategory, incomeByCategory, flattenedIncomes } = useMemo(() => {
        let receipts = manualReceipts;
        let expenseList = expenses;

        if (activeFY) {
            const start = new Date(activeFY.fromDate);
            const end = new Date(activeFY.toDate);
            receipts = receipts.filter(r => { const d = new Date(r.date); return d >= start && d <= end; });
            expenseList = expenseList.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
        }

        const totalRec = receipts.reduce((sum, r) => sum + r.lineItems.reduce((s, i) => s + i.amount, 0), 0);
        const totalExp = expenseList.reduce((sum, e) => sum + e.amount, 0);


        const expCat: Record<string, number> = {};
        expenseList.forEach(e => {
            const head = e.expenseHead || 'Uncategorized';
            expCat[head] = (expCat[head] || 0) + e.amount;
        });


        const incCat: Record<string, number> = {};
        const flatIncomes: any[] = [];

        receipts.forEach(r => {
            r.lineItems.forEach(i => {
                const cat = i.incomeCategory || 'Uncategorized';
                incCat[cat] = (incCat[cat] || 0) + i.amount;
                
                flatIncomes.push({
                    id: `${r.id}-${i.id}`,
                    date: r.date,
                    receiptNo: r.receiptNo,
                    category: i.incomeCategory,
                    details: i.description,
                    amount: i.amount
                });
            });
        });

        flatIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            totalReceipts: totalRec,
            totalExpenses: totalExp,
            netFlow: totalRec - totalExp,
            expensesByCategory: Object.entries(expCat).map(([name, value]) => ({ name, value })),
            incomeByCategory: Object.entries(incCat).map(([name, value]) => ({ name, value })),
            flattenedIncomes: flatIncomes
        };
    }, [expenses, manualReceipts, activeFY]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Receipts" value={totalReceipts} icon={<TrendingUp />} isProfit={true} />
                <StatCard title="Total Expenses" value={totalExpenses} icon={<TrendingDown />} />
                <StatCard title="Net Flow" value={netFlow} icon={<IndianRupee />} isProfit={netFlow >= 0} />
            </div>
            
            {/* Income Analysis Section */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Income Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Income by Category" viewMode={incomeViewMode} setViewMode={setIncomeViewMode}>
                        {incomeViewMode === 'pie' ? (
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                        {incomeByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} /><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={incomeByCategory} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Amount" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    <ChartCard title="Recent Income Transactions">
                        <div className="h-[340px]">
                            <DataTable 
                                data={flattenedIncomes} 
                                columns={[
                                    { header: 'Date', accessor: 'date' },
                                    { header: 'Category', accessor: 'category' },
                                    { header: 'Details', accessor: 'details' },
                                    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val.toLocaleString('en-IN')}` }
                                ]} 
                            />
                        </div>
                    </ChartCard>
                </div>
            </div>


            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Expense Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Expenses by Head" viewMode={expenseViewMode} setViewMode={setExpenseViewMode}>
                        {expenseViewMode === 'pie' ? (
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                        {expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} /><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={expensesByCategory} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Amount" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>


                    <ChartCard title="Recent Expense Transactions">
                        <div className="h-[340px]">
                            <DataTable 
                                data={expenses} 
                                columns={[
                                    { header: 'Date', accessor: 'date' },
                                    { header: 'Head', accessor: 'expenseHead' },
                                    { header: 'Paid To', accessor: 'paidTo' },
                                    { header: 'Amount', accessor: 'amount', render: (amt) => `₹${amt.toLocaleString('en-IN')}` }
                                ]} 
                            />
                        </div>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

const IncomesTab: React.FC<IncomesTabProps> = (props) => {
    const { 
        allMembers, users, bankMasters, manualReceipts, 
        incomeCategoriesLevel1, incomeCategoriesLevel2,
        onSaveReceipt, onDeleteManualReceipt, companyInfo, currentUser,
        canCreate, canModify, canCreateNew, creationDisabledReason, 
        currentReceiptDocNumbering, lastReceiptNumber, trueCurrentFinancialYear, activeFY, branches 
    } = props;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '', branch_id: 'all' });
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState<ManualReceipt | null>(null);
    const [triggerReceiptExport, setTriggerReceiptExport] = useState(false);

    const { items: sortedReceipts } = useSortableData(manualReceipts);

    const getPartyName = (rec: ManualReceipt) => {
        if (rec.partyType === 'Customer') return allMembers.find(m => m.id === rec.partyId)?.name || 'Unknown Customer';
        if (rec.partyType === 'Staff') return users.find(u => u.id === rec.partyId)?.name || 'Unknown Staff';
        return rec.receivedFrom || 'N/A';
    };

    const getBankName = (bankId?: string) => {
        if (!bankId) return '-';
        return bankMasters.find(b => b.id === bankId)?.bankName || 'Unknown Bank';
    };

    const l1Map = useMemo(() => new Map(incomeCategoriesLevel1.map(c => [c.id, c.name])), [incomeCategoriesLevel1]);
    const l2Map = useMemo(() => new Map(incomeCategoriesLevel2.map(c => [c.id, c.name])), [incomeCategoriesLevel2]);

    const getIncomeCategoryName = (categoryId: string) => {
        const l2 = l2Map.get(categoryId);
        if (l2) return l2; 
        const l1 = l1Map.get(categoryId);
        return l1 || categoryId; 
    };

    const toggleReturnStatus = (receipt: ManualReceipt) => {
        if (!canModify) return;
        const saveData: Omit<ReceiptSaveData, 'createdBy'> = {
            id: receipt.id,
            receiptNo: receipt.receiptNo,
            date: receipt.date,
            receivedFrom: receipt.receivedFrom,
            address: receipt.address,
            finYearId: receipt.finYearId,
            partyId: receipt.partyId,
            partyType: receipt.partyType,
            docNo: receipt.docNo,
            docDate: receipt.docDate,
            lineItems: receipt.lineItems,
            branch_id: receipt.branch_id || '',
            isPaymentReturned: !receipt.isPaymentReturned
        };
        onSaveReceipt(saveData);
    };

    const handleOpenReceiptModal = (receipt: ManualReceipt | null = null, shouldExport: boolean = false) => {
        setEditingReceipt(receipt);
        setTriggerReceiptExport(shouldExport);
        setIsReceiptModalOpen(true);
    };

    const handleDeleteReceipt = (receiptId: string) => {
        if (window.confirm('Are you sure you want to delete this receipt?')) {
            onDeleteManualReceipt(receiptId);
        }
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
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const party = getPartyName(rec).toLowerCase();
                const amounts = rec.lineItems.map(i => i.amount).join(' ');
                const match = [rec.receiptNo, rec.date, party, amounts, rec.docNo || ''].some(s => s.toLowerCase().includes(term));
                if (!match) return false;
            }
            return true;
        });
    }, [sortedReceipts, activeFY, filters, allMembers, users]);

    const totalReceiptAmount = useMemo(() => filteredReceipts.reduce((sum, r) => sum + r.lineItems.reduce((s, i) => s + i.amount, 0), 0), [filteredReceipts]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Manual Receipt Log</h3>
                <div className="mb-4">
                    <StatCard title="Total Filtered Receipts" value={totalReceiptAmount} icon={<TrendingUp />} isProfit={true} />
                </div>
                
                <FilterControls filters={filters} onFilterChange={setFilters} branches={branches} />

                <div className="flex justify-end mb-4">
                    <Button 
                        onClick={() => handleOpenReceiptModal(null)}
                        disabled={!canCreate || !canCreateNew}
                        title={!canCreateNew ? creationDisabledReason : "Create a new receipt"}
                    >
                        <FilePlus2 size={16} /> Create Receipt
                    </Button>
                </div>

                <div className="h-[500px] overflow-y-auto">
                    <DataTable 
                        data={filteredReceipts} 
                        columns={[
                            { header: 'S.No', accessor: 'id', render: (_, __, idx) => idx + 1 },
                            { header: 'Receipt #', accessor: 'receiptNo' },
                            { header: 'Date', accessor: 'date' },
                            { header: 'Income Category', accessor: 'lineItems', render: (items: any[]) => (
                                <div className="space-y-1">
                                    {items.map((i, idx) => (
                                        <div key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                                            {getIncomeCategoryName(i.incomeCategory)}
                                        </div>
                                    ))}
                                </div>
                            )},
                            { header: 'Party Name', accessor: 'partyId', render: (_, row) => <span className="font-medium">{getPartyName(row)}</span> },
                            { header: 'Payment Mode', accessor: 'lineItems', render: (items: any[]) => (
                                <div className="space-y-1 text-xs">
                                    {items.map((i, idx) => (
                                        <div key={idx}>
                                            {i.paymentMode} {i.bankId ? `- ${getBankName(i.bankId)}` : ''}
                                        </div>
                                    ))}
                                </div>
                            )},
                            { header: 'Remarks', accessor: 'lineItems', render: (items: any[]) => (
                                <div className="space-y-1 text-xs text-gray-500">
                                    {items.map((i, idx) => <div key={idx} className="truncate max-w-[150px]" title={i.description}>{i.description}</div>)}
                                </div>
                            )},
                            { header: 'Doc No', accessor: 'docNo', render: (v) => v || '-' },
                            { header: 'Amount', accessor: 'lineItems', render: (items: any[]) => {
                                const total = items.reduce((sum, i) => sum + i.amount, 0);
                                return <span className="font-bold text-green-600">₹{total.toLocaleString('en-IN')}</span>;
                            }},
                            { header: 'Return', accessor: 'isPaymentReturned', render: (val, row) => (
                                <div className="flex justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={!!val} 
                                        onChange={() => toggleReturnStatus(row)} 
                                        disabled={!canModify}
                                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                            )},
                            { header: 'Actions', accessor: 'id', render: (id, row) => (
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => handleOpenReceiptModal(row, false)} className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400" disabled={!canModify} title="Edit"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDeleteReceipt(id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400" disabled={!canModify} title="Delete"><Trash2 size={16}/></button>
                                    <button onClick={() => handleOpenReceiptModal(row, true)} className="p-1 text-green-600 hover:text-green-800" title="Download"><Download size={16}/></button>
                                </div>
                            )}
                        ]} 
                    />
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
                    incomeCategoriesLevel1={incomeCategoriesLevel1}
                    incomeCategoriesLevel2={incomeCategoriesLevel2}
                />
            )}
        </div>
    );
};

const ExpensesTab: React.FC<ExpensesTabProps> = ({ expenses, expenseCategoriesLevel1, expenseCategoriesLevel2, onDeleteExpense, onDeleteVoucher, handleOpenVoucherModal, canCreate, canModify, branches, canCreateNew, creationDisabledReason, activeFY, allMembers, users, bankMasters, onUpdateExpense }) => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '', branch_id: 'all' });
    const { items: sortedItems } = useSortableData(expenses);

    const handleDelete = (item: Expense) => {
         if(window.confirm('Are you sure you want to delete this expense record?')) onDeleteExpense(item.id);
    };

    const handleDeleteVoucherClick = (voucherNo: string) => {
        if(window.confirm(`Are you sure you want to delete Voucher ${voucherNo}? This will delete all associated expenses.`)) onDeleteVoucher(voucherNo);
    };

    const getPartyName = (row: Expense) => {
        if (row.partyType === 'Customer') return allMembers.find(m => m.id === row.partyId)?.name || 'Unknown Customer';
        if (row.partyType === 'Staff') return users.find(u => u.id === row.partyId)?.name || 'Unknown Staff';
        return row.paidTo || 'N/A'; 
    };

    const getBankName = (bankId?: string) => {
        if (!bankId) return '-';
        return bankMasters.find(b => b.id === bankId)?.bankName || 'Unknown Bank';
    };

    const toggleReturnStatus = (expense: Expense) => {
        if (!canModify) return;
        const updated = { ...expense, isPaymentReturned: !expense.isPaymentReturned };
        onUpdateExpense(updated);
    };

    const l1Map = useMemo(() => new Map(expenseCategoriesLevel1.map(c => [c.id, c.name])), [expenseCategoriesLevel1]);
    const l2Map = useMemo(() => new Map(expenseCategoriesLevel2.map(c => [c.id, c.name])), [expenseCategoriesLevel2]);

    const getFullExpenseCategoryPath = (expense: Expense): string => {
        const path = [];
        if (expense.categoryLevel1Id) path.push(l1Map.get(expense.categoryLevel1Id));
        if (expense.categoryLevel2Id) path.push(l2Map.get(expense.categoryLevel2Id));
        return path.filter(Boolean).join(' > ') || 'Uncategorized';
    };
    
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
            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const categoryName = getFullExpenseCategoryPath(exp);
                const partyName = getPartyName(exp);
                const valuesToSearch = [
                    exp.date, categoryName, partyName, exp.amount.toString(), exp.description, exp.voucherNo || '', exp.expenseHead || '', exp.modeOfPayment || '', exp.docNo || ''
                ];
                return valuesToSearch.some(val => String(val).toLowerCase().includes(searchTerm));
            }
            return true;
        });
    }, [sortedItems, filters, activeFY, getFullExpenseCategoryPath, getPartyName]);
    
    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), [filteredExpenses]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Payment Voucher</h3>
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => handleOpenVoucherModal(null)} 
                        disabled={!canCreate || !canCreateNew}
                        title={!canCreateNew ? creationDisabledReason : "Create a new voucher"}
                    >
                        <FilePlus2 size={16} /> Create Voucher
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create a new manual or auto-generated voucher from the voucher screen.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4">Expense Log</h3>
                <div className="my-4">
                    <StatCard title="Total Filtered Expenses" value={totalExpenses} icon={<TrendingDown />} />
                </div>
                <FilterControls filters={filters} onFilterChange={setFilters} branches={branches} />
                <div className="flex-1 overflow-y-auto mt-4 min-h-0">
                    <DataTable 
                        data={filteredExpenses} 
                        columns={[
                            { header: 'S.No', accessor: 'id', render: (_, __, idx) => idx + 1 },
                            { header: 'Voucher #', accessor: 'voucherNo', render: (v) => <span className="font-mono text-xs">{v}</span> },
                            { header: 'Date', accessor: 'date' },
                            { header: 'Expense Category', accessor: 'categoryLevel1Id', render: (_, row) => (
                                <div className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded inline-block">
                                    {getFullExpenseCategoryPath(row)}
                                </div>
                            )},
                            { header: 'Party Name', accessor: 'partyId', render: (_, row) => <span className="font-medium">{getPartyName(row)}</span> },
                            { header: 'Payment Mode', accessor: 'modeOfPayment', render: (val, row) => (
                                <div className="text-xs">
                                    {val} {row.bankId ? `- ${getBankName(row.bankId)}` : ''}
                                </div>
                            )},
                            { header: 'Doc No', accessor: 'docNo', render: (v) => v || '-' },
                            { header: 'Amount', accessor: 'amount', render: (v) => <span className="font-bold text-red-600">₹{v.toLocaleString('en-IN')}</span> },
                            { header: 'Return', accessor: 'isPaymentReturned', render: (val, row) => (
                                <div className="flex justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={!!val} 
                                        onChange={() => toggleReturnStatus(row)} 
                                        disabled={!canModify}
                                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                            )},
                            { header: 'Actions', accessor: 'id', render: (id, row) => (
                                <div className="flex gap-2 justify-center">
                                    {row.voucherNo ? (
                                        <>
                                            <button onClick={() => handleOpenVoucherModal(expenses.filter(e => e.voucherNo === row.voucherNo), false)} className="p-1 text-blue-600 hover:text-blue-800" disabled={!canModify} title="Edit"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteVoucherClick(row.voucherNo)} className="p-1 text-red-600 hover:text-red-800" disabled={!canModify} title="Delete"><Trash2 size={16}/></button>
                                            <button onClick={() => handleOpenVoucherModal(expenses.filter(e => e.voucherNo === row.voucherNo), true)} className="p-1 text-green-600 hover:text-green-800" title="Download"><Download size={16}/></button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleDelete(row)} className="p-1 text-red-600 hover:text-red-800" disabled={!canModify}><Trash2 size={16}/></button>
                                    )}
                                </div>
                            )}
                        ]} 
                    />
                </div>
            </div>
        </div>
    );
};

const OpeningBalanceTab: React.FC<{
    openingBalances: OpeningBalance[],
    allMembers: Member[],
    users: User[],
    incomeCategoriesLevel1: IncomeCategoryLevel1[],
    incomeCategoriesLevel2: IncomeCategoryLevel2[],
    expenseCategoriesLevel1: ExpenseCategoryLevel1[],
    expenseCategoriesLevel2: ExpenseCategoryLevel2[],
    onAdd: (data: Omit<OpeningBalance, 'id' | 'createdAt'>) => void,
    onUpdate: (data: OpeningBalance) => void,
    onDelete: (id: string) => void,
    canCreate: boolean,
    canModify: boolean
}> = ({ openingBalances, allMembers, users, incomeCategoriesLevel1, incomeCategoriesLevel2, expenseCategoriesLevel1, expenseCategoriesLevel2, onAdd, onUpdate, onDelete, canCreate, canModify }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<OpeningBalance | null>(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '' });


    const [formData, setFormData] = useState<Partial<OpeningBalance>>({
        date: new Date().toISOString().split('T')[0],
        categoryType: 'Income',
        partyType: 'Customer',
        debit: 0,
        credit: 0
    });

    useEffect(() => {
        if (isModalOpen) {
            if (editingItem) {
                setFormData(editingItem);
            } else {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    categoryType: 'Income',
                    partyType: 'Customer',
                    categoryLevel1Id: '',
                    categoryLevel2Id: '',
                    partyId: '',
                    debit: 0,
                    credit: 0
                });
            }
        }
    }, [isModalOpen, editingItem]);

    const { items: sortedItems } = useSortableData(openingBalances);

    const filteredItems = useMemo(() => {
        return sortedItems.filter(item => {
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            const itemDate = new Date(item.date);
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const partyName = item.partyType === 'Customer' 
                    ? allMembers.find(m => m.id === item.partyId)?.name 
                    : users.find(u => u.id === item.partyId)?.name;
                return partyName?.toLowerCase().includes(term);
            }
            return true;
        });
    }, [sortedItems, filters, allMembers, users]);

    const totalDebit = useMemo(() => filteredItems.reduce((sum, item) => sum + item.debit, 0), [filteredItems]);
    const totalCredit = useMemo(() => filteredItems.reduce((sum, item) => sum + item.credit, 0), [filteredItems]);

    const partyOptions = useMemo(() => {
        if (formData.partyType === 'Customer') {
            return allMembers.map(m => ({ value: m.id, label: `${m.name} (${m.memberId})` }));
        }
        return users.map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }));
    }, [formData.partyType, allMembers, users]);

    const categoryL1Options = useMemo(() => {
        return formData.categoryType === 'Income' ? incomeCategoriesLevel1 : expenseCategoriesLevel1;
    }, [formData.categoryType, incomeCategoriesLevel1, expenseCategoriesLevel1]);

    const categoryL2Options = useMemo(() => {
        const list = formData.categoryType === 'Income' ? incomeCategoriesLevel2 : expenseCategoriesLevel2;
        return list.filter(c => c.parentId === formData.categoryLevel1Id);
    }, [formData.categoryType, formData.categoryLevel1Id, incomeCategoriesLevel2, expenseCategoriesLevel2]);

    const getCategoryName = (id: string, type: 'Income' | 'Expense', level: 1 | 2) => {
        if (type === 'Income') {
            return level === 1 
                ? incomeCategoriesLevel1.find(c => c.id === id)?.name 
                : incomeCategoriesLevel2.find(c => c.id === id)?.name;
        } else {
            return level === 1 
                ? expenseCategoriesLevel1.find(c => c.id === id)?.name 
                : expenseCategoriesLevel2.find(c => c.id === id)?.name;
        }
    };

    const handleSave = () => {
        if (!formData.categoryLevel1Id || !formData.categoryLevel2Id || !formData.partyId || !formData.date) {
            alert("Please fill all required fields.");
            return;
        }
        const amount = Number(formData.categoryType === 'Income' ? formData.credit : formData.debit);
        if (amount <= 0) {
            alert("Amount must be greater than zero.");
            return;
        }

        const payload = {
            ...formData,
            credit: formData.categoryType === 'Income' ? amount : 0,
            debit: formData.categoryType === 'Expense' ? amount : 0,
        } as OpeningBalance; 
        if (editingItem) {
            onUpdate(payload);
        } else {
            onAdd(payload);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Total Debit (Payable)" value={totalDebit} icon={<TrendingDown />} isProfit={false} />
                <StatCard title="Total Credit (Receivable)" value={totalCredit} icon={<TrendingUp />} isProfit={true} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Opening Balances</h3>
                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} disabled={!canCreate}>
                        <FilePlus2 size={16} /> Add Opening Balance
                    </Button>
                </div>

                <FilterControls filters={filters} onFilterChange={setFilters} />

                <div className="h-[500px] overflow-y-auto mt-4">
                    <DataTable 
                        data={filteredItems}
                        columns={[
                            { header: 'Date', accessor: 'date' },
                            { header: 'Type', accessor: 'categoryType', render: (val) => <span className={`px-2 py-1 rounded text-xs font-semibold ${val === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{val}</span>},
                            { header: 'Category', accessor: 'categoryLevel1Id', render: (val, row) => getCategoryName(val, row.categoryType, 1) || val },
                            { header: 'Head', accessor: 'categoryLevel2Id', render: (val, row) => getCategoryName(val, row.categoryType, 2) || val },
                            { header: 'Party', accessor: 'partyId', render: (val, row) => row.partyType === 'Customer' ? allMembers.find(m=>m.id===val)?.name : users.find(u=>u.id===val)?.name },
                            { header: 'Debit', accessor: 'debit', render: (val) => val > 0 ? `₹${val.toLocaleString('en-IN')}` : '-' },
                            { header: 'Credit', accessor: 'credit', render: (val) => val > 0 ? `₹${val.toLocaleString('en-IN')}` : '-' },
                            { header: 'Actions', accessor: 'id', render: (id, row) => (
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingItem(row); setIsModalOpen(true); }} className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400" disabled={!canModify}><Edit2 size={16}/></button>
                                    <button onClick={() => onDelete(id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400" disabled={!canModify}><Trash2 size={16}/></button>
                                </div>
                            )}
                        ]}
                    />
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editingItem ? 'Edit Opening Balance' : 'Add Opening Balance'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Payee Details Section */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Payee Details</h4>
                                    <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-1">
                                        <button 
                                            onClick={() => setFormData(prev => ({ ...prev, partyType: 'Staff', partyId: '' }))} 
                                            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${formData.partyType === 'Staff' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
                                        >
                                            <UsersIcon size={12}/> Staff
                                        </button>
                                        <button 
                                            onClick={() => setFormData(prev => ({ ...prev, partyType: 'Customer', partyId: '' }))} 
                                            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${formData.partyType === 'Customer' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
                                        >
                                            <UserIcon size={12}/> Customer
                                        </button>
                                    </div>
                                </div>
                                <SearchableSelect
                                    label={formData.partyType === 'Customer' ? "Select Customer" : "Select Staff"}
                                    options={partyOptions}
                                    value={formData.partyId || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, partyId: val }))}
                                    placeholder="Search..."
                                />
                            </div>

                            {/* Category Selection */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                                <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Category Selection</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Type</label>
                                        <select 
                                            value={formData.categoryType} 
                                            onChange={e => setFormData(prev => ({ ...prev, categoryType: e.target.value as 'Income' | 'Expense', categoryLevel1Id: '', categoryLevel2Id: '' }))}
                                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                                        >
                                            <option value="Income">Income (Credit)</option>
                                            <option value="Expense">Expense (Debit)</option>
                                        </select>
                                    </div>
                                    <Input 
                                        label="Date" 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} 
                                    />
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category</label>
                                        <select 
                                            value={formData.categoryLevel1Id} 
                                            onChange={e => setFormData(prev => ({ ...prev, categoryLevel1Id: e.target.value, categoryLevel2Id: '' }))}
                                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                                        >
                                            <option value="">Select Category</option>
                                            {categoryL1Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Head</label>
                                        <select 
                                            value={formData.categoryLevel2Id} 
                                            onChange={e => setFormData(prev => ({ ...prev, categoryLevel2Id: e.target.value }))}
                                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                                            disabled={!formData.categoryLevel1Id}
                                        >
                                            <option value="">Select Head</option>
                                            {categoryL2Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input 
                                            label="Amount" 
                                            type="number" 
                                            value={formData.categoryType === 'Income' ? formData.credit : formData.debit} 
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    debit: prev.categoryType === 'Expense' ? val : 0,
                                                    credit: prev.categoryType === 'Income' ? val : 0
                                                }));
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave}><Save size={16} /> Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DayBookTab: React.FC<{ 
    expenses: Expense[], 
    manualReceipts: ManualReceipt[], 
    users: User[], 
    allMembers: Member[], 
    bankMasters: BankMaster[], 
    expenseCategoriesLevel1: ExpenseCategoryLevel1[],
    activeFYId: string | null 
}> = ({ expenses, manualReceipts, users, allMembers, bankMasters, expenseCategoriesLevel1, activeFYId }) => {
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const getPartyName = (type: 'Customer' | 'Staff' | undefined, id: string | undefined, fallback: string | undefined) => {
        if (type === 'Customer') return allMembers.find(m => m.id === id)?.name || fallback || 'Unknown Customer';
        if (type === 'Staff') return users.find(u => u.id === id)?.name || fallback || 'Unknown Staff';
        return fallback || 'Unknown';
    };

    const getBankName = (id?: string) => bankMasters.find(b => b.id === id)?.bankName || 'Cash';
    const getCategoryName = (id?: string) => expenseCategoriesLevel1.find(c => c.id === id)?.name || 'Expense';

    const dayBookData: DayBookEntry[] = useMemo(() => {
        const entries: DayBookEntry[] = [];

        expenses.forEach((exp, idx) => {
            if(exp.date !== selectedDate) return;

            const partyName = getPartyName(exp.partyType, exp.partyId, exp.paidTo);
            const bankName = exp.bankId ? getBankName(exp.bankId) : 'Cash';
            const category = getCategoryName(exp.categoryLevel1Id);
            const head = exp.expenseHead || category;

            entries.push({
                id: `exp-dr-${exp.id}`,
                date: exp.date,
                sourceDocNo: exp.voucherNo || '-',
                accountCategory: category.toUpperCase(),
                head: head,
                party: partyName,
                remarks: exp.description,
                debit: exp.amount, 
                credit: undefined
            });

            entries.push({
                id: `exp-cr-${exp.id}`,
                date: exp.date,
                sourceDocNo: exp.voucherNo || '-',
                accountCategory: 'BANK/CASH',
                head: bankName,
                party: '-', 
                remarks: `Payment via ${exp.modeOfPayment}`,
                debit: undefined,
                credit: exp.amount 
            });
        });

        manualReceipts.forEach(rec => {
            if(rec.date !== selectedDate) return;
            
            const partyName = getPartyName(rec.partyType, rec.partyId, rec.receivedFrom);
            
            rec.lineItems.forEach((item, idx) => {
                 const bankName = item.bankId ? getBankName(item.bankId) : 'Cash';
                 
                 entries.push({
                     id: `rec-cr-${rec.id}-${idx}`,
                     date: rec.date,
                     sourceDocNo: rec.receiptNo,
                     accountCategory: rec.partyType === 'Customer' ? 'CUST' : 'STAFF',
                     head: item.incomeCategory || 'Income',
                     party: partyName,
                     remarks: item.description || `Received from ${partyName}`,
                     debit: undefined,
                     credit: item.amount 
                 });

                 entries.push({
                     id: `rec-dr-${rec.id}-${idx}`,
                     date: rec.date,
                     sourceDocNo: rec.receiptNo,
                     accountCategory: 'BANK/CASH',
                     head: bankName,
                     party: '-',
                     remarks: `Receipt via ${item.paymentMode}`,
                     debit: item.amount, 
                     credit: undefined
                 });
            });
        });

        return entries;
    }, [expenses, manualReceipts, selectedDate, allMembers, users, bankMasters, expenseCategoriesLevel1]);

    const filteredEntries = dayBookData.filter(e => 
        e.sourceDocNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.head.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.party.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Day Book - ${selectedDate}`, 14, 15);
        const tableColumn = ["Date", "Source Doc", "Category", "Head", "Party", "Remark", "Debit", "Credit"];
        const tableRows = filteredEntries.map(row => [
            row.date,
            row.sourceDocNo,
            row.accountCategory,
            row.head,
            row.party,
            row.remarks,
            row.debit ? row.debit.toFixed(2) : '',
            row.credit ? row.credit.toFixed(2) : ''
        ]);
        // @ts-ignore
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save(`DayBook_${selectedDate}.pdf`);
    };

    const handleDownloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredEntries);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DayBook");
        XLSX.writeFile(wb, `DayBook_${selectedDate}.xlsx`);
    };

    const handlePrint = () => {
        const content = document.getElementById('daybook-table');
        if(content) {
            const original = document.body.innerHTML;
            document.body.innerHTML = content.innerHTML;
            window.print();
            document.body.innerHTML = original;
            window.location.reload();
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Day Book</h3>
                <div className="flex gap-2">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-md dark:bg-gray-700 text-sm" />
                    <div className="relative">
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 border rounded-md dark:bg-gray-700 text-sm w-48" />
                        <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-2 mb-4">
                <Button onClick={handleDownloadPDF} variant="light" size="small"><FileText size={16}/> PDF</Button>
                <Button onClick={handleDownloadExcel} variant="light" size="small"><Download size={16}/> Excel</Button>
                <Button onClick={handlePrint} variant="light" size="small"><Printer size={16}/> Print</Button>
            </div>

            <div className="flex-1 overflow-auto" id="daybook-table">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 border">Date</th>
                            <th className="px-4 py-3 border">Source Doc</th>
                            <th className="px-4 py-3 border">Category</th>
                            <th className="px-4 py-3 border">Head</th>
                            <th className="px-4 py-3 border">Party</th>
                            <th className="px-4 py-3 border">Remark</th>
                            <th className="px-4 py-3 border text-right">Debit</th>
                            <th className="px-4 py-3 border text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.map(row => (
                            <tr key={row.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                                <td className="px-4 py-2 border">{row.date}</td>
                                <td className="px-4 py-2 border font-mono">{row.sourceDocNo}</td>
                                <td className="px-4 py-2 border">{row.accountCategory}</td>
                                <td className="px-4 py-2 border font-medium text-gray-900 dark:text-white">{row.head}</td>
                                <td className="px-4 py-2 border text-gray-600 dark:text-gray-300">{row.party}</td>
                                <td className="px-4 py-2 border truncate max-w-xs" title={row.remarks}>{row.remarks}</td>
                                <td className="px-4 py-2 border text-right text-red-600">{row.debit !== undefined ? row.debit.toLocaleString('en-IN') : ''}</td>
                                <td className="px-4 py-2 border text-right text-green-600">{row.credit !== undefined ? row.credit.toLocaleString('en-IN') : ''}</td>
                            </tr>
                        ))}
                         {filteredEntries.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center">No transactions for this date.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


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

const DataTable: React.FC<{ data: any[]; columns: { header: string; accessor: string; render?: (value: any, row: any, index: number) => React.ReactNode }[] }> = ({ data, columns }) => {
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
                            <tr key={`${row.id || 'row'}-${index}`} className={row.isPaymentReturned ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                {columns.map((col, colIndex) => (
                                    <td key={`${col.accessor}-${index}-${colIndex}`} className="px-4 py-2 text-gray-700 dark:text-gray-300 align-top">
                                        {col.render ? col.render(row[col.accessor], row, index) : row[col.accessor]}
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


const IncomeAndExpense: React.FC<IncomeAndExpenseProps> = (props) => {
    const { 
        permissions, 
        activeFinancialYearId, 
        financialYears,
        trueCurrentFinancialYear,
        currentVoucherDocNumbering,
        currentReceiptDocNumbering,
        expenses,
        manualReceipts,
        users,
        allMembers,
        openingBalances
    } = props;

    const [activeTab, setActiveTab] = useState<PnLTab>('analysis');
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [editingVoucherExpenses, setEditingVoucherExpenses] = useState<Expense[] | null>(null);
    const [triggerExport, setTriggerExport] = useState(false);

    const canView = permissions.incomeAndExpense !== 'none';
    const canCreate = permissions.incomeAndExpense === 'create' || permissions.incomeAndExpense === 'modify';
    const canModify = permissions.incomeAndExpense === 'modify';

    const isCreationAllowedByDate = !!trueCurrentFinancialYear;
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
    
    const activeFYForSession = useMemo(() => financialYears.find(fy => fy.id === activeFinancialYearId) || null, [financialYears, activeFinancialYearId]);

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
                <p className="text-gray-500 dark:text-gray-400 mt-2">You do not have permission to view the Income & Expense section.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Income & Expense</h2>
                {!canCreateNew && canCreate && activeTab !== 'openingBalance' && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                        <Info size={20} className="text-yellow-600 dark:text-yellow-300"/>
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">{creationDisabledReason}</span>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700 inline-flex items-center gap-2 shrink-0 flex-wrap">
                <TabButton label="Analysis" tabName="analysis" />
                <TabButton label="Income" tabName="incomes" />
                <TabButton label="Expense" tabName="expenses" />
                <TabButton label="Day Book" tabName="daybook" />
                <TabButton label="Opening Balance" tabName="openingBalance" />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'analysis' && <AnalysisTab {...props} activeFYId={activeFinancialYearId} />}
                {activeTab === 'incomes' && <IncomesTab {...props} canCreate={canCreate} canModify={canModify} canCreateNew={canCreateNew} creationDisabledReason={creationDisabledReason} activeFY={activeFYForSession} />}
                {activeTab === 'expenses' && <ExpensesTab {...props} handleOpenVoucherModal={handleOpenVoucherModal} canCreate={canCreate} canModify={canModify} canCreateNew={canCreateNew} creationDisabledReason={creationDisabledReason} activeFY={activeFYForSession} />}
                {activeTab === 'daybook' && (
                    <DayBookTab 
                        expenses={expenses} 
                        manualReceipts={manualReceipts} 
                        users={users} 
                        allMembers={allMembers} 
                        bankMasters={props.bankMasters}
                        expenseCategoriesLevel1={props.expenseCategoriesLevel1}
                        activeFYId={activeFinancialYearId}
                    />
                )}
                {activeTab === 'openingBalance' && (
                    <OpeningBalanceTab 
                        openingBalances={openingBalances}
                        allMembers={allMembers}
                        users={users}
                        incomeCategoriesLevel1={props.incomeCategoriesLevel1}
                        incomeCategoriesLevel2={props.incomeCategoriesLevel2}
                        expenseCategoriesLevel1={props.expenseCategoriesLevel1}
                        expenseCategoriesLevel2={props.expenseCategoriesLevel2}
                        onAdd={props.onAddOpeningBalance}
                        onUpdate={props.onUpdateOpeningBalance}
                        onDelete={props.onDeleteOpeningBalance}
                        canCreate={canCreate}
                        canModify={canModify}
                    />
                )}
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
                    expenseCategoriesLevel1={props.expenseCategoriesLevel1}
                    expenseCategoriesLevel2={props.expenseCategoriesLevel2}
                    lastVoucherNumber={props.lastVoucherNumber}
                    onSave={props.onSaveVoucher}
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