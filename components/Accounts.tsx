
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Expense, ManualReceipt, Member, User, 
    BankMaster, OpeningBalance, FinancialYear,
    AccountCategory, AccountSubCategory, AccountHead
} from '../types.ts';
import { Download, Search, Printer, FileText, FilePlus2, Edit2, Trash2, X, TrendingUp, TrendingDown, Save, User as UserIcon, Users as UsersIcon, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import SearchableSelect from './ui/SearchableSelect.tsx';

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
        light: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600',
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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>}
        <input
            {...props}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${props.className}`}
        />
    </div>
);

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; isProfit?: boolean }> = ({ title, value, icon, isProfit }) => {
    const valueColor = isProfit === undefined ? 'text-gray-800 dark:text-white' : isProfit ? 'text-green-600' : 'text-red-600';
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex items-center gap-4">
            <div className={`p-3 rounded-full ${isProfit ? 'bg-green-100 text-green-600 dark:bg-green-900/50' : 'bg-red-100 text-red-600 dark:bg-red-900/50'}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className={`text-2xl font-bold ${valueColor}`}>₹{value.toLocaleString('en-IN')}</p>
            </div>
        </div>
    );
};

const printElement = (elementId: string) => {
    const content = document.getElementById(elementId);
    if (content) {
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = content.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); 
    }
};

interface AccountsProps {
    expenses: Expense[];
    manualReceipts: ManualReceipt[];
    allMembers: Member[];
    users: User[];
    
    accountCategories: AccountCategory[];
    accountSubCategories: AccountSubCategory[];
    accountHeads: AccountHead[];

    bankMasters: BankMaster[];
    openingBalances: OpeningBalance[];
    onAddOpeningBalance: (data: Omit<OpeningBalance, 'id' | 'createdAt'>) => void;
    onUpdateOpeningBalance: (data: OpeningBalance) => void;
    onDeleteOpeningBalance: (id: string) => void;
    canCreate: boolean;
    canModify: boolean;
    canCreateNew: boolean;
    creationDisabledReason: string;
    trueCurrentFinancialYear: FinancialYear | null;
}

type TabType = 'openingBalance' | 'daybook' | 'ledger' | 'trialBalance' | 'pl';

const getAccountDetails = (headId: string, heads: AccountHead[], subs: AccountSubCategory[], cats: AccountCategory[]) => {
    const head = heads.find(h => h.id === headId);
    const sub = subs.find(s => s.id === head?.subCategoryId);
    const cat = cats.find(c => c.id === sub?.categoryId);
    return {
        headName: head?.name || 'Unknown',
        subName: sub?.name || 'Unknown',
        catName: cat?.name || 'Unknown',
        isCash: head?.isCash || false,
        isPostingBank: head?.postingBank || false
    };
};

const Accounts: React.FC<AccountsProps> = ({ 
    expenses, manualReceipts, allMembers, users, 
    accountCategories, accountSubCategories, accountHeads,
    bankMasters, openingBalances,
    onAddOpeningBalance, onUpdateOpeningBalance, onDeleteOpeningBalance,
    canCreate, canModify, canCreateNew, creationDisabledReason,
    trueCurrentFinancialYear
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('openingBalance');

    const getDefaultFromDate = () => trueCurrentFinancialYear ? trueCurrentFinancialYear.fromDate : new Date().toISOString().split('T')[0];
    const getDefaultToDate = () => new Date().toISOString().split('T')[0];

    const getPartyName = (type: 'Customer' | 'Staff' | 'Internal' | 'Wallet' | undefined, id: string | undefined, fallback: string | undefined) => {
        if (type === 'Customer') return allMembers.find(m => m.id === id)?.name || fallback || 'Unknown Customer';
        if (type === 'Staff') return users.find(u => u.id === id)?.name || fallback || 'Unknown Staff';
        if (type === 'Wallet') return getInternalWalletName(id) || fallback || 'Unknown Wallet';
        return fallback || 'Unknown';
    };

    const getInternalWalletName = (bankId?: string) => {
        if (!bankId) return 'Unknown Wallet';
        const wallet = accountHeads.find(h => h.id === bankId);
        return wallet ? wallet.name : 'Unknown Wallet';
    };

    const nonPostingBankHeads = useMemo(() => {
        return accountHeads.filter(h => !h.postingBank && !h.isCash);
    }, [accountHeads]);
    
    const allAccountHeads = useMemo(() => {
        return accountHeads;
    }, [accountHeads]);
    
    const allAssetHeads = useMemo(() => {
        return accountHeads.filter(h => h.postingBank || h.isCash);
    }, [accountHeads]);

    const OpeningBalanceView = () => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingItem, setEditingItem] = useState<OpeningBalance | null>(null);
        const [filters, setFilters] = useState({ startDate: '', endDate: '', searchTerm: '' });
        const [warningMessage, setWarningMessage] = useState<string | null>(null);

        const [formData, setFormData] = useState<Partial<OpeningBalance> & { balanceType: 'Debit' | 'Credit' }>({
            date: new Date().toISOString().split('T')[0],
            accountHeadId: '',
            balanceType: 'Credit', 
            partyType: 'Wallet', 
            debit: 0, credit: 0
        });

        useEffect(() => {
            if (isModalOpen) {
                if (editingItem) {
                    const type = editingItem.debit > 0 ? 'Debit' : 'Credit';
                    setFormData({ ...editingItem, balanceType: type });
                } else {
                    setFormData({ date: new Date().toISOString().split('T')[0], accountHeadId: '', balanceType: 'Credit', partyType: 'Wallet', partyId: '', debit: 0, credit: 0 });
                }
            }
        }, [isModalOpen, editingItem]);

        const filteredItems = useMemo(() => {
            return openingBalances.filter(item => {
                const start = filters.startDate ? new Date(filters.startDate) : null;
                const end = filters.endDate ? new Date(filters.endDate) : null;
                const itemDate = new Date(item.date);
                if (start && itemDate < start) return false;
                if (end && itemDate > end) return false;
                if (filters.searchTerm) {
                    const term = filters.searchTerm.toLowerCase();
                    const partyName = getPartyName(item.partyType, item.partyId, 'Internal/Unknown');
                    return partyName?.toLowerCase().includes(term);
                }
                return true;
            });
        }, [openingBalances, filters, allMembers, users]);

        const totalDebit = filteredItems.reduce((sum, item) => sum + item.debit, 0);
        const totalCredit = filteredItems.reduce((sum, item) => sum + item.credit, 0);

        const partyOptions = useMemo(() => {
            if (formData.partyType === 'Customer') return allMembers.map(m => ({ value: m.id, label: `${m.name} (${m.memberId})` }));
            if (formData.partyType === 'Staff') return users.map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }));
            return [];
        }, [formData.partyType, allMembers, users]);
        
        const headOptions = useMemo(() => {
            if (formData.partyType === 'Wallet') {
                return allAssetHeads.map(h => {
                    let typeLabel = h.postingBank ? ' (Bank)' : ' (Cash)';
                    return { value: h.id, label: `${h.name}${typeLabel}` };
                });
            } else {
                return nonPostingBankHeads.map(h => {
                    const details = getAccountDetails(h.id, accountHeads, accountSubCategories, accountCategories);
                    return { value: h.id, label: `${h.name} (${details.catName})` };
                });
            }
        }, [formData.partyType, allAssetHeads, nonPostingBankHeads, accountHeads, accountSubCategories, accountCategories]);

        const handleSave = () => {
            if (!formData.accountHeadId || !formData.date) { 
                setWarningMessage("Please fill all required fields."); 
                return; 
            }
            
            if (formData.partyType !== 'Wallet' && !formData.partyId) {
                setWarningMessage("Please select a party or use Wallet type."); 
                return; 
            }

            const amount = Number(formData.balanceType === 'Credit' ? formData.credit : formData.debit);
            if (amount <= 0) { 
                setWarningMessage("Amount must be greater than zero."); 
                return; 
            }

            const payload: any = { 
                ...formData, 
                debit: formData.balanceType === 'Debit' ? amount : 0, 
                credit: formData.balanceType === 'Credit' ? amount : 0, 
            };
            delete payload.balanceType;
            if (editingItem) onUpdateOpeningBalance(payload as OpeningBalance); else onAddOpeningBalance(payload as Omit<OpeningBalance, 'id' | 'createdAt'>);
            setIsModalOpen(false);
        };

        const handleExport = (type: 'pdf' | 'excel' | 'print') => {
            const getExportData = () => filteredItems.map(item => {
                const details = getAccountDetails(item.accountHeadId, accountHeads, accountSubCategories, accountCategories);
                return {
                    Date: item.date,
                    Type: item.debit > 0 ? 'Debit' : 'Credit',
                    Category: details.catName,
                    Head: details.headName,
                    Party: getPartyName(item.partyType, item.partyId, '-'),
                    Debit: item.debit,
                    Credit: item.credit
                };
            });

            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(getExportData());
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Opening Balance");
                XLSX.writeFile(wb, `Opening_Balance.xlsx`);
            } else {
                printElement('opening-balance-table');
            }
        };

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Total Debit (Assets/Receivable)" value={totalDebit} icon={<TrendingDown />} isProfit={false} />
                    <StatCard title="Total Credit (Liabilities/Payable)" value={totalCredit} icon={<TrendingUp />} isProfit={true} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Opening Balances</h3>
                        <div className="flex gap-2">
                            <Button variant="light" size="small" onClick={() => handleExport('excel')}><Download size={16}/> Excel</Button>
                            <Button variant="light" size="small" onClick={() => handleExport('print')}><Printer size={16}/> Print</Button>
                            <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} disabled={!canCreate || !canCreateNew} title={!canCreateNew ? creationDisabledReason : "Add"}>
                                <FilePlus2 size={16} /> Add New
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto border rounded-lg dark:border-gray-700" id="opening-balance-table">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                <tr>
                                    <th className="border px-4 py-2">Date</th>
                                    <th className="border px-4 py-2">Type</th>
                                    <th className="border px-4 py-2">Account Head</th>
                                    <th className="border px-4 py-2">Party/Ref</th>
                                    <th className="border px-4 py-2 text-right">Debit</th>
                                    <th className="border px-4 py-2 text-right">Credit</th>
                                    <th className="border px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(row => {
                                    const details = getAccountDetails(row.accountHeadId, accountHeads, accountSubCategories, accountCategories);
                                    return (
                                        <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="border px-4 py-2">{row.date}</td>
                                            <td className="border px-4 py-2">{row.partyType}</td>
                                            <td className="border px-4 py-2 font-medium">{details.headName}</td>
                                            <td className="border px-4 py-2">{getPartyName(row.partyType, row.partyId, '-')}</td>
                                            <td className="border px-4 py-2 text-right">{row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '-'}</td>
                                            <td className="border px-4 py-2 text-right">{row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '-'}</td>
                                            <td className="border px-4 py-2 flex gap-2">
                                                <button onClick={() => { setEditingItem(row); setIsModalOpen(true); }} className="text-blue-600" disabled={!canModify}><Edit2 size={16}/></button>
                                                <button onClick={() => onDeleteOpeningBalance(row.id)} className="text-red-600" disabled={!canModify}><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Opening Balance</h3><button onClick={() => setIsModalOpen(false)}><X /></button></div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm">Entity Type</span>
                                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg text-xs">
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, partyType: 'Wallet', partyId: '', accountHeadId: '' }))} className={`flex-1 px-2 py-1.5 rounded-md ${formData.partyType === 'Wallet' ? 'bg-white shadow text-blue-600' : ''}`}>Wallet</button>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, partyType: 'Staff', partyId: '', accountHeadId: '' }))} className={`flex-1 px-2 py-1.5 rounded-md ${formData.partyType === 'Staff' ? 'bg-white shadow text-blue-600' : ''}`}>Staff</button>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, partyType: 'Customer', partyId: '', accountHeadId: '' }))} className={`flex-1 px-2 py-1.5 rounded-md ${formData.partyType === 'Customer' ? 'bg-white shadow text-blue-600' : ''}`}>Customer</button>
                                        </div>
                                    </div>
                                    {formData.partyType !== 'Wallet' && (
                                        <SearchableSelect label="Select Party" options={partyOptions} value={formData.partyId || ''} onChange={(v) => setFormData(p => ({ ...p, partyId: v }))} />
                                    )}
                                    {formData.partyType === 'Wallet' && (
                                        <p className="text-sm text-gray-600 mt-2">Wallet opening balance - only Cash/Bank accounts available.</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Type</label><select className="w-full border p-2 rounded text-sm" value={formData.balanceType} onChange={e => setFormData(p => ({ ...p, balanceType: e.target.value as any }))}><option value="Debit">Debit (Asset/Receivable)</option><option value="Credit">Credit (Liability/Payable)</option></select></div>
                                    <Input label="Date" type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            {formData.partyType === 'Wallet' ? 'Wallet Account (Cash/Bank Only)' : 'Account Head (Income/Expense Categories Only)'}
                                        </label>
                                        <SearchableSelect label="" options={headOptions} value={formData.accountHeadId || ''} onChange={(v) => setFormData(p => ({ ...p, accountHeadId: v }))} placeholder="Select Account Head..." />
                                    </div>
                                    <div className="col-span-2">
                                        <Input label="Amount" type="number" value={(formData.balanceType === 'Credit' ? formData.credit : formData.debit) || ''} onChange={e => { const val = parseFloat(e.target.value) || 0; setFormData(p => ({ ...p, debit: p.balanceType === 'Debit' ? val : 0, credit: p.balanceType === 'Credit' ? val : 0 })); }} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}><Save size={16} /> Save</Button></div>
                        </div>
                    </div>
                )}
                {warningMessage && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setWarningMessage(null)}><div className="bg-white p-6 rounded-lg shadow-xl max-w-sm" onClick={(e) => e.stopPropagation()}><h3 className="font-bold mb-2">Attention</h3><p>{warningMessage}</p><Button onClick={() => setWarningMessage(null)} className="mt-4">OK</Button></div></div>
                )}
            </div>
        );
    };

    const DayBookView = () => {
        const [filters, setFilters] = useState({
            startDate: getDefaultFromDate(),
            endDate: getDefaultToDate(),
            subCategoryId: 'all', headId: 'all', bankId: 'all', searchTerm: ''
        });

        const dayBookEntries = useMemo(() => {
            const { startDate, endDate, subCategoryId, headId, bankId, searchTerm } = filters;
            const entries: any[] = [];
            const start = new Date(startDate);
            const end = new Date(endDate);

            expenses.forEach(exp => {
                const d = new Date(exp.date);
                if (d < start || d > end) return;
                
                if (headId !== 'all' && exp.accountHeadId !== headId) return;
                const headObj = accountHeads.find(h => h.id === exp.accountHeadId);
                if (subCategoryId !== 'all' && headObj?.subCategoryId !== subCategoryId) return;

                const walletId = exp.bankId;
                if (bankId !== 'all' && walletId !== bankId) return;

                const details = getAccountDetails(exp.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
                const party = getPartyName(exp.partyType, exp.partyId, exp.paidTo);
                const walletName = getInternalWalletName(walletId);

                entries.push({
                    date: exp.date, sourceDoc: exp.voucherNo || '-', category: details.subName, head: details.headName, party,
                    remarks: exp.description, debit: exp.amount, credit: 0, isBalanceRow: false
                });
                entries.push({
                    date: exp.date, sourceDoc: exp.voucherNo || '-', category: 'SETTLEMENT', head: walletName, party: '-',
                    remarks: `Paid via ${exp.modeOfPayment}`, debit: 0, credit: exp.amount, isBalanceRow: true
                });
            });

            manualReceipts.forEach(rec => {
                const d = new Date(rec.date);
                if (d < start || d > end) return;
                const party = getPartyName(rec.partyType, rec.partyId, rec.receivedFrom);
                
                rec.lineItems.forEach(item => {
                     if (headId !== 'all' && item.accountHeadId !== headId) return;
                     const headObj = accountHeads.find(h => h.id === item.accountHeadId);
                     if (subCategoryId !== 'all' && headObj?.subCategoryId !== subCategoryId) return;

                     const walletId = item.bankId;
                     if (bankId !== 'all' && walletId !== bankId) return;

                     const details = getAccountDetails(item.accountHeadId, accountHeads, accountSubCategories, accountCategories);
                     const walletName = getInternalWalletName(walletId);

                     entries.push({
                        date: rec.date, sourceDoc: rec.receiptNo, category: details.subName, head: details.headName, party, 
                        remarks: item.description, debit: 0, credit: item.amount, isBalanceRow: false
                     });
                     entries.push({
                        date: rec.date, sourceDoc: rec.receiptNo, category: 'SETTLEMENT', head: walletName, party: '-',
                        remarks: `Rec'd via ${item.paymentMode}`, debit: item.amount, credit: 0, isBalanceRow: true
                     });
                });
            });

            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return entries.filter(e => e.sourceDoc.toLowerCase().includes(lower) || e.party.toLowerCase().includes(lower) || e.head.toLowerCase().includes(lower));
            }
            return entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }, [expenses, manualReceipts, filters, allMembers, users, accountHeads, accountSubCategories, accountCategories]);

        const handleExport = (type: 'pdf' | 'excel' | 'print') => {
            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(dayBookEntries);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "DayBook");
                XLSX.writeFile(wb, `DayBook_${filters.startDate}_to_${filters.endDate}.xlsx`);
            } else {
                printElement('daybook-table');
            }
        };
        
        const walletOptions = useMemo(() => {
            return allAssetHeads.map(h => ({ value: h.id, label: h.name }));
        }, [allAssetHeads]);

        const categoryHeadOptions = useMemo(() => {
            return nonPostingBankHeads.map(h => ({ value: h.id, label: h.name }));
        }, [nonPostingBankHeads]);

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Day Book</h3>
                    <div className="flex gap-2 items-center">
                        <Button variant="light" size="small" onClick={() => handleExport('excel')}><Download size={16}/> Excel</Button>
                        <Button variant="light" size="small" onClick={() => handleExport('print')}><Printer size={16}/> Print</Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                    <Input label="From" type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}/>
                    <Input label="To" type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}/>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sub Category</label>
                        <select value={filters.subCategoryId} onChange={e => setFilters({...filters, subCategoryId: e.target.value})} className="w-full border p-2 rounded-md text-sm shadow-sm">
                            <option value="all">All</option>
                            {accountSubCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Head (Category)</label>
                        <select value={filters.headId} onChange={e => setFilters({...filters, headId: e.target.value})} className="w-full border p-2 rounded-md text-sm shadow-sm">
                            <option value="all">All</option>
                            {}
                            {categoryHeadOptions.filter(h => filters.subCategoryId === 'all' || accountHeads.find(ah => ah.id === h.value)?.subCategoryId === filters.subCategoryId).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Wallet (Cash/Bank)</label>
                         <select value={filters.bankId} onChange={e => setFilters({...filters, bankId: e.target.value})} className="w-full border p-2 rounded-md text-sm shadow-sm">
                            <option value="all">All</option>
                            {walletOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                        <input type="text" placeholder="Search..." value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} className="w-full pl-8 p-2 border rounded-md text-sm shadow-sm"/>
                        <Search className="absolute left-2.5 top-8 text-gray-400" size={14} />
                    </div>
                </div>

                <div className="flex-1 overflow-auto border rounded-lg" id="daybook-table">
                    <table className="w-full text-sm text-left text-gray-500 border-collapse border border-gray-200">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="border border-gray-200 px-4 py-2">Date</th>
                                <th className="border border-gray-200 px-4 py-2">Source Doc</th>
                                <th className="border border-gray-200 px-4 py-2">Sub-Cat</th>
                                <th className="border border-gray-200 px-4 py-2">Head/Wallet</th>
                                <th className="border border-gray-200 px-4 py-2">Party</th>
                                <th className="border border-gray-200 px-4 py-2">Remark</th>
                                <th className="border border-gray-200 px-4 py-2 text-right">Debit (In)</th>
                                <th className="border border-gray-200 px-4 py-2 text-right">Credit (Out)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dayBookEntries.map((row, idx) => (
                                <tr key={idx} className={`bg-white border-b border-gray-200 hover:bg-gray-50 ${row.isBalanceRow ? 'bg-blue-50/30' : ''}`}>
                                    <td className="border border-gray-200 px-4 py-2">{row.date}</td>
                                    <td className="border border-gray-200 px-4 py-2 font-mono text-xs">{row.sourceDoc}</td>
                                    <td className="border border-gray-200 px-4 py-2">{row.category}</td>
                                    <td className={`border border-gray-200 px-4 py-2 font-medium text-gray-900 ${row.isBalanceRow ? 'text-blue-700' : ''}`}>{row.head}</td>
                                    <td className="border border-gray-200 px-4 py-2">{row.party}</td>
                                    <td className="border border-gray-200 px-4 py-2 truncate max-w-xs">{row.remarks}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right text-green-600 font-medium">{row.debit > 0 ? row.debit.toLocaleString('en-IN') : ''}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right text-red-600 font-medium">{row.credit > 0 ? row.credit.toLocaleString('en-IN') : ''}</td>
                                </tr>
                            ))}
                            {dayBookEntries.length === 0 && <tr><td colSpan={8} className="text-center py-8 border border-gray-200">No records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const LedgerView = () => {
        const [filters, setFilters] = useState({
            startDate: getDefaultFromDate(),
            endDate: getDefaultToDate(),
            subCategoryId: 'all', 
            headId: 'all',
            individualId: ''
        });

        const individualOptions = useMemo(() => {
            const options: { value: string, label: string }[] = [];
            
            users.forEach(u => options.push({ value: u.id, label: `${u.name} (Staff)` }));
            allMembers.forEach(m => options.push({ value: m.id, label: `${m.name} (Customer)` }));
            
            allAssetHeads.forEach(h => options.push({ value: h.id, label: `${h.name} (Wallet Ledger)` }));
            
            return options.sort((a, b) => a.label.localeCompare(b.label));
        }, [users, allMembers, allAssetHeads]);

        const ledgerData = useMemo(() => {
            if (!filters.individualId) {
                return { openingBalAmount: 0, rows: [], totalDebit: 0, totalCredit: 0, closingBalance: 0, isAccountHeadLedger: false };
            }

            const isAccountHeadLedger = allAssetHeads.some(h => h.id === filters.individualId);
            const { startDate, endDate, subCategoryId, headId, individualId } = filters;
            let runningBalance = 0;
            const rows: any[] = [];
            const start = new Date(startDate);
            const end = new Date(endDate);

            let openingBalAmount = 0;

            if (individualId) {
                openingBalances.forEach(ob => {
                    if ((isAccountHeadLedger && ob.accountHeadId === individualId) || (!isAccountHeadLedger && ob.partyId === individualId)) {
                        openingBalAmount += (ob.debit - ob.credit); 
                    }
                });
                
                const txns: any[] = [];
                
                if (!isAccountHeadLedger) {
                    expenses.forEach(exp => {
                        if (exp.partyId !== individualId) return;
                        if (new Date(exp.date) < start) {
                            openingBalAmount += exp.amount;
                        } else if (new Date(exp.date) <= end) {
                            const headObj = nonPostingBankHeads.find(h => h.id === exp.accountHeadId);
                            if (subCategoryId !== 'all' && headObj?.subCategoryId !== subCategoryId) return;
                            if (headId !== 'all' && exp.accountHeadId !== headId) return;

                            const details = getAccountDetails(exp.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
                            txns.push({
                                date: exp.date, remarks: exp.description || details.headName, 
                                debit: exp.amount, credit: 0, rawDate: new Date(exp.date), sourceDoc: exp.voucherNo
                            });
                        }
                    });
                    manualReceipts.forEach(rec => {
                        if (rec.partyId !== individualId) return;
                        if (new Date(rec.date) < start) {
                            openingBalAmount -= rec.lineItems.reduce((s, i) => s + i.amount, 0);
                        } else if (new Date(rec.date) <= end) {
                            rec.lineItems.forEach(item => {
                                const headObj = nonPostingBankHeads.find(h => h.id === item.accountHeadId);
                                if (subCategoryId !== 'all' && headObj?.subCategoryId !== subCategoryId) return;
                                if (headId !== 'all' && item.accountHeadId !== headId) return;

                                const details = getAccountDetails(item.accountHeadId, accountHeads, accountSubCategories, accountCategories);
                                txns.push({
                                    date: rec.date, remarks: item.description || details.headName,
                                    debit: 0, credit: item.amount, rawDate: new Date(rec.date), sourceDoc: rec.receiptNo
                                });
                            });
                        }
                    });
                } else {
                    
                    expenses.forEach(exp => {
                        if (exp.bankId !== individualId) return;
                        
                        if (new Date(exp.date) < start) {
                            openingBalAmount -= exp.amount;
                        } else if (new Date(exp.date) <= end) {
                            const party = getPartyName(exp.partyType, exp.partyId, exp.paidTo);
                            const expenseHeadName = getAccountDetails(exp.accountHeadId || '', accountHeads, accountSubCategories, accountCategories).headName;
                            txns.push({
                                date: exp.date, remarks: `Paid for ${expenseHeadName} to ${party}`, 
                                debit: 0, credit: exp.amount, rawDate: new Date(exp.date), sourceDoc: exp.voucherNo
                            });
                        }
                    });

                    manualReceipts.forEach(rec => {
                        rec.lineItems.forEach(item => {
                            if (item.bankId !== individualId) return;

                            if (new Date(rec.date) < start) {
                                openingBalAmount += item.amount;
                            } else if (new Date(rec.date) <= end) {
                                const party = getPartyName(rec.partyType, rec.partyId, rec.receivedFrom);
                                const incomeHeadName = getAccountDetails(item.accountHeadId, accountHeads, accountSubCategories, accountCategories).headName;
                                txns.push({
                                    date: rec.date, remarks: `Rec'd for ${incomeHeadName} from ${party}`, 
                                    debit: item.amount, credit: 0, rawDate: new Date(rec.date), sourceDoc: rec.receiptNo
                                });
                            }
                        });
                    });
                }

                runningBalance = openingBalAmount;
                txns.sort((a,b) => a.rawDate.getTime() - b.rawDate.getTime());

                txns.forEach(t => {
                    runningBalance = runningBalance + t.debit - t.credit;
                    rows.push({ ...t, balance: runningBalance });
                });
            }

            const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
            const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

            return { openingBalAmount, rows, totalDebit, totalCredit, closingBalance: runningBalance, isAccountHeadLedger };

        }, [filters, openingBalances, expenses, manualReceipts, allAssetHeads, accountHeads, nonPostingBankHeads]);

        const handleExport = (type: 'excel' | 'print') => {
            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(ledgerData.rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Ledger");
                XLSX.writeFile(wb, `Ledger_${filters.startDate}.xlsx`);
            } else {
                printElement('ledger-table');
            }
        };
        
        const nonPostingHeadOptions = useMemo(() => nonPostingBankHeads.map(h => ({ value: h.id, label: h.name })), [nonPostingBankHeads]);

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Ledger</h3>
                    <div className="flex gap-2">
                        <Button variant="light" size="small" onClick={() => handleExport('excel')}><Download size={16}/> Excel</Button>
                        <Button variant="light" size="small" onClick={() => handleExport('print')}><Printer size={16}/> Print</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 bg-gray-50 p-3 rounded">
                    <Input label="From" type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}/>
                    <Input label="To" type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}/>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Party / Account Head</label>
                        <SearchableSelect label="" options={individualOptions} value={filters.individualId} onChange={(v) => setFilters({...filters, individualId: v, headId: 'all'})} placeholder="Search Customer, Staff, or Bank..."/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sub-Category</label>
                        <select value={filters.subCategoryId} onChange={e => setFilters({...filters, subCategoryId: e.target.value, headId: 'all'})} className="w-full border p-2 rounded-md text-sm shadow-sm" disabled={ledgerData.isAccountHeadLedger}>
                            <option value="all">All</option>
                            {accountSubCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Head (Non-Posting)</label>
                        <select value={filters.headId} onChange={e => setFilters({...filters, headId: e.target.value})} className="w-full border p-2 rounded-md text-sm shadow-sm" disabled={ledgerData.isAccountHeadLedger}>
                            <option value="all">All</option>
                            {}
                            {nonPostingHeadOptions.filter(h => filters.subCategoryId === 'all' || nonPostingBankHeads.find(npbh => npbh.id === h.value)?.subCategoryId === filters.subCategoryId).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-auto border rounded-lg" id="ledger-table">
                    {!filters.individualId ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Please select a party or account head to view the ledger.</div>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-500 border-collapse">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr><th className="border px-4 py-2">Date</th><th className="border px-4 py-2">Remarks</th><th className="border px-4 py-2 text-right">Debit</th><th className="border px-4 py-2 text-right">Credit</th><th className="border px-4 py-2 text-right">Balance</th></tr>
                            </thead>
                            <tbody>
                                <tr className="bg-yellow-50 font-medium">
                                    <td colSpan={2} className="border px-4 py-2 text-right">Opening Balance</td>
                                    <td className="border px-4 py-2 text-right">{ledgerData.openingBalAmount > 0 ? ledgerData.openingBalAmount.toLocaleString('en-IN') : '-'}</td>
                                    <td className="border px-4 py-2 text-right">{ledgerData.openingBalAmount < 0 ? Math.abs(ledgerData.openingBalAmount).toLocaleString('en-IN') : '-'}</td>
                                    <td className="border px-4 py-2 text-right font-bold">₹{ledgerData.openingBalAmount.toLocaleString('en-IN')}</td>
                                </tr>
                                {ledgerData.rows.map((row, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="border px-4 py-2">{row.date}</td>
                                        <td className="border px-4 py-2">{row.remarks}</td>
                                        <td className="border px-4 py-2 text-right text-red-600">{row.debit > 0 ? row.debit.toLocaleString('en-IN') : '-'}</td>
                                        <td className="border px-4 py-2 text-right text-green-600">{row.credit > 0 ? row.credit.toLocaleString('en-IN') : '-'}</td>
                                        <td className="border px-4 py-2 text-right font-medium">₹{row.balance.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                                <tr>
                                    <td colSpan={2} className="border px-4 py-2 text-right">Total</td>
                                    <td className="border px-4 py-2 text-right text-red-700">{ledgerData.totalDebit.toLocaleString('en-IN')}</td>
                                    <td className="border px-4 py-2 text-right text-green-700">{ledgerData.totalCredit.toLocaleString('en-IN')}</td>
                                    <td className="border px-4 py-2 text-right text-blue-700">₹{ledgerData.closingBalance.toLocaleString('en-IN')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    const TrialBalanceView = () => {
        const tbData = useMemo(() => {
            const balances: Record<string, { name: string, debit: number, credit: number }> = {};

            const update = (id: string, name: string, type: 'debit' | 'credit', amt: number) => {
                if(!balances[id]) balances[id] = { name, debit: 0, credit: 0 };
                balances[id][type] += amt;
            };

            openingBalances.forEach(ob => {
                if (ob.partyType === 'Internal') return;
                
                const name = getPartyName(ob.partyType, ob.partyId, 'Unknown');
                update(ob.partyId, name, 'debit', ob.debit);
                update(ob.partyId, name, 'credit', ob.credit);
            });

            expenses.forEach(exp => {
                if (exp.partyId) {
                    const party = getPartyName(exp.partyType, exp.partyId, 'Unknown');
                    update(exp.partyId, party, 'debit', exp.amount);
                }
            });

            manualReceipts.forEach(rec => {
                if (rec.partyId) {
                    const party = getPartyName(rec.partyType, rec.partyId, 'Unknown');
                    const total = rec.lineItems.reduce((s, i) => s + i.amount, 0);
                    update(rec.partyId, party, 'credit', total);
                }
            });

            return Object.values(balances).map(p => {
                const net = p.debit - p.credit;
                return { name: p.name, netDebit: net > 0 ? net : 0, netCredit: net < 0 ? Math.abs(net) : 0 };
            }).filter(r => r.netDebit > 0 || r.netCredit > 0);
        }, [openingBalances, expenses, manualReceipts]);

        const totalDr = tbData.reduce((s, r) => s + r.netDebit, 0);
        const totalCr = tbData.reduce((s, r) => s + r.netCredit, 0);

        const handleExport = (type: 'pdf' | 'excel' | 'print') => {
            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(tbData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
                XLSX.writeFile(wb, `Trial_Balance.xlsx`);
            } else {
                printElement('trial-balance-table');
            }
        };

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Trial Balance (Parties Only)</h3>
                    <div className="flex gap-2">
                        <Button variant="light" size="small" onClick={() => handleExport('excel')}><Download size={16}/> Excel</Button>
                        <Button variant="light" size="small" onClick={() => handleExport('print')}><Printer size={16}/> Print</Button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto border rounded-lg" id="trial-balance-table">
                    <table className="w-full text-sm text-left text-gray-500 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr><th className="border px-4 py-2">S.No</th><th className="border px-4 py-2">Party Name</th><th className="border px-4 py-2 text-right">Debit</th><th className="border px-4 py-2 text-right">Credit</th></tr>
                        </thead>
                        <tbody>
                            {tbData.map((row, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="border px-4 py-2">{idx + 1}</td>
                                    <td className="border px-4 py-2 font-medium">{row.name}</td>
                                    <td className="border px-4 py-2 text-right">{row.netDebit > 0 ? row.netDebit.toLocaleString('en-IN') : '-'}</td>
                                    <td className="border px-4 py-2 text-right">{row.netCredit > 0 ? row.netCredit.toLocaleString('en-IN') : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                            <tr>
                                <td colSpan={2} className="border px-4 py-2 text-right">Total</td>
                                <td className="border px-4 py-2 text-right text-red-700">{totalDr.toLocaleString('en-IN')}</td>
                                <td className="border px-4 py-2 text-right text-green-700">{totalCr.toLocaleString('en-IN')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    const PandLView = () => {
        const [overviewDate, setOverviewDate] = useState(new Date().toISOString().split('T')[0]);
        
        const data = useMemo(() => {
            let expTotal = 0, incTotal = 0;
            const transactionMap = new Map<string, { headName: string, subName: string, party: string, expenditure: number, income: number }>();

            const filteredHeads = nonPostingBankHeads;

            expenses.forEach(e => {
                if (e.date > overviewDate) return;
                if (allAssetHeads.some(h => h.id === e.accountHeadId)) return;

                const details = getAccountDetails(e.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
                const party = getPartyName(e.partyType, e.partyId, e.paidTo);
                const key = `${e.accountHeadId || 'unknown'}-${e.partyId || 'unknown'}`;
                
                if(!transactionMap.has(key)) transactionMap.set(key, { headName: details.headName, subName: details.subName, party: party, expenditure: 0, income: 0 });
                
                transactionMap.get(key)!.expenditure += e.amount;
                expTotal += e.amount;
            });

            manualReceipts.forEach(r => {
                if (r.date > overviewDate) return;
                const party = getPartyName(r.partyType, r.partyId, r.receivedFrom);
                
                r.lineItems.forEach(i => {
                    if (allAssetHeads.some(h => h.id === i.accountHeadId)) return;

                    const details = getAccountDetails(i.accountHeadId || '', accountHeads, accountSubCategories, accountCategories);
                    const key = `${i.accountHeadId || 'unknown'}-${r.partyId || 'unknown'}`;
                    
                    if(!transactionMap.has(key)) transactionMap.set(key, { headName: details.headName, subName: details.subName, party: party, expenditure: 0, income: 0 });
                    
                    transactionMap.get(key)!.income += i.amount;
                    incTotal += i.amount;
                });
            });

            return { rows: Array.from(transactionMap.values()).filter(r => r.expenditure > 0 || r.income > 0), expTotal, incTotal };
        }, [expenses, manualReceipts, overviewDate, accountCategories, accountSubCategories, accountHeads, allMembers, users, allAssetHeads, nonPostingBankHeads]);

        const handleExport = (type: 'pdf' | 'excel' | 'print') => {
            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(data.rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "PnL");
                XLSX.writeFile(wb, `PnL_${overviewDate}.xlsx`);
            } else {
                printElement('pl-table');
            }
        };

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Profit & Loss Overview</h3>
                    <div className="flex gap-2">
                        <input type="date" value={overviewDate} onChange={e => setOverviewDate(e.target.value)} className="border p-2 rounded text-sm"/>
                        <Button variant="light" size="small" onClick={() => handleExport('excel')}><Download size={16}/> Excel</Button>
                        <Button variant="light" size="small" onClick={() => handleExport('print')}><Printer size={16}/> Print</Button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto border rounded-lg" id="pl-table">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 font-bold sticky top-0">
                             <tr><th className="border px-4 py-2">Sub Category</th><th className="border px-4 py-2">Account Head</th><th className="border px-4 py-2">Party</th><th className="border px-4 py-2 text-right">Expense</th><th className="border px-4 py-2 text-right">Income</th><th className="border px-4 py-2 text-right">Net</th></tr>
                        </thead>
                        <tbody>
                            {data.rows.map((r, i) => (
                                <tr key={i} className="border-b">
                                    <td className="border px-4 py-2">{r.subName}</td>
                                    <td className="border px-4 py-2 font-semibold">{r.headName}</td>
                                    <td className="border px-4 py-2">{r.party}</td>
                                    <td className="border px-4 py-2 text-right text-red-600">{r.expenditure>0?r.expenditure.toLocaleString('en-IN'):'-'}</td>
                                    <td className="border px-4 py-2 text-right text-green-600">{r.income>0?r.income.toLocaleString('en-IN'):'-'}</td>
                                    <td className="border px-4 py-2 text-right font-bold">{(r.income-r.expenditure).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                            <tr>
                                <td colSpan={3} className="border px-4 py-2 text-right">Total</td>
                                <td className="border px-4 py-2 text-right text-red-700">{data.expTotal.toLocaleString('en-IN')}</td>
                                <td className="border px-4 py-2 text-right text-green-700">{data.incTotal.toLocaleString('en-IN')}</td>
                                <td className={`border px-4 py-2 text-right ${data.incTotal - data.expTotal >= 0 ? 'text-green-800' : 'text-red-800'}`}>{(data.incTotal - data.expTotal).toLocaleString('en-IN')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white shrink-0">Accounts</h2>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700 inline-flex gap-2 shrink-0 flex-wrap">
                <button onClick={() => setActiveTab('openingBalance')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'openingBalance' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Opening Balance</button>
                <button onClick={() => setActiveTab('daybook')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'daybook' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Day Book</button>
                <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'ledger' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Ledger</button>
                <button onClick={() => setActiveTab('trialBalance')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'trialBalance' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Trial Balance</button>
                <button onClick={() => setActiveTab('pl')} className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'pl' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>P & L</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'openingBalance' && <OpeningBalanceView />}
                {activeTab === 'daybook' && <DayBookView />}
                {activeTab === 'ledger' && <LedgerView />}
                {activeTab === 'trialBalance' && <TrialBalanceView />}
                {activeTab === 'pl' && <PandLView />}
            </div>
        </div>
    );
};

export default Accounts;
