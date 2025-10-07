import React, { useState, useMemo, useEffect } from 'react';
// CORRECTED: Fixed import path and added permission types
import { Member, AMC, MutualFundScheme, MutualFundHolding, MutualFundTransaction, BankMandate, MutualFundFieldMaster, AppModule, PermissionLevel } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SearchableSelect from '../ui/SearchableSelect';
import { Plus, Save, Trash2, Edit2, X, FileText } from 'lucide-react';

// --- Bank Mandate Modal Component ---
const MandateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (mandate: BankMandate) => void;
    mandate: Partial<BankMandate> | null;
    isReadOnly: boolean;
}> = ({ isOpen, onClose, onSave, mandate, isReadOnly }) => {
    const [formData, setFormData] = useState<Partial<BankMandate>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(mandate || { status: 'Pending', mandateAmount: 50000, mandateType: 'Mutual Funds' });
        }
    }, [isOpen, mandate]);

    const handleSave = () => {
        if (!formData.bankName || !formData.accountNumber || !formData.mandateAmount) {
            alert('Please fill all required fields');
            return;
        }
        onSave(formData as BankMandate);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{formData.id ? 'Edit' : 'Add'} Bank Mandate</h3>
                <div className="space-y-4">
                    <Input label="Bank Name *" value={formData.bankName || ''} onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))} disabled={isReadOnly} />
                    <Input label="Account Number *" value={formData.accountNumber || ''} onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))} disabled={isReadOnly} />
                    <Input label="Mandate Amount (₹) *" type="number" value={formData.mandateAmount || ''} onChange={e => setFormData(p => ({ ...p, mandateAmount: Number(e.target.value) }))} disabled={isReadOnly} />
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select value={formData.status || 'Pending'} onChange={e => setFormData(p => ({ ...p, status: e.target.value as BankMandate['status'] }))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={isReadOnly}>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={isReadOnly}>Save Mandate</Button>
                </div>
            </div>
        </div>
    );
};


interface InvestmentsTabProps {
    data: Partial<Member>;
    onChange: (field: keyof Member, value: any) => void;
    amcs: AMC[];
    schemes: MutualFundScheme[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    mutualFundFields: MutualFundFieldMaster[];
    // NEW: Accept permissions prop
    permissions: { [key in AppModule]?: PermissionLevel };
}

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ data, onChange, amcs, schemes, addToast, mutualFundFields, permissions }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
    const [isMandateModalOpen, setIsMandateModalOpen] = useState(false);
    const [editingMandate, setEditingMandate] = useState<Partial<BankMandate> | null>(null);

    // NEW: Permission check for the mutual funds module
    const canModify = permissions?.mutualFunds === 'modify';

    const initialFormState = {
        investmentType: 'SIP' as 'SIP' | 'Lumpsum',
        folioNumber: '',
        schemeId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        sipDay: 15,
        bankMandateId: null,
        status: 'Active' as MutualFundHolding['status'],
        dynamicData: {},
    };

    const [formState, setFormState] = useState<any>(initialFormState);

    const amcMap = useMemo(() => new Map(amcs.map(a => [a.id, a.name])), [amcs]);
    const schemeMap = useMemo(() => new Map(schemes.map(s => [s.id, s])), [schemes]);
    const [selectedAmc, setSelectedAmc] = useState<string | null>(null);

    const filteredSchemes = useMemo(() => {
        if (!selectedAmc) return [];
        return schemes.filter(s => s.amcId === selectedAmc);
    }, [schemes, selectedAmc]);

    const handleFormChange = (field: string, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleDynamicFieldChange = (fieldName: string, value: any) => {
        setFormState(prev => ({
            ...prev,
            dynamicData: {
                ...(prev.dynamicData || {}),
                [fieldName]: value
            }
        }));
    };

    const closeAndResetForm = () => {
        setIsFormOpen(false);
        setEditingHoldingId(null);
        setFormState(initialFormState);
        setSelectedAmc(null);
    };

    const handleFormSubmit = () => {
        if (!formState.schemeId || !formState.folioNumber.trim()) {
            addToast('Scheme and Folio Number are required.', 'error');
            return;
        }
        if (formState.amount <= 0) {
            addToast('A valid investment amount is required.', 'error');
            return;
        }

        if (editingHoldingId) {
            const updatedHoldings = (data.mutualFundHoldings || []).map(h => {
                if (h.id === editingHoldingId) {
                    const newTotalInvestment = formState.investmentType === 'Lumpsum' ? formState.amount : h.totalInvestment;
                    
                    const updatedHolding = {
                        ...h,
                        investmentType: formState.investmentType,
                        folioNumber: formState.folioNumber,
                        schemeId: formState.schemeId,
                        status: formState.status,
                        sipAmount: formState.investmentType === 'SIP' ? formState.amount : undefined,
                        sipDate: formState.investmentType === 'SIP' ? formState.sipDay : undefined,
                        bankMandateId: formState.bankMandateId,
                        dynamicData: formState.dynamicData,
                        totalInvestment: newTotalInvestment,
                        currentValue: h.currentValue + (newTotalInvestment - h.totalInvestment), // Adjust current value based on new investment
                    };
                    return updatedHolding;
                }
                return h;
            });
            onChange('mutualFundHoldings', updatedHoldings);
            addToast('Investment updated successfully.', 'success');
        } else {
            const newHoldingToAdd: MutualFundHolding = {
                id: `mfh-${Date.now()}`,
                totalInvestment: formState.amount,
                currentValue: formState.amount,
                units: 0,
                transactions: [],
                ...formState
            };
            const updatedHoldings = [...(data.mutualFundHoldings || []), newHoldingToAdd];
            onChange('mutualFundHoldings', updatedHoldings);
            addToast('Investment added successfully.', 'success');
        }
        closeAndResetForm();
    };
    
    const handleOpenEditForm = (holding: MutualFundHolding) => {
        setEditingHoldingId(holding.id);
        const scheme = schemeMap.get(holding.schemeId);
        if (scheme) setSelectedAmc(scheme.amcId);

        setFormState({
            investmentType: holding.investmentType,
            folioNumber: holding.folioNumber,
            schemeId: holding.schemeId,
            status: holding.status,
            amount: holding.investmentType === 'SIP' ? (holding.sipAmount || 0) : (holding.totalInvestment || 0),
            date: holding.investmentType === 'Lumpsum' ? (holding.transactions[0]?.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            sipDay: holding.sipDate || 15,
            bankMandateId: holding.bankMandateId || null,
            dynamicData: holding.dynamicData || {}
        });
        setIsFormOpen(true);
    };

    const handleDeleteHolding = (id: string) => {
        if (window.confirm('Are you sure you want to remove this investment holding?')) {
            const updatedHoldings = (data.mutualFundHoldings || []).filter(h => h.id !== id);
            onChange('mutualFundHoldings', updatedHoldings);
            addToast('Investment holding removed.', 'success');
        }
    };
    
    const handleSaveMandate = (mandate: BankMandate) => {
        const mandates = data.bankMandates || [];
        if (mandate.id) {
            onChange('bankMandates', mandates.map(m => m.id === mandate.id ? mandate : m));
            addToast('Mandate updated.', 'success');
        } else {
            onChange('bankMandates', [...mandates, { ...mandate, id: `mandate-${Date.now()}` }]);
            addToast('Mandate added.', 'success');
        }
        setIsMandateModalOpen(false);
    };
    
    const handleMandateStatusChange = (mandateId: string, newStatus: BankMandate['status']) => {
        const updatedMandates = (data.bankMandates || []).map(m => {
            if (m.id === mandateId) {
                const updatedMandate = { ...m, status: newStatus };
                if (newStatus === 'Approved') {
                    updatedMandate.approvalDate = m.approvalDate || new Date().toISOString().split('T')[0];
                } else {
                    updatedMandate.approvalDate = undefined;
                }
                return updatedMandate;
            }
            return m;
        });
        onChange('bankMandates', updatedMandates);
        addToast('Mandate status updated.', 'success');
    };

    const handleDeleteMandate = (id: string) => {
        if (window.confirm('Are you sure you want to delete this mandate? It may be linked to an active SIP.')) {
            onChange('bankMandates', (data.bankMandates || []).filter(m => m.id !== id));
        }
    };
    
    const approvedMandates = useMemo(() => (data.bankMandates || []).filter(m => m.status === 'Approved' && m.mandateType === 'Mutual Funds'), [data.bankMandates]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mutual Fund Investments</h3>
            </div>

            <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Scheme Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Folio No.</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Type</th>
                            <th className="px-4 py-2 text-right text-xs font-bold uppercase">Amount (₹) / Date</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-right text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {(data.mutualFundHoldings || []).map(holding => {
                            const scheme = schemeMap.get(holding.schemeId);
                            const amc = scheme ? amcMap.get(scheme.amcId) : 'Unknown AMC';
                            return (
                                <tr key={holding.id}>
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                                        <div>{scheme?.name || 'Unknown Scheme'}</div>
                                        <div className="text-xs text-gray-500">{amc}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{holding.folioNumber}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{holding.investmentType}</td>
                                    <td className="px-4 py-3 text-right font-semibold">
                                        {holding.investmentType === 'SIP'
                                            ? `${(holding.sipAmount || 0).toLocaleString('en-IN')} (Day ${holding.sipDate})`
                                            : `${(holding.totalInvestment || 0).toLocaleString('en-IN')}`
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {holding.status}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {canModify && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="small" variant="secondary" className="!p-1.5" onClick={() => handleOpenEditForm(holding)}>
                                                    <Edit2 size={14}/>
                                                </Button>
                                                <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleDeleteHolding(holding.id)}>
                                                    <Trash2 size={14}/>
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {(data.mutualFundHoldings || []).length === 0 && <div className="p-8 text-center text-gray-500">No mutual fund investments recorded for this customer.</div>}
            </div>
            
            {canModify && (
                <div className="flex justify-end">
                    {!isFormOpen && <Button onClick={() => setIsFormOpen(true)} variant="primary" className="mt-4"><Plus size={16}/> Add Investment</Button>}
                </div>
            )}

            {isFormOpen && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50 space-y-4 animate-fade-in mt-6">
                    <h4 className="font-semibold">{editingHoldingId ? 'Edit Investment' : 'Add New Investment'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Investment Type</label>
                            <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                <button type="button" onClick={() => handleFormChange('investmentType', 'SIP')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formState.investmentType === 'SIP' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>SIP</button>
                                <button type="button" onClick={() => handleFormChange('investmentType', 'Lumpsum')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formState.investmentType === 'Lumpsum' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Lumpsum</button>
                            </div>
                        </div>
                        <Input label="Folio Number *" value={formState.folioNumber} onChange={e => handleFormChange('folioNumber', e.target.value)} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableSelect
                            label="AMC *"
                            options={amcs.map(a => ({ value: a.id, label: a.name }))}
                            value={selectedAmc}
                            onChange={(val) => {
                                setSelectedAmc(val);
                                handleFormChange('schemeId', '');
                            }}
                            placeholder="Select AMC..."
                        />
                         <SearchableSelect
                            label="Scheme *"
                            options={filteredSchemes.map(s => ({ value: s.id, label: s.name }))}
                            value={formState.schemeId || null}
                            onChange={(val) => handleFormChange('schemeId', val)}
                            placeholder="Select Scheme..."
                            disabled={!selectedAmc}
                        />
                    </div>
                    {formState.investmentType === 'SIP' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="SIP Amount (₹) *" type="number" value={formState.amount || ''} onChange={e => handleFormChange('amount', Number(e.target.value))} />
                            <Input label="SIP Day of Month" type="number" min="1" max="31" value={formState.sipDay} onChange={e => handleFormChange('sipDay', Number(e.target.value))} />
                             <SearchableSelect
                                label="Bank Mandate"
                                options={approvedMandates.map(m => ({value: m.id, label: `${m.bankName} - ${m.accountNumber}`}))}
                                value={formState.bankMandateId}
                                onChange={(val) => handleFormChange('bankMandateId', val)}
                                placeholder="Link Mandate..."
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Investment Amount (₹) *" type="number" value={formState.amount || ''} onChange={e => handleFormChange('amount', Number(e.target.value))} />
                            <Input label="Investment Date" type="date" value={formState.date} onChange={e => handleFormChange('date', e.target.value)} />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select 
                            value={formState.status}
                            onChange={(e) => handleFormChange('status', e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-900/50 dark:border-gray-600 bg-white"
                        >
                            <option>Active</option>
                            <option>Paused</option>
                            <option>Stopped</option>
                        </select>
                    </div>

                    {mutualFundFields.length > 0 && (
                        <div>
                            <h4 className="font-semibold mt-4 border-t pt-4 dark:border-gray-600">Additional Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {mutualFundFields.filter(f=>f.active).sort((a,b) => a.order - b.order).map(field => (
                                    <Input
                                        key={field.id}
                                        label={field.label}
                                        type={field.fieldType as any}
                                        value={formState.dynamicData?.[field.fieldName] || ''}
                                        onChange={e => handleDynamicFieldChange(field.fieldName, e.target.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                     <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={closeAndResetForm}>Cancel</Button>
                        <Button variant="success" onClick={handleFormSubmit}>
                            {editingHoldingId ? <Save size={16}/> : <Plus size={16}/>}
                            {editingHoldingId ? 'Update Investment' : 'Add Investment'}
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="mt-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bank Mandates (for SIPs)</h3>
                    {canModify && <Button onClick={() => { setEditingMandate(null); setIsMandateModalOpen(true); }}><Plus size={16}/> Add Mandate</Button>}
                </div>
                <div className="mt-2 border rounded-lg overflow-x-auto dark:border-gray-700">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">Bank Name</th>
                                <th className="px-4 py-2 text-left font-medium">Account No.</th>
                                <th className="px-4 py-2 text-right font-medium">Amount (₹)</th>
                                <th className="px-4 py-2 text-center font-medium">Status</th>
                                <th className="px-4 py-2 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                             {(data.bankMandates || []).filter(m => m.mandateType === 'Mutual Funds').map(mandate => (
                                <tr key={mandate.id} className="border-t dark:border-gray-700">
                                    <td className="px-4 py-2">{mandate.bankName}</td>
                                    <td className="px-4 py-2">{mandate.accountNumber}</td>
                                    <td className="px-4 py-2 text-right">{mandate.mandateAmount.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-2 text-center">
                                         <select 
                                            value={mandate.status}
                                            onChange={(e) => handleMandateStatusChange(mandate.id, e.target.value as BankMandate['status'])}
                                            className="text-xs p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                            onClick={e => e.stopPropagation()}
                                            disabled={!canModify}
                                        >
                                            <option>Pending</option>
                                            <option>Approved</option>
                                            <option>Rejected</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {canModify && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="small" variant="secondary" className="!p-1.5" onClick={() => {setEditingMandate(mandate); setIsMandateModalOpen(true);}}>
                                                    <Edit2 size={14}/>
                                                </Button>
                                                 <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleDeleteMandate(mandate.id)}>
                                                    <Trash2 size={14}/>
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {(data.bankMandates || []).filter(m => m.mandateType === 'Mutual Funds').length === 0 && <div className="p-8 text-center text-gray-500">No bank mandates found for mutual funds.</div>}
                </div>
            </div>

             <MandateModal
                isOpen={isMandateModalOpen}
                onClose={() => setIsMandateModalOpen(false)}
                onSave={handleSaveMandate}
                mandate={editingMandate}
                isReadOnly={!canModify}
            />
        </div>
    );
};