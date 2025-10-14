import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
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
import CommissionDashboard from './components/CommissionDashboard.tsx';
import SalesPipeline from './components/SalesPipeline.tsx';
import LeadModal from './components/LeadModal.tsx';
import { ActionAutomationHub } from './components/ActionAutomationHub.tsx';
import { ProposalGeneratorModal } from './components/ProposalGeneratorModal.tsx';
import NotesPage from './components/NotesPage.tsx';
import EmployeeManagement from './components/EmployeeManagement.tsx';
import { EmployeeModal } from './components/EmployeeModal.tsx';
import LandingPage from './components/LandingPage.tsx';
import Login from './components/Login.tsx';
import MutualFunds from './components/MutualFunds.tsx';
import AgentAppointments from './components/AgentAppointments.tsx';
import { MasterData } from './components/MasterData.tsx';
import { TaskManagement } from './components/TaskManagement.tsx';
import Button from './components/ui/Button.tsx';
import ProfitAndLoss from './components/ProfitAndLoss.tsx';
import FestivalCalendar from './components/FestivalCalendar.tsx';
import { VoucherSaveData } from './components/PaymentVoucherModal.tsx';
import AdvancedReports from './components/AdvancedReports.tsx';
import UpsellingDashboard from './components/UpsellingDashboard.tsx';

// MODIFIED: Removed ProcessStage, added ProcessStageMaster
import {
    Member, ToastData, ActivityLog, Appointment, Task, UpsellOpportunity, AutomationRule, CustomScheduledMessage, ModalTab,
    Lead, User, Policy, Route as RouteType, DocTemplate, EmployeeProfile, Tab, GiftMapping, BusinessVertical,
    SchemeMaster, Company, FinRootsBranch, Geography, RelationshipType, DocumentMaster, SchemeDocumentMapping, GiftMaster, TaskStatusMaster, CustomerCategory,
    Notification, BankMaster, FinRootsCompanyInfo, CustomerSubCategory, CustomerGroup, TaskMaster, TodaysFocusItem, PolicyChecklistMaster,
    InsuranceTypeMaster, InsuranceFieldMaster, LeadActivityLog, VoiceNote, TaskActivityLog,
    LeadSource, LeadSourceMaster, CoveredMember, Designation, DesignationPermissions,
    CustomerTier,
    Expense, ManualIncome, ManualCommission,
    Religion, Festival, FestivalDate,
    IncomeCategoryLevel1, IncomeCategoryLevel2,
    ExpenseCategoryLevel1, ExpenseCategoryLevel2, ExpenseCategoryLevel3,
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
    ProcessStageMaster 
} from './types.ts';
// MODIFIED: Added getProcessStageMasters and updateProcessStageMasters
import { 
    getMembers, createMember, updateMember, deleteMember, getLeads, createLead, updateLead, deleteLead, 
    getUsers, getRoutes, updateRoute, createEmployee, updateEmployee, getOperatingCompanies, 
    updateOperatingCompany, getFinrootsBranches, getDesignations, getDesignationPermissions, 
    updateDesignationPermissions, getReligions, getFestivals, getFestivalDates, getRelationshipTypes, updateRelationshipTypes, getAdvisorLocations, 
    getCheckIns, updateAdvisorLocation, createCheckIn, getAdvisorLocationHistory, checkOut, 
    getActiveCheckIn, getUpsellCategories,
    getGenders, getMaritalStatuses, getCustomerTypes, getCustomerTiers,
    getProcessStageMasters, updateProcessStageMasters
} from './services/apiService.ts';
import { getPolicySuggestions, generateAnnualReview, generateUpsellOpportunityForMember, generateTodaysFocus } from './services/geminiService.ts';
import { indianStates } from './constants.tsx';
import ToastContainer from './components/ui/Toast.tsx';
import { Shield, Bell, Loader2, Menu, Sun, Moon, ArrowUp, Gift as GiftIcon, Calendar, Star, BarChart2, TrendingUp, Users as UsersIcon, CheckCircle, Clock, Percent, Workflow, X, Plus, Save, Edit2, Trash2, Building, MapPin, Briefcase, FileText as FileTextIcon, ListTodo, CheckSquare, BarChart3, TrendingDown, Map as MapIcon, Donut, IndianRupee, Zap, GripVertical, ArrowDown, Search } from 'lucide-react';
import NotificationDropdown from './components/NotificationDropdown.tsx';
import DuplicateMemberModal from './components/DuplicateMemberModal.tsx';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.tsx';
import { ViewByBranchModal } from './components/ViewByBranchModal.tsx';
import { AttendanceModal } from './components/AttendanceModal.tsx';
import { ViewByTierModal } from './components/ViewByTierModal.tsx';
import Modal from './components/ui/Modal.tsx';
import Input from './components/ui/Input.tsx';
import SearchableSelect from './components/ui/SearchableSelect.tsx';


type Theme = 'light' | 'dark';
type TierCalculationMethod = 'sumAssured' | 'premium';

const AttendanceReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    attendance: AttendanceState;
    users: User[];
    designations: Designation[];
}> = ({ isOpen, onClose, attendance, users, designations }) => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const modalRef = useRef<HTMLDivElement>(null);

    const [startDate, setStartDate] = useState(last7Days.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedAdvisor, setSelectedAdvisor] = useState('all');

    const advisors = useMemo(() => {
        const advisorDesignationIds = new Set(designations.filter(d => d.isAdvisor).map(d => d.id));
        return users.filter(u => advisorDesignationIds.has(u.designationId));
    }, [users, designations]);
    
    useEffect(() => {
        if (!isOpen) return;

        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }

            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };
        
        firstElement?.focus();

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    const reportData = useMemo(() => {
        let flattenedData: (AttendanceRecord & { userId: string, userName: string })[] = [];
        
        for (const userId in attendance) {
            const user = advisors.find(u => u.id === userId);
            if (user) {
                attendance[userId].forEach(record => {
                    flattenedData.push({ ...record, userId, userName: user.name });
                });
            }
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = flattenedData.filter(record => {
            const recordDate = new Date(record.timestamp);
            const dateMatch = recordDate >= start && recordDate <= end;
            const advisorMatch = selectedAdvisor === 'all' || record.userId === selectedAdvisor;
            return dateMatch && advisorMatch;
        });

        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [attendance, advisors, startDate, endDate, selectedAdvisor]);

    const setDateRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div ref={modalRef}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-brand-dark dark:text-white">Attendance Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review historical attendance records for all employees.</p>
                </div>
                <div className="p-6 border-y dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        <SearchableSelect
                            label="Filter by Employee"
                            options={[{value: 'all', label: 'All Employees'}, ...advisors.map(a => ({ value: a.id, label: a.name }))]}
                            value={selectedAdvisor}
                            onChange={setSelectedAdvisor}
                        />
                        <div className="flex items-center gap-2">
                            <Button variant="light" size="small" onClick={() => setDateRange(0)}>Today</Button>
                            <Button variant="light" size="small" onClick={() => setDateRange(7)}>7 Days</Button>
                            <Button variant="light" size="small" onClick={() => setDateRange(30)}>30 Days</Button>
                        </div>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Employee Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Reason for Absence</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.map((record, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(record.timestamp).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{record.userName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record.reason || 'N/A'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{new Date(record.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {reportData.length === 0 && <p className="text-center py-8 text-gray-500">No records found for the selected filters.</p>}
                    </div>
                </div>
                <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};


const generateLeadActivityLog = (oldLead: Partial<Lead>, newLead: Partial<Lead>, userId: string): LeadActivityLog[] => {
    const logs: LeadActivityLog[] = [];
    const timestamp = new Date().toISOString();

    if (oldLead.status !== newLead.status) {
        logs.push({
            timestamp,
            action: 'Status Change',
            details: `Status changed from '${oldLead.status || 'None'}' to '${newLead.status}'.`,
            by: userId,
        });
    }

     if (oldLead.notes !== newLead.notes && newLead.notes) {
        logs.push({
            timestamp,
            action: 'Note Added',
            details: `A new note was added.`,
            by: userId,
        });
    }

    const detailsChanged = (
        oldLead.name !== newLead.name ||
        oldLead.phone !== newLead.phone ||
        oldLead.email !== newLead.email ||
        oldLead.estimatedValue !== newLead.estimatedValue ||
        oldLead.assignedTo !== newLead.assignedTo
    );

    if (detailsChanged && !logs.some(log => log.action === 'Status Change')) {
         logs.push({
            timestamp,
            action: 'Details Updated',
            details: `Lead details were updated.`,
            by: userId,
        });
    }

    return logs;
};


const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700/50">
                <p className="font-bold text-gray-800 dark:text-white mb-1">{label}</p>
                {payload.map((p: any, i: number) => {
                    const value = typeof p.value === 'number'
                        ? p.name.toLowerCase().includes('premium') || p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('profit')
                            ? `₹${p.value.toLocaleString('en-IN')}`
                            : p.value.toLocaleString()
                        : p.value;
                    return (
                        <p key={i} style={{ color: p.color || p.fill }} className="text-sm font-medium">{`${p.name}: ${value}`}</p>
                    )
                })}
            </div>
        );
    }
    return null;
};


const ServicesHub: React.FC<{
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    onViewMember: (member: Member, initialTab?: ModalTab) => void;
    onUpdateCommissionStatus: (memberId: string, policyId: string, status: 'Pending' | 'Paid' | 'Cancelled') => void;
    currentUser: User | null;
    designations: Designation[];
}> = (props) => {
    type Service = 'commissions' | 'agentAppointments';
    const [activeService, setActiveService] = useState<Service>('commissions');
    
    const currentUserDesignation = useMemo(() => props.designations.find(d => d.id === props.currentUser?.designationId), [props.currentUser, props.designations]);
    const canViewCommissions = currentUserDesignation?.name === 'Admin';

    const serviceComponents: Record<Service, React.ReactNode> = {
        commissions: <CommissionDashboard members={props.allMembers} onViewMember={props.onViewMember} onUpdateCommissionStatus={props.onUpdateCommissionStatus} />,
        agentAppointments: <AgentAppointments />,
    };

    const navItems = [
        ...(canViewCommissions ? [{ id: 'commissions', label: 'Commissions', icon: <Percent size={20} /> }] : []),
        { id: 'agentAppointments', label: 'Agent Appointments', icon: <Calendar size={20} /> },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Services Hub</h2>
                <nav className="space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveService(item.id as Service)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
                                activeService === item.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1">
                {serviceComponents[activeService]}
            </div>
        </div>
    );
};


const SchemeConversionReports: React.FC<{
    members: Member[];
    leads: Lead[];
    schemes: SchemeMaster[];
    insuranceTypes: InsuranceTypeMaster[];
}> = ({ members, leads, schemes, insuranceTypes }) => {
    const [topSchemesView, setTopSchemesView] = useState<'chart' | 'table'>('chart');

    const schemeInfoMap = useMemo(() => new Map(schemes.map(s => [s.id, { name: s.name, type: s.type, insuranceTypeId: s.insuranceTypeId }])), [schemes]);
    const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

    const getParentInsuranceType = useCallback((typeId: string | null | undefined): InsuranceTypeMaster | null => {
        if (!typeId) return null;
        let current = insuranceTypeMap.get(typeId);
        if (!current) return null;
        while (current.parentId && insuranceTypeMap.has(current.parentId)) {
            current = insuranceTypeMap.get(current.parentId);
        }
        return current;
    }, [insuranceTypeMap]);

    const schemeAnalysis = useMemo(() => {
        const schemeMap = new Map<string, { count: number; premium: number; type: string }>();
        const typeCounts = new Map<string, number>();
        
        const parentTypes = insuranceTypes.filter(it => !it.parentId && it.active);
        parentTypes.forEach(pt => typeCounts.set(pt.name, 0));

        members.forEach(member => member.policies.forEach(policy => {
            const schemeInfo = schemeInfoMap.get(policy.schemeId || '');
            const parentType = getParentInsuranceType(schemeInfo?.insuranceTypeId);
            
            if (!parentType) return;

            const policyTypeForReport = parentType.name;
            const schemeName = schemeInfo?.name || 'Unspecified';
            
            const currentScheme = schemeMap.get(schemeName) || { count: 0, premium: 0, type: policyTypeForReport };
            currentScheme.count += 1;
            currentScheme.premium += policy.premium;
            schemeMap.set(schemeName, currentScheme);

            typeCounts.set(policyTypeForReport, (typeCounts.get(policyTypeForReport) || 0) + 1);
        }));

        const allSchemes = Array.from(schemeMap.entries()).map(([name, data]) => ({ name, ...data }));
        const totalPremium = allSchemes.reduce((sum, s) => sum + s.premium, 0);

        return {
            allSchemes: allSchemes.sort((a, b) => b.premium - a.premium),
            topByPremium: [...allSchemes].sort((a,b) => b.premium - a.premium).slice(0, 5),
            topByCount: [...allSchemes].sort((a,b) => b.count - a.count).slice(0, 5),
            typeDistribution: Array.from(typeCounts.entries()).map(([name, value]) => ({ name, value })),
            totalPolicies: members.reduce((sum, m) => sum + m.policies.length, 0),
            totalPremium,
            mostPopular: allSchemes.length > 0 ? [...allSchemes].sort((a,b) => b.premium - a.premium)[0].name : 'N/A',
        };
    }, [members, schemeInfoMap, getParentInsuranceType, insuranceTypes]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#84cc16', '#a855f7'];
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

    const StatCard = ({ title, value, icon, subtext = '' }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string }) => (<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300">{icon}</div><div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p></div></div>{subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}</div>);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Premium" value={`₹${schemeAnalysis.totalPremium.toLocaleString('en-IN')}`} icon={<IndianRupee size={20} />} />
                <StatCard title="Total Policies Sold" value={schemeAnalysis.totalPolicies} icon={<FileTextIcon size={20} />} />
                <StatCard title="Most Popular Scheme" value={schemeAnalysis.mostPopular} subtext="(by premium)" icon={<Star size={20} />} />
                <StatCard title="Policy Types" value={schemeAnalysis.typeDistribution.length} icon={<Donut size={20} />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold text-center mb-4 text-gray-800 dark:text-white">Policy Type Distribution</h4><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={schemeAnalysis.typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label>{schemeAnalysis.typeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Top 5 Schemes by Premium</h4>
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
                            <button onClick={() => setTopSchemesView('chart')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${topSchemesView === 'chart' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Chart</button>
                            <button onClick={() => setTopSchemesView('table')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${topSchemesView === 'table' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Table</button>
                        </div>
                    </div>
                     {topSchemesView === 'chart' ? (
                        <ResponsiveContainer width="100%" height={250}><BarChart data={schemeAnalysis.topByPremium} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fill: tickColor, fontSize: 12 }} /><YAxis dataKey="name" type="category" tick={{ fill: tickColor, fontSize: 12 }} width={100} /><Tooltip content={<CustomTooltip />} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}/><Bar dataKey="premium" name="Total Premium" fill="#3B82F6" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                     ) : (
                         <div className="overflow-x-auto max-h-[250px]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Scheme Name</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Policies Sold</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {schemeAnalysis.topByPremium.map(s => (
                                        <tr key={s.name}>
                                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{s.count}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold mb-4 text-gray-800 dark:text-white">All Schemes Data</h4><div className="overflow-x-auto max-h-80"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm"><thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr><th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Scheme Name</th><th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Policy Type</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Policies Sold</th><th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{schemeAnalysis.allSchemes.map(s=>(<tr key={s.name}><td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td><td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.type}</td><td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{s.count}</td><td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td></tr>))}</tbody></table></div></div>
        </div>
    );
};


const BusinessTrendsReports: React.FC<{ members: Member[] }> = ({ members }) => {
    const abcData = useMemo(() => { const schemePremiums = new Map<string, number>(); members.forEach(m => m.policies.forEach(p => { const name = p.schemeName || 'Unspecified'; schemePremiums.set(name, (schemePremiums.get(name) || 0) + p.premium); })); const totalPremium = Array.from(schemePremiums.values()).reduce((sum, p) => sum + p, 0); const sortedSchemes = Array.from(schemePremiums.entries()).map(([name, premium]) => ({ name, premium, percentage: totalPremium > 0 ? (premium / totalPremium) * 100 : 0 })).sort((a, b) => b.premium - a.premium); const categories: {A: any[], B: any[], C: any[]} = { A: [], B: [], C: [] }; let cumulativePercentage = 0; sortedSchemes.forEach(scheme => { cumulativePercentage += scheme.percentage; if (cumulativePercentage <= 80) categories.A.push(scheme); else if (cumulativePercentage <= 95) categories.B.push(scheme); else categories.C.push(scheme); }); return categories; }, [members]);

    const pnlData = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = Array(6).fill(0).map((_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return { name: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}'`, revenue: 0, profit: 0 } });
        members.forEach(m => m.policies.forEach(p => {
            data[5].revenue += p.premium;
            if (p.commission && p.commission.status === 'Paid') {
                data[5].profit += p.commission.amount;
            }
        }));
        for (let i = 4; i >= 0; i--) { data[i].revenue = Math.round(data[i+1].revenue * (0.8 + Math.random() * 0.2)); data[i].profit = Math.round(data[i].revenue * (0.1 + Math.random() * 0.05)); }
        return data;
    }, [members]);

    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'; const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

    return (
        <div className="space-y-8 animate-fade-in">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Business Trend Analysis</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"><h4 className="font-semibold mb-4 text-gray-800 dark:text-white">Profit & Loss Trend</h4><ResponsiveContainer width="100%" height={300}><AreaChart data={pnlData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} /><YAxis tick={{ fill: tickColor, fontSize: 12 }} /><Tooltip content={<CustomTooltip />} /><Legend /><Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Revenue"/><Area type="monotone" dataKey="profit" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Profit"/></AreaChart></ResponsiveContainer></div>
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">ABC Analysis (by Premium)</h3>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scheme Name</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400 uppercase">Total Premium</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {abcData.A.map(s => (
                                <tr key={`A-${s.name}`}>
                                    <td className="px-4 py-2 font-bold text-green-600">A</td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {abcData.B.map(s => (
                                <tr key={`B-${s.name}`}>
                                    <td className="px-4 py-2 font-bold text-yellow-600">B</td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {abcData.C.map(s => (
                                <tr key={`C-${s.name}`}>
                                    <td className="px-4 py-2 font-bold text-red-600">C</td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-800 dark:text-white">₹{s.premium.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const LeadAnalyticsReports: React.FC<{ members: Member[]; leadSources: LeadSourceMaster[] }> = ({ members, leadSources }) => {
    const leadSourceAnalysis = useMemo(() => {
        const sourceMap = new Map<string, { count: number; members: { name: string; memberType: Member['memberType']; totalPremium: number, fullSource: string }[] }>();
        const leadSourceMap = new Map(leadSources.map(ls => [ls.id, ls]));
        const memberMap = new Map(members.map(m => [m.id, m.name]));

        const getRootSource = (sourceId: string): LeadSourceMaster | null => {
            let current = leadSourceMap.get(sourceId);
            if (!current) return null;
            while (current.parentId && leadSourceMap.has(current.parentId)) {
                current = leadSourceMap.get(current.parentId)!;
            }
            return current;
        };

        const getFullSourcePath = (sourceId: string): string => {
            const path: string[] = [];
            let current = leadSourceMap.get(sourceId);
            while (current) {
                path.unshift(current.name);
                current = current.parentId ? leadSourceMap.get(current.parentId) : undefined;
            }
            return path.join(' > ');
        };

        members.forEach(member => {
            if (!member.leadSource?.sourceId) {
                 const current = sourceMap.get('Unknown') || { count: 0, members: [] };
                 current.count++;
                 current.members.push({ name: member.name, memberType: member.memberType, totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0), fullSource: 'Unknown' });
                 sourceMap.set('Unknown', current);
                 return;
            }

            const rootSource = getRootSource(member.leadSource.sourceId);
            const sourceName = rootSource ? rootSource.name : 'Unknown';

            let fullSource = getFullSourcePath(member.leadSource.sourceId);
            let detailText = member.leadSource?.detail;

            if (member.referrerId) {
                const referrerName = memberMap.get(member.referrerId);
                if (referrerName) {
                    detailText = referrerName;
                }
            }

            if(detailText) fullSource += ` - ${detailText}`;

            const current = sourceMap.get(sourceName) || { count: 0, members: [] };
            current.count++;
            current.members.push({
                name: member.name,
                memberType: member.memberType,
                totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0),
                fullSource: fullSource
            });
            sourceMap.set(sourceName, current);
        });

        const distribution = Array.from(sourceMap.entries())
            .map(([name, data]) => ({ name, value: data.count, members: data.members }))
            .sort((a, b) => b.value - a.value);

        const allMembersBySource = Array.from(sourceMap.entries()).flatMap(([source, data]) => data.members.map(m => ({ ...m, source })));

        return { distribution, allMembersBySource };
    }, [members, leadSources]);

    const [sourceFilter, setSourceFilter] = useState('All');

    const filteredMembersBySource = useMemo(() => {
        if (sourceFilter === 'All') {
            return leadSourceAnalysis.allMembersBySource;
        }
        return leadSourceAnalysis.allMembersBySource.filter(m => m.source === sourceFilter);
    }, [sourceFilter, leadSourceAnalysis.allMembersBySource]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F43F5E', '#14B8A6'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <h4 className="font-semibold text-center mb-4 text-gray-800 dark:text-white">Lead Source Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={leadSourceAnalysis.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                return ( <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold"> {`${(percent * 100).toFixed(0)}%`} </text> );
                            }}>
                                {leadSourceAnalysis.distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Customer Details by Lead Source</h4>
                        <div className="flex items-center gap-2">
                            <label htmlFor="source-filter" className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter:</label>
                            <select
                                id="source-filter"
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-800 dark:text-white focus:ring-blue-600 focus:border-blue-600 py-1"
                            >
                                <option value="All">All Sources</option>
                                {leadSourceAnalysis.distribution.map(source => (
                                    <option key={source.name} value={source.name}>{source.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Customer Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Lead Source</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total Premium</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredMembersBySource.map((m, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{m.name}</td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{m.fullSource}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-white">₹{m.totalPremium.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};



const StaffPerformance: React.FC<{
    members: Member[];
    users: User[];
    tasks: Task[];
    attendance: AttendanceState;
    onUpdateAttendance: (userId: string, status: 'Present' | 'Absent', reason?: string) => void;
    allLeads: Lead[];
    currentUser: User | null;
    onOpenAttendanceReport: () => void;
    designations: Designation[];
}> = ({ members, users, tasks, attendance, onUpdateAttendance, allLeads, currentUser, onOpenAttendanceReport, designations }) => {
    const advisors = useMemo(() => {
        const advisorDesignationIds = new Set(designations.filter(d => d.isAdvisor).map(d => d.id));
        return users.filter(u => advisorDesignationIds.has(u.designationId));
    }, [users, designations]);

    const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
    const designationMap = useMemo(() => new Map(designations.map(d => [d.id, d.name])), [designations]);
    const isAdmin = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin', [currentUser, designations]);
    const isCurrentUserAdvisor = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.isAdvisor, [currentUser, designations]);

    const employeeStats = useMemo(() => {
        const employeeData = users.map(user => {
            const assignedCustomers = members.filter(m => m.assignedTo.includes(user.id));
            const assignedLeads = allLeads.filter(l => l.assignedTo === user.id);
            const convertedLeads = assignedCustomers.filter(m => m.leadSource).length;

            return {
                ...user,
                createdCustomers: members.filter(m => m.createdBy === user.id).length,
                pendingTasks: tasks.filter(t => t.primaryContactPerson === user.id && !t.isCompleted).length,
                totalPremium: assignedCustomers.reduce((sum, m) => sum + m.policies.reduce((pSum, p) => pSum + p.premium, 0), 0),
                conversionRate: assignedLeads.length > 0 ? ((convertedLeads / assignedLeads.length) * 100).toFixed(1) : '0.0',
            }
        });

        if (!isAdmin && isCurrentUserAdvisor) {
             return employeeData.filter(emp => emp.id === currentUser?.id);
        }
        return employeeData;
    }, [users, members, tasks, allLeads, currentUser, designations, isAdmin, isCurrentUserAdvisor]);

    return (
         <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Staff Performance & Attendance</h3>
                 {isAdmin && (
                      <Button onClick={onOpenAttendanceReport} variant="secondary" size="small">
                          <BarChart3 size={14} /> View Attendance Report
                      </Button>
                  )}
              </div>
              <div className="overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Employee</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Attendance</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Premium (Ann.)</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Conversion</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Pending Tasks</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {employeeStats.map(emp => {
                            const today = new Date().toISOString().split('T')[0];
                            const todaysRecord = attendance[emp.id]?.slice().reverse().find(rec => rec.timestamp.startsWith(today));
                            const isDesignationAdvisor = designations.find(d => d.id === emp.designationId)?.isAdvisor;

                            return (
                            <tr key={emp.id}>
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                    {emp.name}
                                    <p className="text-xs text-gray-500">{designationMap.get(emp.designationId) || emp.role}</p>
                                </td>
                                <td className="px-4 py-2">
                                    {editingAttendanceId === emp.id ? (
                                         <div className="flex gap-2">
                                             <Button size="small" variant="success" onClick={() => { onUpdateAttendance(emp.id, 'Present'); setEditingAttendanceId(null); }}>P</Button>
                                             <Button size="small" variant="danger" onClick={() => { onUpdateAttendance(emp.id, 'Absent', 'Admin Override'); setEditingAttendanceId(null); }}>A</Button>
                                             <Button size="small" variant="light" onClick={() => setEditingAttendanceId(null)}><X size={12} /></Button>
                                         </div>
                                    ) : todaysRecord ? (
                                        <div className="flex items-center gap-2">
                                            {todaysRecord.status === 'Present' ? (
                                                <span className="text-green-600 font-semibold">Present</span>
                                            ) : (
                                                <span className="text-red-600 font-semibold">
                                                    Absent
                                                    {todaysRecord.reason && ` - ${todaysRecord.reason}`}
                                                </span>
                                            )}
                                            {isAdmin && <Button size="small" variant="light" className="!p-1" onClick={() => setEditingAttendanceId(emp.id)}><Edit2 size={12}/></Button>}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 italic">Not Marked</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{isDesignationAdvisor ? `₹${emp.totalPremium.toLocaleString('en-IN')}` : 'N/A'}</td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{isDesignationAdvisor ? `${emp.conversionRate}%` : 'N/A'}</td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{emp.pendingTasks}</td>
                            </tr>
                            )
                        })}
                    </tbody>
                </table>
              </div>
        </div>
    );
};
// --- REBUILT COMPONENT: ReportsAndInsights ---
const ReportsAndInsights: React.FC<{
    members: Member[];
    users: User[];
    tasks: Task[];
    attendance: AttendanceState;
    onUpdateAttendance: (userId: string, status: 'Present' | 'Absent', reason?: string) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allLeads: Lead[];
    currentUser: User | null;
    leadSources: LeadSourceMaster[];
    schemes: SchemeMaster[];
    insuranceTypes: InsuranceTypeMaster[]; // NEW PROP
    onOpenAttendanceReport: () => void;
    designations: Designation[]; // ADDED
}> = ({ members, users, tasks, attendance, onUpdateAttendance, addToast, allLeads, currentUser, leadSources, schemes, insuranceTypes, onOpenAttendanceReport, designations }) => {
    type ReportTab = 'staff' | 'schemes' | 'trends' | 'leadAnalytics';
    const [activeReportTab, setActiveReportTab] = useState<ReportTab>('schemes');
    const isAdmin = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin', [currentUser, designations]);

    const ReportTabButton = ({ label, isActive, onClick }: {label: string, isActive: boolean, onClick: () => void}) => (
        <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>{label}</button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <ReportTabButton label="Staff Performance" isActive={activeReportTab === 'staff'} onClick={() => setActiveReportTab('staff')} />
                    <ReportTabButton label="Scheme Conversion" isActive={activeReportTab === 'schemes'} onClick={() => setActiveReportTab('schemes')} />
                    <ReportTabButton label="Lead Analytics" isActive={activeReportTab === 'leadAnalytics'} onClick={() => setActiveReportTab('leadAnalytics')} />
                    {isAdmin && <ReportTabButton label="Business Trends" isActive={activeReportTab === 'trends'} onClick={() => setActiveReportTab('trends')} />}
                </div>
            </div>
            {activeReportTab === 'staff' && <StaffPerformance {...{ members, users, tasks, attendance, onUpdateAttendance, allLeads, currentUser, onOpenAttendanceReport, designations }} />}
            {activeReportTab === 'schemes' && <SchemeConversionReports members={members} leads={allLeads} schemes={schemes} insuranceTypes={insuranceTypes} />}
            {activeReportTab === 'leadAnalytics' && <LeadAnalyticsReports members={members} leadSources={leadSources} />}
            {activeReportTab === 'trends' && isAdmin && <BusinessTrendsReports members={members} />}
        </div>
    );
};


const initialAutomationRules: AutomationRule[] = [
    {
        id: 1,
        type: 'Birthday Messages',
        timing: { value: 0, unit: 'days', relation: 'before' }, // Represents "On the day"
        enabled: true,
        template: 'Happy Birthday {name}! Wishing you a wonderful year ahead. Thank you for being our valued customer.',
        channels: ['whatsapp', 'sms'],
        icon: <GiftIcon className="text-pink-500" />
    },
    {
        id: 2,
        type: 'Anniversary Messages',
        timing: { value: 0, unit: 'days', relation: 'before' }, // Represents "On the day"
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
        type: 'Special Occasion Messages',
        timing: { value: 0, unit: 'days', relation: 'before' },
        enabled: true,
        template: 'Hi {name}, thinking of you on this special day: {occasionName}! Wishing you all the best.',
        channels: ['whatsapp'],
        icon: <Star className="text-yellow-500" />
    },
];

// MODIFIED: This array is now removed, as its data is managed by processStageMasters
// const initialProcessFlow: ProcessStage[] = [ ... ];

const initialDocTemplates: DocTemplate[] = [
    { id: 'tpl-1', name: 'Life Insurance Proposal', content: `Dear {clientName},\n\nThank you for your interest...` },
    { id: 'tpl-2', name: 'Health Plan Comparison', content: `Hi {clientName},\n\nAs requested, here is a summary...` }
];


// --- MASTER DATA INITIAL STATE ---
const generateInitialGeographies = (): Geography[] => {
    const geographies: Geography[] = [];
    let idCounter = 1;
    const countryId = `geo-${idCounter++}`;
    geographies.push({ id: countryId, name: 'India', type: 'Country', parentId: null, active: true });
    for (const stateName in indianStates) {
        const stateId = `geo-${idCounter++}`;
        geographies.push({ id: stateId, name: stateName, type: 'State', parentId: countryId, active: true });
        const districts = indianStates[stateName];
        for (const districtName of districts) {
            const districtId = `geo-${idCounter++}`;
            geographies.push({ id: districtId, name: districtName, type: 'District', parentId: stateId, active: true });
        }
    }
    return geographies;
};

const initialFinrootsCompanyInfo: FinRootsCompanyInfo = {
    name: 'FinRoots Marketing LLP',
    hq: 'Erode, Tamil Nadu',
    cin: 'U74999TZ2023LLP012345',
    incorporationDate: '2023-04-01',
};
const initialBankMasters: BankMaster[] = [
    {
        id: 'bank-1',
        bankCode: 'SBI001',
        bankName: 'State Bank of India',
        branchName: 'Erode Main Branch',
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
        branchName: 'Perundurai Road Branch',
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

const initialBusinessVerticals: BusinessVertical[] = [ { id: 'bv-1', name: 'Insurance', active: true, order: 0 }, { id: 'bv-2', name: 'Mutual Funds', active: true, order: 1 }, { id: 'bv-3', name: 'Agent Appointments (SA)', active: true, order: 2 }, ];
const initialLeadSources: LeadSourceMaster[] = [
    { id: 'ls-adv', name: 'Advertisement', parentId: null, active: true, order: 0 },
    { id: 'ls-dm', name: 'Digital Media', parentId: 'ls-adv', active: true, order: 0 },
    { id: 'ls-fb', name: 'Facebook', parentId: 'ls-dm', active: true, order: 0 },
    { id: 'ls-ig', name: 'Instagram', parentId: 'ls-dm', active: true, order: 1 },
    { id: 'ls-pm', name: 'Print Media', parentId: 'ls-adv', active: true, order: 1 },
    { id: 'ls-cc', name: 'Cold Call', parentId: null, active: true, order: 1 },
    { id: 'ls-ec', name: 'Existing Client', parentId: null, active: true, order: 2 },
    { id: 'ls-inst', name: 'Institution', parentId: null, active: true, order: 3 },
    { id: 'ls-bni', name: 'BNI', parentId: 'ls-inst', active: true, order: 0 },
    { id: 'ls-lions', name: 'Lions', parentId: 'ls-inst', active: true, order: 1 },
    { id: 'ls-rotary', name: 'Rotary', parentId: 'ls-inst', active: true, order: 2 },
    { id: 'ls-of', name: 'Other Forum', parentId: null, active: true, order: 4 },
    { id: 'ls-ref', name: 'Referral', parentId: null, active: true, order: 5 },
    { id: 'ls-friend', name: 'Friend', parentId: 'ls-ref', active: true, order: 0 },
    { id: 'ls-other', name: 'Other', parentId: 'ls-ref', active: true, order: 1 },
    { id: 'ls-relative', name: 'Relative', parentId: 'ls-ref', active: true, order: 2 },
    { id: 'ls-staff', name: 'Staff', parentId: null, active: true, order: 6 },
    { id: 'ls-self', name: 'Self Generated', parentId: null, active: true, order: 7 },
    { id: 'ls-web', name: 'Website', parentId: null, active: true, order: 8 },
];
// --- FIX: This list now ONLY contains external agencies. ---
const initialAgencies: Company[] = [
    {id: 'comp-max-life', companyCode: 'MAXLIFE', name: 'Max Life Insurance', active: true},
    {id: 'comp-lic', companyCode: 'LIC', name: 'Life Insurance Corporation (LIC)', active: true},
    {id: 'comp-hdfc-life', companyCode: 'HDFCLIFE', name: 'HDFC Life', active: true},
    {id: 'comp-icici-pru', companyCode: 'ICICIPRU', name: 'ICICI Prudential Life Insurance', active: true},
    {id: 'comp-star', companyCode: 'STARHEALTH', name: 'Star Health & Allied Insurance', active: true},
    {id: 'comp-niva-bupa', companyCode: 'NIVABUPA', name: 'Niva Bupa', active: true},
    {id: 'comp-hdfc-ergo', companyCode: 'HDFCERGO', name: 'HDFC ERGO Health', active: true},
    {id: 'comp-care-health', companyCode: 'CAREHEALTH', name: 'Care Health Insurance', active: true},
    {id: 'comp-icici-lombard', companyCode: 'ICICILOMBARD', name: 'ICICI Lombard', active: true},
    {id: 'comp-bajaj', companyCode: 'BAJAJALLIANZ', name: 'Bajaj Allianz General Insurance', active: true},
    {id: 'comp-tata-aig', companyCode: 'TATAAIG', name: 'Tata AIG General Insurance', active: true},
    {id: 'comp-nia', companyCode: 'NIA', name: 'New India Assurance', active: true},
    {id: 'comp-oriental', companyCode: 'ORIENTAL', name: 'Oriental Insurance', active: true},
    {id: 'comp-united', companyCode: 'UNITEDINDIA', name: 'United India Insurance', active: true}
];
// REFACTORED: initialSchemes now uses insuranceTypeId
const initialSchemes: SchemeMaster[] = [
    // --- Life Insurance ---
    {id: 'sch-1', name: 'Smart Secure Plus Plan', type: 'Life Insurance', companyId: 'comp-max-life', active: true, order: 0, insuranceTypeId: 'it-term'},
    {id: 'sch-2', name: 'Jeevan Anand', type: 'Life Insurance', companyId: 'comp-lic', active: true, order: 1, insuranceTypeId: 'it-endowment'},
    {id: 'sch-3', name: 'Click 2 Protect Super', type: 'Life Insurance', companyId: 'comp-hdfc-life', active: true, order: 2, insuranceTypeId: 'it-term'},
    {id: 'sch-4', name: 'iProtect Smart', type: 'Life Insurance', companyId: 'comp-icici-pru', active: true, order: 3, insuranceTypeId: 'it-term'},
    {id: 'sch-lic-jeevan-lakshya', name: 'Jeevan Lakshya', type: 'Life Insurance', companyId: 'comp-lic', active: true, order: 4, insuranceTypeId: 'it-endowment'},
    {id: 'sch-lic-siip', name: 'SIIP', type: 'Life Insurance', companyId: 'comp-lic', active: true, order: 5, insuranceTypeId: 'it-ulip'},
    {id: 'sch-max-life-sspp', name: 'Smart Secure Plus Plan', type: 'Life Insurance', companyId: 'comp-max-life', active: true, order: 6, insuranceTypeId: 'it-whole'},
    {id: 'sch-hdfc-sanchay', name: 'Sanchay Plus', type: 'Life Insurance', companyId: 'comp-hdfc-life', active: true, order: 7, insuranceTypeId: 'it-endowment'},

    // --- Health Insurance ---
    {id: 'sch-5', name: 'Comprehensive Health Plan', type: 'Health Insurance', companyId: 'comp-star', active: true, order: 0, insuranceTypeId: 'it-individual-health'},
    {id: 'sch-6', name: 'ReAssure 2.0', type: 'Health Insurance', companyId: 'comp-niva-bupa', active: true, order: 1, insuranceTypeId: 'it-family-floater'},
    {id: 'sch-7', name: 'Optima Secure', type: 'Health Insurance', companyId: 'comp-hdfc-ergo', active: true, order: 2, insuranceTypeId: 'it-family-floater'},
    {id: 'sch-8', name: 'Care Supreme', type: 'Health Insurance', companyId: 'comp-care-health', active: true, order: 3, insuranceTypeId: 'it-individual-health'},
    {id: 'sch-star-family-delite', name: 'Family Health Optima Insurance Plan', type: 'Health Insurance', companyId: 'comp-star', active: true, order: 4, insuranceTypeId: 'it-family-floater'},
    {id: 'sch-star-women-care', name: 'Women Care Insurance Policy', type: 'Health Insurance', companyId: 'comp-star', active: true, order: 5, insuranceTypeId: 'it-maternity'},
    {id: 'sch-care-plus', name: 'Care Plus', type: 'Health Insurance', companyId: 'comp-care-health', active: true, order: 6, insuranceTypeId: 'it-critical-illness'},
    {id: 'sch-niva-bupa-aspire', name: 'Health Aspire', type: 'Health Insurance', companyId: 'comp-niva-bupa', active: true, order: 7, insuranceTypeId: 'it-senior-citizen'},

    // --- General Insurance: Motor ---
    {id: 'sch-9', name: 'Drive Smart', type: 'General Insurance', companyId: 'comp-bajaj', active: true, order: 0, insuranceTypeId: 'it-motor'},
    {id: 'sch-10', name: 'AutoSecure', type: 'General Insurance', companyId: 'comp-tata-aig', active: true, order: 1, insuranceTypeId: 'it-motor'},
    {id: 'sch-lombard-car', name: 'Car Insurance', type: 'General Insurance', companyId: 'comp-icici-lombard', active: true, order: 2, insuranceTypeId: 'it-motor'},
    {id: 'sch-nia-motor', name: 'Private Car Package Policy', type: 'General Insurance', companyId: 'comp-nia', active: true, order: 3, insuranceTypeId: 'it-motor'},

    // --- General Insurance: Others ---
    {id: 'sch-united-home', name: 'Unihome Care Policy', type: 'General Insurance', companyId: 'comp-united', active: true, order: 0, insuranceTypeId: 'it-home'},
    {id: 'sch-oriental-travel', name: 'Overseas Mediclaim Policy', type: 'General Insurance', companyId: 'comp-oriental', active: true, order: 0, insuranceTypeId: 'it-travel'},
    {id: 'sch-tata-aig-pa', name: 'Accident Guard', type: 'General Insurance', companyId: 'comp-tata-aig', active: true, order: 0, insuranceTypeId: 'it-pa'},
    {id: 'sch-icici-travel', name: 'Travel Insurance', type: 'General Insurance', companyId: 'comp-icici-lombard', active: true, order: 1, insuranceTypeId: 'it-travel'},
    {id: 'sch-bajaj-home', name: 'My Home Insurance', type: 'General Insurance', companyId: 'comp-bajaj', active: true, order: 1, insuranceTypeId: 'it-home'},
];
const initialDocumentMasters: DocumentMaster[] = [ {id:'doc-1', name: 'PAN Card', active: true, order: 0}, {id:'doc-2', name: 'Aadhaar Card', active: true, order: 1}, {id:'doc-3', name: 'Passport', active: true, order: 2}, {id:'doc-4', name: 'Driving License', active: true, order: 3}, {id:'doc-5', name: 'Bank Statement', active: true, order: 4}, ];
const initialGiftMasters: GiftMaster[] = [ {id:'gift-1', name: 'Premium Pen Set', active: true, order: 0}, {id:'gift-2', name: 'Leather Wallet', active: true, order: 1}, {id:'gift-3', name: 'Amazon Gift Card ₹500', active: true, order: 2}, {id:'gift-4', name: 'Custom Diary 2024', active: true, order: 3}, ];
const initialTaskStatusMasters: TaskStatusMaster[] = [
    {id:'ts-6', name: 'Assigned', active: true, order: 0},
    {id:'ts-1', name: 'Pending', active: true, order: 1},
    {id:'ts-5', name: 'Viewed', active: true, order: 2},
    {id:'ts-2', name: 'In Progress', active: true, order: 3},
    {id:'ts-3', name: 'Completed', active: true, order: 4},
    {id:'ts-4', name: 'Cancelled', active: true, order: 5},
];
const initialCustomerCategories: CustomerCategory[] = [ {id:'cc-1', name: 'Salaried', active: true, order: 0}, {id:'cc-2', name: 'Business', active: true, order: 1}, {id:'cc-3', name: 'Professional', active: true, order: 2}, ];
const initialCustomerSubCategories: CustomerSubCategory[] = [
    { id: 'csc-1', name: 'IT/Software', parentId: 'cc-1', active: true, order: 0 },
    { id: 'csc-2', name: 'Government', parentId: 'cc-1', active: true, order: 1 },
    { id: 'csc-3', name: 'Manufacturing', parentId: 'cc-2', active: true, order: 0 },
    { id: 'csc-4', name: 'Trading', parentId: 'cc-2', active: true, order: 1 },
    { id: 'csc-5', name: 'Doctor', parentId: 'cc-3', active: true, order: 0 },
    { id: 'csc-6', name: 'Lawyer', parentId: 'cc-3', active: true, order: 1 },
];
const initialCustomerGroups: CustomerGroup[] = [
    { id: 'cg-1', name: 'HNI', active: true, order: 0 },
    { id: 'cg-2', name: 'Mid-Income', active: true, order: 1 },
    { id: 'cg-3', name: 'Affluent', active: true, order: 2 },
];
const initialTaskMasters: TaskMaster[] = [
    { id: 'tm-1', name: 'Auto', active: true, order: 0 },
    { id: 'tm-2', name: 'Manual', active: true, order: 1 },
];
const initialCustomerFields: CustomerFieldMaster[] = [];

// NEW: Initial data for MF Custom Fields
const initialMutualFundFields: MutualFundFieldMaster[] = [
    { id: 'mff-1', fieldName: 'riskProfile', label: 'Risk Profile', fieldType: 'select', options: ['Conservative', 'Moderate', 'Aggressive'], order: 0, active: true, group: 'Risk Analysis' },
    { id: 'mff-2', fieldName: 'investmentHorizon', label: 'Investment Horizon (Yrs)', fieldType: 'number', order: 1, active: true, group: 'Risk Analysis' },
];

const initialPolicyChecklistMasters: PolicyChecklistMaster[] = [
    // --- ROOT NODES ---
    { id: 'pcl-root-it-life', name: 'Life Insurance', parentId: null, policyType: 'Life Insurance', active: true, order: 0 },
    { id: 'pcl-root-it-health', name: 'Health Insurance', parentId: null, policyType: 'Health Insurance', active: true, order: 1 },
    { id: 'pcl-root-it-general', name: 'General Insurance', parentId: null, policyType: 'General Insurance', active: true, order: 2 },
    
    // --- CHILDREN (EXAMPLES) ---
    { id: 'pcl-life-1', name: 'ID Proof (Aadhaar, PAN, Passport, Voter ID, etc.)', parentId: 'pcl-root-it-life', policyType: 'Life Insurance', active: true, order: 0 },
    { id: 'pcl-life-2', name: 'Address Proof (Utility bill, Aadhaar, Rental Agreement)', parentId: 'pcl-root-it-life', policyType: 'Life Insurance', active: true, order: 1 },
    { id: 'pcl-health-1', name: 'Previous Insurance Details', parentId: 'pcl-root-it-health', policyType: 'Health Insurance', active: true, order: 0 },
    { id: 'pcl-motor-1', name: 'Vehicle Registration Certificate (RC)', parentId: 'pcl-root-it-general', policyType: 'General Insurance', active: true, order: 0 },

];

const initialInsuranceTypes: InsuranceTypeMaster[] = [
    // Parent Types
    { id: 'it-life', name: 'Life Insurance', parentId: null, verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-health', name: 'Health Insurance', parentId: null, verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-general', name: 'General Insurance', parentId: null, verticalId: 'bv-1', active: true, order: 2 },
    
    // Life Children
    { id: 'it-whole', name: 'Whole Life Insurance', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-term', name: 'Term Life Insurance', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-endowment', name: 'Endowment Plans', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-ulip', name: 'Unit-linked Insurance Plan', parentId: 'it-life', verticalId: 'bv-1', active: true, order: 3 },
    
    // Health Children
    { id: 'it-individual-health', name: 'Individual Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-family-floater', name: 'Family Floater Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-senior-citizen', name: 'Senior Citizen Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-critical-illness', name: 'Critical Illness Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 3 },
    { id: 'it-maternity', name: 'Maternity Insurance Plans', parentId: 'it-health', verticalId: 'bv-1', active: true, order: 4 },
    
    // General Children
    { id: 'it-motor', name: 'Motor', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 0 },
    { id: 'it-home', name: 'Home', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 1 },
    { id: 'it-travel', name: 'Travel', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 2 },
    { id: 'it-pa', name: 'Personal Accident', parentId: 'it-general', verticalId: 'bv-1', active: true, order: 3 },
];

const initialInsuranceFields: InsuranceFieldMaster[] = [
    // --- Life Insurance Fields ---
    { id: 'if-life-1', insuranceTypeId: 'it-life', fieldName: 'fatherName', label: "Father's Name", fieldType: 'text', order: 1, active: true, group: 'Personal Information' },
    { id: 'if-life-2', insuranceTypeId: 'it-life', fieldName: 'motherName', label: "Mother's Name", fieldType: 'text', order: 2, active: true, group: 'Personal Information' },
    { id: 'if-life-3', insuranceTypeId: 'it-life', fieldName: 'spouseName', label: "Spouse's Full Name", fieldType: 'text', order: 3, active: true, group: 'Personal Information' },
    { id: 'if-life-4', insuranceTypeId: 'it-life', fieldName: 'placeOfBirth', label: 'Place of Birth', fieldType: 'text', order: 4, active: true, group: 'Personal Information' },
    
    // --- Term Life Specific Field ---
    { id: 'if-term-1', insuranceTypeId: 'it-term', fieldName: 'policyTermYears', label: 'Policy Term (Years)', fieldType: 'number', order: 1, active: true},

    // --- Health Insurance Fields ---
    { id: 'if-health-1', insuranceTypeId: 'it-health', fieldName: 'preExistingConditions', label: 'Pre-existing Conditions', fieldType: 'text', order: 1, active: true, group: 'Medical History' },
    { id: 'if-health-2', insuranceTypeId: 'it-health', fieldName: 'heightCm', label: 'Height (cm)', fieldType: 'number', order: 6, active: true, group: 'Physical Details' },
    { id: 'if-health-3', insuranceTypeId: 'it-health', fieldName: 'weightKg', label: 'Weight (kg)', fieldType: 'number', order: 7, active: true, group: 'Physical Details' },
    { id: 'if-health-4', insuranceTypeId: 'it-health', fieldName: 'nomineeName', label: 'Nominee Name', fieldType: 'text', order: 2, active: true, group: 'Nominee Details' },
    { id: 'if-health-5', insuranceTypeId: 'it-health', fieldName: 'nomineeRelationship', label: 'Nominee Relationship', fieldType: 'text', order: 3, active: true, group: 'Nominee Details' },
    { id: 'if-health-6', insuranceTypeId: 'it-health', fieldName: 'hadSurgery', label: 'Had any surgery?', fieldType: 'boolean', order: 4, active: true, group: 'Medical History' },
    
    // --- Motor Insurance Fields ---
    { id: 'if-motor-1', insuranceTypeId: 'it-motor', fieldName: 'vehicleRegNo', label: 'Vehicle Reg. No.', fieldType: 'text', order: 1, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-2', insuranceTypeId: 'it-motor', fieldName: 'engineNo', label: 'Engine No.', fieldType: 'text', order: 4, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-3', insuranceTypeId: 'it-motor', fieldName: 'chassisNo', label: 'Chassis No.', fieldType: 'text', order: 5, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-4', insuranceTypeId: 'it-motor', fieldName: 'make', label: 'Make', fieldType: 'text', order: 2, active: true, group: 'Vehicle Details' },
    { id: 'if-motor-5', insuranceTypeId: 'it-motor', fieldName: 'model', label: 'Model', fieldType: 'text', order: 3, active: true, group: 'Vehicle Details' },
];

const initialTasks: Task[] = [
    { id: 'task-1', triggeringPoint: 'New Policy', taskDescription: 'Follow up for LIC documents', expectedCompletionDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, isShared: true, memberId: '1', primaryContactPerson: 'user-2', statusId: 'ts-1', taskType: 'Auto', active: true },
    { id: 'task-2', triggeringPoint: 'Manual', taskDescription: 'Schedule meeting with Kavya Reddy', expectedCompletionDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, isShared: false, memberId: '3', primaryContactPerson: 'user-3', statusId: 'ts-2', taskType: 'Manual', active: true },
    { id: 'task-3', triggeringPoint: 'Manual', taskDescription: 'Prepare weekly report for management', expectedCompletionDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: false, isShared: false, primaryContactPerson: 'user-2', statusId: 'ts-1', taskType: 'Manual', active: true },
];

// --- NEW MOCK DATA for P&L ---
const initialExpenseCategoriesLevel1: ExpenseCategoryLevel1[] = [
    { id: 'exp1-1', name: 'Administrative Expenses', active: true },
    { id: 'exp1-2', name: 'Marketing Expenses', active: true },
];

const initialExpenseCategoriesLevel2: ExpenseCategoryLevel2[] = [
    { id: 'exp2-1', name: 'Salary', parentId: 'exp1-1', active: true },
    { id: 'exp2-2', name: 'Rent', parentId: 'exp1-1', active: true },
    { id: 'exp2-3', name: 'MD\'s Travel', parentId: 'exp1-1', active: true },
    { id: 'exp2-4', name: 'Print Media Ad', parentId: 'exp1-2', active: true },
    { id: 'exp2-5', name: 'Digital Media', parentId: 'exp1-2', active: true },
];

const initialExpenseCategoriesLevel3: ExpenseCategoryLevel3[] = [
    { id: 'exp3-1', name: 'Staff Incentive', parentId: 'exp2-3', active: true },
    { id: 'exp3-2', name: 'Google Ads', parentId: 'exp2-5', active: true },
];


// --- NEW MOCK DATA for 2-Tier Income Categories ---
const initialIncomeCategoriesLevel1: IncomeCategoryLevel1[] = [
    { id: 'inc1-1', name: 'Direct Income', active: true },
    { id: 'inc1-2', name: 'Indirect Income', active: true },
];

const initialIncomeCategoriesLevel2: IncomeCategoryLevel2[] = [
    { id: 'inc2-1', name: 'Commission', parentId: 'inc1-1', active: true },
    { id: 'inc2-2', name: 'Consultancy Fees', parentId: 'inc1-1', active: true },
    { id: 'inc2-3', name: 'Interest Received', parentId: 'inc1-2', active: true },
];


const initialExpenses: Expense[] = [
    { id: 'exp-1', date: '2025-08-26', categoryLevel1Id: 'exp1-1', categoryLevel2Id: 'exp2-3', categoryLevel3Id: 'exp3-1', amount: 500, description: 'Cab fare for client visit', paidTo: 'Ola Cabs', createdBy: 'user-1' },
    { id: 'exp-2', date: '2025-08-25', categoryLevel1Id: 'exp1-2', categoryLevel2Id: 'exp2-5', categoryLevel3Id: 'exp3-2', amount: 1200, description: 'Google Ads Campaign', paidTo: 'Google', createdBy: 'user-2' },
];

const initialManualIncomes: ManualIncome[] = [
    { id: 'inc-1', date: '2025-08-20', categoryLevel1Id: 'inc1-1', categoryLevel2Id: 'inc2-2', amount: 10000, description: 'Consulting for HNI client', receivedFrom: 'Mr. Sharma', createdBy: 'user-1' },
];

const initialManualCommissions: ManualCommission[] = [
    { id: 'mcomm-1', date: '2025-08-28', memberId: '1', policyId: 'pol-1-1', amount: 2500, description: 'Manual entry for LIC policy', createdBy: 'user-1' }
];

// --- NEW: MOCK DATA FOR MUTUAL FUNDS ---
const initialAmcs: AMC[] = [
    { id: 'amc-1', name: 'HDFC AMC', active: true, order: 0 },
    { id: 'amc-2', name: 'SBI Mutual Fund', active: true, order: 1 },
    { id: 'amc-3', name: 'ICICI Prudential AMC', active: true, order: 2 },
    { id: 'amc-4', name: 'Axis Mutual Fund', active: true, order: 3 },
];

const initialMutualFundSchemes: MutualFundScheme[] = [
    // HDFC
    { id: 'mf-1', name: 'HDFC Flexi Cap Fund', amcId: 'amc-1', category: 'Equity', active: true, order: 0 },
    { id: 'mf-2', name: 'HDFC Small Cap Fund', amcId: 'amc-1', category: 'Equity', active: true, order: 1 },
    { id: 'mf-3', name: 'HDFC Short Term Debt Fund', amcId: 'amc-1', category: 'Debt', active: true, order: 2 },
    // SBI
    { id: 'mf-4', name: 'SBI BlueChip Fund', amcId: 'amc-2', category: 'Equity', active: true, order: 0 },
    { id: 'mf-5', name: 'SBI Magnum Gilt Fund', amcId: 'amc-2', category: 'Debt', active: true, order: 1 },
    // ICICI
    { id: 'mf-6', name: 'ICICI Prudential Bluechip Fund', amcId: 'amc-3', category: 'Equity', active: true, order: 0 },
    { id: 'mf-7', name: 'ICICI Prudential Balanced Advantage Fund', amcId: 'amc-3', category: 'Hybrid', active: true, order: 1 },
];


const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // --- Authentication and Page Routing State ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // --- Data Loading and State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<ToastData[]>([]);

    // --- Core Data State ---
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [routes, setRoutes] = useState<RouteType[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>(initialTasks);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [designationPermissions, setDesignationPermissions] = useState<DesignationPermissions[]>([]);


    // --- Modal States ---
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


    // --- Hubs Data ---
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [upsellOpportunities, setUpsellOpportunities] = useState<UpsellOpportunity[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>(initialAutomationRules);
    const [customMessages, setCustomMessages] = useState<CustomScheduledMessage[]>([]);
    // MODIFICATION: Removed processFlow state
    const [docTemplates, setDocTemplates] = useState<DocTemplate[]>(initialDocTemplates);
    const [attendance, setAttendance] = useState<AttendanceState>({});
    
    // --- NEW: Location Tracking State ---
    const [advisorLocations, setAdvisorLocations] = useState<AdvisorLocation[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);

    // --- Notification Dropdown State ---
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [dropdownCleared, setDropdownCleared] = useState(false);
    const notificationDropdownRef = useRef<HTMLDivElement>(null);
    
    // --- Toast & Dismissal Logic (Moved Up) ---
    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
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

    // --- Dashboard State ---
    const [dismissedFocusItems, setDismissedFocusItems] = useState<string[]>([]);
    
    // START: New state for Today's Focus
    const [todaysFocusItems, setTodaysFocusItems] = useState<TodaysFocusItem[]>([]);
    const [isFocusLoading, setIsFocusLoading] = useState(false);
    const [focusError, setFocusError] = useState<string | null>(null);
    // END: New state for Today's Focus

    // --- MASTER DATA STATE ---
    const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>(initialBusinessVerticals);
    const [leadSources, setLeadSources] = useState<LeadSourceMaster[]>(initialLeadSources);
    const [schemes, setSchemes] = useState<SchemeMaster[]>(initialSchemes);
    // --- FIX: Renamed state for clarity ---
    const [agencies, setAgencies] = useState<Company[]>(initialAgencies);
    const [operatingCompanies, setOperatingCompanies] = useState<Company[]>([]);
    const [geographies, setGeographies] = useState<Geography[]>(generateInitialGeographies());
    const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
    const [documentMasters, setDocumentMasters] = useState<DocumentMaster[]>(initialDocumentMasters);
    const [schemeDocumentMappings, setSchemeDocumentMappings] = useState<SchemeDocumentMapping[]>([]);
    const [giftMasters, setGiftMasters] = useState<GiftMaster[]>(initialGiftMasters);
    const [taskStatusMasters, setTaskStatusMasters] = useState<TaskStatusMaster[]>(initialTaskStatusMasters);
    const [customerCategories, setCustomerCategories] = useState<CustomerCategory[]>(initialCustomerCategories);
    const [bankMasters, setBankMasters] = useState<BankMaster[]>(initialBankMasters);
    const [allBranches, setAllBranches] = useState<FinRootsBranch[]>([]);
    const [finrootsCompanyInfo, setFinrootsCompanyInfo] = useState<FinRootsCompanyInfo>(initialFinrootsCompanyInfo);
    // NEW MASTER DATA STATE
    const [customerSubCategories, setCustomerSubCategories] = useState<CustomerSubCategory[]>(initialCustomerSubCategories);
    const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>(initialCustomerGroups);
    const [taskMasters, setTaskMasters] = useState<TaskMaster[]>(initialTaskMasters);
    const [customerFieldMasters, setCustomerFieldMasters] = useState<CustomerFieldMaster[]>(initialCustomerFields);
    const [policyChecklistMasters, setPolicyChecklistMasters] = useState<PolicyChecklistMaster[]>(initialPolicyChecklistMasters);
    const [insuranceTypes, setInsuranceTypes] = useState<InsuranceTypeMaster[]>(initialInsuranceTypes);
    const [insuranceFields, setInsuranceFields] = useState<InsuranceFieldMaster[]>(initialInsuranceFields);
    const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([]); // MODIFIED: Start empty, will be hydrated
    const [customerTierCalculationMethod, setCustomerTierCalculationMethod] = useState<TierCalculationMethod>('sumAssured');
    const [expenseCategoriesLevel1, setExpenseCategoriesLevel1] = useState<ExpenseCategoryLevel1[]>(initialExpenseCategoriesLevel1);
    const [expenseCategoriesLevel2, setExpenseCategoriesLevel2] = useState<ExpenseCategoryLevel2[]>(initialExpenseCategoriesLevel2);
    const [expenseCategoriesLevel3, setExpenseCategoriesLevel3] = useState<ExpenseCategoryLevel3[]>(initialExpenseCategoriesLevel3);
    const [incomeCategoriesLevel1, setIncomeCategoriesLevel1] = useState<IncomeCategoryLevel1[]>(initialIncomeCategoriesLevel1);
    const [incomeCategoriesLevel2, setIncomeCategoriesLevel2] = useState<IncomeCategoryLevel2[]>(initialIncomeCategoriesLevel2);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [manualIncomes, setManualIncomes] = useState<ManualIncome[]>(initialManualIncomes);
    const [manualCommissions, setManualCommissions] = useState<ManualCommission[]>(initialManualCommissions);
    const [religions, setReligions] = useState<Religion[]>([]);
    const [festivals, setFestivals] = useState<Festival[]>([]);
    const [festivalDates, setFestivalDates] = useState<FestivalDate[]>([]);
    const [upsellCategories, setUpsellCategories] = useState<UpsellCategory[]>([]); 
    const [amcs, setAmcs] = useState<AMC[]>(initialAmcs);
    const [mutualFundSchemes, setMutualFundSchemes] = useState<MutualFundScheme[]>(initialMutualFundSchemes);
    const [mutualFundFields, setMutualFundFields] = useState<MutualFundFieldMaster[]>(initialMutualFundFields); // NEW STATE
    // --- NEW STATES FOR NEW MASTER DATA ---
    const [genders, setGenders] = useState<Gender[]>([]);
    const [maritalStatuses, setMaritalStatuses] = useState<MaritalStatus[]>([]);
    const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
    // MODIFICATION START: New state for process stage masters
    const [processStageMasters, setProcessStageMasters] = useState<ProcessStageMaster[]>([]);
    // MODIFICATION END

    // --- Multi-tenancy Filtered Data ---
    const companyMembers = useMemo(() => allMembers.filter(m => m.companyId === currentUser?.companyId), [allMembers, currentUser]);
    const companyLeads = useMemo(() => allLeads.filter(l => l.companyId === currentUser?.companyId), [allLeads, currentUser]);
    const companyUsers = useMemo(() => allUsers.filter(u => u.companyId === currentUser?.companyId), [allUsers, currentUser]);
    const companyBranches = useMemo(() => allBranches.filter(b => b.companyId === currentUser?.companyId && b.active), [allBranches, currentUser]);

    // NEW: Centralized permissions logic
    const currentUserPermissions = useMemo(() => {
        if (!currentUser || !designationPermissions) return {};

        // 1. Get the base permissions from the user's designation
        const designationPerms = designationPermissions.find(p => p.designationId === currentUser.designationId);
        const basePermissions = designationPerms?.permissions || {};

        // 2. Get the user-specific overrides from their profile
        const userOverrides = currentUser.profile?.permissions || {};

        // 3. Merge them, with user overrides taking precedence
        const finalPermissions = { ...basePermissions, ...userOverrides };
        
        // Ensure all modules have a default 'none' permission if not specified
        const allModules: AppModule[] = [
            'dashboard', 'reports & insights', 'profitAndLoss', 'calendar', 'employees', 'pipeline', 'customers', 
            'taskManagement', 'policies', 'notes', 'actionHub', 'servicesHub', 'location', 'chatbot', 'masterMember', 
            'advancedReports', 'upselling', 'mutualFunds'
        ];
        
        for (const module of allModules) {
            if (!finalPermissions[module]) {
                finalPermissions[module] = 'none';
            }
        }

        return finalPermissions as { [key in AppModule]: PermissionLevel };

    }, [currentUser, designationPermissions]);

        // --- NEW: Filtered leads for the pipeline view ---
    const leadsForPipeline = useMemo(() => {
        if (currentUser?.designationId === 'des-admin') {
            return companyLeads;
        }
        return companyLeads.filter(lead => lead.assignedTo === currentUser?.id || lead.createdBy === currentUser?.id);
    }, [companyLeads, currentUser]);
    
    const lastVoucherNumber = useMemo(() => {
        const numbers = expenses
            .map(e => e.voucherNo)
            .filter((v): v is string => !!v)
            .map(v => parseInt(v.replace('VCH-', ''), 10))
            .filter(n => !isNaN(n));
        return numbers.length > 0 ? Math.max(...numbers) : 0;
    }, [expenses]);

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
        } else { // 'premium'
            sortedTiers = [...sortedTiers].sort((a, b) => (b.minimumPremium ?? 0) - (a.minimumPremium ?? 0));
            assignedTier = sortedTiers.find(tier => totalPremium >= (tier.minimumPremium ?? 0));
        }

        if (assignedTier) {
            return { ...member, tierId: assignedTier.id, memberType: assignedTier.name };
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
    const handleUpdateFinrootsBranches = useCallback((newData: FinRootsBranch[]) => setAllBranches([...newData]), []);
    const handleUpdateGeographies = useCallback((newData: Geography[]) => setGeographies([...newData]), []);
    const handleUpdateRelationshipTypes = useCallback((newData: RelationshipType[]) => setRelationshipTypes([...newData]), []);
    const handleUpdateDocumentMasters = useCallback((newData: DocumentMaster[]) => setDocumentMasters([...newData]), []);
    const handleUpdateSchemeDocumentMappings = useCallback((newData: SchemeDocumentMapping[]) => setSchemeDocumentMappings([...newData]), []);
    const handleUpdateGiftMasters = useCallback((newData: GiftMaster[]) => setGiftMasters([...newData]), []);
    const handleUpdateTaskStatusMasters = useCallback((newData: TaskStatusMaster[]) => setTaskStatusMasters([...newData]), []);
    const handleUpdateCustomerCategories = useCallback((newData: CustomerCategory[]) => setCustomerCategories([...newData]), []);
    const handleUpdateBankMasters = useCallback((newData: BankMaster[]) => setBankMasters([...newData]), []);
    const handleUpdateCustomerSubCategories = useCallback((newData: CustomerSubCategory[]) => setCustomerSubCategories([...newData]), []);
    const handleUpdateCustomerGroups = useCallback((newData: CustomerGroup[]) => setCustomerGroups([...newData]), []);
    const handleUpdateTaskMasters = useCallback((newData: TaskMaster[]) => setTaskMasters([...newData]), []);
    const handleUpdatePolicyChecklistMasters = useCallback((newData: PolicyChecklistMaster[]) => setPolicyChecklistMasters([...newData]), []);
    const handleUpdateInsuranceTypes = useCallback((newData: InsuranceTypeMaster[]) => setInsuranceTypes([...newData]), []);
    const handleUpdateInsuranceFields = useCallback((newData: InsuranceFieldMaster[]) => setInsuranceFields([...newData]), []);
    const handleUpdateRoutes = useCallback((newData: RouteType[]) => setRoutes([...newData]), []);
    const handleUpdateCustomerTiers = useCallback((newData: CustomerTier[]) => setCustomerTiers([...newData]), []);
    const handleUpdateCustomerFieldMasters = useCallback((newData: CustomerFieldMaster[]) => setCustomerFieldMasters([...newData]), []);
    const handleUpdateExpenseCategoriesLevel1 = useCallback((newData: ExpenseCategoryLevel1[]) => setExpenseCategoriesLevel1([...newData]), []);
    const handleUpdateExpenseCategoriesLevel2 = useCallback((newData: ExpenseCategoryLevel2[]) => setExpenseCategoriesLevel2([...newData]), []);
    const handleUpdateExpenseCategoriesLevel3 = useCallback((newData: ExpenseCategoryLevel3[]) => setExpenseCategoriesLevel3([...newData]), []);
    const handleUpdateIncomeCategoriesLevel1 = useCallback((newData: IncomeCategoryLevel1[]) => setIncomeCategoriesLevel1([...newData]), []);
    const handleUpdateIncomeCategoriesLevel2 = useCallback((newData: IncomeCategoryLevel2[]) => setIncomeCategoriesLevel2([...newData]), []);
    const handleUpdateReligions = useCallback((newData: Religion[]) => setReligions([...newData]), []);
    const handleUpdateFestivals = useCallback((newData: Festival[]) => setFestivals([...newData]), []);
    const handleUpdateFestivalDates = useCallback((newData: FestivalDate[]) => setFestivalDates([...newData]), []);
    const handleUpdateAmcs = useCallback((newData: AMC[]) => setAmcs([...newData]), []);
    const handleUpdateMutualFundSchemes = useCallback((newData: MutualFundScheme[]) => setMutualFundSchemes([...newData]), []);
    const handleUpdateMutualFundFields = useCallback((newData: MutualFundFieldMaster[]) => setMutualFundFields([...newData]), []); // NEW
    const handleUpdateAgencies = useCallback((newData: Company[]) => setAgencies(newData), []);
    const handleUpdateDesignations = useCallback((newData: Designation[]) => setDesignations(newData), []);
    // --- NEW HANDLERS ---
    const handleUpdateGenders = useCallback((newData: Gender[]) => setGenders([...newData]), []);
    const handleUpdateMaritalStatuses = useCallback((newData: MaritalStatus[]) => setMaritalStatuses([...newData]), []);
    const handleUpdateCustomerTypes = useCallback((newData: CustomerType[]) => setCustomerTypes([...newData]), []);
    // MODIFICATION START: New handler for process stage masters
    const handleUpdateProcessStageMasters = useCallback(async (newData: ProcessStageMaster[]) => {
        try {
            const updated = await updateProcessStageMasters(newData);
            setProcessStageMasters(updated);
            addToast('Process flow updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update process flow: ${(error as Error).message}`, 'error');
        }
    }, [addToast]);
    // MODIFICATION END
    const handleUpdateDesignationPermissions = useCallback(async (permissions: DesignationPermissions) => {
        try {
            const updated = await updateDesignationPermissions(permissions);
            setDesignationPermissions(prev => prev.map(p => p.designationId === updated.designationId ? updated : p));
            addToast('Designation permissions updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update permissions: ${(error as Error).message}`, 'error');
        }
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
        const { voucherNo, date, payeeName, branchId, lineItems } = data;

        const existingExpensesMap = new Map(expenses.map(e => [e.id, e]));
        const processedExistingIds = new Set<string>();
        const newAndUpdatedExpenses: Expense[] = [];

        lineItems.forEach(item => {
            let categoryLevel1Id: string | undefined;
            let categoryLevel2Id: string | undefined;
            let categoryLevel3Id: string | undefined;

            const pathParts = item.fullCategoryPath.split(' > ');
            if (pathParts.length > 0 && pathParts[0] !== 'Manual Entry') {
                const l1 = expenseCategoriesLevel1.find(c => c.name === pathParts[0]);
                if (l1) {
                    categoryLevel1Id = l1.id;
                    if (pathParts.length > 1) {
                        const l2 = expenseCategoriesLevel2.find(c => c.name === pathParts[1] && c.parentId === categoryLevel1Id);
                        if (l2) {
                            categoryLevel2Id = l2.id;
                            if (pathParts.length > 2) {
                                const l3 = expenseCategoriesLevel3.find(c => c.name === pathParts[2] && c.parentId === categoryLevel2Id);
                                if (l3) categoryLevel3Id = l3.id;
                            }
                        }
                    }
                }
            }
            
            if (item.isNew) {
                const newExpense: Expense = {
                    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date,
                    amount: item.amount,
                    description: item.description,
                    paidTo: payeeName,
                    createdBy: currentUser?.id || 'unknown',
                    voucherNo,
                    branchId,
                    modeOfPayment: item.modeOfPayment,
                    expenseHead: item.expenseHead,
                    categoryLevel1Id,
                    categoryLevel2Id,
                    categoryLevel3Id,
                };
                newAndUpdatedExpenses.push(newExpense);
            } else {
                const existingExpense = existingExpensesMap.get(item.id);
                if (existingExpense) {
                    const updatedExpense = {
                        ...existingExpense,
                        date,
                        amount: item.amount,
                        description: item.description,
                        paidTo: payeeName,
                        voucherNo,
                        branchId,
                        modeOfPayment: item.modeOfPayment,
                        expenseHead: item.expenseHead,
                        categoryLevel1Id: categoryLevel1Id || existingExpense.categoryLevel1Id,
                        categoryLevel2Id: categoryLevel2Id || existingExpense.categoryLevel2Id,
                        categoryLevel3Id: categoryLevel3Id || existingExpense.categoryLevel3Id,
                    };
                    newAndUpdatedExpenses.push(updatedExpense);
                    processedExistingIds.add(item.id);
                }
            }
        });

        setExpenses(prev => {
            const otherExpenses = prev.filter(e => !processedExistingIds.has(e.id));
            return [...otherExpenses, ...newAndUpdatedExpenses];
        });

        addToast(`Voucher ${voucherNo} has been saved successfully.`, 'success');
    }, [expenses, currentUser, expenseCategoriesLevel1, expenseCategoriesLevel2, expenseCategoriesLevel3, addToast]);

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


     // --- DATA FETCHING (MODIFIED) ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // MODIFICATION: Added getProcessStageMasters to the promise array
                const [
                    membersData, leadsData, usersData, routesData, opCompaniesData, branchesData, 
                    religionsData, festivalsData, relationshipTypesData, festivalDatesData, upsellCategoriesData,
                    designationsData, designationPermissionsData,
                    gendersData, maritalStatusesData, customerTypesData,
                    customerTiersData,
                    processStagesData
                ] = await Promise.all([
                    getMembers(),
                    getLeads(),
                    getUsers(),
                    getRoutes(),
                    getOperatingCompanies(),
                    getFinrootsBranches(),
                    getReligions(),
                    getFestivals(),
                    getRelationshipTypes(),
                    getFestivalDates(),
                    getUpsellCategories(),
                    getDesignations(),
                    getDesignationPermissions(),
                    getGenders(), 
                    getMaritalStatuses(), 
                    getCustomerTypes(), 
                    getCustomerTiers(),
                    getProcessStageMasters()
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
                setDesignationPermissions(designationPermissionsData);
                setGenders(gendersData);
                setMaritalStatuses(maritalStatusesData);
                setCustomerTypes(customerTypesData);
                // Hydrate the names in customerTiers
                const typeMap = new Map(customerTypesData.map(t => [t.id, t.name]));
                const hydratedTiers = customerTiersData.map(tier => ({...tier, name: typeMap.get(tier.customerTypeId) || 'Unknown'}));
                setCustomerTiers(hydratedTiers);
                // MODIFICATION: Set the new state for process stage masters
                setProcessStageMasters(processStagesData);

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
        const isAdmin = designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin';
        if (isAdmin) {
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
    }, [currentUser, designations]);

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
                        const message = diffDays === 0
                            ? `Happy Birthday to ${member.name} today! Wishing you a wonderful year ahead.`
                            : `Birthday for ${member.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`;
                        newNotifications.push({ id: `bday-${member.id}-${idCounter++}`, type: 'Birthday', date: nextBirthday.toISOString(), message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
                    }
                    const nextAnniversary = getNextOccurrence(member.anniversary);
                    if (nextAnniversary && nextAnniversary <= upcomingLimit) {
                        const diffDays = dayDifference(nextAnniversary, today);
                        const message = diffDays === 0
                            ? `Happy Anniversary to ${member.name} today! May this special day bring you joy.`
                            : `Anniversary for ${member.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`;
                        newNotifications.push({ id: `anniv-${member.id}-${idCounter++}`, type: 'Anniversary', date: nextAnniversary.toISOString(), message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
                    }
                    (member.otherSpecialOccasions || []).forEach(occasion => {
                         const nextOccasionDate = getNextOccurrence(occasion.date);
                         if (nextOccasionDate && nextOccasionDate <= upcomingLimit) {
                             const diffDays = dayDifference(nextOccasionDate, today);
                              const message = diffDays === 0 ? `Today is a special day for ${member.name}: ${occasion.name}!` : `Upcoming special day for ${member.name}: ${occasion.name} in ${diffDays} day${diffDays > 1 ? 's' : ''}.`;
                             newNotifications.push({ id: `special-${member.id}-${occasion.id}-${idCounter++}`, type: 'Special Occasion', occasionName: occasion.name, date: nextOccasionDate.toISOString(), message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'auto' });
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
                     if(policy.status === 'Active') {
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
                    if(member) newNotifications.push({ id: `custom-${msg.id}-${idCounter++}`, type: 'Custom', date: msg.dateTime, message: msg.message, member: { id: member.id, name: member.name, mobile: member.mobile }, source: 'custom' });
                }
            });

            newNotifications.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setNotifications(newNotifications);
        };

        if (companyMembers.length > 0 && festivals.length > 0) {
            generateNotifications();
        }
    }, [companyMembers, customMessages, festivals, festivalDates, religions]);

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

     const handleLogin = (user: User) => {
        setCurrentUser(user);
        navigate('/dashboard');
        const userDesignation = designations.find(d => d.id === user.designationId);
        if (userDesignation?.isAdvisor) {
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
        navigate('/login');
    };

    const handleAutomaticTaskReassignment = useCallback(async (absentEmployeeId: string) => {
        const absentEmployee = allUsers.find(u => u.id === absentEmployeeId);
        if (!absentEmployee) return;

        const pendingTasks = allTasks.filter(t => t.primaryContactPerson === absentEmployeeId && !t.isCompleted);

        if (pendingTasks.length === 0) return;

        const advisorDesignationIds = new Set(designations.filter(d => d.isAdvisor).map(d => d.id));
        const availableAdvisors = allUsers.filter(u => {
            if (!advisorDesignationIds.has(u.designationId) || u.id === absentEmployeeId) return false;
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
                const absentEmployeeBranch = absentEmployee.profile?.employeeBranchId;
                if (absentEmployeeBranch) {
                    replacement = availableAdvisors.find(pa => pa.profile?.employeeBranchId === absentEmployeeBranch);
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
                        statusId: 'ts-6', // Reset status to Assigned
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

    }, [allTasks, allUsers, attendance, addToast, designations]);

    const handleMarkAttendance = useCallback((status: 'Present' | 'Absent', reason?: string) => {
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

    const handleUpdateAttendanceByAdmin = useCallback((userId: string, status: 'Present' | 'Absent', reason?: string) => {
        const timestamp = new Date().toISOString();
        const newRecord: AttendanceRecord = { status, reason: reason || 'Admin Override', timestamp };

        setAttendance(prev => {
            const userRecords = prev[userId] || [];
            return { ...prev, [userId]: [...userRecords, newRecord] };
        });
        addToast("Attendance updated by Admin.", "success");
        
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
        setIsLeadModalOpen(true);
    }, []);

    const handleOpenEmployeeModal = useCallback((employee: User | null) => {
        setEditingEmployee(employee);
        setIsEmployeeModalOpen(true);
    }, []);
    
    const handleViewTier = useCallback((tier: CustomerTier) => {
        setViewingTier(tier);
        setIsViewByTierModalOpen(true);
    }, []);
 
    // --- MODIFICATION START: New handler for creating dependent members ---
    const handleCreateDependentMember = useCallback(async (spoc: Member, dependentData: Partial<Member>): Promise<Member | null> => {
        if (!currentUser || !spoc || !spoc.sno) {
            addToast('Cannot create dependent: primary contact is not saved.', 'error');
            return null;
        }
        
        try {
            // Generate a unique memberId
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
                companyId: spoc.companyId,
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
    // --- MODIFICATION END ---


    const handleSaveMember = useCallback(async (memberData: Member, closeModal: boolean = true) => {
        const isNew = !memberData.id;
        let updatedMemberData = { ...memberData };

        updatedMemberData = calculateMemberTier(updatedMemberData, customerTiers, customerTierCalculationMethod);

        try {
            if (isNew) {
                const duplicates = allMembers.filter(m => m.memberId === updatedMemberData.memberId && m.companyId === currentUser?.companyId);
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

                const newMemberPayload = { ...updatedMemberData, company: currentUser?.company || '', companyId: currentUser?.companyId || '', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
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

                // --- MODIFICATION START: Removed automatic dependent creation logic ---
                // The logic that looped through `coveredMembers` to find new members and create them has been removed.
                // The assumption is now that members are created in the Family Tab first.
                // --- MODIFICATION END ---
                
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
            addToast(`New upsell opportunity found for ${member.name}!`, 'success');
            return newOpportunity.suggestions;
        } else {
            addToast(`No new specific upsell opportunities found for ${member.name} at this time.`, 'success');
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
            isCompleted: task.isCompleted || false,
            isShared: task.isShared ?? (task.taskType === 'Auto'),
            primaryContactPerson: task.primaryContactPerson || currentUser?.id,
            statusId: task.statusId || 'ts-6',
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
            isCompleted: baseTask.isCompleted || false,
            isShared: baseTask.isShared ?? (baseTask.taskType === 'Auto'),
            statusId: baseTask.statusId || 'ts-6',
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
                newLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: 'Status was updated in modal.',
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
    }, [currentUser]);

    const handleDeleteTask = useCallback((taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setAllTasks(prev => prev.filter(t => t.id !== taskId));
            addToast('Task deleted.', 'success');
        }
    }, [addToast]);

    const handleOpenTask = useCallback((taskId: string) => {
        setAllTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId && task.statusId === 'ts-6') {
                const newLog: TaskActivityLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: 'Status changed from Assigned to Viewed.',
                    by: currentUser?.id || 'system',
                };
                return { ...task, statusId: 'ts-5', activityLog: [...(task.activityLog || []), newLog] };
            }
            return task;
        }));
    }, [currentUser]);

    const handleToggleTask = useCallback((taskId: string) => {
        setAllTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
                const isCompleted = task.isCompleted;
                const newStatusId = isCompleted ? 'ts-2' : 'ts-3';
                const newLog: TaskActivityLog = {
                    timestamp: new Date().toISOString(),
                    action: 'Status Change',
                    details: `Status changed to ${isCompleted ? 'In Progress' : 'Completed'}.`,
                    by: currentUser?.id || 'system',
                };
                return { ...task, isCompleted: !isCompleted, statusId: newStatusId, activityLog: [...(task.activityLog || []), newLog] };
            }
            return task;
        }));
    }, [currentUser]);

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
            statusId: 'ts-6',
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
            member: member ? { id: member.id, name: member.name, mobile: member.mobile } : (lead ? { id: lead.id, name: lead.name, mobile: lead.phone } : { id: '', name: 'Personal Task', mobile: ''}),
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
                if(currentUser?.id === updated.id) setCurrentUser(updated);
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
            
            // MODIFICATION START: Increment installmentsPaid count for term policies
            if (policyToUpdate.policyTerm && policyToUpdate.policyTerm > 0) {
                policyToUpdate.installmentsPaid = (policyToUpdate.installmentsPaid || 0) + 1;
            }
            // MODIFICATION END

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
            if (currentUser && currentUser.companyId === updated.id) {
                setCurrentUser(prev => prev ? { ...prev, company: updated.name } : null);
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
            const newMember = { ...pendingDuplicateMember, company: currentUser?.company || '', companyId: currentUser?.companyId || '', createdBy: currentUser?.id, createdAt: new Date().toISOString() };
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
            switch(type) {
                case 'Birthday Messages': return <GiftIcon className="text-pink-500" />;
                case 'Anniversary Messages': return <Calendar className="text-purple-500" />;
                case 'Policy Renewal Messages': return <Bell className="text-blue-500" />;
                case 'Special Occasion Messages': return <Star className="text-yellow-500" />;
                default: return <Zap className="text-gray-500" />;
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
                dob: '1900-01-01', // Placeholder DOB
                maritalStatus: 'Single',
                country: '',
                state: '', // Placeholder
                city: '', // Placeholder
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
                companyId: currentUser?.companyId || '',
                createdBy: currentUser?.id,
                createdAt: new Date().toISOString(),
                isReferrerOnly: true, // Key flag
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


    // --- RENDER LOGIC ---
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
                        if(user) {
                           await handleSaveEmployee({...user, password: newPassword});
                           return true;
                        }
                        return false;
                    }}
                    addToast={addToast}
                    operatingCompanies={operatingCompanies}
                />
            )}
            
            {/* --- CHANGE: Main routing logic --- */}
            {!currentUser ? (
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} onForgotPassword={() => setIsForgotPasswordModalOpen(true)} theme={theme} toggleTheme={toggleTheme} allBranches={allBranches} operatingCompanies={operatingCompanies} designations={designations} />} />
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
                    />
                    <main className="flex-1 bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden md:ml-64">
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
                        <div className="flex-1 p-6 overflow-y-auto">
                            <Routes>
                                {/* CORRECTED: Pass permissions to all components */}
                                <Route path="/" element={<Navigate to="/dashboard" />} />
                                <Route path="/dashboard" element={<Dashboard {...{ members: companyMembers, leads: companyLeads, notifications, upsellOpportunities, onOpenModal: handleOpenMemberModal, onOpenLeadModal: handleOpenLeadModal, currentUser, users: companyUsers, dismissedFocusItems, onDismissFocusItem: handleDismissItem, allTasks, onToggleTask: handleToggleTask, onUpdateTask: handleUpdateTask, onDeleteTask: handleDeleteTask, todaysFocusItems, isFocusLoading, focusError, onRefreshFocus: fetchTodaysFocus, customerTiers, onViewTier: handleViewTier, taskStatusMasters, addToast, designations, permissions: currentUserPermissions }} />} />
                                {/* MODIFIED: Removed processFlow from MemberDashboard */}
                                <Route path="/customers" element={<MemberDashboard {...{ members: companyMembers, allMembers, currentUser, users: companyUsers, onEditMember: handleOpenMemberModal, onCreateMember: () => handleOpenMemberModal(null), onConversationalCreate: () => setIsConversationalCreatorOpen(true), onDeleteMember: handleDeleteMember, onToggleStatus: handleToggleMemberStatus, onGenerateReview: handleGenerateReview, addToast, finrootsBranches: companyBranches, designations, permissions: currentUserPermissions }} />} />
                                <Route path="/policies" element={<PolicyManager {...{ members: companyMembers, onRenewPolicy: handleRenewPolicy, onViewMember: handleOpenMemberModal, addToast, users: companyUsers, finrootsBranches: companyBranches, insuranceTypes, designations, permissions: currentUserPermissions }} />} />
                                <Route path="/mutualFunds" element={<MutualFunds {...{ allMembers: companyMembers, onUpdateMember: (member) => handleSaveMember(member, false), amcs, schemes: mutualFundSchemes, addToast, onViewMember: onViewMember, permissions: currentUserPermissions }} />} />
                                <Route path="/pipeline" element={<SalesPipeline {...{ leads: leadsForPipeline, users: companyUsers, onOpenLeadModal: handleOpenLeadModal, onUpdateLead: async (lead) => { if (!currentUser) return; const oldLead = allLeads.find(l => l.id === lead.id); if (!oldLead) return; const newLogs = generateLeadActivityLog(oldLead, lead, currentUser.id); const updatedLeadData = { ...lead, lastUpdatedAt: new Date().toISOString(), activityLog: [...(oldLead.activityLog || []), ...newLogs]}; const updated = await updateLead(updatedLeadData); setAllLeads(prev => prev.map(l => l.id === updated.id ? updated : l)); addToast("Lead updated.", "success"); }, onConvertLead: (lead) => { const newMemberFromLead: Partial<Member> = { name: lead.name, mobile: lead.phone, email: lead.email, leadSource: lead.leadSource, assignedTo: lead.assignedTo ? [lead.assignedTo] : [], branchId: lead.branchId, company: lead.company, companyId: lead.companyId, active: true, policies: [], voiceNotes: [], documents: [], checkIns: [], processStage: 'Initial Contact', }; handleOpenMemberModal(newMemberFromLead as Member, ModalTab.BasicInfo, lead.id); addToast(`Converting ${lead.name} to customer. Please review and save.`, "success"); }, leadSources, onDeleteLead: handleDeleteLead, finrootsBranches: companyBranches, insuranceTypes, addToast, permissions: currentUserPermissions }} />} />
                                <Route path="/notes" element={<NotesPage {...{ members: companyMembers, leads: companyLeads, onSaveMember: handleSaveMember, onSaveLeadNote: handleSaveLeadNote, onCreateTask: (desc, due, memberName, memberId) => handleCreateTask({triggeringPoint: 'Manual', taskDescription: desc, expectedCompletionDateTime: due || new Date().toISOString(), memberId, taskType: 'Manual', isCompleted: false}), addToast, currentUser, users: companyUsers, finrootsBranches: companyBranches, designations, permissions: currentUserPermissions }} />} />
                                <Route path="/location" element={<LocationServices members={companyMembers} addToast={addToast} currentUser={currentUser} allUsers={companyUsers} onUpdateAdvisorLocation={handleUpdateAdvisorLocation} onCreateCheckIn={handleCreateCheckIn} advisorLocations={advisorLocations} checkIns={checkIns} onFetchAdvisorTrail={handleFetchAdvisorTrail} activeCheckIn={activeCheckIn} onCheckOut={handleCheckOut} onGetActiveCheckIn={getActiveCheckIn} designations={designations} />} />
                                <Route path="/chatbot" element={<Chatbot members={companyMembers} leads={companyLeads} tasks={allTasks} expenses={expenses} manualIncomes={manualIncomes} manualCommissions={manualCommissions} addToast={addToast} />} />
                                <Route path="/profile" element={currentUser.designationId === 'des-admin' ? <AdminProfile {...{ user: currentUser, users: companyUsers, allMembers: companyMembers, onOpenEmployeeModal: () => handleOpenEmployeeModal(null), onUpdateProfile: handleSaveEmployee, addToast, designations, permissions: currentUserPermissions }} /> : <ProfilePage {...{ user: currentUser, onUpdateProfile: handleSaveEmployee, onUpdatePassword: handleUpdatePassword, addToast, allMembers: companyMembers, users: companyUsers, geographies, onUpdateGeographies: handleUpdateGeographies, bankMasters, designations, permissions: currentUserPermissions, genders }} />} />
                                <Route path="/employees" element={<EmployeeManagement {...{ users: companyUsers, allMembers: companyMembers, onOpenEmployeeModal: handleOpenEmployeeModal, onToggleStatus: async (userId) => { const user = allUsers.find(u => u.id === userId); if(user) { const newStatus = user.profile?.status === 'Active' ? 'Inactive' : 'Active'; await handleSaveEmployee({...user, profile: {...user.profile, status: newStatus} as EmployeeProfile}); addToast("Employee status updated.", "success"); }}, attendance, onUpdateAttendance: handleUpdateAttendanceByAdmin, finrootsBranches: companyBranches, addToast, designations, permissions: currentUserPermissions }} />} />
                                <Route path="/servicesHub" element={<ServicesHub addToast={addToast} allMembers={companyMembers} onViewMember={handleOpenMemberModal} onUpdateCommissionStatus={handleUpdateCommissionStatus} currentUser={currentUser} designations={designations} />} />
                                {/* MODIFIED: Removed processFlow and onUpdateProcessFlow from ActionAutomationHub */}
                                <Route path="/actionHub" element={<ActionAutomationHub {...{ notifications: hubNotifications, onRenewPolicy: handleRenewPolicy, activityLog: hubActivityLog, addToast, onNotificationSent: () => {}, appointments: hubAppointments, tasks: hubTasks, onToggleTask: handleToggleTask, onDismissItem: handleDismissItem, savedGreetingUrl: null, setSavedGreetingUrl: () => {}, upsellOpportunities, onDismissOpportunity: (id) => setUpsellOpportunities(prev => prev.filter(o => o.id !== id)), members: companyMembers, onScheduleMessage: (msg) => { setCustomMessages(prev => [...prev, {...msg, id: `cm-${Date.now()}`}]); addToast('Custom message scheduled!', 'success'); }, onClearAll: handleClearActionHubNotifications, onScheduleAppointment: (appt) => { const member = companyMembers.find(m => m.id === appt.memberId); if(member) { setAppointments(prev => [...prev, { ...appt, id: `appt-${Date.now()}`, memberName: member.name }]); addToast('Appointment scheduled!', 'success'); } }, rules: automationRules, onUpdateRule: (rule) => setAutomationRules(prev => prev.map(r => r.id === rule.id ? rule : r)), onAddRule: handleAddAutomationRule, docTemplates, onUpdateTemplates: setDocTemplates, currentUser, users: companyUsers, onViewMember: onViewMember, permissions: currentUserPermissions }} />} />
                                {/* MODIFIED: Added processStageMasters and onUpdateProcessStageMasters to MasterData */}
                                <Route path="/masterMember/" element={<MasterData {...{addToast, allMembers: companyMembers, users: companyUsers, customerFieldMasters, onUpdateCustomerFieldMasters: handleUpdateCustomerFieldMasters, businessVerticals, onUpdateBusinessVerticals: handleUpdateBusinessVerticals, leadSources, onUpdateLeadSources: handleUpdateLeadSources, schemes, onUpdateSchemes: handleUpdateSchemes, agencies, onUpdateAgencies: handleUpdateAgencies, operatingCompanies, onUpdateOperatingCompanies: handleUpdateOperatingCompany, finrootsBranches: allBranches, onUpdateFinrootsBranches: handleUpdateFinrootsBranches, finrootsCompanyInfo, onUpdateFinRootsCompanyInfo: setFinrootsCompanyInfo, geographies, onUpdateGeographies: handleUpdateGeographies, relationshipTypes, onUpdateRelationshipTypes: handleUpdateRelationshipTypes, documentMasters, onUpdateDocumentMasters: handleUpdateDocumentMasters, schemeDocumentMappings, onUpdateSchemeDocumentMappings: handleUpdateSchemeDocumentMappings, giftMasters, onUpdateGiftMasters: handleUpdateGiftMasters, customerTiers, onUpdateCustomerTiers: handleUpdateCustomerTiers, taskStatuses: taskStatusMasters, onUpdateTaskStatuses: handleUpdateTaskStatusMasters, customerCategories, onUpdateCustomerCategories: handleUpdateCustomerCategories, bankMasters, onUpdateBankMasters: handleUpdateBankMasters, customerSubCategories, onUpdateCustomerSubCategories: handleUpdateCustomerSubCategories, customerGroups, onUpdateCustomerGroups: handleUpdateCustomerGroups, taskMasters, onUpdateTaskMasters: handleUpdateTaskMasters, policyChecklistMasters, onUpdatePolicyChecklistMasters: handleUpdatePolicyChecklistMasters, insuranceTypes, onUpdateInsuranceTypes: handleUpdateInsuranceTypes, insuranceFields, onUpdateInsuranceFields: handleUpdateInsuranceFields, routes, onUpdateRoutes: handleUpdateRoutes, designations, onUpdateDesignations: handleUpdateDesignations, currentUser, customerTierCalculationMethod, onUpdateCustomerTierCalculationMethod: handleUpdateAllMemberTiers, expenseCategoriesLevel1, onUpdateExpenseCategoriesLevel1: handleUpdateExpenseCategoriesLevel1, expenseCategoriesLevel2, onUpdateExpenseCategoriesLevel2: handleUpdateExpenseCategoriesLevel2, expenseCategoriesLevel3, onUpdateExpenseCategoriesLevel3: handleUpdateExpenseCategoriesLevel3, incomeCategoriesLevel1, onUpdateIncomeCategoriesLevel1: handleUpdateIncomeCategoriesLevel1, incomeCategoriesLevel2, onUpdateIncomeCategoriesLevel2: handleUpdateIncomeCategoriesLevel2, religions, onUpdateReligions: handleUpdateReligions, festivals, onUpdateFestivals: handleUpdateFestivals, festivalDates, onUpdateFestivalDates: handleUpdateFestivalDates, amcs, onUpdateAmcs: handleUpdateAmcs, mutualFundSchemes, onUpdateMutualFundSchemes: handleUpdateMutualFundSchemes, mutualFundFields, onUpdateMutualFundFields: handleUpdateMutualFundFields, permissions: currentUserPermissions, genders, onUpdateGenders: handleUpdateGenders, maritalStatuses, onUpdateMaritalStatuses: handleUpdateMaritalStatuses, customerTypes, onUpdateCustomerTypes: handleUpdateCustomerTypes, processStageMasters, onUpdateProcessStageMasters: handleUpdateProcessStageMasters }} />} />
                                <Route path="/reports-insights" element={<ReportsAndInsights members={companyMembers} users={companyUsers} tasks={allTasks} attendance={attendance} onUpdateAttendance={handleUpdateAttendanceByAdmin} addToast={addToast} allLeads={companyLeads} currentUser={currentUser} leadSources={leadSources} schemes={schemes} insuranceTypes={insuranceTypes} onOpenAttendanceReport={() => setIsAttendanceReportModalOpen(true)} designations={designations} />} />
                                <Route path="/taskManagement" element={<TaskManagement allTasks={allTasks} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onCreateTask={handleCreateTask} onCreateBulkTask={handleCreateBulkTask} onOpenTask={handleOpenTask} users={companyUsers} members={companyMembers} leads={companyLeads} taskStatusMasters={taskStatusMasters} taskMasters={taskMasters} addToast={addToast} currentUser={currentUser} finrootsBranches={companyBranches} onReassignTask={handleReassignTask} designations={designations} />} />
                                <Route path="/profitAndLoss" element={<ProfitAndLoss allMembers={companyMembers} expenses={expenses} manualIncomes={manualIncomes} manualCommissions={manualCommissions} expenseCategoriesLevel1={expenseCategoriesLevel1} expenseCategoriesLevel2={expenseCategoriesLevel2} expenseCategoriesLevel3={expenseCategoriesLevel3} incomeCategoriesLevel1={incomeCategoriesLevel1} incomeCategoriesLevel2={incomeCategoriesLevel2} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={handleDeleteExpense} onDeleteVoucher={handleDeleteVoucher} onAddManualIncome={handleAddManualIncome} onUpdateManualIncome={handleUpdateManualIncome} onDeleteManualIncome={handleDeleteManualIncome} onAddManualCommission={handleAddManualCommission} onUpdateManualCommission={handleUpdateManualCommission} onDeleteManualCommission={handleDeleteManualCommission} currentUser={currentUser} companyInfo={operatingCompanies.find(c => c.id === currentUser?.companyId)} branches={companyBranches} onSaveVoucher={handleSaveVoucherDetails} lastVoucherNumber={lastVoucherNumber} insuranceTypes={insuranceTypes} permissions={currentUserPermissions} />} />
                                <Route path="/calendar" element={<FestivalCalendar allMembers={companyMembers} festivals={festivals} festivalDates={festivalDates} religions={religions} onViewMember={onViewMember} />} />
                                <Route path="/advancedReports" element={<AdvancedReports members={companyMembers} users={companyUsers} tasks={allTasks} leads={companyLeads} branches={companyBranches} schemes={schemes} companies={agencies} expenses={expenses} manualIncomes={manualIncomes} manualCommissions={manualCommissions} currentUser={currentUser} customerTiers={customerTiers} attendance={attendance} expenseCategoriesLevel1={expenseCategoriesLevel1} expenseCategoriesLevel2={expenseCategoriesLevel2} expenseCategoriesLevel3={expenseCategoriesLevel3} incomeCategoriesLevel1={incomeCategoriesLevel1} incomeCategoriesLevel2={incomeCategoriesLevel2} businessVerticals={businessVerticals} taskStatusMasters={taskStatusMasters} customerFieldMasters={customerFieldMasters} insuranceFields={insuranceFields} insuranceTypes={insuranceTypes} designations={designations} />} />
                                <Route path="/upselling" element={<UpsellingDashboard members={companyMembers} upsellCategories={upsellCategories} insuranceTypes={insuranceTypes} addToast={addToast} users={companyUsers} branches={companyBranches} />} />
                                <Route path="*" element={<div>Not Implemented</div>} />
                            </Routes>
                        </div>
                    </main>
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
                            onCreateTask={(task) =>
                                handleCreateTask(task)
                            }
                            onRelieveMember={handleRelieveMember}
                            currentUser={currentUser}
                            users={companyUsers}
                            routes={routes}
                            onUpdateRoutes={handleUpdateRoutes}
                            processFlow={processStageMasters} // MODIFIED: Pass processStageMasters instead of processFlow
                            onGenerateProposal={(member, policy) => { setProposalContext({ member, policy }); setIsProposalModalOpen(true); }}
                            onFindUpsell={handleFindUpsell}
                            allMembers={allMembers}
                            schemes={schemes}
                            companies={agencies}
                            documentMasters={documentMasters}
                            schemeDocumentMappings={schemeDocumentMappings}
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
                            policyChecklistMasters={policyChecklistMasters}
                            onUpdatePolicyChecklistMasters={handleUpdatePolicyChecklistMasters}
                            insuranceTypes={insuranceTypes}
                            insuranceFields={insuranceFields}
                            onUpdateInsuranceFields={handleUpdateInsuranceFields}
                            customerFieldMasters={customerFieldMasters}
                            onUpdateCustomerFieldMasters={handleUpdateCustomerFieldMasters}
                            onCreateReferrer={handleCreateReferrer}
                            finrootsBranches={companyBranches}
                            religions={religions}
                            onAddDocumentMaster={handleAddDocumentMaster}
                            amcs={amcs}
                            mutualFundSchemes={mutualFundSchemes}
                            mutualFundFields={mutualFundFields}
                            designations={designations}
                            permissions={currentUserPermissions}
                            genders={genders} 
                            maritalStatuses={maritalStatuses}
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
                            finrootsBranches={companyBranches}
                            currentUser={currentUser}
                            geographies={geographies}
                            onUpdateGeographies={handleUpdateGeographies}
                            bankMasters={bankMasters}
                            businessVerticals={businessVerticals} 
                            insuranceTypes={insuranceTypes}
                            amcs={amcs}
                            designations={designations}
                            designationPermissions={designationPermissions}
                            genders={genders}
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
                                        const created = await createLead(newLeadData as Omit<Lead, 'id'|'createdAt'|'company'|'companyId'>, currentUser.companyId);
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
                            finrootsBranches={companyBranches}
                            insuranceTypes={insuranceTypes}
                            allMembers={companyMembers}
                            onCreateReferrer={handleCreateReferrer}
                            designations={designations}
                            permissions={currentUserPermissions} // CORRECTED
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
                            permissions={currentUserPermissions} // CORRECTED
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
                            permissions={currentUserPermissions} // CORRECTED
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
                </div>
            )}
        </>
    );
};
export default App;