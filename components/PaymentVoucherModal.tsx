import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Company, Expense, ExpenseCategoryLevel1, ExpenseCategoryLevel2, ExpenseCategoryLevel3, FinRootsBranch, DocumentNumbering } from '../types.ts';
import { Download, X, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
// @ts-ignore
import * as htmlToImage from 'https://cdn.skypack.dev/html-to-image';

// --- Type Definitions ---

export interface VoucherLineItem {
    id: string; // Can be existing expense ID or a temporary ID for new/manual lines
    expenseHead: string;
    description: string;
    fullCategoryPath: string;
    modeOfPayment: 'Cash' | 'UPI' | 'Net Banking' | 'Cheque';
    amount: number;
    isNew: boolean; // Flag to know if this is a new expense to be created
}

export interface VoucherSaveData {
    voucherNo: string;
    date: string;
    payeeName: string;
    branchId: string;
    finYearId: string; // NEW: Link to financial year
    lineItems: VoucherLineItem[];
}

interface PaymentVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyInfo: Company | null;
    branches: FinRootsBranch[];
    expenseCategoriesLevel1: ExpenseCategoryLevel1[];
    expenseCategoriesLevel2: ExpenseCategoryLevel2[];
    expenseCategoriesLevel3: ExpenseCategoryLevel3[];
    onSave: (data: VoucherSaveData) => void;
    voucherToEdit: Expense[] | null;
    triggerExport: boolean;
    canCreate: boolean;
    canModify: boolean;
    // --- NEW: Props for FY-based numbering ---
    activeFinancialYearId: string | null;
    docNumberingConfig: DocumentNumbering | null;
    lastVoucherNumber: number;
}


// --- Helper Functions & Components ---

const Button: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'light' | 'success' | 'danger';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
    as?: 'button' | 'span';
    size?: 'small' | 'medium';
}> = ({ onClick, children, variant = 'primary', disabled = false, className = '', type = 'button', as = 'button', size = 'medium' }) => {
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
        <Tag type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
            {children}
        </Tag>
    );
};

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (isNaN(num) || num === null) return 'Invalid Number';
    if (num === 0) return 'Zero Only';
    if (num > 999999999) return 'Number too large';

    const inWords = (n: number): string => {
        let str = '';
        if (n > 99) {
            str += a[Math.floor(n / 100)] + 'Hundred ';
            n %= 100;
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' : '') + a[n % 10];
        } else {
            str += a[n];
        }
        return str;
    };

    let result = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;

    if (crore > 0) {
        result += inWords(crore) + 'Crore ';
    }
    if (lakh > 0) {
        result += inWords(lakh) + 'Lakh ';
    }
    if (thousand > 0) {
        result += inWords(thousand) + 'Thousand ';
    }
    if (num > 0) {
        result += inWords(num);
    }

    return result.trim().replace(/\s\s+/g, ' ') + ' Only';
};

// --- Main Component ---

const PaymentVoucherModal: React.FC<PaymentVoucherModalProps> = ({
    isOpen,
    onClose,
    companyInfo,
    branches,
    expenseCategoriesLevel1,
    expenseCategoriesLevel2,
    expenseCategoriesLevel3,
    onSave,
    voucherToEdit,
    triggerExport,
    canCreate,
    canModify,
    activeFinancialYearId,
    docNumberingConfig,
    lastVoucherNumber,
}) => {
    // Voucher-level state
    const [voucherNo, setVoucherNo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payeeName, setPayeeName] = useState('');
    const [branchId, setBranchId] = useState<string>(branches.length > 0 ? branches[0].id : '');
    const [lineItems, setLineItems] = useState<VoucherLineItem[]>([]);
    
    // State for the "Log Expense" form integrated at the top
    const [logExpenseForm, setLogExpenseForm] = useState({
        categoryLevel1Id: '',
        categoryLevel2Id: '',
        categoryLevel3Id: '',
    });

    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const branchDropdownRef = useRef<HTMLDivElement>(null);

    const voucherRef = useRef<HTMLDivElement>(null);

    const isEditable = useMemo(() => {
        return voucherToEdit ? canModify : canCreate;
    }, [voucherToEdit, canCreate, canModify]);

    // Memos for category dropdowns
    const l1Map = useMemo(() => new Map(expenseCategoriesLevel1.map(c => [c.id, c.name])), [expenseCategoriesLevel1]);
    const l2Map = useMemo(() => new Map(expenseCategoriesLevel2.map(c => [c.id, c.name])), [expenseCategoriesLevel2]);
    const l3Map = useMemo(() => new Map(expenseCategoriesLevel3.map(c => [c.id, c.name])), [expenseCategoriesLevel3]);

    const l2Options = useMemo(() => logExpenseForm.categoryLevel1Id ? expenseCategoriesLevel2.filter(c => c.parentId === logExpenseForm.categoryLevel1Id) : [], [logExpenseForm.categoryLevel1Id, expenseCategoriesLevel2]);
    const l3Options = useMemo(() => logExpenseForm.categoryLevel2Id ? expenseCategoriesLevel3.filter(c => c.parentId === logExpenseForm.categoryLevel2Id) : [], [logExpenseForm.categoryLevel2Id, expenseCategoriesLevel3]);

    // Click outside handler for branch dropdown
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
                setIsBranchDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Initialize or reset the modal state
    useEffect(() => {
        if (isOpen) {
            if (voucherToEdit) { // Editing existing voucher
                const firstExpense = voucherToEdit[0];
                setVoucherNo(firstExpense.voucherNo || `VCH-TEMP-${Date.now()}`); // Use existing number
                setDate(firstExpense.date);
                setPayeeName(firstExpense.paidTo || '');
                setBranchId(firstExpense.branchId || (branches.length > 0 ? branches[0].id : ''));
                
                const items = voucherToEdit.map(exp => {
                    const path = [];
                    if (exp.categoryLevel1Id) path.push(l1Map.get(exp.categoryLevel1Id));
                    if (exp.categoryLevel2Id) path.push(l2Map.get(exp.categoryLevel2Id));
                    if (exp.categoryLevel3Id) path.push(l3Map.get(exp.categoryLevel3Id));

                    return {
                        id: exp.id,
                        expenseHead: exp.expenseHead || path[path.length - 1] || 'Manual',
                        description: exp.description,
                        fullCategoryPath: path.filter(Boolean).join(' > '),
                        modeOfPayment: exp.modeOfPayment || 'Cash',
                        amount: exp.amount,
                        isNew: false,
                    };
                });
                setLineItems(items);

                if (triggerExport && voucherRef.current) {
                    setTimeout(exportImage, 500); // Timeout to allow rendering
                }

            } else { // Creating new voucher
                if (docNumberingConfig) {
                    const nextNumber = docNumberingConfig.startingNumber + lastVoucherNumber;
                    const suffix = docNumberingConfig.suffix || '';
                    setVoucherNo(`${docNumberingConfig.prefix}${nextNumber}${suffix}`);
                } else {
                    setVoucherNo(`TEMP-${lastVoucherNumber + 1}`); // Fallback
                }
                
                setDate(new Date().toISOString().split('T')[0]);
                setPayeeName('');
                setBranchId(branches.length > 0 ? branches[0].id : '');
                setLineItems([]);
                setLogExpenseForm({ categoryLevel1Id: '', categoryLevel2Id: '', categoryLevel3Id: '' });
            }
        }
    }, [isOpen, voucherToEdit, lastVoucherNumber, docNumberingConfig, triggerExport, branches, l1Map, l2Map, l3Map]);


    const handleCategoryChange = (level: 'categoryLevel1Id' | 'categoryLevel2Id' | 'categoryLevel3Id', value: string) => {
        setLogExpenseForm(prev => {
            const newState = { ...prev, [level]: value };
            if (level === 'categoryLevel1Id') { newState.categoryLevel2Id = ''; newState.categoryLevel3Id = ''; }
            if (level === 'categoryLevel2Id') { newState.categoryLevel3Id = ''; }
            return newState;
        });
    };

    const addLineItemFromCategory = () => {
        if (!logExpenseForm.categoryLevel1Id) {
            alert('Please select an Expense Category.');
            return;
        }

        const path = [];
        let expenseHead = '';

        if (logExpenseForm.categoryLevel1Id) {
            const l1 = l1Map.get(logExpenseForm.categoryLevel1Id);
            if (l1) { path.push(l1); expenseHead = l1; }
        }
        if (logExpenseForm.categoryLevel2Id) {
             const l2 = l2Map.get(logExpenseForm.categoryLevel2Id);
            if (l2) { path.push(l2); expenseHead = l2; }
        }
        if (logExpenseForm.categoryLevel3Id) {
             const l3 = l3Map.get(logExpenseForm.categoryLevel3Id);
            if (l3) { path.push(l3); expenseHead = l3; }
        }

        const newLine: VoucherLineItem = {
            id: `new-${Date.now()}`,
            expenseHead,
            description: '',
            fullCategoryPath: path.join(' > '),
            modeOfPayment: 'Cash',
            amount: 0,
            isNew: true,
        };
        setLineItems(prev => [...prev, newLine]);
    };

    const addManualLine = () => {
        const newLine: VoucherLineItem = {
            id: `new-${Date.now()}`,
            expenseHead: '',
            description: '',
            fullCategoryPath: 'Manual Entry',
            modeOfPayment: 'Cash',
            amount: 0,
            isNew: true,
        };
        setLineItems(prev => [...prev, newLine]);
    };

    const removeLine = (id: string) => {
        setLineItems(prev => prev.filter(item => item.id !== id));
    };

    const updateLineItem = (id: string, field: keyof Omit<VoucherLineItem, 'id'>, value: any) => {
        setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    // Calculations for display
    const totalAmount = useMemo(() => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [lineItems]);
    const amountInWords = useMemo(() => numberToWords(totalAmount), [totalAmount]);

    const handleSave = (shouldExport: boolean) => {
        if (!payeeName.trim()) {
            alert('Payee Name is required.');
            return;
        }
        if (lineItems.length === 0) {
            alert('Voucher must have at least one line item.');
            return;
        }
        if (!activeFinancialYearId) {
            alert('Cannot save: Active Financial Year not found.');
            return;
        }

        const saveData: VoucherSaveData = {
            voucherNo,
            date,
            payeeName,
            branchId,
            finYearId: activeFinancialYearId, // Add active FY ID
            lineItems
        };
        onSave(saveData);

        if (shouldExport) {
            setTimeout(exportImage, 100);
        } else {
            onClose();
        }
    };

    const exportImage = () => {
        if (voucherRef.current) {
            htmlToImage.toPng(voucherRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' })
                .then((dataUrl: string) => {
                    const link = document.createElement('a');
                    link.download = `PaymentVoucher-${voucherNo.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    link.href = dataUrl;
                    link.click();
                    onClose();
                }).catch((err: Error) => {
                    console.error('Voucher export failed:', err)
                    onClose();
                });
        } else {
            onClose();
        }
    };


    if (!isOpen) return null;

    const selectedBranchName = branches.find(b => b.id === branchId)?.branchName || 'Select Branch';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Payment Voucher</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="text-gray-600 dark:text-gray-300" /></button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {isEditable && (
                        <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
                            <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Voucher Setup & Auto-Generation</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="text-sm font-medium">Expense Category</label>
                                    <select value={logExpenseForm.categoryLevel1Id} onChange={e => handleCategoryChange('categoryLevel1Id', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-500"><option value="">Select Category...</option>{expenseCategoriesLevel1.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                </div>
                                 <div>
                                    <label className="text-sm font-medium">Expense Head</label>
                                    <select value={logExpenseForm.categoryLevel2Id} onChange={e => handleCategoryChange('categoryLevel2Id', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-500" disabled={!logExpenseForm.categoryLevel1Id}><option value="">Select Head...</option>{l2Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                </div>
                                 <div>
                                    <label className="text-sm font-medium">Individual Category</label>
                                    <select value={logExpenseForm.categoryLevel3Id} onChange={e => handleCategoryChange('categoryLevel3Id', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-500" disabled={!logExpenseForm.categoryLevel2Id}><option value="">Select Individual...</option>{l3Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                </div>
                                <Button onClick={addLineItemFromCategory} variant="secondary" className="w-full">
                                    <Plus size={16} /> Add to Voucher
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div ref={voucherRef} id="payment-voucher" className="bg-white p-8 border-2 border-gray-500 font-serif text-black">
                        {/* Voucher Header */}
                        <div className="text-center mb-4">
                            <h1 className="text-3xl font-bold">{companyInfo?.name || 'Your Company'}</h1>
                            <div className="flex justify-center items-center text-sm gap-2 mt-1">
                                <span className="font-semibold">{companyInfo?.companyCode}</span>
                                <div ref={branchDropdownRef} className="relative inline-block text-left">
                                    <button type="button" onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} className="inline-flex justify-center items-center w-full rounded-md px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed" disabled={!isEditable}>
                                        {selectedBranchName}
                                        <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
                                    </button>
                                    {isBranchDropdownOpen && (
                                        <div className="origin-top-center absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                {branches.map(branch => (
                                                    <a href="#" key={branch.id} onClick={(e) => { e.preventDefault(); setBranchId(branch.id); setIsBranchDropdownOpen(false); }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                                                        {branch.branchName}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-1/3"></div> {/* Left Spacer */}
                            <div className="w-1/3 text-center">
                                <div className="bg-gray-800 text-white px-4 py-1 text-lg font-bold inline-block">PAYMENT VOUCHER</div>
                            </div>
                            <div className="w-1/3 text-right text-sm space-y-1">
                                <div className="flex items-center justify-end">
                                    <p className="font-semibold shrink-0">Voucher No.:</p>
                                    <span className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 min-w-[120px] text-left">{voucherNo}</span>
                                </div>
                                <div className="flex items-center justify-end">
                                    <p className="font-semibold shrink-0">Date:</p>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 focus:outline-none bg-transparent" disabled={!isEditable} />
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="font-semibold">Name: <input type="text" value={payeeName} onChange={e => setPayeeName(e.target.value)} placeholder="Enter payee name..." className="font-normal w-3/4 border-b border-dotted border-gray-500 px-2 focus:outline-none bg-transparent" disabled={!isEditable} /></p>
                        </div>

                        {/* Particulars Table */}
                        <table className="w-full border-collapse border-2 border-black text-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black p-1 text-center font-bold w-12">S.No</th>
                                    <th className="border border-black p-1 text-center font-bold">Expenses Head</th>
                                    <th className="border border-black p-1 text-center font-bold w-2/5">Description</th>
                                    <th className="border border-black p-1 text-center font-bold">Mode of Payment</th>
                                    <th className="border border-black p-1 text-center font-bold w-40">Amount</th>
                                    {isEditable && <th className="border border-black p-1 text-center font-bold w-12"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="border border-black p-1 text-center">{index + 1}</td>
                                        <td className="border border-black p-1">
                                            <input type="text" value={item.expenseHead} onChange={e => updateLineItem(item.id, 'expenseHead', e.target.value)} className="w-full h-full border-none focus:outline-none bg-transparent p-1" disabled={!isEditable} />
                                        </td>
                                        <td className="border border-black p-1">
                                            <textarea value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="w-full h-full border-none focus:outline-none bg-transparent p-1 resize-none" rows={2} disabled={!isEditable} />
                                            <p className="text-xs text-gray-500 px-1">{item.fullCategoryPath}</p>
                                        </td>
                                        <td className="border border-black p-1">
                                            <select value={item.modeOfPayment} onChange={e => updateLineItem(item.id, 'modeOfPayment', e.target.value as any)} className="w-full h-full border-none focus:outline-none bg-transparent p-1" disabled={!isEditable}>
                                                <option>Cash</option>
                                                <option>UPI</option>
                                                <option>Net Banking</option>
                                                <option>Cheque</option>
                                            </select>
                                        </td>
                                        <td className="border border-black p-1 text-right w-40">
                                            <input type="number" value={item.amount || ''} onChange={e => updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full h-full border-none focus:outline-none bg-transparent text-right p-1" disabled={!isEditable} />
                                        </td>
                                        {isEditable && (
                                            <td className="border border-black p-1 text-center">
                                                <button type="button" onClick={() => removeLine(item.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {/* --- START OF FIX: Corrected Total Row Layout --- */}
                                <tr className="bg-gray-200 font-bold">
                                    <td colSpan={3} className="border border-black p-2"></td>
                                    <td className="border border-black p-2 text-right">Total Rs.</td>
                                    <td className="border border-black p-2 text-right">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    {isEditable && <td className="border border-black p-2"></td>}
                                </tr>
                                {/* --- END OF FIX --- */}
                            </tbody>
                        </table>
                        <div className="mt-2 p-2 border-2 border-black"><p className="font-semibold">Amount in Words: <span className="font-normal">{amountInWords}</span></p></div>
                        <div className="mt-16 flex justify-between items-end text-sm"><p className="border-t border-dotted border-gray-600 pt-1 px-8">Prepared</p><p className="border-t border-dotted border-gray-600 pt-1 px-8">Passed</p><p className="border-t border-dotted border-gray-600 pt-1 px-8">Receiver's Signature</p></div>
                    </div>
                    {isEditable && (
                        <div className="text-center mt-4">
                            <button onClick={addManualLine} className="flex items-center gap-2 mx-auto px-3 py-1.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"><Plus size={14}/> Add New Manual Line</button>
                        </div>
                    )}
                </div>
                 {/* Modal Footer */}
                <div className="p-4 flex justify-end items-center border-t dark:border-gray-700 flex-shrink-0 gap-4">
                    {isEditable ? (
                        <>
                            <Button onClick={() => handleSave(false)} variant="success">
                                <Save size={16} /> Save Voucher
                            </Button>
                            <Button onClick={() => handleSave(true)} variant="primary">
                                <Download size={16} /> Save & Export
                            </Button>
                        </>
                    ) : (
                        <Button onClick={exportImage} variant="primary">
                            <Download size={16} /> Export
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentVoucherModal;