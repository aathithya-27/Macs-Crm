import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CustomerTier, GiftMaster, CustomerType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, GripVertical } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface TierAndGiftManagerProps {
    tiers: CustomerTier[];
    onUpdateTiers: (tiers: CustomerTier[]) => void;
    gifts: GiftMaster[];
    onUpdateGifts: (gifts: GiftMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    calculationMethod: 'sumAssured' | 'premium';
    onUpdateCalculationMethod: (method: 'sumAssured' | 'premium') => void;
    customerTypes: CustomerType[];
    canCreate: boolean;
    canModify: boolean;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";

const TierRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (tierData: CustomerTier) => void;
    initialData: Partial<CustomerTier> | null;
    tiers: CustomerTier[];
    customerTypes: CustomerType[];
    gifts: GiftMaster[];
    mode: 'sumAssured' | 'premium' | 'edit';
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, tiers, customerTypes, gifts, mode, canModify }) => {
    const [formData, setFormData] = useState<Partial<CustomerTier>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || { name: '', customerTypeId: '', minimumSumAssured: 0, minimumPremium: 0, giftId: null, active: true });
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof CustomerTier, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNumericChange = (field: 'minimumSumAssured' | 'minimumPremium', value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        handleChange(field, numericValue === '' ? 0 : Number(numericValue));
    };

    const handleSaveClick = () => {
        if (!formData.customerTypeId) {
            alert('A Customer Type must be selected.');
            return;
        }
        onSave(formData as CustomerTier);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
            <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">{initialData?.id ? 'Edit' : 'Add'} Tier Rule</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Type</label>
                    <select
                        value={formData.customerTypeId || ''}
                        onChange={e => handleChange('customerTypeId', e.target.value)}
                        className={selectClasses}
                        disabled={!canModify}
                    >
                        <option value="">-- Select a Type --</option>
                        {customerTypes.map(type => {
                            const isUsed = tiers.some(t => t.customerTypeId === type.id && t.id !== initialData?.id);
                            return (
                                <option key={type.id} value={type.id} disabled={isUsed} className={isUsed ? 'text-gray-400' : ''}>
                                    {type.name} {isUsed ? '(In Use)' : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {(mode === 'sumAssured' || mode === 'edit') && (
                    <Input label="Minimum Sum Assured (₹)" type="text" inputMode="numeric" value={formData.minimumSumAssured === 0 ? '' : String(formData.minimumSumAssured || '')} onChange={e => handleNumericChange('minimumSumAssured', e.target.value)} placeholder="e.g., 50000" disabled={!canModify} />
                )}

                {(mode === 'premium' || mode === 'edit') && (
                    <Input label="Minimum Premium (₹)" type="text" inputMode="numeric" value={formData.minimumPremium === 0 ? '' : String(formData.minimumPremium || '')} onChange={e => handleNumericChange('minimumPremium', e.target.value)} placeholder="e.g., 5000" disabled={!canModify} />
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Gift</label>
                    <select value={formData.giftId || ''} onChange={e => handleChange('giftId', e.target.value || null)} className={selectClasses} disabled={!canModify}>
                        <option value="">-- No Gift --</option>
                        {gifts.filter(g => g.active).map(gift => <option key={gift.id} value={gift.id}>{gift.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="success" onClick={handleSaveClick} disabled={!canModify}>Save Tier</Button>
                </div>
            </div>
        </Modal>
    );
};

const TierAndGiftManager: React.FC<TierAndGiftManagerProps> = ({
    tiers, onUpdateTiers, gifts, onUpdateGifts, addToast, calculationMethod, onUpdateCalculationMethod, customerTypes, canCreate, canModify
}) => {
    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<Partial<CustomerTier> | null>(null);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [editingGift, setEditingGift] = useState<Partial<GiftMaster> | null>(null);
    const [draggedTierId, setDraggedTierId] = useState<string | null>(null);
    const [tierModalMode, setTierModalMode] = useState<'sumAssured' | 'premium' | 'edit'>('edit');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [giftSearchQuery, setGiftSearchQuery] = useState('');

    const customerTypeMap = useMemo(() => new Map(customerTypes.map(ct => [ct.id, ct.name])), [customerTypes]);

    const sortedTiers = useMemo(() => {
        const filtered = tiers.filter(tier => {
            const typeName = customerTypeMap.get(tier.customerTypeId) || tier.name;
            return typeName.toLowerCase().includes(searchQuery.toLowerCase());
        });
        return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }, [tiers, searchQuery, customerTypeMap]);

    const sortedGifts = useMemo(() => {
        const filtered = gifts.filter(gift => gift.name.toLowerCase().includes(giftSearchQuery.toLowerCase()));
        return [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [gifts, giftSearchQuery]);
    
    const openTierModal = (tier: CustomerTier | null, mode: 'sumAssured' | 'premium' | 'edit', event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingTier(tier ? { ...tier } : { name: '', customerTypeId: '', minimumSumAssured: 0, minimumPremium: 0, giftId: null, active: true });
        setTierModalMode(mode);
        setIsTierModalOpen(true);
    };

    const closeTierModal = () => {
        setIsTierModalOpen(false);
        setEditingTier(null);
        triggerButtonRef.current?.focus();
    }

    const handleSaveTier = (tierData: CustomerTier) => {
        if (!canModify) return;
        let updatedTiers;
        if (tierData.id) {
            updatedTiers = tiers.map(t => t.id === tierData.id ? tierData : t);
        } else {
            const newTier: CustomerTier = {
                ...tierData,
                id: `tier-${Date.now()}`,
                name: customerTypeMap.get(tierData.customerTypeId) || 'Unnamed Tier',
                active: true,
                order: tiers.length,
            };
            updatedTiers = [...tiers, newTier];
        }
        onUpdateTiers(updatedTiers);
        closeTierModal();
    };

    const handleToggleTier = (tierId: string) => {
        if (!canModify) return;
        onUpdateTiers(tiers.map(t => t.id === tierId ? { ...t, active: !t.active } : t));
    };

    const openGiftModal = (gift: GiftMaster | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingGift(gift ? { ...gift } : { name: '', active: true });
        setIsGiftModalOpen(true);
    };

    const closeGiftModal = () => {
        setIsGiftModalOpen(false);
        triggerButtonRef.current?.focus();
    }

    const handleSaveGift = () => {
        if (!canModify) return;
        if (!editingGift || !editingGift.name?.trim()) {
            addToast('Gift name is required.', 'error');
            return;
        }

        let updatedGifts;
        if (editingGift.id) {
            updatedGifts = gifts.map(g => g.id === editingGift!.id ? editingGift as GiftMaster : g);
        } else {
            const newGift: GiftMaster = {
                id: `gift-${Date.now()}`,
                name: editingGift.name,
                active: true,
                order: gifts.length,
            };
            updatedGifts = [...gifts, newGift];
        }
        onUpdateGifts(updatedGifts);
        closeGiftModal();
    };

    const handleToggleGift = (giftId: string) => {
        if (!canModify) return;
        onUpdateGifts(gifts.map(g => g.id === giftId ? { ...g, active: !g.active } : g));
    };

    const handleTierDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('tierId', id);
        setDraggedTierId(id);
    };

    const handleTierDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();

    const handleTierDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('tierId');
        setDraggedTierId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...sortedTiers];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);

        onUpdateTiers(currentItems.map((item, index) => ({ ...item, order: index })));
    };

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white"> Type & Gift Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-7">Define Customer Type based on sum assured or premium, and manage the gifts associated with them.</p>

            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search tier types..." className="w-full md:w-1/1" />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Type Calculation Method</h4>
                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                        <button onClick={() => onUpdateCalculationMethod('sumAssured')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${calculationMethod === 'sumAssured' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`} disabled={!canModify}>Sum Assured</button>
                        <button onClick={() => onUpdateCalculationMethod('premium')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${calculationMethod === 'premium' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`} disabled={!canModify}>Premium</button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Currently calculating Type by: <span className="font-semibold text-blue-600">{calculationMethod === 'sumAssured' ? 'Sum Assured' : 'Premium'}</span></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Type (by Sum Assured)</h3>
                        {canCreate && <Button variant="primary" onClick={(e) => openTierModal(null, 'sumAssured', e)}><Plus size={16}/> Add Tier</Button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b dark:border-gray-600"><tr>
                                <th className="py-2 w-8"></th>
                                <th className="py-2 text-xs font-bold uppercase">Type Name</th>
                                <th className="py-2 text-xs font-bold uppercase whitespace-nowrap">Min. Sum Assured (₹)</th>
                                <th className="py-2 text-xs font-bold uppercase">Assigned Gift</th>
                                <th className="py-2 text-center text-xs font-bold uppercase">Status</th>
                                <th className="py-2 text-center text-xs font-bold uppercase">Actions</th>
                            </tr></thead>
                            <tbody onDragEnd={() => setDraggedTierId(null)}>
                                {sortedTiers.map(tier => (
                                    <tr key={tier.id} draggable={canModify} onDragStart={e => handleTierDragStart(e, tier.id)} onDragOver={e => handleTierDragOver(e)} onDrop={e => handleTierDrop(e, tier.id)} className={`border-b dark:border-gray-700/50 ${canModify ? 'cursor-move' : ''} ${draggedTierId === tier.id ? 'opacity-50' : ''} ${!tier.active ? 'opacity-50' : ''}`}>
                                        <td className="py-2"><GripVertical size={16} className="text-gray-400"/></td>
                                        <td className="py-2 font-medium">{customerTypeMap.get(tier.customerTypeId) || tier.name}</td>
                                        <td className="py-2">{tier.minimumSumAssured?.toLocaleString('en-IN') || '-'}</td>
                                        <td className="py-2">{gifts.find(g => g.id === tier.giftId)?.name || <span className="text-gray-400 italic">None</span>}</td>
                                        <td className="py-2 text-center"><ToggleSwitch enabled={tier.active !== false} onChange={() => handleToggleTier(tier.id)} disabled={!canModify}/></td>
                                        <td className="py-2 text-center"><Button size="small" variant="light" className="!p-1.5" onClick={(e) => openTierModal(tier, 'edit', e)} disabled={!canModify}><Edit2 size={14}/></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Type (by Premium)</h3>
                        {canCreate && <Button variant="primary" onClick={(e) => openTierModal(null, 'premium', e)}><Plus size={16}/> Add Tier</Button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b dark:border-gray-600"><tr>
                                <th className="py-2 w-8"></th>
                                <th className="py-2 text-xs font-bold uppercase">Type Name</th>
                                <th className="py-2 text-xs font-bold uppercase whitespace-nowrap">Min. Premium (₹)</th>
                                <th className="py-2 text-xs font-bold uppercase">Assigned Gift</th>
                                <th className="py-2 text-center text-xs font-bold uppercase">Status</th>
                                <th className="py-2 text-center text-xs font-bold uppercase">Actions</th>
                            </tr></thead>
                            <tbody onDragEnd={() => setDraggedTierId(null)}>
                                {sortedTiers.map(tier => (
                                    <tr key={tier.id} draggable={canModify} onDragStart={e => handleTierDragStart(e, tier.id)} onDragOver={e => handleTierDragOver(e)} onDrop={e => handleTierDrop(e, tier.id)} className={`border-b dark:border-gray-700/50 ${canModify ? 'cursor-move' : ''} ${draggedTierId === tier.id ? 'opacity-50' : ''} ${!tier.active ? 'opacity-50' : ''}`}>
                                        <td className="py-2"><GripVertical size={16} className="text-gray-400"/></td>
                                        <td className="py-2 font-medium">{customerTypeMap.get(tier.customerTypeId) || tier.name}</td>
                                        <td className="py-2">{tier.minimumPremium?.toLocaleString('en-IN') || '-'}</td>
                                        <td className="py-2">{gifts.find(g => g.id === tier.giftId)?.name || <span className="text-gray-400 italic">None</span>}</td>
                                        <td className="py-2 text-center"><ToggleSwitch enabled={tier.active !== false} onChange={() => handleToggleTier(tier.id)} disabled={!canModify}/></td>
                                        <td className="py-2 text-center"><Button size="small" variant="light" className="!p-1.5" onClick={(e) => openTierModal(tier, 'edit', e)} disabled={!canModify}><Edit2 size={14}/></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Master Gift List</h3>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <SearchBar searchQuery={giftSearchQuery} onSearchChange={setGiftSearchQuery} placeholder="Search gifts..." className="w-full md:w-64" />
                            {canCreate && <Button variant="primary" onClick={(e) => openGiftModal(null, e)}><Plus size={16}/> Add Gift</Button>}
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-80 pr-2">
                        <table className="w-full text-left text-sm">
                           <tbody>
                                {sortedGifts.map(gift => (
                                    <tr key={gift.id} className={`border-b dark:border-gray-700/50 ${!gift.active ? 'opacity-50' : ''}`}>
                                        <td className={`py-2 ${!gift.active ? 'line-through' : ''}`}>{gift.name}</td>
                                        <td className="py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ToggleSwitch enabled={gift.active !== false} onChange={() => handleToggleGift(gift.id)} disabled={!canModify}/>
                                                <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openGiftModal(gift, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <TierRuleModal isOpen={isTierModalOpen} onClose={closeTierModal} onSave={handleSaveTier} initialData={editingTier} tiers={tiers} customerTypes={customerTypes} gifts={gifts} mode={tierModalMode} canModify={canModify} />

            {isGiftModalOpen && (
                <Modal isOpen={isGiftModalOpen} onClose={closeGiftModal} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
                    <div className="p-6 space-y-4">
                        <h2 className="text-xl font-bold text-brand-dark dark:text-white">{editingGift?.id ? 'Edit' : 'Add'} Gift</h2>
                        <Input label="Gift Name" value={editingGift?.name || ''} onChange={e => setEditingGift(p => p ? {...p, name: e.target.value} : null)} disabled={!canModify}/>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={closeGiftModal}>Cancel</Button>
                            <Button variant="success" onClick={handleSaveGift} disabled={!canModify}>Save Gift</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TierAndGiftManager;