
import React from 'react';


export interface AccountCategory { 
    id: string;
    name: string;
    active?: boolean;
    order?: number;
}

export interface AccountSubCategory { 
    id: string;
    name: string;
    categoryId: string; 
    active?: boolean;
    order?: number;
}

export interface AccountHead { 
    id: string;
    name: string;
    subCategoryId: string; 
    active?: boolean;
    order?: number;
    
    postingBank?: boolean;
    isCash?: boolean;
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
  
  accountHeadId?: string;

  voucherNo?: string; 
  modeOfPayment?: 'Cash' | 'UPI' | 'Net Banking' | 'Cheque';
  
  bankId?: string; 

  chequeDrawnOnBankId?: string; 
  
  branch_id?: string;
  finYearId: string;
  partyId?: string;
  partyType?: 'Customer' | 'Staff'; 
  docNo?: string;
  docDate?: string;
  isPaymentReturned?: boolean;
}

export interface ReceiptLineItem {
    id: string;
    
    accountHeadId: string;
    
    description: string;    
    paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'NetBanking'; 
    amount: number;
    
    bankId?: string; 

    chequeDrawnOnBankId?: string;
}

export interface ManualReceipt {
    id: string;
    receiptNo: string;
    date: string;
    receivedFrom: string;   
    partyId: string;        
    partyType: 'Customer' | 'Staff'; 
    address?: string;
    finYearId: string; 
    lineItems: ReceiptLineItem[];
    createdBy: string;
    docNo?: string;         
    docDate?: string;       
    isPaymentReturned?: boolean; 
    branch_id?: string; 
}

export interface ManualIncome {
  id: string;
  date: string;       
  amount: number;
  description: string;
  accountHeadId?: string; 
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

export interface OpeningBalance {
    id: string;
    date: string;
    
    accountHeadId: string;
    
    partyId: string;
    partyType: 'Customer' | 'Staff' | 'Internal' | 'Wallet';
    debit: number;  
    credit: number; 
    createdBy: string;
    createdAt: string;
}


export interface CampaignMaster {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    active: boolean;
    order?: number;
}

export interface Role {
  id: string;
  name: string;
  isAdvisor: boolean; 
  canViewLocationTracker?: boolean;
  active?: boolean;
  order?: number;
}

export interface FinancialYear {
  id: string;
  finYear: string; 
  fromDate: string;
  toDate: string;
  status: 'Active' | 'Inactive';
}

export interface DocumentNumbering {
  id: string;
  type: 'Voucher' | 'Receipt';
  prefix: string;  
  suffix?: string | null; 
  startingNumber: number;
  finYearId: string;
  status: 'Active' | 'Inactive';
}

export type PermissionLevel = 'view' | 'create' | 'modify' | 'none';

export interface Designation {
  id: string;
  name: string;
  rank?: number;
  active?: boolean;
  order?: number;
}

export interface DesignationPermissions {
  designationId: string;
  permissions: {
    [key in AppModule]?: PermissionLevel;
  };
}

export interface Religion {
  id: string;
  name: string;
  active?: boolean;
  order?: number;
}

export interface Festival {
  id: string;
  name: string;
  religionId?: string | null; 
  active?: boolean;
  order?: number;
}

export interface FestivalDate {
    id: string;
    festivalId: string; 
    date: string; 
    year: number;
    active?: boolean;
}

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
  country?: string; 
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
    accountType?: string | '';
}

export interface AdvisorDocument {
  id: string;
  documentName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

export interface EmployeeProfile {
  photoUrl?: string;
  employeebranch_id?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  dateOfCreation?: string;
  dateOfLeaving?: string;
  panNo?: string;
  aadhaarNo?: string;
  salary?: number;
  status: 'Active' | 'Inactive';
  attendance?: { [date: string]: 'Present' | 'Absent' };
  specializations?: AdvisorSpecialization[];
  specializationIds?: string[]; 
  amcIds?: string[];
  agentCode?: string; 
  branch_name?: string;
  fatherName?: string;
  motherName?: string;
  gender?: string | null; 
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
  employeeGroup?: 'LI' | 'HI' | 'GI';
  businessVerticalIds?: string[];
  comp_id?: string;
  bankDetails?: BankDetails;
  documents?: AdvisorDocument[];
  activeCheckInId?: string | null;
  permissions?: {
    [key in AppModule]?: PermissionLevel;
  };
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  designationId: string;
  roleId?: string | null; 
  company: string;
  comp_id: string;
  initials: string;
  password?: string;
  profile?: EmployeeProfile;
}

export type ConcretePolicyType = 'Health Insurance' | 'Life Insurance' | 'General Insurance' | 'Mutual Funds';
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
    proposerPanNo?: string;
    proposerAadharNo?: string;
    proposerEmailId?: string;
    proposerPhoneNo?: string;
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
    height?: number;
    weight?: number;
    occupation?: string;
    annualIncome?: number;
    isGoodHealth?: boolean;
    fatherName?: string;
    motherName?: string;
    nomineeName?: string;
    nomineeRelationship?: string;
    nomineeDob?: string;
    nomineeGender?: 'Male' | 'Female' | 'Other';
    hadMedicalTreatment?: boolean;
    medicalTreatmentDetails?: string;
    hadSurgery?: boolean;
    surgeryDetails?: string;
    onMedication?: boolean;
    medicationDetails?: string;
    previousPolicies?: LICPreviousPolicy[];
}

export interface Policy {
  id:string;
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
  comp_id?: string;
  isLegacyFamilyPolicy?: boolean;
  insuranceTypeId?: string | null;
  policyNumber?: string;
  policyTerm?: number;
  policyTermUnit?: 'Years' | 'Months';
  maturityDate?: string;
  installmentsPaid?: number; 
  licData?: LICData;
  healthInsuranceData?: HealthInsuranceData;
  generalInsuranceType?: GeneralInsuranceType;
  generalInsuranceData?: MotorInsuranceData | HomeInsuranceData | TravelInsuranceData | PersonalAccidentInsuranceData;
  dynamicData?: Record<string, any>;
}

export interface CoveredMember {
    id: string;
    memberId?: string;
    name: string;
    relationship: string;
    dob: string;
    gender?: string | null; 
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
    occasionTypeId: string;
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
  gender?: string | null;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  maritalStatus: string | null;
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
  processStage: ProcessStage;
  processStages?: Record<string, ProcessStage>; 
  stageLastChanged?: string;
  stageLastChangedMap?: Record<string, string>;
  processHistory?: ProcessLog[];
  processHistories?: Record<string, ProcessLog[]>;
  financialProfile?: FinancialProfile;
  bankDetails?: BankDetails;
  createdBy?: string;
  createdAt?: string;
  company: string;
  comp_id: string;
  branch_id?: string;
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

export interface LeadSource {
    sourceId: string | null;
    detail?: string;
}

export type ProcessStage = string;

export interface ProcessStageMaster {
  id: string;
  name: string;
  order: number;
  active: boolean;
  insuranceTypeId?: string | null; 
  isMutualFund?: boolean;
}

export type LeadStatus = string;

export interface LeadStageMaster {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

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
    status: LeadStatus;
    estimatedValue: number;
    assignedTo: string;
    createdAt: string;
    lastUpdatedAt?: string;
    activityLog?: LeadActivityLog[];
    notes?: string;
    policyInterestType?: PolicyType;
    policyInterestGeneralType?: GeneralInsuranceType;
    insuranceTypeId?: string | null;
    company: string;
    comp_id: string;
    branch_id?: string;
    followUpDate?: string;
    voiceNotes?: VoiceNote[];
    upsellSuggestion?: string;
    referrerId?: string;
    createdBy?: string;
    existingMemberId?: string;
}

export type PipelineStatus = 'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Proposal Sent';

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
  by: string; 
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
  scheduledCreationDateTime?: string;
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

export type Tab = 'dashboard' | 'reports & insights' | 'pipeline' | 'customers' | 'policies' | 'notes' | 'actionHub' | 'location' | 'chatbot' | 'profile' | 'employees' | 'servicesHub' | 'masterData' | 'taskManagement' | 'incomeAndExpense' | 'accounts' | 'calendar' | 'advancedReports' | 'upselling' | 'mutualFunds' | 'campaign';

export enum ModalTab {
    BasicInfo = 'Basic Info',
    Documents = 'Documents',
    Policies = 'Policies',
    ProcessFlow = 'Process Flow',
    Tasks = 'Tasks',
    Family = 'Family',
    NotesAndReminders = 'Notes & Special Dates',
    NeedsAnalysis = ' Finance Info',
    Notes = 'Notes',
    Investments = 'Investments'
}

export enum EmployeeModalTab { 
    GeneralInfo = 'General Info',
    Address = 'Address',
    Education = 'Education Details',
    Customers = 'Customers',
    Documents = 'Documents',
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
  status: 'Present' | 'Absent' | 'Work From Home';
  reason?: string;
  timestamp: string;
}

export type AttendanceState = Record<string, AttendanceRecord[]>;

export interface AutomationRule {
    id: number;
    type: string;
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

export type DeprecatedRole = 'Admin' | 'Advisor' | 'Support';

export type AppModule = 'dashboard' | 'reports & insights' | 'incomeAndExpense' | 'accounts' | 'calendar' | 'employees' | 'pipeline' | 'customers' | 'taskManagement' | 'policies' | 'notes' | 'actionHub' | 'servicesHub' | 'location' | 'chatbot' | 'masterData' | 'advancedReports' | 'upselling' | 'mutualFunds' | 'campaign';

export interface RolePermissions {
  roleId: string;
  permissions: {
    [key in AppModule]?: PermissionLevel;
  };
}

export interface GiftMapping {
    tier: string; 
    giftId: string | null;
}

export interface CustomerTier {
    id: string;
    name?: string; 
    customerTypeId: string; 
    minimumSumAssured?: number; 
    minimumPremium?: number; 
    giftId: string | null;
    active?: boolean;
    order?: number;
}

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

export interface AgentAppointment {
    id: string;
    date: string;
    time: string;
    purpose: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface CompanyInfo {
    name: string;
    hq: string;
    cin: string;
    incorporationDate: string;
}

export interface Company {
    id: string;
    comp_code: string;
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
        country?: string; 
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

export interface InsuranceAgency {
    id: string;
    agencyCode: string;
    name: string;
    active?: boolean;
}

export interface BranchCompanyMapping {
    id: string;
    comp_id: string;
    comp_name?: string;
    mappingStatus: boolean;
    finYrClosureAllowed: boolean;
}

export interface Branch {
    id: string;
    branch_id: string;
    branch_name: string;
    comp_id: string;
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
        country?: string;
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
        country?: string;
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
    branch_name: string;
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
    isOwnBank?: boolean;
}

export interface BusinessVertical { id: string; name: string; active?: boolean; order?: number; }
export interface LeadSourceMaster {
  id: string;
  name: string;
  parentId: string | null;
  active?: boolean;
  order?: number;
  allowReferrerSelection?: boolean; 
}
export type ReferralType = LeadSourceMaster;
export interface SchemeMaster { 
    id: string; 
    name: string; 
    agencyId: string; 
    active?: boolean; 
    order?: number; 
    type: ConcretePolicyType;
    generalInsuranceType?: GeneralInsuranceType;
    insuranceTypeId?: string;
}
export interface Geography { id: string; name: string; type: 'Country' | 'State' | 'District' | 'City' | 'Area'; parentId: string | null; active?: boolean; }
export interface TaskStatusMaster { 
    id: string; 
    name: string; 
    active?: boolean; 
    order?: number; 
    isInitialState?: boolean; 
    isEndState?: boolean;     
}
export interface GiftMaster { id: string; name: string; active?: boolean; order?: number; }
export interface RelationshipType { id: string; name: string; active?: boolean; order?: number; }
export interface DocumentMaster { id: string; name: string; active?: boolean; order?: number; }
export interface CustomerCategory { id: string; name: string; active?: boolean; order?: number; }
export interface CustomerSubCategory { id: string; name: string; parentId: string; active?: boolean; order?: number; }
export interface CustomerGroup { id: string; name: string; active?: boolean; order?: number; }
export interface TaskMaster { id: string; name: string; active?: boolean; order?: number; }
export interface AccountType { id: string; name: string; active?: boolean; order?: number; isOwn?: boolean; postingBank?: string; }

export interface OccasionTypeMaster { 
    id: string; 
    name: string; 
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

export interface InsuranceTypeDocumentRule {
  id: string;
  insuranceTypeId: string;
  documentId: string;
  isMandatory: boolean;
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


export interface ProfitLossEntry {
    id: string;
    asOnDate: string;
    category: string; 
    head: string;
    party: string;
    isCustomer: boolean;
    debit: number; 
    credit: number; 
    balance: number; 
}

export interface DayBookEntry {
    id: string;
    date: string;
    sourceDocNo: string; 
    accountCategory: string; 
    head: string;
    party: string;
    remarks: string;
    debit?: number;
    credit?: number;
}

export interface LedgerEntry {
    id: string;
    date: string;
    sourceDoc: string;
    category: string;
    head: string;
    party: string;
    debit: number;
    credit: number;
    balance: number;
}
