import React, { useState, useMemo, useEffect } from 'react';
import { 
    Member, UpsellCategory, InsuranceTypeMaster, User, Branch, Role, 
    BusinessVertical, SchemeMaster, InsuranceAgency, Geography, 
    CustomerCategory, CustomerSubCategory, CustomerGroup, CustomerType,
    Gender, LeadSourceMaster, Lead, AMC, PolicyType
} from '../types.ts';
import { CheckCircle, Search, PlusCircle, AlertCircle, Filter, CheckSquare, Square, AlertTriangle, X, Plus, Check } from 'lucide-react';
import Button from './ui/Button.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import Modal from './ui/Modal.tsx';
import Pagination from './ui/Pagination.tsx';

const FILTER_OPTIONS_CONFIG = [
    { key: 'vertical', label: 'Business Vertical' },
    { key: 'insuranceType', label: 'Insurance Type' },
    { key: 'branch', label: 'Branch' },
    { key: 'advisor', label: 'Advisor' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'city', label: 'City' },
    { key: 'area', label: 'Area' },
    { key: 'category', label: 'Category' },
    { key: 'subCategory', label: 'Sub-Category' },
    { key: 'group', label: 'Group' },
    { key: 'tier', label: 'Tier Type' },
    { key: 'gender', label: 'Gender' },
];

interface BulkCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    advisors: User[];
    branches: Branch[];
    insuranceTypes: InsuranceTypeMaster[];
    leadSources: LeadSourceMaster[];
    onSubmit: (data: {
        productType: string;
        isMutualFund: boolean;
        advisor: string;
        branch: string;
        estimatedValue: number;
        notes: string;
        leadSource: { sourceId: string | null; detail: string };
    }) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const BulkCreationModal: React.FC<BulkCreationModalProps> = ({
    isOpen, onClose, selectedCount, advisors, branches, insuranceTypes, leadSources, onSubmit, addToast
}) => {
    const [productType, setProductType] = useState<string>('');
    const [isMutualFund, setIsMutualFund] = useState(false);
    const [advisor, setAdvisor] = useState<string>('');
    const [branch, setBranch] = useState<string>('');
    const [estimatedValueStr, setEstimatedValueStr] = useState<string>('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setProductType('');
            setIsMutualFund(false);
            setAdvisor('');
            setBranch('');
            setEstimatedValueStr('');
            setNotes('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!advisor || !branch) {
            addToast("Advisor and Branch are required.", "error");
            return;
        }
        if (!isMutualFund && !productType) {
            addToast("Please select a product to pitch.", "error");
            return;
        }

        const CrossSellingSource = leadSources.find(ls => ls.name === 'CrossSelling');
        const sourceIdToUse = CrossSellingSource ? CrossSellingSource.id : null; 
        const sourceDetail = 'Bulk Action'; 

        onSubmit({
            productType,
            isMutualFund,
            advisor,
            branch,
            estimatedValue: parseFloat(estimatedValueStr) || 0,
            notes,
            leadSource: { sourceId: sourceIdToUse, detail: sourceDetail }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create Bulk Leads</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    You are about to create <span className="font-bold text-brand-primary">{selectedCount} leads</span>. 
                    Please define the campaign details below.
                </p>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Type</label>
                            <div className="flex gap-4 mb-2">
                                <label className="flex items-center text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={!isMutualFund} 
                                        onChange={() => setIsMutualFund(false)} 
                                        className="mr-2 focus:ring-brand-primary text-brand-primary" 
                                    />
                                    Insurance
                                </label>
                                <label className="flex items-center text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={isMutualFund} 
                                        onChange={() => setIsMutualFund(true)} 
                                        className="mr-2 focus:ring-brand-primary text-brand-primary" 
                                    />
                                    Mutual Fund
                                </label>
                            </div>
                            {!isMutualFund && (
                                <select 
                                    value={productType} 
                                    onChange={(e) => setProductType(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Select Insurance Type</option>
                                    {insuranceTypes.filter(t => !t.parentId).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Estimated Value (₹)
                            </label>
                            <input
                                type="number"
                                value={estimatedValueStr}
                                onChange={(e) => setEstimatedValueStr(e.target.value)}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Advisor *</label>
                            <select 
                                value={advisor} 
                                onChange={(e) => setAdvisor(e.target.value)}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Select Advisor</option>
                                {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Branch *</label>
                            <select 
                                value={branch} 
                                onChange={(e) => setBranch(e.target.value)}
                                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Note</label>
                            <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="E.g. Diwali CrossSelling Campaign..."
                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit}>Create Leads</Button>
                </div>
            </div>
        </Modal>
    );
};

interface CrossSellingDashboardProps {
    members: Member[];
    insuranceTypes: InsuranceTypeMaster[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    users: User[];
    branches: Branch[];
    roles: Role[];
    onCreateLead: (member: Member, insuranceTypeName: string) => void;
    onBulkCreateLeads: (leads: Lead[]) => void;
    businessVerticals: BusinessVertical[];
    geographies: Geography[];
    customerCategories: CustomerCategory[];
    customerSubCategories: CustomerSubCategory[];
    customerGroups: CustomerGroup[];
    customerTypes: CustomerType[];
    genders: Gender[];
    leadSources: LeadSourceMaster[];
}

interface FilterState {
    vertical: string;
    insuranceType: string;
    ownership: string;
    state: string;
    district: string;
    city: string;
    area: string;
    category: string;
    subCategory: string;
    group: string;
    tier: string;
    gender: string;
    leadSource: string;
    branch: string;
    advisor: string;
}

const CrossSellingDashboard: React.FC<CrossSellingDashboardProps> = ({ 
    members, insuranceTypes, addToast, users, branches, roles, 
    onCreateLead, onBulkCreateLeads,
    businessVerticals, geographies, 
    customerCategories, customerSubCategories, customerGroups, customerTypes, genders, leadSources
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isAddFilterModalOpen, setIsAddFilterModalOpen] = useState(false);
    const [visibleFilters, setVisibleFilters] = useState<string[]>([]);
    const [tempVisibleFilters, setTempVisibleFilters] = useState<string[]>([]);

    const initialFilters: FilterState = {
        vertical: 'all', insuranceType: 'all', ownership: 'all',
        state: 'all', district: 'all', city: 'all', area: 'all',
        category: 'all', subCategory: 'all', group: 'all', tier: 'all', gender: 'all',
        leadSource: 'all', branch: 'all', advisor: 'all'
    };

    const [filters, setFilters] = useState<FilterState>(initialFilters);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    
    const [warningState, setWarningState] = useState<{
        isOpen: boolean;
        ineligibleNames: string[];
        eligibleLeads: Lead[];
        allLeads: Lead[];
    }>({ isOpen: false, ineligibleNames: [], eligibleLeads: [], allLeads: [] });

    const geographiesMap = useMemo(() => new Map(geographies.map(g => [g.id, g])), [geographies]);
    const customerSubCategoriesMap = useMemo(() => new Map(customerSubCategories.map(sc => [sc.id, sc])), [customerSubCategories]);
    const advisorsMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const insuranceTypesMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

    const advisors = useMemo(() => {
        const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
        return users.filter(u => u.roleId && advisorRoleIds.has(u.roleId));
    }, [users, roles]);

    const states = useMemo(() => geographies.filter(g => g.type === 'State'), [geographies]);
    const districts = useMemo(() => geographies.filter(g => g.type === 'District' && (filters.state === 'all' || g.parentId === filters.state)), [geographies, filters.state]);
    const cities = useMemo(() => geographies.filter(g => g.type === 'City' && (filters.district === 'all' || g.parentId === filters.district)), [geographies, filters.district]);
    const areas = useMemo(() => geographies.filter(g => g.type === 'Area' && (filters.city === 'all' || g.parentId === filters.city)), [geographies, filters.city]);

    const filteredSubCategories = useMemo(() => {
        if (filters.category === 'all') return customerSubCategories;
        return customerSubCategories.filter(sc => sc.parentId === filters.category);
    }, [customerSubCategories, filters.category]);
    
    const parentInsuranceTypes = useMemo(() => 
        [...insuranceTypes]
            .filter(it => !it.parentId && it.active)
            .sort((a, b) => (a.order || 0) - (b.order || 0)), 
    [insuranceTypes]);

    const mfVerticalId = useMemo(() => businessVerticals.find(v => v.name.includes('Mutual Fund') || v.name.includes('Investment'))?.id, [businessVerticals]);
    const insuranceVerticalId = useMemo(() => businessVerticals.find(v => v.name === 'Insurance')?.id, [businessVerticals]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        const updates: Partial<FilterState> = { [key]: value };

        if (key === 'state') {
            updates.district = 'all';
            updates.city = 'all';
            updates.area = 'all';
        } else if (key === 'district') {
            updates.city = 'all';
            updates.area = 'all';
        } else if (key === 'city') {
            updates.area = 'all';
        } else if (key === 'category') {
            updates.subCategory = 'all';
        } else if (key === 'branch') {
            updates.advisor = 'all';
        } else if (key === 'vertical' && value !== insuranceVerticalId) {
            updates.insuranceType = 'all';
        }

        if (value !== 'all') {
            if (key === 'area') {
                const area = geographiesMap.get(value);
                const city = area && area.parentId ? geographiesMap.get(area.parentId) : undefined;
                const district = city && city.parentId ? geographiesMap.get(city.parentId) : undefined;
                const state = district && district.parentId ? geographiesMap.get(district.parentId) : undefined;
                if (city) updates.city = city.id;
                if (district) updates.district = district.id;
                if (state) updates.state = state.id;
            } else if (key === 'city') {
                const city = geographiesMap.get(value);
                const district = city && city.parentId ? geographiesMap.get(city.parentId) : undefined;
                const state = district && district.parentId ? geographiesMap.get(district.parentId) : undefined;
                if (district) updates.district = district.id;
                if (state) updates.state = state.id;
            } else if (key === 'district') {
                const district = geographiesMap.get(value);
                const state = district && district.parentId ? geographiesMap.get(district.parentId) : undefined;
                if (state) updates.state = state.id;
            } else if (key === 'subCategory') {
                const subCat = customerSubCategoriesMap.get(value);
                if (subCat && subCat.parentId) {
                    updates.category = subCat.parentId;
                }
            } else if (key === 'advisor') {
                const advisor = advisorsMap.get(value);
                const branchId = (advisor as any)?.branch_id; 
                if (branchId) {
                    updates.branch = branchId;
                }
            } else if (key === 'insuranceType' && insuranceVerticalId) {
                updates.vertical = insuranceVerticalId;
            }
        }

        setFilters(prev => ({ ...prev, ...updates }));
    };

    const isSpecificInsuranceTypeView = filters.insuranceType !== 'all';

    const parentToChildrenMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        const getAllDescendantIds = (parentId: string): string[] => {
            const children = insuranceTypes.filter(it => it.parentId === parentId).map(it => it.id);
            return children.reduce((acc, childId) => [...acc, childId, ...getAllDescendantIds(childId)], [] as string[]);
        };
        parentInsuranceTypes.forEach(parent => {
            map.set(parent.id, new Set([parent.id, ...getAllDescendantIds(parent.id)]));
        });
        return map;
    }, [parentInsuranceTypes, insuranceTypes]);

    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            if (searchQuery && !member.name.toLowerCase().includes(searchQuery.toLowerCase()) && !member.memberId.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            if (filters.branch !== 'all' && member.branch_id !== filters.branch) return false;
            if (filters.advisor !== 'all' && !member.assignedTo.includes(filters.advisor)) return false;
            if (filters.leadSource !== 'all' && member.leadSource?.sourceId !== filters.leadSource) return false;

            if (filters.category !== 'all' && member.customerCategoryId !== filters.category) return false;
            if (filters.subCategory !== 'all' && member.customerSubCategoryId !== filters.subCategory) return false;
            if (filters.group !== 'all' && member.customerGroupId !== filters.group) return false;
            if (filters.tier !== 'all' && member.tierId !== filters.tier) return false;
            if (filters.gender !== 'all' && member.gender !== filters.gender) return false;

            if (filters.state !== 'all' && member.state !== states.find(s => s.id === filters.state)?.name) return false;
            if (filters.district !== 'all' && member.district !== districts.find(d => d.id === filters.district)?.name) return false;
            if (filters.city !== 'all' && member.city !== cities.find(c => c.id === filters.city)?.name) return false;
            if (filters.area !== 'all' && member.area !== areas.find(a => a.id === filters.area)?.name) return false;
            
            if (filters.ownership !== 'all') {
                let hasProduct = false;
                const isInsuranceView = filters.vertical === 'all' || filters.vertical === insuranceVerticalId;
                const isMfView = filters.vertical === 'all' || filters.vertical === mfVerticalId;

                if (isInsuranceView) {
                    if (filters.insuranceType !== 'all') {
                        const relevantIds = parentToChildrenMap.get(filters.insuranceType) || new Set([filters.insuranceType]);
                        hasProduct = member.policies.some(p => p.status === 'Active' && p.insuranceTypeId && relevantIds.has(p.insuranceTypeId));
                    } else {
                        hasProduct = member.policies.some(p => p.status === 'Active');
                    }
                }
                
                if (isMfView && !hasProduct) {
                    hasProduct = (member.mutualFundHoldings?.length || 0) > 0;
                }

                if (filters.ownership === 'owned' && !hasProduct) return false;
                if (filters.ownership === 'not_owned' && hasProduct) return false;
            }
            return true;
        });
    }, [
        members, searchQuery, filters,
        states, districts, cities, areas, parentToChildrenMap, insuranceVerticalId, mfVerticalId
    ]);

    const showMutualFundsColumn = useMemo(() => {
        return filters.vertical === 'all' || filters.vertical === mfVerticalId;
    }, [filters.vertical, mfVerticalId]);

    const showInsuranceColumns = useMemo(() => {
        return filters.vertical === 'all' || filters.vertical === insuranceVerticalId;
    }, [filters.vertical, insuranceVerticalId]);

    const visibleInsuranceTypes = useMemo(() => {
        if (!showInsuranceColumns) return [];
        if (isSpecificInsuranceTypeView) {
            return parentInsuranceTypes.filter(t => t.id === filters.insuranceType);
        }
        return parentInsuranceTypes;
    }, [showInsuranceColumns, isSpecificInsuranceTypeView, parentInsuranceTypes, filters.insuranceType]);

    const getProductPenetration = (parentTypeId: string) => {
        const count = filteredMembers.filter(m => {
            const childIds = parentToChildrenMap.get(parentTypeId);
            return m.policies.some(p => p.insuranceTypeId && childIds?.has(p.insuranceTypeId));
        }).length;
        return { count, total: filteredMembers.length };
    };

    const paginatedMembers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredMembers.slice(startIndex, endIndex);
    }, [filteredMembers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSelectedMemberIds(new Set()); // Clear selections when changing pages
    };

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, searchQuery]);

    const getMutualFundPenetration = () => {
        const count = filteredMembers.filter(m => (m.mutualFundHoldings?.length || 0) > 0).length;
        return { count, total: filteredMembers.length };
    };

    const toggleSelectAll = () => {
        if (selectedMemberIds.size === paginatedMembers.length) {
            setSelectedMemberIds(new Set());
        } else {
            setSelectedMemberIds(new Set(paginatedMembers.map(m => m.id)));
        }
    };

    const toggleSelectMember = (id: string) => {
        const newSet = new Set(selectedMemberIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedMemberIds(newSet);
    };

    const openBulkModal = () => {
        if (selectedMemberIds.size === 0) {
            addToast("Please select at least one customer.", "error");
            return;
        }
        setIsBulkModalOpen(true);
    };

    const handleBulkSubmit = (data: any) => {
        const selectedMembers = members.filter(m => selectedMemberIds.has(m.id));
        const eligibleLeads: Lead[] = [];
        const allLeads: Lead[] = [];
        const ineligibleNames: string[] = [];

        selectedMembers.forEach(member => {
            let alreadyHasProduct = false;
            if (data.isMutualFund) {
                if ((member.mutualFundHoldings?.length || 0) > 0) alreadyHasProduct = true;
            } else {
                const relevantIds = parentToChildrenMap.get(data.productType) || new Set([data.productType]);
                const hasPolicy = member.policies.some(p => p.status === 'Active' && p.insuranceTypeId && relevantIds.has(p.insuranceTypeId));
                if (hasPolicy) alreadyHasProduct = true;
            }

            const newLead: Lead = {
                id: '', name: member.name, phone: member.mobile, email: member.email || '',
                leadSource: data.leadSource, status: 'Lead', estimatedValue: data.estimatedValue,
                assignedTo: data.advisor, branch_id: data.branch, company: member.company, comp_id: member.comp_id,
                createdAt: new Date().toISOString(),
                insuranceTypeId: data.isMutualFund ? null : data.productType,
                policyInterestType: (data.isMutualFund ? 'Mutual Funds' : (insuranceTypes.find(it => it.id === data.productType)?.name || '')) as PolicyType, 
                notes: `Bulk Upsell Lead. ${data.notes}`,
                existingMemberId: member.id,
            };
            allLeads.push(newLead);
            if (alreadyHasProduct) ineligibleNames.push(member.name);
            else eligibleLeads.push(newLead);
        });

        if (ineligibleNames.length > 0) {
            setWarningState({ isOpen: true, ineligibleNames, eligibleLeads, allLeads });
            return; 
        }
        onBulkCreateLeads(allLeads);
        setIsBulkModalOpen(false);
        setSelectedMemberIds(new Set());
    };

    const confirmSkipDuplicates = () => {
        if (warningState.eligibleLeads.length > 0) {
            onBulkCreateLeads(warningState.eligibleLeads);
            addToast(`Created ${warningState.eligibleLeads.length} leads. Skipped ${warningState.ineligibleNames.length} customers.`, 'success');
        } else {
            addToast("Action cancelled. No eligible leads to create.", "error");
        }
        closeWarning(); setIsBulkModalOpen(false); setSelectedMemberIds(new Set());
    };

    const confirmCreateAll = () => {
        onBulkCreateLeads(warningState.allLeads);
        addToast(`Created all ${warningState.allLeads.length} leads.`, 'success');
        closeWarning(); setIsBulkModalOpen(false); setSelectedMemberIds(new Set());
    };

    const closeWarning = () => setWarningState({ isOpen: false, ineligibleNames: [], eligibleLeads: [], allLeads: [] });

    const openAddFilterModal = () => {
        setTempVisibleFilters([...visibleFilters]);
        setIsAddFilterModalOpen(true);
    };

    // --- FIX: This is the corrected function ---
    const applyVisibleFilters = () => {
        const newVisibleSet = new Set(tempVisibleFilters);
        const removedFilterKeys = visibleFilters.filter(key => !newVisibleSet.has(key));

        // If any filters were removed, reset their values in the main filter state
        if (removedFilterKeys.length > 0) {
            const resets: Partial<FilterState> = {};
            removedFilterKeys.forEach(key => {
                resets[key as keyof FilterState] = initialFilters[key as keyof FilterState];
            });
            setFilters(prev => ({ ...prev, ...resets }));
        }
        
        setVisibleFilters(tempVisibleFilters);
        setIsAddFilterModalOpen(false);
    };

    const handleSelectAllFilters = () => setTempVisibleFilters(FILTER_OPTIONS_CONFIG.map(o => o.key));
    const handleDeselectAllFilters = () => setTempVisibleFilters([]);
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark dark:text-white">CrossSelling & Business Promotion</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Filter existing customers to identify opportunities and create leads in bulk.
                    </p>
                </div>
                <div>
                     <Button variant="primary" disabled={selectedMemberIds.size === 0} onClick={openBulkModal}>
                        <PlusCircle size={16} className="mr-2" /> Create Bulk Leads ({selectedMemberIds.size})
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-full md:w-64">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name or Mobile..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full rounded-md border border-gray-300 py-2 text-sm focus:ring-brand-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-64">
                        <SearchableSelect
                            label="Product Status"
                            options={[{value:'all', label:'All'}, {value:'owned', label:'Owned'}, {value:'not_owned', label:'Not Owned'}]}
                            value={filters.ownership}
                            onChange={(v) => handleFilterChange('ownership', v)}
                        />
                    </div>

                    <button 
                        onClick={openAddFilterModal}
                        className="h-10 px-4 rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> 
                        Add Filter
                    </button>

                    {(visibleFilters.length > 0 || searchQuery ) && (
                        <button 
                            onClick={() => { setFilters(initialFilters); setSearchQuery(''); setVisibleFilters([]); }}
                            className="h-10 px-4 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {visibleFilters.length > 0 && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-fadeIn">
                        {visibleFilters.includes('vertical') && <SearchableSelect label="Business Vertical" options={[{value:'all', label:'All'}, ...businessVerticals.map(v=>({value:v.id, label:v.name}))]} value={filters.vertical} onChange={(v) => handleFilterChange('vertical', v)} />}
                        
                        {visibleFilters.includes('insuranceType') && showInsuranceColumns && (
                            <SearchableSelect 
                                label="Insurance Type" 
                                options={[{value:'all', label:'All'}, ...parentInsuranceTypes.map(t=>({value:t.id, label:t.name}))]} 
                                value={filters.insuranceType} 
                                onChange={(v) => handleFilterChange('insuranceType', v)} 
                            />
                        )}
                        
                        {visibleFilters.includes('branch') && <SearchableSelect label="Branch" options={[{value:'all', label:'All'}, ...branches.map(b=>({value:b.id, label:b.branch_name}))]} value={filters.branch} onChange={(v) => handleFilterChange('branch', v)} />}
                        {visibleFilters.includes('advisor') && <SearchableSelect label="Advisor" options={[{value:'all', label:'All'}, ...advisors.map(a=>({value:a.id, label:a.name}))]} value={filters.advisor} onChange={(v) => handleFilterChange('advisor', v)} />}
                        {visibleFilters.includes('leadSource') && <SearchableSelect label="Lead Source" options={[{value:'all', label:'All'}, ...leadSources.map(l=>({value:l.id, label:l.name}))]} value={filters.leadSource} onChange={(v) => handleFilterChange('leadSource', v)} />}
                        
                        {visibleFilters.includes('state') && <SearchableSelect label="State" options={[{value:'all', label:'All'}, ...states.map(s=>({value:s.id, label:s.name}))]} value={filters.state} onChange={(v) => handleFilterChange('state', v)} />}
                        {visibleFilters.includes('district') && <SearchableSelect label="District" options={[{value:'all', label:'All'}, ...districts.map(d=>({value:d.id, label:d.name}))]} value={filters.district} onChange={(v) => handleFilterChange('district', v)} />}
                        {visibleFilters.includes('city') && <SearchableSelect label="City" options={[{value:'all', label:'All'}, ...cities.map(c=>({value:c.id, label:c.name}))]} value={filters.city} onChange={(v) => handleFilterChange('city', v)} />}
                        {visibleFilters.includes('area') && <SearchableSelect label="Area" options={[{value:'all', label:'All'}, ...areas.map(a=>({value:a.id, label:a.name}))]} value={filters.area} onChange={(v) => handleFilterChange('area', v)} />}
                        
                        {visibleFilters.includes('category') && <SearchableSelect label="Category" options={[{value:'all', label:'All'}, ...customerCategories.map(c=>({value:c.id, label:c.name}))]} value={filters.category} onChange={(v) => handleFilterChange('category', v)} />}
                        {visibleFilters.includes('subCategory') && <SearchableSelect label="Sub-Category" options={[{value:'all', label:'All'}, ...filteredSubCategories.map(c=>({value:c.id, label:c.name}))]} value={filters.subCategory} onChange={(v) => handleFilterChange('subCategory', v)} />}
                        
                        {visibleFilters.includes('group') && <SearchableSelect label="Group" options={[{value:'all', label:'All'}, ...customerGroups.map(c=>({value:c.id, label:c.name}))]} value={filters.group} onChange={(v) => handleFilterChange('group', v)} />}
                        {visibleFilters.includes('tier') && <SearchableSelect label="Customer Tier" options={[{value:'all', label:'All'}, ...customerTypes.map(t=>({value:t.id, label:t.name}))]} value={filters.tier} onChange={(v) => handleFilterChange('tier', v)} />}
                        {visibleFilters.includes('gender') && <SearchableSelect label="Gender" options={[{value:'all', label:'All'}, ...genders.map(g=>({value:g.id, label:g.name}))]} value={filters.gender} onChange={(v) => handleFilterChange('gender', v)} />}
                    </div>
                )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="text-gray-500 hover:text-brand-primary">
                                        {selectedMemberIds.size > 0 && selectedMemberIds.size === paginatedMembers.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 min-w-[200px]">
                                    Customer Details
                                </th>
                                
                                {showMutualFundsColumn && (
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">
                                        <div className="flex flex-col items-center">
                                            <span>Mutual Funds</span>
                                            <span className="font-semibold text-gray-600 dark:text-gray-300 mt-0.5 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                {getMutualFundPenetration().count} / {getMutualFundPenetration().total}
                                            </span>
                                        </div>
                                    </th>
                                )}
                                {visibleInsuranceTypes.map(cat => {
                                    const stats = getProductPenetration(cat.id);
                                    return (
                                        <th key={cat.id} className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">
                                            <div className="flex flex-col items-center">
                                                <span>{cat.name}</span>
                                                <span className="font-semibold text-gray-600 dark:text-gray-300 mt-0.5 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                    {stats.count} / {stats.total}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedMembers.map(member => {
                                const isSelected = selectedMemberIds.has(member.id);
                                const hasMF = (member.mutualFundHoldings?.length || 0) > 0;
                                
                                return (
                                    <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => toggleSelectMember(member.id)} className={`${isSelected ? 'text-brand-primary' : 'text-gray-400'}`}>
                                                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-600 dark:text-gray-300">{member.name}</div>
                                            <div className="font-semibold text-gray-600 dark:text-gray-300">{member.mobile}</div>
                                            <div className="font-semibold text-gray-600 dark:text-gray-300 mt-0.5">{member.city}, {member.state}</div>
                                        </td>
                                        
                                        {showMutualFundsColumn && (
                                            <td className="px-4 py-3 text-center">
                                                {hasMF ? (
                                                    <div className="flex justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>
                                                ) : (
                                                    <button onClick={() => onCreateLead(member, 'Mutual Funds')} className="text-xs text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded">Opportunity</button>
                                                )}
                                            </td>
                                        )}

                                        {visibleInsuranceTypes.map(cat => {
                                            const childIds = parentToChildrenMap.get(cat.id);
                                            const hasPolicy = member.policies.some(p => p.insuranceTypeId && childIds?.has(p.insuranceTypeId));
                                            
                                            return (
                                                <td key={cat.id} className="px-4 py-3 text-center">
                                                    {hasPolicy ? (
                                                        <div className="flex justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>
                                                    ) : (
                                                        <button onClick={() => onCreateLead(member, cat.name)} className="text-xs text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded">Opportunity</button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredMembers.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No customers found matching these filters.</div>
                    )}
                </div>
                
                {filteredMembers.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredMembers.length}
                    />
                )}
            </div>

            <BulkCreationModal 
                isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} selectedCount={selectedMemberIds.size}
                advisors={advisors} branches={branches} insuranceTypes={insuranceTypes} leadSources={leadSources} onSubmit={handleBulkSubmit} addToast={addToast}
            />

            {isAddFilterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setIsAddFilterModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl flex flex-col max-h-[70vh] rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Add Filters</h2>
                            <button onClick={() => setIsAddFilterModalOpen(false)} className="text-gray-500 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-end gap-2">
                            <button onClick={handleSelectAllFilters} className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">Select All</button>
                            <button onClick={handleDeselectAllFilters} className="text-xs text-gray-600 hover:text-gray-800 font-semibold px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Deselect All</button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {FILTER_OPTIONS_CONFIG.map((opt) => (
                                    <label key={opt.key} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                        <div className={`w-4 h-4 flex items-center justify-center rounded border ${tempVisibleFilters.includes(opt.key) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                                            {tempVisibleFilters.includes(opt.key) && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={tempVisibleFilters.includes(opt.key)}
                                            onChange={() => {
                                                if (tempVisibleFilters.includes(opt.key)) {
                                                    setTempVisibleFilters(prev => prev.filter(k => k !== opt.key));
                                                } else {
                                                    setTempVisibleFilters(prev => [...prev, opt.key]);
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 border-t dark:border-gray-700 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setIsAddFilterModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={applyVisibleFilters}>Apply Filters</Button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={warningState.isOpen} onClose={closeWarning}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full"><AlertTriangle className="w-6 h-6 text-yellow-600" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Duplicate Products Detected</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4"><span className="font-bold text-gray-900 dark:text-white">{warningState.ineligibleNames.length}</span> of the selected customers already have this product.</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700">
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">{warningState.ineligibleNames.map((name, i) => (<li key={i}>{name}</li>))}</ul>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">How would you like to proceed?</p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                        <Button variant="secondary" onClick={closeWarning}>Cancel</Button>
                        <Button variant="secondary" onClick={confirmCreateAll} className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30">Proceed with All ({warningState.allLeads.length})</Button>
                        <Button variant="primary" onClick={confirmSkipDuplicates}>Skip Duplicates ({warningState.eligibleLeads.length})</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CrossSellingDashboard;