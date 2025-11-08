import React, { useState, useMemo, useEffect, useRef } from 'react';

import { FinancialYear, DocumentNumbering } from '../../types';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Save, Edit2 } from 'lucide-react';
import SearchBar from '../ui/SearchBar'; // MODIFICATION: Import SearchBar

interface FinancialYearManagerProps {
    financialYears: FinancialYear[];
    onUpdateFinancialYears: (data: FinancialYear[]) => void;
    documentNumbering: DocumentNumbering[];
    onUpdateDocumentNumbering: (data: DocumentNumbering[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    activeFinancialYearId: string | null;
    canCreate: boolean;
    canModify: boolean;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";

const DocNumRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<DocumentNumbering>) => void;
    initialData: Partial<DocumentNumbering> | null;
    financialYears: FinancialYear[];
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, financialYears, canModify }) => {

    const [prefix, setPrefix] = useState('');
    const [startingNumber, setStartingNumber] = useState('');
    const [finYearId, setFinYearId] = useState<string | null>(null);
    const [suffix, setSuffix] = useState('');

    useEffect(() => {
        if (isOpen && initialData) {
            setPrefix(initialData.prefix || '');
            setStartingNumber(String(initialData.startingNumber || '1'));
            setFinYearId(initialData.finYearId || null);
            setSuffix(initialData.suffix || '');
        }
    }, [isOpen, initialData]);

    const handleStartingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[0-9]*$/.test(val)) {
            setStartingNumber(val);
        }
    };

    const handleSaveClick = () => {
        const finalStartingNumber = parseInt(startingNumber, 10);
        if (!prefix.trim() || !finYearId) {
            alert('Prefix and Financial Year are required.');
            return;
        }
        if (isNaN(finalStartingNumber) || finalStartingNumber < 1) {
            alert('Starting Number must be a valid number of 1 or greater.');
            return;
        }

        onSave({
            ...initialData,
            prefix,
            startingNumber: finalStartingNumber,
            finYearId,
            suffix,
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={e => { e.preventDefault(); handleSaveClick(); }}>
                <div className="p-6 border-b"><h2 className="text-xl font-bold">{initialData?.id ? 'Edit' : 'Add'} {initialData?.type} Rule</h2></div>
                <div className="p-6 space-y-4">
                    <Input label="Prefix (Kword)" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="e.g., VCH/25-26/" required disabled={!canModify}/>
                    <Input label="Suffix (Optional)" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="e.g., /FIN" disabled={!canModify}/>
                    <Input
                        label="Starting Number"
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={startingNumber}
                        onChange={handleStartingNumberChange}
                        required
                        disabled={!canModify}
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Financial Year</label>
                        <select value={finYearId || ''} onChange={e => setFinYearId(e.target.value)} className={selectClasses} required disabled={!canModify}>
                            <option value="" disabled>Select FY</option>
                            {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.finYear}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={!canModify}>Save Rule</Button></div>
            </form>
        </Modal>
    );
};


const FinancialYearManager: React.FC<FinancialYearManagerProps> = ({
    financialYears, onUpdateFinancialYears,
    documentNumbering, onUpdateDocumentNumbering,
    addToast, activeFinancialYearId, canCreate, canModify
}) => {
    const [selectedFinYearId, setSelectedFinYearId] = useState<string | null>(activeFinancialYearId);
    const [isFYModalOpen, setIsFYModalOpen] = useState(false);
    const [editingFY, setEditingFY] = useState<Partial<FinancialYear> | null>(null);
    const [isDocNumModalOpen, setIsDocNumModalOpen] = useState(false);
    const [editingDocNum, setEditingDocNum] = useState<Partial<DocumentNumbering> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
    const [searchQuery, setSearchQuery] = useState(''); // MODIFICATION: Add search state

    const openFYModal = (item: FinancialYear | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingFY(item ? { ...item } : { finYear: '', fromDate: '', toDate: '', status: 'Active' });
        setIsFYModalOpen(true);
    };

    const closeFYModal = () => {
        setIsFYModalOpen(false);
        setEditingFY(null);
        triggerButtonRef.current?.focus();
    };

    const handleSaveFY = () => {
        if (!canModify) return;
        if (!editingFY || !editingFY.finYear?.trim() || !editingFY.fromDate || !editingFY.toDate) {
            addToast('All fields are required.', 'error');
            return;
        }
        if (new Date(editingFY.fromDate) >= new Date(editingFY.toDate)) {
            addToast('"From Date" must be earlier than "To Date".', 'error');
            return;
        }

        const statusToSave: 'Active' | 'Inactive' = (editingFY.status === 'Active' || editingFY.status === 'Inactive') ? editingFY.status : 'Active';

        if (editingFY.id) {
            onUpdateFinancialYears(financialYears.map(fy => fy.id === editingFY.id ? { ...editingFY as FinancialYear, status: statusToSave } : fy));
        } else {
            const newFY: FinancialYear = { id: `fy-${Date.now()}`, ...editingFY, status: statusToSave } as FinancialYear;
            onUpdateFinancialYears([...financialYears, newFY]);
        }
        closeFYModal();
    };

    const openDocNumModal = (type: 'Voucher' | 'Receipt', item: DocumentNumbering | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        const initialData = item ? { ...item } : { type, prefix: '', startingNumber: 1, finYearId: selectedFinYearId, status: 'Active' as const, suffix: '' };
        setEditingDocNum(initialData);
        setIsDocNumModalOpen(true);
    };

    const closeDocNumModal = () => {
        setIsDocNumModalOpen(false);
        setEditingDocNum(null);
        triggerButtonRef.current?.focus();
    };

    const handleSaveDocNum = (dataToSave: Partial<DocumentNumbering>) => {
        if (!canModify) return;
        const isDuplicate = documentNumbering.some(dn =>
            dn.id !== dataToSave.id &&
            dn.type === dataToSave.type &&
            dn.finYearId === dataToSave.finYearId
        );

        if (isDuplicate) {
            addToast(`A numbering rule for ${dataToSave.type}s already exists for this Financial Year.`, 'error');
            return;
        }

        if (dataToSave.id) {
            onUpdateDocumentNumbering(documentNumbering.map(dn =>
                dn.id === dataToSave.id
                    ? {
                        ...dataToSave as DocumentNumbering,
                        status: (dataToSave.status === 'Active' || dataToSave.status === 'Inactive') ? dataToSave.status as 'Active' | 'Inactive' : dn.status
                      }
                    : dn
            ));
        } else {
            const newDocNum: DocumentNumbering = {
                id: `dn-${Date.now()}`,
                ...dataToSave,
                status: 'Active'
            } as DocumentNumbering;
            onUpdateDocumentNumbering([...documentNumbering, newDocNum]);
        }
        closeDocNumModal();
    };
    
    const filteredFinancialYears = useMemo(() => {
        if (!searchQuery) {
            return financialYears;
        }
        return financialYears.filter(fy =>
            fy.finYear.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [financialYears, searchQuery]);

    const voucherNumbering = useMemo(() => documentNumbering.filter(dn => dn.finYearId === selectedFinYearId && dn.type === 'Voucher'), [documentNumbering, selectedFinYearId]);
    const receiptNumbering = useMemo(() => documentNumbering.filter(dn => dn.finYearId === selectedFinYearId && dn.type === 'Receipt'), [documentNumbering, selectedFinYearId]);

    const DocNumTable: React.FC<{title: string, type: 'Voucher' | 'Receipt', items: DocumentNumbering[]}> = ({title, type, items}) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
                {canCreate && <Button variant="primary" onClick={(e) => openDocNumModal(type, null, e)} disabled={!selectedFinYearId}><Plus size={16}/> Add Rule</Button>}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Prefix (Kword)</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Suffix</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Start No.</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="px-4 py-2 font-mono">{item.prefix}</td>
                                <td className="px-4 py-2 font-mono">{item.suffix || 'N/A'}</td>
                                <td className="px-4 py-2">{item.startingNumber}</td>
                                <td className="px-4 py-2"><ToggleSwitch enabled={item.status === 'Active'} onChange={val => onUpdateDocumentNumbering(documentNumbering.map(dn => dn.id === item.id ? {...dn, status: val ? 'Active' as const : 'Inactive' as const} : dn))} disabled={!canModify}/></td>
                                <td className="px-4 py-2"><Button size="small" variant="light" onClick={(e) => openDocNumModal(type, item, e)} disabled={!canModify}><Edit2 size={14}/></Button></td>
                            </tr>
                        ))}
                         {items.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">No rules for this FY.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Financial Year Management</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Financial Year</h3>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <SearchBar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            placeholder="Search by year label..."
                            className="w-full md:w-64"
                        />
                        {canCreate && (
                            <Button onClick={(e) => openFYModal(null, e)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                                <Plus size={16}/> Add Financial Year
                            </Button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Financial Year</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">From Date</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">To Date</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredFinancialYears.map(fy => (
                                <tr key={fy.id} onClick={() => setSelectedFinYearId(fy.id)} className={`cursor-pointer ${selectedFinYearId === fy.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <td className="px-4 py-2 font-medium">{fy.finYear}</td>
                                    <td className="px-4 py-2">{fy.fromDate}</td>
                                    <td className="px-4 py-2">{fy.toDate}</td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={fy.status === 'Active'} onChange={val => onUpdateFinancialYears(financialYears.map(f => f.id === fy.id ? {...f, status: val ? 'Active' as const : 'Inactive' as const} : f))} disabled={!canModify}/></td>
                                    <td className="px-4 py-2"><Button size="small" variant="light" onClick={(e) => { e.stopPropagation(); openFYModal(fy, e);}} disabled={!canModify}><Edit2 size={14}/></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DocNumTable title="Voucher Numbering" type="Voucher" items={voucherNumbering} />
                <DocNumTable title="Receipt Numbering" type="Receipt" items={receiptNumbering} />
            </div>

            {isFYModalOpen && editingFY && (
                <Modal isOpen={isFYModalOpen} onClose={closeFYModal}>
                    <form onSubmit={e => {e.preventDefault(); handleSaveFY();}}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingFY.id ? 'Edit' : 'Add'} Financial Year</h2></div>
                        <div className="p-6 space-y-4">
                            <Input label="Financial Year Label" value={editingFY.finYear || ''} onChange={e => setEditingFY(p => p ? {...p, finYear: e.target.value} : null)} placeholder="e.g., 2025-2026" required disabled={!canModify} />
                            <Input label="From Date" type="date" value={editingFY.fromDate || ''} onChange={e => setEditingFY(p => p ? {...p, fromDate: e.target.value} : null)} required disabled={!canModify}/>
                            <Input label="To Date" type="date" value={editingFY.toDate || ''} onChange={e => setEditingFY(p => p ? {...p, toDate: e.target.value} : null)} required disabled={!canModify}/>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeFYModal}>Cancel</Button><Button type="submit" variant="success" disabled={!canModify}>Save</Button></div>
                    </form>
                </Modal>
            )}

            <DocNumRuleModal
                isOpen={isDocNumModalOpen}
                onClose={closeDocNumModal}
                onSave={handleSaveDocNum}
                initialData={editingDocNum}
                financialYears={financialYears}
                canModify={canModify}
            />
        </div>
    );
};

export default FinancialYearManager;
