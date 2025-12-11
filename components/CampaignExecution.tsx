import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Filter, Download, 
    MapPin, Megaphone, AlertCircle, ArrowRight, X, Save, Edit, CheckSquare, List
} from 'lucide-react';
import { 
    Member, Geography, BusinessVertical, RelationshipType, 
    LeadSourceMaster, CampaignMaster, InsuranceTypeMaster,
    CustomerCategory, CustomerSubCategory, CustomerGroup,
    Branch, User, Religion, MaritalStatus
} from '../types';
import { getCampaigns, getBranches, getUsers } from '../services/apiService';
import SearchableSelect from './ui/SearchableSelect'; 
import Button from './ui/Button';
import Input from './ui/Input';

interface CampaignExecutionProps {
    members: Member[];
    geographies: Geography[];
    businessVerticals: BusinessVertical[];
    relationshipTypes: RelationshipType[];
    leadSources: LeadSourceMaster[];
    insuranceTypes: InsuranceTypeMaster[];
    customerCategories: CustomerCategory[];
    customerSubCategories: CustomerSubCategory[];
    customerGroups: CustomerGroup[];
    religions: Religion[];
    maritalStatuses: MaritalStatus[];
    addToast: (message: string, type?: 'success' | 'error') => void;
}

type CustomerParamKey = 
    'category' | 'subcategory' | 'group' | 'type' | 
    'anniversary' | 'gender' | 'bloodGroup' | 'religion' | 'maritalStatus' |
    'branch' | 'advisor' | 'lead' | 'city' | 'area';

type BusinessParamKey = 
    'insuranceType' | 'insuranceSubType' | 'agency' | 'scheme' | 
    'coverage' | 'premium' | 'premiumFrequency' | 'policyTerm' |
    'amcs' | 'mfScheme' | 'sipLumpsum' | 'sipAmount' | 'lumpsumAmount';

interface FilterState {
    [key: string]: any;
}

interface CampaignExecutionData {
    id: string;
    campaignId: string;
    campaignName: string;
    executionList: Member[];
    selectedCustomerParams: CustomerParamKey[];
    selectedBusinessParams: BusinessParamKey[];
    selectedVertical: 'Insurance' | 'Mutual Funds' | '';
    filterValues: FilterState;
    createdAt: string;
    updatedAt: string;
}

interface PersistedState {
    selectedCampaignId: string;
    selectedCustomerParams: CustomerParamKey[];
    selectedBusinessParams: BusinessParamKey[];
    selectedVertical: 'Insurance' | 'Mutual Funds' | '';
    filterValues: FilterState;
    executionList: Member[];
    campaignExecutions: CampaignExecutionData[];
}

const initialFilters = {};

const formatCsvCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) return 'N/A';
    if (Array.isArray(cellData)) cellData = cellData.join('; ');
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        const escapedData = stringData.replace(/"/g, '""');
        return `"${escapedData}"`;
    }
    return stringData;
};

const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([`\uFEFF${content}`], { type: contentType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const CampaignExecution: React.FC<CampaignExecutionProps> = ({
    members = [],
    geographies = [],
    businessVerticals = [],
    insuranceTypes = [],
    customerCategories = [],
    customerSubCategories = [],
    customerGroups = [],
    religions = [],
    maritalStatuses = [],
    leadSources = [],
    addToast
}) => {
    const [campaigns, setCampaigns] = useState<CampaignMaster[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [advisors, setAdvisors] = useState<User[]>([]);
    
    useEffect(() => {
        getCampaigns().then(data => setCampaigns(data.filter(c => c.active)));
        getBranches().then(data => setBranches(data));
        getUsers().then(data => setAdvisors(data.filter(u => u.role === 'Advisor')));
    }, []);

    
    const [selectedCustomerParams, setSelectedCustomerParams] = useState<Set<CustomerParamKey>>(new Set());
    const [selectedBusinessParams, setSelectedBusinessParams] = useState<Set<BusinessParamKey>>(new Set());
    const [selectedVertical, setSelectedVertical] = useState<'Insurance' | 'Mutual Funds' | ''>(''); 

    const [activeCustomerParams, setActiveCustomerParams] = useState<Set<CustomerParamKey>>(new Set());
    const [activeBusinessParams, setActiveBusinessParams] = useState<Set<BusinessParamKey>>(new Set());
    const [activeVertical, setActiveVertical] = useState<'Insurance' | 'Mutual Funds' | ''>('');
    const [filterValues, setFilterValues] = useState<FilterState>(initialFilters);
    
    const [previewResults, setPreviewResults] = useState<Member[]>([]);
    const [executionList, setExecutionList] = useState<Member[]>([]); 
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    
    const [isSearching, setIsSearching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCampaignId, setEditingCampaignId] = useState<string>('');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingCampaignData, setViewingCampaignData] = useState<CampaignExecutionData | null>(null);
    
    const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());
    const [doneStatus, setDoneStatus] = useState<Record<string, boolean>>({});
    
    const [campaignExecutions, setCampaignExecutions] = useState<CampaignExecutionData[]>([]);
    
    const [exportSelectedFields, setExportSelectedFields] = useState<Set<string>>(new Set(['name', 'mobile', 'city']));
    const [currentEditCampaignId, setCurrentEditCampaignId] = useState<string>('');
    const [currentExportCampaignId, setCurrentExportCampaignId] = useState<string>('');
    
    const [editCustomerParams, setEditCustomerParams] = useState<Set<CustomerParamKey>>(new Set());
    const [editBusinessParams, setEditBusinessParams] = useState<Set<BusinessParamKey>>(new Set());
    const [editVertical, setEditVertical] = useState<'Insurance' | 'Mutual Funds' | ''>('');
    const [editFilterValues, setEditFilterValues] = useState<FilterState>({});
    const [editExecutionList, setEditExecutionList] = useState<Member[]>([]);

    const filteredSubCategories = useMemo(() => {
        if (!filterValues.categoryId || !customerSubCategories) return [];
        return customerSubCategories.filter(sc => sc.parentId === filterValues.categoryId);
    }, [filterValues.categoryId, customerSubCategories]);

    useEffect(() => {
        const savedState = sessionStorage.getItem('campaign_module_state_v3');
        if (savedState) {
            try {
                const parsed: PersistedState = JSON.parse(savedState);
                setSelectedCampaignId(parsed.selectedCampaignId);
                setSelectedCustomerParams(new Set(parsed.selectedCustomerParams));
                setSelectedBusinessParams(new Set(parsed.selectedBusinessParams));
                setSelectedVertical(parsed.selectedVertical);
                setActiveCustomerParams(new Set(parsed.selectedCustomerParams));
                setActiveBusinessParams(new Set(parsed.selectedBusinessParams));
                setActiveVertical(parsed.selectedVertical);
                setFilterValues(parsed.filterValues);
                setExecutionList(parsed.executionList);
                setCampaignExecutions(parsed.campaignExecutions || []);
            } catch (e) {
                console.error("Failed to restore campaign state", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave: PersistedState = {
            selectedCampaignId,
            selectedCustomerParams: Array.from(selectedCustomerParams),
            selectedBusinessParams: Array.from(selectedBusinessParams),
            selectedVertical,
            filterValues,
            executionList,
            campaignExecutions
        };
        sessionStorage.setItem('campaign_module_state_v3', JSON.stringify(stateToSave));
    }, [selectedCampaignId, selectedCustomerParams, selectedBusinessParams, selectedVertical, filterValues, executionList, campaignExecutions]);

    useEffect(() => {
        if (selectedCampaignId) {
            const latestExecution = campaignExecutions
                .filter(exec => exec.campaignId === selectedCampaignId)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            
            if (latestExecution) {
                setExecutionList(latestExecution.executionList);
                if (selectedCustomerParams.size === 0 && selectedBusinessParams.size === 0 && !selectedVertical) {
                    setSelectedCustomerParams(new Set(latestExecution.selectedCustomerParams));
                    setSelectedBusinessParams(new Set(latestExecution.selectedBusinessParams));
                    setSelectedVertical(latestExecution.selectedVertical);
                }
                if (activeCustomerParams.size === 0 && activeBusinessParams.size === 0 && !activeVertical) {
                    setActiveCustomerParams(new Set(latestExecution.selectedCustomerParams));
                    setActiveBusinessParams(new Set(latestExecution.selectedBusinessParams));
                    setActiveVertical(latestExecution.selectedVertical);
                    setFilterValues(latestExecution.filterValues);
                }
            } else {
                setExecutionList([]);
            }
        }
    }, [selectedCampaignId, campaignExecutions]);


    const toggleCustomerParam = (key: CustomerParamKey) => {
        const newSet = new Set(selectedCustomerParams);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedCustomerParams(newSet);
    };

    const toggleBusinessParam = (key: BusinessParamKey) => {
        const newSet = new Set(selectedBusinessParams);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedBusinessParams(newSet);
    };

    const handleGo = () => {
        setActiveCustomerParams(new Set(selectedCustomerParams));
        setActiveBusinessParams(new Set(selectedBusinessParams));
        setActiveVertical(selectedVertical);
    };

    const handleClearAll = () => {
        setSelectedCustomerParams(new Set());
        setSelectedBusinessParams(new Set());
        setSelectedVertical('');
        setActiveCustomerParams(new Set());
        setActiveBusinessParams(new Set());
        setActiveVertical('');
        setFilterValues({});
        addToast('All parameters and filters cleared', 'success');
    };

    const handleViewCampaign = (execution: CampaignExecutionData) => {
        setViewingCampaignData(execution);
        setIsViewModalOpen(true);
    };

    const handleEditCampaign = (execution: CampaignExecutionData) => {
        setIsEditMode(true);
        setEditingCampaignId(execution.id);
        setSelectedCampaignId(execution.campaignId);
        setSelectedCustomerParams(new Set(execution.selectedCustomerParams));
        setSelectedBusinessParams(new Set(execution.selectedBusinessParams));
        setSelectedVertical(execution.selectedVertical);
        setActiveCustomerParams(new Set(execution.selectedCustomerParams));
        setActiveBusinessParams(new Set(execution.selectedBusinessParams));
        setActiveVertical(execution.selectedVertical);
        setFilterValues(execution.filterValues);
        setExecutionList(execution.executionList);
        addToast(`Editing ${execution.campaignName}`, 'success');
    };

    const handleSaveEditChanges = () => {
        if (!editingCampaignId) return;
        
        const executionIndex = campaignExecutions.findIndex(e => e.id === editingCampaignId);
        if (executionIndex !== -1) {
            const updatedExecutions = [...campaignExecutions];
            updatedExecutions[executionIndex] = {
                ...updatedExecutions[executionIndex],
                selectedCustomerParams: Array.from(selectedCustomerParams),
                selectedBusinessParams: Array.from(selectedBusinessParams),
                selectedVertical,
                filterValues,
                executionList,
                updatedAt: new Date().toISOString()
            };
            setCampaignExecutions(updatedExecutions);
            setIsEditMode(false);
            setEditingCampaignId('');
            setExecutionList([]);
            addToast('Campaign execution updated successfully', 'success');
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditingCampaignId('');
        addToast('Edit cancelled', 'success');
    };

    const handleSearch = () => {
        if (!selectedCampaignId) {
            addToast('Please select a campaign first', 'error');
            return;
        }

        setIsSearching(true);
        
        setTimeout(() => {
            const results = members.filter(member => {
                let matches = true;

                if (activeCustomerParams.has('city') && filterValues.city) {
                    if (!member.city?.toLowerCase().includes(filterValues.city.toLowerCase())) matches = false;
                }
                if (activeCustomerParams.has('area') && filterValues.area) {
                    if (!member.area?.toLowerCase().includes(filterValues.area.toLowerCase())) matches = false;
                }
                if (activeCustomerParams.has('gender') && filterValues.gender) {
                    if (member.gender !== filterValues.gender) matches = false;
                }
                if (activeCustomerParams.has('bloodGroup') && filterValues.bloodGroup) {
                    if (member.bloodGroup !== filterValues.bloodGroup) matches = false;
                }
                if (activeCustomerParams.has('religion') && filterValues.religionId) {
                    if (member.religionId !== filterValues.religionId) matches = false;
                }
                if (activeCustomerParams.has('maritalStatus') && filterValues.maritalStatus) {
                    if (member.maritalStatus !== filterValues.maritalStatus) matches = false;
                }
                if (activeCustomerParams.has('type') && filterValues.type) {
                    if (member.memberType !== filterValues.type) matches = false;
                }
                if (activeCustomerParams.has('category') && filterValues.categoryId) {
                    if (member.customerCategoryId !== filterValues.categoryId) matches = false;
                }
                if (activeCustomerParams.has('subcategory') && filterValues.subCategoryId) {
                    if (member.customerSubCategoryId !== filterValues.subCategoryId) matches = false;
                }
                if (activeCustomerParams.has('group') && filterValues.groupId) {
                    if (member.customerGroupId !== filterValues.groupId) matches = false;
                }
                if (activeCustomerParams.has('advisor') && filterValues.advisorId) {
                    if (!member.assignedTo?.includes(filterValues.advisorId)) matches = false;
                }
                if (activeCustomerParams.has('branch') && filterValues.branchId) {
                    if (member.branch_id !== filterValues.branchId) matches = false;
                }
                if (activeCustomerParams.has('lead') && filterValues.leadSourceId) {
                    if (member.leadSource?.sourceId !== filterValues.leadSourceId) matches = false;
                }
                if (activeCustomerParams.has('anniversary') && filterValues.anniversaryMonth) {
                   if (!member.anniversary || !member.anniversary.includes(`-${filterValues.anniversaryMonth}-`)) matches = false;
                }

                if (matches && activeVertical) {
                    if (activeVertical === 'Insurance') {
                        const policies = member.policies || [];
                        if (policies.length === 0) matches = false;
                        else {
                             let policyMatch = true;
                             if (activeBusinessParams.has('insuranceType') && filterValues.insuranceTypeId) {
                                 if (!policies.some(p => p.insuranceTypeId === filterValues.insuranceTypeId)) policyMatch = false;
                             }
                             if (activeBusinessParams.has('premium') && filterValues.minPremium) {
                                if (policies.reduce((sum, p) => sum + (p.premium || 0), 0) < parseFloat(filterValues.minPremium)) policyMatch = false;
                             }
                             if (activeBusinessParams.has('coverage') && filterValues.minCoverage) {
                                if (policies.reduce((sum, p) => sum + (p.coverage || 0), 0) < parseFloat(filterValues.minCoverage)) policyMatch = false;
                             }
                             if (activeBusinessParams.has('policyTerm') && filterValues.minPolicyTerm) {
                                 if (!policies.some(p => (p.policyTerm || 0) >= parseFloat(filterValues.minPolicyTerm))) policyMatch = false;
                             }
                             if (activeBusinessParams.has('scheme') && filterValues.schemeName) {
                                 if (!policies.some(p => p.schemeName?.toLowerCase().includes(filterValues.schemeName.toLowerCase()))) policyMatch = false;
                             }

                             if (!policyMatch) matches = false;
                        }
                    } else if (activeVertical === 'Mutual Funds') {
                        const holdings = member.mutualFundHoldings || [];
                        if (holdings.length === 0) matches = false;
                        else {
                            let mfMatch = true;
                            if (activeBusinessParams.has('sipAmount') && filterValues.minSip) {
                                const totalSip = holdings.filter(h => h.investmentType === 'SIP').reduce((sum, h) => sum + (h.sipAmount || 0), 0);
                                if (totalSip < parseFloat(filterValues.minSip)) mfMatch = false;
                            }
                            if (activeBusinessParams.has('lumpsumAmount') && filterValues.minLumpsum) {
                                const totalLumpsum = holdings.filter(h => h.investmentType === 'Lumpsum').reduce((sum, h) => sum + h.totalInvestment, 0);
                                if (totalLumpsum < parseFloat(filterValues.minLumpsum)) mfMatch = false;
                            }
                            if (!mfMatch) matches = false;
                        }
                    }
                }

                return matches;
            });

            if (isEditMode) {
                setExecutionList(results);
                addToast(`Updated table with ${results.length} filtered customers`, 'success');
            } else {
                setPreviewResults(results);
                setModalSelectedIds(new Set(results.map(r => r.id)));
                setIsModalOpen(true);
            }
            setIsSearching(false);
        }, 500);
    };

    const handleSaveToTable = () => {
        if (!selectedCampaignId) {
            addToast('Please select a campaign first', 'error');
            return;
        }
        
        const selectedMembers = previewResults.filter(m => modalSelectedIds.has(m.id));
        
        if (isEditMode) {
            setExecutionList(selectedMembers);
            addToast(`Updated execution list with ${selectedMembers.length} customers.`, 'success');
        } else {
            const existingIds = new Set(executionList.map(m => m.id));
            const newMembers = selectedMembers.filter(m => !existingIds.has(m.id));
            const updatedList = [...executionList, ...newMembers];
            
            const campaignName = campaigns.find(c => c.id === selectedCampaignId)?.name || 'Unknown Campaign';
            const campaignData: CampaignExecutionData = {
                id: `${selectedCampaignId}_${Date.now()}`,
                campaignId: selectedCampaignId,
                campaignName,
                executionList: updatedList,
                selectedCustomerParams: Array.from(selectedCustomerParams),
                selectedBusinessParams: Array.from(selectedBusinessParams),
                selectedVertical,
                filterValues,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            setCampaignExecutions(prev => [...prev, campaignData]);
            setExecutionList(updatedList);
            addToast(`Added ${newMembers.length} customers to new ${campaignName} execution.`, 'success');
        }
        
        setIsModalOpen(false);
    };

    const getExportFieldOptions = () => {
        const baseFields = [
            { key: 'sno', label: 'S.No' },
            { key: 'name', label: 'Name' },
            { key: 'mobile', label: 'Mobile' },
            { key: 'city', label: 'City' },
            { key: 'vertical', label: 'Business Vertical' },
            { key: 'status', label: 'Status' },
            { key: 'isDone', label: 'Is Done' }
        ];
        
        const dynamicFields = Array.from(activeCustomerParams).map(param => ({
            key: param,
            label: param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1')
        }));
        
        return [...baseFields, ...dynamicFields];
    };

    const handleExport = () => {
        if (executionList.length === 0) {
            addToast('List is empty', 'error');
            return;
        }
        setIsExportModalOpen(true);
    };
    
    const handleConfirmExport = () => {
        const campaignId = currentExportCampaignId || selectedCampaignId;
        const campaignData = campaignExecutions[campaignId];
        if (!campaignData) {
            addToast('Campaign data not found', 'error');
            return;
        }
        
        const fieldOptions = getExportFieldOptions();
        const selectedFieldOptions = fieldOptions.filter(f => exportSelectedFields.has(f.key));
        const headers = selectedFieldOptions.map(f => f.label);
        
        const rows = campaignData.executionList.map((m, idx) => {
            return selectedFieldOptions.map(field => {
                switch (field.key) {
                    case 'sno': return idx + 1;
                    case 'name': return m.name;
                    case 'mobile': return m.mobile;
                    case 'city': return m.city;
                    case 'vertical': return campaignData.selectedVertical || 'N/A';
                    case 'status': return 'Active';
                    case 'isDone': return doneStatus[m.id] ? 'Yes' : 'No';
                    default: return getDynamicValue(m, field.key as CustomerParamKey);
                }
            });
        });
        
        const csvContent = [headers.join(','), ...rows.map(row => row.map(formatCsvCell).join(','))].join('\n');
        downloadBlob(csvContent, `${campaignData.campaignName}_Execution_List.csv`, 'text/csv;charset=utf-8;');
        setIsExportModalOpen(false);
        setCurrentExportCampaignId('');
        addToast('Export completed successfully', 'success');
    };

    const getDynamicColumns = () => {
        const cols: { header: string, key: string }[] = [];
        activeCustomerParams.forEach(param => {
            const header = param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1');
            cols.push({ header, key: param });
        });
        return cols;
    };

    const getDynamicValue = (member: Member, param: CustomerParamKey) => {
        switch (param) {
            case 'category': return customerCategories.find(c => c.id === member.customerCategoryId)?.name || '-';
            case 'subcategory': return customerSubCategories.find(c => c.id === member.customerSubCategoryId)?.name || '-';
            case 'group': return customerGroups.find(c => c.id === member.customerGroupId)?.name || '-';
            case 'type': return member.memberType;
            case 'anniversary': return member.anniversary || '-';
            case 'gender': return member.gender === 'gen-1' ? 'Male' : member.gender === 'gen-2' ? 'Female' : '-';
            case 'bloodGroup': return member.bloodGroup || '-';
            case 'religion': return religions.find(r => r.id === member.religionId)?.name || '-';
            case 'maritalStatus': return maritalStatuses.find(m => m.id === member.maritalStatus)?.name || '-';
            case 'branch': return branches.find(b => b.id === member.branch_id)?.branch_name || '-';
            case 'advisor': return advisors.find(u => member.assignedTo?.includes(u.id))?.name || '-';
            case 'lead': return member.leadSource?.detail || '-';
            case 'city': return member.city;
            case 'area': return member.area || '-';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col h-screen gap-4 p-2 overflow-y-auto">
            {}
            <div className="flex flex-col lg:flex-row gap-4 min-h-[450px]">
                
                {}
                <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col overflow-hidden">
                    <h3 className="text-md font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                        <Filter className="w-4 h-4 text-blue-600"/> Selection Parameters
                        {isEditMode && (
                            <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full dark:bg-orange-900 dark:text-orange-200">
                                Edit Mode
                            </span>
                        )}
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        {}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Info</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { k: 'category', l: 'Category' }, { k: 'subcategory', l: 'Sub-Category' },
                                    { k: 'group', l: 'Group' }, { k: 'type', l: 'Type' },
                                    { k: 'anniversary', l: 'Wedding Anniversary' }, { k: 'gender', l: 'Gender' },
                                    { k: 'bloodGroup', l: 'Blood Group' }, { k: 'religion', l: 'Religion' },
                                    { k: 'maritalStatus', l: 'Marital Status' }, { k: 'branch', l: 'Branch' },
                                    { k: 'advisor', l: 'Advisor' }, { k: 'lead', l: 'Lead' },
                                    { k: 'city', l: 'City' }, { k: 'area', l: 'Area' }
                                ].map((item) => (
                                    <label key={item.k} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 rounded transition-colors">
                                        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500" 
                                            checked={selectedCustomerParams.has(item.k as CustomerParamKey)} 
                                            onChange={() => toggleCustomerParam(item.k as CustomerParamKey)} 
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.l}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Info</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Business Vertical</label>
                                <select 
                                    className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedVertical}
                                    onChange={e => {
                                        setSelectedVertical(e.target.value as any);
                                        setSelectedBusinessParams(new Set());
                                    }}
                                >
                                    <option value="">-- Select Vertical --</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Mutual Funds">Mutual Funds</option>
                                </select>
                            </div>

                            {}
                            {selectedVertical === 'Insurance' && (
                                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                    {[
                                        { k: 'insuranceType', l: 'Insurance Type' }, { k: 'insuranceSubType', l: 'Sub-Type' },
                                        { k: 'agency', l: 'Agency' }, { k: 'scheme', l: 'Scheme' },
                                        { k: 'coverage', l: 'Coverage (Sum Assured)' }, { k: 'premium', l: 'Premium' },
                                        { k: 'premiumFrequency', l: 'Prem. Frequency' }, { k: 'policyTerm', l: 'Policy Term' }
                                    ].map(item => (
                                        <label key={item.k} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded" 
                                                checked={selectedBusinessParams.has(item.k as BusinessParamKey)} 
                                                onChange={() => toggleBusinessParam(item.k as BusinessParamKey)} 
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.l}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {selectedVertical === 'Mutual Funds' && (
                                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                    {[
                                        { k: 'amcs', l: 'AMCs' }, { k: 'mfScheme', l: 'Scheme' },
                                        { k: 'sipLumpsum', l: 'SIP / Lumpsum' }, { k: 'sipAmount', l: 'SIP Amount' },
                                        { k: 'lumpsumAmount', l: 'Lumpsum Amount' }
                                    ].map(item => (
                                        <label key={item.k} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded" 
                                                checked={selectedBusinessParams.has(item.k as BusinessParamKey)} 
                                                onChange={() => toggleBusinessParam(item.k as BusinessParamKey)} 
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.l}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <Button onClick={handleClearAll} variant="light" className="flex-1 justify-center">
                                <X size={16} className="mr-2"/> Clear All
                            </Button>
                            <Button onClick={handleGo} variant="success" className="flex-1 justify-center shadow-md">
                                GO <ArrowRight size={16} className="ml-2"/>
                            </Button>
                        </div>
                    </div>
                </div>

                {}
                <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col">
                    <h3 className="text-md font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                        <Search className="w-4 h-4 text-blue-600"/> Search Filters
                        {isEditMode && (
                            <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full dark:bg-orange-900 dark:text-orange-200">
                                Editing: {campaignExecutions.find(e => e.id === editingCampaignId)?.campaignName}
                            </span>
                        )}
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                        {activeCustomerParams.size === 0 && activeBusinessParams.size === 0 && !activeVertical ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Filter size={48} className="mb-2 opacity-20"/>
                                <p className="text-sm text-center">Select parameters on the left and click GO to configure.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {}
                                {activeCustomerParams.has('category') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.categoryId || ''} onChange={e => setFilterValues({...filterValues, categoryId: e.target.value, subCategoryId: ''})}>
                                            <option value="">-- All Categories --</option>
                                            {customerCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('subcategory') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Sub-Category</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.subCategoryId || ''} onChange={e => setFilterValues({...filterValues, subCategoryId: e.target.value})} disabled={!filterValues.categoryId}>
                                            <option value="">-- All Sub-Categories --</option>
                                            {filteredSubCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('group') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Group</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.groupId || ''} onChange={e => setFilterValues({...filterValues, groupId: e.target.value})}>
                                            <option value="">-- All Groups --</option>
                                            {customerGroups.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('type') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type (Tier)</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.type || ''} onChange={e => setFilterValues({...filterValues, type: e.target.value})}>
                                            <option value="">All</option>
                                            {['Silver', 'Gold', 'Diamond', 'Platinum'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('anniversary') && (
                                     <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Anniversary Month</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.anniversaryMonth || ''} onChange={e => setFilterValues({...filterValues, anniversaryMonth: e.target.value})}>
                                            <option value="">All</option>
                                            {Array.from({length: 12}, (_, i) => {
                                                const month = (i + 1).toString().padStart(2, '0');
                                                return <option key={month} value={month}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                                            })}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('gender') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Gender</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.gender || ''} onChange={e => setFilterValues({...filterValues, gender: e.target.value})}>
                                            <option value="">All</option>
                                            <option value="gen-1">Male</option>
                                            <option value="gen-2">Female</option>
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('bloodGroup') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Blood Group</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.bloodGroup || ''} onChange={e => setFilterValues({...filterValues, bloodGroup: e.target.value})}>
                                            <option value="">All</option>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('religion') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Religion</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.religionId || ''} onChange={e => setFilterValues({...filterValues, religionId: e.target.value})}>
                                            <option value="">All</option>
                                            {religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('maritalStatus') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Marital Status</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.maritalStatus || ''} onChange={e => setFilterValues({...filterValues, maritalStatus: e.target.value})}>
                                            <option value="">All</option>
                                            {maritalStatuses.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('branch') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Branch</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.branchId || ''} onChange={e => setFilterValues({...filterValues, branchId: e.target.value})}>
                                            <option value="">All Branches</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('advisor') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Advisor</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.advisorId || ''} onChange={e => setFilterValues({...filterValues, advisorId: e.target.value})}>
                                            <option value="">All Advisors</option>
                                            {advisors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('lead') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Lead Source</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.leadSourceId || ''} onChange={e => setFilterValues({...filterValues, leadSourceId: e.target.value})}>
                                            <option value="">All Leads</option>
                                            {leadSources?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeCustomerParams.has('city') && <Input label="City" value={filterValues.city || ''} onChange={e => setFilterValues({...filterValues, city: e.target.value})} />}
                                {activeCustomerParams.has('area') && <Input label="Area" value={filterValues.area || ''} onChange={e => setFilterValues({...filterValues, area: e.target.value})} />}

                                {}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('insuranceType') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Insurance Type</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.insuranceTypeId || ''} onChange={e => setFilterValues({...filterValues, insuranceTypeId: e.target.value})}>
                                            <option value="">All Types</option>
                                            {insuranceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('insuranceSubType') && (
                                    <Input label="Sub Type (Name)" value={filterValues.insuranceSubType || ''} onChange={e => setFilterValues({...filterValues, insuranceSubType: e.target.value})} />
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('agency') && (
                                    <Input label="Agency" value={filterValues.agency || ''} onChange={e => setFilterValues({...filterValues, agency: e.target.value})} />
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('scheme') && (
                                    <Input label="Scheme Name" value={filterValues.schemeName || ''} onChange={e => setFilterValues({...filterValues, schemeName: e.target.value})} />
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('coverage') && (
                                    <Input label="Min. Sum Assured" type="number" value={filterValues.minCoverage || ''} onChange={e => setFilterValues({...filterValues, minCoverage: e.target.value})} />
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('premium') && (
                                    <Input label="Min. Premium" type="number" value={filterValues.minPremium || ''} onChange={e => setFilterValues({...filterValues, minPremium: e.target.value})} />
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('premiumFrequency') && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Premium Freq.</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.premiumFreq || ''} onChange={e => setFilterValues({...filterValues, premiumFreq: e.target.value})}>
                                            <option value="">All</option>
                                            <option value="Yearly">Yearly</option>
                                            <option value="Half-Yearly">Half-Yearly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>
                                )}
                                {activeVertical === 'Insurance' && activeBusinessParams.has('policyTerm') && (
                                    <Input label="Min. Policy Term (Yrs)" type="number" value={filterValues.minPolicyTerm || ''} onChange={e => setFilterValues({...filterValues, minPolicyTerm: e.target.value})} />
                                )}

                                {}
                                {activeVertical === 'Mutual Funds' && activeBusinessParams.has('amcs') && (
                                    <Input label="AMC Name" value={filterValues.amcName || ''} onChange={e => setFilterValues({...filterValues, amcName: e.target.value})} />
                                )}
                                {activeVertical === 'Mutual Funds' && activeBusinessParams.has('mfScheme') && (
                                    <Input label="Scheme Name" value={filterValues.mfSchemeName || ''} onChange={e => setFilterValues({...filterValues, mfSchemeName: e.target.value})} />
                                )}
                                {activeVertical === 'Mutual Funds' && activeBusinessParams.has('sipLumpsum') && (
                                     <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type</label>
                                        <select className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={filterValues.investType || ''} onChange={e => setFilterValues({...filterValues, investType: e.target.value})}>
                                            <option value="">All</option>
                                            <option value="SIP">SIP</option>
                                            <option value="Lumpsum">Lumpsum</option>
                                        </select>
                                    </div>
                                )}
                                {activeVertical === 'Mutual Funds' && activeBusinessParams.has('sipAmount') && (
                                    <Input label="Min. SIP Amount" type="number" value={filterValues.minSip || ''} onChange={e => setFilterValues({...filterValues, minSip: e.target.value})} />
                                )}
                                {activeVertical === 'Mutual Funds' && activeBusinessParams.has('lumpsumAmount') && (
                                    <Input label="Min. Lumpsum" type="number" value={filterValues.minLumpsum || ''} onChange={e => setFilterValues({...filterValues, minLumpsum: e.target.value})} />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        {}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                             <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                <Megaphone size={14} className="text-blue-600"/> Select Campaign
                            </label>
                            <select 
                                className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedCampaignId}
                                onChange={e => setSelectedCampaignId(e.target.value)}
                            >
                                <option value="">-- Choose a Campaign --</option>
                                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Button onClick={handleSearch} variant="primary" className="w-full justify-center shadow-lg" disabled={isSearching || !selectedCampaignId}>
                                {isSearching ? 'Searching...' : <><Search size={18} /> Search Customers</>}
                            </Button>
                            {isEditMode && (
                                <div className="flex gap-2">
                                    <Button onClick={handleCancelEdit} variant="secondary" className="flex-1 justify-center">
                                        <X size={16} className="mr-2"/> Cancel Edit
                                    </Button>
                                    <Button onClick={handleSaveEditChanges} variant="success" className="flex-1 justify-center shadow-lg">
                                        <Save size={18} className="mr-2"/> Save Edit
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {}
            {isEditMode && executionList.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-orange-50 dark:bg-orange-900/20">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Edit className="w-5 h-5 text-orange-600"/> Editing Campaign: {campaignExecutions.find(e => e.id === editingCampaignId)?.campaignName}
                            </h3>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full dark:bg-orange-900 dark:text-orange-200">
                                {executionList.length} Customers
                            </span>
                        </div>
                    </div>
                    <div className="max-h-80 overflow-auto">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-3 w-16 whitespace-nowrap">S.No</th>
                                    <th className="p-3 whitespace-nowrap">Name</th>
                                    <th className="p-3 whitespace-nowrap">Mobile</th>
                                    <th className="p-3 whitespace-nowrap">City</th>
                                    <th className="p-3 whitespace-nowrap">Business Vertical</th>
                                    {Array.from(activeCustomerParams).map(param => (
                                        <th key={param} className="p-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 whitespace-nowrap">
                                            {param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </th>
                                    ))}
                                    <th className="p-3 whitespace-nowrap">Status</th>
                                    <th className="p-3 text-center whitespace-nowrap">Is Done</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {executionList.map((member, idx) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 text-sm text-gray-500 whitespace-nowrap">{idx + 1}</td>
                                        <td className="p-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{member.name}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{member.mobile}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{member.city}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{activeVertical || '-'}</td>
                                        {Array.from(activeCustomerParams).map(param => (
                                            <td key={param} className="p-3 text-sm text-gray-800 dark:text-gray-200 bg-blue-50/20 dark:bg-blue-900/5 whitespace-nowrap">
                                                {getDynamicValue(member, param)}
                                            </td>
                                        ))}
                                        <td className="p-3 text-sm whitespace-nowrap">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                                        </td>
                                        <td className="p-3 text-center whitespace-nowrap">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                checked={doneStatus[member.id] || false}
                                                onChange={() => {
                                                    setDoneStatus(prev => ({
                                                        ...prev,
                                                        [member.id]: !prev[member.id]
                                                    }));
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[300px] overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Megaphone className="w-5 h-5"/> Campaign Execution Lists
                        </h3>
                        {campaignExecutions.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                                {campaignExecutions.length} Executions
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 text-xs uppercase font-semibold text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="p-3 w-16">S.No</th>
                                <th className="p-3">Campaign Name</th>
                                <th className="p-3">Total Records</th>
                                <th className="p-3">Created Date</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {campaignExecutions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-gray-500">
                                        No campaign executions yet. Select a campaign and perform a search to get started.
                                    </td>
                                </tr>
                            ) : (
                                campaignExecutions.map((execution, idx) => (
                                    <tr key={execution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                                        <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                                            {execution.campaignName}
                                            <span className="ml-2 text-xs text-gray-500">({new Date(execution.createdAt).toLocaleTimeString()})</span>
                                        </td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{execution.executionList.length}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{new Date(execution.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button 
                                                    onClick={() => handleViewCampaign(execution)}
                                                    variant="light" 
                                                    size="small"
                                                    className="text-purple-600 hover:text-purple-800"
                                                >
                                                    <List size={14} /> View
                                                </Button>
                                                <Button 
                                                    onClick={() => handleEditCampaign(execution)}
                                                    variant="secondary" 
                                                    size="small"
                                                >
                                                    <Edit size={14} /> Edit
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        setCurrentExportCampaignId(execution.id);
                                                        setIsExportModalOpen(true);
                                                    }}
                                                    variant="light" 
                                                    size="small"
                                                >
                                                    <Download size={14} /> Export
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh]">
                        {}
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <List className="text-blue-600" /> Search Results Preview
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Review and select customers to add to the campaign execution list.
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        {}
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase shadow-sm">
                                    <tr>
                                        <th className="p-3 w-12 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded"
                                                checked={previewResults.length > 0 && modalSelectedIds.size === previewResults.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setModalSelectedIds(new Set(previewResults.map(r => r.id)));
                                                    else setModalSelectedIds(new Set());
                                                }}
                                            />
                                        </th>
                                        <th className="p-3 w-16">S.No</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">City</th>
                                        <th className="p-3">Mobile</th>
                                        <th className="p-3">Business Vertical</th>
                                        {getDynamicColumns().map(col => (
                                            <th key={col.key} className="p-3 whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200">
                                                {col.header}
                                            </th>
                                        ))}
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-center">Is Done</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {previewResults.length === 0 ? (
                                        <tr><td colSpan={10} className="p-10 text-center text-gray-500">No results found.</td></tr>
                                    ) : (
                                        previewResults.map((member, idx) => (
                                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                        checked={modalSelectedIds.has(member.id)}
                                                        onChange={() => {
                                                            const newSet = new Set(modalSelectedIds);
                                                            if (newSet.has(member.id)) newSet.delete(member.id);
                                                            else newSet.add(member.id);
                                                            setModalSelectedIds(newSet);
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                                                <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">{member.name}</td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{member.city}</td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{member.mobile}</td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{activeVertical || '-'}</td>
                                                
                                                {}
                                                {activeCustomerParams.size > 0 && Array.from(activeCustomerParams).map(param => (
                                                    <td key={param} className="p-3 text-sm text-gray-800 dark:text-gray-200 bg-blue-50/20 dark:bg-blue-900/5">
                                                        {getDynamicValue(member, param)}
                                                    </td>
                                                ))}

                                                <td className="p-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                                                <td className="p-3 text-center">
                                                    <CheckSquare size={16} className="text-gray-300 mx-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {modalSelectedIds.size} customers selected
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button variant="success" onClick={handleSaveToTable}>
                                    <Save size={18} /> Save to Campaign
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {}
            {isViewModalOpen && viewingCampaignData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        {}
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <List className="text-purple-600" /> {viewingCampaignData.campaignName}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {viewingCampaignData.executionList.length} customers • Created: {new Date(viewingCampaignData.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        {}
                        <div className="flex-1 overflow-hidden p-5">
                            <div className="h-full overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">S.No</th>
                                                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Name</th>
                                                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Mobile</th>
                                                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">City</th>
                                                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Business Vertical</th>
                                                {viewingCampaignData.selectedCustomerParams.map(param => (
                                                    <th key={param} className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap">
                                                        {param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1')}
                                                    </th>
                                                ))}
                                                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Status</th>
                                                <th className="p-3 text-center font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Is Done</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {viewingCampaignData.executionList.map((member, idx) => (
                                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="p-3 text-gray-500 whitespace-nowrap">{idx + 1}</td>
                                                    <td className="p-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{member.name}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{member.mobile}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{member.city}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{viewingCampaignData.selectedVertical || '-'}</td>
                                                    {viewingCampaignData.selectedCustomerParams.map(param => (
                                                        <td key={param} className="p-3 text-gray-800 dark:text-gray-200 bg-blue-50/20 dark:bg-blue-900/5 whitespace-nowrap">
                                                            {getDynamicValue(member, param)}
                                                        </td>
                                                    ))}
                                                    <td className="p-3 whitespace-nowrap">
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                                                    </td>
                                                    <td className="p-3 text-center whitespace-nowrap">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            checked={doneStatus[member.id] || false}
                                                            onChange={() => {
                                                                setDoneStatus(prev => ({
                                                                    ...prev,
                                                                    [member.id]: !prev[member.id]
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Total: {viewingCampaignData.executionList.length} customers
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                                <Button 
                                    variant="success" 
                                    onClick={() => {
                                        setCurrentExportCampaignId(viewingCampaignData.id);
                                        setIsViewModalOpen(false);
                                        setIsExportModalOpen(true);
                                    }}
                                >
                                    <Download size={18} /> Export This List
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col">
                        {}
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Download className="text-blue-600" /> Select Export Fields
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Choose which fields to include in the export file.
                                </p>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        {}
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {getExportFieldOptions().map(field => (
                                    <label key={field.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                                            checked={exportSelectedFields.has(field.key)}
                                            onChange={() => {
                                                const newSet = new Set(exportSelectedFields);
                                                if (newSet.has(field.key)) newSet.delete(field.key);
                                                else newSet.add(field.key);
                                                setExportSelectedFields(newSet);
                                            }}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {exportSelectedFields.size} fields selected
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => {
                                    setIsExportModalOpen(false);
                                    setCurrentExportCampaignId('');
                                }}>Cancel</Button>
                                <Button variant="success" onClick={handleConfirmExport} disabled={exportSelectedFields.size === 0}>
                                    <Download size={18} /> Export CSV
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignExecution;