import { 
    Member, Policy, PolicyType, Lead, User, Route, ProcessStage, EmployeeProfile, Company, 
    Branch, Religion, Festival, FestivalDate, AdvisorLocation, CheckIn, 
    CheckInOutcome, UpsellCategory, Designation, RolePermissions, AppModule, PermissionLevel, 
    Gender, MaritalStatus, CustomerType, CustomerTier, ProcessStageMaster, RelationshipType,
    FinancialYear, DocumentNumbering, Role, 
    InsuranceTypeDocumentRule,
    LeadStageMaster, 
    OccasionTypeMaster,
    CampaignMaster,
    OpeningBalance,
    AccountCategory, AccountSubCategory, AccountHead
} from '../types.ts';

import {
    initialAutomationRules,
    initialDocTemplates,
    generateInitialGeographies,
    initialCompanyInfo,
    initialBankMasters,
    initialBusinessVerticals,
    initialLeadSources,
    initialAgencies,
    initialSchemes,
    initialDocumentMasters,
    initialGiftMasters,
    initialTaskStatusMasters,
    initialCustomerCategories,
    initialCustomerSubCategories,
    initialCustomerGroups,
    initialTaskMasters,
    initialCustomerFields,
    initialMutualFundFields,
    initialAccountTypes,
    initialInsuranceTypes,
    initialInsuranceFields,
    initialTasks,
    initialExpenses,
    initialManualIncomes,
    initialManualCommissions,
    initialAmcs,
    initialMutualFundSchemes,
    initialReceipts,
    initialOpeningBalances,
    initialAccountCategories,
    initialAccountSubCategories,
    initialAccountHeads
} from '../data/initialData.tsx';


let financialYearsData: FinancialYear[] = [
    { id: 'fy-1', finYear: '2024-2025', fromDate: '2024-04-01', toDate: '2025-03-31', status: 'Inactive' },
    { id: 'fy-2', finYear: '2025-2026', fromDate: '2025-04-01', toDate: '2026-03-31', status: 'Active' },
];

let documentNumberingData: DocumentNumbering[] = [
    { id: 'dn-1', type: 'Voucher', prefix: 'VCH/24-25/', suffix: null, startingNumber: 1, finYearId: 'fy-1', status: 'Active' },
    { id: 'dn-2', type: 'Voucher', prefix: 'VOUCHER/', suffix: '/25-26', startingNumber: 1001, finYearId: 'fy-2', status: 'Active' },
    { id: 'dn-3', type: 'Receipt', prefix: 'RECPT/24-25/', suffix: null, startingNumber: 1, finYearId: 'fy-1', status: 'Active' },
    { id: 'dn-4', type: 'Receipt', prefix: 'REC/', suffix: '/25-26', startingNumber: 500, finYearId: 'fy-2', status: 'Active' },
];

let campaignsData: CampaignMaster[] = [
    { id: 'camp-1', name: 'Diwali Bonanza', description: 'Special offers for the festive season', startDate: '2024-10-01', endDate: '2024-11-15', active: true, order: 0 },
    { id: 'camp-2', name: 'Year End Drive', description: 'Closing financial year targets', startDate: '2024-12-01', endDate: '2024-12-31', active: true, order: 1 },
];

let accountCategoriesData: AccountCategory[] = initialAccountCategories;
let accountSubCategoriesData: AccountSubCategory[] = initialAccountSubCategories;
let accountHeadsData: AccountHead[] = initialAccountHeads;


const LS_OPERATING_COMPANIES_KEY = '-operatingCompanies';

let designationsData: Designation[] = [
    { id: 'des-admin', name: 'Admin', active: true, order: 0 },
    { id: 'des-advisor', name: 'Advisor', active: true, order: 1 },
    { id: 'des-secretary', name: 'Secretary', active: true, order: 2 },
    { id: 'des-support', name: 'Support', active: true, order: 3 },
    { id: 'des-security', name: 'Security', active: true, order: 4 }, 
];

let rolesData: Role[] = [
    { id: 'role-admin', name: 'System Administrator', isAdvisor: false, active: true, order: 0 },
    { id: 'role-advisor', name: 'Sales Advisor', isAdvisor: true, active: true, order: 1 },
    { id: 'role-secretary', name: 'Office Secretary', isAdvisor: false, active: true, order: 2 },
    { id: 'role-support', name: 'Support Staff', isAdvisor: false, active: true, order: 3 },
];

let insuranceTypeDocumentRulesData: InsuranceTypeDocumentRule[] = [
    { id: 'rule-1', insuranceTypeId: 'it-life', documentId: 'doc-1', isMandatory: true },
    { id: 'rule-2', insuranceTypeId: 'it-life', documentId: 'doc-2', isMandatory: true },
    { id: 'rule-3', insuranceTypeId: 'it-term', documentId: 'doc-5', isMandatory: false },
    { id: 'rule-4', insuranceTypeId: 'it-health', documentId: 'doc-2', isMandatory: true },
    { id: 'rule-5', insuranceTypeId: 'it-motor', documentId: 'doc-4', isMandatory: true },
];


let rolePermissionsData: RolePermissions[] = [
    {
        roleId: 'role-admin',
        permissions: { 
            dashboard: 'modify', 'reports & insights': 'modify', incomeAndExpense: 'modify', accounts: 'modify', calendar: 'modify', employees: 'modify', 
            pipeline: 'modify', customers: 'modify', taskManagement: 'modify', policies: 'modify', mutualFunds: 'modify', 
            CrossSelling: 'modify', notes: 'modify', actionHub: 'modify', servicesHub: 'modify', location: 'modify', 
            chatbot: 'modify', masterData: 'modify', advancedReports: 'modify', campaign: 'modify'
        }
    },
    {
        roleId: 'role-advisor',
        permissions: { 
            dashboard: 'view', 'reports & insights': 'view', incomeAndExpense: 'create', accounts: 'none', calendar: 'view', employees: 'none',
            pipeline: 'modify', customers: 'modify', taskManagement: 'modify', policies: 'modify', mutualFunds: 'modify',
            CrossSelling: 'view', notes: 'modify', actionHub: 'modify', servicesHub: 'view', location: 'modify',
            chatbot: 'modify', masterData: 'none', advancedReports: 'none', campaign: 'view'
        }
    },
    {
        roleId: 'role-secretary',
        permissions: { 
            dashboard: 'view', 'reports & insights': 'none', incomeAndExpense: 'none', accounts: 'none', calendar: 'create', employees: 'none',
            pipeline: 'none', customers: 'create', taskManagement: 'create', policies: 'view', mutualFunds: 'none',
            CrossSelling: 'none', notes: 'create', actionHub: 'none', servicesHub: 'none', location: 'none',
            chatbot: 'none', masterData: 'none', advancedReports: 'none', campaign: 'none'
        }
    },
    {
        roleId: 'role-support',
        permissions: { 
            dashboard: 'view', 'reports & insights': 'view', incomeAndExpense: 'none', accounts: 'none', calendar: 'view', employees: 'view',
            pipeline: 'view', customers: 'view', taskManagement: 'view', policies: 'view', mutualFunds: 'view',
            CrossSelling: 'view', notes: 'view', actionHub: 'view', servicesHub: 'view', location: 'none',
            chatbot: 'view', masterData: 'none', advancedReports: 'none', campaign: 'none'
        }
    }
];


const BranchesData: Branch[] = [
    { id: 'frb-1', branch_name: 'Erode HQ', branch_id: 'FIN01-ERD', companyMappings: [], active: true, comp_id: 'FIN01', gstin: '33ABCDE1234F1Z5', pan: 'ABCDE1234F', tan: 'ERDF12345G' },
    { id: 'frb-2', branch_name: 'Coimbatore Hub', branch_id: 'FIN01-CBE', companyMappings: [], active: true, comp_id: 'FIN01', gstin: '33ABCDE1234F1Z6', pan: 'ABCDE1234F', tan: 'CBEF12345G' },
];

const initialCompanies: Company[] = [
    {
        id: 'FIN01',
        comp_code: 'FIN01',
        name: 'Finroots',
        mailingName: 'Finroots Financial Services Pvt. Ltd.',
        dateOfCreation: '2020-01-01',
        active: true,
        address: {
            line1: '123 Financial Street',
            line2: 'Bandstand',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400050'
        },
        contact: {
            phoneNo: '+91 22 12345678',
            emailId: 'info@finroots.com'
        },
        gstin: '27ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        tan: 'MUMF12345G'
    }
];

const initialUsers: User[] = [
    {
        id: 'user-1',
        employeeId: 'admin',
        name: 'Admin',
        email: 'admin@finroots.com',
        role: 'Admin', 
        designationId: 'des-admin',
        roleId: 'role-admin', 
        company: 'Finroots',
        comp_id: 'FIN01',
        initials: 'AU',
         password: 'admin',
        profile: { 
            status: 'Active', 
            comp_id: 'FIN01',
            permissions: {}
        }
    },
    {
    id: 'user-secretary',
    employeeId: 'secretary',
    name: 'Secretary User',
    email: 'secretary@finroots.com',
    role: 'Secretary',
    designationId: 'des-secretary',
    roleId: 'role-secretary', 
    company: 'Finroots',
    comp_id: 'FIN01',
    initials: 'SU',
       password: 'secretary',
    profile: { 
        status: 'Active', 
        comp_id: 'FIN01',
        permissions: {}
    }
    },
    {
        id: 'user-2',
        employeeId: '1002',
        name: 'Rohan Patel',
        email: 'rohan.p@finroots.com',
        role: 'Advisor',
        designationId: 'des-advisor',
        roleId: 'role-advisor', 
        company: 'Finroots',
        comp_id: 'FIN01',
        initials: 'RP',
         password: 'password',
        profile: {
            status: 'Active',
            specializations: [],
            comp_id: 'FIN01',
            employeebranch_id: 'frb-1', 
            activeCheckInId: null,
            permissions: {}
        }
    },
    {
        id: 'user-3',
        employeeId: '1003',
        name: 'Priya Singh',
        email: 'priya.s@finroots.com',
        role: 'Advisor',
        designationId: 'des-advisor',
        roleId: 'role-advisor', 
        company: 'Finroots',
        comp_id: 'FIN01',
        initials: 'PS',
           password: 'password',
        profile: {
            status: 'Active',
            specializations: ['Life'],
            comp_id: 'FIN01',
            employeebranch_id: 'frb-2',
            activeCheckInId: null,
            permissions: {}
        }
    },
    {
        id: 'user-7',
        employeeId: '1004',
        name: 'Amit Sharma',
        email: 'amit.s@finroots.com',
        role: 'Advisor',
        designationId: 'des-advisor',
        roleId: 'role-advisor', 
        company: 'Finroots',
        comp_id: 'FIN01',
        initials: 'AS',
         password: 'password',
        profile: {
            status: 'Active',
            specializations: ['Health'],
            comp_id: 'FIN01',
            employeebranch_id: 'frb-1',
            activeCheckInId: null,
            permissions: {
                'reports & insights': 'modify'
            }
        }
    },
    {
        id: 'user-8',
        employeeId: 'Support',
        name: 'Finroots Support',
        email: 'support@finroots.com',
        role: 'Support',
        designationId: 'des-support',
        roleId: 'role-support', 
        company: 'Finroots',
        comp_id: 'FIN01',
        initials: 'FS',
         password: 'support',
        profile: { 
            status: 'Active', 
            comp_id: 'FIN01',
            permissions: {}
        }
    }
];


let companies: Company[] = (() => {
    try {
        const stored = localStorage.getItem(LS_OPERATING_COMPANIES_KEY);
        return stored ? JSON.parse(stored) : initialCompanies;
    } catch (e) {
        console.error("Failed to parse stored companies:", e);
        localStorage.removeItem(LS_OPERATING_COMPANIES_KEY);
        return initialCompanies;
    }
})();

let users: User[] = initialUsers;


let routes: Route[] = [
    { id: 'route-1', name: 'Erode Route', active: true, order: 0 },
    { id: 'route-2', name: 'Coimbatore Route', active: true, order: 1 },
    { id: 'route-3', name: 'Salem Route', active: true, order: 2 },
    { id: 'route-4', name: 'Chennai Route', active: true, order: 3 },
];

let relationshipTypesData: RelationshipType[] = [
    { id: 'rel-1', name: 'Self', active: true, order: 0 },
    { id: 'rel-2', name: 'Spouse', active: true, order: 1 },
    { id: 'rel-3', name: 'Son', active: true, order: 2 },
    { id: 'rel-4', name: 'Daughter', active: true, order: 3 },
    { id: 'rel-5', name: 'Father', active: true, order: 4 },
    { id: 'rel-6', name: 'Mother', active: true, order: 5 },
];


let religionsData: Religion[] = [
    { id: 'rel-1', name: 'Hinduism', active: true, order: 0 },
    { id: 'rel-2', name: 'Christianity', active: true, order: 1 },
    { id: 'rel-3', name: 'Islam', active: true, order: 2 },
    { id: 'rel-4', name: 'Sikhism', active: true, order: 3 },
    { id: 'rel-gen', name: 'General', active: true, order: 4 }, 
];

let festivalsData: Festival[] = [
    { id: 'fest-1', name: 'Diwali', religionId: 'rel-1', active: true },
    { id: 'fest-3', name: 'Eid al-Fitr', religionId: 'rel-3', active: true },
    { id: 'fest-4', name: 'Holi', religionId: 'rel-1', active: true },
    { id: 'fest-5', name: 'Good Friday', religionId: 'rel-2', active: true },
    { id: 'fest-2', name: 'Christmas', religionId: 'rel-2', active: true },
    { id: 'fest-6', name: 'New Year\'s Day', religionId: 'rel-gen', active: true }, 
];

let festivalDatesData: FestivalDate[] = [
    { id: 'fest-date-1', festivalId: 'fest-1', year: 2024, date: '2024-11-01', active: true },
    { id: 'fest-date-2', festivalId: 'fest-1', year: 2025, date: '2025-10-21', active: true },
    { id: 'fest-date-3', festivalId: 'fest-3', year: 2025, date: '2025-03-30', active: true },
    { id: 'fest-date-4', festivalId: 'fest-3', year: 2026, date: '2026-03-20', active: true },
    { id: 'fest-date-5', festivalId: 'fest-4', year: 2025, date: '2025-03-14', active: true },
    { id: 'fest-date-6', festivalId: 'fest-4', year: 2026, date: '2026-03-04', active: true },
    { id: 'fest-date-7', festivalId: 'fest-5', year: 2025, date: '2025-04-18', active: true },
    { id: 'fest-date-8', festivalId: 'fest-5', year: 2026, date: '2026-04-03', active: true },
    { id: 'fest-date-9', festivalId: 'fest-2', year: 2024, date: '2024-12-25', active: true },
    { id: 'fest-date-10', festivalId: 'fest-2', year: 2025, date: '2025-12-25', active: true },
    { id: 'fest-date-11', festivalId: 'fest-6', year: 2025, date: '2025-01-01', active: true },
    { id: 'fest-date-12', festivalId: 'fest-6', year: 2026, date: '2026-01-01', active: true },
];

let upsellCategoriesData: UpsellCategory[] = [
    { id: 'uc-1', name: 'Life Insurance', order: 0, active: true, linkedInsuranceTypeIds: ['it-life'] },
    { id: 'uc-2', name: 'Health Insurance', order: 1, active: true, linkedInsuranceTypeIds: ['it-health'] },
    { id: 'uc-3', name: 'General Insurance', order: 2, active: true, linkedInsuranceTypeIds: ['it-general'] },
];

let gendersData: Gender[] = [
    { id: 'gen-1', name: 'Male', active: true, order: 0 },
    { id: 'gen-2', name: 'Female', active: true, order: 1 },
    { id: 'gen-3', name: 'Transgender', active: true, order: 2 },
    { id: 'gen-4', name: 'Other', active: true, order: 3 },
];

let maritalStatusesData: MaritalStatus[] = [
    { id: 'mar-1', name: 'Single', active: true, order: 0 },
    { id: 'mar-2', name: 'Married', active: true, order: 1 },
    { id: 'mar-3', name: 'Divorced', active: true, order: 2 },
    { id: 'mar-4', name: 'Widowed', active: true, order: 3 },
];

let customerTypesData: CustomerType[] = [
    { id: 'ct-1', name: 'Silver', active: true, order: 0 },
    { id: 'ct-2', name: 'Gold', active: true, order: 1 },
    { id: 'ct-3', name: 'Diamond', active: true, order: 2 },
    { id: 'ct-4', name: 'Platinum', active: true, order: 3 },
];

const initialCustomerTiers: CustomerTier[] = [
    { id: 'tier-1', customerTypeId: 'ct-1', name: 'Silver', minimumSumAssured: 0, minimumPremium: 0, giftId: 'gift-1', active: true, order: 0 },
    { id: 'tier-2', customerTypeId: 'ct-2', name: 'Gold', minimumSumAssured: 500000, minimumPremium: 25000, giftId: 'gift-2', active: true, order: 1 },
    { id: 'tier-3', customerTypeId: 'ct-3', name: 'Diamond', minimumSumAssured: 1500000, minimumPremium: 75000, giftId: 'gift-3', active: true, order: 2 },
    { id: 'tier-4', customerTypeId: 'ct-4', name: 'Platinum', minimumSumAssured: 3000000, minimumPremium: 150000, giftId: 'gift-4', active: true, order: 3 },
];

let processStageMastersData: ProcessStageMaster[] = [
    { id: 'ps-life-1', name: 'Initial Contact', insuranceTypeId: 'it-life', order: 0, active: true },
    { id: 'ps-life-2', name: 'Requirement Analysis', insuranceTypeId: 'it-life', order: 1, active: true },
    { id: 'ps-life-3', name: 'Plan Presentation', insuranceTypeId: 'it-life', order: 2, active: true },
    { id: 'ps-life-4', name: 'Application Form Filling', insuranceTypeId: 'it-life', order: 3, active: true },
    { id: 'ps-life-5', name: 'Premium Collection', insuranceTypeId: 'it-life', order: 4, active: true },
    { id: 'ps-life-6', name: 'Policy Issuance', insuranceTypeId: 'it-life', order: 5, active: true },
    { id: 'ps-life-7', name: 'Policy Delivery', insuranceTypeId: 'it-life', order: 6, active: true },
    { id: 'ps-health-1', name: 'Lead Generation', insuranceTypeId: 'it-health', order: 0, active: true },
    { id: 'ps-health-2', name: 'Consultation', insuranceTypeId: 'it-health', order: 1, active: true },
    { id: 'ps-health-3', name: 'Plan Comparison', insuranceTypeId: 'it-health', order: 2, active: true },
    { id: 'ps-health-4', name: 'Proposal Submission', insuranceTypeId: 'it-health', order: 3, active: true },
    { id: 'ps-health-5', name: 'Medical Underwriting', insuranceTypeId: 'it-health', order: 4, active: true },
    { id: 'ps-health-6', name: 'Policy Activation', insuranceTypeId: 'it-health', order: 5, active: true },
    { id: 'ps-general-1', name: 'Inquiry', insuranceTypeId: 'it-general', order: 0, active: true },
    { id: 'ps-general-2', name: 'Quotation', insuranceTypeId: 'it-general', order: 1, active: true },
    { id: 'ps-general-3', name: 'Inspection (if any)', insuranceTypeId: 'it-general', order: 2, active: true },
    { id: 'ps-general-4', name: 'Payment', insuranceTypeId: 'it-general', order: 3, active: true },
    { id: 'ps-general-5', name: 'Cover Note Issuance', insuranceTypeId: 'it-general', order: 4, active: true },
    { id: 'ps-mf-1', name: 'Risk Profiling', isMutualFund: true, order: 0, active: true },
    { id: 'ps-mf-2', name: 'KYC Verification', isMutualFund: true, order: 1, active: true },
    { id: 'ps-mf-3', name: 'Scheme Selection', isMutualFund: true, order: 2, active: true },
    { id: 'ps-mf-4', name: 'Investment Execution', isMutualFund: true, order: 3, active: true },
    { id: 'ps-mf-5', name: 'Portfolio Review', isMutualFund: true, order: 4, active: true },
];

let leadStageMastersData: LeadStageMaster[] = [
    { id: 'ls-stage-1', name: 'Lead', order: 0, active: true },
    { id: 'ls-stage-2', name: 'Contacted', order: 1, active: true },
    { id: 'ls-stage-3', name: 'Meeting Scheduled', order: 2, active: true },
    { id: 'ls-stage-4', name: 'Proposal Sent', order: 3, active: true },
];

let occasionTypeMastersData: OccasionTypeMaster[] = [
    { id: 'occ-type-1', name: 'Housewarming', active: true, order: 0 },
    { id: 'occ-type-2', name: 'New Car Purchase', active: true, order: 1 },
    { id: 'occ-type-3', name: 'Work Anniversary', active: true, order: 2 },
    { id: 'occ-type-4', name: 'Child\'s Graduation', active: true, order: 3 },
];

let openingBalancesData: OpeningBalance[] = initialOpeningBalances;

export const calculatePremium = (policyType: PolicyType, coverage: number): number => {
    switch (policyType) {
        case 'Health Insurance':
            return Math.round(5000 + (coverage * 0.002));
        case 'Life Insurance':
            return Math.round(2000 + (coverage * 0.001));
        case 'General Insurance':
            return Math.round(1000 + (coverage * 0.02));
        default:
            return 0;
    }
};

export const generateDigipin = (lat: number, lng: number): string => {
    const CCODE = "23456789CFGHJMPQRVWX";
    let lat_val = Math.round((lat + 90) * 8000 * 20);
    let lng_val = Math.round((lng + 180) * 8000 * 20);

    let code = "";
    for (let i = 0; i < 5; i++) {
        let lat_digit = lat_val % 20;
        let lng_digit = lng_val % 20;
        lat_val = Math.floor(lat_val / 20);
        lng_val = Math.floor(lng_val / 20);
        code = CCODE[lat_digit] + CCODE[lng_digit] + code;
        if (i === 0) code = '+' + code;
        if (i === 1) code = ' ' + code;
    }
    return code.replace(' ', '+').slice(0, 11); 
};

let members: Member[] = [
  {
      id: '1', 
      sno: 1, 
      name: 'Priya Sharma', 
      memberId: 'PR1043312', 
      dob: '1985-01-01', 
      gender: 'gen-2', 
      maritalStatus: 'mar-2',
      mobile: '+91 9876543312', 
      email: 'priya.sharma@email.com',
      country: 'India',          
      state: 'Maharashtra', 
      district: 'Mumbai Suburban', 
      city: 'Mumbai', 
      area: 'Goregaon East',     
      address: '101, Thirupathi Valley',
      memberType: 'Diamond', 
      tierId: 'tier-3',
      customerCategoryId: 'cc-1',
      customerGroupId: 'cg-1',
      religionId: 'rel-1',
      bloodGroup: 'O+',
      anniversary: '2020-02-14',
      createdAt: '2024-01-15T10:30:00Z',
      active: true, 
      panCard: 'ABCDE1234F', 
      aadhaar: '123456789012',
      policies: [{
          id: 'POL001', 
          policyType: 'Life Insurance', 
          status: 'Active', 
          coverage: 5000000, 
          premium: 50000, 
          renewalDate: '2024-08-13', 
          comp_id: 'FIN01', 
          insuranceTypeId: 'it-term'
      }],
      mutualFundHoldings: [],
      leadSource: { sourceId: 'ls-ref', detail: 'Referral' },
      company: 'Finroots', 
      comp_id: 'FIN01', 
      isSPOC: true, 
      assignedTo: ['user-2'],
      processStage: 'Initial Contact',
      voiceNotes: [], 
      documents: [], 
      checkIns: [],
      branch_id: 'frb-1'
  },

  {
      id: '2', 
      sno: 2, 
      name: 'Deepa Verma', 
      memberId: 'DEA286543', 
      dob: '1990-11-12', 
      gender: 'gen-2', 
      maritalStatus: 'mar-1',
      mobile: '+91 9043386543', 
      email: 'deepa.verma@email.com',
      country: 'India',
      state: 'Delhi', 
      district: 'New Delhi',
      city: 'New Delhi', 
      area: 'Connaught Place',
      address: 'A-23, Mullai Nagar',
      memberType: 'Gold', 
      tierId: 'tier-2', 
      customerCategoryId: 'cc-1',
      customerGroupId: 'cg-2',
      religionId: 'rel-1',
      bloodGroup: 'A+',
      anniversary: '2019-06-20',
      createdAt: '2024-02-10T14:20:00Z',
      active: true, 
      panCard: 'FGHIJ5678K', 
      aadhaar: '234567890123',
      policies: [],
      mutualFundHoldings: [
          {
              id: 'mfh-2', 
              schemeId: 'mf-1', 
              folioNumber: '12345', 
              investmentType: 'Lumpsum',
              totalInvestment: 500000, 
              units: 5000, 
              currentValue: 750000,
              transactions: [], 
              status: 'Active'
          }
      ],
      leadSource: { sourceId: 'ls-dm', detail: 'Facebook' },
      company: 'Finroots', 
      comp_id: 'FIN01', 
      isSPOC: true, 
      assignedTo: ['user-3'],
      processStage: 'Risk Profiling',
      voiceNotes: [], 
      documents: [], 
      checkIns: [],
      branch_id: 'frb-1'
  },

  {
      id: '3', 
      sno: 3, 
      name: 'Kavya Reddy', 
      memberId: 'KA5446573', 
      dob: '1982-03-30', 
      gender: 'gen-2', 
      maritalStatus: 'mar-2',
      mobile: '+91 9675346573', 
      email: 'kavya.reddy@email.com',
      country: 'India',
      state: 'Karnataka', 
      district: 'Bangalore Urban',
      city: 'Bengaluru', 
      area: 'HSR Layout',
      address: '54, TVS Road',
      memberType: 'Silver', 
      tierId: 'tier-1',
      customerCategoryId: 'cc-2',
      religionId: 'rel-1',
      bloodGroup: 'B+',
      anniversary: '2018-12-05',
      createdAt: '2024-03-05T09:15:00Z',
      active: true, 
      panCard: 'KLMNO9012L', 
      aadhaar: '345678901234',
      policies: [
          { 
              id: 'POL003', 
              policyType: 'General Insurance', 
              generalInsuranceType: 'Motor', 
              status: 'Active', 
              coverage: 350000, 
              premium: 12000, 
              renewalDate: '2024-04-10', 
              comp_id: 'FIN01', 
              insuranceTypeId: 'it-motor' 
          },
      ],
      mutualFundHoldings: [],
      leadSource: { sourceId: 'ls-web', detail: 'Website' },
      company: 'Finroots', 
      comp_id: 'FIN01', 
      isSPOC: true, 
      assignedTo: ['user-2'],
      processStage: 'Inquiry',
      voiceNotes: [], 
      documents: [], 
      checkIns: [],
      branch_id: 'frb-2'
  },

  {
      id: '5', 
      sno: 5, 
      name: 'Vikram Singh', 
      memberId: 'VI7B56789', 
      dob: '1978-01-15', 
      gender: 'gen-1', 
      maritalStatus: 'mar-2',
      mobile: '+91 9123456789', 
      email: 'vikram.singh@email.com',
      country: 'India',
      state: 'Tamil Nadu', 
      district: 'Chennai',
      city: 'Chennai', 
      area: 'Viman Nagar',
      address: '7B, Clover Park',
      memberType: 'Platinum', 
      tierId: 'tier-4',
      customerCategoryId: 'cc-1',
      customerGroupId: 'cg-1', 
      religionId: 'rel-4',
      bloodGroup: 'AB+',
      anniversary: '2015-11-28',
      createdAt: '2024-01-20T11:45:00Z',
      active: true, 
      panCard: 'UVXYZ9876A', 
      aadhaar: '987654321098',
      policies: [{ 
          id: 'POL005', 
          policyType: 'Health Insurance', 
          status: 'Active', 
          coverage: 1500000, 
          premium: 35000, 
          renewalDate: '2024-12-15', 
          comp_id: 'FIN01', 
          insuranceTypeId: 'it-family-floater',
          coveredMembers: [
              { id: 'cm-1', name: 'Vikram Singh', relationship: 'Self', dob: '1978-01-15' },
              { id: 'cm-2', name: 'Riya Singh', relationship: 'Spouse', dob: '1980-05-20' },
              { id: 'cm-3', name: 'Rahul Singh', relationship: 'Son', dob: '2010-08-10' }
          ]
      }],
      mutualFundHoldings: [],
      leadSource: { sourceId: 'ls-ec', detail: 'Existing Client' },
      company: 'Finroots', 
      comp_id: 'FIN01', 
      isSPOC: true, 
      assignedTo: ['user-7'],
      processStage: 'Lead Generation',
      voiceNotes: [], 
      documents: [], 
      checkIns: [],
      branch_id: 'frb-2'
  },

  {
      id: '6', 
      sno: 6, 
      name: 'Arjun Mehta', 
      memberId: 'AR1176655', 
      dob: '1992-07-22', 
      gender: 'gen-1', 
      maritalStatus: 'mar-1',
      mobile: '+91 9988776655', 
      email: 'arjun.mehta@email.com',
      country: 'India',
      state: 'Maharashtra', 
      district: 'Mumbai City',
      city: 'Mumbai', 
      area: 'Bandra West',
      address: '112, 4th Cross',
      memberType: 'Platinum', 
      tierId: 'tier-4',
      customerCategoryId: 'cc-3',
      religionId: 'rel-1',
      bloodGroup: 'O-',
      createdAt: '2024-02-28T16:30:00Z',
      active: true, 
      panCard: 'BCDEF2345G', 
      aadhaar: '876543210987',
      policies: [
          { 
              id: 'POL007', 
              policyType: 'Life Insurance', 
              status: 'Active', 
              coverage: 10000000, 
              premium: 120000, 
              renewalDate: '2025-01-20', 
              comp_id: 'FIN01', 
              insuranceTypeId: 'it-whole' 
          } 
      ],
      mutualFundHoldings: [
          {
              id: 'mfh-1', 
              schemeId: 'mf-2', 
              folioNumber: '987654321', 
              investmentType: 'SIP',
              totalInvestment: 200000, 
              units: 2000, 
              currentValue: 250000, 
              status: 'Active', 
              transactions: []
          }
      ],
      leadSource: { sourceId: 'ls-ref', detail: 'Priya Sharma' },
      company: 'Finroots', 
      comp_id: 'FIN01', 
      isSPOC: true, 
      assignedTo: ['user-2'],
      processStage: 'Initial Contact',
      voiceNotes: [], 
      documents: [], 
      checkIns: [],
      branch_id: 'frb-1'
  },

  {
      id: '7', 
      sno: 7, 
      name: 'Senthil Kumar', 
      memberId: 'SK887766', 
      dob: '1988-03-15', 
      gender: 'gen-1', 
      maritalStatus: 'mar-2',
      mobile: '+91 9876512345', 
      email: 'senthil.kumar@email.com',
      country: 'India',
      state: 'Tamil Nadu', 
      district: 'Erode',
      city: 'Erode', 
      area: 'Perundurai Road',
      address: '45, KVN Nagar',
      memberType: 'Gold', 
      tierId: 'tier-2',
      customerCategoryId: 'cc-1',
      religionId: 'rel-1',
      bloodGroup: 'A-',
      anniversary: '2021-04-15',
      createdAt: '2024-03-12T08:00:00Z',
      active: true, 
      panCard: 'ABCDE9999Z', 
      aadhaar: '999988887777',
      policies: [{ 
          id: 'POL008', 
          policyType: 'Life Insurance', 
          status: 'Active', 
          coverage: 1000000, 
          premium: 40000, 
          renewalDate: '2024-11-20', 
          comp_id: 'FIN01', 
          insuranceTypeId: 'it-endowment' 
      }],
      mutualFundHoldings: [],
      leadSource: { sourceId: 'ls-cc' },
      company: 'Finroots', 
      comp_id: 'FIN01', 
      isSPOC: true, 
      assignedTo: ['user-3'],
      processStage: 'Initial Contact',
      voiceNotes: [], 
      documents: [], 
      checkIns: [],
      branch_id: 'frb-2'
  }
];

const hydrateInitialData = (memberData: Member[]): Member[] => {
    const defaultSchemes: Record<string, { schemeId: string, schemeName: string }> = {
        'Life Insurance': { schemeId: 'sch-2', schemeName: 'Jeevan Anand' },
        'Health Insurance': { schemeId: 'sch-5', schemeName: 'Comprehensive Health Plan' },
        'Motor': { schemeId: 'sch-9', schemeName: 'Drive Smart' },
    };

    return memberData.map(member => ({
        ...member,
        policies: member.policies.map(policy => {
            if (policy.schemeId) {
                return policy;
            }

            let defaultScheme;
            if (policy.policyType === 'General Insurance' && policy.generalInsuranceType) {
                defaultScheme = defaultSchemes[policy.generalInsuranceType];
            } else {
                defaultScheme = defaultSchemes[policy.policyType];
            }

            if (defaultScheme) {
                return {
                    ...policy,
                    schemeId: defaultScheme.schemeId,
                    schemeName: defaultScheme.schemeName,
                };
            }
            return policy;
        })
    }));
};

members = hydrateInitialData(members);

let leads: Lead[] = [
    { id: 'lead-1', name: 'Ravi Kumar', phone: '9876512345', email: 'ravi.k@example.com', leadSource: { sourceId: 'ls-8' }, status: 'Lead', estimatedValue: 15000, assignedTo: 'user-2', createdAt: '2024-07-20T10:00:00Z', notes: 'Interested in a family health plan.', company: 'Finroots', comp_id: 'FIN01', branch_id: 'frb-1' },
    { id: 'lead-2', name: 'Sunita Nair', phone: '9123456780', email: 'sunita.n@example.com', leadSource: { sourceId: 'rt-2', detail: 'Priya Sharma' }, status: 'Contacted', estimatedValue: 25000, assignedTo: 'user-2', createdAt: '2024-07-18T14:30:00Z', notes: 'Referred by Priya Sharma. Follow up next week.', company: 'Finroots', comp_id: 'FIN01', branch_id: 'frb-2' },
    { id: 'lead-3', name: 'Amit Desai', phone: '9988776650', email: 'amit.d@example.com', leadSource: { sourceId: 'ls-4' }, status: 'Meeting Scheduled', estimatedValue: 50000, assignedTo: 'user-2', createdAt: '2024-07-15T11:00:00Z', notes: 'Meeting on Friday at 3 PM to discuss life insurance options.', company: 'Finroots', comp_id: 'FIN01', branch_id: 'frb-1' },
    { id: 'lead-4', name: 'Meera Gupta', phone: '9000011111', email: 'meera.g@example.com', leadSource: { sourceId: 'ls-9' }, status: 'Proposal Sent', estimatedValue: 12000, assignedTo: 'user-2', createdAt: '2024-07-12T09:00:00Z', notes: 'Sent proposal for vehicle insurance. Awaiting response.', company: 'Finroots', comp_id: 'FIN01', branch_id: 'frb-2' },
];

let advisorLocationsData: AdvisorLocation[] = [];
let checkInData: CheckIn[] = [];
let advisorLocationHistoryData: Record<string, { lat: number; lng: number; timestamp: string }[]> = {};

const preRegisteredUsers: Record<string, Partial<Member>> = {
    '9999988888': {
        name: 'Suresh Kumar',
        state: 'Delhi',
        city: 'New Delhi',
        address: '123, Sector 5, Dwarka'
    },
    '7777766666': {
        name: 'Anjali Verma',
        state: 'Gujarat',
        city: 'Ahmedabad',
        address: 'A-404, Satellite Towers'
    }
};

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const login = async (company: string, employeeId: string, password_param: string, roleId: string, branch_id?: string, financialYearId?: string): Promise<User | null> => {
    await simulateDelay(200);

    const user = users.find(u =>
        u.company === company &&
        u.employeeId.toLowerCase() === employeeId.toLowerCase() &&
        u.password === password_param
    );

    if (!user) {
        return null;
    }

    if (user.profile?.status !== 'Active') {
        throw new Error('INACTIVE_ACCOUNT');
    }

    if (user.roleId !== roleId) {
        return null; 
    }

    if (user.profile?.employeebranch_id && user.profile.employeebranch_id !== branch_id) {
        return null; 
    }

    if (financialYearId && !financialYearsData.find(fy => fy.id === financialYearId)) {
        return null; 
    }

    if (!user.roleId) {
        return null;
    }

    return user ? JSON.parse(JSON.stringify(user)) : null;
};


export const getAccountCategories = async (): Promise<AccountCategory[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(accountCategoriesData));
}
export const updateAccountCategories = async (updatedData: AccountCategory[]): Promise<AccountCategory[]> => {
    await simulateDelay(200);
    accountCategoriesData = JSON.parse(JSON.stringify(updatedData));
    return accountCategoriesData;
}
export const getAccountSubCategories = async (): Promise<AccountSubCategory[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(accountSubCategoriesData));
}
export const updateAccountSubCategories = async (updatedData: AccountSubCategory[]): Promise<AccountSubCategory[]> => {
    await simulateDelay(200);
    accountSubCategoriesData = JSON.parse(JSON.stringify(updatedData));
    return accountSubCategoriesData;
}
export const getAccountHeads = async (): Promise<AccountHead[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(accountHeadsData));
}
export const updateAccountHeads = async (updatedData: AccountHead[]): Promise<AccountHead[]> => {
    await simulateDelay(200);
    accountHeadsData = JSON.parse(JSON.stringify(updatedData));
    return accountHeadsData;
}


export const getFinancialYears = async (): Promise<FinancialYear[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(financialYearsData));
};

export const updateFinancialYears = async (updatedData: FinancialYear[]): Promise<FinancialYear[]> => {
    await simulateDelay(200);
    financialYearsData = JSON.parse(JSON.stringify(updatedData));
    return financialYearsData;
};

export const getDocumentNumbering = async (): Promise<DocumentNumbering[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(documentNumberingData));
};

export const updateDocumentNumbering = async (updatedData: DocumentNumbering[]): Promise<DocumentNumbering[]> => {
    await simulateDelay(200);
    documentNumberingData = JSON.parse(JSON.stringify(updatedData));
    return documentNumberingData;
};

export const getUsers = async (comp_id?: string): Promise<User[]> => {
  await simulateDelay(100);
  const filteredUsers = comp_id ? users.filter(u => u.comp_id === comp_id) : users;
  return JSON.parse(JSON.stringify(filteredUsers));
};

export const createEmployee = async (employeeData: Omit<User, 'id' | 'role' | 'initials'>): Promise<User> => {
    await simulateDelay(300);
    const initials = (employeeData.name || '').split(' ').map(n => n[0]).join('').toUpperCase();
    const passwordToStore = employeeData.password || 'password';

    const newEmployee: User = {
        ...employeeData,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: designationsData.find(d => d.id === employeeData.designationId)?.name || 'Employee',
        initials,
        password: passwordToStore,
        profile: { status: employeeData.profile?.status || 'Active', ...employeeData.profile, comp_id: employeeData.comp_id }
    };
    users.push(newEmployee);
    return JSON.parse(JSON.stringify(newEmployee));
};

export const updateEmployee = async (employeeData: User): Promise<User> => {
    await simulateDelay(300);
    const index = users.findIndex(u => u.id === employeeData.id);
    if (index === -1) {
        throw new Error('Employee not found');
    }

    let dataToUpdate = { ...employeeData };
    
    const initials = (dataToUpdate.name || '').split(' ').map(n => n[0]).join('').toUpperCase();
    users[index] = { ...users[index], ...dataToUpdate, initials };
    return JSON.parse(JSON.stringify(users[index]));
};

export const deleteEmployee = async (userId: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length === initialLength) {
        throw new Error('Employee not found');
    }
    return { success: true };
};

export const getMembers = async (comp_id?: string, advisorId?: string): Promise<Member[]> => {
  await simulateDelay(500);
  let filteredMembers = comp_id ? members.filter(m => m.comp_id === comp_id) : members;

  if (advisorId) {
      filteredMembers = filteredMembers.filter(m =>
          m.createdBy === advisorId || (m.assignedTo && m.assignedTo.includes(advisorId))
      );
  }
  return JSON.parse(JSON.stringify(filteredMembers));
};

export const createMember = async (memberData: Omit<Member, 'id' | 'sno'>): Promise<Member> => {
  await simulateDelay(300);
  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const membersOfCompany = members.filter(m => m.comp_id === memberData.comp_id);
  const maxSno = membersOfCompany.length > 0 ? Math.max(...membersOfCompany.map(m => m.sno)) : 0;
  const newSno = maxSno + 1;

  let newMember: Member = {
    ...memberData,
    id: newId,
    sno: newSno,
    inactiveSince: memberData.inactiveSince === undefined ? null : memberData.inactiveSince,
    policies: memberData.policies || [],
    voiceNotes: memberData.voiceNotes || [],
    documents: memberData.documents || [],
    checkIns: memberData.checkIns || [],
    assignedTo: memberData.assignedTo || [],
    processStage: memberData.processStage || 'Initial Contact', 
    processStages: memberData.processStages || {},
    stageLastChanged: memberData.stageLastChanged || new Date().toISOString(), 
    stageLastChangedMap: memberData.stageLastChangedMap || {},
    comp_id: memberData.comp_id,
    maritalStatus: memberData.maritalStatus || null, 
  };

  if ((newMember.lat && newMember.lng) && !newMember.digipin) {
    newMember.digipin = generateDigipin(newMember.lat, newMember.lng);
  }

  members.push(newMember);
  return JSON.parse(JSON.stringify(newMember));
};

export const updateMember = async (memberData: Member): Promise<Member> => {
  await simulateDelay(300);
  const index = members.findIndex(m => m.id === memberData.id);
  if (index === -1) {
    throw new Error('Member not found');
  }

  const oldMember = members[index];
  let memberToUpdate = { ...oldMember, ...memberData, sno: oldMember.sno };

  if ((memberToUpdate.lat && memberToUpdate.lng) && !memberToUpdate.digipin) {
      memberToUpdate.digipin = generateDigipin(memberToUpdate.lat, memberToUpdate.lng);
  }

  if (oldMember.active && !memberToUpdate.active) {
    memberToUpdate.inactiveSince = new Date().toISOString();
  } else if (!oldMember.active && memberToUpdate.active) {
    memberToUpdate.inactiveSince = null;
  }

  members[index] = memberToUpdate;
  return JSON.parse(JSON.stringify(members[index]));
};

export const deleteMember = async (memberId: string): Promise<{ success: true }> => {
  await simulateDelay(300);
  const initialLength = members.length;
  members = members.filter(m => m.id !== memberId);
  if (members.length === initialLength) {
    throw new Error('Member not found');
  }
  return { success: true };
};

export const renewPolicy = async (memberId: string, policyId: string): Promise<Member> => {
    await simulateDelay(300);
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
        throw new Error('Member not found');
    }

    const policyIndex = members[memberIndex].policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
        throw new Error('Policy not found');
    }

    const currentRenewalDate = new Date(members[memberIndex].policies[policyIndex].renewalDate);
    currentRenewalDate.setFullYear(currentRenewalDate.getFullYear() + 1);
    members[memberIndex].policies[policyIndex].renewalDate = currentRenewalDate.toISOString().split('T')[0];

    return JSON.parse(JSON.stringify(members[memberIndex]));
};

export const findMemberByMobile = async (mobile: string): Promise<Partial<Member> | null> => {
    await simulateDelay(600);
       const cleanedMobile = mobile.replace(/[^0-9]/g, '').slice(-10);
    if (preRegisteredUsers[cleanedMobile]) {
        return {
            ...preRegisteredUsers[cleanedMobile],
            processStage: 'Initial Contact'
        };
    }
    return null;
};

export const getRoutes = async (): Promise<Route[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(routes));
};

export const updateRoute = async (routeData: Route): Promise<Route> => {
    await simulateDelay(150);
    const index = routes.findIndex(r => r.id === routeData.id);
    if (index === -1) {
        throw new Error('Route not found');
    }
    routes[index] = { ...routes[index], ...routeData };
    return JSON.parse(JSON.stringify(routes[index]));
};

export const getLeads = async (): Promise<Lead[]> => {
    await simulateDelay(400);
    return JSON.parse(JSON.stringify(leads));
};

export const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'company' | 'comp_id'>, comp_id: string): Promise<Lead> => {
    await simulateDelay(300);
    const companyName = companies.find(c => c.id === comp_id)?.name || 'Unknown';
    const newLead: Lead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...leadData,
        createdAt: new Date().toISOString(),
        status: leadData.status || 'Lead',
        company: companyName,
        comp_id: comp_id
    };
    leads.push(newLead);
    return JSON.parse(JSON.stringify(newLead));
};

export const updateLead = async (leadData: Lead): Promise<Lead> => {
    await simulateDelay(300);
    const index = leads.findIndex(l => l.id === leadData.id);
    if (index === -1) {
        throw new Error('Lead not found');
    }
    leads[index] = { ...leads[index], ...leadData };
    return JSON.parse(JSON.stringify(leads[index]));
};

export const deleteLead = async (leadId: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    const initialLength = leads.length;
    leads = leads.filter(l => l.id !== leadId);
    if (leads.length === initialLength) {
        throw new Error('Lead not found');
    }
    return { success: true };
};

export const getOperatingCompanies = async (): Promise<Company[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(companies));
};

export const createOperatingCompany = async (companyData: Omit<Company, 'id'>): Promise<Company> => {
    await simulateDelay(300);
    const newCompany: Company = {
        id: companyData.comp_code || `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...companyData,
        dateOfCreation: new Date().toISOString().split('T')[0],
        active: true,
    };
    companies.push(newCompany);
    localStorage.setItem(LS_OPERATING_COMPANIES_KEY, JSON.stringify(companies));
    return JSON.parse(JSON.stringify(newCompany));
};

export const updateOperatingCompany = async (companyData: Company): Promise<Company> => {
    await simulateDelay(300);
    const index = companies.findIndex(c => c.id === companyData.id);
    if (index === -1) {
        throw new Error('Company not found');
    }
    const oldCompanyName = companies[index].name;
    companies[index] = { ...companies[index], ...companyData };

    if (oldCompanyName !== companyData.name) {
        users = users.map(user => {
            if (user.comp_id === companyData.id) {
                return { ...user, company: companyData.name };
            }
            return user;
        });
    }

    localStorage.setItem(LS_OPERATING_COMPANIES_KEY, JSON.stringify(companies));

    return JSON.parse(JSON.stringify(companies[index]));
};

export const getBranches = async (): Promise<Branch[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(BranchesData));
};

export const createBranch = async (branchData: Omit<Branch, 'id'>): Promise<Branch> => {
    await simulateDelay(300);
    const newBranch: Branch = {
        id: `frb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...branchData,
        active: true,
    };
    BranchesData.push(newBranch);
    return JSON.parse(JSON.stringify(newBranch));
};

export const updateBranch = async (branchData: Branch): Promise<Branch> => {
    await simulateDelay(300);
    const index = BranchesData.findIndex(b => b.id === branchData.id);
    if (index === -1) {
        throw new Error('Branch not found');
    }
    BranchesData[index] = { ...BranchesData[index], ...branchData };
    return JSON.parse(JSON.stringify(BranchesData[index]));
};

export const getRoles = async (): Promise<Role[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(rolesData));
};

export const updateRoles = async (updatedData: Role[]): Promise<Role[]> => {
    await simulateDelay(200);
    rolesData = JSON.parse(JSON.stringify(updatedData));
    return rolesData;
};

export const getDesignations = async (): Promise<Designation[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(designationsData));
};

export const updateDesignations = async (updatedData: Designation[]): Promise<Designation[]> => {
    await simulateDelay(200);
    designationsData = JSON.parse(JSON.stringify(updatedData));
    return designationsData;
};

export const getRolePermissions = async (): Promise<RolePermissions[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(rolePermissionsData));
};

export const updateRolePermissions = async (updatedPermissions: RolePermissions): Promise<RolePermissions> => {
    await simulateDelay(200);
    const index = rolePermissionsData.findIndex(p => p.roleId === updatedPermissions.roleId);
    if (index === -1) {
        rolePermissionsData.push(updatedPermissions);
    } else {
        rolePermissionsData[index] = updatedPermissions;
    }
    return JSON.parse(JSON.stringify(updatedPermissions));
};

export const getRelationshipTypes = async (): Promise<RelationshipType[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(relationshipTypesData));
};

export const updateRelationshipTypes = async (updatedData: RelationshipType[]): Promise<RelationshipType[]> => {
    await simulateDelay(200);
    relationshipTypesData = JSON.parse(JSON.stringify(updatedData));
    return relationshipTypesData;
};

export const getProcessStageMasters = async (): Promise<ProcessStageMaster[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(processStageMastersData));
};

export const updateProcessStageMasters = async (updatedData: ProcessStageMaster[]): Promise<ProcessStageMaster[]> => {
    await simulateDelay(200);
    processStageMastersData = JSON.parse(JSON.stringify(updatedData));
    return processStageMastersData;
};

export const getLeadStageMasters = async (): Promise<LeadStageMaster[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(leadStageMastersData));
};

export const updateLeadStageMasters = async (updatedData: LeadStageMaster[]): Promise<LeadStageMaster[]> => {
    await simulateDelay(200);
    leadStageMastersData = JSON.parse(JSON.stringify(updatedData));
    return leadStageMastersData;
};

export const getReligions = async (): Promise<Religion[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(religionsData));
};

export const getFestivals = async (): Promise<Festival[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(festivalsData));
};

export const getFestivalDates = async (): Promise<FestivalDate[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(festivalDatesData));
};

export const getFestivalDatesByFestivalId = async (festivalId: string): Promise<FestivalDate[]> => {
    await simulateDelay(100);
    const filtered = festivalDatesData.filter(fd => fd.festivalId === festivalId);
    return JSON.parse(JSON.stringify(filtered));
};

export const createFestivalDate = async (data: Omit<FestivalDate, 'id'>): Promise<FestivalDate> => {
    await simulateDelay(200);
    const newDate: FestivalDate = {
        ...data,
        id: `fest-date-${Date.now()}`,
        active: data.active ?? true,
    };
    festivalDatesData.push(newDate);
    return JSON.parse(JSON.stringify(newDate));
};

export const updateFestivalDate = async (data: FestivalDate): Promise<FestivalDate> => {
    await simulateDelay(200);
    const index = festivalDatesData.findIndex(fd => fd.id === data.id);
    if (index === -1) throw new Error('Festival date not found.');
    festivalDatesData[index] = data;
    return JSON.parse(JSON.stringify(data));
};

export const deleteFestivalDate = async (id: string): Promise<{ success: true }> => {
    await simulateDelay(200);
    festivalDatesData = festivalDatesData.filter(fd => fd.id !== id);
    return { success: true };
};

export const getFestivalsByDateRange = async (startDate: Date, endDate: Date): Promise<(Festival & { date: string })[]> => {
    await simulateDelay(100);
    const results: (Festival & { date: string })[] = [];

    festivalDatesData.forEach(festivalDate => {
        const d = new Date(festivalDate.date);
        if (d >= startDate && d <= endDate) {
            const parentFestival = festivalsData.find(f => f.id === festivalDate.festivalId);
            if (parentFestival) {
                results.push({
                    ...parentFestival,
                    date: festivalDate.date
                });
            }
        }
    });

    return JSON.parse(JSON.stringify(results));
};

export const getUpsellCategories = async (): Promise<UpsellCategory[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(upsellCategoriesData));
};

export const getGenders = async (): Promise<Gender[]> => {
    await simulateDelay(50);
    return JSON.parse(JSON.stringify(gendersData));
};

export const getMaritalStatuses = async (): Promise<MaritalStatus[]> => {
    await simulateDelay(50);
    return JSON.parse(JSON.stringify(maritalStatusesData));
};

export const getCustomerTypes = async (): Promise<CustomerType[]> => {
    await simulateDelay(50);
    return JSON.parse(JSON.stringify(customerTypesData));
};

export const getCustomerTiers = async (): Promise<CustomerTier[]> => {
    await simulateDelay(50);
    return JSON.parse(JSON.stringify(initialCustomerTiers));
};

export const getOccasionTypeMasters = async (): Promise<OccasionTypeMaster[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(occasionTypeMastersData));
};

export const updateOccasionTypeMasters = async (updatedData: OccasionTypeMaster[]): Promise<OccasionTypeMaster[]> => {
    await simulateDelay(200);
    occasionTypeMastersData = JSON.parse(JSON.stringify(updatedData));
    return occasionTypeMastersData;
};

export const getAdvisorLocations = async (): Promise<AdvisorLocation[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(advisorLocationsData));
};

export const getCheckIns = async (): Promise<CheckIn[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(checkInData));
};

export const updateAdvisorLocation = async (locationData: Omit<AdvisorLocation, 'advisorName'>): Promise<AdvisorLocation> => {
    await simulateDelay(50); 
    const advisor = users.find(u => u.id === locationData.advisorId);
    if (!advisor) {
        throw new Error('Advisor not found for location update.');
    }

    const fullLocationData: AdvisorLocation = {
        ...locationData,
        advisorName: advisor.name,
    };

    if (!advisorLocationHistoryData[locationData.advisorId]) {
        advisorLocationHistoryData[locationData.advisorId] = [];
    }
    advisorLocationHistoryData[locationData.advisorId].push({
        lat: locationData.lat,
        lng: locationData.lng,
        timestamp: locationData.timestamp,
    });


    const index = advisorLocationsData.findIndex(loc => loc.advisorId === locationData.advisorId);
    if (index !== -1) {
        advisorLocationsData[index] = fullLocationData;
    } else {
        advisorLocationsData.push(fullLocationData);
    }
    return JSON.parse(JSON.stringify(fullLocationData));
};

export const createCheckIn = async (newCheckInData: Omit<CheckIn, 'id' | 'advisorName' | 'durationMinutes' | 'checkOutTimestamp'>): Promise<CheckIn> => {
    await simulateDelay(250);
    const advisorIndex = users.findIndex(u => u.id === newCheckInData.advisorId);
    if (advisorIndex === -1) {
        throw new Error('Advisor not found for check-in.');
    }
    
    const advisor = users[advisorIndex];

    if (advisor.profile?.activeCheckInId) {
        throw new Error('Advisor is already checked in to another meeting. Please check out first.');
    }

    const newCheckIn: CheckIn = {
        id: `checkin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...newCheckInData,
        advisorName: advisor.name,
    };
    checkInData.push(newCheckIn);

    const memberIndex = members.findIndex(m => m.id === newCheckInData.customerId);
    if (memberIndex !== -1) {
        if (!members[memberIndex].checkIns) {
            members[memberIndex].checkIns = [];
        }
        members[memberIndex].checkIns!.push(newCheckIn);
    }

    if (users[advisorIndex].profile) {
        users[advisorIndex].profile!.activeCheckInId = newCheckIn.id;
    }

    return JSON.parse(JSON.stringify(newCheckIn));
};

export const checkOut = async (
    checkInId: string,
    notes: string,
    outcome: CheckInOutcome,
    nextActionDate?: string
): Promise<CheckIn> => {
    await simulateDelay(250);
    const checkInIndex = checkInData.findIndex(c => c.id === checkInId);
    if (checkInIndex === -1) {
        throw new Error('Check-in record not found.');
    }

    const advisorIndex = users.findIndex(u => u.id === checkInData[checkInIndex].advisorId);
    if (advisorIndex === -1) {
        throw new Error('Associated advisor not found.');
    }

    const checkInTime = new Date(checkInData[checkInIndex].timestamp);
    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    const updatedCheckIn: CheckIn = {
        ...checkInData[checkInIndex],
        checkOutTimestamp: checkOutTime.toISOString(),
        durationMinutes,
        notes,
        outcome,
        nextActionDate,
    };
    checkInData[checkInIndex] = updatedCheckIn;
    
    const memberIndex = members.findIndex(m => m.id === updatedCheckIn.customerId);
    if (memberIndex !== -1 && members[memberIndex].checkIns) {
        const memberCheckInIndex = members[memberIndex].checkIns!.findIndex(c => c.id === checkInId);
        if (memberCheckInIndex !== -1) {
            members[memberIndex].checkIns![memberCheckInIndex] = updatedCheckIn;
        }
    }

    if (users[advisorIndex].profile) {
        users[advisorIndex].profile!.activeCheckInId = null;
    }

    return JSON.parse(JSON.stringify(updatedCheckIn));
};

export const getActiveCheckIn = async (advisorId: string): Promise<CheckIn | null> => {
    await simulateDelay(100);
    const advisor = users.find(u => u.id === advisorId);
    if (!advisor || !advisor.profile?.activeCheckInId) {
        return null;
    }
    const activeCheckIn = checkInData.find(c => c.id === advisor.profile?.activeCheckInId);
    return activeCheckIn ? JSON.parse(JSON.stringify(activeCheckIn)) : null;
};

export const getAdvisorLocationHistory = async (advisorId: string): Promise<{ lat: number; lng: number; timestamp: string }[]> => {
    await simulateDelay(150);
    return JSON.parse(JSON.stringify(advisorLocationHistoryData[advisorId] || []));
};

export const getInsuranceTypeDocumentRules = async (): Promise<InsuranceTypeDocumentRule[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(insuranceTypeDocumentRulesData));
};

export const updateInsuranceTypeDocumentRules = async (updatedData: InsuranceTypeDocumentRule[]): Promise<InsuranceTypeDocumentRule[]> => {
    await simulateDelay(200);
    insuranceTypeDocumentRulesData = JSON.parse(JSON.stringify(updatedData));
    return insuranceTypeDocumentRulesData;
};

export const getCampaigns = async (): Promise<CampaignMaster[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(campaignsData));
};

export const createCampaign = async (campaignData: Omit<CampaignMaster, 'id'>): Promise<CampaignMaster> => {
    await simulateDelay(300);
    const newCampaign: CampaignMaster = {
        id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...campaignData,
    };
    campaignsData.push(newCampaign);
    return JSON.parse(JSON.stringify(newCampaign));
};

export const updateCampaign = async (campaignData: CampaignMaster): Promise<CampaignMaster> => {
    await simulateDelay(300);
    const index = campaignsData.findIndex(c => c.id === campaignData.id);
    if (index === -1) {
        throw new Error('Campaign not found');
    }
    campaignsData[index] = campaignData;
    return JSON.parse(JSON.stringify(campaignsData[index]));
};

export const deleteCampaign = async (campaignId: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    campaignsData = campaignsData.filter(c => c.id !== campaignId);
    return { success: true };
};

export const getOpeningBalances = async (): Promise<OpeningBalance[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(openingBalancesData));
};

export const createOpeningBalance = async (data: Omit<OpeningBalance, 'id' | 'createdAt'>): Promise<OpeningBalance> => {
    await simulateDelay(300);
    const newBalance: OpeningBalance = {
        id: `ob-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString()
    };
    openingBalancesData.push(newBalance);
    return JSON.parse(JSON.stringify(newBalance));
};

export const updateOpeningBalance = async (data: OpeningBalance): Promise<OpeningBalance> => {
    await simulateDelay(300);
    const index = openingBalancesData.findIndex(ob => ob.id === data.id);
    if (index === -1) {
        throw new Error('Opening Balance record not found');
    }
    openingBalancesData[index] = data;
    return JSON.parse(JSON.stringify(openingBalancesData[index]));
};

export const deleteOpeningBalance = async (id: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    openingBalancesData = openingBalancesData.filter(ob => ob.id !== id);
    return { success: true };
};