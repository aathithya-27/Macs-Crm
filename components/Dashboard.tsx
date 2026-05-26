import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Member, UpsellOpportunity, Lead, ModalTab, Tab, User, TodaysFocusItem, Task, CustomerTier, TaskStatusMaster, Designation, AppModule, PermissionLevel, Role, LeadSourceMaster } from '../types.ts';
import TodaysFocus from './TodaysFocus.tsx';
import { Users, Bell, Shield, TrendingUp, Gem, Award, Star, ShieldCheck, CheckCircle, ListTodo, ArrowRight, Edit2, Trash2, X, Calendar, User as UserIcon, Briefcase, MessageSquare, Activity, PieChart as PieChartIcon, LayoutDashboard, MoreVertical, UserCheck, BarChart2 } from 'lucide-react';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface DashboardProps {
    members: Member[];
    leads: Lead[];
    notifications: any[];
    upsellOpportunities: UpsellOpportunity[];
    onOpenModal: (member: Member | null, initialTab?: ModalTab | null) => void;
    onOpenLeadModal: (lead: Lead | null) => void;
    currentUser: User | null;
    users: User[];
    dismissedFocusItems: string[];
    onDismissFocusItem: (itemId: string) => void;
    allTasks: Task[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    todaysFocusItems: TodaysFocusItem[];
    isFocusLoading: boolean;
    focusError: string | null;
    onRefreshFocus: () => void;
    customerTiers: CustomerTier[];
    onViewTier: (tier: CustomerTier) => void;
    taskStatusMasters: TaskStatusMaster[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    designations: Designation[];
    permissions: { [key in AppModule]?: PermissionLevel };
    roles: Role[];
    leadSources: LeadSourceMaster[];
    attendance?: { [userId: string]: any[] };
}

const COLORS = ['#0EA5E9', '#D946EF', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B'];

const TaskDetailModal: React.FC<{
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    users: User[];
    members: Member[];
    leads: Lead[];
    taskStatusMasters: TaskStatusMaster[];
    currentUser: User | null;
    addToast: (message: string, type?: 'success' | 'error') => void;
    permissions: { [key in AppModule]?: PermissionLevel };
    isReadOnly: boolean;
}> = ({ task, isOpen, onClose, onUpdateTask, onDeleteTask, users, members, leads, taskStatusMasters, currentUser, addToast, permissions, isReadOnly }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedTask, setEditedTask] = useState<Partial<Task> | null>(null);

    const canModify = permissions?.taskManagement === 'modify' && !isReadOnly;

    React.useEffect(() => {
        if (task) {
            setEditedTask({ ...task });
            setIsEditMode(false);
        }
    }, [task]);

    if (!isOpen || !task || !editedTask) return null;

    const userMap = new Map(users.map(u => [u.id, u.name]));
    const memberMap = new Map(members.map(m => [m.id, m.name]));
    const leadMap = new Map(leads.map(l => [l.id, l.name]));

    const advisorOptions = users.filter(u => u.role === 'Advisor').map(adv => ({ value: adv.id, label: adv.name }));
    const clientOptions = [
        { value: '', label: 'None (Personal Task)' },
        ...members.map(mem => ({ value: `member:${mem.id}`, label: `${mem.name} (Customer)` })),
        ...leads.map(lead => ({ value: `lead:${lead.id}`, label: `${lead.name} (Lead)` }))
    ];

    const selectedClientValue = editedTask?.memberId ? `member:${editedTask.memberId}` : (editedTask?.leadId ? `lead:${editedTask.leadId}` : '');

    const handleClientChange = (value: string) => {
        if (!value) {
            setEditedTask(prev => ({ ...prev, memberId: undefined, leadId: undefined }));
            return;
        }
        const [type, id] = value.split(':');
        if (type === 'member') {
            setEditedTask(prev => ({ ...prev, memberId: id, leadId: undefined }));
        } else if (type === 'lead') {
            setEditedTask(prev => ({ ...prev, memberId: undefined, leadId: id }));
        }
    };

    const handleSave = () => {
        if (!editedTask.taskDescription?.trim()) {
            addToast('Task description cannot be empty.', 'error');
            return;
        }
        onUpdateTask(editedTask as Task);
        addToast('Task updated successfully!', 'success');
        setIsEditMode(false);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            onDeleteTask(task.id);
            addToast('Task deleted.', 'success');
            onClose();
        }
    };

    const clientName = task.memberId ? memberMap.get(task.memberId) : leadMap.get(task.leadId || '');
    const currentStatusInfo = taskStatusMasters.find(s => s.id === task.statusId);
    const statusName = currentStatusInfo?.name || 'Unknown';
    const isOverdue = !currentStatusInfo?.isEndState && new Date(task.expectedCompletionDateTime) < new Date();

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">{isEditMode ? 'Edit Task' : 'Task Details'}</h2>
                <div className="flex items-center gap-2">
                    {canModify && !isEditMode && (
                        <>
                            <Button variant="light" size="small" onClick={() => setIsEditMode(true)}><Edit2 size={14} /> Edit</Button>
                            <Button variant="danger" size="small" onClick={handleDelete}><Trash2 size={14} /> Delete</Button>
                        </>
                    )}
                    <Button variant="light" size="small" className="!p-1.5 h-7 w-7" onClick={onClose}><X size={16} /></Button>
                </div>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                {isEditMode ? (
                    <>
                        <Input
                            label="Task Description *"
                            value={editedTask.taskDescription || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, taskDescription: e.target.value })}
                        />
                        <SearchableSelect
                            label="Assigned To (Primary) *"
                            options={advisorOptions}
                            value={editedTask.primaryContactPerson || ''}
                            onChange={(value) => setEditedTask({ ...editedTask, primaryContactPerson: value })}
                            placeholder="Select Advisor..."
                        />
                        <SearchableSelect
                            label="Related Customer / Lead"
                            options={clientOptions}
                            value={selectedClientValue}
                            onChange={handleClientChange}
                            placeholder="None (Personal Task)"
                        />
                        <Input
                            label="Due Date *"
                            type="date"
                            value={editedTask.expectedCompletionDateTime?.split('T')[0] || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, expectedCompletionDateTime: e.target.value })}
                        />
                    </>
                ) : (
                    <>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">{task.taskDescription}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 pt-4 border-t dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <div>
                                    <p className="font-medium">Due Date</p>
                                    <p className={isOverdue ? 'font-bold text-red-500' : ''}>
                                        {new Date(task.expectedCompletionDateTime).toLocaleDateString('en-GB')}
                                        {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserIcon size={16} className="text-gray-400" />
                                <div>
                                    <p className="font-medium">Assigned To</p>
                                    <p>{userMap.get(task.primaryContactPerson || '') || 'N/A'}</p>
                                </div>
                            </div>
                            {clientName && (
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} className="text-gray-400" />
                                    <div>
                                        <p className="font-medium">Related To</p>
                                        <p>{clientName} <span className="text-xs text-gray-400">({task.memberId ? 'Customer' : 'Lead'})</span></p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-gray-400" />
                                <div>
                                    <p className="font-medium">Status</p>
                                    <p>{statusName}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {isEditMode && (
                <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={() => setIsEditMode(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save Changes</Button>
                </div>
            )}
        </Modal>
    );
};


const TaskOverview: React.FC<{
    tasks: Task[];
    users: User[];
    currentUser: User;
    onViewAllTasks: () => void;
    onViewTask: (task: Task) => void;
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ tasks, users, currentUser, onViewAllTasks, onViewTask, permissions }) => {
    const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'customer'>('all');
    const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const canModifyTasks = permissions?.taskManagement === 'modify';

    const tasksForUser = useMemo(() => {
        if (permissions?.taskManagement === 'modify' || permissions?.taskManagement === 'view') {
            return tasks;
        }
        return tasks.filter(t => t.primaryContactPerson === currentUser.id || t.alternateContactPersons?.includes(currentUser.id));
    }, [tasks, currentUser, permissions]);

    const filteredTasks = useMemo(() => {
        return tasksForUser.filter(task => {
            let typeMatch = false;
            switch (typeFilter) {
                case 'all':
                    typeMatch = true;
                    break;
                case 'personal':
                    typeMatch = !task.memberId && !task.leadId;
                    break;
                case 'customer':
                    typeMatch = !!task.memberId || !!task.leadId;
                    break;
                default:
                    typeMatch = true;
            }
            const statusMatch = (statusFilter === 'pending' && !task.isCompleted) || (statusFilter === 'completed' && task.isCompleted);
            return typeMatch && statusMatch;
        }).sort((a, b) => new Date(a.expectedCompletionDateTime).getTime() - new Date(b.expectedCompletionDateTime).getTime());
    }, [tasksForUser, typeFilter, statusFilter]);

    const isOverdue = (task: Task) => !task.isCompleted && new Date(task.expectedCompletionDateTime) < new Date();

    const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 transform ${isActive
                ? 'bg-brand-primary text-white shadow-lg scale-105 ring-2 ring-brand-primary/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 hover:shadow-md dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                        <ListTodo size={20} className="text-brand-primary" />
                    </div>
                    Task Overview
                </h3>
                <Button onClick={onViewAllTasks} variant="ghost" size="small" className="text-brand-primary hover:bg-brand-primary/10 transition-colors">
                    Manage All <ArrowRight size={14} className="ml-1" />
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl backdrop-blur-sm border border-gray-100/50 dark:border-gray-600/50">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status:</span>
                        <FilterButton label="Pending" isActive={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
                        <FilterButton label="Done" isActive={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
                    </div>
                    {(permissions?.taskManagement === 'view' || permissions?.taskManagement === 'modify') && (
                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-600 pl-4 ml-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type:</span>
                            <FilterButton label="All" isActive={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
                            <FilterButton label="Personal" isActive={typeFilter === 'personal'} onClick={() => setTypeFilter('personal')} />
                            <FilterButton label="Customer" isActive={typeFilter === 'customer'} onClick={() => setTypeFilter('customer')} />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => onViewTask(task)}
                            className={`group p-4 rounded-xl border cursor-pointer flex items-center gap-4 transition-all duration-300 ${task.isCompleted
                                ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60 hover:opacity-100 grayscale'
                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-brand-primary/30 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:scale-[1.01]'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 shadow-sm ${task.isCompleted ? 'bg-green-500 shadow-green-500/50' : (isOverdue(task) ? 'bg-red-500 shadow-red-500/50' : 'bg-brand-primary shadow-brand-primary/50 animate-pulse')}`}></div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm truncate ${task.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200 group-hover:text-brand-primary transition-colors'
                                    }`}>
                                    {task.taskDescription}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isOverdue(task) ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        <Calendar size={12} />
                                        {new Date(task.expectedCompletionDateTime).toLocaleDateString('en-GB')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <UserIcon size={12} />
                                        {userMap.get(task.primaryContactPerson || '') || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all">
                                <ArrowRight size={18} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <CheckCircle size={40} className="text-gray-300 dark:text-gray-500" />
                        </div>
                        <p className="font-bold text-lg text-gray-700 dark:text-gray-300">All caught up!</p>
                        <p className="text-sm opacity-70 mt-1">No tasks found for this filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ members, leads, notifications, upsellOpportunities, onOpenModal, onOpenLeadModal, currentUser, users, dismissedFocusItems, onDismissFocusItem, allTasks, onUpdateTask, onDeleteTask, todaysFocusItems, isFocusLoading, focusError, onRefreshFocus, customerTiers, onViewTier, taskStatusMasters, addToast, designations, permissions, roles, leadSources, attendance = {} }) => {

    const navigate = useNavigate();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [leadSourceChartType, setLeadSourceChartType] = useState<'bar' | 'pie'>('bar');

    const undismissedNotificationCount = useMemo(() => {
        return notifications.filter(n => !n.dismissed).length;
    }, [notifications]);

    const totalActivePolicies = members.reduce((sum, member) => sum + member.policies.length, 0);
    const opportunitiesValue = upsellOpportunities.length;

    const totalLeadsStats = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= thirtyDaysAgo);
        const pct = leads.length > 0 ? ((recentLeads.length / leads.length) * 100).toFixed(1) : '0.0';
        return { total: leads.length, recent: recentLeads.length, pct };
    }, [leads]);

    const customerDistribution = useMemo(() => {
        return members.reduce((acc, member) => {
            acc[member.memberType] = (acc[member.memberType] || 0) + 1;
            return acc;
        }, {} as Record<Member['memberType'], number>);
    }, [members]);

    // Data for charts - REAL DATA ONLY
    const memberGrowthData = useMemo(() => {
        const today = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                monthKey: `${d.getFullYear()}-${d.getMonth()}`,
                NewMembers: 0,
                ActivePolicies: 0
            };
        });

        members.forEach(m => {
            if (m.createdAt) {
                const d = new Date(m.createdAt);
                if (!isNaN(d.getTime())) {
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    const found = last6Months.find(item => item.monthKey === key);
                    if (found) found.NewMembers++;
                }
            }

            // Check policies for this member
            if (m.policies) {
                m.policies.forEach(p => {
                    const policyDate = p.policyCreatedDate || p.startDate;
                    if (policyDate) {
                        const pd = new Date(policyDate);
                        if (!isNaN(pd.getTime())) {
                            const key = `${pd.getFullYear()}-${pd.getMonth()}`;
                            const found = last6Months.find(item => item.monthKey === key);
                            if (found) found.ActivePolicies++;
                        }
                    }
                });
            }
        });

        return last6Months;
    }, [members]);

    const tierPieData = useMemo(() => {
        return Object.keys(customerDistribution).map((key) => ({
            name: key,
            value: customerDistribution[key]
        }));
    }, [customerDistribution]);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    const isCurrentUserAdvisor = useMemo(() => roles.find(r => r.id === currentUser?.roleId)?.isAdvisor === true, [currentUser, roles]);

    const pendingMembers = useMemo(() => {
        const basePending = members
            .filter(m => m.active && (!m.policies || m.policies.length === 0))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        if (isCurrentUserAdvisor) {
            return basePending.filter(member => member.assignedTo?.includes(currentUser!.id));
        }

        return basePending;
    }, [members, currentUser, isCurrentUserAdvisor]);

    const StatCard: React.FC<{ icon: React.ReactElement<any>; title: string; value: string | number; subtext?: string; colorClass: string }> = ({ icon, title, value, subtext, colorClass }) => (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 dark:border-gray-700 flex items-center gap-5 h-full transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 hover:scale-[1.02] relative overflow-hidden group">
            {/* 3D Gradient Background Layer */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-${colorClass.split('-')[1]}-400 to-transparent pointer-events-none`}></div>

            {/* Animated Icon Background */}
            <div className={`absolute -top-6 -right-6 p-8 opacity-5 transform rotate-12 scale-125 transition-all duration-500 group-hover:scale-150 group-hover:rotate-45 group-hover:opacity-10`}>
                {React.cloneElement(icon, { size: 120, className: colorClass })}
            </div>

            {/* Main Icon with 3D Pop effect */}
            <div className={`p-4 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} dark:bg-opacity-20 shadow-lg shadow-${colorClass.split('-')[1]}-500/20 transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                {React.cloneElement(icon, { size: 30, className: colorClass })}
            </div>

            <div className="relative z-10">
                <p className="text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight drop-shadow-sm">{value}</p>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">{title}</p>
                {subtext && (
                    <div className="mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50 inline-flex items-center gap-1.5 transition-colors group-hover:bg-white/80 dark:group-hover:bg-gray-600/50">
                        <Activity size={10} className={colorClass} /> <span className="text-gray-600 dark:text-gray-300">{subtext}</span>
                    </div>
                )}
            </div>
        </div>
    );

    // 1. Growth Trends (Business Verticals)
    const growthTrendData = useMemo(() => {
        const today = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                monthKey: `${d.getFullYear()}-${d.getMonth()}`,
                NewMembers: 0,
                Assets: 0
            };
        });

        members.forEach(m => {
            // New Members
            if (m.createdAt) {
                const d = new Date(m.createdAt);
                if (!isNaN(d.getTime())) {
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    const found = last6Months.find(item => item.monthKey === key);
                    if (found) found.NewMembers++;
                }
            }

            // Assets (Insurance Policies)
            if (m.policies) {
                m.policies.forEach(p => {
                    const policyDate = p.policyCreatedDate || p.startDate;
                    if (policyDate) {
                        const pd = new Date(policyDate);
                        if (!isNaN(pd.getTime())) {
                            const key = `${pd.getFullYear()}-${pd.getMonth()}`;
                            const found = last6Months.find(item => item.monthKey === key);
                            if (found) found.Assets++;
                        }
                    }
                });
            }

            // Assets (Mutual Fund Investments)
            if (m.mutualFundHoldings) {
                m.mutualFundHoldings.forEach(mf => {
                    // Use first transaction date as start date
                    const startDate = mf.transactions && mf.transactions.length > 0
                        ? mf.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
                        : null;

                    if (startDate) {
                        const fd = new Date(startDate);
                        if (!isNaN(fd.getTime())) {
                            const key = `${fd.getFullYear()}-${fd.getMonth()}`;
                            const found = last6Months.find(item => item.monthKey === key);
                            if (found) found.Assets++;
                        }
                    }
                });
            }
        });

        return last6Months;
    }, [members]);

    // 2. Financial Performance (Revenue) - Updated to include SIPs/Lumpsum if needed, currently keeping Premium
    const financialData = useMemo(() => {
        const today = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                monthKey: `${d.getFullYear()}-${d.getMonth()}`,
                Revenue: 0
            };
        });

        members.forEach(m => {
            // Policy Premiums
            m.policies?.forEach(p => {
                const dateToCheck = p.paymentDetails?.date || p.startDate || p.policyCreatedDate;
                if (dateToCheck && p.premium) {
                    const d = new Date(dateToCheck);
                    if (!isNaN(d.getTime())) {
                        const key = `${d.getFullYear()}-${d.getMonth()}`;
                        const found = last6Months.find(item => item.monthKey === key);
                        if (found) {
                            found.Revenue += p.premium;
                        }
                    }
                }
            });

            // MF Investments (Purchase/SIP)
            m.mutualFundHoldings?.forEach(mf => {
                mf.transactions?.forEach(t => {
                    if ((t.type === 'Purchase' || t.type === 'SIP Installment' || t.type === 'Additional Purchase') && t.date && t.amount) {
                        const d = new Date(t.date);
                        if (!isNaN(d.getTime())) {
                            const key = `${d.getFullYear()}-${d.getMonth()}`;
                            const found = last6Months.find(item => item.monthKey === key);
                            if (found) {
                                found.Revenue += t.amount;
                            }
                        }
                    }
                })
            })
        });
        return last6Months;
    }, [members]);


    // 2. Lead Source Distribution (Bar Graph)
    const leadSourceData = useMemo(() => {
        const sources = new Map<string, number>();
        const sourceMap = new Map(leadSources.map(ls => [ls.id, ls.name]));

        const getSourceName = (sourceId?: string | null) => {
            if (!sourceId) return 'Direct / Unknown';
            const name = sourceMap.get(sourceId);
            return name || 'Direct / Unknown';
        };

        // Process leads
        leads.forEach(l => {
            const sourceName = getSourceName(l.leadSource?.sourceId);
            sources.set(sourceName, (sources.get(sourceName) || 0) + 1);
        });
        
        // Process members who came from lead sources (converted leads)
        members.filter(m => m.leadSource).forEach(m => {
            const sourceName = getSourceName(m.leadSource?.sourceId);
            sources.set(sourceName, (sources.get(sourceName) || 0) + 1);
        });

        return Array.from(sources.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [leads, members, leadSources]);

    // 6. Staff Attendance (Present Today)
    const staffAttendance = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const attendanceData: { present: User[], wfh: User[], absent: User[], total: number } = { present: [], wfh: [], absent: [], total: 0 };
        
        users.forEach(u => {
            if (u.profile?.status === 'Active') {
                attendanceData.total++;
                
                // Get today's attendance record from the attendance prop
                const userAttendanceRecords = attendance[u.id] || [];
                const todaysRecord = userAttendanceRecords.find(record => 
                    record.timestamp.startsWith(todayStr)
                );
                
                if (todaysRecord) {
                    if (todaysRecord.status === 'Present') {
                        attendanceData.present.push(u);
                    } else if (todaysRecord.status === 'Work From Home') {
                        attendanceData.wfh.push(u);
                    } else if (todaysRecord.status === 'Absent') {
                        attendanceData.absent.push(u);
                    }
                } else {
                    // No attendance marked yet - default to absent
                    attendanceData.absent.push(u);
                }
            }
        });
        
        return attendanceData;
    }, [users, attendance]);

    // 7. Lead Follow-ups (Pending & Today)
    const leadFollowUps = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return leads.filter(l => {
            if (!l.followUpDate) return false;
            const fDate = new Date(l.followUpDate);
            return fDate <= new Date(new Date().setDate(today.getDate() + 7));
        }).sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
            .slice(0, 50);
    }, [leads]);

    // 3. Top Advisors (by Active Policies)
    const topAdvisors = useMemo(() => {
        const advisorStats = new Map<string, number>();
        members.forEach(m => {
            if (m.assignedTo && m.assignedTo.length > 0) {
                // Count policies for the first assigned advisor (primary)
                const advisorId = m.assignedTo[0];
                const policyCount = m.policies?.filter(p => p.status === 'Active').length || 0;
                advisorStats.set(advisorId, (advisorStats.get(advisorId) || 0) + policyCount);
            }
        });

        return Array.from(advisorStats.entries())
            .map(([id, count]) => ({
                id,
                name: userMap.get(id) || 'Unknown Advisor',
                count
            }))
            .sort((a, b) => b.count - a.count)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50); // Top 50 to allow scrolling
    }, [members, userMap]);

    // 4. Upcoming Renewals (Next 30 Days)
    const upcomingRenewals = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const renewals: { memberName: string; policyNo: string; date: Date; amount: number; memberId: string }[] = [];

        members.forEach(m => {
            m.policies?.forEach(p => {
                if (p.renewalDate && p.status === 'Active') {
                    const rDate = new Date(p.renewalDate);
                    if (rDate >= today && rDate <= thirtyDaysFromNow) {
                        renewals.push({
                            memberName: m.name,
                            memberId: m.id,
                            policyNo: p.policyNumber || 'N/A',
                            date: rDate,
                            amount: p.premium || 0
                        });
                    }
                }
            });
        });
        return renewals.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
    }, [members]);


    return (
        <div className="space-y-8 animate-fade-in p-2 pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-8 relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent"></div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-blue-600 to-purple-600 dark:from-brand-primary dark:to-blue-400 drop-shadow-sm filter">Dashboard</h1>
                        <span className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-full border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">Monday, February 2, 2026</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Welcome back, <span className="text-gray-800 dark:text-gray-200 font-bold">{currentUser?.name || 'User'}</span>! Here's what's happening today.</p>
                </div>
                <Button onClick={() => navigate('/chatbot')} variant="primary" className="flex-shrink-0 shadow-[0_10px_20px_rgb(37,99,235,0.3)] hover:shadow-[0_15px_30px_rgb(37,99,235,0.4)] hover:-translate-y-1 transition-all rounded-xl px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 border-none ring-2 ring-blue-400/20">
                    <MessageSquare size={18} className="mr-2" />
                    AI Assistant
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 perspective-[1000px]">
                <button onClick={() => navigate('/customers')} className="text-left w-full focus:outline-none focus:ring-4 focus:ring-blue-100 rounded-2xl transition-transform duration-300">
                    <StatCard icon={<Users />} title="Total Customers" value={members.length} subtext={`${members.filter(m => m.active).length} active now`} colorClass="text-blue-600" />
                </button>
                <button onClick={() => navigate('/actionHub')} className="text-left w-full focus:outline-none focus:ring-4 focus:ring-orange-100 rounded-2xl transition-transform duration-300 delay-[50ms]">
                    <StatCard icon={<Bell />} title="Notifications" value={undismissedNotificationCount} subtext="Requires attention" colorClass="text-orange-500" />
                </button>
                <button onClick={() => navigate('/policies')} className="text-left w-full focus:outline-none focus:ring-4 focus:ring-emerald-100 rounded-2xl transition-transform duration-300 delay-[100ms]">
                    <StatCard icon={<Shield />} title="Active Policies" value={totalActivePolicies} subtext="Assets" colorClass="text-emerald-500" />
                </button>

                <button onClick={() => navigate('/actionHub')} className="text-left w-full focus:outline-none focus:ring-4 focus:ring-purple-100 rounded-2xl transition-transform duration-300 delay-[150ms]">
                    <StatCard icon={<TrendingUp />} title="Opportunities" value={opportunitiesValue} subtext="Potential revenue" colorClass="text-purple-600" />
                </button>
                <button onClick={() => navigate('/pipeline')} className="text-left w-full focus:outline-none focus:ring-4 focus:ring-rose-100 rounded-2xl transition-transform duration-300 delay-[200ms]">
                    <StatCard icon={<UserCheck />} title="Total Leads" value={totalLeadsStats.total} subtext={`${totalLeadsStats.recent} (${totalLeadsStats.pct}%) in last 30 days`} colorClass="text-rose-500" />
                </button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 transition-all hover:shadow-[0_15px_40px_rgb(0,0,0,0.1)]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Activity size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                Business Growth Trends
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 pl-12">New Members vs. Assets</p>
                        </div>
                        <div className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-4 py-1.5 rounded-full shadow-inner">Last 6 Months</div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D946EF" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#D946EF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500 }} />
                                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.2} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        padding: '12px'
                                    }}
                                    cursor={{ stroke: '#0EA5E9', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="NewMembers" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" name="New Clients" animationDuration={1500} />
                                <Area type="monotone" dataKey="Assets" stroke="#D946EF" strokeWidth={3} fillOpacity={0.6} fill="url(#colorAssets)" name="New Assets" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-[0_15px_40px_rgb(0,0,0,0.12)]">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Customer Type
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mb-4 pl-12">Distribution by Membership Tier</p>
                    <div className="flex gap-3 flex-1 min-h-0">
                        <div className="h-[240px] flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tierPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {tierPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-28 overflow-y-auto custom-scrollbar space-y-2 py-1 flex-shrink-0">
                            {tierPieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{entry.name}</p>
                                        <p className="text-xs text-gray-400">{entry.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Row: Lead Source & Staff Attendance & Top Staff & Renewals & Lead Follow-ups */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {/* Lead Source Analysis */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Briefcase size={20} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            Lead Source Analysis
                        </h3>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button
                                onClick={() => setLeadSourceChartType('bar')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    leadSourceChartType === 'bar'
                                        ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <BarChart2 size={14} /> Bar
                            </button>
                            <button
                                onClick={() => setLeadSourceChartType('pie')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    leadSourceChartType === 'pie'
                                        ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <PieChartIcon size={14} /> Pie
                            </button>
                        </div>
                    </div>
                    <div className={`flex gap-4 ${leadSourceChartType === 'pie' ? '' : 'h-[300px]'}`}>
                        <div className={`${leadSourceChartType === 'pie' ? 'h-[300px]' : 'h-full'} flex-1`}>
                            <ResponsiveContainer width="100%" height="100%">
                                {leadSourceChartType === 'bar' ? (
                                    <BarChart layout="vertical" data={leadSourceData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                                        <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1500} barSize={20}>
                                            {leadSourceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    <PieChart>
                                        <Pie
                                            data={leadSourceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {leadSourceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                                            formatter={(value, name) => [value, name]}
                                        />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                        {leadSourceChartType === 'pie' && (
                            <div className="w-32 overflow-y-auto custom-scrollbar space-y-2 py-1 flex-shrink-0">
                                {leadSourceData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{entry.name}</p>
                                            <p className="text-xs text-gray-400">{entry.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Staff Attendance (New) */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <UserIcon size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            Staff Attendance
                        </h3>
                        <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">Today</span>
                    </div>

                    <div className="flex items-center justify-center py-4 mb-4">
                        <div className="text-center">
                            <div className="text-4xl font-extrabold text-gray-800 dark:text-white">{staffAttendance.present.length + staffAttendance.wfh.length} <span className="text-lg text-gray-400 font-medium">/ {staffAttendance.total}</span></div>
                            <p className="text-sm text-green-500 font-bold mt-1">Working Today</p>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                        {staffAttendance.present.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-transparent hover:border-green-200 transition-all">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.name}</p>
                                <span className="text-xs text-green-600 font-medium ml-auto">Present</span>
                            </div>
                        ))}
                        {staffAttendance.wfh.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-transparent hover:border-blue-200 transition-all">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.name}</p>
                                <span className="text-xs text-blue-600 font-medium ml-auto">WFH</span>
                            </div>
                        ))}
                        {staffAttendance.absent.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-transparent hover:border-red-200 transition-all">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.name}</p>
                                <span className="text-xs text-red-600 font-medium ml-auto">Absent</span>
                            </div>
                        ))}
                        {staffAttendance.total === 0 && <p className="text-gray-400 text-center text-xs">No staff data available.</p>}
                    </div>
                </div>

                {/* Lead Follow-ups (New) */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <ListTodo size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        Lead Follow-ups
                    </h3>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {leadFollowUps.length > 0 ? (
                            leadFollowUps.map((lead, idx) => (
                                <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border-l-4 border-orange-400">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{lead.name}</p>
                                        <p className="text-xs text-gray-500">{lead.phone}</p>
                                        <p className="text-xs font-bold text-orange-500 mt-1">
                                            {new Date(lead.followUpDate!).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(lead.followUpDate!).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button size="small" variant="ghost" className="text-xs text-blue-600 hover:bg-blue-50 h-7 px-2" onClick={() => onOpenLeadModal(lead)}>View</Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <CheckCircle className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No pending follow-ups.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Staff Performers (Existing, Moved) */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all lg:col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Award size={20} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        Top Staff Performers
                    </h3>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {topAdvisors.map((advisor, index) => (
                            <div key={advisor.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-yellow-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{advisor.name}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full text-sm">{advisor.count}</span>
                            </div>
                        ))}
                        {topAdvisors.length === 0 && <p className="text-gray-400 text-center py-4">No staff data available.</p>}
                    </div>
                </div>

                {/* Upcoming Renewals */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all lg:col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                            <Calendar size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        Upcoming Renewals
                    </h3>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {upcomingRenewals.length > 0 ? (
                            upcomingRenewals.map((renewal, idx) => (
                                <div key={`${renewal.memberId}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border-l-4 border-pink-400">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{renewal.memberName}</p>
                                        <p className="text-xs text-gray-500">Policy: {renewal.policyNo}</p>
                                        <p className="text-xs font-bold text-pink-500 mt-1">Due: {renewal.date.toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 dark:text-white">₹{renewal.amount.toLocaleString()}</p>
                                        <Button size="small" variant="ghost" className="text-xs text-blue-600 hover:bg-blue-50 h-6 px-2 mt-1">Remind</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <CheckCircle className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No renewals in next 30 days.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Split: Focus & Completions (EXISTING) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <TodaysFocus
                        members={members}
                        leads={leads}
                        notifications={notifications}
                        upsellOpportunities={upsellOpportunities}
                        onOpenModal={onOpenModal}
                        onOpenLeadModal={onOpenLeadModal}
                        dismissedFocusItems={dismissedFocusItems}
                        onDismissFocusItem={onDismissFocusItem}
                        focusItems={todaysFocusItems}
                        isLoading={isFocusLoading}
                        error={focusError}
                        onRefresh={onRefreshFocus}
                        permissions={permissions}
                    />
                </div>
                <div className="xl:col-span-1 flex flex-col">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 h-full flex flex-col transition-all hover:shadow-[0_15px_40px_rgb(0,0,0,0.12)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <ShieldCheck size={20} className="text-orange-500" />
                                </div>
                                Pending Completions
                            </h3>
                            {pendingMembers.length > 0 && (
                                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-xs font-black px-3 py-1.5 rounded-full animate-pulse shadow-sm">
                                    {pendingMembers.length} PENDING
                                </span>
                            )}
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar max-h-[400px]">
                            {pendingMembers.length > 0 ? (
                                pendingMembers.map((member, idx) => (
                                    <div key={member.id} className="group flex items-center justify-between gap-3 p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border border-transparent hover:border-brand-primary/20 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ transitionDelay: `${idx * 50}ms` }}>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-brand-primary transition-colors">{member.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                                <Calendar size={10} />
                                                Created {new Date(member.createdAt || 0).toLocaleDateString('en-GB')}
                                                {!isCurrentUserAdvisor && member.createdBy && (
                                                    <span className="text-gray-400 dark:text-gray-500"> • by {userMap.get(member.createdBy) || 'Unknown'}</span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            size="small"
                                            variant="secondary"
                                            onClick={() => onOpenModal(member, ModalTab.Policies)}
                                            disabled={permissions.policies !== 'modify' && permissions.policies !== 'create'}
                                            className="whitespace-nowrap flex-shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all shadow-sm"
                                        >
                                            Add Policy
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-12">
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-full mb-4 shadow-inner">
                                        <CheckCircle size={40} className="text-green-500" />
                                    </div>
                                    <p className="font-bold text-lg text-gray-700 dark:text-gray-300">All Clear!</p>
                                    <p className="text-sm mt-1 max-w-[200px] opacity-80">No new customers are waiting for policies.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Overview */}
            {currentUser && <TaskOverview
                tasks={allTasks}
                users={users}
                currentUser={currentUser}
                onViewAllTasks={() => navigate('/taskManagement')}
                onViewTask={(task) => setSelectedTask(task)}
                permissions={permissions}
            />}

            {/* Task Modal Container */}
            <TaskDetailModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                task={selectedTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                users={users}
                members={members}
                leads={leads}
                taskStatusMasters={taskStatusMasters}
                currentUser={currentUser}
                addToast={addToast}
                permissions={permissions}
                isReadOnly={isCurrentUserAdvisor}
            />
        </div>
    );
};

export default Dashboard;