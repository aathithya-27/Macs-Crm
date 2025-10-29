import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Company, DocumentNumbering, User, ManualReceipt, ReceiptLineItem as ReceiptLineItemType } from '../types.ts';
import { Download, X, Plus, Trash2, Save } from 'lucide-react';
// @ts-ignore
import * as htmlToImage from 'https://cdn.skypack.dev/html-to-image';

// --- Type Definitions ---

interface LineItem extends ReceiptLineItemType {}

export interface ReceiptSaveData {
    id?: string;
    receiptNo: string;
    date: string;
    receivedFrom: string;
    address?: string;
    finYearId: string;
    lineItems: Omit<LineItem, 'id'>[];
    createdBy: string;
}

interface ManualReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyInfo: Company | null;
    currentUser: User | null;
    // --- MODIFICATION: Props now refer to the correct FY for NEW receipts ---
    activeFinancialYearId: string | null; // This will be the ID of the TRUE current FY for saving
    docNumberingConfig: DocumentNumbering | null; // This is the config for the TRUE current FY
    lastReceiptNumber: number; // This is the count for the TRUE current FY
    onSave: (data: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string }) => void;
    receiptToEdit?: ManualReceipt | null;
    triggerExport?: boolean;
}


// --- Helper Functions & Components ---

const Button: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'light' | 'success' | 'danger';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}> = ({ onClick, children, variant = 'primary', disabled = false, className = '', type = 'button' }) => {
    const baseClasses = "flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeClasses = "px-4 py-2 text-sm";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
        light: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500 border border-gray-300 dark:border-gray-600',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </button>
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

const ManualReceiptModal: React.FC<ManualReceiptModalProps> = ({
    isOpen,
    onClose,
    companyInfo,
    currentUser,
    activeFinancialYearId,
    docNumberingConfig,
    lastReceiptNumber,
    onSave,
    receiptToEdit,
    triggerExport = false,
}) => {
    // Receipt-level state
    const [receiptNo, setReceiptNo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receivedFrom, setReceivedFrom] = useState('');
    const [address, setAddress] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: `new-${Date.now()}`, description: '', paymentMode: 'Cash', amount: 0 }
    ]);
    
    const receiptRef = useRef<HTMLDivElement>(null);

    // Initialize or reset the modal state
    useEffect(() => {
        if (isOpen) {
            if (receiptToEdit) {
                setReceiptNo(receiptToEdit.receiptNo);
                setDate(receiptToEdit.date);
                setReceivedFrom(receiptToEdit.receivedFrom);
                setAddress(receiptToEdit.address || '');
                setLineItems(receiptToEdit.lineItems);
            } else {
                // --- MODIFICATION: This logic now correctly uses the props for the CURRENT FY ---
                if (docNumberingConfig) {
                    const nextNumber = docNumberingConfig.startingNumber + lastReceiptNumber;
                    const suffix = docNumberingConfig.suffix || '';
                    setReceiptNo(`${docNumberingConfig.prefix}${nextNumber}${suffix}`);
                } else {
                    setReceiptNo(`TEMP-${lastReceiptNumber + 1}`);
                }
                setDate(new Date().toISOString().split('T')[0]);
                setReceivedFrom('');
                setAddress('');
                setLineItems([{ id: `new-${Date.now()}`, description: '', paymentMode: 'Cash', amount: 0 }]);
            }

            if (triggerExport) {
                setTimeout(exportImage, 300);
            }
        }
    }, [isOpen, receiptToEdit, docNumberingConfig, lastReceiptNumber, triggerExport]);


    const addLineItem = () => {
        const newLine: LineItem = {
            id: `new-${Date.now()}`,
            description: '',
            paymentMode: 'Cash',
            amount: 0,
        };
        setLineItems(prev => [...prev, newLine]);
    };

    const removeLine = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof Omit<LineItem, 'id'>, value: any) => {
        setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    // Calculations for display
    const totalAmount = useMemo(() => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [lineItems]);
    const amountInWords = useMemo(() => numberToWords(totalAmount), [totalAmount]);

    const handleSave = (shouldExport: boolean) => {
        if (!receivedFrom.trim()) {
            alert('Received From is required.');
            return;
        }
        if (totalAmount <= 0) {
            alert('Amount must be greater than zero.');
            return;
        }
        // --- MODIFICATION: This now correctly uses the activeFinancialYearId passed in for saving ---
        if (!activeFinancialYearId) {
            alert('Cannot save: Active Financial Year not found.');
            return;
        }
        
        const saveData: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string } = {
            id: receiptToEdit?.id,
            receiptNo,
            date,
            receivedFrom,
            address,
            finYearId: activeFinancialYearId,
            lineItems: lineItems.map(({ id, ...rest }) => rest)
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{receiptToEdit ? `Edit Receipt #${receiptToEdit.receiptNo}` : 'Manual Receipt'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="text-gray-600 dark:text-gray-300" /></button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {/* The actual receipt for export */}
                    <div ref={receiptRef} id="manual-receipt" className="bg-white p-8 border-2 border-gray-500 font-serif text-black max-w-4xl mx-auto">
                        {/* Receipt Header */}
                        <div className="text-center mb-4">
                            <h1 className="text-3xl font-bold">{companyInfo?.name || 'Your Company'}</h1>
                            <p className="text-sm">GSTIN: {companyInfo?.gstin || 'N/A'}</p>
                        </div>
                        
                        <div className="text-center mb-4 border-y-2 border-black">
                            <h2 className="text-xl font-bold p-1">RECEIPT</h2>
                        </div>

                        <div className="flex justify-between items-start mb-4 text-sm">
                            <div className="w-2/3 space-y-2">
                                <p className="font-semibold flex items-center">Received From: 
                                    <input type="text" value={receivedFrom} onChange={e => setReceivedFrom(e.target.value)} placeholder="Enter name..." className="font-normal w-3/4 border-b border-dotted border-gray-500 px-2 ml-2 focus:outline-none bg-transparent" />
                                </p>
                                <p className="font-semibold flex items-center">Address: 
                                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="(Optional)" className="font-normal w-3/4 border-b border-dotted border-gray-500 px-2 ml-2 focus:outline-none bg-transparent" />
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">Receipt No.: <span className="font-normal border-b border-dotted border-gray-500 px-2 min-w-[100px] inline-block">{receiptNo}</span></p>
                                <div className="font-semibold mt-1 flex items-center justify-end">Date: 
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="font-normal border-b border-dotted border-gray-500 px-2 focus:outline-none bg-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Particulars Table */}
                        <table className="w-full border-collapse border-2 border-black text-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black p-1 text-center font-bold w-12">S.No</th>
                                    <th className="border border-black p-1 text-center font-bold">Description</th>
                                    <th className="border border-black p-1 text-center font-bold w-36">Payment Mode</th>
                                    <th className="border border-black p-1 text-center font-bold w-40">Amount (₹)</th>
                                    <th className="border border-black p-1 text-center font-bold w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="border border-black p-1 text-center">{index + 1}</td>
                                        <td className="border border-black p-0">
                                            <input type="text" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} className="w-full h-full border-none focus:outline-none bg-transparent p-1" placeholder="Particulars..."/>
                                        </td>
                                        <td className="border border-black p-0">
                                            <select value={item.paymentMode} onChange={e => updateLineItem(item.id, 'paymentMode', e.target.value as any)} className="w-full h-full border-none focus:outline-none bg-transparent p-1">
                                                <option>Cash</option>
                                                <option>UPI</option>
                                                <option>Cheque</option>
                                                <option>NetBanking</option>
                                            </select>
                                        </td>
                                        <td className="border border-black p-0 text-right w-40">
                                            <input type="number" value={item.amount || ''} onChange={e => updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full h-full border-none focus:outline-none bg-transparent text-right p-1" />
                                        </td>
                                        <td className="border border-black p-1 text-center">
                                            <button type="button" onClick={() => removeLine(item.id)} className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50" disabled={lineItems.length <= 1}><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="bg-gray-200 font-bold">
                                    <td colSpan={3} className="border border-black p-2 text-right">Total Rs.</td>
                                    <td className="border border-black p-2 text-right">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="text-center mt-2">
                            <button type="button" onClick={addLineItem} className="flex items-center gap-2 mx-auto px-3 py-1.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"><Plus size={14}/> Add New Line</button>
                        </div>
                        <div className="mt-2 p-2 border-2 border-black"><p className="font-semibold">Amount in Words: <span className="font-normal">{amountInWords}</span></p></div>
                        <div className="mt-16 flex justify-end items-end text-sm"><p className="border-t border-dotted border-gray-600 pt-1 px-8">Authorized Signatory</p></div>
                    </div>
                </div>
                 {/* Modal Footer */}
                <div className="p-4 flex justify-end items-center border-t dark:border-gray-700 flex-shrink-0 gap-4">
                    <Button onClick={() => handleSave(false)} variant="success">
                        <Save size={16} /> {receiptToEdit ? 'Update Receipt' : 'Save Receipt'}
                    </Button>
                    <Button onClick={() => handleSave(true)} variant="primary">
                        <Download size={16} /> {receiptToEdit ? 'Update & Export' : 'Save & Export'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManualReceiptModal;