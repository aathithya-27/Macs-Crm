import React from 'react';
import {
    AutomationRule,
    DocTemplate,
    Geography,
    CompanyInfo,
    BankMaster,
    BusinessVertical,
    LeadSourceMaster,
    InsuranceAgency,
    SchemeMaster,
    DocumentMaster,
    GiftMaster,
    TaskStatusMaster,
    CustomerCategory,
    CustomerSubCategory,
    CustomerGroup,
    TaskMaster,
    CustomerFieldMaster,
    MutualFundFieldMaster,
    AccountType,
    InsuranceTypeMaster,
    InsuranceFieldMaster,
    Task,
    ExpenseCategoryLevel1,
    ExpenseCategoryLevel2,
    IncomeCategoryLevel1,
    IncomeCategoryLevel2,
    Expense,
    ManualReceipt,
    AMC,
    MutualFundScheme,
    ManualIncome,
    ManualCommission,
    OpeningBalance
} from '../types.ts';
import { Gift as GiftIcon, Calendar, Bell, Star } from 'lucide-react';
import { indianStates } from '../constants.tsx';

export const initialAutomationRules: AutomationRule[] = [
    {
        id: 1,
        type: 'Birthday Messages',
        timing: { value: 0, unit: 'days', relation: 'before' }, 
        enabled: true,
        template: 'Happy Birthday {name}! Wishing you a wonderful year ahead. Thank you for being our valued customer.',
        channels: ['whatsapp', 'sms'],
        icon: <GiftIcon className="text-pink-500" />
    },
    {
        id: 2,
        type: 'Anniversary Messages',
        timing: { value: 0, unit: 'days', relation: 'before' }, 
        enabled: true,
        template: 'Happy Anniversary {name}! May this special day bring you joy and happiness.',
        channels: ['whatsapp'],
        icon: <Calendar className="text-purple-500" />
    },
    {
        id: 3,
        type: 'Policy Renewal Messages',
        timing: { value: 30, unit: 'days', relation: 'before' },
        enabled: true,
        template: 'Dear {name}, your {policyType} policy is due for renewal in {days} days. Premium: {premium}. Renew now to continue your coverage.',
        channels: ['whatsapp', 'sms', 'email'],
        icon: <Bell className="text-blue-500" />
    },
    {
        id: 4,
        type: 'Policy Renewal Messages',
        timing: { value: 7, unit: 'days', relation: 'before' },
        enabled: true,
        template: 'Urgent: {name}, your policy expires in {days} days! Click here to renew: {renewalLink}',
        channels: ['whatsapp', 'sms'],
        icon: <Bell className="text-orange-500" />
    },
    {
        id: 5,
        type: 'Policy Renewal Messages',
        timing: { value: 1, unit: 'days', relation: 'before' },
        enabled: true,
        template: 'FINAL REMINDER: {name}, your {policyType} policy expires tomorrow! Renew now to avoid a lapse in coverage. Click here to renew: {renewalLink}',
        channels: ['whatsapp', 'sms'],
        icon: <Bell className="text-red-500" />
    },
    {
        id: 6,
        type: 'Housewarming', 
        timing: { value: 0, unit: 'days', relation: 'before' },
        enabled: true,
        template: 'Hi {name}, thinking of you on this special day: your Housewarming! Wishing you all the best.',
        channels: ['whatsapp'],
        icon: <Star className="text-yellow-500" />
    },
];

export const initialDocTemplates: DocTemplate[] = [
    { id: 'tpl-1', name: 'Life Insurance Proposal', content: `Dear {clientName},\n\nThank you for your interest...` },
    { id: 'tpl-2', name: 'Health Plan Comparison', content: `Hi {clientName},\n\nAs requested, here is a summary...` }
];


export const generateInitialGeographies = (): Geography[] => {
    const geographies: Geography[] = [];
    let idCounter = 1;
    const countryId = `geo-${idCounter++}`;
    geographies.push({ id: countryId, name: 'India', type: 'Country', parentId: null, active: true });
    for (const stateName in indianStates) {
        const stateId = `geo-${idCounter++}`;
        geographies.push({ id: stateId, name: stateName, type: 'State', parentId: countryId, active: true });
        const districts = indianStates[stateName as keyof typeof indianStates];
        for (const districtName of districts) {
            const districtId = `geo-${idCounter++}`;
            geographies.push({ id: districtId, name: districtName, type: 'District', parentId: stateId, active: true });
        }
    }
    return geographies;
};

export const initialCompanyInfo: CompanyInfo = {
    name: ' Marketing LLP',
    hq: 'Erode, Tamil Nadu',
    cin: 'U74999TZ2023LLP012345',
    incorporationDate: '2023-04-01',
};
export const initialBankMasters: BankMaster[] = [
    {
        id: 'bank-1',
        bankCode: 'SBI001',
        bankName: 'State Bank of India',
        branch_name: 'Erode Main Branch',
        dateOfCreation: '2023-05-10',
        active: true,
        line1: '123, Fort Road',
        city: 'Erode',
        state: 'Tamil Nadu',
        pinCode: '638001',
        phone1: '0424-2255888',
        contactPerson: 'Mr. Kumar',
        accountType: 'Current Account',
        accountNumber: '30012345678',
        ifscCode: 'SBIN0000837',
        creditLimit: 500000,
        authSign1: 'Director A',
        order: 0,
    },
    {
        id: 'bank-2',
        bankCode: 'HDFC001',
        bankName: 'HDFC Bank',
        branch_name: 'Perundurai Road Branch',
        dateOfCreation: '2023-06-15',
        active: true,
        line1: '456, Perundurai Road',
        city: 'Erode',
        state: 'Tamil Nadu',
        pinCode: '638011',
        phone1: '0424-2277444',
        contactPerson: 'Ms. Priya',
        accountType: 'Overdraft Account',
        accountNumber: '50098765432',
        ifscCode: 'HDFC0000201',
        creditLimit: 1000000,
        authSign1: 'Director A',
        authSign2: 'Director B',
        order: 1,
    },
];

export const initialBusinessVerticals: BusinessVertical[] = [ { id: 'bv-1', name: 'Insurance', active: true, order: 0 }, { id: 'bv-2', name: 'Mutual Funds', active: true, order: 1 }, { id: 'bv-3', name: 'Agent Appointments (SA)', active: true, order: 2 }, ];
export const initialLeadSources: LeadSourceMaster[] = [
    { id: 'ls-adv', name: 'Advertisement', parentId: null, active: true, order: 0, allowReferrerSelection: true  },
    { id: 'ls-dm', name: 'Digital Media', parentId: 'ls-adv', active: true, order: 0 },
    { id: 'ls-fb', name: 'Facebook', parentId: 'ls-dm', active: true, order: 0 },
    { id: 'ls-ig', name: 'Instagram', parentId: 'ls-dm', active: true, order: 1 },
    { id: 'ls-pm', name: 'Print Media', parentId: 'ls-adv', active: true, order: 1 },
    { id: 'ls-cc', name: 'Cold Call', parentId: null, active: true, order: 1 },
    { id: 'ls-ec', name: 'Existing Client', parentId: null, active: true, order: 2, allowReferrerSelection: true },
    { id: 'ls-inst', name: 'Institution', parentId: null, active: true, order: 3 },
    { id: 'ls-bni', name: 'BNI', parentId: 'ls-inst', active: true, order: 0 },
    { id: 'ls-lions', name: 'Lions', parentId: 'ls-inst', active: true, order: 1 },
    { id: 'ls-rotary', name: 'Rotary', parentId: 'ls-inst', active: true, order: 2 },
    { id: 'ls-of', name: 'Other Forum', parentId: null, active: true, order: 4 },
    { id: 'ls-ref', name: 'Referral', parentId: null, active: true, order: 5, allowReferrerSelection: true },
    { id: 'ls-friend', name: 'Friend', parentId: 'ls-ref', active: true, order: 0 },
    { id: 'ls-other', name: 'Other', parentId: 'ls-ref', active: true, order: 1 },
    { id: 'ls-relative', name: 'Relative', parentId: 'ls-ref', active: true, order: 2 },
    { id: 'ls-staff', name: 'Staff', parentId: null, active: true, order: 6 },
    { id: 'ls-self', name: 'Self Generated', parentId: null, active: true, order: 7 },
    { id: 'ls-web', name: 'Website', parentId: null, active: true, order: 8 },
    { id: 'ls-upsell', name: 'Upselling', parentId: null, active: true, order: 9 },
];

export const initialAgencies: InsuranceAgency[] = [
    {id: 'comp-max-life', agencyCode: 'MAXLIFE', name: 'Max Life Insurance', active: true},
    {id: 'comp-lic', agencyCode: 'LIC', name: 'Life Insurance Corporation (LIC)', active: true},
    {id: 'comp-hdfc-life', agencyCode: 'HDFCLIFE', name: 'HDFC Life', active: true},
    {id: 'comp-icici-pru', agencyCode: 'ICICIPRU', name: 'ICICI Prudential Life Insurance', active: true},
    {id: 'comp-star', agencyCode: 'STARHEALTH', name: 'Star Health & Allied Insurance', active: true},
    {id: 'comp-niva-bupa', agencyCode: 'NIVABUPA', name: 'Niva Bupa', active: true},
    {id: 'comp-hdfc-ergo', agencyCode: 'HDFCERGO', name: 'HDFC ERGO Health', active: true},
    {id: 'comp-care-health', agencyCode: 'CAREHEALTH', name: 'Care Health Insurance', active: true},
    {id: 'comp-icici-lombard', agencyCode: 'ICICILOMBARD', name: 'ICICI Lombard', active: true},
    {id: 'comp-bajaj', agencyCode: 'BAJAJALLIANZ', name: 'Bajaj Allianz General Insurance', active: true},
    {id: 'comp-tata-aig', agencyCode: 'TATAAIG', name: 'Tata AIG General Insurance', active: true},
    {id: 'comp-nia', agencyCode: 'NIA', name: 'New India Assurance', active: true},
    {id: 'comp-oriental', agencyCode: 'ORIENTAL', name: 'Oriental Insurance', active: true},
    {id: 'comp-united', agencyCode: 'UNITEDINDIA', name: 'United India Insurance', active: true}
];

export const initialSchemes: SchemeMaster[] = [
    {id: 'sch-1', name: 'Smart Secure Plus Plan', type: 'Life Insurance', agencyId: 'comp-max-life', active: true, order: 0, insuranceTypeId: 'it-term'},
    {id: 'sch-2', name: 'Jeevan Anand', type: 'Life Insurance', agencyId: 'comp-lic', active: true, order: 1, insuranceTypeId: 'it-endowment'},
    {id: 'sch-3', name: 'Click 2 Protect Super', type: 'Life Insurance', agencyId: 'comp-hdfc-life', active: true, order: 2, insuranceTypeId: 'it-term'},
    {id: 'sch-4', name: 'iProtect Smart', type: 'Life Insurance', agencyId: 'comp-icici-pru', active: true, order: 3, insuranceTypeId: 'it-term'},
    {id: 'sch-lic-jeevan-lakshya', name: 'Jeevan Lakshya', type: 'Life Insurance', agencyId: 'comp-lic', active: true, order: 4, insuranceTypeId: 'it-endowment'},
    {id: 'sch-lic-siip', name: 'SIIP', type: 'Life Insurance', agencyId: 'comp-lic', active: true, order: 5, insuranceTypeId: 'it-ulip'},
    {id: 'sch-max-life-sspp', name: 'Smart Secure Plus Plan', type: 'Life Insurance', agencyId: 'comp-max-life', active: true, order: 6, insuranceTypeId: 'it-whole'},
    {id: 'sch-hdfc-sanchay', name: 'Sanchay Plus', type: 'Life Insurance', agencyId: 'comp-hdfc-life', active: true, order: 7, insuranceTypeId: 'it-endowment'},

    {id: 'sch-5', name: 'Comprehensive Health Plan', type: 'Health Insurance', agencyId: 'comp-star', active: true, order: 0, insuranceTypeId: 'it-individual-health'},
    {id: 'sch-6', name: 'ReAssure 2.0', type: 'Health Insurance', agencyId: 'comp-niva-bupa', active: true, order: 1, insuranceTypeId: 'it-family-floater'},
    {id: 'sch-7', name: 'Optima Secure', type: 'Health Insurance', agencyId: 'comp-hdfc-ergo', active: true, order: 2, insuranceTypeId: 'it-family-floater'},
    {id: 'sch-8', name: 'Care Supreme', type: 'Health Insurance', agencyId: 'comp-care-health', active: true, order: 3, insuranceTypeId: 'it-individual-health'},
    {id: 'sch-star-family-delite', name: 'Family Health Optima Insurance Plan', type: 'Health Insurance', agencyId: 'comp-star', active: true, order: 4, insuranceTypeId: 'it-family-floater'},
    {id: 'sch-star-women-care', name: 'Women Care Insurance Policy', type: 'Health Insurance', agencyId: 'comp-star', active: true, order: 5, insuranceTypeId: 'it-maternity'},
    {id: 'sch-care-plus', name: 'Care Plus', type: 'Health Insurance', agencyId: 'comp-care-health', active: true, order: 6, insuranceTypeId: 'it-critical-illness'},
    {id: 'sch-niva-bupa-aspire', name: 'Health Aspire', type: 'Health Insurance', agencyId: 'comp-niva-bupa', active: true, order: 7, insuranceTypeId: 'it-senior-citizen'},

    {id: 'sch-9', name: 'Drive Smart', type: 'General Insurance', agencyId: 'comp-bajaj', active: true, order: 0, insuranceTypeId: 'it-motor'},
    {id: 'sch-10', name: 'AutoSecure', type: 'General Insurance', agencyId: 'comp-tata-aig', active: true, order: 1, insuranceTypeId: 'it-motor'},
    {id: 'sch-lombard-car', name: 'Car Insurance', type: 'General Insurance', agencyId: 'comp-icici-lombard', active: true, order: 2, insuranceTypeId: 'it-motor'},
    {id: 'sch-nia-motor', name: 'Private Car Package Policy', type: 'General Insurance', agencyId: 'comp-nia', active: true, order: 3, insuranceTypeId: 'it-motor'},

    {id: 'sch-united-home', name: 'Unihome Care Policy', type: 'General Insurance', agencyId: 'comp-united', active: true, order: 0, insuranceTypeId: 'it-home'},
    {id: 'sch-oriental-travel', name: 'Overseas Mediclaim Policy', type: 'General Insurance', agencyId: 'comp-oriental', active: true, order: 0, insuranceTypeId: 'it-travel'},
    {id: 'sch-tata-aig-pa', name: 'Accident Guard', type: 'General Insurance', agencyId: 'comp-tata-aig', active: true, order: 0, insuranceTypeId: 'it-pa'},
    {id: 'sch-icici-travel', name: 'Travel Insurance', type: 'General Insurance', agencyId: 'comp-icici-lombard', active: true, order: 1, insuranceTypeId: 'it-travel'},
    {id: 'sch-bajaj-home', name: 'My Home Insurance', type: 'General Insurance', agencyId: 'comp-bajaj', active: true, order: 1, insuranceTypeId: 'it-home'},
];
export const initialDocumentMasters: DocumentMaster[] = [ {id:'doc-1', name: 'PAN Card', active: true, order: 0}, {id:'doc-2', name: 'Aadhaar Card', active: true, order: 1}, {id:'doc-3', name: 'Passport', active: true, order: 2}, {id:'doc-4', name: 'Driving License', active: true, order: 3}, {id:'doc-5', name: 'Bank Statement', active: true, order: 4}, ];
export const initialGiftMasters: GiftMaster[] = [ {id:'gift-1', name: 'Premium Pen Set', active: true, order: 0}, {id:'gift-2', name: 'Leather Wallet', active: true, order: 1}, {id:'gift-3', name: 'Amazon Gift Card ₹500', active: true, order: 2}, {id:'gift-4', name: 'Custom Diary 2024', active: true, order: 3}, ];
export const initialTaskStatusMasters: TaskStatusMaster[] = [
    {id:'ts-1', name: 'Pending', active: true, order: 0},
    {id:'ts-5', name: 'Viewed', active: true, order: 1, isInitialState: true},
    {id:'ts-2', name: 'In Progress', active: true, order: 2},
    {id:'ts-3', name: 'Completed', active: true, order: 3, isEndState: true},
    {id:'ts-4', name: 'Cancelled', active: true, order: 4, isEndState: true},
];
export const initialCustomerCategories: CustomerCategory[] = [ {id:'cc-1', name: 'Salaried', active: true, order: 0}, {id:'cc-2', name: 'Business', active: true, order: 1}, {id:'cc-3', name: 'Professional', active: true, order: 2}, ];
export const initialCustomerSubCategories: CustomerSubCategory[] = [
    { id: 'csc-1', name: 'IT/Software', parentId: 'cc-1', active: true, order: 0 },
    { id: 'csc-2', name: 'Government', parentId: 'cc-1', active: true, order: 1 },
    { id: 'csc-3', name: 'Manufacturing', parentId: 'cc-2', active: true, order: 0 },
    { id: 'csc-4', name: 'Trading', parentId: 'cc-2', active: true, order: 1 },
    { id: 'csc-5', name: 'Doctor', parentId: 'cc-3', active: true, order: 0 },
    { id: 'csc-6', name: 'Lawyer', parentId: 'cc-3', active: true, order: 1 },
];
export const initialCustomerGroups: CustomerGroup[] = [
    { id: 'cg-1', name: 'HNI', active: true, order: 0 },
    { id: 'cg-2', name: 'Mid-Income', active: true, order: 1 },
    { id: 'cg-3', name: 'Affluent', active: true, order: 2 },
];
export const initialTaskMasters: TaskMaster[] = [
    { id: 'tm-1', name: 'Auto', active: true, order: 0 },
    { id: 'tm-2', name: 'Manual', active: true, order: 1 },
];
export const initialCustomerFields: CustomerFieldMaster[] = [];

export const initialMutualFundFields: MutualFundFieldMaster[] = [
    { id: 'mff-1', fieldName: 'riskProfile', label: 'Risk Profile', fieldType: 'select', options: ['Conservative', 'Moderate', 'Aggressive'], order: 0, active: true, group: 'Risk Analysis' },
    { id: 'mff-2', fieldName: 'investmentHorizon', label: 'Investment Horizon (Yrs)', fieldType: 'number', order: 1, active: true, group: 'Risk Analysis' },
];
export const initialAccountTypes: AccountType[] = [
    { id: 'at-1', name: 'Current Account', active: true, order: 0 },
    { id: 'at-2', name: 'Overdraft Account', active: true, order: 1 },
    { id: 'at-3', name: 'Cash Credit Account', active: true, order: 2 },
];

export const initialInsuranceTypes: InsuranceTypeMaster[] = [
    { id: 'it-life', name: 'Life Insurance', parentId: null, verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-health', name: 'Health Insurance', parentId: null, verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-general', name: 'General Insurance', parentId: null, verticalId: 'bv-1', active: true, order: 2 },

    { id: 'it-whole', name: 'Whole Life Insurance', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-term', name: 'Term Life Insurance', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-endowment', name: 'Endowment Plans', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-ulip', name: 'Unit-linked Insurance Plan', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 3 },

    { id: 'it-individual-health', name: 'Individual Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-family-floater', name: 'Family Floater Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-senior-citizen', name: 'Senior Citizen Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-critical-illness', name: 'Critical Illness Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 3 },
    { id: 'it-maternity', name: 'Maternity Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 4 },

    { id: 'it-motor', name: 'Motor', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-home', name: 'Home', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-travel', name: 'Travel', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-pa', name: 'Personal Accident', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 3 },
];

export const initialInsuranceFields: InsuranceFieldMaster[] = [
    { id: 'if-life-1', insuranceTypeId: 'it-life', fieldName: 'fatherName', label: "Father's Name", fieldType: 'text', order: 1, active: true, group: 'Personal Information' },
    { id: 'if-life-2', insuranceTypeId: 'it-life', fieldName: 'motherName', label: "Mother's Name", fieldType: 'text', order: 2, active: true, group: 'Personal Information' },
    { id: 'if-life-3', insuranceTypeId: 'it-life', fieldName: 'spouseName', label: "Spouse's Full Name", fieldType: 'text', order: 3, active: true, group: 'Personal Information' },
    { id: 'if-life-4', insuranceTypeId: 'it-life', fieldName: 'placeOfBirth', label: 'Place of Birth', fieldType: 'text', order: 4, active: true, group: 'Personal Information' },

    { id: 'if-term-1', insuranceTypeId: 'it-term', fieldName: 'policyTermYears', label: 'Policy Term (Years)', fieldType: 'number', order: 1, active: true},

    { id: 'if-health-1', insuranceTypeId: 'it-health', fieldName: 'preExistingConditions', label: 'Pre-existing Conditions', fieldType: 'text', order: 1, active: true, group: 'Medical History' },
    { id: 'if-health-2', insuranceTypeId: 'it-health', fieldName: 'heightCm', label: 'Height (cm)', fieldType: 'number', order: 6, active: true, group: 'Physical Details' },
    { id: 'if-health-3', insuranceTypeId: 'it-health', fieldName: 'weightKg', label: 'Weight (kg)', fieldType: 'number', order: 7, active: true, group: 'Physical Details' },
    { id: 'if-health-4', insuranceTypeId: 'it-health', fieldName: 'nomineeName', label: 'Nominee Name', fieldType: 'text', order: 2, active: true, group: 'Nominee Details' },
    { id: 'if-health-5', insuranceTypeId: 'it-health', fieldName: 'nomineeRelationship', label: 'Nominee Relationship', fieldType: 'text', order: 3, active: true, group: 'Nominee Details' },
    { id: 'if-health-6', insuranceTypeId: 'it-health', fieldName: 'hadSurgery', label: 'Had any surgery?', fieldType: 'boolean', order: 4, active: true, group: 'Medical History' },

    { id: 'if-motor-1', insuranceTypeId: 'it-motor', fieldName: 'vehicleRegNo', label: 'Vehicle Reg. No.', fieldType: 'text', order: 1, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-2', insuranceTypeId: 'it-motor', fieldName: 'engineNo', label: 'Engine No.', fieldType: 'text', order: 4, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-3', insuranceTypeId: 'it-motor', fieldName: 'chassisNo', label: 'Chassis No.', fieldType: 'text', order: 5, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-4', insuranceTypeId: 'it-motor', fieldName: 'make', label: 'Make', fieldType: 'text', order: 2, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-5', insuranceTypeId: 'it-motor', fieldName: 'model', label: 'Model', fieldType: 'text', order: 3, active: true, group: 'Vehicle Details' },
];

export const initialTasks: Task[] = [
    { id: 'task-1', triggeringPoint: 'New Policy', taskDescription: 'Follow up for LIC documents', expectedCompletionDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, memberId: '1', primaryContactPerson: 'user-2', statusId: 'ts-1', taskType: 'Auto', active: true },
    { id: 'task-2', triggeringPoint: 'Manual', taskDescription: 'Schedule meeting with Kavya Reddy', expectedCompletionDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, memberId: '3', primaryContactPerson: 'user-3', statusId: 'ts-2', taskType: 'Manual', active: true },
    { id: 'task-3', triggeringPoint: 'Manual', taskDescription: 'Prepare weekly report for management', expectedCompletionDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, primaryContactPerson: 'user-2', statusId: 'ts-1', taskType: 'Manual', active: true },
];

export const initialExpenseCategoriesLevel1: ExpenseCategoryLevel1[] = [
    { id: 'exp1-1', name: 'Administrative Expenses', active: true },
    { id: 'exp1-2', name: 'Marketing Expenses', active: true },
];

export const initialExpenseCategoriesLevel2: ExpenseCategoryLevel2[] = [
    { id: 'exp2-1', name: 'Salary', parentId: 'exp1-1', active: true },
    { id: 'exp2-2', name: 'Rent', parentId: 'exp1-1', active: true },
    { id: 'exp2-3', name: 'MD\'s Travel', parentId: 'exp1-1', active: true },
    { id: 'exp2-4', name: 'Print Media Ad', parentId: 'exp1-2', active: true },
    { id: 'exp2-5', name: 'Digital Media', parentId: 'exp1-2', active: true },
];



export const initialIncomeCategoriesLevel1: IncomeCategoryLevel1[] = [
    { id: 'inc1-1', name: 'Direct Income', active: true },
    { id: 'inc1-2', name: 'Indirect Income', active: true },
];

export const initialIncomeCategoriesLevel2: IncomeCategoryLevel2[] = [
    { id: 'inc2-1', name: 'Commission', parentId: 'inc1-1', active: true },
    { id: 'inc2-2', name: 'Consultancy Fees', parentId: 'inc1-1', active: true },
    { id: 'inc2-3', name: 'Interest Received', parentId: 'inc1-2', active: true },
];

export const initialExpenses: Expense[] = [
    {
        id: 'exp-1',
        date: '2025-12-05',
        categoryLevel1Id: 'exp1-1',
        categoryLevel2Id: 'exp2-1',
        amount: 15000,
        description: 'For the month of Nov 2025',
        paidTo: 'Shankar', 
        modeOfPayment: 'Net Banking',
        voucherNo: 'PAY-1005',
        branch_id: 'frb-1',
        finYearId: 'fy-2',
        createdBy: 'user-1',
        partyId: 'user-2',
        partyType: 'Staff',
        expenseHead: 'Salary-Staff',
        bankId: 'bank-1', 
        docNo: 'NEFT-889977',
        docDate: '2025-12-05',
        isPaymentReturned: false
    },
    {
        id: 'exp-2',
        date: '2025-12-05',
        categoryLevel1Id: 'exp1-1', 
        categoryLevel2Id: 'exp2-2', 
        amount: 5000,
        description: 'Office Rent Dec 2025',
        paidTo: 'Landlord',
        modeOfPayment: 'Cash',
        voucherNo: 'PAY-1006',
        branch_id: 'frb-1',
        finYearId: 'fy-2',
        createdBy: 'user-1',
        partyId: '', 
        partyType: 'Staff', 
        expenseHead: 'Office Rent',
        bankId: undefined,
        docNo: '',
        docDate: '',
        isPaymentReturned: false
    },
];

export const initialReceipts: ManualReceipt[] = [
    {
        id: 'rec-1',
        receiptNo: 'REC-9005',
        date: '2025-12-05',
        receivedFrom: 'MACS INFO',
        partyId: '1', 
        partyType: 'Customer',
        address: 'Erode',
        finYearId: 'fy-2',
        docNo: 'NEFT-123456',
        docDate: '2025-12-05',
        branch_id: 'frb-1',
        isPaymentReturned: false,
        createdBy: 'user-1',
        lineItems: [
            { 
                id: 'li-1', 
                incomeCategory: 'Direct Income > Consultancy', 
                description: 'Insurance Premium (Qtr 3)', 
                paymentMode: 'NetBanking', 
                amount: 52000,
                bankId: 'bank-1' 
            }
        ]
    }
];
export const initialManualIncomes: ManualIncome[] = [
    { id: 'inc-1', date: '2025-08-20', categoryLevel1Id: 'inc1-1', categoryLevel2Id: 'inc2-2', amount: 10000, description: 'Consulting for HNI client', receivedFrom: 'Mr. Sharma', createdBy: 'user-1' },
];

export const initialManualCommissions: ManualCommission[] = [
    { id: 'mcomm-1', date: '2025-08-28', memberId: '1', policyId: 'pol-1-1', amount: 2500, description: 'Manual entry for LIC policy', createdBy: 'user-1' }
];

export const initialAmcs: AMC[] = [
    { id: 'amc-1', name: 'HDFC AMC', verticalId: 'bv-2', active: true, order: 0 },
    { id: 'amc-2', name: 'SBI Mutual Fund', verticalId: 'bv-2', active: true, order: 1 },
    { id: 'amc-3', name: 'ICICI Prudential AMC', verticalId: 'bv-2', active: true, order: 2 },
    { id: 'amc-4', name: 'Axis Mutual Fund', verticalId: 'bv-2', active: true, order: 3 },
];

export const initialMutualFundSchemes: MutualFundScheme[] = [
    { id: 'mf-1', name: 'HDFC Flexi Cap Fund', amcId: 'amc-1', category: 'Equity', active: true, order: 0 },
    { id: 'mf-2', name: 'HDFC Small Cap Fund', amcId: 'amc-1', category: 'Equity', active: true, order: 1 },
    { id: 'mf-3', name: 'HDFC Short Term Debt Fund', amcId: 'amc-1', category: 'Debt', active: true, order: 2 },
    { id: 'mf-4', name: 'SBI BlueChip Fund', amcId: 'amc-2', category: 'Equity', active: true, order: 0 },
    { id: 'mf-5', name: 'SBI Magnum Gilt Fund', amcId: 'amc-2', category: 'Debt', active: true, order: 1 },
    { id: 'mf-6', name: 'ICICI Prudential Bluechip Fund', amcId: 'amc-3', category: 'Equity', active: true, order: 0 },
    { id: 'mf-7', name: 'ICICI Prudential Balanced Advantage Fund', amcId: 'amc-3', category: 'Hybrid', active: true, order: 1 },
];

export const initialOpeningBalances: OpeningBalance[] = [
    {
        id: 'ob-1',
        date: '2024-04-01',
        categoryType: 'Income',
        categoryLevel1Id: 'inc1-2',
        categoryLevel2Id: 'inc2-3',
        partyId: '1',
        partyType: 'Customer',
        debit: 0,
        credit: 15000,
        createdBy: 'user-1',
        createdAt: '2024-04-01T10:00:00Z'
    },
    {
        id: 'ob-2',
        date: '2024-04-01',
        categoryType: 'Expense',
        categoryLevel1Id: 'exp1-1',
        categoryLevel2Id: 'exp2-2',
        partyId: 'user-3',
        partyType: 'Staff',
        debit: 50000,
        credit: 0,
        createdBy: 'user-1',
        createdAt: '2024-04-01T10:00:00Z'
    }
];