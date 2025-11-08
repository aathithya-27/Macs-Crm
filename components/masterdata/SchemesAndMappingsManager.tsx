import React, { useState, useMemo, useCallback, useRef } from 'react';
import { SchemeMaster, InsuranceAgency, Member, InsuranceTypeMaster, ConcretePolicyType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Trash2, AlertTriangle, Building, GripVertical } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface SchemesAndMappingsManagerProps {
    schemes: SchemeMaster[];
    onUpdateSchemes: (data: SchemeMaster[]) => void;
    agencies: InsuranceAgency[];
    onUpdateAgencies: (data: InsuranceAgency[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    insuranceTypes: InsuranceTypeMaster[];
    canCreate: boolean;
    canModify: boolean;
}

const SchemesAndMappingsManager: React.FC<SchemesAndMappingsManagerProps> = ({
    schemes, onUpdateSchemes, agencies, onUpdateAgencies, addToast, allMembers, insuranceTypes, canCreate, canModify
}) => {
    const [agencySearch, setAgencySearch] = useState('');
    const [schemeSearch, setSchemeSearch] = useState('');
    const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
    const agencyTriggerRef = useRef<HTMLButtonElement>(null);
    const schemeTriggerRef = useRef<HTMLButtonElement>(null);
    
    const [agencyModal, setAgencyModal] = useState<{ isOpen: boolean; agency: Partial<InsuranceAgency> | null }>({ isOpen: false, agency: null });
    const [schemeModal, setSchemeModal] = useState<{ isOpen: boolean; scheme: Partial<SchemeMaster> | null }>({ isOpen: false, scheme: null });
    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm?: () => void; dependents?: Member[] }>({ isOpen: false, title: '', message: '' });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

    const filteredAgencies = useMemo(() => 
        agencies.filter(c => c.name.toLowerCase().includes(agencySearch.toLowerCase())), 
        [agencies, agencySearch]
    );

    const schemesForSelectedAgency = useMemo(() => {
        if (!selectedAgencyId) return [];
        return schemes.filter(s =>
            s.agencyId === selectedAgencyId &&
            (s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.id.toLowerCase().includes(schemeSearch.toLowerCase()))
        ).sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [schemes, selectedAgencyId, schemeSearch]);

    const insuranceTypeMap = useMemo(() => 
        new Map(insuranceTypes.map(it => [it.id, it])), 
        [insuranceTypes]
    );

    const parentTypeOptions = useMemo(() => 
        insuranceTypes.filter(it => !it.parentId && it.active), 
        [insuranceTypes]
    );

    const openAgencyModal = useCallback((agency: InsuranceAgency | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) agencyTriggerRef.current = event.currentTarget as HTMLButtonElement;
        setAgencyModal({
            isOpen: true,
            agency: agency ? { ...agency } : { id: '', name: '', agencyCode: '', active: true }
        });
    }, []);

    const closeAgencyModal = useCallback(() => {
        setAgencyModal({ isOpen: false, agency: null });
        agencyTriggerRef.current?.focus();
    }, []);

    const saveAgency = useCallback(() => {
        if (!canModify || !agencyModal.agency?.name?.trim()) {
            addToast('Agency name is required.', 'error');
            return;
        }

        const agency = agencyModal.agency;
        if (agency.id) {
            onUpdateAgencies(agencies.map(c => c.id === agency.id ? agency as InsuranceAgency : c));
        } else {
            const newAgency: InsuranceAgency = {
                ...agency,
                id: `agency-${Date.now()}`,
                agencyCode: agency.name!.toUpperCase().replace(/\s/g, '').substring(0, 6)
            } as InsuranceAgency;
            onUpdateAgencies([...agencies, newAgency]);
        }
        closeAgencyModal();
    }, [canModify, agencyModal.agency, agencies, onUpdateAgencies, addToast, closeAgencyModal]);

    const toggleAgency = useCallback((id: string) => {
        const agency = agencies.find(c => c.id === id);
        if (!agency) return;

        if (agency.active === false) {
            onUpdateAgencies(agencies.map(c => c.id === id ? { ...c, active: true } : c));
            return;
        }

        const agencySchemes = schemes.filter(s => s.agencyId === id);
        const dependents = allMembers.filter(m => m.policies.some(p => agencySchemes.some(cs => cs.id === p.schemeId)));

        if (dependents.length > 0) {
            setWarningModal({
                isOpen: true,
                title: `Deactivate "${agency.name}"?`,
                message: `This Agency is linked to policies of ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                dependents,
                onConfirm: () => onUpdateAgencies(agencies.map(c => c.id === id ? { ...c, active: false } : c))
            });
        } else {
            onUpdateAgencies(agencies.map(c => c.id === id ? { ...c, active: false } : c));
        }
    }, [agencies, schemes, allMembers, onUpdateAgencies]);

    const deleteAgency = useCallback((agencyId: string) => {
        const agency = agencies.find(c => c.id === agencyId);
        if (!agency) return;

        const associatedSchemes = schemes.filter(s => s.agencyId === agencyId);
        if (associatedSchemes.length > 0) {
            setDeleteModal({
                isOpen: true,
                message: `You cannot delete "${agency.name}" because it has ${associatedSchemes.length} scheme(s) linked to it. Please remove or reassign the schemes first.`
            });
        } else if (window.confirm(`Are you sure you want to delete the Agency "${agency.name}"? This action cannot be undone.`)) {
            onUpdateAgencies(agencies.filter(c => c.id !== agencyId));
            addToast(`Agency "${agency.name}" deleted successfully.`, 'success');
        }
    }, [agencies, schemes, onUpdateAgencies, addToast]);

    const openSchemeModal = useCallback((scheme: SchemeMaster | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) schemeTriggerRef.current = event.currentTarget as HTMLButtonElement;
        setSchemeModal({
            isOpen: true,
            scheme: scheme ? { ...scheme } : {
                name: '',
                agencyId: selectedAgencyId || '',
                type: 'Health Insurance' as ConcretePolicyType,
                active: true,
                insuranceTypeId: ''
            }
        });
    }, [selectedAgencyId]);

    const closeSchemeModal = useCallback(() => {
        setSchemeModal({ isOpen: false, scheme: null });
        schemeTriggerRef.current?.focus();
    }, []);

    const saveScheme = useCallback(() => {
        if (!canModify || !schemeModal.scheme?.name?.trim() || !schemeModal.scheme?.agencyId || !schemeModal.scheme?.insuranceTypeId) {
            addToast('Scheme Name, Agency, and Insurance Type are required.', 'error');
            return;
        }

        const scheme = schemeModal.scheme;
        if (scheme.id) {
            onUpdateSchemes(schemes.map(s => s.id === scheme.id ? scheme as SchemeMaster : s));
        } else {
            const newScheme: SchemeMaster = {
                ...scheme,
                id: `scheme-${Date.now()}`,
                order: schemes.filter(s => s.agencyId === scheme.agencyId).length,
                type: 'Health Insurance'
            } as SchemeMaster;
            onUpdateSchemes([...schemes, newScheme]);
        }
        closeSchemeModal();
    }, [canModify, schemeModal.scheme, schemes, onUpdateSchemes, addToast, closeSchemeModal]);

    const toggleScheme = useCallback((id: string) => {
        const scheme = schemes.find(s => s.id === id);
        if (!scheme) return;

        if (scheme.active === false) {
            onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: true } : s));
            return;
        }

        const dependents = allMembers.filter(m => m.policies.some(p => p.schemeId === scheme.id));
        if (dependents.length > 0) {
            setWarningModal({
                isOpen: true,
                title: `Deactivate "${scheme.name}"?`,
                message: `This scheme is currently used by ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                dependents,
                onConfirm: () => onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: false } : s))
            });
        } else {
            onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: false } : s));
        }
    }, [schemes, allMembers, onUpdateSchemes]);

    const deleteScheme = useCallback((schemeId: string) => {
        const scheme = schemes.find(s => s.id === schemeId);
        if (!scheme) return;

        const dependents = allMembers.filter(m => m.policies.some(p => p.schemeId === scheme.id));
        if (dependents.length > 0) {
            setDeleteModal({
                isOpen: true,
                message: `You cannot delete "${scheme.name}" because it is being used by ${dependents.length} client(s).`
            });
        } else if (window.confirm(`Are you sure you want to delete the scheme "${scheme.name}"? This action cannot be undone.`)) {
            onUpdateSchemes(schemes.filter(s => s.id !== schemeId));
            addToast(`Scheme "${scheme.name}" deleted successfully.`, 'success');
        }
    }, [schemes, allMembers, onUpdateSchemes, addToast]);

    const reorderSchemes = useCallback((reorderedSchemes: SchemeMaster[]) => {
        const reorderedMap = new Map(reorderedSchemes.map(s => [s.id, s]));
        const updatedSchemes = schemes.map(scheme => reorderedMap.get(scheme.id) || scheme);
        onUpdateSchemes(updatedSchemes);
    }, [schemes, onUpdateSchemes]);

    const getInsuranceTypeName = useCallback((scheme: SchemeMaster) => {
        if (scheme.insuranceTypeId) {
            const type = insuranceTypeMap.get(scheme.insuranceTypeId);
            if (type) {
                if (type.parentId) {
                    const parent = insuranceTypeMap.get(type.parentId);
                    return `${parent?.name} > ${type.name}`;
                }
                return type.name;
            }
        }
        return scheme.generalInsuranceType ? `${scheme.type} (${scheme.generalInsuranceType})` : scheme.type;
    }, [insuranceTypeMap]);

    const childTypeOptions = useMemo(() => {
        if (!schemeModal.scheme?.insuranceTypeId) return [];
        const parentType = insuranceTypeMap.get(schemeModal.scheme.insuranceTypeId);
        if (!parentType || parentType.parentId) return [];
        return insuranceTypes.filter(it => it.parentId === schemeModal.scheme?.insuranceTypeId && it.active);
    }, [insuranceTypes, insuranceTypeMap, schemeModal.scheme?.insuranceTypeId]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Agencies Column */}
            <div className="lg:w-2/5 xl:w-1/3 flex flex-col h-full">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Agency</h3>
                <div className="flex flex-col gap-4 my-4">
                    <SearchBar searchQuery={agencySearch} onSearchChange={setAgencySearch} placeholder="Search Agency..." className="w-full" />
                    {canCreate && (
                        <Button ref={agencyTriggerRef} onClick={(e) => openAgencyModal(null, e)} variant="primary" className="w-full"><Plus size={16}/> Add New Agency</Button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto border dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAgencies.map((agency, index) => (
                                <tr
                                    key={agency.id}
                                    onClick={() => setSelectedAgencyId(agency.id)}
                                    className={`cursor-pointer ${selectedAgencyId === agency.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} ${!agency.active ? 'opacity-60' : ''}`}
                                >
                                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{agency.name}</td>
                                    <td className="px-4 py-3">
                                        <ToggleSwitch enabled={!!agency.active} onChange={() => toggleAgency(agency.id)} disabled={!canModify} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button size="small" variant="light" className="!p-1.5" onClick={(e) => { e.stopPropagation(); agencyTriggerRef.current = e.currentTarget; openAgencyModal(agency, e); }} disabled={!canModify}><Edit2 size={14}/></Button>
                                            {canModify && (
                                                <Button size="small" variant="danger" className="!p-1.5" onClick={(e) => { e.stopPropagation(); deleteAgency(agency.id); }}><Trash2 size={14}/></Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Schemes Column */}
            <div className="lg:w-3/5 xl:w-2/3 flex flex-col h-full">
                {selectedAgencyId ? (
                    <SchemesTable
                        title={`Schemes for ${agencies.find(c => c.id === selectedAgencyId)?.name || ''}`}
                        schemes={schemesForSelectedAgency}
                        search={schemeSearch}
                        onSearch={setSchemeSearch}
                        onAdd={(e) => openSchemeModal(null, e)}
                        onEdit={(scheme, e) => openSchemeModal(scheme, e)}
                        onToggle={toggleScheme}
                        onDelete={deleteScheme}
                        onReorder={reorderSchemes}
                        getInsuranceTypeName={getInsuranceTypeName}
                        canCreate={canCreate}
                        canModify={canModify}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-lg">
                        <div>
                            <Building size={48} className="mx-auto text-gray-300 dark:text-gray-500"/>
                            <p className="mt-4 font-semibold">Select an Agency</p>
                            <p className="text-sm">Select an Agency from the left to view and manage its schemes.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Agency Modal */}
            {agencyModal.isOpen && (
                <Modal isOpen={agencyModal.isOpen} onClose={closeAgencyModal} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
                    <form onSubmit={(e) => { e.preventDefault(); saveAgency(); }}>
                        <div className="p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {agencyModal.agency?.id ? 'Edit' : 'Add'} Agency
                            </h2>
                            <Input label="Agency Name" value={agencyModal.agency?.name || ''} onChange={e => setAgencyModal(prev => ({ ...prev, agency: prev.agency ? { ...prev.agency, name: e.target.value } : null }))} disabled={!canModify} autoFocus />
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={closeAgencyModal}>Cancel</Button>
                                <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Scheme Modal */}
            {schemeModal.isOpen && (
                <Modal isOpen={schemeModal.isOpen} onClose={closeSchemeModal} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
                    <form onSubmit={(e) => { e.preventDefault(); saveScheme(); }}>
                        <fieldset disabled={!canModify} className="p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {schemeModal.scheme?.id ? 'Edit' : 'New'} Scheme
                            </h2>
                            <Input label="Scheme Name" value={schemeModal.scheme?.name || ''} onChange={e => setSchemeModal(prev => ({ ...prev, scheme: prev.scheme ? { ...prev.scheme, name: e.target.value } : null }))} autoFocus />
                            <div>
                                <label className="block text-sm font-medium mb-1">Insurance Type</label>
                                <select 
                                    value={schemeModal.scheme?.insuranceTypeId || ''} 
                                    onChange={e => setSchemeModal(prev => ({ 
                                        ...prev, 
                                        scheme: prev.scheme ? { ...prev.scheme, insuranceTypeId: e.target.value } : null 
                                    }))}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Select Type...</option>
                                    {parentTypeOptions.map(it => (
                                        <option key={it.id} value={it.id}>{it.name}</option>
                                    ))}
                                </select>
                            </div>
                            {childTypeOptions.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Insurance Sub-Type</label>
                                    <select 
                                        value={schemeModal.scheme?.insuranceTypeId || ''} 
                                        onChange={e => setSchemeModal(prev => ({ 
                                            ...prev, 
                                            scheme: prev.scheme ? { ...prev.scheme, insuranceTypeId: e.target.value } : null 
                                        }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Select Sub-Type...</option>
                                        {childTypeOptions.map(it => (
                                            <option key={it.id} value={it.id}>{it.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">Agency</label>
                                <select 
                                    value={schemeModal.scheme?.agencyId || ''} 
                                    onChange={e => setSchemeModal(prev => ({ 
                                        ...prev, 
                                        scheme: prev.scheme ? { ...prev.scheme, agencyId: e.target.value } : null 
                                    }))}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    disabled={!!selectedAgencyId}
                                >
                                    <option value="">Select Agency...</option>
                                    {agencies.filter(c => c.active !== false).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="secondary" onClick={closeSchemeModal}>Cancel</Button>
                                <Button type="submit" variant="success" disabled={!canModify}>Save Scheme</Button>
                            </div>
                        </fieldset>
                    </form>
                </Modal>
            )}

            {/* Warning Modal */}
            {warningModal.isOpen && (
                <Modal isOpen={warningModal.isOpen} onClose={() => setWarningModal({ isOpen: false, title: '', message: '' })}>
                    <div className="p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    {warningModal.title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {warningModal.message}
                                    </p>
                                    {warningModal.dependents && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            Used by: {warningModal.dependents.slice(0, 3).map(m => m.name).join(', ')}{warningModal.dependents.length > 3 ? ', and others.' : '.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            {warningModal.onConfirm && (
                                <Button variant="danger" onClick={() => { warningModal.onConfirm?.(); setWarningModal({ isOpen: false, title: '', message: '' }); }}>Confirm Deactivation</Button>
                            )}
                            <Button variant="secondary" onClick={() => setWarningModal({ isOpen: false, title: '', message: '' })}>Cancel</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, message: '' })}>
                    <div className="p-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Cannot Delete Item</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{deleteModal.message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false, message: '' })}>OK</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const SchemesTable: React.FC<{
    title: string;
    schemes: SchemeMaster[];
    search: string;
    onSearch: (query: string) => void;
    onAdd: (event: React.MouseEvent<HTMLElement>) => void;
    onEdit: (scheme: SchemeMaster, event: React.MouseEvent<HTMLElement>) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (schemes: SchemeMaster[]) => void;
    getInsuranceTypeName: (scheme: SchemeMaster) => string;
    canCreate: boolean;
    canModify: boolean;
}> = ({ title, schemes, search, onSearch, onAdd, onEdit, onToggle, onDelete, onReorder, getInsuranceTypeName, canCreate, canModify }) => {
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        setDraggedItemId(id);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = (e: React.DragEvent, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedItemId(null);
        
        if (draggedId === dropTargetId) return;

        const currentItems = [...schemes];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);

        const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));
        onReorder(reorderedItems);
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <SearchBar searchQuery={search} onSearchChange={onSearch} placeholder="Search Schemes..." className="w-full md:w-1/2" />
                {canCreate && (
                    <Button onClick={onAdd} variant="primary" className="w-full md:w-auto flex-shrink-0"><Plus size={16}/> Add New Scheme</Button>
                )}
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-2 py-3"></th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {schemes.map((scheme, index) => (
                            <tr
                                key={scheme.id}
                                draggable={canModify}
                                onDragStart={e => handleDragStart(e, scheme.id)}
                                onDragOver={handleDragOver}
                                onDrop={e => handleDrop(e, scheme.id)}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${canModify ? 'cursor-move' : ''} ${scheme.active === false ? 'opacity-60' : ''} ${draggedItemId === scheme.id ? 'opacity-30' : ''}`}
                            >
                                <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>
                                <td className="px-6 py-3 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-6 py-3 font-medium">{scheme.name}</td>
                                <td className="px-6 py-3 text-sm">{getInsuranceTypeName(scheme)}</td>
                                <td className="px-6 py-3">
                                    <ToggleSwitch enabled={scheme.active !== false} onChange={() => onToggle(scheme.id)} disabled={!canModify} />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <Button size="small" variant="light" className="!p-1.5" onClick={(e) => onEdit(scheme, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                        {canModify && (
                                            <Button size="small" variant="danger" className="!p-1.5" onClick={() => onDelete(scheme.id)}><Trash2 size={14}/></Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {schemes.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No schemes found for this agency.</div>
                )}
            </div>
        </div>
    );
};

export default SchemesAndMappingsManager;