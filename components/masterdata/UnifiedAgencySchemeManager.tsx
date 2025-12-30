import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
    AMC, MutualFundScheme, SchemeMaster, InsuranceAgency, Member, 
    InsuranceTypeMaster, BusinessVertical, ConcretePolicyType 
} from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Trash2, AlertTriangle, Building, GripVertical } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface UnifiedAgencySchemeManagerProps {
    // AMCs and Mutual Fund Schemes
    amcs: AMC[];
    onUpdateAmcs: (data: AMC[]) => void;
    mutualFundSchemes: MutualFundScheme[];
    onUpdateMutualFundSchemes: (data: MutualFundScheme[]) => void;
    
    // Insurance Agencies and Schemes
    agencies: InsuranceAgency[];
    onUpdateAgencies: (data: InsuranceAgency[]) => void;
    schemes: SchemeMaster[];
    onUpdateSchemes: (data: SchemeMaster[]) => void;
    
    // Common dependencies
    businessVerticals: BusinessVertical[];
    insuranceTypes: InsuranceTypeMaster[];
    allMembers: Member[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

type AgencyType = AMC | InsuranceAgency;
type SchemeType = MutualFundScheme | SchemeMaster;

const UnifiedAgencySchemeManager: React.FC<UnifiedAgencySchemeManagerProps> = ({
    amcs, onUpdateAmcs, mutualFundSchemes, onUpdateMutualFundSchemes,
    agencies, onUpdateAgencies, schemes, onUpdateSchemes,
    businessVerticals, insuranceTypes, allMembers, addToast, canCreate, canModify
}) => {
    const [selectedVertical, setSelectedVertical] = useState<string>('');
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
    const [agencySearch, setAgencySearch] = useState('');
    const [schemeSearch, setSchemeSearch] = useState('');
    
    const [agencyModal, setAgencyModal] = useState<{ isOpen: boolean; agency: Partial<AgencyType> | null; vertical: string }>({ isOpen: false, agency: null, vertical: '' });
    const [schemeModal, setSchemeModal] = useState<{ isOpen: boolean; scheme: Partial<SchemeType> | null; vertical: string }>({ isOpen: false, scheme: null, vertical: '' });
    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm?: () => void }>({ isOpen: false, title: '', message: '' });

    const agencyTriggerRef = useRef<HTMLButtonElement>(null);
    const schemeTriggerRef = useRef<HTMLButtonElement>(null);

    const mfCategories = [
        { value: 'Equity', label: 'Equity' },
        { value: 'Debt', label: 'Debt' },
        { value: 'Hybrid', label: 'Hybrid' },
        { value: 'Solution Oriented', label: 'Solution Oriented' },
        { value: 'Other', label: 'Other' }
    ];

    const isMutualFundVertical = useCallback((verticalId: string) => {
        const vertical = businessVerticals.find(v => v.id === verticalId);
        return vertical?.name.toLowerCase().includes('mutual fund');
    }, [businessVerticals]);

    const getAgenciesForVertical = useCallback((verticalId: string) => {
        if (isMutualFundVertical(verticalId)) {
            return amcs.filter(amc => amc.verticalId === verticalId);
        } else {
            return agencies.filter(agency => agency.active !== false);
        }
    }, [amcs, agencies, isMutualFundVertical]);

    const getSchemesForAgency = useCallback((agencyId: string, verticalId: string) => {
        if (isMutualFundVertical(verticalId)) {
            return mutualFundSchemes.filter(scheme => scheme.amcId === agencyId);
        } else {
            return schemes.filter(scheme => scheme.agencyId === agencyId);
        }
    }, [mutualFundSchemes, schemes, isMutualFundVertical]);

    const filteredAgencies = useMemo(() => {
        if (!selectedVertical) return [];
        return getAgenciesForVertical(selectedVertical)
            .filter(agency => agency.name.toLowerCase().includes(agencySearch.toLowerCase()));
    }, [selectedVertical, agencySearch, getAgenciesForVertical]);

    const filteredSchemes = useMemo(() => {
        if (!selectedAgencyId || !selectedVertical) return [];
        return getSchemesForAgency(selectedAgencyId, selectedVertical)
            .filter(scheme => scheme.name.toLowerCase().includes(schemeSearch.toLowerCase()))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [selectedAgencyId, selectedVertical, schemeSearch, getSchemesForAgency]);

    const insuranceTypeMap = useMemo(() => 
        new Map(insuranceTypes.map(it => [it.id, it])), 
        [insuranceTypes]
    );

    const parentTypeOptions = useMemo(() => 
        insuranceTypes.filter(it => !it.parentId && it.active && it.verticalId === selectedVertical), 
        [insuranceTypes, selectedVertical]
    );

    const childTypeOptions = useMemo(() => {
        const scheme = schemeModal.scheme as SchemeMaster;
        if (!scheme?.insuranceTypeId) return [];
        const parentType = insuranceTypeMap.get(scheme.insuranceTypeId);
        if (!parentType || parentType.parentId) return [];
        return insuranceTypes.filter(it => it.parentId === scheme.insuranceTypeId && it.active);
    }, [insuranceTypes, insuranceTypeMap, schemeModal.scheme]);

    const openAgencyModal = useCallback((agency: AgencyType | null, vertical: string, event?: React.MouseEvent<HTMLElement>) => {
        if (event) agencyTriggerRef.current = event.currentTarget as HTMLButtonElement;
        
        const isMF = isMutualFundVertical(vertical);
        setAgencyModal({
            isOpen: true,
            vertical,
            agency: agency ? { ...agency } : { 
                id: '', 
                name: '', 
                active: true,
                ...(isMF ? { verticalId: vertical } : { agencyCode: '' })
            }
        });
    }, [isMutualFundVertical]);

    const saveAgency = useCallback(() => {
        if (!canModify || !agencyModal.agency?.name?.trim()) {
            addToast('Agency name is required.', 'error');
            return;
        }

        const agency = agencyModal.agency;
        const isMF = isMutualFundVertical(agencyModal.vertical);

        if (isMF) {
            // Handle AMC
            const amcAgency = agency as Partial<AMC>;
            if (!amcAgency.verticalId) {
                addToast('Business Vertical is required for an AMC.', 'error');
                return;
            }
            
            if (agency.id) {
                onUpdateAmcs(amcs.map(a => a.id === agency.id ? agency as AMC : a));
            } else {
                const newAMC: AMC = {
                    ...agency,
                    id: `amc-${Date.now()}`,
                    verticalId: agencyModal.vertical
                } as AMC;
                onUpdateAmcs([...amcs, newAMC]);
            }
        } else {
            // Handle Insurance Agency
            if (agency.id) {
                onUpdateAgencies(agencies.map(a => a.id === agency.id ? agency as InsuranceAgency : a));
            } else {
                const newAgency: InsuranceAgency = {
                    ...agency,
                    id: `agency-${Date.now()}`,
                    agencyCode: agency.name!.toUpperCase().replace(/\s/g, '').substring(0, 6)
                } as InsuranceAgency;
                onUpdateAgencies([...agencies, newAgency]);
            }
        }
        
        setAgencyModal({ isOpen: false, agency: null, vertical: '' });
        agencyTriggerRef.current?.focus();
    }, [canModify, agencyModal, amcs, agencies, onUpdateAmcs, onUpdateAgencies, addToast, isMutualFundVertical]);

    const openSchemeModal = useCallback((scheme: SchemeType | null, vertical: string, event?: React.MouseEvent<HTMLElement>) => {
        if (event) schemeTriggerRef.current = event.currentTarget as HTMLButtonElement;
        
        const isMF = isMutualFundVertical(vertical);
        setSchemeModal({
            isOpen: true,
            vertical,
            scheme: scheme ? { ...scheme } : {
                name: '',
                active: true,
                ...(isMF ? {
                    amcId: selectedAgencyId || '',
                    category: 'Equity' as const
                } : {
                    agencyId: selectedAgencyId || '',
                    type: 'Health Insurance' as ConcretePolicyType,
                    insuranceTypeId: ''
                })
            }
        });
    }, [selectedAgencyId, isMutualFundVertical]);

    const saveScheme = useCallback(() => {
        if (!canModify || !schemeModal.scheme?.name?.trim()) {
            addToast('Scheme name is required.', 'error');
            return;
        }

        const scheme = schemeModal.scheme;
        const isMF = isMutualFundVertical(schemeModal.vertical);

        if (isMF) {
            // Handle Mutual Fund Scheme
            const mfScheme = scheme as Partial<MutualFundScheme>;
            if (!mfScheme.amcId) {
                addToast('AMC is required.', 'error');
                return;
            }
            
            if (scheme.id) {
                onUpdateMutualFundSchemes(mutualFundSchemes.map(s => s.id === scheme.id ? scheme as MutualFundScheme : s));
            } else {
                const newScheme: MutualFundScheme = {
                    ...scheme,
                    id: `mf-scheme-${Date.now()}`,
                    order: mutualFundSchemes.filter(s => s.amcId === mfScheme.amcId).length
                } as MutualFundScheme;
                onUpdateMutualFundSchemes([...mutualFundSchemes, newScheme]);
            }
        } else {
            // Handle Insurance Scheme
            const insScheme = scheme as Partial<SchemeMaster>;
            if (!insScheme.agencyId || !insScheme.insuranceTypeId) {
                addToast('Agency and Insurance Type are required.', 'error');
                return;
            }
            
            if (scheme.id) {
                onUpdateSchemes(schemes.map(s => s.id === scheme.id ? scheme as SchemeMaster : s));
            } else {
                const newScheme: SchemeMaster = {
                    ...scheme,
                    id: `scheme-${Date.now()}`,
                    order: schemes.filter(s => s.agencyId === insScheme.agencyId).length,
                    type: 'Health Insurance'
                } as SchemeMaster;
                onUpdateSchemes([...schemes, newScheme]);
            }
        }
        
        setSchemeModal({ isOpen: false, scheme: null, vertical: '' });
        schemeTriggerRef.current?.focus();
    }, [canModify, schemeModal, mutualFundSchemes, schemes, onUpdateMutualFundSchemes, onUpdateSchemes, addToast, isMutualFundVertical]);

    const toggleAgency = useCallback((id: string, vertical: string) => {
        const isMF = isMutualFundVertical(vertical);
        
        if (isMF) {
            const amc = amcs.find(a => a.id === id);
            if (!amc) return;
            
            if (amc.active === false) {
                onUpdateAmcs(amcs.map(a => a.id === id ? { ...a, active: true } : a));
                return;
            }

            const dependentSchemes = mutualFundSchemes.filter(s => s.amcId === id);
            const dependents = allMembers.filter(m => 
                (m.mutualFundHoldings || []).some(h => dependentSchemes.some(ds => ds.id === h.schemeId))
            );

            if (dependents.length > 0) {
                setWarningModal({
                    isOpen: true,
                    title: `Deactivate "${amc.name}"?`,
                    message: `This AMC is linked to investments of ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                    onConfirm: () => onUpdateAmcs(amcs.map(a => a.id === id ? { ...a, active: false } : a))
                });
            } else {
                onUpdateAmcs(amcs.map(a => a.id === id ? { ...a, active: false } : a));
            }
        } else {
            const agency = agencies.find(a => a.id === id);
            if (!agency) return;
            
            if (agency.active === false) {
                onUpdateAgencies(agencies.map(a => a.id === id ? { ...a, active: true } : a));
                return;
            }

            const agencySchemes = schemes.filter(s => s.agencyId === id);
            const dependents = allMembers.filter(m => 
                m.policies.some(p => agencySchemes.some(as => as.id === p.schemeId))
            );

            if (dependents.length > 0) {
                setWarningModal({
                    isOpen: true,
                    title: `Deactivate "${agency.name}"?`,
                    message: `This Agency is linked to policies of ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                    onConfirm: () => onUpdateAgencies(agencies.map(a => a.id === id ? { ...a, active: false } : a))
                });
            } else {
                onUpdateAgencies(agencies.map(a => a.id === id ? { ...a, active: false } : a));
            }
        }
    }, [amcs, agencies, mutualFundSchemes, schemes, allMembers, onUpdateAmcs, onUpdateAgencies, isMutualFundVertical]);

    const deleteAgency = useCallback((agencyId: string, vertical: string) => {
        const isMF = isMutualFundVertical(vertical);
        
        if (isMF) {
            const amc = amcs.find(a => a.id === agencyId);
            if (!amc) return;

            const associatedSchemes = mutualFundSchemes.filter(s => s.amcId === agencyId);
            if (associatedSchemes.length > 0) {
                addToast(`Cannot delete "${amc.name}" because it has ${associatedSchemes.length} scheme(s) linked to it.`, 'error');
            } else if (window.confirm(`Are you sure you want to delete the AMC "${amc.name}"?`)) {
                onUpdateAmcs(amcs.filter(a => a.id !== agencyId));
                addToast(`AMC "${amc.name}" deleted successfully.`, 'success');
            }
        } else {
            const agency = agencies.find(a => a.id === agencyId);
            if (!agency) return;

            const associatedSchemes = schemes.filter(s => s.agencyId === agencyId);
            if (associatedSchemes.length > 0) {
                addToast(`Cannot delete "${agency.name}" because it has ${associatedSchemes.length} scheme(s) linked to it.`, 'error');
            } else if (window.confirm(`Are you sure you want to delete the Agency "${agency.name}"?`)) {
                onUpdateAgencies(agencies.filter(a => a.id !== agencyId));
                addToast(`Agency "${agency.name}" deleted successfully.`, 'success');
            }
        }
    }, [amcs, agencies, mutualFundSchemes, schemes, onUpdateAmcs, onUpdateAgencies, addToast, isMutualFundVertical]);

    const toggleScheme = useCallback((id: string, vertical: string) => {
        const isMF = isMutualFundVertical(vertical);
        
        if (isMF) {
            const scheme = mutualFundSchemes.find(s => s.id === id);
            if (!scheme) return;
            
            if (scheme.active === false) {
                onUpdateMutualFundSchemes(mutualFundSchemes.map(s => s.id === id ? { ...s, active: true } : s));
                return;
            }

            const dependents = allMembers.filter(m => 
                (m.mutualFundHoldings || []).some(h => h.schemeId === id)
            );

            if (dependents.length > 0) {
                setWarningModal({
                    isOpen: true,
                    title: `Deactivate "${scheme.name}"?`,
                    message: `This scheme is linked to investments of ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                    onConfirm: () => onUpdateMutualFundSchemes(mutualFundSchemes.map(s => s.id === id ? { ...s, active: false } : s))
                });
            } else {
                onUpdateMutualFundSchemes(mutualFundSchemes.map(s => s.id === id ? { ...s, active: false } : s));
            }
        } else {
            const scheme = schemes.find(s => s.id === id);
            if (!scheme) return;
            
            if (scheme.active === false) {
                onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: true } : s));
                return;
            }

            const dependents = allMembers.filter(m => 
                m.policies.some(p => p.schemeId === id)
            );

            if (dependents.length > 0) {
                setWarningModal({
                    isOpen: true,
                    title: `Deactivate "${scheme.name}"?`,
                    message: `This scheme is linked to policies of ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                    onConfirm: () => onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: false } : s))
                });
            } else {
                onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: false } : s));
            }
        }
    }, [mutualFundSchemes, schemes, allMembers, onUpdateMutualFundSchemes, onUpdateSchemes, isMutualFundVertical]);

    const deleteScheme = useCallback((schemeId: string, vertical: string) => {
        const isMF = isMutualFundVertical(vertical);
        
        if (isMF) {
            const scheme = mutualFundSchemes.find(s => s.id === schemeId);
            if (!scheme) return;

            const dependents = allMembers.filter(m => 
                (m.mutualFundHoldings || []).some(h => h.schemeId === schemeId)
            );

            if (dependents.length > 0) {
                addToast(`Cannot delete "${scheme.name}" because it is being used by ${dependents.length} client(s).`, 'error');
            } else if (window.confirm(`Are you sure you want to delete the scheme "${scheme.name}"?`)) {
                onUpdateMutualFundSchemes(mutualFundSchemes.filter(s => s.id !== schemeId));
                addToast(`Scheme "${scheme.name}" deleted successfully.`, 'success');
            }
        } else {
            const scheme = schemes.find(s => s.id === schemeId);
            if (!scheme) return;

            const dependents = allMembers.filter(m => 
                m.policies.some(p => p.schemeId === schemeId)
            );

            if (dependents.length > 0) {
                addToast(`Cannot delete "${scheme.name}" because it is being used by ${dependents.length} client(s).`, 'error');
            } else if (window.confirm(`Are you sure you want to delete the scheme "${scheme.name}"?`)) {
                onUpdateSchemes(schemes.filter(s => s.id !== schemeId));
                addToast(`Scheme "${scheme.name}" deleted successfully.`, 'success');
            }
        }
    }, [mutualFundSchemes, schemes, allMembers, onUpdateMutualFundSchemes, onUpdateSchemes, addToast, isMutualFundVertical]);

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

    const selectedVerticalName = businessVerticals.find(v => v.id === selectedVertical)?.name || '';
    const selectedAgencyName = filteredAgencies.find(a => a.id === selectedAgencyId)?.name || '';
    const isMFVertical = selectedVertical ? isMutualFundVertical(selectedVertical) : false;

    return (
        <div className="space-y-6">
            {/* Business Vertical Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Select Business Vertical</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {businessVerticals.filter(v => v.active && (v.name.toLowerCase().includes('insurance') || v.name.toLowerCase().includes('mutual fund'))).map(vertical => (
                        <button
                            key={vertical.id}
                            onClick={() => {
                                setSelectedVertical(vertical.id);
                                setSelectedAgencyId('');
                                setAgencySearch('');
                                setSchemeSearch('');
                            }}
                            className={`p-3 rounded-lg border text-left transition-all ${
                                selectedVertical === vertical.id
                                    ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            <div className="font-medium">{vertical.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isMutualFundVertical(vertical.id) ? 'AMCs & Schemes' : 'Agencies & Schemes'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {selectedVertical && (
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    {/* Agencies Column */}
                    <div className="lg:w-2/5 xl:w-1/3 flex flex-col h-full">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {isMFVertical ? 'AMCs' : 'Agencies'} - {selectedVerticalName}
                        </h3>
                        <div className="flex flex-col gap-4 my-4">
                            <SearchBar 
                                searchQuery={agencySearch} 
                                onSearchChange={setAgencySearch} 
                                placeholder={`Search ${isMFVertical ? 'AMCs' : 'Agencies'}...`} 
                                className="w-full" 
                            />
                            {canCreate && (
                                <Button 
                                    ref={agencyTriggerRef} 
                                    onClick={(e) => openAgencyModal(null, selectedVertical, e)} 
                                    variant="primary" 
                                    className="w-full"
                                >
                                    <Plus size={16}/> Add New {isMFVertical ? 'AMC' : 'Agency'}
                                </Button>
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
                                            className={`cursor-pointer ${
                                                selectedAgencyId === agency.id 
                                                    ? 'bg-blue-100 dark:bg-blue-900/50' 
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            } ${!agency.active ? 'opacity-60' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{agency.name}</td>
                                            <td className="px-4 py-3">
                                                <ToggleSwitch 
                                                    enabled={!!agency.active} 
                                                    onChange={() => toggleAgency(agency.id, selectedVertical)} 
                                                    disabled={!canModify} 
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        size="small" 
                                                        variant="light" 
                                                        className="!p-1.5" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            openAgencyModal(agency, selectedVertical, e); 
                                                        }} 
                                                        disabled={!canModify}
                                                    >
                                                        <Edit2 size={14}/>
                                                    </Button>
                                                    {canModify && (
                                                        <Button 
                                                            size="small" 
                                                            variant="danger" 
                                                            className="!p-1.5" 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                deleteAgency(agency.id, selectedVertical); 
                                                            }}
                                                        >
                                                            <Trash2 size={14}/>
                                                        </Button>
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
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                    Schemes for {selectedAgencyName}
                                </h3>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                                    <SearchBar 
                                        searchQuery={schemeSearch} 
                                        onSearchChange={setSchemeSearch} 
                                        placeholder="Search Schemes..." 
                                        className="w-full md:w-1/2" 
                                    />
                                    {canCreate && (
                                        <Button 
                                            onClick={(e) => openSchemeModal(null, selectedVertical, e)} 
                                            variant="primary" 
                                            className="w-full md:w-auto flex-shrink-0"
                                        >
                                            <Plus size={16}/> Add New Scheme
                                        </Button>
                                    )}
                                </div>
                                <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                                                {isMFVertical ? (
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Category</th>
                                                ) : (
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Type</th>
                                                )}
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredSchemes.map((scheme) => (
                                                <tr
                                                    key={scheme.id}
                                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                                                        scheme.active === false ? 'opacity-60' : ''
                                                    }`}
                                                >
                                                    <td className="px-6 py-3 font-medium">{scheme.name}</td>
                                                    <td className="px-6 py-3 text-sm">
                                                        {isMFVertical 
                                                            ? (scheme as MutualFundScheme).category 
                                                            : getInsuranceTypeName(scheme as SchemeMaster)
                                                        }
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <ToggleSwitch 
                                                            enabled={scheme.active !== false} 
                                                            onChange={() => toggleScheme(scheme.id, selectedVertical)} 
                                                            disabled={!canModify} 
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Button 
                                                                size="small" 
                                                                variant="light" 
                                                                className="!p-1.5" 
                                                                onClick={(e) => openSchemeModal(scheme, selectedVertical, e)} 
                                                                disabled={!canModify}
                                                            >
                                                                <Edit2 size={14}/>
                                                            </Button>
                                                            {canModify && (
                                                                <Button 
                                                                    size="small" 
                                                                    variant="danger" 
                                                                    className="!p-1.5" 
                                                                    onClick={() => deleteScheme(scheme.id, selectedVertical)}
                                                                >
                                                                    <Trash2 size={14}/>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredSchemes.length === 0 && (
                                        <div className="p-8 text-center text-gray-500">
                                            No schemes found for this {isMFVertical ? 'AMC' : 'agency'}.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-lg">
                                <div>
                                    <Building size={48} className="mx-auto text-gray-300 dark:text-gray-500"/>
                                    <p className="mt-4 font-semibold">Select an {isMFVertical ? 'AMC' : 'Agency'}</p>
                                    <p className="text-sm">Select an {isMFVertical ? 'AMC' : 'agency'} from the left to view and manage its schemes.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Agency Modal */}
            {agencyModal.isOpen && (
                <Modal isOpen={agencyModal.isOpen} onClose={() => setAgencyModal({ isOpen: false, agency: null, vertical: '' })}>
                    <form onSubmit={(e) => { e.preventDefault(); saveAgency(); }}>
                        <div className="p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {agencyModal.agency?.id ? 'Edit' : 'Add'} {isMutualFundVertical(agencyModal.vertical) ? 'AMC' : 'Agency'}
                            </h2>
                            <Input 
                                label={`${isMutualFundVertical(agencyModal.vertical) ? 'AMC' : 'Agency'} Name`}
                                value={agencyModal.agency?.name || ''} 
                                onChange={e => setAgencyModal(prev => ({ 
                                    ...prev, 
                                    agency: prev.agency ? { ...prev.agency, name: e.target.value } : null 
                                }))} 
                                disabled={!canModify} 
                                autoFocus 
                            />
                            <div className="flex justify-end gap-4 pt-4">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => setAgencyModal({ isOpen: false, agency: null, vertical: '' })}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Scheme Modal */}
            {schemeModal.isOpen && (
                <Modal isOpen={schemeModal.isOpen} onClose={() => setSchemeModal({ isOpen: false, scheme: null, vertical: '' })}>
                    <form onSubmit={(e) => { e.preventDefault(); saveScheme(); }}>
                        <div className="p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {schemeModal.scheme?.id ? 'Edit' : 'New'} Scheme
                            </h2>
                            <Input 
                                label="Scheme Name" 
                                value={schemeModal.scheme?.name || ''} 
                                onChange={e => setSchemeModal(prev => ({ 
                                    ...prev, 
                                    scheme: prev.scheme ? { ...prev.scheme, name: e.target.value } : null 
                                }))} 
                                autoFocus 
                            />
                            
                            {isMutualFundVertical(schemeModal.vertical) ? (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select 
                                        value={(schemeModal.scheme as MutualFundScheme)?.category || ''} 
                                        onChange={e => setSchemeModal(prev => ({ 
                                            ...prev, 
                                            scheme: prev.scheme ? { ...prev.scheme, category: e.target.value } : null 
                                        }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Select Category...</option>
                                        {mfCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Insurance Type</label>
                                        <select 
                                            value={(schemeModal.scheme as SchemeMaster)?.insuranceTypeId || ''} 
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
                                    {(schemeModal.scheme as SchemeMaster)?.insuranceTypeId && childTypeOptions.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Insurance Sub-Type</label>
                                            <select 
                                                value="" 
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
                                </>
                            )}
                            
                            <div className="flex justify-end gap-4 pt-4">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => setSchemeModal({ isOpen: false, scheme: null, vertical: '' })}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="success" disabled={!canModify}>Save Scheme</Button>
                            </div>
                        </div>
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
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            {warningModal.onConfirm && (
                                <Button 
                                    variant="danger" 
                                    onClick={() => { 
                                        warningModal.onConfirm?.(); 
                                        setWarningModal({ isOpen: false, title: '', message: '' }); 
                                    }}
                                >
                                    Confirm Deactivation
                                </Button>
                            )}
                            <Button 
                                variant="secondary" 
                                onClick={() => setWarningModal({ isOpen: false, title: '', message: '' })}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default UnifiedAgencySchemeManager;