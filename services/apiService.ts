// --- apiService.ts ---

import { 
    Member, Policy, PolicyType, Lead, User, Route, ProcessStage, EmployeeProfile, Company, 
    FinRootsBranch, Religion, Festival, FestivalDate, AdvisorLocation, CheckIn, 
    CheckInOutcome, UpsellCategory, Designation, RolePermissions, AppModule, PermissionLevel, 
    Gender, MaritalStatus, CustomerType, CustomerTier, ProcessStageMaster, RelationshipType,
    // --- NEW: Import new types ---
    FinancialYear, DocumentNumbering, Role, // --- ADDED: Import Role ---
    InsuranceTypeDocumentRule,
    LeadStageMaster // --- ADDED ---
} from '../types.ts';

// --- NEW: Mock Data for Financial Years ---
let financialYearsData: FinancialYear[] = [
    { id: 'fy-1', finYear: '2024-2025', fromDate: '2024-04-01', toDate: '2025-03-31', status: 'Active' },
    { id: 'fy-2', finYear: '2025-2026', fromDate: '2025-04-01', toDate: '2026-03-31', status: 'Active' },
];

// --- NEW: Mock Data for Document Numbering ---
let documentNumberingData: DocumentNumbering[] = [
    // Vouchers
    { id: 'dn-1', type: 'Voucher', prefix: 'VCH/24-25/', suffix: null, startingNumber: 1, finYearId: 'fy-1', status: 'Active' },
    { id: 'dn-2', type: 'Voucher', prefix: 'VOUCHER/', suffix: '/25-26', startingNumber: 1001, finYearId: 'fy-2', status: 'Active' },
    // Receipts
    { id: 'dn-3', type: 'Receipt', prefix: 'RECPT/24-25/', suffix: null, startingNumber: 1, finYearId: 'fy-1', status: 'Active' },
    { id: 'dn-4', type: 'Receipt', prefix: 'R/', suffix: '/A', startingNumber: 500, finYearId: 'fy-2', status: 'Active' },
];


// --- NEW: LOCAL STORAGE PERSISTENCE LOGIC ---
const LS_OPERATING_COMPANIES_KEY = 'finroots-operatingCompanies';
const LS_USERS_KEY = 'finroots-users';

// --- MODIFIED: MOCK DATA FOR DESIGNATIONS (isAdvisor REMOVED) ---
let designationsData: Designation[] = [
    { id: 'des-admin', name: 'Admin', active: true, order: 0 },
    { id: 'des-advisor', name: 'Advisor', active: true, order: 1 },
    { id: 'des-secretary', name: 'Secretary', active: true, order: 2 },
    { id: 'des-support', name: 'Support', active: true, order: 3 },
    { id: 'des-security', name: 'Security', active: true, order: 4 }, // Example for a user without a role
];

// --- NEW: MOCK DATA FOR ROLES (contains isAdvisor logic) ---
let rolesData: Role[] = [
    { id: 'role-admin', name: 'System Administrator', isAdvisor: false, active: true, order: 0 },
    { id: 'role-advisor', name: 'Sales Advisor', isAdvisor: true, active: true, order: 1 },
    { id: 'role-secretary', name: 'Office Secretary', isAdvisor: false, active: true, order: 2 },
    { id: 'role-support', name: 'Support Staff', isAdvisor: false, active: true, order: 3 },
];

// --- NEW: MOCK DATA FOR DOCUMENT RULES ---
let insuranceTypeDocumentRulesData: InsuranceTypeDocumentRule[] = [
    // Life Insurance (Parent) requires PAN and Aadhaar
    { id: 'rule-1', insuranceTypeId: 'it-life', documentId: 'doc-1', isMandatory: true }, // PAN Card
    { id: 'rule-2', insuranceTypeId: 'it-life', documentId: 'doc-2', isMandatory: true }, // Aadhaar Card
    // Term Life (Child) also requires a Bank Statement
    { id: 'rule-3', insuranceTypeId: 'it-term', documentId: 'doc-5', isMandatory: false }, // Bank Statement (Not Mandatory)
    // Health Insurance requires Aadhaar
    { id: 'rule-4', insuranceTypeId: 'it-health', documentId: 'doc-2', isMandatory: true }, // Aadhaar Card
    // Motor Insurance requires RC book
    { id: 'rule-5', insuranceTypeId: 'it-motor', documentId: 'doc-4', isMandatory: true }, // Driving License (as a stand-in for RC)
];


// --- MODIFIED: MOCK DATA FOR DESIGNATION PERMISSIONS NOW USES PERMISSIONLEVEL ---
// --- NOTE: This will later be changed to RolePermissions ---
// --- MODIFIED: This is now RolePermissionsData and is keyed by roleId ---
let rolePermissionsData: RolePermissions[] = [
    {
        roleId: 'role-admin',
        permissions: { // Admin has full modify access
            dashboard: 'modify', 'reports & insights': 'modify', profitAndLoss: 'modify', calendar: 'modify', employees: 'modify', 
            pipeline: 'modify', customers: 'modify', taskManagement: 'modify', policies: 'modify', mutualFunds: 'modify', 
            upselling: 'modify', notes: 'modify', actionHub: 'modify', servicesHub: 'modify', location: 'modify', 
            chatbot: 'modify', masterMember: 'modify', advancedReports: 'modify', 
        }
    },
    {
        roleId: 'role-advisor',
        permissions: { // Advisor has core access but is restricted in some areas
            dashboard: 'view', 'reports & insights': 'view', profitAndLoss: 'create', calendar: 'view', employees: 'none',
            pipeline: 'modify', customers: 'modify', taskManagement: 'modify', policies: 'modify', mutualFunds: 'modify',
            upselling: 'view', notes: 'modify', actionHub: 'modify', servicesHub: 'view', location: 'modify',
            chatbot: 'modify', masterMember: 'none', advancedReports: 'none',
        }
    },
    {
        roleId: 'role-secretary',
        permissions: { // Secretary has limited, specific access
            dashboard: 'view', 'reports & insights': 'none', profitAndLoss: 'none', calendar: 'create', employees: 'none',
            pipeline: 'none', customers: 'create', taskManagement: 'create', policies: 'view', mutualFunds: 'none',
            upselling: 'none', notes: 'create', actionHub: 'none', servicesHub: 'none', location: 'none',
            chatbot: 'none', masterMember: 'none', advancedReports: 'none',
        }
    },
    {
        roleId: 'role-support',
        permissions: { // Support has specific access rights
            dashboard: 'view', 'reports & insights': 'view', profitAndLoss: 'none', calendar: 'view', employees: 'view',
            pipeline: 'view', customers: 'view', taskManagement: 'view', policies: 'view', mutualFunds: 'view',
            upselling: 'view', notes: 'view', actionHub: 'view', servicesHub: 'view', location: 'none',
            chatbot: 'view', masterMember: 'none', advancedReports: 'none',
        }
    }
];

// --- UNIFIED DATA SOURCE FOR BRANCHES ---
// This is now the single source of truth for all branches in the application.
const finrootsBranchesData: FinRootsBranch[] = [
    // Finroots Branches
    { id: 'frb-1', branchName: 'Erode HQ', branchId: 'FIN01-ERD', companyMappings: [], active: true, companyId: 'FIN01', gstin: '33ABCDE1234F1Z5', pan: 'ABCDE1234F', tan: 'ERDF12345G' },
    { id: 'frb-2', branchName: 'Coimbatore Hub', branchId: 'FIN01-CBE', companyMappings: [], active: true, companyId: 'FIN01', gstin: '33ABCDE1234F1Z6', pan: 'ABCDE1234F', tan: 'CBEF12345G' },
];


// Mock Data for Companies
const initialCompanies: Company[] = [
    {
        id: 'FIN01',
        companyCode: 'FIN01',
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

// --- MODIFIED: Users now have a roleId ---
const initialUsers: User[] = [
    // Finroots Users
    {
        id: 'user-1',
        employeeId: 'admin',
        name: 'Admin',
        email: 'admin@finroots.com',
        role: 'Admin', 
        designationId: 'des-admin',
        roleId: 'role-admin', // --- ADDED ---
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'AU',
         password: 'admin',
        profile: { 
            status: 'Active', 
            companyId: 'FIN01',
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
    roleId: 'role-secretary', // --- ADDED ---
    company: 'Finroots',
    companyId: 'FIN01',
    initials: 'SU',
       password: 'secretary',
    profile: { 
        status: 'Active', 
        companyId: 'FIN01',
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
        roleId: 'role-advisor', // --- ADDED ---
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'RP',
         password: 'password',
        profile: {
            status: 'Active',
            specializations: [],
            companyId: 'FIN01',
            employeeBranchId: 'frb-1', // Erode HQ
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
        roleId: 'role-advisor', // --- ADDED ---
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'PS',
           password: 'password',
        profile: {
            status: 'Active',
            specializations: ['Life'],
            companyId: 'FIN01',
            employeeBranchId: 'frb-2', // Coimbatore Hub
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
        roleId: 'role-advisor', // --- ADDED ---
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'AS',
         password: 'password',
        profile: {
            status: 'Active',
            specializations: ['Health'],
            companyId: 'FIN01',
            employeeBranchId: 'frb-1', // Erode HQ
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
        roleId: 'role-support', // --- ADDED ---
        company: 'Finroots',
        companyId: 'FIN01',
        initials: 'FS',
         password: 'support',
        profile: { 
            status: 'Active', 
            companyId: 'FIN01',
            permissions: {}
        }
    }
];

// --- HYDRATED STATE FROM LOCAL STORAGE OR DEFAULTS ---

let companies: Company[] = (() => {
    try {
        const stored = localStorage.getItem(LS_OPERATING_COMPANIES_KEY);
        return stored ? JSON.parse(stored) : initialCompanies;
    } catch (e) {
        console.error("Failed to parse stored companies:", e);
        // On failure, reset to default and clear bad data
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

// --- CORRECTION: Moved variable declaration to the top level ---
let relationshipTypesData: RelationshipType[] = [
    { id: 'rel-1', name: 'Self', active: true, order: 0 },
    { id: 'rel-2', name: 'Spouse', active: true, order: 1 },
    { id: 'rel-3', name: 'Son', active: true, order: 2 },
    { id: 'rel-4', name: 'Daughter', active: true, order: 3 },
    { id: 'rel-5', name: 'Father', active: true, order: 4 },
    { id: 'rel-6', name: 'Mother', active: true, order: 5 },
];


// --- NEW: Mock Data for Religions and Festivals ---
let religionsData: Religion[] = [
    { id: 'rel-1', name: 'Hinduism', active: true, order: 0 },
    { id: 'rel-2', name: 'Christianity', active: true, order: 1 },
    { id: 'rel-3', name: 'Islam', active: true, order: 2 },
    { id: 'rel-4', name: 'Sikhism', active: true, order: 3 },
    { id: 'rel-gen', name: 'General', active: true, order: 4 }, // NEW
];

// MODIFIED: `festivalsData` simplified.
let festivalsData: Festival[] = [
    { id: 'fest-1', name: 'Diwali', religionId: 'rel-1', active: true },
    { id: 'fest-3', name: 'Eid al-Fitr', religionId: 'rel-3', active: true },
    { id: 'fest-4', name: 'Holi', religionId: 'rel-1', active: true },
    { id: 'fest-5', name: 'Good Friday', religionId: 'rel-2', active: true },
    { id: 'fest-2', name: 'Christmas', religionId: 'rel-2', active: true },
    { id: 'fest-6', name: 'New Year\'s Day', religionId: 'rel-gen', active: true }, // MODIFIED
];

// Data store for annual dates of festivals.
let festivalDatesData: FestivalDate[] = [
    // Diwali Dates
    { id: 'fest-date-1', festivalId: 'fest-1', year: 2024, date: '2024-11-01', active: true },
    { id: 'fest-date-2', festivalId: 'fest-1', year: 2025, date: '2025-10-21', active: true },

    // Eid al-Fitr Dates
    { id: 'fest-date-3', festivalId: 'fest-3', year: 2025, date: '2025-03-30', active: true },
    { id: 'fest-date-4', festivalId: 'fest-3', year: 2026, date: '2026-03-20', active: true },
    
    // Holi Dates
    { id: 'fest-date-5', festivalId: 'fest-4', year: 2025, date: '2025-03-14', active: true },
    { id: 'fest-date-6', festivalId: 'fest-4', year: 2026, date: '2026-03-04', active: true },
    
    // Good Friday Dates
    { id: 'fest-date-7', festivalId: 'fest-5', year: 2025, date: '2025-04-18', active: true },
    { id: 'fest-date-8', festivalId: 'fest-5', year: 2026, date: '2026-04-03', active: true },
    
    // Christmas Dates
    { id: 'fest-date-9', festivalId: 'fest-2', year: 2024, date: '2024-12-25', active: true },
    { id: 'fest-date-10', festivalId: 'fest-2', year: 2025, date: '2025-12-25', active: true },

    // New Year's Day Dates
    { id: 'fest-date-11', festivalId: 'fest-6', year: 2025, date: '2025-01-01', active: true },
    { id: 'fest-date-12', festivalId: 'fest-6', year: 2026, date: '2026-01-01', active: true },
];

// --- START OF CORRECTION ---
// Mock Data for Upselling Categories.
// This is now simplified. The dashboard component will dynamically find all child insurance types.
let upsellCategoriesData: UpsellCategory[] = [
    { id: 'uc-1', name: 'Life Insurance', order: 0, active: true, linkedInsuranceTypeIds: ['it-life'] },
    { id: 'uc-2', name: 'Health Insurance', order: 1, active: true, linkedInsuranceTypeIds: ['it-health'] },
    { id: 'uc-3', name: 'General Insurance', order: 2, active: true, linkedInsuranceTypeIds: ['it-general'] },
];
// --- END OF CORRECTION ---

// --- NEW: Mock Data for Gender, Marital Status, and Customer Type ---
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

// MODIFIED: initialCustomerTiers now uses customerTypeId
const initialCustomerTiers: CustomerTier[] = [
    { id: 'tier-1', customerTypeId: 'ct-1', name: 'Silver', minimumSumAssured: 0, minimumPremium: 0, giftId: 'gift-1', active: true, order: 0 },
    { id: 'tier-2', customerTypeId: 'ct-2', name: 'Gold', minimumSumAssured: 500000, minimumPremium: 25000, giftId: 'gift-2', active: true, order: 1 },
    { id: 'tier-3', customerTypeId: 'ct-3', name: 'Diamond', minimumSumAssured: 1500000, minimumPremium: 75000, giftId: 'gift-3', active: true, order: 2 },
    { id: 'tier-4', customerTypeId: 'ct-4', name: 'Platinum', minimumSumAssured: 3000000, minimumPremium: 150000, giftId: 'gift-4', active: true, order: 3 },
];


// --- MODIFICATION START: Replaced single process flow with product-specific flows ---
let processStageMastersData: ProcessStageMaster[] = [
    // Life Insurance
    { id: 'ps-life-1', name: 'Initial Contact', insuranceTypeId: 'it-life', order: 0, active: true },
    { id: 'ps-life-2', name: 'Requirement Analysis', insuranceTypeId: 'it-life', order: 1, active: true },
    { id: 'ps-life-3', name: 'Plan Presentation', insuranceTypeId: 'it-life', order: 2, active: true },
    { id: 'ps-life-4', name: 'Application Form Filling', insuranceTypeId: 'it-life', order: 3, active: true },
    { id: 'ps-life-5', name: 'Premium Collection', insuranceTypeId: 'it-life', order: 4, active: true },
    { id: 'ps-life-6', name: 'Policy Issuance', insuranceTypeId: 'it-life', order: 5, active: true },
    { id: 'ps-life-7', name: 'Policy Delivery', insuranceTypeId: 'it-life', order: 6, active: true },
    
    // Health Insurance
    { id: 'ps-health-1', name: 'Lead Generation', insuranceTypeId: 'it-health', order: 0, active: true },
    { id: 'ps-health-2', name: 'Consultation', insuranceTypeId: 'it-health', order: 1, active: true },
    { id: 'ps-health-3', name: 'Plan Comparison', insuranceTypeId: 'it-health', order: 2, active: true },
    { id: 'ps-health-4', name: 'Proposal Submission', insuranceTypeId: 'it-health', order: 3, active: true },
    { id: 'ps-health-5', name: 'Medical Underwriting', insuranceTypeId: 'it-health', order: 4, active: true },
    { id: 'ps-health-6', name: 'Policy Activation', insuranceTypeId: 'it-health', order: 5, active: true },

    // General Insurance
    { id: 'ps-general-1', name: 'Inquiry', insuranceTypeId: 'it-general', order: 0, active: true },
    { id: 'ps-general-2', name: 'Quotation', insuranceTypeId: 'it-general', order: 1, active: true },
    { id: 'ps-general-3', name: 'Inspection (if any)', insuranceTypeId: 'it-general', order: 2, active: true },
    { id: 'ps-general-4', name: 'Payment', insuranceTypeId: 'it-general', order: 3, active: true },
    { id: 'ps-general-5', name: 'Cover Note Issuance', insuranceTypeId: 'it-general', order: 4, active: true },

    // Mutual Funds
    { id: 'ps-mf-1', name: 'Risk Profiling', isMutualFund: true, order: 0, active: true },
    { id: 'ps-mf-2', name: 'KYC Verification', isMutualFund: true, order: 1, active: true },
    { id: 'ps-mf-3', name: 'Scheme Selection', isMutualFund: true, order: 2, active: true },
    { id: 'ps-mf-4', name: 'Investment Execution', isMutualFund: true, order: 3, active: true },
    { id: 'ps-mf-5', name: 'Portfolio Review', isMutualFund: true, order: 4, active: true },
];
// --- MODIFICATION END ---

// --- NEW: MOCK DATA FOR LEAD STAGE MASTER ---
let leadStageMastersData: LeadStageMaster[] = [
    { id: 'ls-stage-1', name: 'Lead', order: 0, active: true },
    { id: 'ls-stage-2', name: 'Contacted', order: 1, active: true },
    { id: 'ls-stage-3', name: 'Meeting Scheduled', order: 2, active: true },
    { id: 'ls-stage-4', name: 'Proposal Sent', order: 3, active: true },
];
// --- END NEW ---


// Premium Calculation Logic
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

// --- DIGIPIN GENERATION ---
// This is exported so the simulated geminiService can use it.
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

    // Replace space with '+' as per standard Plus Code format
    return code.replace(' ', '+').slice(0, 11); // e.g., 7J4VPQCP+HG
};


// --- DYNAMIC DATE GENERATION FOR DEMO ---
const today = new Date();
const priyaDob = new Date(today);
priyaDob.setFullYear(1985);
const kavyaAnniversary = new Date(today);
kavyaAnniversary.setFullYear(2005);
const vikramRenewal = new Date(today);
vikramRenewal.setDate(today.getDate() + 7);
const deepaRenewal = new Date(today);
deepaRenewal.setDate(today.getDate() + 25);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

// In-memory database simulation
// MODIFIED: gender and maritalStatus now use IDs
// MODIFICATION START: Updated members to use new process stage structure
let members: Member[] = [
  {
      id: '1',
      sno: 1, // New permanent ID
      name: 'Priya Sharma',
      memberId: 'PR1043312',
      dob: formatDate(priyaDob), // Dynamic Birthday
      gender: 'gen-2', // Female
      bloodGroup: 'O+',
      maritalStatus: 'mar-2', // Married
      mobile: '+91 9876543312',
      state: 'Maharashtra',
      city: 'Mumbai City',
      address: '101, Thirupathi Valley, Goregaon East',
      memberType: 'Diamond', // Updated to Diamond based on new tiers
      tierId: 'tier-3', // Updated to tier-3
      active: true,
      panCard: 'ABCDE1234F',
      aadhaar: '1234 5678 9012',
      anniversary: '2010-04-20',
      policies: [{
          id: 'POL001',
          policyType: 'Life Insurance',
          status: 'Active',
          coverage: 2300000, // Updated coverage
          premium: 25000,
          renewalDate: '2024-08-13',
          renewalLink: 'https://example.com/renew/life',
          commission: { amount: 2500, status: 'Paid', paidDate: '2024-06-15' },
          documentReceived: false,
          licData: {
              fatherName: 'Rajesh Sharma'
          },
          companyId: 'FIN01',
          insuranceTypeId: 'it-term'
      }],
      voiceNotes: [],
      documents: [],
      checkIns: [],
      digipin: '7JFJ3Q6H+2V', // Mumbai
      lat: 19.1678,
      lng: 72.8647,
      digipinDetails: {
          summary: 'A bustling residential area in Goregaon East.',
          landmarks: ['Oberoi Mall', 'Goregaon Station', 'Film City'],
      },
      automatedGreetingsEnabled: true,
      inactiveSince: null,
      assignedTo: ['user-2'], // Rohan Patel
      leadSource: { sourceId: 'rt-3', detail: 'Arjun Mehta' },
      processStage: 'Premium Collection', // DEPRECATED - kept for fallback
      processStages: { 'it-life': 'Premium Collection' },
      stageLastChanged: '2024-07-10T10:00:00.000Z', // DEPRECATED
      stageLastChangedMap: { 'it-life': '2024-07-10T10:00:00.000Z' },
      processHistory: [], // DEPRECATED
      processHistories: { 'it-life': [] },
      createdBy: 'user-1',
      createdAt: '2024-01-10T10:00:00.000Z',
      financialProfile: {
          riskTolerance: 'Medium',
          annualIncome: 2500000
      },
      bankDetails: {},
      company: 'Finroots',
      companyId: 'FIN01',
      branchId: 'frb-2', // Coimbatore Hub
      isSPOC: true,
      familyName: 'The Sharmas',
      religionId: 'rel-1' // Hinduism
      ,
      country: ''
  },

  {
      id: '2',
      sno: 2, // New permanent ID
      name: 'Deepa Verma',
      memberId: 'DEA286543',
      dob: '1990-11-12',
      gender: 'gen-2', // Female
      bloodGroup: 'A+',
      maritalStatus: 'mar-1', // Single
      mobile: '+91 9043386543',
      state: 'Delhi',
      city: 'New Delhi',
      address: 'A-23, Mullai Nagar, Connaught Place',
      memberType: 'Silver', // Still Silver
      tierId: 'tier-1',
      active: true,
      panCard: 'FGHIJ5678K',
      aadhaar: '2345 6789 0123',
      policies: [{ id: 'POL002', policyType: 'Health Insurance', status: 'Active', coverage: 500000, premium: 15000, renewalDate: formatDate(deepaRenewal), renewalLink: 'https://example.com/renew/health', commission: { amount: 1500, status: 'Paid', paidDate: '2024-05-25' }, documentReceived: false, companyId: 'FIN01', insuranceTypeId: 'it-individual-health' }],
      voiceNotes: [],
      documents: [],
      checkIns: [],
      lat: 28.6315, // Legacy data for backward compatibility
      lng: 77.2167,
      automatedGreetingsEnabled: false,
      inactiveSince: null,
      assignedTo: ['user-3'], // Priya Singh
      leadSource: { sourceId: 'ls-3' },
      processStage: 'Proposal Submission',
      processStages: { 'it-health': 'Proposal Submission' },
      stageLastChanged: '2024-07-15T10:00:00.000Z',
      stageLastChangedMap: { 'it-health': '2024-07-15T10:00:00.000Z' },
      processHistory: [],
      processHistories: { 'it-health': [] },
      createdBy: 'user-2',
      createdAt: '2024-02-15T10:00:00.000Z',
      financialProfile: {
          riskTolerance: 'Low'
      },
      bankDetails: {},
      company: 'Finroots',
      companyId: 'FIN01',
      branchId: 'frb-1', // Erode HQ
      religionId: 'rel-2' // Christianity
      ,
      country: ''
  },
  {
      id: '3',
      sno: 3, // New permanent ID
      name: 'Kavya Reddy',
      memberId: 'KA5446573',
      dob: '1982-03-30',
      gender: 'gen-2', // Female
      bloodGroup: 'B-',
      maritalStatus: 'mar-2', // Married
      mobile: '+91 9675346573',
      state: 'Karnataka',
      city: 'Bengaluru (Bangalore) Urban',
      address: '54, TVS Road, HSR Layout',
      memberType: 'Silver', // Updated to Silver based on new tiers
      tierId: 'tier-1',
      active: true,
      panCard: 'KLMNO9012L',
      aadhaar: '3456 7890 1234',
      anniversary: formatDate(kavyaAnniversary), // Dynamic Anniversary
      policies: [
          { id: 'POL003', policyType: 'General Insurance', generalInsuranceType: 'Motor', status: 'Active', coverage: 350000, premium: 8000, renewalDate: '2024-04-10', commission: { amount: 400, status: 'Paid', paidDate: '2024-04-12' }, documentReceived: true, companyId: 'FIN01', insuranceTypeId: 'it-motor' },
      ],
      voiceNotes: [],
      documents: [],
      checkIns: [],
      lat: 12.9121,
      lng: 77.6389,
      automatedGreetingsEnabled: true,
      inactiveSince: null,
      assignedTo: ['user-3'], // Priya Singh
      leadSource: { sourceId: 'ls-8' },
      processStage: 'Payment',
      processStages: { 'it-general': 'Payment' },
      stageLastChanged: '2024-06-20T10:00:00.000Z',
      stageLastChangedMap: { 'it-general': '2024-06-20T10:00:00.000Z' },
      processHistory: [],
      processHistories: { 'it-general': [] },
      createdBy: 'user-2',
      createdAt: '2024-03-20T10:00:00.000Z',
      financialProfile: {},
      bankDetails: {},
      company: 'Finroots',
      companyId: 'FIN01',
      branchId: 'frb-2',
      country: ''
  },
  {
      id: '4',
      sno: 4, // New permanent ID
      name: 'Ramya Iyer',
      memberId: 'RA3483536',
      dob: '1995-08-25',
      gender: 'gen-2', // Female
      bloodGroup: 'AB+',
      maritalStatus: 'mar-1', // Single
      mobile: '+91 8736283536',
      state: 'Tamil Nadu',
      city: 'Chennai',
      address: '3/45, Ram Nagar, Nungambakkam',
      memberType: 'Gold', // Updated to Gold based on new tiers
      tierId: 'tier-2',
      active: false,
      inactiveSince: '2024-03-15T10:00:00.000Z',
      panCard: 'PQRST3456M',
      aadhaar: '4567 8901 2345',
      anniversary: '2025-08-18',
      policies: [{ id: 'POL004', policyType: 'Life Insurance', status: 'Inactive', coverage: 1000000, premium: 12000, renewalDate: '2024-03-30', commission: { amount: 1000, status: 'Cancelled' }, documentReceived: false, companyId: 'FIN01', insuranceTypeId: 'it-life' }],
      voiceNotes: [],
      documents: [],
      checkIns: [],
      digipin: '7M52376V+5R', // Chennai
      lat: 13.0604,
      lng: 80.2495,
      automatedGreetingsEnabled: false,
      assignedTo: [],
      leadSource: { sourceId: 'ls-4' },
      processStage: 'Initial Contact',
      processStages: { 'it-life': 'Initial Contact' },
      stageLastChanged: '2024-02-01T10:00:00.000Z',
      stageLastChangedMap: { 'it-life': '2024-02-01T10:00:00.000Z' },
      processHistory: [],
      processHistories: {},
      createdBy: 'user-1',
      createdAt: '2024-04-01T10:00:00.000Z',
      financialProfile: {},
      bankDetails: {},
      company: 'Finroots',
      companyId: 'FIN01',
      branchId: 'frb-1',
      country: ''
  },
    {
        id: '5',
        sno: 5, // New permanent ID
        name: 'Vikram Singh',
        memberId: 'VI7B56789',
        dob: '1978-01-15',
        gender: 'gen-1', // Male
        bloodGroup: 'O-',
        maritalStatus: 'mar-2', // Married
        mobile: '+91 9123456789',
        state: 'Maharashtra',
        city: 'Pune',
        address: '7B, Clover Park, Viman Nagar',
        memberType: 'Diamond', // Updated to Diamond based on new tiers
        tierId: 'tier-3',
        active: true,
        panCard: 'UVXYZ9876A',
        aadhaar: '9876 5432 1098',
        policies: [{ id: 'POL005', policyType: 'Health Insurance', status: 'Active', coverage: 1650000, premium: 18000, renewalDate: formatDate(vikramRenewal), documentReceived: true, commission: { amount: 1800, status: 'Paid', paidDate: '2024-02-06' }, companyId: 'FIN01', insuranceTypeId: 'it-family-floater' }],
        voiceNotes: [],
        documents: [],
        checkIns: [],
        lat: 18.5679,
        lng: 73.9143,
        automatedGreetingsEnabled: true,
        inactiveSince: null,
        assignedTo: ['user-2'], // Rohan Patel
        leadSource: { sourceId: 'ls-5' },
        processStage: 'Policy Activation',
        processStages: { 'it-health': 'Policy Activation' },
        stageLastChanged: '2024-05-15T10:00:00.000Z',
        stageLastChangedMap: { 'it-health': '2024-05-15T10:00:00.000Z' },
        processHistory: [],
        processHistories: {},
        createdBy: 'user-2',
        createdAt: '2024-05-15T10:00:00.000Z',
        financialProfile: {
            riskTolerance: 'High',
            annualIncome: 4000000
        },
        bankDetails: {},
        company: 'Finroots',
        companyId: 'FIN01',
        branchId: 'frb-1',
        country: ''
    },
   {
       id: '6',
       sno: 6, // New permanent ID for Finroots
       name: 'Arjun Mehta',
       memberId: 'AR1176655',
       dob: '1992-07-22',
       gender: 'gen-1', // Male
       bloodGroup: 'A-',
       maritalStatus: 'mar-1', // Single
       mobile: '+91 9988776655',
       state: 'Karnataka',
       city: 'Bengaluru (Bangalore) Urban',
       address: '112, 4th Cross, Indiranagar',
       memberType: 'Platinum',
       tierId: 'tier-4',
       active: true,
       panCard: 'BCDEF2345G',
       aadhaar: '8765 4321 0987',
       policies: [
           { id: 'POL006', policyType: 'Health Insurance', status: 'Active', coverage: 1000000, premium: 22000, renewalDate: '2025-01-20', commission: { amount: 2000, status: 'Paid', paidDate: '2024-01-22' }, documentReceived: true, companyId: 'FIN01', insuranceTypeId: 'it-health' },
           { id: 'POL007', policyType: 'Life Insurance', status: 'Active', coverage: 2800000, premium: 30000, renewalDate: '2025-01-20', commission: { amount: 3000, status: 'Paid', paidDate: '2024-01-22' }, documentReceived: true, companyId: 'FIN01', insuranceTypeId: 'it-life' }
       ],
       mutualFundHoldings: [
           {
               id: 'mfh-1',
               schemeId: 'mf-2', // HDFC Small Cap
               folioNumber: '987654321/12',
               investmentType: 'SIP',
               totalInvestment: 35000,
               units: 350,
               currentValue: 38500,
               sipAmount: 5000,
               sipDate: 10,
               status: 'Active',
               transactions: [],
               sipRejections: [
                   {
                       date: new Date(new Date().setDate(today.getDate() - 12)).toISOString().split('T')[0],
                       reason: 'Insufficient Funds'
                   }
               ]
           }
       ],
       voiceNotes: [],
       documents: [],
       checkIns: [],
       lat: 12.9784,
       lng: 77.6408,
       automatedGreetingsEnabled: true,
       inactiveSince: null,
       assignedTo: ['user-2', 'user-3'], // Rohan & Priya
       leadSource: { sourceId: 'ls-7' },
       processStage: 'Initial Contact', // Fallback
       processStages: { 'it-health': 'Consultation', 'it-life': 'Requirement Analysis', 'mutual-fund': 'KYC Verification' },
       stageLastChanged: '2024-07-22T10:00:00.000Z', // Fallback
       stageLastChangedMap: { 'it-health': '2024-07-22T10:00:00.000Z', 'it-life': '2024-07-22T10:00:00.000Z', 'mutual-fund': '2024-07-22T10:00:00.000Z' },
       processHistory: [],
       processHistories: {},
       createdBy: 'user-2',
       createdAt: '2024-07-22T10:00:00.000Z',
       financialProfile: {
           riskTolerance: 'Aggressive',
           annualIncome: 5500000
       },
       bankDetails: {},
       company: 'Finroots',
       companyId: 'FIN01',
       branchId: 'frb-2',
       country: ''
   }
];
// MODIFICATION END

// --- START: AUTOMATIC DATA HYDRATION LOGIC ---
const hydrateInitialData = (memberData: Member[]): Member[] => {
    // A simple map to assign a default scheme to policies that are missing it.
    // In a real app, this logic could be much more complex.
    const defaultSchemes: Record<string, { schemeId: string, schemeName: string }> = {
        'Life Insurance': { schemeId: 'sch-2', schemeName: 'Jeevan Anand' },
        'Health Insurance': { schemeId: 'sch-5', schemeName: 'Comprehensive Health Plan' },
        'Motor': { schemeId: 'sch-9', schemeName: 'Drive Smart' },
    };

    return memberData.map(member => ({
        ...member,
        policies: member.policies.map(policy => {
            // If schemeId already exists, do nothing.
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
            
            // Return original policy if no default is found
            return policy;
        })
    }));
};

// Run the hydration process on the initial data
members = hydrateInitialData(members);
// --- END: AUTOMATIC DATA HYDRATION LOGIC ---

let leads: Lead[] = [
    { id: 'lead-1', name: 'Ravi Kumar', phone: '9876512345', email: 'ravi.k@example.com', leadSource: { sourceId: 'ls-8' }, status: 'Lead', estimatedValue: 15000, assignedTo: 'user-2', createdAt: '2024-07-20T10:00:00Z', notes: 'Interested in a family health plan.', company: 'Finroots', companyId: 'FIN01' },
    { id: 'lead-2', name: 'Sunita Nair', phone: '9123456780', email: 'sunita.n@example.com', leadSource: { sourceId: 'rt-2', detail: 'Priya Sharma' }, status: 'Contacted', estimatedValue: 25000, assignedTo: 'user-2', createdAt: '2024-07-18T14:30:00Z', notes: 'Referred by Priya Sharma. Follow up next week.', company: 'Finroots', companyId: 'FIN01' },
    { id: 'lead-3', name: 'Amit Desai', phone: '9988776650', email: 'amit.d@example.com', leadSource: { sourceId: 'ls-4' }, status: 'Meeting Scheduled', estimatedValue: 50000, assignedTo: 'user-2', createdAt: '2024-07-15T11:00:00Z', notes: 'Meeting on Friday at 3 PM to discuss life insurance options.', company: 'Finroots', companyId: 'FIN01' },
    { id: 'lead-4', name: 'Meera Gupta', phone: '9000011111', email: 'meera.g@example.com', leadSource: { sourceId: 'ls-9' }, status: 'Proposal Sent', estimatedValue: 12000, assignedTo: 'user-2', createdAt: '2024-07-12T09:00:00Z', notes: 'Sent proposal for vehicle insurance. Awaiting response.', company: 'Finroots', companyId: 'FIN01' },
];

// NEW: In-memory stores for location tracking data
let advisorLocationsData: AdvisorLocation[] = [];
let checkInData: CheckIn[] = [];
let advisorLocationHistoryData: Record<string, { lat: number; lng: number; timestamp: string }[]> = {};


// Mock database for the auto-fill feature
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

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'Mumbai City': { lat: 19.0760, lng: 72.8777 },
    'New Delhi': { lat: 28.7041, lng: 77.1025 },
    'Bengaluru (Bangalore) Urban': { lat: 12.9716, lng: 77.5946 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};


const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MODIFIED: Login function - isAdvisor logic REMOVED ---
export const login = async (company: string, employeeId: string, password_param: string, roleId: string, branchId?: string, financialYearId?: string): Promise<User | null> => {
    await simulateDelay(200);

    const user = users.find(u =>
        u.company === company &&
        u.employeeId.toLowerCase() === employeeId.toLowerCase() &&
        u.password === password_param
    );

    if (!user) {
        return null;
    }

    // --- MODIFIED: The check is now against the user's assigned Role ID ---
    if (user.roleId !== roleId) {
        return null; // Role mismatch
    }

    if (user.profile?.employeeBranchId && user.profile.employeeBranchId !== branchId) {
        return null; // Branch mismatch for any user who has a specific branch assigned.
    }

    if (financialYearId && !financialYearsData.find(fy => fy.id === financialYearId)) {
        return null; // Invalid financial year
    }

    // A user without a roleId cannot log in.
    if (!user.roleId) {
        return null;
    }

    return user ? JSON.parse(JSON.stringify(user)) : null;
};

// --- NEW: API functions for Financial Year and Document Numbering ---
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


export const getUsers = async (companyId?: string): Promise<User[]> => {
  await simulateDelay(100);
  const filteredUsers = companyId ? users.filter(u => u.companyId === companyId) : users;
  return JSON.parse(JSON.stringify(filteredUsers));
};

// RENAMED: from createAdvisor to createEmployee
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
        profile: { status: employeeData.profile?.status || 'Active', ...employeeData.profile, companyId: employeeData.companyId }
    };
    users.push(newEmployee);
    return JSON.parse(JSON.stringify(newEmployee));
};

// RENAMED: from updateAdvisor to updateEmployee
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

// RENAMED: from deleteAdvisor to deleteEmployee
export const deleteEmployee = async (userId: string): Promise<{ success: true }> => {
    await simulateDelay(300);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length === initialLength) {
        throw new Error('Employee not found');
    }
    return { success: true };
};


export const getMembers = async (companyId?: string, advisorId?: string): Promise<Member[]> => {
  await simulateDelay(500);
  let filteredMembers = companyId ? members.filter(m => m.companyId === companyId) : members;

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

  const membersOfCompany = members.filter(m => m.companyId === memberData.companyId);
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
    processStage: memberData.processStage || 'Initial Contact', // Keep for fallback
    processStages: memberData.processStages || {},
    stageLastChanged: memberData.stageLastChanged || new Date().toISOString(), // Keep for fallback
    stageLastChangedMap: memberData.stageLastChangedMap || {},
    companyId: memberData.companyId,
    maritalStatus: memberData.maritalStatus || null, // Ensure default
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

// --- Route API Functions ---
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


// --- Lead API Functions ---
export const getLeads = async (): Promise<Lead[]> => {
    await simulateDelay(400);
    return JSON.parse(JSON.stringify(leads));
};

export const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'company' | 'companyId'>, companyId: string): Promise<Lead> => {
    await simulateDelay(300);
    const companyName = companies.find(c => c.id === companyId)?.name || 'Unknown';
    const newLead: Lead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...leadData,
        createdAt: new Date().toISOString(),
        status: leadData.status || 'Lead',
        company: companyName,
        companyId: companyId
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

// --- Operating Company API Functions ---
export const getOperatingCompanies = async (): Promise<Company[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(companies));
};

export const createOperatingCompany = async (companyData: Omit<Company, 'id'>): Promise<Company> => {
    await simulateDelay(300);
    const newCompany: Company = {
        id: companyData.companyCode || `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
            if (user.companyId === companyData.id) {
                return { ...user, company: companyData.name };
            }
            return user;
        });
    }

    localStorage.setItem(LS_OPERATING_COMPANIES_KEY, JSON.stringify(companies));

    return JSON.parse(JSON.stringify(companies[index]));
};

// --- Branch API Functions ---
export const getFinrootsBranches = async (): Promise<FinRootsBranch[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(finrootsBranchesData));
};

export const createBranch = async (branchData: Omit<FinRootsBranch, 'id'>): Promise<FinRootsBranch> => {
    await simulateDelay(300);
    const newBranch: FinRootsBranch = {
        id: `frb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...branchData,
        active: true,
    };
    finrootsBranchesData.push(newBranch);
    return JSON.parse(JSON.stringify(newBranch));
};

export const updateBranch = async (branchData: FinRootsBranch): Promise<FinRootsBranch> => {
    await simulateDelay(300);
    const index = finrootsBranchesData.findIndex(b => b.id === branchData.id);
    if (index === -1) {
        throw new Error('Branch not found');
    }
    finrootsBranchesData[index] = { ...finrootsBranchesData[index], ...branchData };
    return JSON.parse(JSON.stringify(finrootsBranchesData[index]));
};

// --- NEW: Role API Functions ---
export const getRoles = async (): Promise<Role[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(rolesData));
};

export const updateRoles = async (updatedData: Role[]): Promise<Role[]> => {
    await simulateDelay(200);
    rolesData = JSON.parse(JSON.stringify(updatedData));
    return rolesData;
};

// --- Designation & Permissions API Functions ---
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


// --- NEW: Relationship Type API Functions ---
export const getRelationshipTypes = async (): Promise<RelationshipType[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(relationshipTypesData));
};

export const updateRelationshipTypes = async (updatedData: RelationshipType[]): Promise<RelationshipType[]> => {
    await simulateDelay(200);
    relationshipTypesData = JSON.parse(JSON.stringify(updatedData));
    return relationshipTypesData;
};


// --- MODIFICATION START: New API functions for ProcessStageMaster ---
export const getProcessStageMasters = async (): Promise<ProcessStageMaster[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(processStageMastersData));
};

export const updateProcessStageMasters = async (updatedData: ProcessStageMaster[]): Promise<ProcessStageMaster[]> => {
    await simulateDelay(200);
    processStageMastersData = JSON.parse(JSON.stringify(updatedData));
    return processStageMastersData;
};
// --- MODIFICATION END ---

// --- NEW: API functions for LeadStageMaster ---
export const getLeadStageMasters = async (): Promise<LeadStageMaster[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(leadStageMastersData));
};

export const updateLeadStageMasters = async (updatedData: LeadStageMaster[]): Promise<LeadStageMaster[]> => {
    await simulateDelay(200);
    leadStageMastersData = JSON.parse(JSON.stringify(updatedData));
    return leadStageMastersData;
};
// --- END NEW ---


// --- REFACTORED & NEW: Religion & Festival API Functions ---
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


// --- NEW: Upselling Category API Functions ---
export const getUpsellCategories = async (): Promise<UpsellCategory[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(upsellCategoriesData));
};

// --- NEW: Gender, Marital Status, and Customer Type API Functions ---
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

// --- NEW: Customer Tiers API Function ---
export const getCustomerTiers = async (): Promise<CustomerTier[]> => {
    await simulateDelay(50);
    return JSON.parse(JSON.stringify(initialCustomerTiers));
};


// --- NEW: Location Tracking API Functions ---

export const getAdvisorLocations = async (): Promise<AdvisorLocation[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(advisorLocationsData));
};

export const getCheckIns = async (): Promise<CheckIn[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(checkInData));
};

export const updateAdvisorLocation = async (locationData: Omit<AdvisorLocation, 'advisorName'>): Promise<AdvisorLocation> => {
    await simulateDelay(50); // Faster update for live tracking
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

// --- NEW: API functions for Insurance Type Document Rules ---
export const getInsuranceTypeDocumentRules = async (): Promise<InsuranceTypeDocumentRule[]> => {
    await simulateDelay(100);
    return JSON.parse(JSON.stringify(insuranceTypeDocumentRulesData));
};

export const updateInsuranceTypeDocumentRules = async (updatedData: InsuranceTypeDocumentRule[]): Promise<InsuranceTypeDocumentRule[]> => {
    await simulateDelay(200);
    insuranceTypeDocumentRulesData = JSON.parse(JSON.stringify(updatedData));
    return insuranceTypeDocumentRulesData;
};