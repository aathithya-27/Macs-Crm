import React from 'react';

// --- NEW: Financial Year & Document Numbering Types ---
export interface FinancialYear {
  id: string;
  finYear: string; // e.g., "2025-2026"
  fromDate: string;
  toDate: string;
  status: 'Active' | 'Inactive';
}

export interface DocumentNumbering {
  id: string;
  type: 'Voucher' | 'Receipt';
  prefix: string; // The manual "Kword", e.g., "VOUCH/25-26/"
  // --- MODIFICATION: Added suffix ---
  suffix?: string | null; // e.g., "/FIN"
  startingNumber: number;
  finYearId: string;
  status: 'Active' | 'Inactive';
}

// --- NEW: Manual Receipt Types (CORRECTED) ---
export interface ReceiptLineItem {
    id: string;
    description: string;
    paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'NetBanking'; // MOVED HERE
    amount: number;
}

export interface ManualReceipt {
    id: string;
    receiptNo: string;
    date: string;
    receivedFrom: string;
    address?: string;
    finYearId: string; // Link to the financial year
    lineItems: ReceiptLineItem[];
    createdBy: string;
}


// --- NEW: Granular Permission Level Definition ---
export type PermissionLevel = 'view' | 'create' | 'modify' | 'none';

// --- NEW: Designation & Permission Types ---
export interface Designation {
  id: string;
  name: string;
  isAdvisor: boolean; // Key flag to identify advisor-like roles
  active?: boolean;
  order?: number;
}

export interface DesignationPermissions {
  designationId: string;
  permissions: {
    // MODIFIED: Changed from boolean to the new PermissionLevel
    [key in AppModule]?: PermissionLevel;
  };
}


// --- NEW: Religion & Festival Types ---

export interface Religion {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

// MODIFIED: Simplified the Festival interface
export interface Festival {
  id: string;
  name: string;
  religionId?: string | null; // Optional link to a Religion
  active?: boolean;
  order?: number;
}

// This interface remains the single source for all festival dates.
export interface FestivalDate {
    id: string;
    festivalId: string; // Links to the parent Festival
    date: string; // Full ISO date, e.g., "2024-11-01"
    year: number;
    // --- MODIFICATION: Added 'active' property to manage date status individually ---
    active?: boolean;
}


// --- Employee & User Types (Previously Advisor) ---

export type AdvisorSpecialization = 'Life' | 'Health' | 'Motor' | 'Home' | 'Travel';

export interface AdvisorEducation {
  id: string;
  education: string;
  specialization: string;
  instituteName: string;
  university: string;
  fromDate: string;
  toDate: string;
  grade: string;
}

export interface AdvisorAddress {
  line1?: string;
  line2?: string;
  line3?: string;
  country?: string; // MODIFICATION: Added country field
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  pinCode?: string;
  phone1?: string;
  phone2?: string;
  faxNo?: string;
}

export interface BankDetails {
    bankName?: string;
    accountNumber?: string;
    cifNumber?: string;
    ifscCode?: string;
    // --- MODIFICATION START ---
    accountType?: string | '';
    // --- MODIFICATION END ---
}

export interface AdvisorDocument {
  id: string;
  documentName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

export interface EmployeeProfile { // RENAMED from AdvisorProfile
  photoUrl?: string;
  employeeBranchId?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  dateOfCreation?: string;
  dateOfLeaving?: string;
  panNo?: string;
  aadhaarNo?: string;
  salary?: number;
  status: 'Active' | 'Inactive';
  attendance?: { [date: string]: 'Present' | 'Absent' };
  /** @deprecated Use `specializationIds` instead. */
  specializations?: AdvisorSpecialization[];
  specializationIds?: string[]; // To store selected insurance type IDs
  amcIds?: string[];
  agentCode?: string; // NEW: To store the agent code for agent appointments
  branchName?: string;
  fatherMotherName?: string;
  gender?: string | null; // MODIFIED from 'Male' | 'Female' | 'Other';
  workExperienceYears?: number;
  workExperienceMonths?: number;
  industry?: string;
  isFresher?: boolean;
  drivingLicenceObtained?: boolean;
  drivingLicenceNo?: string;
  dlExpiryDate?: string;
  computerSkills?: string;
  computerKnowledge?: { msOffice: boolean; programming: boolean; others: string; };
  permanentAddress?: AdvisorAddress;
  localAddress?: AdvisorAddress;
  educationDetails?: AdvisorEducation[];
  /** @deprecated Use `businessVerticalIds` instead. */
  employeeGroup?: 'LI' | 'HI' | 'GI';
  businessVerticalIds?: string[];
  companyId?: string;
  bankDetails?: BankDetails;
  documents?: AdvisorDocument[];
  // --- NEW ---
  activeCheckInId?: string | null; // ID of the current active CheckIn record

  // NEW: User-specific permission overrides
  permissions?: {
    [key in AppModule]?: PermissionLevel;
  };
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  /** @deprecated Use `designationId` instead. */
  role: string; // Kept for backwards compatibility if needed, but logic should move to designation
  designationId: string; // REPLACES role
  company: string;
  companyId: string;
  initials: string;
  password?: string;
  profile?: EmployeeProfile; // RENAMED
}


// --- Policy & Insurance Types ---

export type ConcretePolicyType = 'Health Insurance' | 'Life Insurance' | 'General Insurance';
export type PolicyType = ConcretePolicyType | '';
export type GeneralInsuranceType = 'Motor' | 'Home' | 'Travel' | string;

export interface Traveler {
    id: string;
    name: string;
    age: number;
    relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Other';
}

export interface MotorInsuranceData {
  vehicleRegNo?: string;
  make?: string;
  model?: string;
  variant?: string;
  manufacturingYear?: number;
  fuelType?: string;
  engineNo?: string;
  chassisNo?: string;
  previousPolicyDetails?: string;
  ownerName?: string;
  contactInfo?: string;
  registrationStateCity?: string;
  usageType?: string;
  ncb?: string;
  idv?: number;
}

export interface HomeInsuranceData {
  ownerName?: string;
  propertyAddress?: string;
  propertyType?: string;
  yearOfConstruction?: number;
  sumInsuredForStructure?: number;
  sumInsuredForContents?: number;
  securityFeatures?: string;
  occupancyType?: string;
  policyTenure?: string;
}

export interface TravelInsuranceData {
  travelerName?: string;
  dobOrAge?: string;
  passportNumber?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  destination?: string;
  purposeOfTravel?: string;
  sumInsured?: number;
  preExistingMedicalConditions?: string;
  nomineeDetails?: string;
  travelers?: Traveler[];
}
export interface PersonalAccidentInsuranceData {
    fullName?: string;
    dobOrAge?: string;
    occupation?: string;
    nomineeDetails?: string;
    sumInsured?: number;
    riskCategory?: string;
    medicalHistory?: string;
}

export interface LICFamilyMember {
    relation: 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Spouse' | 'Child';
    isAlive: boolean;
    age?: number;
    stateOfHealth?: string;
    ageAtDeath?: number;
    causeOfDeath?: string;
}


export interface LICPreviousPolicy {
    id: string;
    policyNo: string;
    sumAssured: number;
    mode: string;
    doc: string;
    planAndTerm: string;
}

export interface LICData {
    fatherName?: string;
    motherName?: string;
    spouseName?: string;
    placeOfBirth?: string;
    dob?: string;
    address?: string;
    mobile1?: string;
    mobile2?: string;
    email?: string;
    panCard?: string;
    aadhaar?: string;
    educationalQualification?: string;
    occupation?: string;
    presentOccupation?: string;
    annualIncome?: number;
    sourceOfIncome?: string;
    presentEmployerName?: string;
    lengthOfService?: string;
    policyPlanTerm?: string;
    policySumAssured?: number;
    previousPolicies?: LICPreviousPolicy[];
    height?: number;
    weight?: number;
    nomineeName?: string;
    nomineeRelationship?: string;
    nomineeDob?: string;
    identificationMark1?: string;
    identificationMark2?: string;
    hadSurgery?: boolean;
    surgeryDetails?: string;
    familyDetails?: LICFamilyMember[];
    husbandName?: string;
    husbandProfession?: string;
    husbandAnnualIncome?: number;
}

export interface HealthInsuranceData {
    // Proposer Details
    proposerPanNo?: string;
    proposerAadharNo?: string;
    proposerEmailId?: string;
    proposerPhoneNo?: string;

    // Bank Details
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;

    // Insured Details for Self/Individual
    height?: number;
    weight?: number;
    occupation?: string;
    annualIncome?: number;
    isGoodHealth?: boolean;
    fatherName?: string;
    motherName?: string;

    // Nominee Details
    nomineeName?: string;
    nomineeRelationship?: string;
    nomineeDob?: string;
    nomineeGender?: 'Male' | 'Female' | 'Other';

    // Medical History Questionnaire
    hadMedicalTreatment?: boolean;
    medicalTreatmentDetails?: string;
    hadSurgery?: boolean;
    surgeryDetails?: string;
    onMedication?: boolean;
    medicationDetails?: string;

    // Kept for backward compatibility if needed
    previousPolicies?: LICPreviousPolicy[];
}

export interface Policy {
  id:string;
  /** @deprecated Use `insuranceTypeId` instead. */
  policyType: PolicyType;
  schemeName?: string;
  schemeId?: string; 
  policyHolderType?: 'Individual' | 'Family';
  coveredMembers?: CoveredMember[];
  familyHeadMemberId?: string;
  coverage: number;
  premium: number;
  startDate?: string; 
  renewalDate: string;
  status: 'Active' | 'Inactive';
  renewalLink?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Cheque' | 'NetBanking';
  paymentProofUrl?: string;
  paymentProofFilename?: string;
  paymentDetails?: { transactionId: string; amount: string; date: string; status: 'Verified' | 'Unverified' | 'Mismatch' | 'Error'; statusReason?: string; };
  commission?: { amount: number; status: 'Pending' | 'Paid' | 'Cancelled'; paidDate?: string; };
  documentReceived?: boolean;
  premiumFrequency?: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  premiumAsPerFrequency?: number;
  companyId?: string;
  isLegacyFamilyPolicy?: boolean;
  insuranceTypeId?: string | null;

  policyTerm?: number;
  policyTermUnit?: 'Years' | 'Months';
  maturityDate?: string;
  installmentsPaid?: number; // MODIFIED: Added field to track paid installments

  /** @deprecated Use `dynamicData` to store all policy-specific information. */
  licData?: LICData;
  /** @deprecated Use `dynamicData` to store all policy-specific information. */
  healthInsuranceData?: HealthInsuranceData;
  /** @deprecated Use `insuranceTypeId` to determine policy subtype and `dynamicData` for storage. */
  generalInsuranceType?: GeneralInsuranceType;
  /** @deprecated Use `dynamicData` to store all policy-specific information. */
  generalInsuranceData?: MotorInsuranceData | HomeInsuranceData | TravelInsuranceData | PersonalAccidentInsuranceData;
  
  dynamicData?: Record<string, any>;
}


// --- Member & Customer Types ---

export interface CoveredMember {
    id: string;
    memberId?: string;
    name: string;
    relationship: string;
    dob: string;
    gender?: string | null; // MODIFIED from 'Male' | 'Female' | 'Transgender' | 'Other';
    email?: string;
    mobile?: string;
    address?: string;
    height?: number;
    weight?: number;
    occupation?: string;
    annualIncome?: number;
    isGoodHealth?: boolean;
}

export interface SpecialOccasion {
    id: string;
    name: string;
    date: string;
}

export interface DigipinDetails {
    summary?: string;
    landmarks?: string[];
}

export interface FinancialProfile {
    annualIncome?: number;
    monthlyExpenses?: number;
    riskTolerance?: 'Low' | 'Medium' | 'High' | 'Aggressive'; 
    financialGoals?: string;
}

export interface BankMandate {
    id: string;
    bankName: string;
    accountNumber: string;
    mandateAmount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    approvalDate?: string;
    rejectionReason?: string;
    mandateType: 'Insurance' | 'Mutual Funds';
}

export interface Member {
  id:string;
  sno: number;
  name: string;
  memberId: string;
  dob: string;
  gender?: string | null; // MODIFIED from 'Male' | 'Female' | 'Transgender' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  maritalStatus: string | null; // MODIFIED from 'Single' | 'Married' | 'Divorced' | 'Widowed';
  mobile: string;
  mobile2?: string;
  email?: string;
  country: string;
  state: string;
  district?: string;
  city: string;
  area?: string;
  pincode?: string;
  address: string;
  memberType: string; 
  tierId?: string | null;
  active: boolean;
  panCard: string;
  aadhaar: string;
  photoUrl?: string;
  addressProofUrl?: string;
  anniversary?: string;
  otherSpecialOccasions?: SpecialOccasion[];
  policies: Policy[];
  voiceNotes: VoiceNote[];
  documents: UploadedDocument[];
  lat?: number;
  lng?: number;
  digipin?: string;
  digipinDetails?: DigipinDetails;
  automatedGreetingsEnabled?: boolean;
  inactiveSince?: string | null;
  assignedTo: string[];
  leadSource?: LeadSource;
  routeId?: string | null;
  // --- MODIFICATION START ---
  /** @deprecated Use `processStages` instead. A member can have multiple process flows. */
  processStage: ProcessStage;
  processStages?: Record<string, ProcessStage>; // Key is policy.id or 'mutual-fund'
  /** @deprecated Use `stageLastChangedMap` instead. */
  stageLastChanged?: string;
  stageLastChangedMap?: Record<string, string>; // Key is policy.id or 'mutual-fund'
  /** @deprecated Use `processHistories` instead. */
  processHistory?: ProcessLog[];
  processHistories?: Record<string, ProcessLog[]>; // Key is policy.id or 'mutual-fund'
  // --- MODIFICATION END ---
  financialProfile?: FinancialProfile;
  bankDetails?: BankDetails;
  createdBy?: string;
  createdAt?: string;
  documentChecklist?: { [key: string]: boolean | string };
  company: string;
  companyId: string;
  branchId?: string;
  referrerId?: string;
  isReferrerOnly?: boolean;
  customerCategoryId?: string;
  customerSubCategoryId?: string;
  customerGroupId?: string;
  isSPOC?: boolean;
  spocId?: number | null;
  familyName?: string | null;
  spocMemberId?: string;
  spocMobile?: string;
  relievedTimestamp?: string | null;
  religionId?: string | null;
  dynamicData?: Record<string, any>;
  checkIns?: CheckIn[];
  mutualFundHoldings?: MutualFundHolding[];
  bankMandates?: BankMandate[]; 
  
  fileNo?: string; 
  kycStatus?: 'Validated' | 'Registered' | 'Rejected' | 'Not Registered'; 
  ucc?: string; 
  appLoginId?: string; 
  appLoginPassword?: string; 
  sendAppLoginDetails?: boolean; 
}

export interface FamilyMemberNode {
    id: string;
    name: string;
    memberId: string;
    children: FamilyMemberNode[];
    isSPOC: boolean;
    mobile?: string;
    email?: string;
}


// --- Lead, Pipeline & Process Types ---

export interface LeadSource {
    sourceId: string | null;
    detail?: string;
}

// --- MODIFICATION START ---
// This is now the universal type for a stage name string.
export type ProcessStage = string;

// This new interface will be used in Master Data to define the stages themselves.
export interface ProcessStageMaster {
  id: string;
  name: string;
  order: number;
  active: boolean;
  insuranceTypeId?: string | null; // Links to a main insurance type
  isMutualFund?: boolean; // Flag for the single MF workflow
}
// --- MODIFICATION END ---


export interface ProcessLog {
    stage: ProcessStage;
    timestamp: string;
    remarks?: string;
    skipped: boolean;
}

export interface LeadActivityLog {
  timestamp: string;
  action: 'Created' | 'Status Change' | 'Details Updated' | 'Note Added';
  details: string;
  by: string;
}

export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone: string;
    leadSource?: LeadSource;
    status: 'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent' | 'Won' | 'Lost';
    estimatedValue: number;
    assignedTo: string;
    createdAt: string;
    lastUpdatedAt?: string;
    activityLog?: LeadActivityLog[];
    notes?: string;
    /** @deprecated Use `insuranceTypeId` instead. */
    policyInterestType?: PolicyType;
    /** @deprecated Use `insuranceTypeId` instead. */
    policyInterestGeneralType?: GeneralInsuranceType;
    insuranceTypeId?: string | null;
    company: string;
    companyId: string;
    branchId?: string;
    followUpDate?: string;
    voiceNotes?: VoiceNote[];
    upsellSuggestion?: string;
    referrerId?: string;
    createdBy?: string;
}

export type PipelineStatus = 'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent';


// --- Task, Activity & Notification Types ---

export interface VoiceNote {
    id: string;
    filename: string;
    client: string;
    recording_date: string;
    detected_language: string;
    summary: string;
    tags: string[];
    status: string;
    transcript_snippet: string;
    audioUrl?: string;
    actionItems?: string[];
    createdBy?: string;
    assignedTo?: string;
}

export interface UploadedDocument {
    id:string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    status?: 'Uploaded' | 'Sent for Signature' | 'Signed';
}

export interface ToastData {
    id: number;
    message: string;
    type: 'success' | 'error';
}

export interface UpsellOpportunity {
    id: string;
    memberId: string;
    memberName: string;
    suggestions: string;
    timestamp: string;
}

export interface ActivityLog {
    id: string;
    type: 'renewalSuccess';
    message: string;
    timestamp: string;
    memberId: string;
    policyId: string;
}

export interface Appointment {
    id: string;
    memberName: string;
    dateTime: string;
    memberId: string;
}

export interface TaskActivityLog {
  timestamp: string;
  action: 'Created' | 'Status Change' | 'Details Updated' | 'Reassigned';
  details: string;
  by: string; // User ID
}

export interface Task {
  id: string;
  triggeringPoint: string;
  taskDescription: string;
  expectedCompletionDateTime: string;
  creationDateTime?: string;
  isCompleted: boolean;
  isShared?: boolean;
  primaryContactPerson?: string;
  alternateContactPersons?: string[];
  memberId?: string;
  leadId?: string;
  subTaskId?: string;
  statusId?: string;
  taskType: 'Auto' | 'Manual';
  taskTime?: string;
  active?: boolean;
  activityLog?: TaskActivityLog[];
  originalAssigneeId?: string;
}

export interface Notification {
  id: string;
  type: 'Birthday' | 'Anniversary' | 'Policy Renewal' | 'Premium Payment' | 'Custom' | 'Special Occasion' | 'Task Assignment' | 'Festival';
  date: string; 
  message: string;
  occasionName?: string;
  member: {
    id: string;
    name: string;
    mobile: string;
  };
  policy?: {
    id: string;
    policyType: PolicyType;
    renewalLink?: string;
  };
  source: 'auto' | 'custom';
  dismissed?: boolean;
}


// --- App State & UI Types ---

export type Tab = 'dashboard' | 'reports & insights' | 'pipeline' | 'customers' | 'policies' | 'notes' | 'actionHub' | 'location' | 'chatbot' | 'profile' | 'employees' | 'servicesHub' | 'masterMember' | 'taskManagement' | 'profitAndLoss' | 'calendar' | 'advancedReports' | 'upselling' | 'mutualFunds';
export enum ModalTab {
    BasicInfo = 'Basic Info',
    Documents = 'Documents',
    Policies = 'Policies',
    ProcessFlow = 'Process Flow',
    Tasks = 'Tasks',
    Family = 'Family',
    NotesAndReminders = 'Notes & Special Dates',
    NeedsAnalysis = 'Needs Analysis',
    Notes = 'Notes',
    Investments = 'Investments'
}

export enum EmployeeModalTab { // RENAMED from AdvisorModalTab
    GeneralInfo = 'General Info',
    Address = 'Address',
    Education = 'Education Details',
    Customers = 'Customers',
    Documents = 'Documents',
    // NEW: Permissions tab for admins to configure user-specific access
    Permissions = 'Permissions'
}
export type DashboardTaskTypeFilter = 'all' | 'personal' | 'customer' | 'shared';

export interface TodaysFocusItem {
    id: string;
    priority: 'High' | 'Medium' | 'Low';
    title: string;
    rationale: string;
    action: 'call' | 'review' | 'follow-up' | 'email' | 'task';
    relatedId: string;
    relatedName: string;
}

export interface AttendanceRecord {
  status: 'Present' | 'Absent';
  reason?: string;
  timestamp: string;
}

export type AttendanceState = Record<string, AttendanceRecord[]>;


// --- Automation & Configuration ---

export interface AutomationRule {
    id: number;
    type: 'Birthday Messages' | 'Anniversary Messages' | 'Policy Renewal Messages' | 'Special Occasion Messages';
    timing: { value: number; unit: 'days' | 'weeks'; relation: 'before'; };
    enabled: boolean;
    template: string;
    channels: ('whatsapp' | 'sms' | 'email' | 'call')[];
    icon?: React.ReactElement;
}

export interface CustomScheduledMessage {
    id: string;
    memberId: string;
    dateTime: string;
    message: string;
}

export interface DocTemplate {
    id: string;
    name: string;
    content: string;
}

/** @deprecated Use `Designation` and `DesignationPermissions` instead. */
export type Role = 'Admin' | 'Advisor' | 'Support';
export type AppModule = 'dashboard' | 'reports & insights' | 'profitAndLoss' | 'calendar' | 'employees' | 'pipeline' | 'customers' | 'taskManagement' | 'policies' | 'notes' | 'actionHub' | 'servicesHub' | 'location' | 'chatbot' | 'masterMember' | 'advancedReports' | 'upselling' | 'mutualFunds';
/** @deprecated Use `DesignationPermissions` instead. */
export interface RolePermissions {
  role: Role;
  permissions: {
    [key in AppModule]?: boolean;
  };
}


// --- Miscellaneous Types ---

export interface GiftMapping {
    tier: string; 
    giftId: string | null;
}

export interface CustomerTier {
    id: string;
    name?: string; // Kept for display purposes
    customerTypeId: string; // REPLACES name for logic
    minimumSumAssured?: number; 
    minimumPremium?: number; 
    giftId: string | null;
    active?: boolean;
    order?: number;
}


// --- START: MUTUAL FUNDS TYPES (REVISED & EXPANDED) ---
export interface AMC { 
    id: string;
    name: string;
    verticalId?: string; 
    active?: boolean;
    order?: number;
}

export type MutualFundSchemeCategory = 'Equity' | 'Debt' | 'Hybrid' | 'Solution Oriented' | 'Other';

export interface MutualFundScheme {
    id: string;
    name: string;
    amcId: string; 
    category: MutualFundSchemeCategory;
    active?: boolean;
    order?: number;
}

export interface MutualFundTransaction {
    id: string;
    date: string; 
    type: 'Purchase' | 'Additional Purchase' | 'Redemption' | 'SIP Installment';
    amount: number;
    units?: number;
    nav?: number;
    remarks?: string;
}

export interface MutualFundHolding {
    id: string; 
    schemeId: string; 
    folioNumber: string;
    investmentType: 'SIP' | 'Lumpsum';
    
    totalInvestment: number; 
    units: number; 
    currentValue: number; 
    
    sipAmount?: number;
    sipDate?: number; 
    bankMandateId?: string | null; 
    
    transactions: MutualFundTransaction[];
    
    status: 'Active' | 'Paused' | 'Stopped';
    sipRejections?: { date: string; reason: string; }[]; 

    dynamicData?: Record<string, any>; 
}
// --- END: MUTUAL FUNDS TYPES ---


export interface AgentAppointment {
    id: string;
    date: string;
    time: string;
    purpose: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
}


// --- Master Data Management ---

export interface FinRootsCompanyInfo {
    name: string;
    hq: string;
    cin: string;
    incorporationDate: string;
}

export interface Company {
    id: string;
    companyCode: string;
    name: string;
    mailingName?: string;
    dateOfCreation?: string;
    active?: boolean;
    address?: {
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        state?: string;
        district?: string;
        area?: string;
        pinCode?: string;
        country?: string; // MODIFICATION: Added country field
    };
    contact?: {
        phoneNo?: string;
        faxNo?: string;
        emailId?: string;
    };
    gstin?: string;
    pan?: string;
    tan?: string;
    applicableForBooking?: boolean;
    applicableForJobCard?: boolean;
    applicableForSaleOrder?: boolean;
    defaultForBooking?: boolean;
    defaultForHP?: boolean;
    defaultForExchange?: boolean;
    defaultForJobCard?: boolean;
    defaultForSparesPurchaseOrder?: boolean;
    defaultForVehiclePurchaseOrder?: boolean;
}

export interface BranchCompanyMapping {
    id: string;
    companyId: string;
    companyName?: string;
    mappingStatus: boolean;
    finYrClosureAllowed: boolean;
}

export interface FinRootsBranch {
    id: string;
    branchId: string;
    branchName: string;
    companyId: string;
    active?: boolean;
    dateOfCreation?: string;
    gstin?: string;
    pan?: string;
    tan?: string;
    address?: {
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        state?: string;
        district?: string;
        area?: string;
        pinCode?: string;
        phone?: string;
        fax?: string;
        country?: string; // MODIFICATION: Added country field
    };
    altAddress?: {
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        state?: string;
        district?: string;
        area?: string;
        pinCode?: string;
        phone?: string;
        fax?: string;
        country?: string; // MODIFICATION: Added country field
    };
    features?: {
        expService?: boolean;
        pickAndDrop?: boolean;
        expertOnWheels?: boolean;
        mileageTesting?: boolean;
    };
    companyMappings?: BranchCompanyMapping[];
    contactPerson?: string;
    phone?: string;
    email?: string;
}

export interface BankMaster {
    id: string;
    bankCode: string;
    bankName: string;
    branchName: string;
    acGroupCode?: string;
    glCode?: string;
    glDescription?: string;
    paymentTerm?: string;
    dateOfCreation?: string;
    active: boolean;
    line1?: string;
    line2?: string;
    line3?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    phone1?: string;
    phone2?: string;
    faxNo?: string;
    contactPerson?: string;
    emailId?: string;
    landmark?: string;
    accountType: string | '';
    accountNumber: string;
    ifscCode?: string;
    creditLimit?: number;
    authSign1?: string;
    authSign2?: string;
    order?: number;
}


// --- Master Data - Dropdowns & Mappings ---

export interface BusinessVertical { id: string; name: string; active?: boolean; order?: number; }
export interface LeadSourceMaster {
  id: string;
  name: string;
  parentId: string | null;
  active?: boolean;
  order?: number;
}
export type ReferralType = LeadSourceMaster;
export interface SchemeMaster { 
    id: string; 
    name: string; 
    companyId: string; 
    active?: boolean; 
    order?: number; 
    type: ConcretePolicyType;
    generalInsuranceType?: GeneralInsuranceType;
    insuranceTypeId?: string;
}
export interface Geography { id: string; name: string; type: 'Country' | 'State' | 'District' | 'City' | 'Area'; parentId: string | null; active?: boolean; }
export interface TaskStatusMaster { id: string; name: string; active?: boolean; order?: number; }
export interface GiftMaster { id: string; name: string; active?: boolean; order?: number; }
export interface RelationshipType { id: string; name: string; active?: boolean; }
export interface DocumentMaster { id: string; name: string; active?: boolean; order?: number; }
export interface RelationshipType {id: string; name: string; active?: boolean;  order?: number;}
export interface SchemeDocumentMapping { schemeId: string; documentId: string; }
export interface CustomerCategory { id: string; name: string; active?: boolean; order?: number; }
export interface CustomerSubCategory { id: string; name: string; parentId: string; active?: boolean; order?: number; }
export interface CustomerGroup { id: string; name: string; active?: boolean; order?: number; }
export interface TaskMaster { id: string; name: string; active?: boolean; order?: number; }
// --- MODIFICATION START ---
export interface AccountType { id: string; name: string; active?: boolean; order?: number; }
// --- MODIFICATION END ---

export interface PolicyChecklistMaster { 
    id: string; 
    name: string; 
    parentId: string | null; 
    policyType: string; 
    active?: boolean; 
    order?: number; 
}
export interface Route { id: string; name: string; active?: boolean; order?: number; }

export interface InsuranceTypeMaster {
    id: string;
    name: string;
    verticalId: string;
    active?: boolean;
    order?: number;
    parentId: string | null; 
}

export interface InsuranceFieldMaster {
    id: string;
    insuranceTypeId: string;
    fieldName: string;
    label: string;
    fieldType: 'text' | 'number' | 'date' | 'table' | 'boolean' | 'select' | 'checkbox';
    group?: string;
    columnSpan?: 1 | 2 | 3;
    options?: string[]; 
    columnHeaders?: string[]; 
    rowHeaders?: string[]; 
    order: number;
    active?: boolean;
}

export interface CustomerFieldMaster {
    id: string;
    fieldName: string;
    label: string;
    fieldType: 'text' | 'number' | 'date' | 'table' | 'boolean' | 'select' | 'checkbox';
    group?: string;
    columnSpan?: 1 | 2 | 3;
    options?: string[];
    columnHeaders?: string[];
    rowHeaders?: string[];
    order: number;
    active?: boolean;
}

export interface MutualFundFieldMaster {
    id: string;
    fieldName: string;
    label: string;
    fieldType: 'text' | 'number' | 'date' | 'table' | 'boolean' | 'select' | 'checkbox';
    group?: string;
    columnSpan?: 1 | 2 | 3;
    options?: string[];
    columnHeaders?: string[];
    rowHeaders?: string[];
    order: number;
    active?: boolean;
}

export interface UpsellCategory {
  id: string;
  name: string;
  order: number;
  active?: boolean;
  linkedInsuranceTypeIds: string[]; 
}


// --- Profit & Loss Module Types ---

export interface IncomeCategoryLevel1 { 
  id: string;
  name: string;
  active?: boolean;
}

export interface IncomeCategoryLevel2 { 
  id: string;
  name: string;
  parentId: string; 
  active?: boolean;
}

export interface ExpenseCategoryLevel1 { 
  id: string;
  name: string;
  active?: boolean;
}

export interface ExpenseCategoryLevel2 { 
  id: string;
  name: string;
  parentId: string; 
  active?: boolean;
}

export interface ExpenseCategoryLevel3 { 
  id: string;
  name: string;
  parentId: string; 
  active?: boolean;
}


export interface Expense {
  id: string;
  date: string;       
  amount: number;
  description: string;
  paidTo?: string;    
  billUrl?: string;   
  createdBy: string;  
  relatedMemberId?: string;
  categoryLevel1Id?: string;
  categoryLevel2Id?: string;
  categoryLevel3Id?: string;
  voucherNo?: string; 
  modeOfPayment?: 'Cash' | 'UPI' | 'Net Banking' | 'Cheque';
  expenseHead?: string;
  branchId?: string;
  finYearId?: string; // NEW: Link to financial year
}

export interface ManualIncome {
  id: string;
  date: string;       
  amount: number;
  description: string;
  categoryLevel1Id?: string;
  categoryLevel2Id?: string;
  receivedFrom?: string; 
  receiptUrl?: string;   
  createdBy: string;    
}

export interface ManualCommission {
  id: string;
  date: string;
  memberId: string;
  policyId: string;
  amount: number;
  description: string;
  createdBy: string;
}

// --- Location Tracking Types ---

export interface AdvisorLocation {
  advisorId: string;
  advisorName: string; 
  lat: number;
  lng: number;
  timestamp: string; 
}

export type CheckInOutcome = 'Proposal Sent' | 'Follow-up Scheduled' | 'Sale Closed' | 'No Progress' | 'Other';

export interface CheckIn {
  id: string;
  advisorId: string;
  advisorName: string; 
  customerId: string;
  customerName: string;
  lat: number;
  lng: number;
  timestamp: string; 
  checkOutTimestamp?: string | null; 
  durationMinutes?: number; 
  notes?: string; 
  outcome?: CheckInOutcome; 
  nextActionDate?: string; 
  checkInType: 'Automatic' | 'Manual'; 
  manualCheckInReason?: string; 
}

// --- NEW MASTER DATA TYPES ---
export interface Gender {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

export interface MaritalStatus {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

export interface CustomerType {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}