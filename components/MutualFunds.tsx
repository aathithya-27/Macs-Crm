
import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, IndianRupee, Repeat, UserPlus, Download, Upload, Users, AlertTriangle, X, Search, FileText } from 'lucide-react';
import { Member, ModalTab, MutualFundHolding, AMC, MutualFundScheme, MutualFundTransaction, BankMandate } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SearchableSelect from './ui/SearchableSelect';

interface MutualFundsProps {
    allMembers: Member[];
    onUpdateMember: (member: Member) => void;
    amcs: AMC[];
    schemes: MutualFundScheme[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    onViewMember: (member: Member, initialTab: ModalTab) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <div 
        className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-500 transition-shadow' : ''}`}
        onClick={onClick}
    >
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick?: () => void }> = ({ label, icon, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border dark:border-gray-600/50 text-gray-700 dark:text-gray-300">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
    </button>
);

const StatCardDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: { memberName: string; detail: string; value: string }[];
}> = ({ isOpen, onClose, title, data }) => (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6">
            <h2 className="text-xl font-bold text-brand-dark dark:text-white">{title}</h2>
        </div>
        <div className="p-6 border-y dark:border-gray-700 max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Customer Name</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Details</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Value (₹)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.memberName}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.detail}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white">{item.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
    </Modal>
);

const NewInvestmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    actionType: 'SIP' | 'Lumpsum';
    members: Member[];
    amcs: AMC[];
    schemes: MutualFundScheme[];
    onSave: (memberId: string, holding: MutualFundHolding) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ isOpen, onClose, actionType, members, amcs, schemes, onSave, addToast }) => {
    const [step, setStep] = useState(1);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        schemeId: '',
        folioNumber: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        sipDay: 15,
        bankMandateId: null,
    });
    
    const selectedMember = useMemo(() => members.find(m => m.id === selectedMemberId), [members, selectedMemberId]);
    const approvedMandates = useMemo(() => (selectedMember?.bankMandates || []).filter(m => m.status === 'Approved' && m.mandateType === 'Mutual Funds'), [selectedMember]);

    const memberOptions = useMemo(() => members.map(m => ({ value: m.id, label: m.name })), [members]);
    const schemeOptions = useMemo(() => schemes.filter(s => s.active).map(s => ({ value: s.id, label: `${amcs.find(a => a.id === s.amcId)?.name} - ${s.name}`})), [schemes, amcs]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedMemberId(null);
            setFormData({
                schemeId: '',
                folioNumber: '',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                sipDay: 15,
                bankMandateId: null,
            });
        }
    }, [isOpen]);
    
    const handleSave = () => {
        if (!selectedMemberId) return;
        if (!formData.schemeId || !formData.folioNumber.trim()) {
            addToast('Scheme and Folio Number are required.', 'error');
            return;
        }
        if (formData.amount <= 0) {
            addToast('A valid investment amount is required.', 'error');
            return;
        }

        const newHolding: MutualFundHolding = {
            id: `mfh-${Date.now()}`,
            investmentType: actionType,
            status: 'Active',
            folioNumber: formData.folioNumber,
            schemeId: formData.schemeId,
            sipAmount: actionType === 'SIP' ? formData.amount : undefined,
            sipDate: actionType === 'SIP' ? formData.sipDay : undefined,
            bankMandateId: formData.bankMandateId,
            totalInvestment: formData.amount,
            currentValue: formData.amount,
            units: 0,
            transactions: [],
        };
        
        onSave(selectedMemberId, newHolding);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">New {actionType}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Step {step} of 2: {step === 1 ? 'Select Customer' : 'Enter Details'}</p>
            </div>
            <div className="p-6 border-y dark:border-gray-700 min-h-[300px]">
                {step === 1 && (
                    <div className="space-y-4">
                        <SearchableSelect 
                            label="Customer"
                            options={memberOptions}
                            value={selectedMemberId}
                            onChange={setSelectedMemberId}
                            placeholder="Search for a customer..."
                        />
                    </div>
                )}
                 {step === 2 && (
                    <div className="space-y-4">
                         <SearchableSelect
                            label="Scheme"
                            options={schemeOptions}
                            value={formData.schemeId || null}
                            onChange={(val) => setFormData(p => ({...p, schemeId: val || ''}))}
                            placeholder="Search for a scheme..."
                        />
                        <Input label="Folio Number" value={formData.folioNumber} onChange={e => setFormData(p => ({...p, folioNumber: e.target.value}))} />
                        
                        {actionType === 'SIP' ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Input label="SIP Amount (₹)" type="number" value={formData.amount || ''} onChange={e => setFormData(p => ({...p, amount: Number(e.target.value)}))} />
                                <Input label="SIP Day of Month" type="number" min="1" max="31" value={formData.sipDay} onChange={e => setFormData(p => ({...p, sipDay: Number(e.target.value)}))} />
                                <SearchableSelect
                                    label="Bank Mandate"
                                    options={approvedMandates.map(m => ({value: m.id, label: `${m.bankName} - ${m.accountNumber}`}))}
                                    value={formData.bankMandateId}
                                    onChange={(val) => setFormData(p => ({...p, bankMandateId: val}))}
                                    placeholder="Link Mandate..."
                                />
                            </div>
                        ) : (
                             <div className="grid grid-cols-2 gap-4">
                                <Input label="Investment Amount (₹)" type="number" value={formData.amount || ''} onChange={e => setFormData(p => ({...p, amount: Number(e.target.value)}))} />
                                <Input label="Investment Date" type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} />
                            </div>
                        )}
                    </div>
                 )}
            </div>
            <div className="flex justify-between p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                    {step === 2 && <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>}
                </div>
                <div className="flex gap-3">
                    <Button variant="light" onClick={onClose}>Cancel</Button>
                    {step === 1 && <Button variant="primary" onClick={() => setStep(2)} disabled={!selectedMemberId}>Next</Button>}
                    {step === 2 && <Button variant="success" onClick={handleSave}>Save Investment</Button>}
                </div>
            </div>
        </Modal>
    );
};

const TransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    schemes: MutualFundScheme[];
    amcs: AMC[];
    onSave: (memberId: string, holdingId: string, transaction: MutualFundTransaction) => void;
    transactionType: 'Additional Purchase' | 'Redemption';
}> = ({ isOpen, onClose, members, schemes, amcs, onSave, transactionType }) => {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const memberHoldingsOptions = useMemo(() => {
        if (!selectedMemberId) return [];
        const member = members.find(m => m.id === selectedMemberId);
        return (member?.mutualFundHoldings || []).map(h => {
            const scheme = schemes.find(s => s.id === h.schemeId);
            const amc = amcs.find(a => a.id === scheme?.amcId);
            return {
                value: h.id,
                label: `${amc?.name} - ${scheme?.name} (Folio: ${h.folioNumber})`
            };
        });
    }, [selectedMemberId, members, schemes, amcs]);
    
    useEffect(() => {
        if (isOpen) {
            setSelectedMemberId(null);
            setSelectedHoldingId(null);
            setAmount(0);
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!selectedMemberId || !selectedHoldingId || amount <= 0) {
            alert('Please fill all fields correctly.');
            return;
        }
        const newTransaction: MutualFundTransaction = {
            id: `mft-${Date.now()}`,
            date,
            type: transactionType,
            amount,
        };
        onSave(selectedMemberId, selectedHoldingId, newTransaction);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold">{transactionType}</h2>
            </div>
            <div className="p-6 space-y-4 border-y dark:border-gray-700">
                <SearchableSelect label="Customer" options={members.map(m=>({value:m.id, label:m.name}))} value={selectedMemberId} onChange={val => { setSelectedMemberId(val); setSelectedHoldingId(null); }} placeholder="Select a customer..." />
                <SearchableSelect label="Select Holding" options={memberHoldingsOptions} value={selectedHoldingId} onChange={setSelectedHoldingId} disabled={!selectedMemberId} placeholder="Select an investment..."/>
                <Input label="Amount (₹)" type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} disabled={!selectedHoldingId} />
                <Input label="Transaction Date" type="date" value={date} onChange={e => setDate(e.target.value)} disabled={!selectedHoldingId} />
            </div>
            <div className="flex justify-end p-6 gap-3 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={!selectedHoldingId || amount <= 0}>Confirm</Button>
            </div>
        </Modal>
    );
};


const MutualFunds: React.FC<MutualFundsProps> = ({ allMembers, onUpdateMember, amcs, schemes, addToast, onViewMember }) => {
    
    type ModalType = 'aum' | 'sips' | 'folios' | 'sip' | 'lumpsum' | 'redemption' | 'additional';
    const [activeModal, setActiveModal] = useState<ModalType | null>(null);
    const [modalData, setModalData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const investmentSummary = useMemo(() => {
        return allMembers
            .filter(m => m.mutualFundHoldings && m.mutualFundHoldings.length > 0)
            .map(m => {
                const holdings = m.mutualFundHoldings || [];
                const totalAum = holdings.reduce((sum, h) => sum + (h.currentValue || h.totalInvestment || 0), 0);
                const activeSips = holdings.filter(h => h.investmentType === 'SIP' && h.status === 'Active').length;
                const schemeCount = new Set(holdings.map(h => h.schemeId)).size;
                const totalInvestment = holdings.reduce((sum, h) => sum + (h.totalInvestment || 0), 0);

                return {
                    memberId: m.id,
                    memberName: m.name,
                    schemeCount,
                    activeSips,
                    totalInvestment,
                    totalAum,
                };
            });
    }, [allMembers]);

    const filteredSummary = useMemo(() => {
        if (!searchTerm) return investmentSummary;
        return investmentSummary.filter(item => 
            item.memberName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [investmentSummary, searchTerm]);

    const { mfStats, allTransactions, sipRejects, mfProspects } = useMemo(() => {
        let totalAum = 0;
        let activeSips = 0;
        let totalSipAmount = 0;
        const folioSet = new Set<string>();
        let aumDetails: any[] = [];
        let sipDetails: any[] = [];
        let folioDetails: any[] = [];
        const pendingMandates = allMembers.reduce((sum, m) => sum + (m.bankMandates || []).filter(bm => bm.status === 'Pending' && bm.mandateType === 'Mutual Funds').length, 0);
        let allTransactions: any[] = [];
        let sipRejects: any[] = [];

        const mfProspects = allMembers.filter(m => 
            (!m.mutualFundHoldings || m.mutualFundHoldings.length === 0) &&
            (m.financialProfile?.riskTolerance === 'High' || m.financialProfile?.riskTolerance === 'Aggressive')
        );

        allMembers.forEach(member => {
            (member.mutualFundHoldings || []).forEach(holding => {
                const scheme = schemes.find(s => s.id === holding.schemeId);
                const value = holding.currentValue || holding.totalInvestment || 0;
                totalAum += value;

                aumDetails.push({ memberName: member.name, detail: scheme?.name || 'N/A', value: value.toLocaleString('en-IN') });

                if (holding.investmentType === 'SIP' && holding.status === 'Active') {
                    activeSips++;
                    totalSipAmount += holding.sipAmount || 0;
                    sipDetails.push({ memberName: member.name, detail: scheme?.name || 'N/A', value: (holding.sipAmount || 0).toLocaleString('en-IN') });
                }
                
                if (!folioSet.has(`${member.id}-${holding.folioNumber}`)) {
                    folioSet.add(`${member.id}-${holding.folioNumber}`);
                    folioDetails.push({ memberName: member.name, detail: holding.folioNumber, value: amcs.find(a => a.id === scheme?.amcId)?.name || 'N/A' });
                }

                (holding.transactions || []).forEach(t => {
                    allTransactions.push({ ...t, memberName: member.name, schemeName: scheme?.name || 'N/A' });
                });
                
                (holding.sipRejections || []).forEach(r => {
                    sipRejects.push({ ...r, memberName: member.name, schemeName: scheme?.name || 'N/A' });
                });
            });
        });

        const formatCurrency = (value: number) => {
            if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
            if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
            return `₹${value.toLocaleString('en-IN')}`;
        };

        return {
            mfStats: {
                totalAum: formatCurrency(totalAum),
                activeSips: activeSips.toString(),
                totalSipAmount: formatCurrency(totalSipAmount),
                totalFolios: folioSet.size.toString(),
                pendingMandates: pendingMandates.toString(),
                details: {
                    aum: aumDetails.sort((a,b) => b.value - a.value),
                    sips: sipDetails,
                    folios: folioDetails,
                }
            },
            allTransactions: allTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            sipRejects: sipRejects.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            mfProspects
        };
    }, [allMembers, schemes, amcs]);

    const handleStatCardClick = (type: 'aum' | 'sips' | 'folios') => {
        setModalData(mfStats.details[type]);
        setActiveModal(type);
    };

    const handleSaveInvestment = (memberId: string, holding: MutualFundHolding) => {
        const member = allMembers.find(m => m.id === memberId);
        if (member) {
            const updatedMember = {
                ...member,
                mutualFundHoldings: [...(member.mutualFundHoldings || []), holding]
            };
            onUpdateMember(updatedMember);
            addToast(`Investment added for ${member.name}.`, 'success');
        }
    };
    
    const handleSaveTransaction = (memberId: string, holdingId: string, transaction: MutualFundTransaction) => {
        const member = allMembers.find(m => m.id === memberId);
        if (member) {
            const updatedHoldings = (member.mutualFundHoldings || []).map(h => {
                if (h.id === holdingId) {
                    const newTotalInvestment = transaction.type === 'Redemption'
                        ? h.totalInvestment - transaction.amount
                        : h.totalInvestment + transaction.amount;

                    return {
                        ...h,
                        totalInvestment: newTotalInvestment < 0 ? 0 : newTotalInvestment,
                        currentValue: h.currentValue + (transaction.type === 'Redemption' ? -transaction.amount : transaction.amount),
                        transactions: [...(h.transactions || []), transaction]
                    };
                }
                return h;
            });
            onUpdateMember({ ...member, mutualFundHoldings: updatedHoldings });
            addToast(`${transaction.type} recorded successfully for ${member.name}.`, 'success');
        }
    };
    
    const handleViewMemberInvestments = (memberId: string) => {
        const member = allMembers.find(m => m.id === memberId);
        if (member) {
            onViewMember(member, ModalTab.Investments);
        } else {
            addToast('Could not find customer details.', 'error');
        }
    };
    
    return (
        <>
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Mutual Funds Dashboard</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">An overview of your mutual fund business operations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total AUM" value={mfStats.totalAum} icon={<IndianRupee size={24}/>} onClick={() => handleStatCardClick('aum')} />
                    <StatCard title="Active SIP Amount" value={mfStats.totalSipAmount} icon={<Repeat size={24}/>} onClick={() => handleStatCardClick('sips')} />
                    <StatCard title="Total Folios" value={mfStats.totalFolios} icon={<Users size={24}/>} onClick={() => handleStatCardClick('folios')} />
                    <StatCard title="Pending Mandates" value={mfStats.pendingMandates} icon={<FileText size={24}/>} />
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Action Center</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <ActionButton label="New SIP" icon={<Repeat size={28}/>} onClick={() => setActiveModal('sip')} />
                        <ActionButton label="New Lumpsum" icon={<IndianRupee size={28}/>} onClick={() => setActiveModal('lumpsum')} />
                        <ActionButton label="Additional Purchase" icon={<UserPlus size={28}/>} onClick={() => setActiveModal('additional')} />
                        <ActionButton label="Redemption" icon={<Download size={28}/>} onClick={() => setActiveModal('redemption')} />
                        <ActionButton label="Online Registration" icon={<Upload size={28}/>} onClick={() => addToast('This feature is under development.', 'success')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                         <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Purchases & SIPs</h2>
                         <div className="overflow-x-auto max-h-[40vh]">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    {allTransactions.filter(t => t.type !== 'Redemption').map(t => (
                                    <tr key={t.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">
                                            <div className="font-medium">{t.memberName}</div>
                                            <div className="text-xs text-gray-500">{t.schemeName}</div>
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="font-semibold text-green-600">₹{t.amount.toLocaleString('en-IN')}</div>
                                            <div className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                             {allTransactions.filter(t => t.type !== 'Redemption').length === 0 && <p className="text-center py-4 text-gray-400">No recent purchases found.</p>}
                         </div>
                     </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                         <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Redemptions</h2>
                         <div className="overflow-x-auto max-h-[40vh]">
                             <table className="min-w-full text-sm">
                                <tbody>
                                    {allTransactions.filter(t => t.type === 'Redemption').map(t => (
                                    <tr key={t.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">
                                            <div className="font-medium">{t.memberName}</div>
                                            <div className="text-xs text-gray-500">{t.schemeName}</div>
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="font-semibold text-red-600">₹{t.amount.toLocaleString('en-IN')}</div>
                                            <div className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                            {allTransactions.filter(t => t.type === 'Redemption').length === 0 && <p className="text-center py-4 text-gray-400">No recent redemptions found.</p>}
                         </div>
                     </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Customer Investment Summary</h2>
                                                <div className="w-full sm:w-80">
                            <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Search Customer
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="customer-search"
                                    type="search"
                                    placeholder="By name or ID..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="block w-full h-10 pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[50vh]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Customer Name</th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Schemes</th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Active SIPs</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Investment (₹)</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Current AUM (₹)</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredSummary.map(item => (
                                    <tr key={item.memberId}>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.memberName}</td>
                                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.schemeCount}</td>
                                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.activeSips}</td>
                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{item.totalInvestment.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white">{item.totalAum.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-right"><button onClick={() => handleViewMemberInvestments(item.memberId)} className="font-semibold text-blue-600 hover:underline">View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSummary.length === 0 && <div className="p-8 text-center text-gray-500">No customers with mutual fund investments found.</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Today's MF Prospect List</h2>
                         <div className="overflow-x-auto max-h-[40vh]">
                             <table className="min-w-full text-sm">
                                <tbody>
                                    {mfProspects.map(p => (
                                    <tr key={p.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-gray-500">Risk: {p.financialProfile?.riskTolerance} | Income: {p.financialProfile?.annualIncome?.toLocaleString('en-IN')}</div>
                                        </td>
                                        <td className="p-2 text-right">
                                            <Button size="small" variant="light" onClick={() => handleViewMemberInvestments(p.id)}>View</Button>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                            {mfProspects.length === 0 && <p className="text-center py-4 text-gray-400">No new high-risk prospects without MFs found.</p>}
                         </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                         <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent SIP Rejects</h2>
                         <div className="overflow-x-auto max-h-[40vh]">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    {sipRejects.map((r, i) => (
                                    <tr key={i} className="border-b dark:border-gray-700">
                                        <td className="p-2">
                                            <div className="font-medium">{r.memberName}</div>
                                            <div className="text-xs text-gray-500">{r.schemeName}</div>
                                        </td>
                                        <td className="p-2 text-right">
                                            <div className="font-semibold text-red-600">{r.reason}</div>
                                            <div className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</div>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                            {sipRejects.length === 0 && <p className="text-center py-4 text-gray-400">No SIP rejections found.</p>}
                         </div>
                    </div>
                </div>
            </div>

            {['aum', 'sips', 'folios'].includes(activeModal || '') && (
                <StatCardDetailModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    title={`Details for ${activeModal === 'aum' ? 'Total AUM' : activeModal === 'sips' ? 'Active SIPs' : 'Total Folios'}`}
                    data={modalData}
                />
            )}
            
            {['sip', 'lumpsum'].includes(activeModal || '') && (
                <NewInvestmentModal 
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    actionType={activeModal === 'sip' ? 'SIP' : 'Lumpsum'}
                    members={allMembers}
                    amcs={amcs}
                    schemes={schemes}
                    onSave={handleSaveInvestment}
                    addToast={addToast}
                />
            )}

            {(activeModal === 'additional' || activeModal === 'redemption') && (
                <TransactionModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    members={allMembers}
                    schemes={schemes}
                    amcs={amcs}
                    onSave={handleSaveTransaction}
                    transactionType={activeModal === 'additional' ? 'Additional Purchase' : 'Redemption'}
                />
            )}
        </>
    );
};

export default MutualFunds;