import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartJsTooltip,
    Legend as ChartJsLegend,
    Filler,
} from 'chart.js';
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartJsTooltip,
    ChartJsLegend,
    Filler
);

import MemberDashboard from './components/MemberDashboard.tsx';
import { MemberModal } from './components/MemberModal.tsx';
import AnnualReviewModal from './components/AnnualReviewModal.tsx';
import ConversationalCreatorModal from './components/ConversationalCreatorModal.tsx';
import LocationServices from './components/LocationServices.tsx';
import Chatbot from './components/WhatsAppBot.tsx';
import Dashboard from './components/Dashboard.tsx';
import PolicyManager from './components/PolicyManager.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import AdminProfile from './components/AdminProfile.tsx';
import Sidebar from './components/Sidebar.tsx';
import SalesPipeline from './components/SalesPipeline.tsx';
import LeadModal from './components/LeadModal.tsx';
import { ActionAutomationHub } from './components/ActionAutomationHub.tsx';
import { ProposalGeneratorModal } from './components/ProposalGeneratorModal.tsx';
import NotesPage from './components/NotesPage.tsx';
import EmployeeManagement from './components/EmployeeManagement.tsx';
import { EmployeeModal } from './components/EmployeeModal.tsx';
import Login from './components/Login.tsx';
import MutualFunds from './components/MutualFunds.tsx';
import { MasterData } from './components/masterdata/MasterData.tsx';
import { TaskManagement } from './components/TaskManagement.tsx';
import IncomeAndExpense from './components/IncomeAndExpense.tsx';
import Accounts from './components/Accounts.tsx';
import FestivalCalendar from './components/FestivalCalendar.tsx';
import { VoucherSaveData } from './components/PaymentVoucherModal.tsx';
import { ReceiptSaveData } from './components/ManualReceiptModal.tsx';
import AdvancedReports from './components/AdvancedReports.tsx';
import CrossSellingDashboard from './components/CrossSellingDashboard.tsx';
import ServicesHub from './components/ServicesHub.tsx';
import CampaignExecution from './components/CampaignExecution.tsx';
import Modal from './components/ui/Modal.tsx';
import Button from './components/ui/Button.tsx';

import {
    Member, ToastData, ActivityLog, Appointment, Task, UpsellOpportunity, AutomationRule, CustomScheduledMessage, ModalTab,
    Lead, User, Policy, Route as RouteType, DocTemplate, EmployeeProfile, Tab, GiftMapping, BusinessVertical,
    SchemeMaster, Company, Branch, Geography, RelationshipType, DocumentMaster, GiftMaster, TaskStatusMaster, CustomerCategory,
    Notification, BankMaster, CompanyInfo, CustomerSubCategory, CustomerGroup, TaskMaster, TodaysFocusItem,
    InsuranceTypeMaster, InsuranceFieldMaster, LeadActivityLog, VoiceNote, TaskActivityLog,
    LeadSource, LeadSourceMaster, CoveredMember, Designation,
    CustomerTier,
    Expense, ManualIncome, ManualCommission,
    Religion, Festival, FestivalDate,
    AccountCategory, AccountSubCategory, AccountHead,
    AttendanceRecord,
    AttendanceState,
    CustomerFieldMaster,
    AdvisorLocation,
    CheckIn,
    CheckInOutcome,
    UpsellCategory,
    AMC,
    MutualFundScheme,
    MutualFundFieldMaster,
    AppModule,
    PermissionLevel,
    Gender, MaritalStatus, CustomerType,
    ProcessStageMaster,
    AccountType,
    FinancialYear, DocumentNumbering, ManualReceipt,
    Role, RolePermissions,
    InsuranceTypeDocumentRule,
    LeadStageMaster,
    OccasionTypeMaster,
    InsuranceAgency,
    OpeningBalance
} from './types.ts';

import {
    getMembers, createMember, updateMember, deleteMember, getLeads, createLead, updateLead, deleteLead,
    getUsers, getRoutes, updateRoute, createEmployee, updateEmployee, getOperatingCompanies,
    updateOperatingCompany, getBranches, getDesignations, getRolePermissions,
    updateRolePermissions, getReligions, getFestivals, getFestivalDates, getRelationshipTypes, updateRelationshipTypes, getAdvisorLocations,
    getCheckIns, updateAdvisorLocation, createCheckIn, getAdvisorLocationHistory, checkOut,
    getActiveCheckIn, getUpsellCategories,
    getGenders, getMaritalStatuses, getCustomerTypes, getCustomerTiers,
    getProcessStageMasters, updateProcessStageMasters,
    getFinancialYears, updateFinancialYears, getDocumentNumbering, updateDocumentNumbering,
    getRoles, updateRoles,
    getInsuranceTypeDocumentRules, updateInsuranceTypeDocumentRules,
    getLeadStageMasters, updateLeadStageMasters,
    getOccasionTypeMasters, updateOccasionTypeMasters,
    getOpeningBalances, createOpeningBalance, updateOpeningBalance, deleteOpeningBalance, getAccountCategories, updateAccountCategories,
    getAccountSubCategories, updateAccountSubCategories,
    getAccountHeads, updateAccountHeads,
} from './services/apiService.ts';
import { getPolicySuggestions, generateAnnualReview, generateUpsellOpportunityForMember, generateTodaysFocus } from './services/geminiService.ts';
import ToastContainer from './components/ui/Toast.tsx';
import { Shield, Bell, Loader2, Menu, Sun, Moon, ArrowUp, Gift as GiftIcon, Calendar, Star, BarChart2, TrendingUp, Users as UsersIcon, CheckCircle, Clock, Percent, Workflow, X, Plus, Save, Edit2, Trash2, Building, MapPin, Briefcase, FileText as FileTextIcon, ListTodo, CheckSquare, BarChart3, TrendingDown, Map as MapIcon, Donut, IndianRupee, Zap, GripVertical, ArrowDown, Search, AlertCircle } from 'lucide-react';
import NotificationDropdown from './components/NotificationDropdown.tsx';
import DuplicateMemberModal from './components/DuplicateMemberModal.tsx';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.tsx';
import { ViewByTierModal } from './components/ViewByTierModal.tsx';
import { AttendanceModal } from './components/AttendanceModal.tsx';
import { AttendanceReportModal } from './components/AttendanceReportModal.tsx';
import { ReportsAndInsights } from './components/ReportsAndInsights.tsx';
import { generateLeadActivityLog } from './utils/leadUtils.ts';
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
    initialAccountCategories,
    initialAccountSubCategories,
    initialAccountHeads,
    initialExpenses,
    initialManualIncomes,
    initialManualCommissions,
    initialAmcs,
    initialMutualFundSchemes,
    initialReceipts,
    initialOpeningBalances
} from './data/initialData.tsx';


type Theme = 'light' | 'dark';
type TierCalculationMethod = 'sumAssured' | 'premium';


const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeFinancialYearId, setActiveFinancialYearId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const toastIdCounter = useRef(0);

    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [routes, setRoutes] = useState<RouteType[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>(initialTasks);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);

    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [initialModalTab, setInitialModalTab] = useState<ModalTab | null>(ModalTab.BasicInfo);
    const [leadToConvertId, setLeadToConvertId] = useState<string | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [isAnnualReviewModalOpen, setIsAnnualReviewModalOpen] = useState(false);
    const [reviewContent, setReviewContent] = useState('');
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);
    const [isConversationalCreatorOpen, setIsConversationalCreatorOpen] = useState(false);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [proposalContext, setProposalContext] = useState<{ member: Member, policy: Policy } | null>(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [pendingDuplicateMember, setPendingDuplicateMember] = useState<Partial<Member> | null>(null);
    const [duplicateMatches, setDuplicateMatches] = useState<Member[]>([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isViewByTierModalOpen, setIsViewByTierModalOpen] = useState(false);
    const [viewingTier, setViewingTier] = useState<CustomerTier | null>(null);
    const [isAttendanceReportModalOpen, setIsAttendanceReportModalOpen] = useState(false);

    const [upsellContext, setUpsellContext] = useState<{ member: Member, insuranceType: string } | null>(null);
    const [isCustomerExistsModalOpen, setIsCustomerExistsModalOpen] = useState(false);
    const [pendingConversionLead, setPendingConversionLead] = useState<Lead | null>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [upsellOpportunities, setUpsellOpportunities] = useState<UpsellOpportunity[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>(initialAutomationRules);
    const [customMessages, setCustomMessages] = useState<CustomScheduledMessage[]>([]);
    const [docTemplates, setDocTemplates] = useState<DocTemplate[]>(initialDocTemplates);
    const [attendance, setAttendance] = useState<AttendanceState>({});
    const [forgotPasswordCompany, setForgotPasswordCompany] = useState('');
    const [forgotPasswordEmployeeId, setForgotPasswordEmployeeId] = useState('');
    const [advisorLocations, setAdvisorLocations] = useState<AdvisorLocation[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);

    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [dropdownCleared, setDropdownCleared] = useState(false);
    const notificationDropdownRef = useRef<HTMLDivElement>(null);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        toastIdCounter.current += 1;
        const newToast: ToastData = { id: Date.now(), message, type };
        setToasts(prevToasts => [...prevToasts, newToast]);
        setTimeout(() => {
            removeToast(newToast.id);
        }, 5000);
    }, [removeToast]);

    const [dismissedItems, setDismissedItems] = useState<Record<string, boolean>>({});
    const handleDismissItem = useCallback((itemId: string) => {
        setDismissedItems(prev => ({ ...prev, [itemId]: true }));
        addToast("Item hidden from this view.", "success");
    }, [addToast]);
    const handleOpenForgotPassword = (company: string, employeeId: string) => {
        setForgotPasswordCompany(company);
        setForgotPasswordEmployeeId(employeeId);
        setIsForgotPasswordModalOpen(true);
    };
    const [dismissedFocusItems, setDismissedFocusItems] = useState<string[]>([]);
    const [todaysFocusItems, setTodaysFocusItems] = useState<TodaysFocusItem[]>([]);
    const [isFocusLoading, setIsFocusLoading] = useState(false);
    const [focusError, setFocusError] = useState<string | null>(null);

    const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>(initialBusinessVerticals);
    const [leadSources, setLeadSources] = useState<LeadSourceMaster[]>(initialLeadSources);
    const [schemes, setSchemes] = useState<SchemeMaster[]>(initialSchemes);
    const [agencies, setAgencies] = useState<InsuranceAgency[]>(initialAgencies);
    const [operatingCompanies, setOperatingCompanies] = useState<Company[]>([]);
    const [geographies, setGeographies] = useState<Geography[]>(generateInitialGeographies());
    const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
    const [documentMasters, setDocumentMasters] = useState<DocumentMaster[]>(initialDocumentMasters);
    const [insuranceTypeDocumentRules, setInsuranceTypeDocumentRules] = useState<InsuranceTypeDocumentRule[]>([]);
    const [giftMasters, setGiftMasters] = useState<GiftMaster[]>(initialGiftMasters);
    const [taskStatusMasters, setTaskStatusMasters] = useState<TaskStatusMaster[]>(initialTaskStatusMasters);
    const [customerCategories, setCustomerCategories] = useState<CustomerCategory[]>(initialCustomerCategories);
    const [bankMasters, setBankMasters] = useState<BankMaster[]>(initialBankMasters);
    const [accountTypes, setAccountTypes] = useState<AccountType[]>(initialAccountTypes);
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [CompanyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
    const [customerSubCategories, setCustomerSubCategories] = useState<CustomerSubCategory[]>(initialCustomerSubCategories);
    const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>(initialCustomerGroups);
    const [taskMasters, setTaskMasters] = useState<TaskMaster[]>(initialTaskMasters);
    const [customerFieldMasters, setCustomerFieldMasters] = useState<CustomerFieldMaster[]>(initialCustomerFields);

    const [insuranceTypes, setInsuranceTypes] = useState<InsuranceTypeMaster[]>(initialInsuranceTypes);
    const [insuranceFields, setInsuranceFields] = useState<InsuranceFieldMaster[]>(initialInsuranceFields);
    const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([]);
    const [customerTierCalculationMethod, setCustomerTierCalculationMethod] = useState<TierCalculationMethod>('sumAssured');
    const [accountCategories, setAccountCategories] = useState<AccountCategory[]>(initialAccountCategories);
    const [accountSubCategories, setAccountSubCategories] = useState<AccountSubCategory[]>(initialAccountSubCategories);
    const [accountHeads, setAccountHeads] = useState<AccountHead[]>(initialAccountHeads);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [manualIncomes, setManualIncomes] = useState<ManualIncome[]>(initialManualIncomes);
    const [manualCommissions, setManualCommissions] = useState<ManualCommission[]>(initialManualCommissions);
    const [religions, setReligions] = useState<Religion[]>([]);
    const [festivals, setFestivals] = useState<Festival[]>([]);
    const [festivalDates, setFestivalDates] = useState<FestivalDate[]>([]);
    const [upsellCategories, setUpsellCategories] = useState<UpsellCategory[]>([]);
    const [amcs, setAmcs] = useState<AMC[]>(initialAmcs);
    const [mutualFundSchemes, setMutualFundSchemes] = useState<MutualFundScheme[]>(initialMutualFundSchemes);
    const [mutualFundFields, setMutualFundFields] = useState<MutualFundFieldMaster[]>(initialMutualFundFields);
    const [genders, setGenders] = useState<Gender[]>([]);
    const [maritalStatuses, setMaritalStatuses] = useState<MaritalStatus[]>([]);
    const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
    const [processStageMasters, setProcessStageMasters] = useState<ProcessStageMaster[]>([]);
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
    const [documentNumbering, setDocumentNumbering] = useState<DocumentNumbering[]>([]);
    const [manualReceipts, setManualReceipts] = useState<ManualReceipt[]>(initialReceipts);
    const [leadStageMasters, setLeadStageMasters] = useState<LeadStageMaster[]>([]);
    const [occasionTypeMasters, setOccasionTypeMasters] = useState<OccasionTypeMaster[]>([]);
    const [openingBalances, setOpeningBalances] = useState<OpeningBalance[]>(initialOpeningBalances);

    const agenciesAsCompanies: Company[] = useMemo(() => agencies.map(agency => ({
        id: agency.id,
        name: agency.name,
        active: agency.active,
        comp_code: agency.agencyCode,
    })), [agencies]);

    const companyMembers = useMemo(() => allMembers.filter(m => m.comp_id === currentUser?.comp_id), [allMembers, currentUser]);
    const companyLeads = useMemo(() => allLeads.filter(l => l.comp_id === currentUser?.comp_id), [allLeads, currentUser]);
    const companyUsers = useMemo(() => allUsers.filter(u => u.comp_id === currentUser?.comp_id), [allUsers, currentUser]);
    const companyBranches = useMemo(() => allBranches.filter(b => b.comp_id === currentUser?.comp_id && b.active), [allBranches, currentUser]);

    const currentUserPermissions = useMemo(() => {
        const finalPermissions: { [key in AppModule]?: PermissionLevel } = {};
        const allModules: AppModule[] = [
            'dashboard', 'reports & insights', 'incomeAndExpense', 'accounts', 'calendar', 'employees', 'pipeline', 'customers',
            'taskManagement', 'policies', 'notes', 'actionHub', 'servicesHub', 'location', 'chatbot', 'masterData',
            'advancedReports', 'CrossSelling', 'mutualFunds', 'campaign'
        ];

        for (const module of allModules) {
            finalPermissions[module] = 'none';
        }

        if (!currentUser || !currentUser.roleId || !rolePermissions) {
            return finalPermissions as { [key in AppModule]: PermissionLevel };
        }

        const rolePerms = rolePermissions.find(p => p.roleId === currentUser.roleId);
        const basePermissions = rolePerms?.permissions || {};
        const userOverrides = currentUser.profile?.permissions || {};
        Object.assign(finalPermissions, basePermissions, userOverrides);

        const userRole = roles.find(r => r.id === currentUser.roleId);
        if (userRole?.isAdvisor) {
            finalPermissions.taskManagement = 'modify';
        }

        return finalPermissions as { [key in AppModule]: PermissionLevel };

    }, [currentUser, rolePermissions, roles]);

    const leadsForPipeline = useMemo(() => {
        const userRole = roles.find(r => r.id === currentUser?.roleId);
        if (!userRole || !userRole.isAdvisor) {
            return companyLeads;
        }
        return companyLeads.filter(lead => lead.assignedTo === currentUser?.id || lead.createdBy === currentUser?.id);
    }, [companyLeads, currentUser, roles]);

    const trueCurrentFinancialYear = useMemo(() => {
        const now = new Date();
        return financialYears.find(fy => {
            const from = new Date(fy.fromDate);
            const to = new Date(fy.toDate);
            to.setHours(23, 59, 59, 999);
            return now >= from && now <= to && fy.status === 'Active';
        }) || null;
    }, [financialYears]);

    const lastVoucherNumber = useMemo(() => {
        if (!trueCurrentFinancialYear) return 0;
        const expensesInYear = expenses.filter(e => e.finYearId === trueCurrentFinancialYear.id && e.voucherNo);
        return expensesInYear.length;
    }, [expenses, trueCurrentFinancialYear]);

    const lastReceiptNumber = useMemo(() => {
        if (!trueCurrentFinancialYear) return 0;
        return manualReceipts.filter(r => r.finYearId === trueCurrentFinancialYear.id).length;
    }, [manualReceipts, trueCurrentFinancialYear]);

    const handleDismissFocusItem = useCallback((itemId: string) => {
        setDismissedFocusItems(prev => [...prev, itemId]);
        addToast('Focus item dismissed.', 'success');
    }, [addToast]);

    const calculateMemberTier = useCallback((member: Member, tiers: CustomerTier[], calculationMethod: TierCalculationMethod): Member => {
        const totalSumAssured = (member.policies || []).reduce((sum, policy) => sum + (policy.coverage || 0), 0);
        const totalPremium = (member.policies || []).reduce((sum, policy) => sum + (policy.premium || 0), 0);

        let sortedTiers = [...tiers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        let assignedTier;

        if (calculationMethod === 'sumAssured') {
            sortedTiers = [...sortedTiers].sort((a, b) => (b.minimumSumAssured ?? 0) - (a.minimumSumAssured ?? 0));
            assignedTier = sortedTiers.find(tier => totalSumAssured >= (tier.minimumSumAssured ?? 0));
        } else {
            sortedTiers = [...sortedTiers].sort((a, b) => (b.minimumPremium ?? 0) - (a.minimumPremium ?? 0));
            assignedTier = sortedTiers.find(tier => totalPremium >= (tier.minimumPremium ?? 0));
        }

        if (assignedTier) {
            return { ...member, tierId: assignedTier.id, memberType: assignedTier.name ?? 'No Tier' };
        }

        return { ...member, tierId: null, memberType: 'No Tier' };
    }, []);

    const handleUpdateAllMemberTiers = useCallback(async (newMethod: TierCalculationMethod) => {
        setCustomerTierCalculationMethod(newMethod);
        const updatedMembers = allMembers.map(member => calculateMemberTier(member, customerTiers, newMethod));
        setAllMembers(updatedMembers);
        addToast(`Type calculation method updated to '${newMethod}'. All Customer Type have been re-evaluated.`, 'success');
    }, [allMembers, customerTiers, calculateMemberTier, addToast]);

    const handleUpdateBusinessVerticals = useCallback((newData: BusinessVertical[]) => setBusinessVerticals([...newData]), []);
    const handleUpdateLeadSources = useCallback((newData: LeadSourceMaster[]) => setLeadSources([...newData]), []);
    const handleUpdateSchemes = useCallback((newData: SchemeMaster[]) => setSchemes([...newData]), []);
    const handleUpdateBranches = useCallback((newData: Branch[]) => setAllBranches([...newData]), []);
    const handleUpdateGeographies = useCallback((newData: Geography[]) => setGeographies([...newData]), []);
    const handleUpdateRelationshipTypes = useCallback((newData: RelationshipType[]) => setRelationshipTypes([...newData]), []);
    const handleUpdateDocumentMasters = useCallback((newData: DocumentMaster[]) => setDocumentMasters([...newData]), []);
    const handleUpdateInsuranceTypeDocumentRules = useCallback((newData: InsuranceTypeDocumentRule[]) => setInsuranceTypeDocumentRules([...newData]), []);
    const handleUpdateGiftMasters = useCallback((newData: GiftMaster[]) => setGiftMasters([...newData]), []);
    const handleUpdateTaskStatusMasters = useCallback((newData: TaskStatusMaster[]) => setTaskStatusMasters([...newData]), []);
    const handleUpdateCustomerCategories = useCallback((newData: CustomerCategory[]) => setCustomerCategories([...newData]), []);
    const handleUpdateBankMasters = useCallback((newData: BankMaster[]) => setBankMasters([...newData]), []);
    const handleUpdateAccountTypes = useCallback((newData: AccountType[]) => setAccountTypes([...newData]), []);
    const handleUpdateCustomerSubCategories = useCallback((newData: CustomerSubCategory[]) => setCustomerSubCategories([...newData]), []);
    const handleUpdateCustomerGroups = useCallback((newData: CustomerGroup[]) => setCustomerGroups([...newData]), []);
    const handleUpdateTaskMasters = useCallback((newData: TaskMaster[]) => setTaskMasters([...newData]), []);
    const handleUpdateInsuranceTypes = useCallback((newData: InsuranceTypeMaster[]) => setInsuranceTypes([...newData]), []);
    const handleUpdateInsuranceFields = useCallback((newData: InsuranceFieldMaster[]) => setInsuranceFields([...newData]), []);
    const handleUpdateRoutes = useCallback((newData: RouteType[]) => setRoutes([...newData]), []);
    const handleUpdateCustomerTiers = useCallback((newData: CustomerTier[]) => setCustomerTiers([...newData]), []);
    const handleUpdateCustomerFieldMasters = useCallback((newData: CustomerFieldMaster[]) => setCustomerFieldMasters([...newData]), []);
    const handleUpdateAccountCategories = useCallback(async (newData: AccountCategory[]) => {
        try {
            const updated = await updateAccountCategories(newData);
            setAccountCategories(updated);
            addToast('Account Categories updated!', 'success');
        } catch (error) { addToast(`Failed to update: ${(error as Error).message}`, 'error'); }
    }, [addToast]);
    const handleUpdateAccountSubCategories = useCallback(async (newData: AccountSubCategory[]) => {
        try {
            const updated = await updateAccountSubCategories(newData);
            setAccountSubCategories(updated);
            addToast('Account Sub-Categories updated!', 'success');
        } catch (error) { addToast(`Failed to update: ${(error as Error).message}`, 'error'); }
    }, [addToast]);
    const handleUpdateAccountHeads = useCallback(async (newData: AccountHead[]) => {
        try {
            const updated = await updateAccountHeads(newData);
            setAccountHeads(updated);
            addToast('Account Heads updated!', 'success');
        } catch (error) { addToast(`Failed to update: ${(error as Error).message}`, 'error'); }
    }, [addToast]);
    const handleUpdateReligions = useCallback((newData: Religion[]) => setReligions([...newData]), []);
    const handleUpdateFestivals = useCallback((newData: Festival[]) => setFestivals([...newData]), []);
    const handleUpdateFestivalDates = useCallback((newData: FestivalDate[]) => setFestivalDates([...newData]), []);
    const handleUpdateAmcs = useCallback((newData: AMC[]) => setAmcs([...newData]), []);
    const handleUpdateMutualFundSchemes = useCallback((newData: MutualFundScheme[]) => setMutualFundSchemes([...newData]), []);
    const handleUpdateMutualFundFields = useCallback((newData: MutualFundFieldMaster[]) => setMutualFundFields([...newData]), []);
    const handleUpdateAgencies = useCallback((newData: InsuranceAgency[]) => setAgencies(newData), []);
    const handleUpdateDesignations = useCallback((newData: Designation[]) => setDesignations(newData), []);
    const handleUpdateRoles = useCallback((newData: Role[]) => setRoles(newData), []);
    const handleUpdateGenders = useCallback((newData: Gender[]) => setGenders([...newData]), []);
    const handleUpdateMaritalStatuses = useCallback((newData: MaritalStatus[]) => setMaritalStatuses([...newData]), []);
    const handleUpdateCustomerTypes = useCallback((newData: CustomerType[]) => setCustomerTypes([...newData]), []);
    const handleUpdateOccasionTypeMasters = useCallback((newData: OccasionTypeMaster[]) => setOccasionTypeMasters([...newData]), []);
    const handleUpdateProcessStageMasters = useCallback(async (newData: ProcessStageMaster[]) => {
        try {
            const updated = await updateProcessStageMasters(newData);
            setProcessStageMasters(updated);
            addToast('Process flow updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update process flow: ${(error as Error).message}`, 'error');
        }
    }, [addToast]);

    const handleUpdateLeadStageMasters = useCallback(async (newData: LeadStageMaster[]) => {
        try {
            const updated = await updateLeadStageMasters(newData);
            setLeadStageMasters(updated);
            addToast('Lead pipeline stages updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update lead stages: ${(error as Error).message}`, 'error');
        }
    }, [addToast]);

    const handleUpdateRolePermissions = useCallback(async (permissions: RolePermissions) => {
        try {
            const updated = await updateRolePermissions(permissions);
            setRolePermissions(prev => prev.map(p => p.roleId === updated.roleId ? updated : p));
            addToast('Role permissions updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update permissions: ${(error as Error).message}`, 'error');
        }
    }, [addToast]);

    const handleUpdateFinancialYears = useCallback(async (newData: FinancialYear[]) => {
        try {
            const updated = await updateFinancialYears(newData);
            setFinancialYears(updated);
            addToast('Financial Years updated successfully!', 'success');
        } catch (e) { addToast('Failed to update Financial Years.', 'error'); }
    }, [addToast]);

    const handleUpdateDocumentNumbering = useCallback(async (newData: DocumentNumbering[]) => {
        try {
            const updated = await updateDocumentNumbering(newData);
            setDocumentNumbering(updated);
            addToast('Document Numbering rules updated successfully!', 'success');
        } catch (e) { addToast('Failed to update Document Numbering rules.', 'error'); }
    }, [addToast]);

    const handleAddExpense = useCallback((newExpense: Omit<Expense, 'id'>) => {
        setExpenses(prev => [...prev, { ...newExpense, id: `exp-${Date.now()}` }]);
        addToast("Expense added successfully!", "success");
    }, [addToast]);

    const handleAddManualIncome = useCallback((newIncome: Omit<ManualIncome, 'id'>) => {
        setManualIncomes(prev => [...prev, { ...newIncome, id: `minc-${Date.now()}` }]);
        addToast("Income added successfully!", "success");
    }, [addToast]);

    const handleAddManualCommission = useCallback((newCommission: Omit<ManualCommission, 'id'>) => {
        setManualCommissions(prev => [...prev, { ...newCommission, id: `mcomm-${Date.now()}` }]);
        addToast("Manual commission added successfully!", "success");
    }, [addToast]);
    const handleUpdateExpense = useCallback((updatedExpense: Expense) => {
        setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
        addToast("Expense updated successfully!", "success");
    }, [addToast]);

    const handleDeleteExpense = useCallback((expenseId: string) => {
        setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
        addToast("Expense deleted successfully.", "success");
    }, [addToast]);

    const handleUpdateManualIncome = useCallback((updatedIncome: ManualIncome) => {
        setManualIncomes(prev => prev.map(inc => inc.id === updatedIncome.id ? updatedIncome : inc));
        addToast("Income record updated successfully!", "success");
    }, [addToast]);

    const handleDeleteManualIncome = useCallback((incomeId: string) => {
        setManualIncomes(prev => prev.filter(inc => inc.id !== incomeId));
        addToast("Income record deleted successfully.", "success");
    }, [addToast]);

    const handleUpdateManualCommission = useCallback((updatedCommission: ManualCommission) => {
        setManualCommissions(prev => prev.map(comm => comm.id === updatedCommission.id ? updatedCommission : comm));
        addToast("Commission record updated successfully!", "success");
    }, [addToast]);

    const handleDeleteManualCommission = useCallback((commissionId: string) => {
        setManualCommissions(prev => prev.filter(comm => comm.id !== commissionId));
        addToast("Commission record deleted successfully.", "success");
    }, [addToast]);

    const handleSaveVoucherDetails = useCallback((data: VoucherSaveData) => {
        const { voucherNo, date, payeeName, branch_id, lineItems, finYearId, partyId, partyType, docNo, docDate } = data;

        const existingExpensesMap = new Map(expenses.map(e => [e.id, e]));
        const processedExistingIds = new Set<string>();
        const newAndUpdatedExpenses: Expense[] = [];

        lineItems.forEach(item => {
            const accountHeadId = item.accountHeadId || undefined;

            if (item.isNew === false && item.id) {
                const existingExpense = existingExpensesMap.get(item.id);
                if (existingExpense) {
                    const updatedExpense = {
                        ...existingExpense,
                        date,
                        amount: item.amount,
                        description: item.description,
                        paidTo: payeeName,
                        voucherNo,
                        branch_id,
                        modeOfPayment: item.modeOfPayment,
                        accountHeadId: accountHeadId || existingExpense.accountHeadId,
                        finYearId,
                        partyId,
                        partyType,
                        bankId: item.bankId,
                        docNo,
                        docDate,
                    };
                    newAndUpdatedExpenses.push(updatedExpense);
                    processedExistingIds.add(item.id);
                }
            } else {
                const newExpense: Expense = {
                    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date,
                    amount: item.amount,
                    description: item.description,
                    paidTo: payeeName,
                    createdBy: currentUser?.id || 'unknown',
                    voucherNo,
                    branch_id,
                    modeOfPayment: item.modeOfPayment,
                    accountHeadId,
                    finYearId,
                    partyId,
                    partyType,
                    bankId: item.bankId,
                    docNo,
                    docDate,
                };
                newAndUpdatedExpenses.push(newExpense);
            }
        });

        setExpenses(prev => {
            const otherExpenses = prev.filter(e => !processedExistingIds.has(e.id));
            return [...otherExpenses, ...newAndUpdatedExpenses];
        });

        addToast(`Voucher ${voucherNo} has been saved successfully.`, 'success');
    }, [expenses, currentUser, addToast]);

    const handleSaveReceipt = useCallback((data: Omit<ReceiptSaveData, 'createdBy' | 'id'> & { id?: string }) => {
        if (!currentUser) return;

        const { receiptNo, date, receivedFrom, address, finYearId, lineItems, partyId, partyType, docNo, docDate, isPaymentReturned } = data;

        if (data.id) {
            const updatedReceipt: ManualReceipt = {
                id: data.id,
                receiptNo,
                date,
                receivedFrom,
                address,
                finYearId,
                partyId,
                partyType,
                docNo,
                docDate,
                isPaymentReturned: isPaymentReturned ?? false,
                createdBy: manualReceipts.find(r => r.id === data.id)?.createdBy || currentUser.id,
                lineItems: data.lineItems.map((item, index) => ({
                    ...item,
                    id: `li-${data.id}-${index}`
                }))
            };
            setManualReceipts(prev => prev.map(r => r.id === data.id ? updatedReceipt : r));
            addToast(`Receipt updated successfully!`, 'success');
        }
        else {
            const newId = `rec-${Date.now()}`;
            const newReceipt: ManualReceipt = {
                id: newId,
                receiptNo,
                date,
                receivedFrom,
                address,
                finYearId,
                partyId,
                partyType,
                docNo,
                docDate,
                createdBy: currentUser.id,
                lineItems: data.lineItems.map((item, index) => ({
                    ...item,
                    id: `li-${newId}-${index}`
                })),
                isPaymentReturned: false
            };
            setManualReceipts(prev => [...prev, newReceipt]);
            addToast(`Receipt ${data.receiptNo} created successfully!`, 'success');
        }
    }, [currentUser, addToast, manualReceipts]);

    const handleDeleteManualReceipt = useCallback((receiptId: string) => {
        setManualReceipts(prev => prev.filter(r => r.id !== receiptId));
        addToast("Receipt deleted successfully.", "success");
    }, [addToast]);


    const handleDeleteVoucher = useCallback((voucherNo: string) => {
        setExpenses(prev => prev.filter(exp => exp.voucherNo !== voucherNo));
        addToast(`Voucher ${voucherNo} and associated expenses deleted.`, 'success');
    }, [addToast]);

    const handleAddDocumentMaster = useCallback((name: string) => {
        const newDocMaster: DocumentMaster = {
            id: `doc-${Date.now()}`,
            name,
            active: true,
            order: documentMasters.length,
        };
        setDocumentMasters(prev => [...prev, newDocMaster]);
    }, [documentMasters]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [
                    membersData, leadsData, usersData, routesData, opCompaniesData, branchesData,
                    religionsData, festivalsData, relationshipTypesData, festivalDatesData, upsellCategoriesData,
                    designationsData, rolesData, rolePermissionsData,
                    gendersData, maritalStatusesData, customerTypesData,
                    customerTiersData,
                    processStagesData,
                    financialYearsData, documentNumberingData,
                    insuranceTypeDocumentRulesData,
                    leadStageMastersData,
                    occasionTypeMastersData,
                    openingBalancesData,
                    accCats, accSubCats, accHeads
                ] = await Promise.all([
                    getMembers(),
                    getLeads(),
                    getUsers(),
                    getRoutes(),
                    getOperatingCompanies(),
                    getBranches(),
                    getReligions(),
                    getFestivals(),
                    getRelationshipTypes(),
                    getFestivalDates(),
                    getUpsellCategories(),
                    getDesignations(),
                    getRoles(),
                    getRolePermissions(),
                    getGenders(),
                    getMaritalStatuses(),
                    getCustomerTypes(),
                    getCustomerTiers(),
                    getProcessStageMasters(),
                    getFinancialYears(),
                    getDocumentNumbering(),
                    getInsuranceTypeDocumentRules(),
                    getLeadStageMasters(),
                    getOccasionTypeMasters(),
                    getOpeningBalances(),
                    getAccountCategories(),
                    getAccountSubCategories(),
                    getAccountHeads()
                ]);
                setAllMembers(membersData);
                setAllLeads(leadsData);
                setAllUsers(usersData);
                setRoutes(routesData);
                setOperatingCompanies(opCompaniesData);
                setAllBranches(branchesData);
                setReligions(religionsData);
                setFestivals(festivalsData);
                setRelationshipTypes(relationshipTypesData);
                setFestivalDates(festivalDatesData);
                setUpsellCategories(upsellCategoriesData);
                setDesignations(designationsData);
                setRoles(rolesData);
                setRolePermissions(rolePermissionsData);
                setGenders(gendersData);
                setMaritalStatuses(maritalStatusesData);
                setCustomerTypes(customerTypesData);

                const typeMap = new Map(customerTypesData.map(t => [t.id, t.name]));
                const hydratedTiers = customerTiersData.map(tier => ({ ...tier, name: typeMap.get(tier.customerTypeId) || 'Unknown' }));
                setCustomerTiers(hydratedTiers);

                setProcessStageMasters(processStagesData);
                setFinancialYears(financialYearsData);
                setDocumentNumbering(documentNumberingData);
                setInsuranceTypeDocumentRules(insuranceTypeDocumentRulesData);
                setLeadStageMasters(leadStageMastersData);
                setOccasionTypeMasters(occasionTypeMastersData);
                setOpeningBalances(openingBalancesData);

                setAccountCategories(accCats);
                setAccountSubCategories(accSubCats);
                setAccountHeads(accHeads);

            } catch (error) {
                console.error("Failed to load initial data:", error);
                addToast("Could not load app data. Please refresh.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [addToast]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const fetchTodaysFocus = useCallback(async () => {
        if (!currentUser) return;
        setIsFocusLoading(true);
        setFocusError(null);
        try {
            const items = await generateTodaysFocus({
                members: companyMembers,
                leads: companyLeads,
                notifications,
                upsellOpportunities,
            });
            setTodaysFocusItems(items);
        } catch (e) {
            console.error("Failed to generate today's focus:", e);
            setFocusError("Could not load AI suggestions. Please try again later.");
            setTodaysFocusItems([]);
        } finally {
            setIsFocusLoading(false);
        }
    }, [currentUser, companyMembers, companyLeads, notifications, upsellOpportunities]);

    useEffect(() => {
        if (currentUser && !isLoading) {
            fetchTodaysFocus();
        }
    }, [currentUser, isLoading, fetchTodaysFocus]);


    useEffect(() => {
        const userRole = roles.find(r => r.id === currentUser?.roleId);
        if (userRole?.isAdvisor) {
            const interval = setInterval(async () => {
                const [locations, checks] = await Promise.all([getAdvisorLocations(), getCheckIns()]);
                setAdvisorLocations(locations);
                setCheckIns(checks);
            }, 5000);

            (async () => {
                const [locations, checks] = await Promise.all([getAdvisorLocations(), getCheckIns()]);
                setAdvisorLocations(locations);
                setCheckIns(checks);
            })();

            return () => clearInterval(interval);
        }
    }, [currentUser, roles]);

    useEffect(() => {
        const generateNotifications = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingLimit = new Date(today);
            upcomingLimit.setDate(today.getDate() + 30);

            const newNotifications: Notification[] = [];
            let idCounter = 0;

            const dayDifference = (date1: Date, date2: Date): number => {
                const diffTime = date1.getTime() - date2.getTime();
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };

            const occasionMap = new Map(occasionTypeMasters.map(o => [o.id, o.name]));

            companyMembers.forEach(member => {
                if (member.automatedGreetingsEnabled !== false) {
                    const getNextOccurrence = (dateStr: string | undefined): Date | null => {
                        if (!dateStr) return null;
                        const eventDate = new Date(dateStr);
                        if (isNaN(eventDate.getTime())) return null;
                        const currentYear = today.getFullYear();
                        eventDate.setFullYear(currentYear);
                        if (eventDate < today) {
                            eventDate.setFullYear(currentYear + 1);
                        }
                        return eventDate;
                    };

                    const nextBirthday = getNextOccurrence(member.dob);
                    if (nextBirthday && nextBirthday <= upcomingLimit) {
                        const diffDays = dayDifference(nextBirthday, today);
                        const rule = automationRules.find(r => r.type === 'Birthday Messages' && r.enabled);
                        const message = rule
                            ? rule.template.replace('{name}', member.name)
                            : (diffDays === 0
                                ? `Happy Birthday to ${member.name} today! Wishing you a wonderful year ahead.`
                                : `Birthday for ${member.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
                        newNotifications.push({ id: `bday-${member.id}-${idCounter++}`, type: 'Birthday', date: nextBirthday.toISOString(), message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
                    }

                    const nextAnniversary = getNextOccurrence(member.anniversary);
                    if (nextAnniversary && nextAnniversary <= upcomingLimit) {
                        const diffDays = dayDifference(nextAnniversary, today);
                        const rule = automationRules.find(r => r.type === 'Anniversary Messages' && r.enabled);
                        const message = rule
                            ? rule.template.replace('{name}', member.name)
                            : (diffDays === 0
                                ? `Happy Anniversary to ${member.name} today! May this special day bring you joy.`
                                : `Anniversary for ${member.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
                        newNotifications.push({ id: `anniv-${member.id}-${idCounter++}`, type: 'Anniversary', date: nextAnniversary.toISOString(), message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
                    }

                    (member.otherSpecialOccasions || []).forEach(occasion => {
                        const nextOccasionDate = getNextOccurrence(occasion.date);
                        const occasionName = occasionMap.get(occasion.occasionTypeId) || 'Special Occasion';
                        if (nextOccasionDate && nextOccasionDate <= upcomingLimit) {
                            const diffDays = dayDifference(nextOccasionDate, today);
                            const rule = automationRules.find(r => r.type === occasionName && r.enabled);
                            const message = rule
                                ? rule.template.replace('{name}', member.name)
                                : (diffDays === 0
                                    ? `Today is a special day for ${member.name}: ${occasionName}!`
                                    : `Upcoming special day for ${member.name}: ${occasionName} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
                            newNotifications.push({ id: `special-${member.id}-${occasion.id}-${idCounter++}`, type: 'Special Occasion', occasionName: occasionName, date: nextOccasionDate.toISOString(), message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
                        }
                    });

                    const relevantFestivalIds = new Set(festivals.filter(f => f.religionId === member.religionId || !f.religionId).map(f => f.id));

                    festivalDates.forEach(fd => {
                        if (relevantFestivalIds.has(fd.festivalId)) {
                            const festivalDate = new Date(fd.date);
                            if (festivalDate >= today && festivalDate <= upcomingLimit) {
                                const diffDays = dayDifference(festivalDate, today);
                                if (diffDays === 0) {
                                    const festival = festivals.find(f => f.id === fd.festivalId);
                                    if (festival) {
                                        newNotifications.push({ id: `fest-${member.id}-${festival.id}-${fd.id}-${idCounter++}`, type: 'Festival', occasionName: festival.name, date: festivalDate.toISOString(), message: `Happy ${festival.name} to ${member.name}!`, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
                                    }
                                }
                            }
                        }
                    });
                }

                member.policies.forEach(policy => {
                    if (policy.status === 'Active') {
                        const renewalDate = new Date(policy.renewalDate);
                        const diffTime = renewalDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 0 && diffDays <= 30) {
                            newNotifications.push({
                                id: `renew-${policy.id}-${idCounter++}`, type: 'Policy Renewal', date: renewalDate.toISOString(), message: `Policy renewal for ${member.name} is due in ${diffDays} days.`, member: { id: member.id, name: member.name, mobile: member.mobile }, policy, source: 'auto'
                            });
                        }
                    }
                });
            });

            customMessages.forEach(msg => {
                const msgDate = new Date(msg.dateTime);
                if (msgDate.getFullYear() === today.getFullYear() && msgDate.getMonth() === today.getMonth() && msgDate.getDate() === today.getDate()) {
                    const member = companyMembers.find(m => m.id === msg.memberId);
                    if (member) newNotifications.push({ id: `custom-${msg.id}-${idCounter++}`, type: 'Custom', date: msg.dateTime, message: msg.message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'custom' });
                }
            });

            newNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setNotifications(newNotifications);
        };

        if (companyMembers.length > 0 && festivals.length > 0 && occasionTypeMasters.length > 0) {
            generateNotifications();
        }
    }, [companyMembers, customMessages, festivals, festivalDates, religions, occasionTypeMasters, automationRules]);

    const undismissedNotifications = useMemo(() => notifications.filter(n => !n.dismissed && !dismissedItems[n.id]), [notifications, dismissedItems]);
    const hubNotifications = useMemo(() => notifications.filter(n => !n.dismissed && !dismissedItems[n.id]), [notifications, dismissedItems]);
    const hubTasks = useMemo(() => allTasks.filter(t => !dismissedItems[t.id]), [allTasks, dismissedItems]);
    const hubAppointments = useMemo(() => appointments.filter(a => !dismissedItems[a.id]), [appointments, dismissedItems]);
    const hubActivityLog = useMemo(() => activityLog.filter(l => !dismissedItems[l.id]), [activityLog, dismissedItems]);

    useEffect(() => {
        setDropdownCleared(false);
    }, [undismissedNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleClearDropdown = useCallback(() => {
        setDropdownCleared(true);
        addToast("Notifications cleared from this view.", "success");
    }, [addToast]);

    const handleClearActionHubNotifications = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
        addToast("All notifications cleared from Action Hub.", "success");
    }, [addToast]);

    const handleLogin = (user: User, finYearId: string) => {
        setCurrentUser(user);
        setActiveFinancialYearId(finYearId);

        // Update favicon only on login
        if (user.company_logo) {
            const favicon = document.getElementById('favicon') as HTMLLinkElement;
            if (favicon) favicon.href = user.company_logo;
        }

        navigate('/dashboard');

        const userRole = roles.find(r => r.id === user.roleId);
        if (userRole?.isAdvisor) {
            const today = new Date().toISOString().split('T')[0];
            const hasMarkedToday = attendance[user.id]?.some(record => record.timestamp.startsWith(today));
            if (!hasMarkedToday) {
                setIsAttendanceModalOpen(true);
            }
            getActiveCheckIn(user.id).then(active => {
                if (active) {
                    setActiveCheckIn(active);
                    addToast(`You have an active meeting with ${active.customerName}. Don't forget to check out!`, "success");
                }
            });
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveFinancialYearId(null);
        navigate('/login');
    };

    const handleAutomaticTaskReassignment = useCallback(async (absentEmployeeId: string) => {
        const absentEmployee = allUsers.find(u => u.id === absentEmployeeId);
        if (!absentEmployee) return;

        const pendingTasks = allTasks.filter(t => t.primaryContactPerson === absentEmployeeId && !t.isCompleted);

        if (pendingTasks.length === 0) return;

        const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
        const availableAdvisors = allUsers.filter(u => {
            if (!u.roleId || !advisorRoleIds.has(u.roleId) || u.id === absentEmployeeId) return false;
            const today = new Date().toISOString().split('T')[0];
            const records = attendance[u.id];
            if (!records) return false;
            return records.some(rec => rec.timestamp.startsWith(today) && rec.status === 'Present');
        });

        if (availableAdvisors.length === 0) {
            addToast(`No advisors available to reassign tasks from ${absentEmployee.name}.`, "error");
            return;
        }

        let reassignedCount = 0;
        const tasksToUpdate = [...allTasks];

        for (const task of pendingTasks) {
            let replacement: User | undefined;

            if (task.alternateContactPersons && task.alternateContactPersons.length > 0) {
                const alternateId = task.alternateContactPersons.find(id => availableAdvisors.some(pa => pa.id === id));
                if (alternateId) {
                    replacement = availableAdvisors.find(pa => pa.id === alternateId);
                }
            }

            if (!replacement) {
                const absentEmployeeBranch = absentEmployee.profile?.employeebranch_id;
                if (absentEmployeeBranch) {
                    replacement = availableAdvisors.find(pa => pa.profile?.employeebranch_id === absentEmployeeBranch);
                }
            }

            if (!replacement) {
                replacement = availableAdvisors[0];
            }

            if (replacement) {
                const taskIndex = tasksToUpdate.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    const oldTask = tasksToUpdate[taskIndex];
                    const newLog: TaskActivityLog = {
                        timestamp: new Date().toISOString(),
                        action: 'Reassigned',
                        details: `Task automatically reassigned from ${absentEmployee.name} to ${replacement.name} due to absence.`,
                        by: 'system',
                    };
                    const updatedTask = {
                        ...oldTask,
                        primaryContactPerson: replacement.id,
                        originalAssigneeId: oldTask.originalAssigneeId || oldTask.primaryContactPerson,
                        statusId: 'ts-created',
                        activityLog: [...(oldTask.activityLog || []), newLog],
                    };
                    tasksToUpdate[taskIndex] = updatedTask;
                    reassignedCount++;
                }
            }
        }

        if (reassignedCount > 0) {
            setAllTasks(tasksToUpdate);
            addToast(`${reassignedCount} task(s) have been automatically reassigned from ${absentEmployee.name}.`, 'success');
        }

    }, [allTasks, allUsers, attendance, addToast, roles]);

    const handleMarkAttendance = useCallback((status: AttendanceRecord['status'], reason?: string) => {
        if (!currentUser) return;
        const timestamp = new Date().toISOString();
        const newRecord: AttendanceRecord = { status, reason, timestamp };

        setAttendance(prev => {
            const userRecords = prev[currentUser.id] || [];
            return { ...prev, [currentUser.id]: [...userRecords, newRecord] };
        });

        setIsAttendanceModalOpen(false);
        addToast(`Attendance marked as ${status}.`, 'success');

        if (status === 'Absent') {
            handleAutomaticTaskReassignment(currentUser.id);
        }
    }, [currentUser, addToast, handleAutomaticTaskReassignment]);

    const handleUpdateAttendanceByAdmin = useCallback((userId: string, status: AttendanceRecord['status'], reason?: string) => {
        const timestamp = new Date().toISOString();
        const newRecord: AttendanceRecord = { status, reason: reason || 'Admin Override', timestamp };

        setAttendance(prev => {
            const userRecords = prev[userId] || [];
            const today = new Date().toISOString().split('T')[0];
            const todaysRecordIndex = userRecords.findIndex(rec => rec.timestamp.startsWith(today));

            if (todaysRecordIndex > -1) {
                userRecords[todaysRecordIndex] = newRecord;
                return { ...prev, [userId]: [...userRecords] };
            } else {
                return { ...prev, [userId]: [...userRecords, newRecord] };
            }
        });
        addToast("Attendance updated.", "success");

        if (status === 'Absent') {
            handleAutomaticTaskReassignment(userId);
        }
    }, [addToast, handleAutomaticTaskReassignment]);


    const handleOpenMemberModal = useCallback((member: Member | null, initialTab: ModalTab | null = ModalTab.BasicInfo, originatingLeadId: string | null = null) => {
        setEditingMember(member);
        setInitialModalTab(initialTab);
        setLeadToConvertId(originatingLeadId);
        setIsMemberModalOpen(true);
    }, []);

    const onViewMember = useCallback((member: Member, initialTab?: ModalTab) => {
        handleOpenMemberModal(member, initialTab);
    }, [handleOpenMemberModal]);

    const handleOpenLeadModal = useCallback((lead: Lead | null) => {
        setEditingLead(lead);
        setUpsellContext(null);
        setIsLeadModalOpen(true);
    }, []);

    const handleCreateLeadFromUpsell = useCallback((member: Member, insuranceTypeName: string) => {
        setUpsellContext({ member, insuranceType: insuranceTypeName });
        setEditingLead(null);
        setIsLeadModalOpen(true);
    }, []);

    const handleBulkCreateLeads = useCallback(async (newLeads: Lead[]) => {
        if (!currentUser) return;
        try {
            const createdLeads: Lead[] = [];
            for (const leadData of newLeads) {
                const leadPayload = {
                    ...leadData,
                    createdAt: new Date().toISOString(),
                    activityLog: [{
                        timestamp: new Date().toISOString(),
                        action: 'Created' as const,
                        details: 'Lead created via Bulk CrossSelling action.',
                        by: currentUser.id
                    }]
                };
                const created = await createLead(leadPayload as Omit<Lead, 'id' | 'createdAt' | 'company' | 'comp_id'>, currentUser.comp_id);
                createdLeads.push(created);
            }

            setAllLeads(prev => [...prev, ...createdLeads]);
            addToast(`${createdLeads.length} leads created successfully!`, 'success');
        } catch (error) {
            console.error("Bulk create failed:", error);
            addToast("Failed to create bulk leads.", "error");
        }
    }, [currentUser, addToast]);


    const handleConvertLead = useCallback((lead: Lead) => {
        if (lead.existingMemberId) {
            setPendingConversionLead(lead);
            setIsCustomerExistsModalOpen(true);
        } else {
            const newMemberFromLead: Partial<Member> = {
                name: lead.name,
                mobile: lead.phone,
                email: lead.email,
                leadSource: lead.leadSource,
                assignedTo: lead.assignedTo ? [lead.assignedTo] : [],
                branch_id: lead.branch_id,
                company: lead.company,
                comp_id: lead.comp_id,
                active: true,
                policies: [],
                voiceNotes: [],
                documents: [],
                checkIns: [],
                processStage: 'Initial Contact',
            };
            handleOpenMemberModal(newMemberFromLead as Member, ModalTab.BasicInfo, lead.id);
            addToast(`Converting ${lead.name} to customer. Please review and save.`, "success");
        }
    }, [addToast, handleOpenMemberModal]);

    const handleUpdateExistingCustomerFromLead = useCallback(async () => {
        if (!pendingConversionLead || !pendingConversionLead.existingMemberId) return;

        const existingMember = allMembers.find(m => m.id === pendingConversionLead.existingMemberId);
        if (!existingMember) {
            addToast("Original customer record not found.", "error");
            setIsCustomerExistsModalOpen(false);
            return;
        }

        try {
            const updatedLead = await updateLead({ ...pendingConversionLead, status: 'Won' });
            setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));

            setIsCustomerExistsModalOpen(false);
            setPendingConversionLead(null);

            addToast(`Lead marked as Won. Opening customer profile for updates.`, "success");

            handleOpenMemberModal(existingMember, ModalTab.Policies);

        } catch (error) {
            addToast(`Failed to update lead: ${(error as Error).message}`, "error");
        }
    }, [pendingConversionLead, allMembers, addToast, handleOpenMemberModal]);


    const handleOpenEmployeeModal = useCallback((employee: User | null) => {
        setEditingEmployee(employee);
        setIsEmployeeModalOpen(true);
    }, []);

    const handleViewTier = useCallback((tier: CustomerTier) => {
        setViewingTier(tier);
        setIsViewByTierModalOpen(true);
    }, []);

    const handleCreateDependentMember = useCallback(async (spoc: Member, dependentData: Partial<Member>): Promise<Member | null> => {
        if (!currentUser || !spoc || !spoc.sno) {
            addToast('Cannot create dependent: primary contact is not saved.', 'error');
            return null;
        }

        try {
            const namePart = (dependentData.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, '_');
            const mobilePart = (dependentData.mobile || spoc.mobile || '').replace(/[^0-9]/g, '').slice(-5).padEnd(5, '_');
            const dobPart = (dependentData.dob || '0101').replace(/-/g, '').slice(-4);
            const newMemberId = `${namePart}${dobPart}${mobilePart}`;

            const newDependentPayload: Omit<Member, 'id' | 'sno'> = {
                name: dependentData.name || '',
                memberId: newMemberId,
                dob: dependentData.dob || '',
                gender: dependentData.gender,
                mobile: dependentData.mobile || spoc.mobile,
                email: dependentData.email || spoc.email,
                maritalStatus: dependentData.maritalStatus || null,
                country: spoc.country,
                state: dependentData.state || spoc.state,
                city: dependentData.city || spoc.city,
                address: dependentData.address || spoc.address,
                memberType: 'No Tier',
                tierId: null,
                active: true,
                panCard: '',
                aadhaar: '',
                policies: [],
                voiceNotes: [],
                documents: [],
                checkIns: [],
                assignedTo: spoc.assignedTo,
                isSPOC: false,
                spocId: spoc.sno,
                familyName: spoc.familyName,
                company: spoc.company,
                comp_id: spoc.comp_id,
                createdBy: currentUser.id,
                createdAt: new Date().toISOString(),
                processStage: 'Initial Contact',
            };

            const created = await createMember(newDependentPayload);
            setAllMembers(prev => [...prev, created]);
            return created;

        } catch (error) {
            addToast(`Error creating family member: ${(error as Error).message}`, "error");
            return null;
        }
    }, [currentUser, addToast]);


    const handleSaveMember = useCallback(async (memberData: Member, closeModal: boolean = true) => {
        const isNew = !memberData.id;
        let updatedMemberData = { ...memberData };

        updatedMemberData = calculateMemberTier(updatedMemberData, customerTiers, customerTierCalculationMethod);

        try {
            if (isNew) {
                const duplicates = allMembers.filter(m => m.memberId === updatedMemberData.memberId && m.comp_id === currentUser?.comp_id);
                if (duplicates.length > 0) {
                    setPendingDuplicateMember(updatedMemberData);
                    setDuplicateMatches(duplicates);
                    setIsDuplicateModalOpen(true);
                    return;
                }

                const isSPOC = (updatedMemberData.policies || []).some(p => p.policyHolderType === 'Family') || updatedMemberData.isSPOC;
                updatedMemberData.isSPOC = isSPOC;
                if (isSPOC && !updatedMemberData.familyName) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                }

                const newMemberPayload = { ...updatedMemberData, company: currentUser?.company || '', comp_id: currentUser?.comp_id || '', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
                const createdMember = await createMember(newMemberPayload as Omit<Member, 'id' | 'sno'>);

                setAllMembers(prev => [...prev, createdMember]);
                addToast("Customer created successfully!", "success");

                if (leadToConvertId) {
                    const leadToUpdate = allLeads.find(l => l.id === leadToConvertId);
                    if (leadToUpdate) {
                        const updatedLead = await updateLead({ ...leadToUpdate, status: 'Won' });
                        setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                        addToast(`Lead "${updatedLead.name}" marked as Won.`, "success");
                    }
                    setLeadToConvertId(null);
                }

                if (closeModal) setIsMemberModalOpen(false);

            } else {
                const oldMember = allMembers.find(m => m.id === updatedMemberData.id);
                if (!oldMember) throw new Error("Original member not found for update.");

                let membersToUpdate: Member[] = [];

                const wasSPOC = oldMember.isSPOC;
                const isNowSPOC = (updatedMemberData.policies || []).some(p => p.policyHolderType === 'Family') || updatedMemberData.isSPOC;
                updatedMemberData.isSPOC = isNowSPOC;

                if (isNowSPOC && !wasSPOC) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                } else if (isNowSPOC && !updatedMemberData.familyName) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                }

                if (updatedMemberData.isSPOC && oldMember.name !== updatedMemberData.name) {
                    updatedMemberData.familyName = `${updatedMemberData.name}'s Family`;
                    const dependentsToUpdate = allMembers.filter(m => m.spocId === oldMember.sno);
                    dependentsToUpdate.forEach(dep => {
                        membersToUpdate.push({ ...dep, familyName: updatedMemberData.familyName });
                    });
                }

                if (oldMember.spocId) {
                    const spoc = allMembers.find(m => m.sno === oldMember.spocId && m.isSPOC);
                    if (spoc) {
                        const updatedSpocPolicies = spoc.policies.map(policy => {
                            if (policy.policyHolderType !== 'Family') return policy;
                            const newCoveredMembers = (policy.coveredMembers || []).map(cm => {
                                if ((cm.memberId && cm.memberId === oldMember.memberId) || (!cm.memberId && cm.name.toLowerCase().trim() === oldMember.name.toLowerCase().trim() && cm.dob === oldMember.dob)) {
                                    return { ...cm, name: updatedMemberData.name, dob: updatedMemberData.dob, gender: updatedMemberData.gender, email: updatedMemberData.email, mobile: updatedMemberData.mobile };
                                }
                                return cm;
                            });
                            return { ...policy, coveredMembers: newCoveredMembers };
                        });
                        membersToUpdate.push({ ...spoc, policies: updatedSpocPolicies });
                    }
                }

                const updatedMemberResult = await updateMember(updatedMemberData as Member);
                const updatedDependents = await Promise.all(membersToUpdate.map(m => updateMember(m)));

                setAllMembers(prev => {
                    const memberMap = new Map(prev.map(m => [m.id, m]));
                    memberMap.set(updatedMemberResult.id, updatedMemberResult);
                    updatedDependents.forEach(ud => memberMap.set(ud.id, ud));
                    return Array.from(memberMap.values());
                });

                setEditingMember(prev => (prev && prev.id === updatedMemberResult.id ? updatedMemberResult : prev));
                addToast("Customer updated successfully!", "success");
                if (closeModal) setIsMemberModalOpen(false);
            }
        } catch (error) {
            addToast(`Error saving customer: ${(error as Error).message}`, "error");
            setLeadToConvertId(null);
        }
    }, [addToast, currentUser, allMembers, allLeads, leadToConvertId, calculateMemberTier, customerTiers, customerTierCalculationMethod]);

    const handleRelieveMember = useCallback(async (memberToRelieveId: string) => {
        const memberToRelieve = allMembers.find(m => m.id === memberToRelieveId);
        if (!memberToRelieve || !memberToRelieve.spocId) {
            addToast("Member to relieve is not a dependent or could not be found.", "error");
            return;
        }

        const spoc = allMembers.find(m => m.sno === memberToRelieve.spocId);
        if (!spoc) {
            addToast("The primary contact (SPOC) for this family could not be found.", "error");
            return;
        }

        const updatedRelievedMemberPayload = {
            ...memberToRelieve,
            relievedTimestamp: new Date().toISOString(),
        };

        const updatedSpocPayload = {
            ...spoc,
            policies: spoc.policies.map(p => {
                if (p.policyHolderType === 'Family') {
                    return {
                        ...p,
                        coveredMembers: (p.coveredMembers || []).filter(cm => {
                            return cm.memberId !== memberToRelieve.memberId;
                        })
                    };
                }
                return p;
            })
        };

        try {
            const [updatedRelievedMemberResult, updatedSpocResult] = await Promise.all([
                updateMember(updatedRelievedMemberPayload),
                updateMember(updatedSpocPayload)
            ]);

            setAllMembers(prev => prev.map(m => {
                if (m.id === updatedRelievedMemberResult.id) return updatedRelievedMemberResult;
                if (m.id === updatedSpocResult.id) return updatedSpocResult;
                return m;
            }));

            addToast(`${memberToRelieve.name} has been relieved and can now manage their own family policies.`, 'success');

            setIsMemberModalOpen(false);
            setTimeout(() => {
                handleOpenMemberModal(updatedSpocResult, ModalTab.Family);
            }, 100);

        } catch (error) {
            addToast(`Failed to relieve member: ${(error as Error).message}`, 'error');
        }
    }, [allMembers, addToast, handleOpenMemberModal]);

    const handleCreateWithConversation = (memberData: Partial<Member>) => {
        setIsConversationalCreatorOpen(false);
        setEditingMember(memberData as Member);
        setInitialModalTab(ModalTab.BasicInfo);
        setIsMemberModalOpen(true);
    };

    const handleDeleteMember = useCallback(async (memberId: string) => {
        if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
            try {
                await deleteMember(memberId);
                setAllMembers(prev => prev.filter(m => m.id !== memberId));
                addToast('Member deleted successfully.', 'success');
            } catch (error) {
                addToast('Failed to delete member.', 'error');
            }
        }
    }, [addToast]);

    const handleToggleMemberStatus = useCallback(async (memberId: string) => {
        const member = companyMembers.find(m => m.id === memberId);
        if (member) {
            const isAttemptingToDeactivate = member.active;

            if (isAttemptingToDeactivate) {
                const hasActivePolicies = (member.policies || []).some(policy => policy.status === 'Active');

                if (hasActivePolicies) {
                    addToast("Cannot deactivate: This customer has active policies. Please set all policies to 'Inactive' first.", "error");
                    return;
                }
            }

            const updatedMember = { ...member, active: !member.active };

            await handleSaveMember(updatedMember, false);
            addToast(`Customer status has been updated to ${updatedMember.active ? 'Active' : 'Inactive'}.`, "success");
        } else {
            addToast("Could not find the specified customer to update their status.", "error");
        }
    }, [companyMembers, handleSaveMember, addToast]);

    const handleGenerateReview = useCallback(async (memberId: string) => {
        const member = companyMembers.find(m => m.id === memberId);
        if (member) {
            setEditingMember(member);
            setIsGeneratingReview(true);
            setIsAnnualReviewModalOpen(true);
            const content = await generateAnnualReview(member, upsellOpportunities, addToast);
            setReviewContent(content);
            setIsGeneratingReview(false);
        }
    }, [companyMembers, upsellOpportunities, addToast]);

    const handleFindUpsell = useCallback(async (member: Member): Promise<string | null> => {
        const newOpportunity = await generateUpsellOpportunityForMember(member, addToast);
        if (newOpportunity) {
            setUpsellOpportunities(prev => {
                const existing = prev.find(op => op.memberId === newOpportunity.memberId);
                if (existing) {
                    return prev.map(op => op.memberId === newOpportunity.memberId ? newOpportunity : op);
                }
                return [...prev, newOpportunity];
            });
            return newOpportunity.suggestions;
        } else {
            return null;
        }
    }, [addToast]);

    const handleCreateTask = useCallback((task: Omit<Task, 'id'>) => {
        const creationLog: TaskActivityLog = {
            timestamp: new Date().toISOString(),
            action: 'Created',
            details: 'Task was created.',
            by: currentUser?.id || 'system',
        };
        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...task,
            creationDateTime: new Date().toISOString(),
            isCompleted: false,
            primaryContactPerson: task.primaryContactPerson || currentUser?.id || '',
            statusId: 'ts-created',
            active: true,
            activityLog: [creationLog],
        };
        setAllTasks(prev => [...prev, newTask]);
    }, [currentUser]);

    const handleCreateBulkTask = useCallback((baseTask: Omit<Task, 'id'>, advisorIds: string[]) => {
        if (advisorIds.length === 0) {
            addToast('No advisors selected for bulk task creation.', 'error');
            return;
        }

        const creationLog: TaskActivityLog = {
            timestamp: new Date().toISOString(),
            action: 'Created',
            details: 'Task was created via bulk assignment.',
            by: currentUser?.id || 'system',
        };

        const newTasks: Task[] = advisorIds.map((advisorId, index) => ({
            id: `task-${Date.now()}-${index}`,
            ...baseTask,
            primaryContactPerson: advisorId,
            creationDateTime: new Date().toISOString(),
            isCompleted: false,
            statusId: 'ts-created',
            active: true,
            activityLog: [creationLog],
        }));

        setAllTasks(prev => [...prev, ...newTasks]);
        addToast(`Task successfully assigned to ${advisorIds.length} advisor(s).`, 'success');
    }, [addToast, currentUser]);

    const handleUpdateTask = useCallback((updatedTask: Task) => {
        setAllTasks(prevTasks => {
            const oldTask = prevTasks.find(task => task.id === updatedTask.id);
            if (!oldTask) return prevTasks;

            let newLog: TaskActivityLog | null = null;
            if (oldTask.statusId !== updatedTask.statusId) {
                const oldStatusName = oldTask.statusId === 'ts-created' ? 'Task Created' : taskStatusMasters.find(s => s.id === oldTask.statusId)?.name || 'Unknown';
                const newStatusName = taskStatusMasters.find(s => s.id === updatedTask.statusId)?.name || 'Unknown';
                newLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: `Status changed from ${oldStatusName} to ${newStatusName}.`,
                    by: currentUser?.id || 'system',
                };
            } else if (JSON.stringify(oldTask) !== JSON.stringify(updatedTask)) {
                newLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Details Updated',
                    details: 'Task details were updated.',
                    by: currentUser?.id || 'system',
                };
            }

            const taskWithLog = newLog
                ? { ...updatedTask, activityLog: [...(updatedTask.activityLog || []), newLog] }
                : updatedTask;

            return prevTasks.map(task =>
                task.id === updatedTask.id ? taskWithLog : task
            );
        });
    }, [currentUser, taskStatusMasters]);

    const handleDeleteTask = useCallback((taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setAllTasks(prev => prev.filter(t => t.id !== taskId));
            addToast('Task deleted.', 'success');
        }
    }, [addToast]);

    const handleOpenTask = useCallback((taskId: string) => {
        const initialState = taskStatusMasters.find(status => status.isInitialState);
        if (!initialState) {
            addToast("Configuration Error: No initial task state has been set in Master Data.", "error");
            return;
        }

        setAllTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId && task.statusId === 'ts-created') {
                const newLog: TaskActivityLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: `Status changed from Task Created to ${initialState.name}.`,
                    by: currentUser?.id || 'system',
                };
                return { ...task, statusId: initialState.id, activityLog: [...(task.activityLog || []), newLog] };
            }
            return task;
        }));
    }, [currentUser, taskStatusMasters, addToast]);

    const handleReassignTask = useCallback(async (taskId: string, newAdvisorId: string, reassignerId: string) => {
        const taskIndex = allTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            addToast('Task not found for reassignment.', 'error');
            return;
        }

        const oldTask = allTasks[taskIndex];
        const oldAdvisorName = allUsers.find(u => u.id === oldTask.primaryContactPerson)?.name || 'Unassigned';
        const newAdvisor = allUsers.find(u => u.id === newAdvisorId);
        if (!newAdvisor) {
            addToast('New advisor not found.', 'error');
            return;
        }
        const newAdvisorName = newAdvisor.name;

        const newLog: TaskActivityLog = {
            timestamp: new Date().toISOString(),
            action: 'Reassigned',
            details: `Task reassigned from ${oldAdvisorName} to ${newAdvisorName}.`,
            by: reassignerId,
        };

        const updatedTask = {
            ...oldTask,
            primaryContactPerson: newAdvisorId,
            originalAssigneeId: oldTask.originalAssigneeId || oldTask.primaryContactPerson,
            statusId: 'ts-created',
            activityLog: [...(oldTask.activityLog || []), newLog],
        };

        setAllTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

        const member = updatedTask.memberId ? companyMembers.find(m => m.id === updatedTask.memberId) : null;
        const lead = updatedTask.leadId ? companyLeads.find(l => l.id === updatedTask.leadId) : null;

        const newNotification: Notification = {
            id: `task-assign-${taskId}-${Date.now()}`,
            type: 'Task Assignment',
            date: new Date().toISOString(),
            message: `Task "${updatedTask.taskDescription}" has been reassigned to you.`,
            member: member ? { id: member.id, name: member.name, mobile: member.mobile } : (lead ? { id: lead.id, name: lead.name, mobile: lead.phone } : { id: '', name: 'Personal Task', mobile: '' }),
            source: 'auto'
        };
        setNotifications(prev => [newNotification, ...prev]);

        addToast(`Task successfully reassigned to ${newAdvisorName}.`, 'success');
    }, [allTasks, allUsers, companyMembers, companyLeads, addToast]);

    const handleDeleteLead = useCallback(async (leadId: string) => {
        try {
            await deleteLead(leadId);
            setAllLeads(prev => prev.filter(l => l.id !== leadId));
            addToast('Lead deleted successfully.', 'success');
        } catch (error) {
            addToast('Failed to delete lead.', 'error');
        }
    }, [addToast]);

    const handleSaveEmployee = useCallback(async (employeeData: User, closeModal: boolean = true) => {
        try {
            if (employeeData.id) {
                const updated = await updateEmployee(employeeData);
                setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                if (currentUser?.id === updated.id) setCurrentUser(updated);
                addToast("Employee updated successfully!", "success");
            } else {
                const { id, role, initials, ...createData } = employeeData;
                const created = await createEmployee(createData as Omit<User, 'id' | 'role' | 'initials'>);
                setAllUsers(prev => [...prev, created]);
                addToast("Employee created successfully!", "success");
            }
            if (closeModal) {
                setIsEmployeeModalOpen(false);
                setEditingEmployee(null);
            }
        } catch (error) {
            addToast(`Error saving employee: ${(error as Error).message}`, "error");
        }
    }, [addToast, currentUser]);

    const handleUpdatePassword = useCallback(async (current: string, newPass: string) => {
        if (!currentUser || currentUser.password !== current) {
            addToast("Current password is incorrect.", "error");
            return false;
        }
        const updatedUser = { ...currentUser, password: newPass };
        await handleSaveEmployee(updatedUser, false);
        setCurrentUser(updatedUser);
        addToast("Password updated successfully.", "success");
        return true;
    }, [currentUser, handleSaveEmployee, addToast]);

    const handleUpdateCommissionStatus = useCallback((memberId: string, policyId: string, status: 'Pending' | 'Paid' | 'Cancelled') => {
        setAllMembers(prevMembers => prevMembers.map(m => {
            if (m.id === memberId) {
                return {
                    ...m,
                    policies: m.policies.map(p => {
                        if (p.id === policyId && p.commission) {
                            const newCommission = { ...p.commission, status: status };
                            if (status === 'Paid') {
                                newCommission.paidDate = p.commission.paidDate || new Date().toISOString().split('T')[0];
                            } else {
                                delete newCommission.paidDate;
                            }
                            return { ...p, commission: newCommission };
                        }
                        return p;
                    })
                };
            }
            return m;
        }));
        addToast("Commission status updated!", "success");
    }, [addToast]);

    const handleRenewPolicy = useCallback(async (memberId: string, policyId: string) => {
        try {
            const memberIndex = allMembers.findIndex(m => m.id === memberId);
            if (memberIndex === -1) throw new Error("Member not found");

            const memberToUpdate = { ...allMembers[memberIndex] };
            const policyIndex = memberToUpdate.policies.findIndex(p => p.id === policyId);
            if (policyIndex === -1) throw new Error("Policy not found");

            const policyToUpdate = { ...memberToUpdate.policies[policyIndex] };

            const currentRenewalDate = new Date(policyToUpdate.renewalDate);

            if (policyToUpdate.policyTerm && policyToUpdate.policyTerm > 0) {
                policyToUpdate.installmentsPaid = (policyToUpdate.installmentsPaid || 0) + 1;
            }

            switch (policyToUpdate.premiumFrequency) {
                case 'Monthly':
                    currentRenewalDate.setMonth(currentRenewalDate.getMonth() + 1);
                    break;
                case 'Quarterly':
                    currentRenewalDate.setMonth(currentRenewalDate.getMonth() + 3);
                    break;
                case 'Half-Yearly':
                    currentRenewalDate.setMonth(currentRenewalDate.getMonth() + 6);
                    break;
                case 'Yearly':
                default:
                    currentRenewalDate.setFullYear(currentRenewalDate.getFullYear() + 1);
                    break;
            }

            policyToUpdate.renewalDate = currentRenewalDate.toISOString().split('T')[0];
            memberToUpdate.policies[policyIndex] = policyToUpdate;

            const updatedMember = await updateMember(memberToUpdate);

            setAllMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));

            addToast(`Policy for ${updatedMember.name} renewed successfully!`, "success");
            setActivityLog(prev => [{ id: `log-${Date.now()}`, type: 'renewalSuccess', message: `Policy ${policyId} for ${updatedMember.name} renewed.`, timestamp: new Date().toISOString(), memberId, policyId }, ...prev]);
            await handleFindUpsell(updatedMember);
            return true;
        } catch (error) {
            console.error("Renewal failed:", error);
            addToast(`Failed to renew policy: ${(error as Error).message}`, "error");
            return false;
        }
    }, [allMembers, addToast, handleFindUpsell]);


    const handleUpdateOperatingCompany = useCallback(async (companyData: Company) => {
        try {
            const updated = await updateOperatingCompany(companyData);
            setOperatingCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
            if (currentUser && currentUser.comp_id === updated.id) {
                setCurrentUser(prev => prev ? { ...prev, company: updated.name, company_logo: updated.logoUrl } : null);

                // Update favicon only
                if (updated.logoUrl) {
                    const favicon = document.getElementById('favicon') as HTMLLinkElement;
                    if (favicon) favicon.href = updated.logoUrl;
                }
            }
            addToast("Company profile updated successfully.", "success");
        } catch (error) {
            addToast(`Failed to update company profile: ${(error as Error).message}`, "error");
        }
    }, [addToast, currentUser]);

    const handleUpdateAdvisorLocation = useCallback(async (locationData: Omit<AdvisorLocation, 'advisorName'>) => {
        try {
            const updatedLocation = await updateAdvisorLocation(locationData);
            setAdvisorLocations(prev => {
                const index = prev.findIndex(l => l.advisorId === updatedLocation.advisorId);
                if (index !== -1) {
                    const newLocations = [...prev];
                    newLocations[index] = updatedLocation;
                    return newLocations;
                }
                return [...prev, updatedLocation];
            });
        } catch (error) {
            console.error("Failed to update advisor location:", error);
        }
    }, []);

    const handleCreateCheckIn = useCallback(async (checkInData: Omit<CheckIn, 'id' | 'advisorName' | 'durationMinutes' | 'checkOutTimestamp'>) => {
        try {
            const newCheckIn = await createCheckIn(checkInData);
            setCheckIns(prev => [...prev, newCheckIn]);
            setAllMembers(prev => prev.map(m => {
                if (m.id === checkInData.customerId) {
                    return { ...m, checkIns: [...(m.checkIns || []), newCheckIn] };
                }
                return m;
            }));
            setActiveCheckIn(newCheckIn);
            if (currentUser) {
                const updatedUser = { ...currentUser, profile: { ...currentUser.profile, activeCheckInId: newCheckIn.id } as EmployeeProfile };
                setCurrentUser(updatedUser);
                setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            }
        } catch (error) {
            addToast(`Failed to create check-in: ${(error as Error).message}`, "error");
        }
    }, [addToast, currentUser]);

    const handleCheckOut = useCallback(async (checkInId: string, notes: string, outcome: CheckInOutcome, nextActionDate?: string) => {
        try {
            const updatedCheckIn = await checkOut(checkInId, notes, outcome, nextActionDate);
            setCheckIns(prev => prev.map(c => c.id === updatedCheckIn.id ? updatedCheckIn : c));
            setAllMembers(prev => prev.map(m => {
                if (m.id === updatedCheckIn.customerId) {
                    return { ...m, checkIns: (m.checkIns || []).map(c => c.id === updatedCheckIn.id ? updatedCheckIn : c) };
                }
                return m;
            }));
            if (currentUser) {
                const updatedUser = { ...currentUser, profile: { ...currentUser.profile, activeCheckInId: null } as EmployeeProfile };
                setCurrentUser(updatedUser);
                setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            }
            setActiveCheckIn(null);
            addToast("Successfully checked out.", "success");
        } catch (error) {
            addToast(`Failed to check out: ${(error as Error).message}`, "error");
        }
    }, [currentUser, addToast]);

    const handleFetchAdvisorTrail = useCallback(async (advisorId: string) => {
        try {
            return await getAdvisorLocationHistory(advisorId);
        } catch (error) {
            addToast(`Failed to fetch journey for advisor: ${(error as Error).message}`, "error");
            return [];
        }
    }, [addToast]);


    const handleCreateAnyway = useCallback(async () => {
        if (!pendingDuplicateMember) return;
        try {
            const newMember = { ...pendingDuplicateMember, company: currentUser?.company || '', comp_id: currentUser?.comp_id || '', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
            const created = await createMember(newMember as Omit<Member, 'id' | 'sno'>);
            setAllMembers(prev => [...prev, created]);
            addToast("New customer created successfully despite duplicate ID.", "success");
        } catch (error) {
            addToast(`Error saving customer: ${(error as Error).message}`, "error");
        } finally {
            setIsDuplicateModalOpen(false);
            setPendingDuplicateMember(null);
            setDuplicateMatches([]);
            setIsMemberModalOpen(false);
        }
    }, [pendingDuplicateMember, currentUser, addToast]);

    const handleUpdateExistingDuplicate = useCallback(async (existingMemberId: string) => {
        if (!pendingDuplicateMember) return;
        const existingMember = allMembers.find(m => m.id === existingMemberId);
        if (!existingMember) return;

        try {
            const updatedMemberData = { ...existingMember, ...pendingDuplicateMember, id: existingMember.id };
            const updated = await updateMember(updatedMemberData);
            setAllMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
            addToast("Existing customer updated with new information.", "success");
        } catch (error) {
            addToast(`Error updating customer: ${(error as Error).message}`, "error");
        } finally {
            setIsDuplicateModalOpen(false);
            setPendingDuplicateMember(null);
            setDuplicateMatches([]);
            setIsMemberModalOpen(false);
        }
    }, [pendingDuplicateMember, allMembers, addToast]);

    const handleSaveLeadNote = useCallback(async (leadId: string, newNote: VoiceNote) => {
        const leadToUpdate = allLeads.find(l => l.id === leadId);
        if (leadToUpdate) {
            const updatedLead = {
                ...leadToUpdate,
                voiceNotes: [...(leadToUpdate.voiceNotes || []), newNote]
            };
            await updateLead(updatedLead);
            setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            addToast(`Note saved for lead "${leadToUpdate.name}".`, "success");
        }
    }, [allLeads, addToast]);

    const handleAddAutomationRule = useCallback((newRuleData: Omit<AutomationRule, 'id' | 'icon'>) => {
        const getIcon = (type: AutomationRule['type']) => {
            switch (type) {
                case 'Birthday Messages': return <GiftIcon className="text-pink-500" />;
                case 'Anniversary Messages': return <Calendar className="text-purple-500" />;
                case 'Policy Renewal Messages': return <Bell className="text-blue-500" />;
                default: return <Star className="text-yellow-500" />;
            }
        };

        const newRule: AutomationRule = {
            ...newRuleData,
            id: Math.max(0, ...automationRules.map(r => r.id)) + 1,
            icon: getIcon(newRuleData.type),
        };
        setAutomationRules(prev => [...prev, newRule]);
        addToast('New automation rule added successfully!', 'success');
    }, [automationRules, addToast]);


    const handleCreateReferrer = useCallback(async (referrerData: { name: string; mobile: string; email?: string }): Promise<Member | null> => {
        try {
            const newReferrerPayload: Omit<Member, 'id' | 'sno'> = {
                name: referrerData.name,
                mobile: referrerData.mobile,
                email: referrerData.email,
                memberId: `${(referrerData.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, '_')}${(referrerData.mobile || '').replace(/[^0-9]/g, '').slice(-7).padEnd(7, '_')}`,
                dob: '1900-01-01',
                maritalStatus: 'Single',
                country: '',
                state: '',
                city: '',
                address: '',
                memberType: 'No Tier',
                tierId: null,
                active: true,
                panCard: '',
                aadhaar: '',
                policies: [],
                voiceNotes: [],
                documents: [],
                checkIns: [],
                assignedTo: [],
                processStage: 'Initial Contact',
                company: currentUser?.company || '',
                comp_id: currentUser?.comp_id || '',
                createdBy: currentUser?.id,
                createdAt: new Date().toISOString(),
                isReferrerOnly: true,
            };
            const created = await createMember(newReferrerPayload);
            setAllMembers(prev => [...prev, created]);
            addToast(`Referrer "${created.name}" created successfully!`, 'success');
            return created;
        } catch (error) {
            addToast(`Error creating referrer: ${(error as Error).message}`, 'error');
            return null;
        }
    }, [currentUser, addToast]);

    const handleAddOpeningBalance = useCallback(async (data: Omit<OpeningBalance, 'id' | 'createdAt'>) => {
        if (!currentUser) return;
        try {
            const created = await createOpeningBalance(data);
            setOpeningBalances(prev => [...prev, created]);
            addToast('Opening balance added successfully!', 'success');
        } catch (error) {
            addToast(`Failed to add opening balance: ${(error as Error).message}`, 'error');
        }
    }, [addToast, currentUser]);

    const handleUpdateOpeningBalance = useCallback(async (data: OpeningBalance) => {
        try {
            const updated = await updateOpeningBalance(data);
            setOpeningBalances(prev => prev.map(ob => ob.id === updated.id ? updated : ob));
            addToast('Opening balance updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update opening balance: ${(error as Error).message}`, 'error');
        }
    }, [addToast]);

    const handleDeleteOpeningBalance = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this opening balance record?')) {
            try {
                await deleteOpeningBalance(id);
                setOpeningBalances(prev => prev.filter(ob => ob.id !== id));
                addToast('Opening balance deleted successfully.', 'success');
            } catch (error) {
                addToast(`Failed to delete opening balance: ${(error as Error).message}`, 'error');
            }
        }
    }, [addToast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading...</p>

                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {isForgotPasswordModalOpen && (
                <ForgotPasswordModal
                    isOpen={isForgotPasswordModalOpen}
                    onClose={() => setIsForgotPasswordModalOpen(false)}
                    users={allUsers}
                    onResetPassword={async (company, employeeId, newPassword) => {
                        const user = allUsers.find(u => u.employeeId.toLowerCase() === employeeId.toLowerCase() && u.company === company);
                        if (user) {
                            await handleSaveEmployee({ ...user, password: newPassword });
                            return true;
                        }
                        return false;
                    }}
                    addToast={addToast}
                    operatingCompanies={operatingCompanies}
                    initialCompany={forgotPasswordCompany}
                    initialEmployeeId={forgotPasswordEmployeeId}
                />
            )}

            {!currentUser ? (
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} onForgotPassword={handleOpenForgotPassword} theme={theme} toggleTheme={toggleTheme} allBranches={allBranches} operatingCompanies={operatingCompanies} roles={roles} />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            ) : (
                <div className={`h-screen flex overflow-hidden ${theme}`}>
                    <Sidebar
                        isSidebarOpen={isSidebarOpen}
                        setIsSidebarOpen={setIsSidebarOpen}
                        onLogout={handleLogout}
                        user={currentUser}
                        permissions={currentUserPermissions}
                        onHoverChange={setIsSidebarExpanded}
                    />

                    {/* 
                        LAYOUT PUSH LOGIC:
                        1. md:ml-20: Default width (80px) when sidebar is collapsed.
                        2. md:ml-72: Expanded width (288px) when sidebar is hovered/expanded.
                        3. transition-all: Smoothly animates the margin change.
                    */}
                    <main
                        className={`flex-1 bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'md:ml-72' : 'md:ml-20'
                            }`}
                    >

                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 flex justify-between items-center border-b dark:border-gray-800 flex-shrink-0">
                            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <Menu size={24} />
                            </button>
                            <div className="flex-1 font-bold text-gray-800 dark:text-white pl-4">{currentUser?.company}</div>
                            <div className="flex items-center gap-4">
                                <div className="relative" ref={notificationDropdownRef}>
                                    <button onClick={() => setIsNotificationDropdownOpen(p => !p)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors relative">
                                        <Bell size={20} />
                                        {undismissedNotifications.length > 0 && !dropdownCleared && (
                                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-100 dark:ring-gray-900" />
                                        )}
                                    </button>
                                    {isNotificationDropdownOpen && (
                                        <NotificationDropdown
                                            notifications={undismissedNotifications}
                                            isCleared={dropdownCleared}
                                            onViewAll={() => {
                                                setIsNotificationDropdownOpen(false);
                                                navigate('/actionHub');
                                            }}
                                            onClearAll={handleClearDropdown}
                                            onDismissItem={handleDismissItem}
                                        />
                                    )}
                                </div>
                                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" />} />
                                <Route path="/dashboard" element={<Dashboard {...{ members: companyMembers, leads: companyLeads, notifications, upsellOpportunities, onOpenModal: handleOpenMemberModal, onOpenLeadModal: handleOpenLeadModal, currentUser, users: companyUsers, dismissedFocusItems, onDismissFocusItem: handleDismissFocusItem, allTasks, onUpdateTask: handleUpdateTask, onDeleteTask: handleDeleteTask, todaysFocusItems, isFocusLoading, focusError, onRefreshFocus: fetchTodaysFocus, customerTiers, onViewTier: handleViewTier, taskStatusMasters, addToast, designations, permissions: currentUserPermissions, roles, leadSources, attendance }} />} />
                                <Route path="/customers" element={<MemberDashboard {...{ members: companyMembers, allMembers, currentUser, users: companyUsers, onEditMember: handleOpenMemberModal, onCreateMember: () => handleOpenMemberModal(null), onConversationalCreate: () => setIsConversationalCreatorOpen(true), onDeleteMember: handleDeleteMember, onToggleStatus: handleToggleMemberStatus, onGenerateReview: handleGenerateReview, addToast, Branches: companyBranches, designations, permissions: currentUserPermissions, roles }} />} />
                                <Route path="/policies" element={<PolicyManager {...{ members: companyMembers, onRenewPolicy: handleRenewPolicy, onViewMember: handleOpenMemberModal, addToast, users: companyUsers, Branches: companyBranches, insuranceTypes, designations, permissions: currentUserPermissions, roles }} />} />
                                <Route path="/mutualFunds" element={<MutualFunds {...{ allMembers: companyMembers, onUpdateMember: (member) => handleSaveMember(member, false), amcs, schemes: mutualFundSchemes, addToast, onViewMember: onViewMember, permissions: currentUserPermissions }} />} />
                                <Route path="/pipeline" element={<SalesPipeline {...{ leads: leadsForPipeline, users: companyUsers, onOpenLeadModal: handleOpenLeadModal, onUpdateLead: async (lead) => { if (!currentUser) return; const oldLead = allLeads.find(l => l.id === lead.id); if (!oldLead) return; const newLogs = generateLeadActivityLog(oldLead, lead, currentUser.id); const updatedLeadData = { ...lead, lastUpdatedAt: new Date().toISOString(), activityLog: [...(oldLead.activityLog || []), ...newLogs] }; const updated = await updateLead(updatedLeadData); setAllLeads(prev => prev.map(l => l.id === updated.id ? updated : l)); addToast("Lead updated.", "success"); }, onConvertLead: handleConvertLead, leadSources, onDeleteLead: handleDeleteLead, Branches: companyBranches, insuranceTypes, addToast, permissions: currentUserPermissions, designations, roles, leadStageMasters }} />} />
                                <Route path="/notes" element={<NotesPage {...{ members: companyMembers, leads: companyLeads, onSaveMember: handleSaveMember, onSaveLeadNote: handleSaveLeadNote, onCreateTask: (task) => handleCreateTask(task), addToast, currentUser, users: companyUsers, Branches: companyBranches, designations, permissions: currentUserPermissions, roles }} />} />
                                <Route path="/location" element={<LocationServices members={companyMembers} addToast={addToast} currentUser={currentUser} allUsers={companyUsers} onUpdateAdvisorLocation={handleUpdateAdvisorLocation} onCreateCheckIn={handleCreateCheckIn} advisorLocations={advisorLocations} checkIns={checkIns} onFetchAdvisorTrail={handleFetchAdvisorTrail} activeCheckIn={activeCheckIn} onCheckOut={handleCheckOut} onGetActiveCheckIn={getActiveCheckIn} designations={designations} roles={roles} />} />
                                <Route path="/chatbot" element={<Chatbot members={companyMembers} leads={companyLeads} tasks={allTasks} expenses={expenses} manualIncomes={manualIncomes} manualCommissions={manualCommissions} addToast={addToast} />} />
                                <Route path="/profile" element={currentUser?.roleId && roles.find(r => r.id === currentUser.roleId)?.name.toLowerCase().includes('admin') ? <AdminProfile {...{ user: currentUser, users: companyUsers, allMembers: companyMembers, onOpenEmployeeModal: () => handleOpenEmployeeModal(null), onUpdateProfile: handleSaveEmployee, addToast, designations, permissions: currentUserPermissions, roles }} /> : <ProfilePage {...{ user: currentUser, onUpdateProfile: handleSaveEmployee, onUpdatePassword: handleUpdatePassword, addToast, allMembers: companyMembers, users: companyUsers, geographies, onUpdateGeographies: handleUpdateGeographies, bankMasters, designations, permissions: currentUserPermissions, genders, accountTypes, roles }} />} />
                                <Route path="/employees" element={<EmployeeManagement {...{ users: companyUsers, allMembers: companyMembers, onOpenEmployeeModal: handleOpenEmployeeModal, onToggleStatus: async (userId) => { const user = allUsers.find(u => u.id === userId); if (user) { const newStatus = user.profile?.status === 'Active' ? 'Inactive' : 'Active'; await handleSaveEmployee({ ...user, profile: { ...user.profile, status: newStatus } as EmployeeProfile }); } }, attendance, onUpdateAttendance: handleUpdateAttendanceByAdmin, Branches: companyBranches, addToast, designations, permissions: currentUserPermissions, roles }} />} />
                                <Route path="/servicesHub" element={<ServicesHub addToast={addToast} allMembers={companyMembers} onViewMember={handleOpenMemberModal} onUpdateCommissionStatus={handleUpdateCommissionStatus} currentUser={currentUser} designations={designations} />} />
                                <Route path="/actionHub" element={<ActionAutomationHub {...{ notifications: hubNotifications, onRenewPolicy: handleRenewPolicy, activityLog: hubActivityLog, addToast, onNotificationSent: () => { }, appointments: hubAppointments, tasks: hubTasks, onDismissItem: handleDismissItem, savedGreetingUrl: null, setSavedGreetingUrl: () => { }, upsellOpportunities, onDismissOpportunity: (id) => setUpsellOpportunities(prev => prev.filter(o => o.id !== id)), members: companyMembers, onScheduleMessage: (msg) => { setCustomMessages(prev => [...prev, { ...msg, id: `cm-${Date.now()}` }]); addToast('Custom message scheduled!', 'success'); }, onClearAll: handleClearActionHubNotifications, onScheduleAppointment: (appt) => { const member = companyMembers.find(m => m.id === appt.memberId); if (member) { setAppointments(prev => [...prev, { ...appt, id: `appt-${Date.now()}`, memberName: member.name }]); addToast('Appointment scheduled!', 'success'); } }, rules: automationRules, onUpdateRule: (rule) => setAutomationRules(prev => prev.map(r => r.id === rule.id ? rule : r)), onAddRule: handleAddAutomationRule, docTemplates, onUpdateTemplates: setDocTemplates, currentUser, users: companyUsers, onViewMember: onViewMember, permissions: currentUserPermissions, occasionTypeMasters, onUpdateOccasionTypeMasters: handleUpdateOccasionTypeMasters, roles }} />} />

                                <Route path="/masterData/*" element={<MasterData allTasks={[]} {...{
                                    addToast, allMembers: companyMembers, allLeads: companyLeads, users: companyUsers,
                                    customerFieldMasters, onUpdateCustomerFieldMasters: handleUpdateCustomerFieldMasters,
                                    businessVerticals, onUpdateBusinessVerticals: handleUpdateBusinessVerticals,
                                    leadSources, onUpdateLeadSources: handleUpdateLeadSources,
                                    schemes, onUpdateSchemes: handleUpdateSchemes,
                                    agencies, onUpdateAgencies: handleUpdateAgencies,
                                    operatingCompanies, onUpdateOperatingCompanies: handleUpdateOperatingCompany,
                                    Branches: allBranches, onUpdateBranches: handleUpdateBranches,
                                    CompanyInfo, onUpdateCompanyInfo: setCompanyInfo,
                                    geographies, onUpdateGeographies: handleUpdateGeographies,
                                    relationshipTypes, onUpdateRelationshipTypes: handleUpdateRelationshipTypes,
                                    documentMasters, onUpdateDocumentMasters: handleUpdateDocumentMasters,
                                    insuranceTypeDocumentRules, onUpdateInsuranceTypeDocumentRules: handleUpdateInsuranceTypeDocumentRules,
                                    giftMasters, onUpdateGiftMasters: handleUpdateGiftMasters,
                                    customerTiers, onUpdateCustomerTiers: handleUpdateCustomerTiers,
                                    taskStatuses: taskStatusMasters, onUpdateTaskStatuses: handleUpdateTaskStatusMasters,
                                    customerCategories, onUpdateCustomerCategories: handleUpdateCustomerCategories,
                                    bankMasters, onUpdateBankMasters: handleUpdateBankMasters,
                                    customerSubCategories, onUpdateCustomerSubCategories: handleUpdateCustomerSubCategories,
                                    customerGroups, onUpdateCustomerGroups: handleUpdateCustomerGroups,
                                    taskMasters, onUpdateTaskMasters: handleUpdateTaskMasters,
                                    insuranceTypes, onUpdateInsuranceTypes: handleUpdateInsuranceTypes,
                                    insuranceFields, onUpdateInsuranceFields: handleUpdateInsuranceFields,
                                    routes, onUpdateRoutes: handleUpdateRoutes,
                                    designations, onUpdateDesignations: handleUpdateDesignations,
                                    currentUser,
                                    customerTierCalculationMethod, onUpdateCustomerTierCalculationMethod: handleUpdateAllMemberTiers,

                                    accountCategories: accountCategories, onUpdateAccountCategories: handleUpdateAccountCategories,
                                    accountSubCategories: accountSubCategories, onUpdateAccountSubCategories: handleUpdateAccountSubCategories,
                                    accountHeads: accountHeads, onUpdateAccountHeads: handleUpdateAccountHeads,

                                    religions, onUpdateReligions: handleUpdateReligions,
                                    festivals, onUpdateFestivals: handleUpdateFestivals,
                                    festivalDates, onUpdateFestivalDates: handleUpdateFestivalDates,
                                    amcs, onUpdateAmcs: handleUpdateAmcs,
                                    mutualFundSchemes, onUpdateMutualFundSchemes: handleUpdateMutualFundSchemes,
                                    mutualFundFields, onUpdateMutualFundFields: handleUpdateMutualFundFields,
                                    rolePermissions, onUpdateRolePermissions: handleUpdateRolePermissions,
                                    genders, onUpdateGenders: handleUpdateGenders,
                                    maritalStatuses, onUpdateMaritalStatuses: handleUpdateMaritalStatuses,
                                    customerTypes, onUpdateCustomerTypes: handleUpdateCustomerTypes,
                                    processStageMasters, onUpdateProcessStageMasters: handleUpdateProcessStageMasters,
                                    accountTypes: accountTypes, onUpdateAccountTypes: handleUpdateAccountTypes,
                                    financialYears, onUpdateFinancialYears: handleUpdateFinancialYears,
                                    documentNumbering, onUpdateDocumentNumbering: handleUpdateDocumentNumbering,
                                    activeFinancialYearId, roles, onUpdateRoles: handleUpdateRoles,
                                    leadStageMasters, onUpdateLeadStageMasters: handleUpdateLeadStageMasters
                                }} />} />

                                <Route path="/reports-insights" element={<ReportsAndInsights members={companyMembers} users={companyUsers} tasks={allTasks} attendance={attendance} onUpdateAttendance={handleUpdateAttendanceByAdmin} addToast={addToast} allLeads={companyLeads} currentUser={currentUser} leadSources={leadSources} schemes={schemes} insuranceTypes={insuranceTypes} onOpenAttendanceReport={() => setIsAttendanceReportModalOpen(true)} designations={designations} roles={roles} permissions={currentUserPermissions} agencies={agencies} mutualFundSchemes={mutualFundSchemes} amcs={amcs} taskStatuses={taskStatusMasters} />} />
                                <Route path="/taskManagement" element={<TaskManagement allTasks={allTasks} permissions={currentUserPermissions} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onCreateTask={handleCreateTask} onCreateBulkTask={handleCreateBulkTask} onOpenTask={handleOpenTask} users={companyUsers} members={companyMembers} leads={companyLeads} taskStatusMasters={taskStatusMasters} taskMasters={taskMasters} addToast={addToast} currentUser={currentUser} Branches={companyBranches} onReassignTask={handleReassignTask} onUpdateTaskWithRemark={handleUpdateTask} designations={designations} roles={roles} />} />

                                <Route path="/incomeAndExpense" element={<IncomeAndExpense
                                    allMembers={companyMembers}
                                    users={companyUsers}
                                    bankMasters={bankMasters}
                                    expenses={expenses}
                                    manualIncomes={manualIncomes}
                                    manualCommissions={manualCommissions}
                                    manualReceipts={manualReceipts}
                                    onSaveReceipt={handleSaveReceipt}
                                    onDeleteManualReceipt={handleDeleteManualReceipt}

                                    accountCategories={accountCategories}
                                    accountSubCategories={accountSubCategories}
                                    accountHeads={accountHeads}

                                    onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={handleDeleteExpense} onDeleteVoucher={handleDeleteVoucher}
                                    onAddManualIncome={handleAddManualIncome} onUpdateManualIncome={handleUpdateManualIncome} onDeleteManualIncome={handleDeleteManualIncome}
                                    onAddManualCommission={handleAddManualCommission} onUpdateManualCommission={handleUpdateManualCommission} onDeleteManualCommission={handleDeleteManualCommission}
                                    currentUser={currentUser} companyInfo={operatingCompanies.find(c => c.id === currentUser?.comp_id) || null} branches={companyBranches}
                                    onSaveVoucher={handleSaveVoucherDetails}
                                    permissions={currentUserPermissions}
                                    activeFinancialYearId={activeFinancialYearId}
                                    financialYears={financialYears}
                                    trueCurrentFinancialYear={trueCurrentFinancialYear}
                                    currentVoucherDocNumbering={documentNumbering.find(dn => dn.finYearId === trueCurrentFinancialYear?.id && dn.type === 'Voucher') || null}
                                    currentReceiptDocNumbering={documentNumbering.find(dn => dn.finYearId === trueCurrentFinancialYear?.id && dn.type === 'Receipt') || null}
                                    lastVoucherNumber={lastVoucherNumber}
                                    lastReceiptNumber={lastReceiptNumber}
                                />} />

                                <Route path="/accounts" element={
                                    <Accounts
                                        expenses={expenses}
                                        manualReceipts={manualReceipts}
                                        allMembers={companyMembers}
                                        users={companyUsers}

                                        accountCategories={accountCategories}
                                        accountSubCategories={accountSubCategories}
                                        accountHeads={accountHeads}

                                        bankMasters={bankMasters}
                                        openingBalances={openingBalances}
                                        onAddOpeningBalance={handleAddOpeningBalance}
                                        onUpdateOpeningBalance={handleUpdateOpeningBalance}
                                        onDeleteOpeningBalance={handleDeleteOpeningBalance}
                                        canCreate={currentUserPermissions.incomeAndExpense === 'create' || currentUserPermissions.incomeAndExpense === 'modify'}
                                        canModify={currentUserPermissions.incomeAndExpense === 'modify'}
                                        canCreateNew={!!trueCurrentFinancialYear && activeFinancialYearId === trueCurrentFinancialYear?.id}
                                        creationDisabledReason={""}
                                        trueCurrentFinancialYear={trueCurrentFinancialYear}
                                    />
                                } />

                                <Route path="/calendar" element={<FestivalCalendar allMembers={companyMembers} festivals={festivals} festivalDates={festivalDates} religions={religions} onViewMember={onViewMember} />} />
                                <Route path="/advancedReports" element={
                                    <AdvancedReports
                                        members={companyMembers}
                                        users={companyUsers}
                                        branches={companyBranches}
                                        leadSources={leadSources}
                                        customerCategories={customerCategories}
                                        customerSubCategories={customerSubCategories}
                                        customerGroups={customerGroups}
                                        religions={religions}
                                        genders={genders}
                                        customerTiers={customerTiers}
                                        businessVerticals={businessVerticals}
                                        schemes={schemes}
                                        agencies={agencies}
                                        maritalStatuses={maritalStatuses}
                                        processStageMasters={processStageMasters}
                                        insuranceTypes={insuranceTypes}
                                        amcs={amcs}
                                        mutualFundSchemes={mutualFundSchemes}
                                        allLeads={allLeads}
                                    />
                                } />
                                <Route path="/CrossSelling" element={
                                    <CrossSellingDashboard
                                        members={companyMembers}
                                        insuranceTypes={insuranceTypes}
                                        addToast={addToast}
                                        users={companyUsers}
                                        branches={companyBranches}
                                        roles={roles}
                                        onCreateLead={handleCreateLeadFromUpsell}
                                        onBulkCreateLeads={handleBulkCreateLeads}
                                        businessVerticals={businessVerticals}
                                        geographies={geographies}
                                        customerCategories={customerCategories}
                                        customerSubCategories={customerSubCategories}
                                        customerGroups={customerGroups}
                                        customerTypes={customerTypes}
                                        genders={genders}
                                        leadSources={leadSources}
                                    />
                                } />

                                <Route path="/campaign" element={
                                    <CampaignExecution
                                        members={companyMembers}
                                        geographies={geographies}
                                        businessVerticals={businessVerticals}
                                        relationshipTypes={relationshipTypes}
                                        leadSources={leadSources}
                                        insuranceTypes={insuranceTypes}
                                        customerCategories={customerCategories}
                                        customerSubCategories={customerSubCategories}
                                        customerGroups={customerGroups}
                                        religions={religions}
                                        maritalStatuses={maritalStatuses}
                                        amcs={amcs}
                                        schemes={schemes}
                                        mutualFundSchemes={mutualFundSchemes}
                                        agencies={agencies}
                                        addToast={addToast}
                                    />
                                } />

                                <Route path="*" element={<div>Not Implemented</div>} />
                            </Routes>
                        </div>
                    </main>

                    {/* Modals */}
                    {isAttendanceModalOpen && currentUser && (
                        <AttendanceModal
                            isOpen={isAttendanceModalOpen}
                            onClose={() => setIsAttendanceModalOpen(false)}
                            onMarkAttendance={handleMarkAttendance}
                            advisorName={currentUser.name}
                        />
                    )}
                    {isViewByTierModalOpen && viewingTier && (
                        <ViewByTierModal
                            isOpen={isViewByTierModalOpen}
                            onClose={() => setViewingTier(null)}
                            tier={viewingTier}
                            allMembers={companyMembers}
                            allTiers={customerTiers}
                            calculationMethod={customerTierCalculationMethod}
                            onViewMember={onViewMember}
                            users={companyUsers}
                        />
                    )}
                    {isAttendanceReportModalOpen && (
                        <AttendanceReportModal
                            isOpen={isAttendanceReportModalOpen}
                            onClose={() => setIsAttendanceReportModalOpen(false)}
                            attendance={attendance}
                            users={companyUsers}
                            designations={designations}
                            roles={roles}
                        />
                    )}
                    {isMemberModalOpen && (
                        <MemberModal
                            isOpen={isMemberModalOpen}
                            onClose={() => setIsMemberModalOpen(false)}
                            member={editingMember}
                            initialTab={initialModalTab}
                            onSave={handleSaveMember}
                            onCreateDependentMember={handleCreateDependentMember}
                            addToast={addToast}
                            onCreateTask={(task) => handleCreateTask(task)}
                            onRelieveMember={handleRelieveMember}
                            currentUser={currentUser}
                            users={companyUsers}
                            routes={routes}
                            onUpdateRoutes={handleUpdateRoutes}
                            processFlow={processStageMasters}
                            onGenerateProposal={(member, policy) => { setProposalContext({ member, policy }); setIsProposalModalOpen(true); }}
                            onFindUpsell={handleFindUpsell}
                            allMembers={allMembers}
                            schemes={schemes}
                            companies={agenciesAsCompanies}
                            documentMasters={documentMasters}
                            insuranceTypeDocumentRules={insuranceTypeDocumentRules}
                            relationshipTypes={relationshipTypes}
                            leadSources={leadSources}
                            geographies={geographies}
                            onUpdateGeographies={handleUpdateGeographies}
                            bankMasters={bankMasters}
                            customerCategories={customerCategories}
                            customerSubCategories={customerSubCategories}
                            customerGroups={customerGroups}
                            allTasks={allTasks}
                            taskStatusMasters={taskStatusMasters}
                            taskMasters={taskMasters}
                            insuranceTypes={insuranceTypes}
                            insuranceFields={insuranceFields}
                            onUpdateInsuranceFields={handleUpdateInsuranceFields}
                            customerFieldMasters={customerFieldMasters}
                            onUpdateCustomerFieldMasters={handleUpdateCustomerFieldMasters}
                            onCreateReferrer={handleCreateReferrer}
                            Branches={companyBranches}
                            religions={religions}
                            onAddDocumentMaster={handleAddDocumentMaster}
                            amcs={amcs}
                            mutualFundSchemes={mutualFundSchemes}
                            mutualFundFields={mutualFundFields}
                            designations={designations}
                            permissions={currentUserPermissions}
                            genders={genders}
                            maritalStatuses={maritalStatuses}
                            accountTypes={accountTypes}
                            roles={roles}
                            occasionTypeMasters={occasionTypeMasters}
                            onUpdateOccasionTypeMasters={handleUpdateOccasionTypeMasters}
                        />
                    )}
                    {isEmployeeModalOpen && (
                        <EmployeeModal
                            isOpen={isEmployeeModalOpen}
                            onClose={() => setIsEmployeeModalOpen(false)}
                            employee={editingEmployee}
                            onSave={handleSaveEmployee}
                            addToast={addToast}
                            allMembers={companyMembers}
                            users={companyUsers}
                            Branches={companyBranches}
                            currentUser={currentUser}
                            geographies={geographies}
                            onUpdateGeographies={handleUpdateGeographies}
                            bankMasters={bankMasters}
                            businessVerticals={businessVerticals}
                            insuranceTypes={insuranceTypes}
                            amcs={amcs}
                            designations={designations}
                            genders={genders}
                            documentMasters={documentMasters}
                            accountTypes={accountTypes}
                            roles={roles}
                        />
                    )}
                    {isLeadModalOpen && currentUser && (
                        <LeadModal
                            isOpen={isLeadModalOpen}
                            onClose={() => setIsLeadModalOpen(false)}
                            lead={editingLead}
                            onSave={async (leadData) => {
                                if (!currentUser) return;
                                const isNew = !leadData.id;
                                try {
                                    if (isNew) {
                                        const createdAt = new Date().toISOString();
                                        const newLeadData = {
                                            ...leadData,
                                            createdBy: currentUser.id,
                                            lastUpdatedAt: createdAt,
                                            activityLog: [{
                                                timestamp: createdAt,
                                                action: 'Created' as const,
                                                details: 'Lead was created.',
                                                by: currentUser.id,
                                            }]
                                        };
                                        const created = await createLead(newLeadData as Omit<Lead, 'id' | 'createdAt' | 'company' | 'comp_id'>, currentUser.comp_id);
                                        setAllLeads(prev => [...prev, created]);
                                        addToast("Lead created successfully!", "success");
                                    } else {
                                        const oldLead = allLeads.find(l => l.id === leadData.id);
                                        if (!oldLead) throw new Error("Could not find original lead to update.");
                                        const newLogs = generateLeadActivityLog(oldLead, leadData, currentUser.id);
                                        const updatedLeadData = {
                                            ...leadData,
                                            lastUpdatedAt: new Date().toISOString(),
                                            activityLog: [...(oldLead.activityLog || []), ...newLogs]
                                        };
                                        const updated = await updateLead(updatedLeadData as Lead);
                                        setAllLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
                                        addToast("Lead updated successfully!", "success");
                                    }
                                } catch (error) {
                                    addToast(`Error saving lead: ${(error as Error).message}`, "error");
                                } finally {
                                    setIsLeadModalOpen(false);
                                }
                            }}
                            addToast={addToast}
                            currentUser={currentUser}
                            users={companyUsers}
                            leadSources={leadSources}
                            Branches={companyBranches}
                            insuranceTypes={insuranceTypes}
                            allMembers={companyMembers}
                            onCreateReferrer={handleCreateReferrer}
                            permissions={currentUserPermissions}
                            roles={roles}
                            leadStageMasters={leadStageMasters}
                            existingMember={upsellContext?.member}
                            initialInsuranceType={upsellContext?.insuranceType}
                        />
                    )}
                    {isAnnualReviewModalOpen && (
                        <AnnualReviewModal
                            isOpen={isAnnualReviewModalOpen}
                            onClose={() => setIsAnnualReviewModalOpen(false)}
                            member={editingMember}
                            isLoading={isGeneratingReview}
                            reviewContent={reviewContent}
                            setReviewContent={setReviewContent}
                            addToast={addToast}
                            permissions={currentUserPermissions}
                        />
                    )}
                    {isProposalModalOpen && proposalContext && currentUser && (
                        <ProposalGeneratorModal
                            isOpen={isProposalModalOpen}
                            onClose={() => setIsProposalModalOpen(false)}
                            member={proposalContext.member}
                            policy={proposalContext.policy}
                            advisorName={currentUser.name}
                            templates={docTemplates}
                            onSave={handleSaveMember}
                            addToast={addToast}
                            permissions={currentUserPermissions}
                        />
                    )}
                    {isConversationalCreatorOpen && (
                        <ConversationalCreatorModal
                            isOpen={isConversationalCreatorOpen}
                            onClose={() => setIsConversationalCreatorOpen(false)}
                            onComplete={handleCreateWithConversation}
                            addToast={addToast}
                        />
                    )}
                    {isDuplicateModalOpen && (
                        <DuplicateMemberModal
                            isOpen={isDuplicateModalOpen}
                            onClose={() => setIsDuplicateModalOpen(false)}
                            duplicates={duplicateMatches}
                            pendingMember={pendingDuplicateMember}
                            onCreateNew={handleCreateAnyway}
                            onUpdateExisting={handleUpdateExistingDuplicate}
                            addToast={addToast}
                        />
                    )}
                    {isCustomerExistsModalOpen && pendingConversionLead && (
                        <Modal isOpen={isCustomerExistsModalOpen} onClose={() => setIsCustomerExistsModalOpen(false)}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 text-brand-dark dark:text-white mb-4">
                                    <AlertCircle className="w-8 h-8 text-blue-500" />
                                    <h3 className="text-xl font-bold">Customer Already Exists</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    The lead <strong>{pendingConversionLead.name}</strong> originated from an existing customer (CrossSelling).
                                    Do you want to update the existing customer's profile with the new policy?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <Button variant="secondary" onClick={() => setIsCustomerExistsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleUpdateExistingCustomerFromLead}>
                                        Update Customer
                                    </Button>
                                </div>
                            </div>
                        </Modal>
                    )}
                </div>
            )}
        </>
    );
};
export default App;