import React, { useState, useMemo, useCallback } from 'react';
import { 
    Member, User, Branch, LeadSourceMaster, CustomerCategory, 
    CustomerSubCategory, CustomerGroup, Religion, Gender, CustomerTier,
    BusinessVertical, SchemeMaster, InsuranceAgency, Policy, MaritalStatus, ProcessStageMaster,
    InsuranceTypeMaster, AMC, MutualFundScheme, MutualFundHolding, Lead
} from '../types.ts';
import { 
    Download, BarChart3, PieChart as PieChartIcon, 
    Filter, X, Search, FileX, AlertCircle, Plus, Check, Users, Briefcase, Combine, UserPlus, Printer
} from 'lucide-react';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import Modal from './ui/Modal.tsx';
import MultiSelectDropdown from './ui/MultiSelectDropdown.tsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, isValid } from 'date-fns';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, PieChart, Pie, Cell, Sector
} from 'recharts';


interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDFWithAutoTable;
}

interface AdvancedReportsProps {
    members: Member[];
    allLeads: Lead[]; 
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
    schemes: SchemeMaster[]; 
    agencies: InsuranceAgency[];
    maritalStatuses: MaritalStatus[];
    processStageMasters: ProcessStageMaster[];
    insuranceTypes: InsuranceTypeMaster[];
    amcs: AMC[];
    mutualFundSchemes: MutualFundScheme[];
}

type GraphType = 'pie' | 'bar';
type ReportMode = 'customer' | 'business' | 'combined';
type RecordType = 'customer' | 'lead'; 

type ExtendedPolicy = Policy & { 
    isMutualFund?: boolean; 
    mfObject?: MutualFundHolding;
    category?: string; 
};

type ReportItem = Member | Lead | { member: Member, policy: ExtendedPolicy };

interface DrillDownData {
    title: string;
    data: ReportItem[];
}

interface ReportSnapshot {
    reportMode: ReportMode;
    recordType: RecordType; 
    dateFrom: string;
    dateTo: string;
    branches: string[];
    advisors: string[];
    states: string[];
    districts: string[];
    cities: string[];
    areas: string[];
    parentSources: string[];
    childSources: string[];
    customerIds: string;
    customerNames: string;
    familyNames: string;
    mobiles: string;
    emails: string;
    types: string[];
    statuses: string[];
    categories: string[];
    subCategories: string[];
    groups: string[];
    genders: string[];
    maritalStatuses: string[];
    processStages: string[];
    religions: string[];
    bloodGroups: string[];
    anniversaryFrom: string;
    anniversaryTo: string;
    isConverted: string[];
    followUpFrom: string;
    followUpTo: string;
    annualIncomeFrom: string;
    annualIncomeTo: string;
    businessVerticals: string[];
    policyTypes: string[];
    policySubTypes: string[];
    policyHolderTypes: string[];
    schemes: string[];
    agencies: string[];
    policyPremiumFrom: string;
    policyPremiumTo: string;
    policySumAssuredFrom: string;
    policySumAssuredTo: string;
    policyMaturityDate: string;
    policyCreatedFrom: string;
    policyCreatedTo: string;
    amcs: string[];
    mutualFundSchemes: string[];
    wonLeads: boolean;
    lostLeads: boolean;
    visibleFilters: string[];
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
    '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', 
    '#a4de6c', '#d0ed57', '#ff6b6b', '#4ecdc4'
];

const CUSTOMER_REPORT_HARDCODED_COLS = ['sno', 'memberId', 'name', 'customerType', 'status', 'areaCityState', 'assignedTo', 'leadSource', 'isConverted', 'createdAt', 'mobile', 'email', 'branch', 'company'];
const LEAD_REPORT_HARDCODED_COLS = ['sno', 'name', 'status', 'mobile', 'email', 'leadSource', 'assignedTo', 'businessVertical', 'createdAt', 'followUpDate'];
const BUSINESS_VERTICAL_HARDCODED_COLS = ['sno', 'name', 'businessVertical', 'policyNumber', 'policyType', 'policySubType', 'scheme', 'agency', 'policyHolderType', 'premium', 'sumAssured', 'policyStatus', 'assignedTo', 'branch'];
const COMBINED_REPORT_HARDCODED_COLS = [...new Set([...CUSTOMER_REPORT_HARDCODED_COLS, ...BUSINESS_VERTICAL_HARDCODED_COLS])];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, name, fill } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={5} textAnchor={textAnchor} fill={fill} fontSize={14} fontWeight="bold">
        {name}
      </text>
    </g>
  );
};


const AdvancedReports: React.FC<AdvancedReportsProps> = (props) => {
    const {
        members, allLeads, users, branches, leadSources, customerCategories, 
        customerSubCategories, customerGroups, religions, genders, customerTiers, businessVerticals,
        schemes, agencies, maritalStatuses, processStageMasters, insuranceTypes,
        amcs, mutualFundSchemes
    } = props;

    const [reportMode, setReportMode] = useState<ReportMode>('customer');
    const [recordType, setRecordType] = useState<RecordType>('customer');
    
    const [tempReportMode, setTempReportMode] = useState<ReportMode>('customer');
    const [tempRecordType, setTempRecordType] = useState<RecordType>('customer');

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
    const [selectedMaritalStatuses, setSelectedMaritalStatuses] = useState<string[]>([]);
    const [selectedProcessStages, setSelectedProcessStages] = useState<string[]>([]);
    const [selectedParentSources, setSelectedParentSources] = useState<string[]>([]);
    const [selectedChildSources, setSelectedChildSources] = useState<string[]>([]);
    const [selectedBusinessVerticals, setSelectedBusinessVerticals] = useState<string[]>([]);
    const [selectedPolicyTypes, setSelectedPolicyTypes] = useState<string[]>([]);
    const [selectedPolicySubTypes, setSelectedPolicySubTypes] = useState<string[]>([]);
    const [selectedPolicyHolderTypes, setSelectedPolicyHolderTypes] = useState<string[]>([]);
    const [selectedSchemes, setSelectedSchemes] = useState<string[]>([]);
    const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
    const [selectedAMCs, setSelectedAMCs] = useState<string[]>([]);
    const [selectedMutualFundSchemes, setSelectedMutualFundSchemes] = useState<string[]>([]);
    const [selectedIsConverted, setSelectedIsConverted] = useState<string[]>([]);
    const [selectedWonLeads, setSelectedWonLeads] = useState<boolean>(false);
    const [selectedLostLeads, setSelectedLostLeads] = useState<boolean>(false);

    const [searchCustomerId, setSearchCustomerId] = useState('');
    const [searchCustomerName, setSearchCustomerName] = useState('');
    const [searchFamilyName, setSearchFamilyName] = useState('');
    const [searchMobile, setSearchMobile] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [anniversaryFrom, setAnniversaryFrom] = useState('');
    const [anniversaryTo, setAnniversaryTo] = useState('');
    const [followUpFrom, setFollowUpFrom] = useState('');
    const [followUpTo, setFollowUpTo] = useState('');
    const [annualIncomeFrom, setAnnualIncomeFrom] = useState('');
    const [annualIncomeTo, setAnnualIncomeTo] = useState('');
    const [policyPremiumFrom, setPolicyPremiumFrom] = useState('');
    const [policyPremiumTo, setPolicyPremiumTo] = useState('');
    const [policySumAssuredFrom, setPolicySumAssuredFrom] = useState('');
    const [policySumAssuredTo, setPolicySumAssuredTo] = useState('');
    const [policyMaturityDate, setPolicyMaturityDate] = useState('');
    const [policyCreatedFrom, setPolicyCreatedFrom] = useState('');
    const [policyCreatedTo, setPolicyCreatedTo] = useState('');


    const [reportSnapshot, setReportSnapshot] = useState<ReportSnapshot | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [activeGraphs, setActiveGraphs] = useState<string[]>([]); 
    const [graphTypes, setGraphTypes] = useState<Record<string, GraphType>>({}); 
    const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    const uniqueStates = useMemo(() => Array.from(new Set(members.map(m => m.state).filter(Boolean))), [members]);
    const uniqueDistricts = useMemo(() => Array.from(new Set(members.map(m => m.district).filter(Boolean))), [members]);
    const uniqueCities = useMemo(() => Array.from(new Set(members.map(m => m.city).filter(Boolean))), [members]);
    const uniqueAreas = useMemo(() => Array.from(new Set(members.map(m => m.area).filter(Boolean))), [members]);
    const uniqueBloodGroups = useMemo(() => Array.from(new Set(members.map(m => m.bloodGroup).filter(Boolean))), [members]);

    const stateOptions = useMemo(() => uniqueStates.filter(s => s).map(s => ({ value: s!, label: s! })), [uniqueStates]);
    const districtOptions = useMemo(() => uniqueDistricts.filter(d => d).map(d => ({ value: d!, label: d! })), [uniqueDistricts]);
    const cityOptions = useMemo(() => uniqueCities.filter(c => c).map(c => ({ value: c!, label: c! })), [uniqueCities]);
    const areaOptions = useMemo(() => uniqueAreas.filter(a => a).map(a => ({ value: a!, label: a! })), [uniqueAreas]);

    const branchOptions = useMemo(() => branches.map(b => ({ value: b.id, label: b.branch_name })), [branches]);
    const advisorOptions = useMemo(() => users.filter(u => u.role?.toLowerCase().includes('advisor')).map(u => ({ value: u.id, label: u.name })), [users]);
    const tierOptions = useMemo(() => customerTiers.map(t => ({value: t.id, label: t.name || 'Unknown'})), [customerTiers]);
    const statusOptions = useMemo(() => {
        if (tempRecordType === 'lead') {
            return Array.from(new Set(allLeads.map(l => l.status))).map(s => ({ value: s, label: s }));
        }
        return [{value: 'Active', label: 'Active'}, {value: 'Inactive', label: 'Inactive'}];
    }, [tempRecordType, allLeads]);

    const categoryOptions = useMemo(() => customerCategories.map(c => ({ value: c.id, label: c.name })), [customerCategories]);
    
    const subCategoryOptions = useMemo(() => {
        return customerSubCategories
            .filter(sc => selectedCategories.length === 0 || selectedCategories.includes(sc.parentId))
            .map(sc => ({ value: sc.id, label: sc.name }));
    }, [customerSubCategories, selectedCategories]);
    
    const groupOptions = useMemo(() => customerGroups.map(g => ({value: g.id, label: g.name})), [customerGroups]);
    const genderOptions = useMemo(() => genders.map(g => ({value: g.id, label: g.name})), [genders]);
    const religionOptions = useMemo(() => religions.map(r => ({value: r.id, label: r.name})), [religions]);
    const bloodGroupOptions = useMemo(() => uniqueBloodGroups.filter(b => b).map(b => ({value: b!, label: b!})), [uniqueBloodGroups]);
    const maritalStatusOptions = useMemo(() => maritalStatuses.map(ms => ({value: ms.id, label: ms.name})), [maritalStatuses]);
    const processStageOptions = useMemo(() => processStageMasters.map(ps => ({value: ps.id, label: ps.name})), [processStageMasters]);
    const businessVerticalOptions = useMemo(() => businessVerticals.map(bv => ({ value: bv.id, label: bv.name })), [businessVerticals]);
    const policyTypeOptions = useMemo(() => {
        return insuranceTypes.filter(it => !it.parentId && it.active !== false).map(it => ({value: it.id, label: it.name}));
    }, [insuranceTypes]);
    const policySubTypeOptions = useMemo(() => {
        return insuranceTypes.filter(it => it.parentId && it.active !== false).map(it => ({value: it.id, label: it.name}));
    }, [insuranceTypes]);
    const policyHolderTypeOptions = [{value: 'Individual', label: 'Individual'}, {value: 'Family', label: 'Family'}];
    const schemeOptions = useMemo(() => {
        return (schemes || []).filter(s => s.active !== false).map(s => ({
            value: s.id, 
            label: `${s.name}${(agencies || []).find(a => a.id === s.agencyId)?.name ? ` (${(agencies || []).find(a => a.id === s.agencyId)?.name})` : ''}`
        }));
    }, [schemes, agencies]);
    const agencyOptions = useMemo(() => {
        return (agencies || []).filter(a => a.active !== false).map(a => ({value: a.id, label: a.name}));
    }, [agencies]);
    const amcOptions = useMemo(() => {
        return (amcs || []).filter(a => a.active !== false).map(a => ({value: a.id, label: a.name}));
    }, [amcs]);
    const mutualFundSchemeOptions = useMemo(() => {
        return (mutualFundSchemes || []).filter(s => s.active !== false).map(s => ({
            value: s.id, 
            label: `${s.name}${(amcs || []).find(a => a.id === s.amcId)?.name ? ` (${(amcs || []).find(a => a.id === s.amcId)?.name})` : ''}`
        }));
    }, [mutualFundSchemes, amcs]);
    const isConvertedOptions = [{value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}];

    const parentSourceOptions = useMemo(() => leadSources.filter(ls => !ls.parentId).map(ls => ({ value: ls.id, label: ls.name })), [leadSources]);
    const childSourceOptions = useMemo(() => {
        return leadSources
            .filter(ls => selectedParentSources.length > 0 && selectedParentSources.includes(ls.parentId || ''))
            .map(ls => ({ value: ls.id, label: ls.name }));
    }, [leadSources, selectedParentSources]);
    
    const CUSTOMER_FILTERS = [
        { key: 'customerId', label: 'Customer ID' }, { key: 'customerName', label: 'Customer Name' }, { key: 'familyName', label: 'Family Name' }, { key: 'mobile', label: 'Mobile' }, { key: 'email', label: 'Email' },
        { key: 'state', label: 'State' }, { key: 'district', label: 'District' }, { key: 'city', label: 'City' }, { key: 'area', label: 'Area' },
        { key: 'branch', label: 'Branch' }, { key: 'advisor', label: 'Advisor' }, { key: 'tier', label: 'Tier Type' }, { key: 'status', label: 'Status' },
        { key: 'category', label: 'Category' }, { key: 'subCategory', label: 'Sub-Category' }, { key: 'group', label: 'Group' }, { key: 'gender', label: 'Gender' },
        { key: 'maritalStatus', label: 'Marital Status' }, { key: 'processStage', label: 'Process Flow Stage' },
        { key: 'leadSource', label: 'Lead Source' }, { key: 'religion', label: 'Religion' }, { key: 'bloodGroup', label: 'Blood Group' },
        { key: 'anniversary', label: 'Anniversary Date' }, { key: 'isConverted', label: 'Is Converted' }, { key: 'followUpDate', label: 'Follow-up Date' }, { key: 'annualIncome', label: 'Annual Income' },
    ];

    const LEAD_FILTERS = [
        { key: 'customerName', label: 'Lead Name' }, { key: 'mobile', label: 'Mobile' }, { key: 'email', label: 'Email' },
        { key: 'status', label: 'Lead Status' }, { key: 'leadSource', label: 'Lead Source' },
        { key: 'branch', label: 'Branch' }, { key: 'advisor', label: 'Assigned To' },
        { key: 'businessVertical', label: 'Interest (Business Vertical)' }, { key: 'followUpDate', label: 'Follow-up Date' },
        { key: 'wonLeads', label: 'Won Leads' }, { key: 'lostLeads', label: 'Lost Leads' },
    ];
    
    const BUSINESS_FILTERS = [
        { key: 'customerName', label: 'Customer Name' }, { key: 'leadSource', label: 'Lead Source' },
        { key: 'state', label: 'State' }, { key: 'district', label: 'District' }, { key: 'city', label: 'City' }, { key: 'area', label: 'Area' },
        { key: 'branch', label: 'Branch' }, { key: 'advisor', label: 'Advisor' },
        { key: 'businessVertical', label: 'Business Vertical' }, { key: 'policyType', label: 'Policy Type' }, { key: 'policySubType', label: 'Policy Sub-Type' }, { key: 'policyHolderType', label: 'Policy Holder Type' }, 
        { key: 'agency', label: 'Agency' }, { key: 'scheme', label: 'Scheme' }, { key: 'amc', label: 'AMC' }, { key: 'mutualFundScheme', label: 'Mutual Fund Scheme' },
        { key: 'policyPremiumFrom', label: 'Premium From / Inv. Date' }, { key: 'policyPremiumTo', label: 'Premium To / SIP Day' }, { key: 'policySumAssured', label: 'Sum Assured / Valuation' },
        { key: 'policyMaturityDate', label: 'Policy Maturity Date' }, { key: 'policyCreatedDate', label: 'Policy Created Date' },
    ];

    const FILTER_OPTIONS = useMemo(() => {
        if (tempRecordType === 'lead') return LEAD_FILTERS;

        const mode = isFilterModalOpen ? tempReportMode : reportMode;
        if (mode === 'customer') return CUSTOMER_FILTERS;
        if (mode === 'business') return BUSINESS_FILTERS;
        const combined = [...CUSTOMER_FILTERS, ...BUSINESS_FILTERS];
        return combined.filter((item, index, self) => index === self.findIndex(t => t.key === item.key));
    }, [reportMode, tempReportMode, isFilterModalOpen, tempRecordType]);

    const isPolicyMatch = (p: ExtendedPolicy, snap: ReportSnapshot) => {
        const pType = insuranceTypes.find(t => t.id === p.insuranceTypeId);
        const parentType = pType?.parentId ? insuranceTypes.find(t => t.id === pType.parentId) : null;
        
        let verticalId = p.businessVerticalId;
        if (!verticalId && pType?.verticalId) verticalId = pType.verticalId;
        if (!verticalId && parentType?.verticalId) verticalId = parentType.verticalId;

        if (snap.visibleFilters.includes('businessVertical') && snap.businessVerticals.length > 0) {
            if (!verticalId || !snap.businessVerticals.includes(verticalId)) return false;
        }

        const isInsurance = !p.isMutualFund;
        const isMutualFund = !!p.isMutualFund;

        const hasActiveInsuranceFilters = 
            (snap.visibleFilters.includes('policyType') && snap.policyTypes.length > 0) ||
            (snap.visibleFilters.includes('policySubType') && snap.policySubTypes.length > 0) ||
            (snap.visibleFilters.includes('policyHolderType') && snap.policyHolderTypes.length > 0) ||
            (snap.visibleFilters.includes('scheme') && snap.schemes.length > 0) ||
            (snap.visibleFilters.includes('agency') && snap.agencies.length > 0) ||
            (snap.visibleFilters.includes('policyMaturityDate') && !!snap.policyMaturityDate);

        const hasActiveMFFilters = 
            (snap.visibleFilters.includes('amc') && snap.amcs.length > 0) ||
            (snap.visibleFilters.includes('mutualFundScheme') && snap.mutualFundSchemes.length > 0);

        if (isInsurance) {
            if (snap.visibleFilters.includes('policyType') && snap.policyTypes.length > 0) {
                const typeId = pType?.id;
                const parentId = pType?.parentId;
                const match = (typeId && snap.policyTypes.includes(typeId)) || (parentId && snap.policyTypes.includes(parentId));
                if (!match) return false;
            }
            if (snap.visibleFilters.includes('policySubType') && snap.policySubTypes.length > 0 && !snap.policySubTypes.includes(p.insuranceTypeId || '')) return false;
            if (snap.visibleFilters.includes('policyHolderType') && snap.policyHolderTypes.length > 0 && !snap.policyHolderTypes.includes(p.policyHolderType || '')) return false;
            if (snap.visibleFilters.includes('scheme') && snap.schemes.length > 0 && !snap.schemes.includes(p.schemeId || '')) return false;
            if (snap.visibleFilters.includes('agency') && snap.agencies.length > 0) {
                if (p.agencyId) { if (!snap.agencies.includes(p.agencyId)) return false; } 
                else {
                    const scheme = (schemes || []).find(s => s.id === p.schemeId);
                    if (!scheme || !snap.agencies.includes(scheme.agencyId)) return false;
                }
            }
            if (snap.visibleFilters.includes('policyMaturityDate') && snap.policyMaturityDate) {
                if (!p.maturityDate || parseISO(p.maturityDate).toDateString() !== parseISO(snap.policyMaturityDate).toDateString()) return false;
            }

            if (hasActiveMFFilters && !hasActiveInsuranceFilters) {
                return false; 
            }
        }

        if (isMutualFund) {
            if (snap.visibleFilters.includes('amc') && snap.amcs.length > 0) {
                if (p.agencyId) { if (!snap.amcs.includes(p.agencyId)) return false; }
                else return false;
            }
            if (snap.visibleFilters.includes('mutualFundScheme') && snap.mutualFundSchemes.length > 0) {
                if (p.schemeId) { if (!snap.mutualFundSchemes.includes(p.schemeId)) return false; }
                else return false;
            }

            if (hasActiveInsuranceFilters && !hasActiveMFFilters) {
                return false;
            }
        }

        if (snap.visibleFilters.includes('policyPremiumFrom') && snap.policyPremiumFrom) {
            if (!p.startDate || parseISO(p.startDate) < parseISO(snap.policyPremiumFrom)) return false;
        }
        if (snap.visibleFilters.includes('policyPremiumTo') && snap.policyPremiumTo) {
            if (!p.isMutualFund && (!p.renewalDate || parseISO(p.renewalDate) > parseISO(snap.policyPremiumTo))) return false;
        }
        if (snap.visibleFilters.includes('policySumAssured') && snap.policySumAssuredFrom) {
            if (p.coverage < Number(snap.policySumAssuredFrom)) return false;
        }
        if (snap.visibleFilters.includes('policyCreatedDate') && (snap.policyCreatedFrom || snap.policyCreatedTo)) {
            const createdStr = p.policyCreatedDate || p.startDate;
            if (!createdStr) return false;
            const pCreated = parseISO(createdStr);
            if (snap.policyCreatedFrom && pCreated < parseISO(snap.policyCreatedFrom)) return false;
            if (snap.policyCreatedTo && pCreated > parseISO(snap.policyCreatedTo)) return false;
        }

        return true;
    };

const filteredData = useMemo(() => {
        if (!reportSnapshot) return [];
        const snap = reportSnapshot;

        const results: ReportItem[] = [];

        if (snap.recordType === 'lead') {
            allLeads.forEach(lead => {
                const created = lead.createdAt ? parseISO(lead.createdAt) : null;
                if (!created || !isValid(created)) return;
                if (snap.dateFrom && created < parseISO(snap.dateFrom)) return;
                if (snap.dateTo && created > new Date(snap.dateTo + 'T23:59:59')) return;

                if (snap.visibleFilters.includes('customerName') && snap.customerNames && !lead.name.toLowerCase().includes(snap.customerNames.toLowerCase())) return;
                if (snap.visibleFilters.includes('mobile') && snap.mobiles && !lead.phone.includes(snap.mobiles)) return;
                if (snap.visibleFilters.includes('email') && snap.emails && !(lead.email || '').toLowerCase().includes(snap.emails.toLowerCase())) return;
                if (snap.visibleFilters.includes('status') && snap.statuses.length > 0 && !snap.statuses.includes(lead.status)) return;
                if (snap.visibleFilters.includes('branch') && snap.branches.length > 0 && !snap.branches.includes(lead.branch_id || '')) return;
                if (snap.visibleFilters.includes('advisor') && snap.advisors.length > 0 && !snap.advisors.includes(lead.assignedTo)) return;
                
                if (snap.visibleFilters.includes('leadSource') && snap.parentSources.length > 0) {
                    const sourceId = lead.leadSource?.sourceId;
                    if (!sourceId) return;
                    if (snap.childSources.length > 0) { if (!snap.childSources.includes(sourceId)) return; }
                    else {
                        const isDirectParent = snap.parentSources.includes(sourceId);
                        const isChildOfSelectedParent = leadSources.some(ls => ls.id === sourceId && ls.parentId && snap.parentSources.includes(ls.parentId));
                        if (!isDirectParent && !isChildOfSelectedParent) return;
                    }
                }

                if (snap.visibleFilters.includes('followUpDate') && (snap.followUpFrom || snap.followUpTo)) {
                    if (!lead.followUpDate) return;
                    const followUp = parseISO(lead.followUpDate);
                    if (snap.followUpFrom && followUp < parseISO(snap.followUpFrom)) return;
                    if (snap.followUpTo && followUp > parseISO(snap.followUpTo)) return;
                }

                if (snap.visibleFilters.includes('businessVertical') && snap.businessVerticals.length > 0) {
                    const interestType = insuranceTypes.find(t => t.name === lead.policyInterestType);
                    let vId = interestType?.verticalId;
                    if(!vId && interestType?.parentId) {
                        const p = insuranceTypes.find(t => t.id === interestType.parentId);
                        vId = p?.verticalId;
                    }
                    if (vId && !snap.businessVerticals.includes(vId)) return;
                }

                if (snap.visibleFilters.includes('wonLeads') || snap.visibleFilters.includes('lostLeads')) {
                    const showWon = snap.visibleFilters.includes('wonLeads') && snap.wonLeads;
                    const showLost = snap.visibleFilters.includes('lostLeads') && snap.lostLeads;
                    if (showWon && showLost) {
                        if (lead.status !== 'Won' && lead.status !== 'Lost') return;
                    } else if (showWon && lead.status !== 'Won') return;
                    else if (showLost && lead.status !== 'Lost') return;
                }

                results.push(lead);
            });
            return results;
        }

        members.forEach(m => {
            const created = m.createdAt ? parseISO(m.createdAt) : null;
            if (!created || !isValid(created)) return;
            if (snap.dateFrom && created < parseISO(snap.dateFrom)) return;
            if (snap.dateTo && created > new Date(snap.dateTo + 'T23:59:59')) return;

            if (snap.visibleFilters.includes('state') && snap.states.length > 0 && !snap.states.includes(m.state)) return;
            if (snap.visibleFilters.includes('district') && snap.districts.length > 0 && !snap.districts.includes(m.district || '')) return;
            if (snap.visibleFilters.includes('city') && snap.cities.length > 0 && !snap.cities.includes(m.city)) return;
            if (snap.visibleFilters.includes('area') && snap.areas.length > 0 && !snap.areas.includes(m.area || '')) return;
            if (snap.visibleFilters.includes('branch') && snap.branches.length > 0 && !snap.branches.includes(m.branch_id || '')) return;
            if (snap.visibleFilters.includes('advisor') && snap.advisors.length > 0 && !m.assignedTo.some(id => snap.advisors.includes(id))) return;
            if (snap.visibleFilters.includes('leadSource') && snap.parentSources.length > 0) {
                const sourceId = m.leadSource?.sourceId;
                if (!sourceId) return;
                if (snap.childSources.length > 0) { if (!snap.childSources.includes(sourceId)) return; }
                else {
                    const isDirectParent = snap.parentSources.includes(sourceId);
                    const isChildOfSelectedParent = leadSources.some(ls => ls.id === sourceId && ls.parentId && snap.parentSources.includes(ls.parentId));
                    if (!isDirectParent && !isChildOfSelectedParent) return;
                }
            }
            if (snap.visibleFilters.includes('customerName') && snap.customerNames && !m.name.toLowerCase().includes(snap.customerNames.toLowerCase())) return;
            if (snap.visibleFilters.includes('familyName') && snap.familyNames && !m.familyName?.toLowerCase().includes(snap.familyNames.toLowerCase())) return;

            if (snap.reportMode !== 'business') {
                if (snap.visibleFilters.includes('customerId') && snap.customerIds && !m.memberId.toLowerCase().includes(snap.customerIds.toLowerCase())) return;
                if (snap.visibleFilters.includes('mobile') && snap.mobiles && !m.mobile.includes(snap.mobiles)) return;
                if (snap.visibleFilters.includes('email') && snap.emails && !(m.email || '').toLowerCase().includes(snap.emails.toLowerCase())) return;
                if (snap.visibleFilters.includes('tier') && snap.types.length > 0 && !snap.types.includes(m.tierId || '')) return;
                if (snap.visibleFilters.includes('status') && snap.statuses.length > 0 && !snap.statuses.includes(m.active ? 'Active' : 'Inactive')) return;
                if (snap.visibleFilters.includes('category') && snap.categories.length > 0 && !snap.categories.includes(m.customerCategoryId || '')) return;
                if (snap.visibleFilters.includes('subCategory') && snap.subCategories.length > 0 && !snap.subCategories.includes(m.customerSubCategoryId || '')) return;
                if (snap.visibleFilters.includes('group') && snap.groups.length > 0 && !snap.groups.includes(m.customerGroupId || '')) return;
                if (snap.visibleFilters.includes('gender') && snap.genders.length > 0 && !snap.genders.includes(m.gender || '')) return;
                if (snap.visibleFilters.includes('maritalStatus') && snap.maritalStatuses.length > 0 && !snap.maritalStatuses.includes(m.maritalStatus || '')) return;
                if (snap.visibleFilters.includes('processStage') && snap.processStages.length > 0 && !snap.processStages.includes(m.processStage || '')) return;
                if (snap.visibleFilters.includes('religion') && snap.religions.length > 0 && !snap.religions.includes(m.religionId || '')) return;
                if (snap.visibleFilters.includes('bloodGroup') && snap.bloodGroups.length > 0 && !snap.bloodGroups.includes(m.bloodGroup || '')) return;
                if (snap.visibleFilters.includes('anniversary') && (snap.anniversaryFrom || snap.anniversaryTo)) {
                    if (!m.anniversary) return;
                    const anniv = parseISO(m.anniversary);
                    if (snap.anniversaryFrom && anniv < parseISO(snap.anniversaryFrom)) return;
                    if (snap.anniversaryTo && anniv > parseISO(snap.anniversaryTo)) return;
                }
                
                if (snap.visibleFilters.includes('isConverted') && snap.isConverted.length > 0) {
                     const isConv = (!!m.isConverted) || (!m.leadCreatedAt); 
                     const match = snap.isConverted.includes(String(isConv));
                     if (!match) return;
                }

                if (snap.visibleFilters.includes('followUpDate') && (snap.followUpFrom || snap.followUpTo)) {
                    if (!m.followUpDate) return;
                    const followUp = parseISO(m.followUpDate);
                    if (snap.followUpFrom && followUp < parseISO(snap.followUpFrom)) return;
                    if (snap.followUpTo && followUp > parseISO(snap.followUpTo)) return;
                }
                if (snap.visibleFilters.includes('annualIncome') && (snap.annualIncomeFrom || snap.annualIncomeTo)) {
                    const income = m.financialProfile?.annualIncome || 0;
                    if (snap.annualIncomeFrom && income < Number(snap.annualIncomeFrom)) return;
                    if (snap.annualIncomeTo && income > Number(snap.annualIncomeTo)) return;
                }
            }
            
            const allItems: ExtendedPolicy[] = [];
            
            (m.policies || []).forEach(p => {
                allItems.push(p);
            });
            
            (m.mutualFundHoldings || []).forEach(mf => {
                const scheme = mutualFundSchemes.find(s => s.id === mf.schemeId);
                const amc = scheme ? amcs.find(a => a.id === scheme.amcId) : null;
                const isSip = mf.investmentType === 'SIP';
                const sortedTxns = [...(mf.transactions || [])].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const firstTxnDate = sortedTxns.length > 0 ? sortedTxns[0].date : ''; 

                const effectiveStartDate = firstTxnDate || m.createdAt || '';

                let derivedRenewal = 'N/A';
                if (isSip) {
                    if (mf.sipDate) {
                        derivedRenewal = `Day ${mf.sipDate}`;
                    } else if (effectiveStartDate) {
                        try {
                            const d = parseISO(effectiveStartDate).getDate();
                            derivedRenewal = `Day ${d}`;
                        } catch(e) { derivedRenewal = 'SIP Active'; }
                    } else {
                        derivedRenewal = 'SIP Active';
                    }
                }

                const mfPolicy: ExtendedPolicy = {
                    id: mf.id,
                    isMutualFund: true,
                    mfObject: mf,
                    businessVerticalId: amc?.verticalId,
                    insuranceTypeId: undefined,
                    policyType: isSip ? 'SIP' : 'Lumpsum',
                    policyHolderType: 'Individual',
                    schemeId: mf.schemeId,
                    agencyId: amc?.id,
                    premium: isSip ? (mf.sipAmount || 0) : mf.totalInvestment, 
                    coverage: mf.currentValue || mf.totalInvestment || (isSip ? (mf.sipAmount || 0) : 0), 
                    status: mf.status,
                    startDate: effectiveStartDate,
                    renewalDate: derivedRenewal,
                    policyNumber: mf.folioNumber,
                    policyCreatedDate: effectiveStartDate,
                    category: scheme?.category,
                    comp_id: m.comp_id
                } as unknown as ExtendedPolicy;
                
                allItems.push(mfPolicy);
            });

            const matchingItems = allItems.filter(p => isPolicyMatch(p, snap));

            if (snap.reportMode === 'customer') {
                const policyFilterKeys = [
                    'businessVertical', 'policyType', 'policySubType', 'policyHolderType', 'scheme', 'agency', 
                    'policyPremiumFrom', 'policyPremiumTo', 'policySumAssured', 'policyMaturityDate', 'policyCreatedDate',
                    'amc', 'mutualFundScheme'
                ];
                const hasActivePolicyFilters = policyFilterKeys.some(k => snap.visibleFilters.includes(k));

                if (hasActivePolicyFilters) {
                    if (matchingItems.length > 0) results.push(m);
                } else {
                    results.push(m);
                }
            } else {
                if (matchingItems.length > 0) {
                    matchingItems.forEach(policy => {
                        results.push({ member: m, policy });
                    });
                }
            }
        });
        return results;
    }, [reportSnapshot, members, allLeads, leadSources, schemes, agencies, amcs, mutualFundSchemes]); 
    const handleSearch = () => {
        setErrorMsg(null);
        if (!dateFrom || !dateTo) {
            setErrorMsg("Please select both 'Created From Date' and 'Created End Date'.");
            return;
        }

        const snapshot: ReportSnapshot = {
            reportMode, recordType, dateFrom, dateTo,
            states: selectedStates, districts: selectedDistricts, cities: selectedCities, areas: selectedAreas,
            branches: selectedBranches, advisors: selectedAdvisors,
            types: selectedTypes, statuses: selectedStatuses,
            categories: selectedCategories, subCategories: selectedSubCategories,
            groups: selectedGroups, genders: selectedGenders,
            maritalStatuses: selectedMaritalStatuses, processStages: selectedProcessStages,
            religions: selectedReligions, bloodGroups: selectedBloodGroups,
            parentSources: selectedParentSources, childSources: selectedChildSources,
            businessVerticals: selectedBusinessVerticals,
            policyTypes: selectedPolicyTypes, policySubTypes: selectedPolicySubTypes,
            policyHolderTypes: selectedPolicyHolderTypes, schemes: selectedSchemes, agencies: selectedAgencies,
            amcs: selectedAMCs, mutualFundSchemes: selectedMutualFundSchemes,
            policyPremiumFrom, policyPremiumTo, policySumAssuredFrom, policySumAssuredTo,
            policyMaturityDate, policyCreatedFrom, policyCreatedTo,
            anniversaryFrom, anniversaryTo,
            isConverted: selectedIsConverted,
            followUpFrom, followUpTo,
            annualIncomeFrom, annualIncomeTo,
            customerIds: searchCustomerId, customerNames: searchCustomerName, familyNames: searchFamilyName, mobiles: searchMobile, emails: searchEmail,
            wonLeads: selectedWonLeads, lostLeads: selectedLostLeads,
            visibleFilters: [...visibleFilters] 
        };
        setReportSnapshot(snapshot);

        let hardcoded = reportMode === 'customer' ? CUSTOMER_REPORT_HARDCODED_COLS : reportMode === 'business' ? BUSINESS_VERTICAL_HARDCODED_COLS : COMBINED_REPORT_HARDCODED_COLS;
        
        if (recordType === 'lead') {
            hardcoded = LEAD_REPORT_HARDCODED_COLS;
        }

        const dynamicMapped = visibleFilters
            .filter(f => f !== 'amc' && f !== 'mutualFundScheme')
            .map(f => {
                if (f === 'customerName') return 'name';
                if (f === 'customerId') return 'memberId';
                if (f === 'advisor') return 'assignedTo';
                return f;
            });
            
        setVisibleColumns([...new Set([...hardcoded, ...dynamicMapped])]);

        const graphsToShow: string[] = [];
        if(visibleFilters.includes('branch')) graphsToShow.push('branch');
        if(visibleFilters.includes('advisor')) graphsToShow.push('advisor');
        
        if (recordType === 'lead') {
            if(visibleFilters.includes('leadSource')) graphsToShow.push('leadSource');
            if(visibleFilters.includes('status')) graphsToShow.push('status');
            if(visibleFilters.includes('businessVertical')) graphsToShow.push('businessVertical');
        } else {
            if(visibleFilters.includes('state')) graphsToShow.push('state');
            if(visibleFilters.includes('tier')) graphsToShow.push('tier');
            if(visibleFilters.includes('status')) graphsToShow.push('status');
            if(visibleFilters.includes('gender')) graphsToShow.push('gender');
            if(visibleFilters.includes('leadSource')) graphsToShow.push('leadSource');
            if(visibleFilters.includes('businessVertical')) graphsToShow.push('businessVertical');
            if(visibleFilters.includes('category')) graphsToShow.push('category');
            if(visibleFilters.includes('subCategory')) graphsToShow.push('subCategory');
            if(visibleFilters.includes('group')) graphsToShow.push('group');
            if(visibleFilters.includes('religion')) graphsToShow.push('religion');
            if(visibleFilters.includes('policyType')) graphsToShow.push('policyType');
            if(visibleFilters.includes('policySubType')) graphsToShow.push('policySubType');
            if(visibleFilters.includes('policyHolderType')) graphsToShow.push('policyHolderType');
            if(visibleFilters.includes('agency')) graphsToShow.push('agency');
            if(visibleFilters.includes('scheme')) graphsToShow.push('scheme');
            if(visibleFilters.includes('amc')) graphsToShow.push('agency'); 
            if(visibleFilters.includes('mutualFundScheme')) graphsToShow.push('scheme');
        }
        setActiveGraphs(graphsToShow);
    };

    const handleReset = () => {
        setReportSnapshot(null); setErrorMsg(null);
        setDateFrom(''); setDateTo(''); setSelectedStates([]); setSelectedDistricts([]); setSelectedCities([]); setSelectedAreas([]);
        setSelectedBranches([]); setSelectedAdvisors([]); setSelectedTypes([]); setSelectedStatuses([]);
        setSelectedCategories([]); setSelectedSubCategories([]); setSelectedGroups([]); setSelectedGenders([]);
        setSelectedMaritalStatuses([]); setSelectedProcessStages([]);
        setSelectedReligions([]); setSelectedBloodGroups([]); setSelectedParentSources([]); setSelectedChildSources([]);
        setSelectedBusinessVerticals([]); setAnniversaryFrom(''); setAnniversaryTo('');
        setSearchCustomerId(''); setSearchCustomerName(''); setSearchFamilyName(''); setSearchMobile(''); setSearchEmail('');
        setSelectedIsConverted([]); setFollowUpFrom(''); setFollowUpTo(''); setAnnualIncomeFrom(''); setAnnualIncomeTo('');
        setSelectedPolicyTypes([]); setSelectedPolicySubTypes([]);
        setSelectedPolicyHolderTypes([]); setSelectedSchemes([]); setSelectedAgencies([]);
        setSelectedAMCs([]); setSelectedMutualFundSchemes([]);
        setPolicyPremiumFrom(''); setPolicyPremiumTo(''); setPolicySumAssuredFrom(''); setPolicySumAssuredTo('');
        setPolicyMaturityDate(''); setPolicyCreatedFrom(''); setPolicyCreatedTo('');
        setSelectedWonLeads(false); setSelectedLostLeads(false);
        setActiveGraphs([]); setVisibleColumns([]); setVisibleFilters([]);
    };

    const handleOpenFilterModal = () => {
        setTempSelectedFilters([...visibleFilters]);
        setTempReportMode(reportMode);
        setTempRecordType(recordType);
        setIsFilterModalOpen(true);
    };

    const handleApplyFilters = () => {
        let availableFilterKeys: string[] = [];

        if (tempRecordType === 'lead') {
            availableFilterKeys = LEAD_FILTERS.map(f => f.key);
        } else {
            const newModeFilters = tempReportMode === 'customer' ? CUSTOMER_FILTERS : 
                                  tempReportMode === 'business' ? BUSINESS_FILTERS :
                                  [...CUSTOMER_FILTERS, ...BUSINESS_FILTERS].filter((item, index, self) => 
                                      index === self.findIndex(t => t.key === item.key));
            availableFilterKeys = newModeFilters.map(f => f.key);
        }
        
        const filteredSelectedFilters = tempSelectedFilters.filter(filter => 
            availableFilterKeys.includes(filter)
        );
        
        setVisibleFilters(filteredSelectedFilters);
        setReportMode(tempReportMode);
        setRecordType(tempRecordType);
        setIsFilterModalOpen(false);
        
        if (!availableFilterKeys.includes('customerId')) setSearchCustomerId('');
        if (!availableFilterKeys.includes('customerName')) setSearchCustomerName('');
        if (!availableFilterKeys.includes('familyName')) setSearchFamilyName('');
        if (!availableFilterKeys.includes('mobile')) setSearchMobile('');
        if (!availableFilterKeys.includes('email')) setSearchEmail('');
        if (!availableFilterKeys.includes('tier')) setSelectedTypes([]);
        if (!availableFilterKeys.includes('status')) setSelectedStatuses([]);
        if (!availableFilterKeys.includes('category')) setSelectedCategories([]);
        if (!availableFilterKeys.includes('subCategory')) setSelectedSubCategories([]);
        if (!availableFilterKeys.includes('group')) setSelectedGroups([]);
        if (!availableFilterKeys.includes('gender')) setSelectedGenders([]);
        if (!availableFilterKeys.includes('maritalStatus')) setSelectedMaritalStatuses([]);
        if (!availableFilterKeys.includes('processStage')) setSelectedProcessStages([]);
        if (!availableFilterKeys.includes('religion')) setSelectedReligions([]);
        if (!availableFilterKeys.includes('bloodGroup')) setSelectedBloodGroups([]);
        if (!availableFilterKeys.includes('anniversary')) {
            setAnniversaryFrom('');
            setAnniversaryTo('');
        }
        if (!availableFilterKeys.includes('isConverted')) setSelectedIsConverted([]);
        if (!availableFilterKeys.includes('followUpDate')) {
            setFollowUpFrom('');
            setFollowUpTo('');
        }
        if (!availableFilterKeys.includes('annualIncome')) {
            setAnnualIncomeFrom('');
            setAnnualIncomeTo('');
        }
        if (!availableFilterKeys.includes('policyType')) setSelectedPolicyTypes([]);
        if (!availableFilterKeys.includes('policySubType')) setSelectedPolicySubTypes([]);
        if (!availableFilterKeys.includes('policyHolderType')) setSelectedPolicyHolderTypes([]);
        if (!availableFilterKeys.includes('scheme')) setSelectedSchemes([]);
        if (!availableFilterKeys.includes('agency')) setSelectedAgencies([]);
        if (!availableFilterKeys.includes('amc')) setSelectedAMCs([]);
        if (!availableFilterKeys.includes('mutualFundScheme')) setSelectedMutualFundSchemes([]);
        if (!availableFilterKeys.includes('policyPremiumFrom')) setPolicyPremiumFrom('');
        if (!availableFilterKeys.includes('policyPremiumTo')) setPolicyPremiumTo('');
        if (!availableFilterKeys.includes('policySumAssured')) {
            setPolicySumAssuredFrom('');
            setPolicySumAssuredTo('');
        }
        if (!availableFilterKeys.includes('policyMaturityDate')) setPolicyMaturityDate('');
        if (!availableFilterKeys.includes('policyCreatedDate')) {
            setPolicyCreatedFrom('');
            setPolicyCreatedTo('');
        }
        if (!availableFilterKeys.includes('wonLeads')) setSelectedWonLeads(false);
        if (!availableFilterKeys.includes('lostLeads')) setSelectedLostLeads(false);
    };

    const handleRemoveColumn = (columnKey: string) => {
        setVisibleColumns(prev => prev.filter(col => col !== columnKey));
    };
    
    const resolveParameterValue = (item: ReportItem, parameter: string): string => {
        if ('phone' in item && 'estimatedValue' in item) {
            const lead = item as Lead;
            switch(parameter) {
                case 'status': return lead.status;
                case 'leadSource': return leadSourceMasterMap(lead.leadSource?.sourceId);
                case 'branch': return branches.find(b => b.id === lead.branch_id)?.branch_name || 'N/A';
                case 'advisor': return users.find(u => u.id === lead.assignedTo)?.name || 'N/A';
                case 'businessVertical': return lead.policyInterestType || 'N/A'; 
                default: return 'N/A';
            }
        }

        const member = 'member' in item ? item.member : item as Member;
        let key = 'Unknown';
        switch (parameter) {
            case 'branch': key = branches.find(b => b.id === member.branch_id)?.branch_name || 'Unassigned'; break;
            case 'advisor': key = users.find(u => member.assignedTo.includes(u.id))?.name || 'Unassigned'; break;
            case 'state': key = member.state || 'Unknown'; break;
            case 'tier': key = customerTiers.find(t => t.id === member.tierId)?.name || 'No Tier'; break;
            case 'status': key = member.active ? 'Active' : 'Inactive'; break;
            case 'gender': key = genders.find(g => g.id === member.gender)?.name || 'Not Specified'; break;
            case 'leadSource': key = leadSources.find(ls => ls.id === member.leadSource?.sourceId)?.name || 'Unknown'; break;
            case 'businessVertical':
                if ('policy' in item) { key = businessVerticals.find(bv => bv.id === item.policy.businessVerticalId)?.name || 'N/A'; }
                else if (member.policies.length > 0) { key = businessVerticals.find(bv => bv.id === member.policies[0].businessVerticalId)?.name || 'N/A'; }
                break;
            case 'policyType':
                {
                    const currentPolicy = 'policy' in item ? item.policy : (member.policies.length > 0 ? member.policies[0] : undefined);
                    if (currentPolicy) {
                        if ((currentPolicy as ExtendedPolicy).isMutualFund) {
                            const mfHolding = (currentPolicy as ExtendedPolicy).mfObject;
                            if (mfHolding?.transactions && mfHolding.transactions.length > 0) {
                                const hasRecurring = mfHolding.transactions.some(t => t.type === 'SIP Installment');
                                key = hasRecurring ? 'SIP' : 'Lumpsum';
                            } else {
                                key = 'Lumpsum';
                            }
                        } else {
                            const policySubTypeForType = insuranceTypes.find(it => it.id === currentPolicy.insuranceTypeId);
                            if (policySubTypeForType?.parentId) {
                                const policyTypeInsurance = insuranceTypes.find(it => it.id === policySubTypeForType.parentId);
                                key = policyTypeInsurance?.name || 'N/A';
                            } else {
                                key = policySubTypeForType?.name || 'N/A';
                            }
                        }
                    } else {
                        key = 'N/A';
                    }
                }
                break;
            case 'policySubType':
                if ('policy' in item) {
                    const p = item.policy;
                    if (p.isMutualFund) {
                        key = p.category || 'N/A';
                    } else {
                        const insuranceType = insuranceTypes.find(it => it.id === p.insuranceTypeId && it.parentId);
                        key = insuranceType?.name || 'N/A';
                    }
                } else if (member.policies.length > 0) {
                    const insuranceType = insuranceTypes.find(it => it.id === member.policies[0].insuranceTypeId && it.parentId);
                    key = insuranceType?.name || 'N/A';
                }
                break;
            case 'category': key = customerCategories.find(c => c.id === member.customerCategoryId)?.name || 'No Category'; break;
            case 'subCategory': key = customerSubCategories.find(c => c.id === member.customerSubCategoryId)?.name || 'No Sub-Category'; break;
            case 'group': key = customerGroups.find(c => c.id === member.customerGroupId)?.name || 'No Group'; break;
            case 'religion': key = religions.find(r => r.id === member.religionId)?.name || 'Not Specified'; break;
            case 'policyHolderType':
                if ('policy' in item) { key = item.policy.policyHolderType || 'N/A'; }
                else if (member.policies.length > 0) { key = member.policies[0].policyHolderType || 'N/A'; }
                break;
            case 'agency':
                if ('policy' in item) {
                    const p = item.policy;
                    if(p.isMutualFund) {
                        key = (amcs || []).find(a => a.id === p.agencyId)?.name || 'N/A';
                    } else {
                        const scheme = (schemes || []).find(s => s.id === p.schemeId);
                        key = (agencies || []).find(a => a.id === scheme?.agencyId)?.name || 'N/A';
                    }
                } else if (member.policies.length > 0) {
                    const scheme = (schemes || []).find(s => s.id === member.policies[0].schemeId);
                    key = (agencies || []).find(a => a.id === scheme?.agencyId)?.name || 'N/A';
                }
                break;
            case 'scheme':
                if ('policy' in item) {
                    const p = item.policy;
                    if(p.isMutualFund) {
                        key = (mutualFundSchemes || []).find(s => s.id === p.schemeId)?.name || 'N/A';
                    } else {
                        key = (schemes || []).find(s => s.id === p.schemeId)?.name || 'N/A';
                    }
                } else if (member.policies.length > 0) {
                    key = (schemes || []).find(s => s.id === member.policies[0].schemeId)?.name || 'N/A';
                }
                break;
            default: key = (member as any)[parameter] || 'Unknown';
        }
        return key;
    };

    const generateGraphData = (parameter: string) => {
        const counts: Record<string, number> = {};
        filteredData.forEach(item => {
            const key = resolveParameterValue(item, parameter);
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };

    const handleGraphClick = (data: any, parameter: string) => {
        if (!data) return;
        const clickedName = data.name;
        
        const drillDownMembers = filteredData.filter(item => {
            const itemValue = resolveParameterValue(item, parameter);
            return itemValue === clickedName; 
        });

        setDrillDownData({
            title: `${getColumnHeader(parameter)}: ${clickedName}`,
            data: drillDownMembers
        });
    };

    const getColumnHeader = (key: string): string => {
        const map: Record<string, string> = {
            sno: 'S.No', memberId: 'Customer ID', name: 'Customer Name', customerType: 'Tier Type', status: 'Status', areaCityState: 'Area/City/State', assignedTo: 'Advisor', leadSource: 'Lead Source', isConverted: 'Converted', createdAt: 'Created Date', mobile: 'Mobile', email: 'Email', branch: 'Branch', company: 'Company',
            businessVertical: 'Biz. Vertical', policyNumber: 'Policy No.', policyType: 'Type', policySubType: 'Sub-Type', scheme: 'Scheme', agency: 'Agency', policyHolderType: 'Holder Type', premium: 'Premium', sumAssured: 'Sum Assured', policyStatus: 'Status',
            state: 'State', district: 'District', city: 'City', area: 'Area', tier: 'Tier', category: 'Category', subCategory: 'Sub-Category', group: 'Group', gender: 'Gender', religion: 'Religion', bloodGroup: 'Blood Group', anniversary: 'Anniversary', followUpDate: 'Follow-up Date', annualIncome: 'Annual Income',
            maritalStatus: 'Marital Status', processStage: 'Process Stage', familyName: 'Family Name', country: 'Country',
            policyPremium: 'Premium', policySumAssured: 'Sum Assured', policyMaturityDate: 'Maturity Date', policyCreatedDate: 'Policy Date',
            policyPremiumFrom: 'Start/Inv. Date', policyPremiumTo: 'Renewal/SIP Date'
        };
        return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    const leadSourceMasterMap = (id: string | null | undefined) => leadSources.find(ls => ls.id === id)?.name || 'N/A';

    const getRowCell = (item: ReportItem, key: string, index: number, policy?: ExtendedPolicy): React.ReactNode => {
        if ('phone' in item && 'estimatedValue' in item) {
            const lead = item as Lead;
            switch(key) {
                case 'sno': return index + 1;
                case 'name': return lead.name;
                case 'customerName': return lead.name;
                case 'mobile': return lead.phone;
                case 'email': return lead.email || 'N/A';
                case 'status': return <span className={`px-2 py-1 text-xs rounded-full ${
                    lead.status === 'Won' ? 'bg-green-100 text-green-700' : 
                    lead.status === 'Lost' ? 'bg-red-100 text-red-700' : 
                    'bg-blue-100 text-blue-700'
                }`}>{lead.status}</span>;
                case 'assignedTo': return users.find(u => u.id === lead.assignedTo)?.name || 'N/A';
                case 'advisor': return users.find(u => u.id === lead.assignedTo)?.name || 'N/A';
                case 'leadSource': return leadSourceMasterMap(lead.leadSource?.sourceId);
                case 'branch': return branches.find(b => b.id === lead.branch_id)?.branch_name || 'N/A';
                case 'createdAt': return lead.createdAt ? format(parseISO(lead.createdAt), 'dd-MM-yyyy') : 'N/A';
                case 'followUpDate': return lead.followUpDate ? format(parseISO(lead.followUpDate), 'dd-MM-yyyy') : 'N/A';
                case 'businessVertical': return lead.policyInterestType || 'N/A';
                case 'company': return lead.company || 'N/A';
                case 'country': return 'India';
                case 'state': return 'N/A';
                case 'city': return 'N/A';
                case 'area': return 'N/A';
                default: return 'N/A'; 
            }
        }

        const member = 'member' in item ? item.member : item as Member;
        
        switch (key) {
            case 'sno': return index + 1;
            case 'memberId': return member.memberId;
            case 'customerId': return member.memberId;
            case 'name': return member.name;
            case 'customerName': return member.name;
            case 'customerType': return customerTiers.find(t => t.id === member.tierId)?.name || 'N/A';
            case 'status': return <span className={`px-2 py-1 text-xs rounded-full ${member.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{member.active ? 'Active' : 'Inactive'}</span>;
            case 'areaCityState': return [member.area, member.city, member.state].filter(Boolean).join(', ');
            case 'assignedTo': return users.find(u => member.assignedTo.includes(u.id))?.name || 'N/A';
            case 'advisor': return users.find(u => member.assignedTo.includes(u.id))?.name || 'N/A';
            case 'leadSource': return leadSources.find(ls => ls.id === member.leadSource?.sourceId)?.name || 'N/A';
            case 'isConverted': return (member.isConverted || !member.leadCreatedAt) ? 'Yes' : 'No';
            case 'createdAt': return member.createdAt ? format(parseISO(member.createdAt), 'dd-MM-yyyy') : 'N/A';
            case 'mobile': return member.mobile;
            case 'email': return member.email || 'N/A';
            case 'branch': return branches.find(b => b.id === member.branch_id)?.branch_name || 'N/A';
            case 'company': return member.company;
            case 'country': return member.country || 'N/A';
            case 'bloodGroup': return member.bloodGroup || 'N/A';
            case 'gender': return genders.find(g => g.id === member.gender)?.name || 'N/A';
            case 'religion': return religions.find(r => r.id === member.religionId)?.name || 'N/A';
            case 'category': return customerCategories.find(c => c.id === member.customerCategoryId)?.name || 'N/A';
            case 'subCategory': return customerSubCategories.find(c => c.id === member.customerSubCategoryId)?.name || 'No Sub-Category';
            case 'group': return customerGroups.find(c => c.id === member.customerGroupId)?.name || 'N/A';
            case 'anniversary': return member.anniversary ? format(parseISO(member.anniversary), 'dd-MM-yyyy') : 'N/A';
            case 'followUpDate': return member.followUpDate ? format(parseISO(member.followUpDate), 'dd-MM-yyyy') : 'N/A';
            case 'annualIncome': return member.financialProfile?.annualIncome?.toLocaleString('en-IN') || 'N/A';
            case 'state': return member.state || 'N/A';
            case 'district': return member.district || 'N/A';
            case 'city': return member.city || 'N/A';
            case 'area': return member.area || 'N/A';
            case 'tier': return customerTiers.find(t => t.id === member.tierId)?.name || 'N/A';
            case 'maritalStatus': return maritalStatuses.find(ms => ms.id === member.maritalStatus)?.name || 'N/A';
            case 'processStage': return processStageMasters.find(ps => ps.id === member.processStage)?.name || 'N/A';
            case 'familyName': return member.familyName || 'N/A';

            case 'businessVertical': {
                const getVerticalName = (pol: ExtendedPolicy) => {
                     if (pol.businessVerticalId) {
                         const bv = businessVerticals.find(b => b.id === pol.businessVerticalId);
                         if (bv) return bv.name;
                     }
                     const iType = insuranceTypes.find(t => t.id === pol.insuranceTypeId);
                     if (iType) {
                         if (iType.verticalId) {
                              const bv = businessVerticals.find(b => b.id === iType.verticalId);
                              if (bv) return bv.name;
                         }
                         if (iType.parentId) {
                             const pType = insuranceTypes.find(t => t.id === iType.parentId);
                             if (pType && pType.verticalId) {
                                  const bv = businessVerticals.find(b => b.id === pType.verticalId);
                                  if (bv) return bv.name;
                             }
                         }
                     }
                     return null;
                };

                if (policy) return getVerticalName(policy) || 'N/A';
                
                const allMemberItems: ExtendedPolicy[] = [];
                (member.policies || []).forEach(p => allMemberItems.push(p));
                (member.mutualFundHoldings || []).forEach(mf => {
                     const scheme = mutualFundSchemes.find(s => s.id === mf.schemeId);
                     const amc = scheme ? amcs.find(a => a.id === scheme.amcId) : null;
                     allMemberItems.push({ 
                         ...mf, 
                         businessVerticalId: amc?.verticalId, 
                         isMutualFund: true 
                     } as unknown as ExtendedPolicy);
                });

                const displayedPolicies = reportSnapshot 
                    ? allMemberItems.filter(p => isPolicyMatch(p, reportSnapshot))
                    : allMemberItems;

                const uniqueNames = Array.from(new Set(displayedPolicies.map(p => getVerticalName(p)).filter(Boolean)));
                return uniqueNames.length > 0 ? uniqueNames.join(' / ') : 'N/A';
            }
            case 'policyNumber': return policy?.policyNumber || 'N/A';
            case 'policyType': {
                if (policy?.isMutualFund) {
                    return policy.policyType || 'Lumpsum';
                }
                const policySubTypeForType = insuranceTypes.find(it => it.id === policy?.insuranceTypeId);
                if (policySubTypeForType?.parentId) {
                    const policyTypeInsurance = insuranceTypes.find(it => it.id === policySubTypeForType.parentId);
                    return policyTypeInsurance?.name || 'N/A';
                }
                return policySubTypeForType?.name || 'N/A';
            }
            case 'policySubType': {
                if (policy?.isMutualFund) return policy.category || 'N/A';
                const policySubTypeInsurance = insuranceTypes.find(it => it.id === policy?.insuranceTypeId && it.parentId);
                return policySubTypeInsurance?.name || 'N/A';
            }
            case 'scheme': {
                if(policy?.isMutualFund) return (mutualFundSchemes || []).find(s => s.id === policy.schemeId)?.name || 'N/A';
                return (schemes || []).find(s => s.id === policy?.schemeId)?.name || 'N/A';
            }
            case 'agency': {
                if(policy?.isMutualFund) return (amcs || []).find(a => a.id === policy.agencyId)?.name || 'N/A';
                return (agencies || []).find(a => a.id === (schemes || []).find(s => s.id === policy?.schemeId)?.agencyId)?.name || 'N/A';
            }
            case 'policyHolderType': return policy?.policyHolderType || 'N/A';
            case 'premium': return policy?.premium.toLocaleString('en-IN') || 'N/A';
            case 'sumAssured': return policy?.coverage.toLocaleString('en-IN') || 'N/A';
            case 'policyStatus': return policy?.status || 'N/A';
            case 'policyMaturityDate': return policy?.maturityDate ? format(parseISO(policy.maturityDate), 'dd-MM-yyyy') : 'N/A';
            case 'policyCreatedDate': 
                if (policy?.startDate) {
                    return format(parseISO(policy.startDate), 'dd-MM-yyyy');
                }
                return policy?.policyCreatedDate ? format(parseISO(policy.policyCreatedDate), 'dd-MM-yyyy') : 'N/A';
            case 'policyPremium': return policy?.premium.toLocaleString('en-IN') || 'N/A';
            case 'policySumAssured': return policy?.coverage.toLocaleString('en-IN') || 'N/A';
            case 'policyPremiumFrom': return policy?.startDate ? format(parseISO(policy.startDate), 'dd-MM-yyyy') : 'N/A';
            case 'policyPremiumTo': {
                if (policy?.isMutualFund) {
                    return policy.renewalDate || 'N/A';
                }
                return policy?.renewalDate ? format(parseISO(policy.renewalDate), 'dd-MM-yyyy') : 'N/A';
            }

            default: return 'N/A';
        }
    };
    
    const getExportRow = (item: ReportItem, index: number, policy?: ExtendedPolicy) => {
        return visibleColumns.map(key => {
            const node = getRowCell(item, key, index, policy);
            if (React.isValidElement(node)) {
                return (node.props as any)?.children || String(node);
            }
            return String(node);
        });
    };

    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const headers = [visibleColumns.map(key => getColumnHeader(key))];
        const data = filteredData.map((item, i) => {
            const policy = 'policy' in item ? item.policy : undefined;
            return getExportRow(item, i, policy);
        });
        
        doc.text("Advanced Report", 14, 15);
        doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 22);
        
        (doc as jsPDFWithAutoTable).autoTable({
            head: headers, body: data, startY: 35, theme: 'grid', styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [41, 128, 185] }
        });
        doc.save(`${reportMode}_report.pdf`);
    };

    const exportCSV = () => {
        const headers = visibleColumns.map(key => getColumnHeader(key));
        const data = filteredData.map((item, i) => {
            const policy = 'policy' in item ? item.policy : undefined;
            return getExportRow(item, i, policy);
        });

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reportMode}_report.csv`;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const headers = visibleColumns.map(key => getColumnHeader(key));
        const data = filteredData.map((item, i) => {
            const policy = 'policy' in item ? item.policy : undefined;
            return getExportRow(item, i, policy);
        });

        const reportTitle = `${reportMode === 'customer' ? 'Customer' : reportMode === 'business' ? 'Business' : 'Combined'} Report${recordType === 'lead' ? ' - Leads' : ''}`;
        const dateRange = `${dateFrom ? format(parseISO(dateFrom), 'dd/MM/yyyy') : 'N/A'} to ${dateTo ? format(parseISO(dateTo), 'dd/MM/yyyy') : 'N/A'}`;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportTitle}</title>
                <style>
                    @media print {
                        body { margin: 0; font-family: Arial, sans-serif; font-size: 12px; }
                        .no-print { display: none !important; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; font-weight: bold; }
                        .header { margin-bottom: 20px; }
                        .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                        .subtitle { font-size: 14px; color: #666; }
                        @page { margin: 1cm; }
                    }
                    body { margin: 20px; font-family: Arial, sans-serif; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .header { margin-bottom: 20px; }
                    .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                    .subtitle { font-size: 14px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">${reportTitle}</div>
                    <div class="subtitle">Date Range: ${dateRange}</div>
                    <div class="subtitle">Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
                    <div class="subtitle">Total Records: ${filteredData.length}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => 
                            `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`
                        ).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="space-y-6 pb-20 relative">
            {}
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                    </filter>
                </defs>
            </svg>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BarChart3 size={24} /> 
                        {reportMode === 'customer' ? 'Customer Insights' : reportMode === 'business' ? 'Business Insights' : 'Combined Insights'}
                        {recordType === 'lead' && <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded ml-2">Leads</span>}
                    </h2>
                    <Button variant="ghost" size="small" onClick={handleOpenFilterModal}>Change Report / Filters</Button>
                </div>
                {reportSnapshot && (
                    <div className="text-sm text-gray-500">
                        Total Rows: {filteredData.length}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border dark:border-gray-700">
                 <div className="flex items-center justify-between mb-4 border-b dark:border-gray-700 pb-2">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Filter size={18} /> Search Parameters
                    </div>
                    {errorMsg && <div className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> {errorMsg}</div>}
                </div>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-48"><Input label="Created From Date *" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                    <div className="w-48"><Input label="Created End Date *" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                    <button onClick={handleOpenFilterModal} className="mb-1 p-2 rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors" title="Add Filters">
                        <Plus size={18} /> <span className="text-sm font-medium">Add/Edit Filters</span>
                    </button>
                    {(visibleFilters.length > 0 || dateFrom || dateTo) && (
                        <button onClick={handleReset} className="mb-1 px-4 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">Clear All</button>
                    )}
                </div>

                {visibleFilters.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fadeIn border-t dark:border-gray-700 pt-4">
                        {}
                        {visibleFilters.includes('customerId') && <Input label="Customer ID" value={searchCustomerId} onChange={e => setSearchCustomerId(e.target.value)} />}
                        {visibleFilters.includes('customerName') && <Input label={recordType === 'lead' ? "Lead Name" : "Customer Name"} value={searchCustomerName} onChange={e => setSearchCustomerName(e.target.value)} />}
                        {visibleFilters.includes('familyName') && <Input label="Family Name" value={searchFamilyName} onChange={e => setSearchFamilyName(e.target.value)} />}
                        {visibleFilters.includes('mobile') && <Input label="Mobile" value={searchMobile} onChange={e => setSearchMobile(e.target.value)} />}
                        {visibleFilters.includes('email') && <Input label="Email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />}
                        {visibleFilters.includes('state') && <MultiSelectDropdown label="State" selectedValues={selectedStates} onChange={setSelectedStates} options={stateOptions} />}
                        {visibleFilters.includes('district') && <MultiSelectDropdown label="District" selectedValues={selectedDistricts} onChange={setSelectedDistricts} options={districtOptions} />}
                        {visibleFilters.includes('city') && <MultiSelectDropdown label="City" selectedValues={selectedCities} onChange={setSelectedCities} options={cityOptions} />}
                        {visibleFilters.includes('area') && <MultiSelectDropdown label="Area" selectedValues={selectedAreas} onChange={setSelectedAreas} options={areaOptions} />}
                        {visibleFilters.includes('branch') && <MultiSelectDropdown label="Branch" options={branchOptions} selectedValues={selectedBranches} onChange={setSelectedBranches} />}
                        {visibleFilters.includes('advisor') && <MultiSelectDropdown label={recordType === 'lead' ? "Assigned To" : "Advisor"} options={advisorOptions} selectedValues={selectedAdvisors} onChange={setSelectedAdvisors} />}
                        {visibleFilters.includes('tier') && <MultiSelectDropdown label="Tier Type" selectedValues={selectedTypes} onChange={setSelectedTypes} options={tierOptions} />}
                        {visibleFilters.includes('status') && <MultiSelectDropdown label="Status" selectedValues={selectedStatuses} onChange={setSelectedStatuses} options={statusOptions} />}
                        {visibleFilters.includes('category') && <MultiSelectDropdown label="Category" selectedValues={selectedCategories} onChange={(val) => { setSelectedCategories(val); setSelectedSubCategories([]); }} options={categoryOptions} />}
                        {visibleFilters.includes('subCategory') && <MultiSelectDropdown label="Sub-Category" selectedValues={selectedSubCategories} onChange={setSelectedSubCategories} options={subCategoryOptions} placeholder={selectedCategories.length === 0 ? "Select Category first" : "Select..."} />}
                        {visibleFilters.includes('group') && <MultiSelectDropdown label="Group" selectedValues={selectedGroups} onChange={setSelectedGroups} options={groupOptions} />}
                        {visibleFilters.includes('gender') && <MultiSelectDropdown label="Gender" selectedValues={selectedGenders} onChange={setSelectedGenders} options={genderOptions} />}
                        {visibleFilters.includes('maritalStatus') && <MultiSelectDropdown label="Marital Status" selectedValues={selectedMaritalStatuses} onChange={setSelectedMaritalStatuses} options={maritalStatusOptions} />}
                        {visibleFilters.includes('processStage') && <MultiSelectDropdown label="Process Flow Stage" selectedValues={selectedProcessStages} onChange={setSelectedProcessStages} options={processStageOptions} />}
                        {visibleFilters.includes('leadSource') && <>
                            <MultiSelectDropdown label="Lead Source (Main)" selectedValues={selectedParentSources} onChange={(val) => { setSelectedParentSources(val); setSelectedChildSources([]); }} options={parentSourceOptions} />
                            <MultiSelectDropdown label="Lead Source (Sub)" selectedValues={selectedChildSources} onChange={setSelectedChildSources} options={childSourceOptions} placeholder={selectedParentSources.length === 0 ? "Select Main Source first" : "Select..."} />
                        </>}
                        {visibleFilters.includes('religion') && <MultiSelectDropdown label="Religion" selectedValues={selectedReligions} onChange={setSelectedReligions} options={religionOptions} />}
                        {visibleFilters.includes('bloodGroup') && <MultiSelectDropdown label="Blood Group" selectedValues={selectedBloodGroups} onChange={setSelectedBloodGroups} options={bloodGroupOptions} />}
                        {visibleFilters.includes('anniversary') && <><Input label="Anniversary From" type="date" value={anniversaryFrom} onChange={e => setAnniversaryFrom(e.target.value)} /><Input label="Anniversary To" type="date" value={anniversaryTo} onChange={e => setAnniversaryTo(e.target.value)} /></>}
                        {visibleFilters.includes('isConverted') && <MultiSelectDropdown label="Is Converted" selectedValues={selectedIsConverted} onChange={setSelectedIsConverted} options={isConvertedOptions} />}
                        {visibleFilters.includes('followUpDate') && <><Input label="Follow-up From" type="date" value={followUpFrom} onChange={e => setFollowUpFrom(e.target.value)} /><Input label="Follow-up To" type="date" value={followUpTo} onChange={e => setFollowUpTo(e.target.value)} /></>}
                        {visibleFilters.includes('annualIncome') && <><Input label="Annual Income From" type="number" placeholder="e.g. 500000" value={annualIncomeFrom} onChange={e => setAnnualIncomeFrom(e.target.value)} /><Input label="Annual Income To" type="number" placeholder="e.g. 1000000" value={annualIncomeTo} onChange={e => setAnnualIncomeTo(e.target.value)} /></>}
                        {visibleFilters.includes('businessVertical') && <MultiSelectDropdown label="Business Vertical" selectedValues={selectedBusinessVerticals} onChange={setSelectedBusinessVerticals} options={businessVerticalOptions} />}
                        {visibleFilters.includes('policyType') && <MultiSelectDropdown label="Policy Type" selectedValues={selectedPolicyTypes} onChange={setSelectedPolicyTypes} options={policyTypeOptions} />}
                        {visibleFilters.includes('policySubType') && <MultiSelectDropdown label="Policy Sub-Type" selectedValues={selectedPolicySubTypes} onChange={setSelectedPolicySubTypes} options={policySubTypeOptions} />}
                        {visibleFilters.includes('policyHolderType') && <MultiSelectDropdown label="Policy Holder Type" selectedValues={selectedPolicyHolderTypes} onChange={setSelectedPolicyHolderTypes} options={policyHolderTypeOptions} />}
                        {visibleFilters.includes('scheme') && <MultiSelectDropdown label="Scheme" selectedValues={selectedSchemes} onChange={setSelectedSchemes} options={schemeOptions} />}
                        {visibleFilters.includes('agency') && <MultiSelectDropdown label="Agency" selectedValues={selectedAgencies} onChange={setSelectedAgencies} options={agencyOptions} />}
                        {visibleFilters.includes('amc') && <MultiSelectDropdown label="AMC" selectedValues={selectedAMCs} onChange={setSelectedAMCs} options={amcOptions} />}
                        {visibleFilters.includes('mutualFundScheme') && <MultiSelectDropdown label="Mutual Fund Scheme" selectedValues={selectedMutualFundSchemes} onChange={setSelectedMutualFundSchemes} options={mutualFundSchemeOptions} />}
                        {visibleFilters.includes('policyPremiumFrom') && <Input label="Premium From (Start Date)" type="date" value={policyPremiumFrom} onChange={e => setPolicyPremiumFrom(e.target.value)} />}
                        {visibleFilters.includes('policyPremiumTo') && <Input label="Premium To (Renewal Date)" type="date" value={policyPremiumTo} onChange={e => setPolicyPremiumTo(e.target.value)} />}
                        {visibleFilters.includes('policySumAssured') && <Input label="Sum Assured Below" type="number" placeholder="Show policies below this amount" value={policySumAssuredFrom} onChange={e => setPolicySumAssuredFrom(e.target.value)} />}
                        {visibleFilters.includes('policyMaturityDate') && <Input label="Maturity Date" type="date" value={policyMaturityDate} onChange={e => setPolicyMaturityDate(e.target.value)} />}
                        {visibleFilters.includes('policyCreatedDate') && <><Input label="Policy Created From" type="date" value={policyCreatedFrom} onChange={e => setPolicyCreatedFrom(e.target.value)} /><Input label="Policy Created To" type="date" value={policyCreatedTo} onChange={e => setPolicyCreatedTo(e.target.value)} /></>}
                        {visibleFilters.includes('wonLeads') && (
                            <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                <input type="checkbox" checked={selectedWonLeads} onChange={e => setSelectedWonLeads(e.target.checked)} className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Won Leads</span>
                            </label>
                        )}
                        {visibleFilters.includes('lostLeads') && (
                            <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                <input type="checkbox" checked={selectedLostLeads} onChange={e => setSelectedLostLeads(e.target.checked)} className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Lost Leads</span>
                            </label>
                        )}
                    </div>
                )}
                <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <Button variant="secondary" onClick={handleReset} className="py-3 px-6 text-base"><X size={18} className="mr-2" /> Clear</Button>
                    <Button variant="primary" onClick={handleSearch} className="py-3 px-8 text-base"><Search size={18} className="mr-2" /> Generate Report</Button>
                </div>
            </div>

            {reportSnapshot && (
                <div className="space-y-6 animate-fadeIn">
                     {activeGraphs.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeGraphs.map((param) => {
                                const data = generateGraphData(param);
                                const label = getColumnHeader(param);
                                const type = graphTypes[param] || 'pie'; 
                                if (data.length === 0) return null;

                                return (
                                    <div key={param} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 min-h-[400px]">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{label} Distribution</h3>
                                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
                                                <button className={`p-1 rounded ${type === 'pie' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} onClick={() => setGraphTypes(prev => ({ ...prev, [param]: 'pie' }))}><PieChartIcon size={16} /></button>
                                                <button className={`p-1 rounded ${type === 'bar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} onClick={() => setGraphTypes(prev => ({ ...prev, [param]: 'bar' }))}><BarChart3 size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="h-[320px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {type === 'bar' ? (
                                                    <BarChart data={data} onClick={(state: any) => state && state.activePayload && handleGraphClick(state.activePayload[0].payload, param)}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                        <YAxis />
                                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                                        <Bar dataKey="value" name="Count" fill="#3B82F6" cursor="pointer" filter="url(#shadow)">
                                                            {data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                                        </Bar>
                                                    </BarChart>
                                                ) : (
                                                    <PieChart>
                                                        <Pie 
                                                            data={data} 
                                                            innerRadius={60} 
                                                            outerRadius={80} 
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            label={renderCustomizedLabel}
                                                            labelLine={true}
                                                            onClick={(state) => handleGraphClick(state, param)}
                                                            cursor="pointer"
                                                            filter="url(#shadow)"
                                                        >
                                                            {data.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                                    </PieChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-center text-xs text-gray-400 mt-4 italic">Click graph elements to view details</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border dark:border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="font-semibold text-gray-800 dark:text-white">Detailed Report List</div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={exportPDF} disabled={filteredData.length === 0}><Download size={16} /> PDF</Button>
                                <Button variant="ghost" onClick={exportCSV} disabled={filteredData.length === 0}><Download size={16} /> CSV</Button>
                                <Button variant="ghost" onClick={handlePrint} disabled={filteredData.length === 0}><Printer size={16} /> Print</Button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        {visibleColumns.map(key => (
                                            <th key={key} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-200 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getColumnHeader(key)}
                                                    <button onClick={() => handleRemoveColumn(key)} title={`Remove ${getColumnHeader(key)} column`} className="text-gray-400 hover:text-red-500">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    {filteredData.length === 0 && (
                                        <tr><td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-gray-500"><FileX size={40} className="mx-auto mb-3 opacity-40"/><span className="text-lg font-medium">No records found.</span></td></tr>
                                    )}
                                    {filteredData.map((item, i) => {
                                        const policy = 'policy' in item ? item.policy : undefined;
                                        const rowKey = 'policy' in item ? `${item.member.id}-${item.policy.id}` : ('id' in item ? item.id : i);
                                        return <tr key={rowKey} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">{visibleColumns.map(key => <td key={key} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{getRowCell(item, key, i, policy)}</td>)}</tr>
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {isFilterModalOpen && (
                <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-6xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Configure Report & Filters</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
                        </div>
                        
                        <div className="p-4 border-b dark:border-gray-700">
                             <div className="flex items-center gap-6 mb-4">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-200">1. Select Record Type</h4>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="recordType" className="w-4 h-4 text-blue-600" checked={tempRecordType === 'customer'} onChange={() => { setTempRecordType('customer'); setTempReportMode('customer'); setTempSelectedFilters([]); }} />
                                        <span className="text-gray-700 dark:text-gray-300">Customers</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="recordType" className="w-4 h-4 text-blue-600" checked={tempRecordType === 'lead'} onChange={() => { setTempRecordType('lead'); setTempReportMode('customer'); setTempSelectedFilters([]); }} />
                                        <span className="text-gray-700 dark:text-gray-300">Leads</span>
                                    </label>
                                </div>
                             </div>

                             {tempRecordType === 'customer' && (
                                 <>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">2. Select Report Mode</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <button onClick={() => setTempReportMode('customer')} className={`p-3 border rounded-lg text-center transition-all ${tempReportMode === 'customer' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-gray-700 dark:border-gray-600'}`}>
                                            <Users className="mx-auto mb-1" size={20}/><span className="text-sm font-semibold">Customer View</span>
                                        </button>
                                        <button onClick={() => setTempReportMode('business')} className={`p-3 border rounded-lg text-center transition-all ${tempReportMode === 'business' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-gray-700 dark:border-gray-600'}`}>
                                            <Briefcase className="mx-auto mb-1" size={20}/><span className="text-sm font-semibold">Business Vertical View</span>
                                        </button>
                                        <button onClick={() => setTempReportMode('combined')} className={`p-3 border rounded-lg text-center transition-all ${tempReportMode === 'combined' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-gray-700 dark:border-gray-600'}`}>
                                            <Combine className="mx-auto mb-1" size={20}/><span className="text-sm font-semibold">Combined View</span>
                                        </button>
                                    </div>
                                </>
                             )}
                             {tempRecordType === 'lead' && (
                                 <div className="p-3 bg-blue-50 dark:bg-gray-900/50 rounded text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                     <UserPlus size={16} /> Lead Reports focus on tracking potential customers and their interests.
                                 </div>
                             )}
                        </div>

                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                             <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                                 {tempRecordType === 'customer' ? '3' : '2'}. Select Filters to Display
                             </h4>
                             <div className="flex gap-2">
                                <button onClick={() => setTempSelectedFilters(FILTER_OPTIONS.map(o => o.key))} className="text-xs font-medium text-blue-600 hover:underline">Select All</button>
                                <button onClick={() => setTempSelectedFilters([])} className="text-xs font-medium text-gray-600 hover:underline">Deselect All</button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 max-h-96">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {FILTER_OPTIONS.map(opt => (
                                    <label key={opt.key} className="flex items-center gap-3 p-3 rounded border hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${tempSelectedFilters.includes(opt.key) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-400'}`}>
                                            {tempSelectedFilters.includes(opt.key) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={tempSelectedFilters.includes(opt.key)} onChange={() => setTempSelectedFilters(prev => prev.includes(opt.key) ? prev.filter(k => k !== opt.key) : [...prev, opt.key])} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800 sticky bottom-0">
                            <Button variant="secondary" onClick={() => setIsFilterModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleApplyFilters}>Apply Filters</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {drillDownData && (
                 <Modal isOpen={!!drillDownData} onClose={() => setDrillDownData(null)}>
                     <div className="bg-white dark:bg-gray-800 w-full max-w-7xl rounded-lg shadow-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2"><Search size={20} className="text-blue-600"/> {drillDownData.title}</h3>
                            <button onClick={() => setDrillDownData(null)} className="text-gray-500 hover:text-red-500 transition-colors bg-white dark:bg-gray-600 rounded-full p-1 shadow-sm"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm"><tr>{['S.No', 'ID', 'Name', 'Mobile', 'Email', 'City'].map(h => <th key={h} className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-200">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {drillDownData.data.map((item, i) => {
                                        if('phone' in item && 'estimatedValue' in item) {
                                            const lead = item as Lead;
                                            return (
                                                <tr key={lead.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-3 text-gray-500">{i+1}</td>
                                                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">N/A</td>
                                                    <td className="px-6 py-3 text-blue-600 dark:text-blue-400 font-medium">{lead.name}</td>
                                                    <td className="px-6 py-3 text-gray-500">{lead.phone}</td>
                                                    <td className="px-6 py-3 text-gray-500">{lead.email || '-'}</td>
                                                    <td className="px-6 py-3 text-gray-500">N/A</td>
                                                </tr>
                                            )
                                        }
                                        const member = 'member' in item ? item.member : item as Member;
                                        return (
                                            <tr key={member.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-3 text-gray-500">{i+1}</td>
                                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{member.memberId}</td>
                                                <td className="px-6 py-3 text-blue-600 dark:text-blue-400 font-medium">{member.name}</td>
                                                <td className="px-6 py-3 text-gray-500">{member.mobile}</td>
                                                <td className="px-6 py-3 text-gray-500">{member.email || '-'}</td>
                                                <td className="px-6 py-3 text-gray-500">{member.city}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <span className="text-sm text-gray-500">Showing {drillDownData.data.length} records</span>
                            <Button onClick={() => setDrillDownData(null)}>Close</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
export default AdvancedReports;