import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Company, DocumentNumbering, User, ManualReceipt, Member, BankMaster, Branch, AccountCategory, AccountSubCategory, AccountHead } from '../types.ts';
import { Download, X, Plus, Trash2, Save, User as UserIcon, Users as UsersIcon, ChevronDown } from 'lucide-react';
// @ts-ignore
import * as htmlToImage from 'https://cdn.skypack.dev/html-to-image';
import SearchableSelect from './ui/SearchableSelect.tsx';

interface LineItem {
    id: string; 
    accountHeadId: string;
    accountHeadName: string; 
    fullCategoryPath: string; 
    description: string;
    paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'NetBanking';
    amount: number;
    
    bankId?: string; 
    
    chequeDrawnOnBankId?: string;

    isNew?: boolean; 
}

export interface ReceiptSaveData {
    id?: string;
    receiptNo: string;
    date: string;
    receivedFrom: string;
    partyId: string;
    partyType: 'Customer' | 'Staff';
    address?: string;
    branch_id: string; 
    finYearId: string;
    lineItems: any[]; 
    docNo?: string;
    docDate?: string;
    isPaymentReturned?: boolean;
}

interface ManualReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyInfo: Company | null;
    currentUser: User | null;
    branches: Branch[]; 
    
    users: User[];
    allMembers: Member[];
    bankMasters: BankMaster[]; 
    
    accountCategories: AccountCategory[];
    accountSubCategories: AccountSubCategory[];
    accountHeads: AccountHead[]; 

    activeFinancialYearId: string | null;
    docNumberingConfig: DocumentNumbering | null;
    lastReceiptNumber: number;
    onSave: (data: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string }) => void;
    receiptToEdit?: ManualReceipt | null;
    triggerExport?: boolean;
}

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
        if (n > 99) { str += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
        if (n > 19) { str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' : '') + a[n % 10]; } else { str += a[n]; }
        return str;
    };
    let result = '';
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    if (crore > 0) result += inWords(crore) + 'Crore ';
    if (lakh > 0) result += inWords(lakh) + 'Lakh ';
    if (thousand > 0) result += inWords(thousand) + 'Thousand ';
    if (num > 0) result += inWords(num);
    return result.trim().replace(/\s\s+/g, ' ') + ' Only';
};

const ManualReceiptModal: React.FC<ManualReceiptModalProps> = ({
    isOpen, onClose, companyInfo, currentUser, branches,
    users, allMembers, bankMasters,
    accountCategories, accountSubCategories, accountHeads,
    activeFinancialYearId, docNumberingConfig, lastReceiptNumber,
    onSave, receiptToEdit, triggerExport = false,
}) => {
    const [receiptNo, setReceiptNo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [branch_id, setBranchId] = useState<string>(branches.length > 0 ? branches[0].id : '');
    
    const [isCustomer, setIsCustomer] = useState(true);
    const [selectedPartyId, setSelectedPartyId] = useState('');
    
    const [docNo, setDocNo] = useState('');
    const [docDate, setDocDate] = useState('');
    const [drawnOnBankId, setDrawnOnBankId] = useState(''); 
    
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [selectedHeadId, setSelectedHeadId] = useState('');
    
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const branchDropdownRef = useRef<HTMLDivElement>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const isEditable = !triggerExport; 


    const partyOptions = useMemo(() => {
        if (isCustomer) {
            return allMembers.map(m => ({ value: m.id, label: `${m.name} (${m.memberId})` }));
        } else {
            return users.map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }));
        }
    }, [isCustomer, allMembers, users]);

    const incomeHeadOptions = useMemo(() => {
        return accountHeads
            .filter(head => !head.postingBank && !head.isCash) 
            .map(head => ({ value: head.id, label: head.name }));
    }, [accountHeads]);

    const bankOptions = useMemo(() => {
        return accountHeads
            .filter(head => head.postingBank) 
            .map(head => ({ value: head.id, label: head.name }));
    }, [accountHeads]);

    const cashOptions = useMemo(() => {
        return accountHeads
            .filter(head => head.isCash)
            .map(head => ({ value: head.id, label: head.name }));
    }, [accountHeads]);

    const externalBankOptions = useMemo(() => {
        return bankMasters.map(b => ({ value: b.id, label: b.bankName }));
    }, [bankMasters]);

    const getHeadDetails = (headId: string) => {
        const head = accountHeads.find(h => h.id === headId);
        if (!head) return null;
        const sub = accountSubCategories.find(s => s.id === head.subCategoryId);
        const cat = accountCategories.find(c => c.id === sub?.categoryId);
        return {
            headName: head.name,
            subName: sub?.name || 'Unknown',
            fullPath: `${cat?.name || 'Unknown'} > ${sub?.name || 'Unknown'}`,
        };
    };

    const displayedReceivedFrom = useMemo(() => {
        if (!selectedPartyId) return '';
        const option = partyOptions.find(o => o.value === selectedPartyId);
        return option ? option.label.split(' (')[0] : '';
    }, [selectedPartyId, partyOptions]);


    useEffect(() => {
        if (isOpen) {
            if (receiptToEdit) {
                setReceiptNo(receiptToEdit.receiptNo);
                setDate(receiptToEdit.date);
                setBranchId(receiptToEdit.branch_id || (branches.length > 0 ? branches[0].id : ''));
                setIsCustomer(receiptToEdit.partyType === 'Customer');
                setSelectedPartyId(receiptToEdit.partyId);
                setDocNo(receiptToEdit.docNo || '');
                setDocDate(receiptToEdit.docDate || '');
                
                const chequeItem = receiptToEdit.lineItems.find(i => i.paymentMode === 'Cheque');
                setDrawnOnBankId(chequeItem?.chequeDrawnOnBankId || '');

                const mappedItems: LineItem[] = receiptToEdit.lineItems.map((item, index) => {
                    const details = getHeadDetails(item.accountHeadId);
                    return {
                        id: item.id || `li-${Date.now()}-${index}`,
                        accountHeadId: item.accountHeadId || '',
                        accountHeadName: details?.headName || 'Unknown',
                        fullCategoryPath: details?.fullPath || 'Unknown',
                        description: item.description,
                        paymentMode: item.paymentMode,
                        amount: item.amount,
                        bankId: item.bankId, 
                        isNew: false
                    };
                });
                setLineItems(mappedItems);
            } else {
                if (docNumberingConfig) {
                    const nextNumber = docNumberingConfig.startingNumber + lastReceiptNumber;
                    const suffix = docNumberingConfig.suffix || '';
                    setReceiptNo(`${docNumberingConfig.prefix}${nextNumber}${suffix}`);
                } else {
                    setReceiptNo(`TEMP-${lastReceiptNumber + 1}`);
                }
                setDate(new Date().toISOString().split('T')[0]);
                setBranchId(branches.length > 0 ? branches[0].id : '');
                setIsCustomer(true);
                setSelectedPartyId('');
                setDocNo('');
                setDocDate('');
                setDrawnOnBankId('');
                setLineItems([]);
                setSelectedHeadId('');
            }

            if (triggerExport) {
                setTimeout(exportImage, 300);
            }
        }
    }, [isOpen, receiptToEdit, docNumberingConfig, lastReceiptNumber, triggerExport, branches]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
                setIsBranchDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);


    const addLineItemFromCategory = () => {
        if (!selectedHeadId) {
            alert('Please select an Income Category.');
            return;
        }
        const details = getHeadDetails(selectedHeadId);
        if (!details) {
            alert('Invalid Account Head.');
            return;
        }

        const defaultCash = cashOptions.length > 0 ? cashOptions[0].value : '';

        const newLine: LineItem = {
            id: `new-${Date.now()}`,
            accountHeadId: selectedHeadId,
            accountHeadName: details.headName,
            fullCategoryPath: details.fullPath,
            description: '',
            paymentMode: 'Cash',
            amount: 0,
            bankId: defaultCash,
            isNew: true
        };
        setLineItems(prev => [...prev, newLine]);
        setSelectedHeadId(''); 
    };

    const removeLine = (id: string) => {
        setLineItems(prev => prev.filter(item => item.id !== id));
    };

    const updateLineItem = (id: string, field: keyof Omit<LineItem, 'id'>, value: any) => {
        setLineItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                
                if (field === 'paymentMode') {
                    if (value === 'Cash') {
                        updatedItem.bankId = cashOptions.length > 0 ? cashOptions[0].value : ''; 
                    } else {
                        updatedItem.bankId = ''; 
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const totalAmount = useMemo(() => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [lineItems]);
    const amountInWords = useMemo(() => numberToWords(totalAmount), [totalAmount]);
    
    const hasChequePayment = useMemo(() => lineItems.some(item => item.paymentMode === 'Cheque'), [lineItems]);
    const hasNonCashPayment = useMemo(() => lineItems.some(item => item.paymentMode !== 'Cash'), [lineItems]);

    const handleSave = (shouldExport: boolean) => {
        if (!selectedPartyId) {
            alert('Please select Received From.');
            return;
        }
        if (lineItems.length === 0) {
            alert('Receipt must have at least one line item.');
            return;
        }
        if (totalAmount <= 0) {
            alert('Amount must be greater than zero.');
            return;
        }
        
        const missingBankCash = lineItems.find(item => !item.bankId);
        if (missingBankCash) {
            alert('Please select "Deposit To" (Bank/Cash) for all entries. Check Cash/Bank selection.');
            return;
        }
        
        if (hasChequePayment && !drawnOnBankId) {
            alert('Please select "Drawn On Bank" for the Cheque payment.');
            return;
        }

        if (!activeFinancialYearId) {
            alert('Active Financial Year not found.');
            return;
        }
        
        const saveData: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string } = {
            id: receiptToEdit?.id,
            receiptNo,
            date,
            receivedFrom: displayedReceivedFrom,
            partyId: selectedPartyId,
            partyType: isCustomer ? 'Customer' : 'Staff',
            branch_id,
            finYearId: activeFinancialYearId,
            docNo,
            docDate,
            lineItems: lineItems.map((item) => ({
                id: item.isNew ? undefined : item.id,
                accountHeadId: item.accountHeadId, 
                description: item.description,
                paymentMode: item.paymentMode,
                amount: item.amount,
                bankId: item.bankId, 
                chequeDrawnOnBankId: item.paymentMode === 'Cheque' ? drawnOnBankId : undefined 
            })),
            isPaymentReturned: false 
        };
        onSave(saveData);

        if (shouldExport && !triggerExport) {
            setTimeout(exportImage, 100);
        } else if (!shouldExport) {
            onClose();
        }
    };

    const exportImage = () => {
        if (receiptRef.current) {
            htmlToImage.toPng(receiptRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' })
                .then((dataUrl: string) => {
                     const link = document.createElement('a');
                     link.download = `Receipt-${receiptNo.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                     link.href = dataUrl;
                    link.click();
                    onClose();
                }).catch((err: Error) => {
                    console.error('Receipt export failed:', err)
                    onClose();
                });
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const selectedbranch_name = branches.find(b => b.id === branch_id)?.branch_name || 'Select Branch';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manual Receipt</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="text-gray-600 dark:text-gray-300" /></button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    
                    {isEditable && (
                        <div className="space-y-6 mb-6">
                            {/* Party Select */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">Received From</h4>
                                    <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-1">
                                        <button onClick={() => { setIsCustomer(false); setSelectedPartyId(''); }} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${!isCustomer ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}><UsersIcon size={12}/> Staff</button>
                                        <button onClick={() => { setIsCustomer(true); setSelectedPartyId(''); }} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${isCustomer ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}><UserIcon size={12}/> Customer</button>
                                    </div>
                                </div>
                                <SearchableSelect
                                    label={isCustomer ? "Select Customer" : "Select Staff"}
                                    options={partyOptions}
                                    value={selectedPartyId}
                                    onChange={setSelectedPartyId}
                                    placeholder={`Search ${isCustomer ? 'Customer' : 'Staff'}...`}
                                />
                            </div>

                            {/* Income Category Selection */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                                <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Add Income Category</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="md:col-span-2">
                                        <SearchableSelect 
                                            label="Income Head (Category)" 
                                            options={incomeHeadOptions} 
                                            value={selectedHeadId} 
                                            onChange={setSelectedHeadId}
                                            placeholder="Select Income Category (e.g. Sales)..."
                                        />
                                    </div>
                                    <div>
                                        <Button onClick={addLineItemFromCategory} variant="secondary" className="w-full" size="small" disabled={!selectedHeadId}><Plus size={14} /> Add Line Item</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Receipt Preview/Edit Table */}
                    <div ref={receiptRef} id="manual-receipt" className="bg-white p-8 border-2 border-gray-500 font-serif text-black mx-auto">
                        <div className="text-center mb-4">
                            <h1 className="text-3xl font-bold">{companyInfo?.name || 'Your Company'}</h1>
                            <div className="flex justify-center items-center text-sm gap-2 mt-1">
                                <span className="font-semibold">{companyInfo?.comp_code}</span>
                                {/* Branch Dropdown */}
                                <div ref={branchDropdownRef} className="relative inline-block text-left">
                                    <button type="button" onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} className="inline-flex justify-center items-center w-full rounded-md px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed" disabled={!isEditable}>
                                        {selectedbranch_name}
                                        <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
                                    </button>
                                    {isBranchDropdownOpen && (
                                        <div className="origin-top-center absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div className="py-1">
                                                {branches.map(branch => (
                                                    <a href="#" key={branch.id} onClick={(e) => { e.preventDefault(); setBranchId(branch.id); setIsBranchDropdownOpen(false); }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">
                                                        {branch.branch_name}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-1/3"></div>
                            <div className="w-1/3 text-center">
                                <div className="bg-gray-800 text-white px-4 py-1 text-lg font-bold inline-block">RECEIPT</div>
                            </div>
                            <div className="w-1/3 text-right text-sm space-y-1">
                                <div className="flex items-center justify-end">
                                    <p className="font-semibold shrink-0">Receipt No.:</p>
                                    <span className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 min-w-[120px] text-left">{receiptNo}</span>
                                </div>
                                <div className="flex items-center justify-end">
                                    <p className="font-semibold shrink-0">Date:</p>
                                    <span className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 min-w-[120px] text-left">{date}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="font-semibold flex items-center">
                                Received From: 
                                <span className="font-normal w-3/4 border-b border-dotted border-gray-500 px-2 ml-2 bg-transparent inline-block min-h-[24px]">
                                    {displayedReceivedFrom || <span className="text-gray-400 italic text-xs">Select party above</span>}
                                </span>
                            </p>
                        </div>

                        {/* Particulars Table */}
                        <table className="w-full border-collapse border-2 border-black text-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black p-1 text-center font-bold w-8">#</th>
                                    <th className="border border-black p-1 text-center font-bold">Income Category</th>
                                    <th className="border border-black p-1 text-center font-bold w-1/4">Description</th>
                                    <th className="border border-black p-1 text-center font-bold w-48">Settlement (Internal)</th>
                                    <th className="border border-black p-1 text-center font-bold w-28">Amount</th>
                                    {isEditable && <th className="border border-black p-1 text-center font-bold w-8"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="border border-black p-1 text-center align-top pt-2">{index + 1}</td>
                                        
                                        {/* Income Category */}
                                        <td className="border border-black p-1 align-top">
                                            <div className="font-semibold">{item.accountHeadName}</div>
                                            <div className="text-xs text-gray-500">{item.fullCategoryPath}</div>
                                        </td>
                                        
                                        {/* Description */}
                                        <td className="border border-black p-1 align-top">
                                            <textarea value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="w-full border-none focus:outline-none bg-transparent p-1 resize-none" rows={2} placeholder="Remarks..." disabled={!isEditable} />
                                        </td>
                                        
                                        {/* Settlement Mode & Target Bank/Cash */}
                                        <td className="border border-black p-1 align-top">
                                            <div className="flex flex-col gap-1 p-1">
                                                <select value={item.paymentMode} onChange={e => updateLineItem(item.id, 'paymentMode', e.target.value as any)} className="w-full border-none focus:outline-none bg-transparent text-sm font-semibold" disabled={!isEditable}>
                                                    <option>Cash</option>
                                                    <option>UPI</option>
                                                    <option>NetBanking</option>
                                                    <option>Cheque</option>
                                                </select>
                                                
                                                <div className="mt-1">
                                                    <label className="text-[10px] text-gray-500 block">Deposit To:</label>
                                                    <select 
                                                        value={item.bankId || ''} 
                                                        onChange={e => updateLineItem(item.id, 'bankId', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none text-gray-700 font-medium text-xs border-b border-dotted border-gray-400"
                                                        disabled={!isEditable}
                                                    >
                                                        <option value="">Select Bank/Cash...</option>
                                                        {/* Dynamically show Cash or Bank options based on Mode */}
                                                        {item.paymentMode === 'Cash' 
                                                            ? cashOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)
                                                            : bankOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="border border-black p-1 text-right align-top pt-2">
                                            <input type="number" value={item.amount || ''} onChange={e => updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full border-none focus:outline-none bg-transparent text-right p-1 font-bold" disabled={!isEditable} />
                                        </td>
                                        
                                        {/* Actions */}
                                        {isEditable && (
                                            <td className="border border-black p-1 text-center align-middle">
                                                <button type="button" onClick={() => removeLine(item.id)} className="text-red-500 hover:text-red-700 transition-colors flex items-center justify-center w-full h-full">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="bg-gray-200 font-bold">
                                    <td colSpan={4} className="border border-black p-2 text-right">Total Rs.</td>
                                    <td className="border border-black p-2 text-right">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    {isEditable && <td className="border border-black p-2"></td>}
                                </tr>
                            </tbody>
                        </table>
                        
                        {/* Doc Details (General Doc No) - Footer */}
                        {hasNonCashPayment && (
                            <div className="mt-2 p-2 border border-gray-400 bg-gray-50">
                                <div className="flex gap-4 text-sm flex-wrap">
                                    <div className="flex items-center min-w-[200px]">
                                        <p className="font-semibold shrink-0">General Ref/Cheque No:</p>
                                        <input type="text" value={docNo} onChange={e => setDocNo(e.target.value)} className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 w-32 focus:outline-none bg-transparent" placeholder="Ref No." disabled={!isEditable} />
                                    </div>
                                    <div className="flex items-center min-w-[200px]">
                                        <p className="font-semibold shrink-0">Date:</p>
                                        <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 focus:outline-none bg-transparent" disabled={!isEditable} />
                                    </div>
                                    
                                    {/* Drawn On Bank - Only shows if Cheque is selected */}
                                    {hasChequePayment && (
                                        <div className="flex items-center min-w-[200px]">
                                            <p className="font-semibold shrink-0">Drawn On:</p>
                                            <select 
                                                value={drawnOnBankId} 
                                                onChange={e => setDrawnOnBankId(e.target.value)}
                                                className="font-normal border-b border-dotted border-gray-500 px-2 ml-2 w-40 focus:outline-none bg-transparent"
                                                disabled={!isEditable}
                                            >
                                                <option value="">Select Bank...</option>
                                                {externalBankOptions.map(b => (
                                                    <option key={b.value} value={b.value}>{b.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-2 p-2 border-2 border-black"><p className="font-semibold">Amount in Words: <span className="font-normal">{amountInWords}</span></p></div>
                        <div className="mt-16 flex justify-between items-end text-sm"><p className="border-t border-dotted border-gray-600 pt-1 px-8">Prepared</p><p className="border-t border-dotted border-gray-600 pt-1 px-8">Passed</p><p className="border-t border-dotted border-gray-600 pt-1 px-8">Receiver's Signature</p></div>
                    </div>
                </div>
                 {/* Footer */}
                <div className="p-4 flex justify-end items-center border-t dark:border-gray-700 flex-shrink-0 gap-4">
                    {isEditable ? (
                        <>
                            <Button onClick={() => handleSave(false)} variant="success">
                                <Save size={16} /> {receiptToEdit ? 'Update Receipt' : 'Save Receipt'}
                            </Button>
                            <Button onClick={() => handleSave(true)} variant="primary">
                                <Download size={16} /> {receiptToEdit ? 'Update & Export' : 'Save & Export'}
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

export default ManualReceiptModal;
