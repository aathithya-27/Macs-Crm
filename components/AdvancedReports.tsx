import React, { useState, useMemo } from 'react';
import { 
    Member, User, Branch, LeadSourceMaster, CustomerCategory, 
    CustomerSubCategory, CustomerGroup, Religion, Gender, CustomerTier,
    BusinessVertical 
} from '../types.ts';
import { 
    Download, BarChart3, PieChart as PieChartIcon, 
    Filter, X, Search, FileX, AlertCircle, Plus, Check
} from 'lucide-react';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import MultiSelectDropdown from './ui/MultiSelectDropdown.tsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, isValid } from 'date-fns';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

// --- Interfaces ---

interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDFWithAutoTable;
}

interface AdvancedReportsProps {
    members: Member[];
    users: User[];
    branches: Branch[];
    leadSources: LeadSourceMaster[];
    customerCategories: CustomerCategory[];
    customerSubCategories: CustomerSubCategory[];
    customerGroups: CustomerGroup[];
    religions: Religion[];
    genders: Gender[];
    customerTiers: CustomerTier[];
    businessVerticals: BusinessVertical[];
}

type GraphType = 'pie' | 'bar';

interface DrillDownData {
    title: string;
    data: Member[];
}

interface ReportSnapshot {
    dateFrom: string;
    dateTo: string;
    states: string[];
    districts: string[];
    cities: string[];
    areas: string[];
    branches: string[];
    advisors: string[];
    types: string[];
    statuses: string[];
    categories: string[];
    subCategories: string[];
    groups: string[];
    genders: string[];
    religions: string[];
    bloodGroups: string[];
    parentSources: string[];
    childSources: string[];
    businessVerticals: string[];
    anniversaryFrom: string;
    anniversaryTo: string;
    visibleFilters: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#ff6b6b', '#4ecdc4'];

const FILTER_OPTIONS = [
    { key: 'businessVertical', label: 'Business Vertical' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'city', label: 'City' },
    { key: 'area', label: 'Area' },
    { key: 'branch', label: 'Branch' },
    { key: 'advisor', label: 'Advisor' },
    { key: 'tier', label: 'Tier Type' },
    { key: 'status', label: 'Status' },
    { key: 'category', label: 'Category & Sub-Category' },
    { key: 'group', label: 'Group' },
    { key: 'gender', label: 'Gender' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'religion', label: 'Religion' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'anniversary', label: 'Anniversary' },
];

const AdvancedReports: React.FC<AdvancedReportsProps> = ({
    members, users, branches, leadSources, customerCategories, 
    customerSubCategories, customerGroups, religions, genders, customerTiers, businessVerticals
}) => {
    // --- 1. LIVE INPUT STATES ---
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [visibleFilters, setVisibleFilters] = useState<string[]>([]);
    const [tempSelectedFilters, setTempSelectedFilters] = useState<string[]>([]);

    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]); 
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); 
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
    const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
    const [selectedBloodGroups, setSelectedBloodGroups] = useState<string[]>([]);
    const [selectedParentSources, setSelectedParentSources] = useState<string[]>([]);
    const [selectedChildSources, setSelectedChildSources] = useState<string[]>([]);
    const [selectedBusinessVerticals, setSelectedBusinessVerticals] = useState<string[]>([]);
    const [anniversaryFrom, setAnniversaryFrom] = useState('');
    const [anniversaryTo, setAnniversaryTo] = useState('');

    // --- 2. REPORT SNAPSHOT STATE ---
    const [reportSnapshot, setReportSnapshot] = useState<ReportSnapshot | null>(null);
    const [activeGraphs, setActiveGraphs] = useState<string[]>([]); 
    const [graphTypes, setGraphTypes] = useState<Record<string, GraphType>>({}); 
    const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);

    // --- Options Generation ---
    const uniqueStates = useMemo(() => Array.from(new Set(members.map(m => m.state).filter(Boolean))), [members]);
    const uniqueDistricts = useMemo(() => Array.from(new Set(members.map(m => m.district).filter(Boolean))), [members]);
    const uniqueCities = useMemo(() => Array.from(new Set(members.map(m => m.city).filter(Boolean))), [members]);
    const uniqueAreas = useMemo(() => Array.from(new Set(members.map(m => m.area).filter(Boolean))), [members]);
    const uniqueBloodGroups = useMemo(() => Array.from(new Set(members.map(m => m.bloodGroup).filter(Boolean))), [members]);

    const stateOptions = useMemo(() => uniqueStates.map(s => ({ value: s, label: s })), [uniqueStates]);
    const districtOptions = useMemo(() => uniqueDistricts.map(d => ({ value: d, label: d })), [uniqueDistricts]);
    const cityOptions = useMemo(() => uniqueCities.map(c => ({ value: c, label: c })), [uniqueCities]);
    const areaOptions = useMemo(() => uniqueAreas.map(a => ({ value: a, label: a })), [uniqueAreas]);

    const branchOptions = useMemo(() => branches.map(b => ({ value: b.id, label: b.branch_name })), [branches]);
    const advisorOptions = useMemo(() => users.filter(u => u.role?.toLowerCase().includes('advisor')).map(u => ({ value: u.id, label: u.name })), [users]);
    const tierOptions = useMemo(() => customerTiers.map(t => ({value: t.id, label: t.name || 'Unknown'})), [customerTiers]);
    const statusOptions = [{value: 'Active', label: 'Active'}, {value: 'Inactive', label: 'Inactive'}];
    const categoryOptions = useMemo(() => customerCategories.map(c => ({ value: c.id, label: c.name })), [customerCategories]);
    
    const subCategoryOptions = useMemo(() => {
        return customerSubCategories
            .filter(sc => selectedCategories.length === 0 || selectedCategories.includes(sc.parentId))
            .map(sc => ({ value: sc.id, label: sc.name }));
    }, [customerSubCategories, selectedCategories]);
    
    const groupOptions = useMemo(() => customerGroups.map(g => ({value: g.id, label: g.name})), [customerGroups]);
    const genderOptions = useMemo(() => genders.map(g => ({value: g.id, label: g.name})), [genders]);
    const religionOptions = useMemo(() => religions.map(r => ({value: r.id, label: r.name})), [religions]);
    const bloodGroupOptions = useMemo(() => uniqueBloodGroups.map(b => ({value: b, label: b})), [uniqueBloodGroups]);
    const businessVerticalOptions = useMemo(() => businessVerticals.map(bv => ({ value: bv.id, label: bv.name })), [businessVerticals]);

    const parentSourceOptions = useMemo(() => leadSources.filter(ls => !ls.parentId).map(ls => ({ value: ls.id, label: ls.name })), [leadSources]);
    const childSourceOptions = useMemo(() => {
        return leadSources
            .filter(ls => selectedParentSources.length > 0 && selectedParentSources.includes(ls.parentId || ''))
            .map(ls => ({ value: ls.id, label: ls.name }));
    }, [leadSources, selectedParentSources]);

    const graphLabelMap: Record<string, string> = {
        branch_id: 'Branch',
        assignedTo: 'Advisor',
        city: 'City',
        state: 'State',
        district: 'District',
        area: 'Area',
        memberType: 'Tier Type',
        gender: 'Gender',
        customerCategoryId: 'Category',
        customerSubCategoryId: 'Sub-Category',
        customerGroupId: 'Group',
        leadSource: 'Lead Source',
        active: 'Status',
        religionId: 'Religion',
        bloodGroup: 'Blood Group',
        businessVertical: 'Business Vertical'
    };

    // --- Helper: Determine Verticals for a Member ---
    const getMemberVerticals = (m: Member, insuranceId: string | undefined, mfId: string | undefined) => {
        const verticals = new Set<string>();
        if (m.policies && m.policies.length > 0 && insuranceId) verticals.add(insuranceId);
        if (m.mutualFundHoldings && m.mutualFundHoldings.length > 0 && mfId) verticals.add(mfId);
        return verticals;
    };

    // --- Filter Logic ---
    const filteredMembers = useMemo(() => {
        if (!reportSnapshot) return []; 
        const snap = reportSnapshot;

        // IDs for Logic
        const insuranceVerticalId = businessVerticals.find(bv => bv.name === 'Insurance')?.id;
        const mfVerticalId = businessVerticals.find(bv => bv.name === 'Mutual Funds')?.id;

        return members.filter(m => {
            const created = m.createdAt ? parseISO(m.createdAt) : null;
            if (!created || !isValid(created)) return false;
            if (created < parseISO(snap.dateFrom)) return false;
            if (created > parseISO(snap.dateTo)) return false;

            if (snap.visibleFilters.includes('state') && snap.states.length > 0 && !snap.states.includes(m.state)) return false;
            if (snap.visibleFilters.includes('district') && snap.districts.length > 0 && !snap.districts.includes(m.district || '')) return false;
            if (snap.visibleFilters.includes('city') && snap.cities.length > 0 && !snap.cities.includes(m.city)) return false;
            if (snap.visibleFilters.includes('area') && snap.areas.length > 0 && !snap.areas.includes(m.area || '')) return false;

            if (snap.visibleFilters.includes('branch') && snap.branches.length > 0 && !snap.branches.includes(m.branch_id || '')) return false;
            if (snap.visibleFilters.includes('advisor') && snap.advisors.length > 0) {
                const hasAdvisor = m.assignedTo.some(id => snap.advisors.includes(id));
                if (!hasAdvisor) return false;
            }

            if (snap.visibleFilters.includes('tier') && snap.types.length > 0 && !snap.types.includes(m.tierId || '')) return false;
            if (snap.visibleFilters.includes('status') && snap.statuses.length > 0) {
                const status = m.active ? 'Active' : 'Inactive';
                if (!snap.statuses.includes(status)) return false;
            }
            if (snap.visibleFilters.includes('category') && snap.categories.length > 0 && !snap.categories.includes(m.customerCategoryId || '')) return false;
            if (snap.visibleFilters.includes('category') && snap.subCategories.length > 0 && !snap.subCategories.includes(m.customerSubCategoryId || '')) return false;
            
            if (snap.visibleFilters.includes('group') && snap.groups.length > 0 && !snap.groups.includes(m.customerGroupId || '')) return false;
            if (snap.visibleFilters.includes('gender') && snap.genders.length > 0 && !snap.genders.includes(m.gender || '')) return false;
            if (snap.visibleFilters.includes('religion') && snap.religions.length > 0 && !snap.religions.includes(m.religionId || '')) return false;
            if (snap.visibleFilters.includes('bloodGroup') && snap.bloodGroups.length > 0 && !snap.bloodGroups.includes(m.bloodGroup || '')) return false;

            if (snap.visibleFilters.includes('leadSource') && snap.parentSources.length > 0) {
                const sourceId = m.leadSource?.sourceId;
                if (!sourceId) return false;
                if (snap.childSources.length > 0) {
                     if (!snap.childSources.includes(sourceId)) return false;
                } else {
                    const isDirectParent = snap.parentSources.includes(sourceId);
                    const isChildOfSelectedParent = leadSources.some(ls => ls.id === sourceId && ls.parentId && snap.parentSources.includes(ls.parentId));
                    if (!isDirectParent && !isChildOfSelectedParent) return false;
                }
            }

            if (snap.visibleFilters.includes('businessVertical') && snap.businessVerticals.length > 0) {
                const memberVerticals = getMemberVerticals(m, insuranceVerticalId, mfVerticalId);
                const hasMatch = snap.businessVerticals.some(id => memberVerticals.has(id));
                if (!hasMatch) return false;
            }

            if (snap.visibleFilters.includes('anniversary') && (snap.anniversaryFrom || snap.anniversaryTo)) {
                if (!m.anniversary) return false;
                const anniv = parseISO(m.anniversary);
                if (snap.anniversaryFrom && anniv < parseISO(snap.anniversaryFrom)) return false;
                if (snap.anniversaryTo && anniv > parseISO(snap.anniversaryTo)) return false;
            }

            return true;
        });
    }, [reportSnapshot, members, leadSources, businessVerticals]);

    // --- Effective Columns ---
    const effectiveColumns = useMemo(() => {
        if (!reportSnapshot) return [];
        const filters = reportSnapshot.visibleFilters;
        const filterColumns: string[] = [];
        if (filters.includes('state')) filterColumns.push('state');
        if (filters.includes('district')) filterColumns.push('district');
        if (filters.includes('branch')) filterColumns.push('branch');
        if (filters.includes('advisor')) filterColumns.push('advisor');
        if (filters.includes('tier')) filterColumns.push('tier');
        if (filters.includes('status')) filterColumns.push('status');
        if (filters.includes('category')) { filterColumns.push('category'); filterColumns.push('subCategory'); }
        if (filters.includes('group')) filterColumns.push('group');
        if (filters.includes('gender')) filterColumns.push('gender');
        if (filters.includes('religion')) filterColumns.push('religion');
        if (filters.includes('bloodGroup')) filterColumns.push('bloodGroup');
        if (filters.includes('anniversary')) filterColumns.push('anniversary');
        if (filters.includes('leadSource')) filterColumns.push('leadSource');
        if (filters.includes('businessVertical')) filterColumns.push('businessVertical');
        return filterColumns;
    }, [reportSnapshot]);

    // --- Graph Data ---
    const generateGraphData = (parameter: string) => {
        const counts: Record<string, number> = {};
        const insuranceVerticalId = businessVerticals.find(bv => bv.name === 'Insurance')?.id;
        const mfVerticalId = businessVerticals.find(bv => bv.name === 'Mutual Funds')?.id;
        
        filteredMembers.forEach(m => {
            let key = 'Unknown';
            switch(parameter) {
                case 'branch_id': key = branches.find(b => b.id === m.branch_id)?.branch_name || 'Unassigned'; break;
                case 'assignedTo': 
                    const advId = m.assignedTo[0]; 
                    key = users.find(u => u.id === advId)?.name || 'Unassigned';
                    break;
                case 'customerCategoryId': key = customerCategories.find(c => c.id === m.customerCategoryId)?.name || 'Uncategorized'; break;
                case 'customerSubCategoryId': key = customerSubCategories.find(c => c.id === m.customerSubCategoryId)?.name || 'Unknown'; break;
                case 'customerGroupId': key = customerGroups.find(c => c.id === m.customerGroupId)?.name || 'Unknown'; break;
                case 'gender': key = genders.find(g => g.id === m.gender)?.name || m.gender || 'Not Specified'; break;
                case 'religionId': key = religions.find(r => r.id === m.religionId)?.name || 'Unknown'; break;
                case 'memberType': key = m.memberType || 'No Tier'; break;
                case 'active': key = m.active ? 'Active' : 'Inactive'; break;
                case 'leadSource': 
                    const lsId = m.leadSource?.sourceId;
                    key = leadSources.find(ls => ls.id === lsId)?.name || 'Unknown';
                    break;
                case 'businessVertical':
                    const mVerticals = getMemberVerticals(m, insuranceVerticalId, mfVerticalId);
                    
                    // MASKING LOGIC:
                    // Only count verticals that are actually selected in the filter
                    const activeFilter = reportSnapshot?.businessVerticals || [];
                    const hasFilter = activeFilter.length > 0;

                    const hasIns = insuranceVerticalId && mVerticals.has(insuranceVerticalId) && (!hasFilter || activeFilter.includes(insuranceVerticalId));
                    const hasMF = mfVerticalId && mVerticals.has(mfVerticalId) && (!hasFilter || activeFilter.includes(mfVerticalId));
                    
                    if (hasIns && hasMF) key = 'Both';
                    else if (hasIns) key = 'Insurance Only';
                    else if (hasMF) key = 'Mutual Funds Only';
                    else key = 'None';
                    break;
                default: key = (m as any)[parameter] || 'Unknown';
            }
            counts[key] = (counts[key] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const handleSearch = () => {
        setErrorMsg(null);
        if (!dateFrom || !dateTo) {
            setErrorMsg("Please select both 'From Date' and 'End Date' to generate the report.");
            return;
        }

        const snapshot: ReportSnapshot = {
            dateFrom, dateTo,
            states: selectedStates, districts: selectedDistricts, cities: selectedCities, areas: selectedAreas,
            branches: selectedBranches, advisors: selectedAdvisors,
            types: selectedTypes, statuses: selectedStatuses,
            categories: selectedCategories, subCategories: selectedSubCategories,
            groups: selectedGroups, genders: selectedGenders,
            religions: selectedReligions, bloodGroups: selectedBloodGroups,
            parentSources: selectedParentSources, childSources: selectedChildSources,
            businessVerticals: selectedBusinessVerticals,
            anniversaryFrom, anniversaryTo,
            visibleFilters: [...visibleFilters] 
        };

        setReportSnapshot(snapshot);

        const graphsToShow: string[] = [];
        if (visibleFilters.includes('branch') && selectedBranches.length > 0) graphsToShow.push('branch_id');
        if (visibleFilters.includes('advisor') && selectedAdvisors.length > 0) graphsToShow.push('assignedTo');
        if (visibleFilters.includes('state') && selectedStates.length > 0) graphsToShow.push('state');
        if (visibleFilters.includes('district') && selectedDistricts.length > 0) graphsToShow.push('district');
        if (visibleFilters.includes('city') && selectedCities.length > 0) graphsToShow.push('city');
        if (visibleFilters.includes('area') && selectedAreas.length > 0) graphsToShow.push('area');
        if (visibleFilters.includes('tier') && selectedTypes.length > 0) graphsToShow.push('memberType');
        if (visibleFilters.includes('status') && selectedStatuses.length > 0) graphsToShow.push('active');
        if (visibleFilters.includes('category')) {
            if (selectedCategories.length > 0) graphsToShow.push('customerCategoryId');
            if (selectedSubCategories.length > 0) graphsToShow.push('customerSubCategoryId');
        }
        if (visibleFilters.includes('group') && selectedGroups.length > 0) graphsToShow.push('customerGroupId');
        if (visibleFilters.includes('gender') && selectedGenders.length > 0) graphsToShow.push('gender');
        if (visibleFilters.includes('religion') && selectedReligions.length > 0) graphsToShow.push('religionId');
        if (visibleFilters.includes('bloodGroup') && selectedBloodGroups.length > 0) graphsToShow.push('bloodGroup');
        if (visibleFilters.includes('leadSource') && selectedParentSources.length > 0) graphsToShow.push('leadSource');
        if (visibleFilters.includes('businessVertical') && selectedBusinessVerticals.length > 0) graphsToShow.push('businessVertical');

        setActiveGraphs(graphsToShow);
    };

    const handleReset = () => {
        setReportSnapshot(null); 
        setErrorMsg(null);
        
        setDateFrom(''); setDateTo('');
        setSelectedStates([]); setSelectedDistricts([]); setSelectedCities([]); setSelectedAreas([]);
        setSelectedBranches([]); setSelectedAdvisors([]);
        setSelectedTypes([]); setSelectedStatuses([]); setSelectedCategories([]); setSelectedSubCategories([]);
        setSelectedGroups([]); setSelectedGenders([]); setSelectedReligions([]); setSelectedBloodGroups([]);
        setSelectedParentSources([]); setSelectedChildSources([]);
        setSelectedBusinessVerticals([]);
        setAnniversaryFrom(''); setAnniversaryTo('');
        
        setActiveGraphs([]);
    };

    const handleOpenFilterModal = () => {
        setTempSelectedFilters([...visibleFilters]);
        setIsFilterModalOpen(true);
    };

    const handleApplyFilters = () => {
        setVisibleFilters(tempSelectedFilters);
        setIsFilterModalOpen(false);
    };

    const handleSelectAllFilters = () => setTempSelectedFilters(FILTER_OPTIONS.map(o => o.key));
    const handleDeselectAllFilters = () => setTempSelectedFilters([]);

    const handleGraphClick = (data: any, parameter: string) => {
        if (!data) return;
        const clickedName = data.name; 
        
        const insuranceVerticalId = businessVerticals.find(bv => bv.name === 'Insurance')?.id;
        const mfVerticalId = businessVerticals.find(bv => bv.name === 'Mutual Funds')?.id;

        const drillDownMembers = filteredMembers.filter(m => {
            let key = 'Unknown';
            switch(parameter) {
                case 'branch_id': key = branches.find(b => b.id === m.branch_id)?.branch_name || 'Unassigned'; break;
                case 'assignedTo': key = users.find(u => u.id === m.assignedTo[0])?.name || 'Unassigned'; break;
                case 'customerCategoryId': key = customerCategories.find(c => c.id === m.customerCategoryId)?.name || 'Uncategorized'; break;
                case 'customerSubCategoryId': key = customerSubCategories.find(c => c.id === m.customerSubCategoryId)?.name || 'Unknown'; break;
                case 'customerGroupId': key = customerGroups.find(c => c.id === m.customerGroupId)?.name || 'Unknown'; break;
                case 'gender': key = genders.find(g => g.id === m.gender)?.name || m.gender || 'Not Specified'; break;
                case 'religionId': key = religions.find(r => r.id === m.religionId)?.name || 'Unknown'; break;
                case 'memberType': key = m.memberType || 'No Tier'; break;
                case 'active': key = m.active ? 'Active' : 'Inactive'; break;
                case 'leadSource': key = leadSources.find(ls => ls.id === m.leadSource?.sourceId)?.name || 'Unknown'; break;
                case 'businessVertical':
                    const mVerticals = getMemberVerticals(m, insuranceVerticalId, mfVerticalId);
                    // Apply the same masking logic for drill-down filtering
                    const activeFilter = reportSnapshot?.businessVerticals || [];
                    const hasFilter = activeFilter.length > 0;

                    const hasIns = insuranceVerticalId && mVerticals.has(insuranceVerticalId) && (!hasFilter || activeFilter.includes(insuranceVerticalId));
                    const hasMF = mfVerticalId && mVerticals.has(mfVerticalId) && (!hasFilter || activeFilter.includes(mfVerticalId));
                    
                    if (hasIns && hasMF) key = 'Both';
                    else if (hasIns) key = 'Insurance Only';
                    else if (hasMF) key = 'Mutual Funds Only';
                    else key = 'None';
                    break;
                default: key = (m as any)[parameter] || 'Unknown';
            }
            return key === clickedName;
        });

        setDrillDownData({
            title: `${graphLabelMap[parameter] || parameter}: ${clickedName}`,
            data: drillDownMembers
        });
    };

    // --- Export Logic ---
    const getExportHeaders = () => {
        const fixed = ['S.No', 'Customer ID', 'Created Date', 'Name', 'Mobile', 'Email', 'City', 'Area'];
        const dynamic = effectiveColumns.map(col => 
            col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')
        );
        return [...fixed, ...dynamic];
    };

    const getExportRow = (m: Member, index: number) => {
        const createdDate = m.createdAt ? format(parseISO(m.createdAt), 'dd-MM-yyyy') : 'N/A';
        const fixed = [
            index + 1, m.memberId, createdDate, m.name, m.mobile, m.email || 'N/A', m.city, m.area || 'N/A'
        ];
        
        const insuranceVerticalId = businessVerticals.find(bv => bv.name === 'Insurance')?.id;
        const mfVerticalId = businessVerticals.find(bv => bv.name === 'Mutual Funds')?.id;

        const dynamic = effectiveColumns.map(col => {
            if (col === 'branch') return branches.find(b => b.id === m.branch_id)?.branch_name || 'N/A';
            if (col === 'advisor') return m.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ');
            if (col === 'category') return customerCategories.find(c => c.id === m.customerCategoryId)?.name || 'N/A';
            if (col === 'subCategory') return customerSubCategories.find(c => c.id === m.customerSubCategoryId)?.name || 'N/A';
            if (col === 'group') return customerGroups.find(g => g.id === m.customerGroupId)?.name || 'N/A';
            if (col === 'gender') return genders.find(g => g.id === m.gender)?.name || 'N/A';
            if (col === 'religion') return religions.find(r => r.id === m.religionId)?.name || 'N/A';
            if (col === 'status') return m.active ? 'Active' : 'Inactive';
            if (col === 'tier') return m.memberType;
            if (col === 'bloodGroup') return m.bloodGroup || 'N/A';
            if (col === 'anniversary') return m.anniversary ? format(parseISO(m.anniversary), 'dd-MM-yyyy') : 'N/A';
            if (col === 'leadSource') return leadSources.find(ls => ls.id === m.leadSource?.sourceId)?.name || 'N/A';
            if (col === 'state') return m.state || 'N/A';
            if (col === 'district') return m.district || 'N/A';
            if (col === 'businessVertical') {
                const mVerticals = getMemberVerticals(m, insuranceVerticalId, mfVerticalId);
                const activeFilter = reportSnapshot?.businessVerticals || [];
                const hasFilter = activeFilter.length > 0;

                const labels = [];
                if(insuranceVerticalId && mVerticals.has(insuranceVerticalId)) {
                    if (!hasFilter || activeFilter.includes(insuranceVerticalId)) labels.push("Insurance");
                }
                if(mfVerticalId && mVerticals.has(mfVerticalId)) {
                    if (!hasFilter || activeFilter.includes(mfVerticalId)) labels.push("Mutual Funds");
                }
                return labels.join(" & ") || 'None';
            }
            return (m as any)[col] || 'N/A';
        });
        return [...fixed, ...dynamic];
    };

    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const headers = [getExportHeaders()];
        const data = filteredMembers.map((m, i) => getExportRow(m, i));
        
        doc.text("Customer Master Report", 14, 15);
        doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 22);
        doc.text(`Period: ${reportSnapshot?.dateFrom} to ${reportSnapshot?.dateTo}`, 14, 29);
        
        (doc as jsPDFWithAutoTable).autoTable({
            head: headers, body: data, startY: 35, theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [41, 128, 185] }
        });
        doc.save('customer_report.pdf');
    };

    const exportCSV = () => {
        const headers = getExportHeaders();
        const data = filteredMembers.map((m, i) => getExportRow(m, i));
        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'customer_report.csv';
        link.click();
    };

    return (
        <div className="space-y-6 pb-20 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <BarChart3 size={24} /> Customer Master Report
                </h2>
                {reportSnapshot && (
                    <div className="text-sm text-gray-500">
                        Total Records: {filteredMembers.length}
                    </div>
                )}
            </div>

            {/* --- 1. COMPACT FILTER PANEL --- */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border dark:border-gray-700">
                <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-2">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Filter size={18} /> Search Parameters
                    </div>
                    {errorMsg && <div className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> {errorMsg}</div>}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    {/* Mandatory Dates */}
                    <div className="w-48"><Input label="From Date *" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                    <div className="w-48"><Input label="End Date *" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                    
                    {/* Add Filter Button */}
                    <button 
                        onClick={handleOpenFilterModal}
                        className="mb-1 p-2 rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        title="Add Filters"
                    >
                        <Plus size={18} /> <span className="text-sm font-medium">Add Filter</span>
                    </button>
                </div>

                {/* --- DYNAMIC FILTER INPUTS --- */}
                {visibleFilters.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fadeIn border-t dark:border-gray-700 pt-4">
                        {visibleFilters.includes('businessVertical') && <MultiSelectDropdown label="Business Vertical" selectedValues={selectedBusinessVerticals} onChange={setSelectedBusinessVerticals} options={businessVerticalOptions} />}
                        
                        {visibleFilters.includes('state') && <MultiSelectDropdown label="State" selectedValues={selectedStates} onChange={setSelectedStates} options={stateOptions} />}
                        {visibleFilters.includes('district') && <MultiSelectDropdown label="District" selectedValues={selectedDistricts} onChange={setSelectedDistricts} options={districtOptions} />}
                        {visibleFilters.includes('city') && <MultiSelectDropdown label="City" selectedValues={selectedCities} onChange={setSelectedCities} options={cityOptions} />}
                        {visibleFilters.includes('area') && <MultiSelectDropdown label="Area" selectedValues={selectedAreas} onChange={setSelectedAreas} options={areaOptions} />}
                        
                        {visibleFilters.includes('branch') && <MultiSelectDropdown label="Branch" options={branchOptions} selectedValues={selectedBranches} onChange={setSelectedBranches} />}
                        {visibleFilters.includes('advisor') && <MultiSelectDropdown label="Advisor" options={advisorOptions} selectedValues={selectedAdvisors} onChange={setSelectedAdvisors} />}
                        
                        {visibleFilters.includes('tier') && <MultiSelectDropdown label="Tier Type" selectedValues={selectedTypes} onChange={setSelectedTypes} options={tierOptions} />}
                        {visibleFilters.includes('status') && <MultiSelectDropdown label="Status" selectedValues={selectedStatuses} onChange={setSelectedStatuses} options={statusOptions} />}
                        
                        {visibleFilters.includes('category') && (
                            <>
                                <MultiSelectDropdown label="Category" selectedValues={selectedCategories} onChange={(val) => { setSelectedCategories(val); setSelectedSubCategories([]); }} options={categoryOptions} />
                                <MultiSelectDropdown label="Sub-Category" selectedValues={selectedSubCategories} onChange={setSelectedSubCategories} options={subCategoryOptions} placeholder={selectedCategories.length === 0 ? "Select Category first" : "Select..."} />
                            </>
                        )}
                        
                        {visibleFilters.includes('group') && <MultiSelectDropdown label="Group" selectedValues={selectedGroups} onChange={setSelectedGroups} options={groupOptions} />}
                        {visibleFilters.includes('gender') && <MultiSelectDropdown label="Gender" selectedValues={selectedGenders} onChange={setSelectedGenders} options={genderOptions} />}
                        
                        {visibleFilters.includes('leadSource') && (
                            <>
                                <MultiSelectDropdown label="Lead Source (Main)" selectedValues={selectedParentSources} onChange={(val) => { setSelectedParentSources(val); setSelectedChildSources([]); }} options={parentSourceOptions} />
                                <MultiSelectDropdown label="Lead Source (Sub)" selectedValues={selectedChildSources} onChange={setSelectedChildSources} options={childSourceOptions} placeholder={selectedParentSources.length === 0 ? "Select Main Source first" : "Select..."} />
                            </>
                        )}

                        {visibleFilters.includes('religion') && <MultiSelectDropdown label="Religion" selectedValues={selectedReligions} onChange={setSelectedReligions} options={religionOptions} />}
                        {visibleFilters.includes('bloodGroup') && <MultiSelectDropdown label="Blood Group" selectedValues={selectedBloodGroups} onChange={setSelectedBloodGroups} options={bloodGroupOptions} />}
                        
                        {visibleFilters.includes('anniversary') && (
                            <>
                                <Input label="Anniversary From" type="date" value={anniversaryFrom} onChange={e => setAnniversaryFrom(e.target.value)} />
                                <Input label="Anniversary To" type="date" value={anniversaryTo} onChange={e => setAnniversaryTo(e.target.value)} />
                            </>
                        )}
                    </div>
                )}

                {/* --- GENERATE ACTIONS --- */}
                <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <Button variant="secondary" onClick={handleReset} className="py-3 px-6 text-base">
                        <X size={18} className="mr-2" /> Clear All
                    </Button>
                    <Button variant="primary" onClick={handleSearch} className="py-3 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white">
                        <Search size={18} className="mr-2" /> Generate Report
                    </Button>
                </div>
            </div>

            {/* --- REPORT RESULTS --- */}
            {reportSnapshot && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Graphs */}
                    {activeGraphs.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeGraphs.map((param, index) => {
                                const data = generateGraphData(param);
                                const label = graphLabelMap[param] || param;
                                const type = graphTypes[param] || 'pie'; 

                                return (
                                    <div key={param} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 min-h-[400px]">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{label} Distribution</h3>
                                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
                                                <button 
                                                    className={`p-1 rounded ${type === 'pie' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                                    onClick={() => setGraphTypes(prev => ({ ...prev, [param]: 'pie' }))}
                                                >
                                                    <PieChartIcon size={16} />
                                                </button>
                                                <button 
                                                    className={`p-1 rounded ${type === 'bar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                                                    onClick={() => setGraphTypes(prev => ({ ...prev, [param]: 'bar' }))}
                                                >
                                                    <BarChart3 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-[320px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {type === 'bar' ? (
                                                    <BarChart data={data} onClick={(state: any) => state && state.activePayload && handleGraphClick(state.activePayload[0].payload, param)}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="value" name="Customers" fill="#3B82F6" cursor="pointer">
                                                            {data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                                        </Bar>
                                                    </BarChart>
                                                ) : (
                                                    <PieChart>
                                                        <Pie
                                                            data={data}
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            cursor="pointer"
                                                            onClick={(state) => handleGraphClick(state, param)}
                                                        >
                                                            {data.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-center text-xs text-gray-500 mt-2 italic">Click on graph elements to view details</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border dark:border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="font-semibold text-gray-800 dark:text-white">Detailed Report List</div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={exportPDF} disabled={filteredMembers.length === 0}>
                                    <Download size={16} /> PDF
                                </Button>
                                <Button variant="ghost" onClick={exportCSV} disabled={filteredMembers.length === 0}>
                                    <Download size={16} /> CSV
                                </Button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        {getExportHeaders().map(h => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-200 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    {filteredMembers.map((m, i) => (
                                        <tr key={m.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
                                            {getExportRow(m, i).map((cell, cellIdx) => (
                                                <td key={cellIdx} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                                                <FileX size={40} className="mb-3 opacity-40 text-gray-400"/>
                                                <span className="text-lg font-medium">No members found matching your filters.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FILTER SELECTION MODAL --- */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-xl flex flex-col">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Add Filters</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
                        </div>
                        
                        <div className="p-2 border-b dark:border-gray-700 flex gap-2 justify-end bg-gray-50 dark:bg-gray-800">
                            <button onClick={handleSelectAllFilters} className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Select All</button>
                            <button onClick={handleDeselectAllFilters} className="text-xs font-medium text-gray-600 hover:bg-gray-200 px-2 py-1 rounded">Deselect All</button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-3">
                                {FILTER_OPTIONS.map(opt => (
                                    <label key={opt.key} className="flex items-center gap-3 p-3 rounded border hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${tempSelectedFilters.includes(opt.key) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-400'}`}>
                                            {tempSelectedFilters.includes(opt.key) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={tempSelectedFilters.includes(opt.key)}
                                            onChange={() => {
                                                if (tempSelectedFilters.includes(opt.key)) {
                                                    setTempSelectedFilters(prev => prev.filter(k => k !== opt.key));
                                                } else {
                                                    setTempSelectedFilters(prev => [...prev, opt.key]);
                                                }
                                            }}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsFilterModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleApplyFilters}>Apply Filters</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DRILL DOWN MODAL --- */}
            {drillDownData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Search size={20} className="text-blue-600"/> {drillDownData.title}
                            </h3>
                            <button onClick={() => setDrillDownData(null)} className="text-gray-500 hover:text-red-500 transition-colors bg-white dark:bg-gray-600 rounded-full p-1 shadow-sm"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {['S.No', 'ID', 'Name', 'Mobile', 'Email', 'City', 'Area'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-200">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {drillDownData.data.map((m, i) => (
                                        <tr key={m.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-3 text-gray-500">{i+1}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{m.memberId}</td>
                                            <td className="px-6 py-3 text-blue-600 dark:text-blue-400 font-medium">{m.name}</td>
                                            <td className="px-6 py-3 text-gray-500">{m.mobile}</td>
                                            <td className="px-6 py-3 text-gray-500">{m.email || '-'}</td>
                                            <td className="px-6 py-3 text-gray-500">{m.city}</td>
                                            <td className="px-6 py-3 text-gray-500">{m.area || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <span className="text-sm text-gray-500">Showing {drillDownData.data.length} records</span>
                            <Button onClick={() => setDrillDownData(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedReports;