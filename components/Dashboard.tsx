import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Member, UpsellOpportunity, Lead, ModalTab, Tab, User, TodaysFocusItem, Task, CustomerTier, TaskStatusMaster, Designation, AppModule, PermissionLevel, Role } from '../types.ts';
import TodaysFocus from './TodaysFocus.tsx';
import { Users, Bell, Shield, TrendingUp, Gem, Award, Star, ShieldCheck, CheckCircle, ListTodo, ArrowRight, Edit2, Trash2, X, Calendar, User as UserIcon, Briefcase, MessageSquare } from 'lucide-react';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';


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
}

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
      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
        isActive
          ? 'bg-brand-primary text-white shadow-sm'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <ListTodo size={20} className="text-brand-primary" />
          Task Overview
        </h3>
        <Button onClick={onViewAllTasks} variant="light" size="small">
          Manage All Tasks <ArrowRight size={14} />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <FilterButton label="Pending" isActive={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
            <FilterButton label="Completed" isActive={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
          </div>
          {(permissions?.taskManagement === 'view' || permissions?.taskManagement === 'modify') && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <FilterButton label="All" isActive={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
              <FilterButton label="Personal" isActive={typeFilter === 'personal'} onClick={() => setTypeFilter('personal')} />
              <FilterButton label="Customer" isActive={typeFilter === 'customer'} onClick={() => setTypeFilter('customer')} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400" title="Color Legend">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"></span> Personal</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"></span> Completed</div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 -mr-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={() => onViewTask(task)}
              className={`p-3 rounded-md border cursor-pointer flex items-center gap-3 transition-colors ${
                task.isCompleted
                  ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
              title={
                  task.isCompleted ? 'Completed Task' : 'Personal Task'
              }
            >
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  task.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {task.taskDescription}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className={isOverdue(task) ? 'font-bold text-red-500' : ''}>
                    Due: {new Date(task.expectedCompletionDateTime).toLocaleDateString('en-GB')}
                  </span>
                  <span>To: {userMap.get(task.primaryContactPerson || '') || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <CheckCircle size={32} className="mx-auto text-gray-300 dark:text-gray-500" />
            <p className="mt-2 font-medium">No tasks found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ members, leads, notifications, upsellOpportunities, onOpenModal, onOpenLeadModal, currentUser, users, dismissedFocusItems, onDismissFocusItem, allTasks, onUpdateTask, onDeleteTask, todaysFocusItems, isFocusLoading, focusError, onRefreshFocus, customerTiers, onViewTier, taskStatusMasters, addToast, designations, permissions, roles }) => {
    
    const navigate = useNavigate();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const undismissedNotificationCount = useMemo(() => {
        return notifications.filter(n => !n.dismissed).length;
    }, [notifications]);

    const totalActivePolicies = members.reduce((sum, member) => sum + member.policies.length, 0);
    const opportunitiesValue = upsellOpportunities.length;

    const customerDistribution = members.reduce((acc, member) => {
        acc[member.memberType] = (acc[member.memberType] || 0) + 1;
        return acc;
    }, {} as Record<Member['memberType'], number>);

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

    const StatCard: React.FC<{ icon: React.ReactElement<any>; title: string; value: string | number; subtext?: string; color: { bg: string; text: string; darkBg: string } }> = ({ icon, title, value, subtext, color }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 flex items-center gap-5 h-full">
            <div className={`p-3 rounded-full ${color.bg} dark:${color.darkBg}`}>
                {React.cloneElement(icon, { size: 24, className: color.text })}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );
    
    const TierCard: React.FC<{ icon: React.ReactElement<any>; title: string; count: number; color: any }> = ({ icon, title, count, color }) => (
        <div className={`p-4 rounded-lg flex items-center gap-4 ${color.bg} border ${color.border} dark:${color.darkBg} dark:${color.darkBorder}`}>
            <div className={`p-2 rounded-full ${color.iconBg} dark:${color.darkIconBg}`}>
                {React.cloneElement(icon, { size: 20, className: `${color.iconText} dark:${color.darkIconText}` })}
            </div>
            <div>
                <p className={`font-bold text-lg ${color.text} dark:${color.darkText}`}>{count}</p>
                <p className={`text-sm font-medium ${color.text} dark:${color.darkText}`}>{title}</p>
            </div>
        </div>
    );

    const tierIcons = [
        <Shield key="shield" />, 
        <Award key="award" />, 
        <Gem key="gem" />, 
        <Star key="star" />, 
        <ShieldCheck key="shield-check" />,
        <Users key="users" />
    ];
    const tierColors = [
        { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', iconBg: 'bg-white', iconText: 'text-gray-500', darkBg: 'bg-gray-800', darkBorder: 'border-gray-700', darkIconBg: 'bg-gray-700', darkIconText: 'text-gray-300', darkText: 'text-gray-200'},
        { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', iconBg: 'bg-white', iconText: 'text-yellow-500', darkBg: 'bg-yellow-900/20', darkBorder: 'border-yellow-800/30', darkIconBg: 'bg-yellow-900/30', darkIconText: 'text-yellow-300', darkText: 'text-yellow-200'},
        { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', iconBg: 'bg-white', iconText: 'text-blue-500', darkBg: 'bg-blue-900/20', darkBorder: 'border-blue-800/30', darkIconBg: 'bg-blue-900/30', darkIconText: 'text-blue-300', darkText: 'text-blue-200'},
        { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', iconBg: 'bg-white', iconText: 'text-purple-500', darkBg: 'bg-purple-900/20', darkBorder: 'border-purple-800/30', darkIconBg: 'bg-purple-900/30', darkIconText: 'text-purple-300', darkText: 'text-purple-200'},
        { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', iconBg: 'bg-white', iconText: 'text-green-500', darkBg: 'bg-green-900/20', darkBorder: 'border-green-800/30', darkIconBg: 'bg-green-900/30', darkIconText: 'text-green-300', darkText: 'text-green-200'},
        { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200', iconBg: 'bg-white', iconText: 'text-pink-500', darkBg: 'bg-pink-900/20', darkBorder: 'border-pink-800/30', darkIconBg: 'bg-pink-900/30', darkIconText: 'text-pink-300', darkText: 'text-pink-200'},
    ];

    const sortedTiers = useMemo(() => 
        [...customerTiers]
            .filter(tier => tier.active)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), 
    [customerTiers]);

    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's your business overview.</p>
                    </div>
                    <Button onClick={() => navigate('/chatbot')} variant="primary" className="flex-shrink-0">
                        <MessageSquare size={16} className="mr-2"/>
                        AI Chatbot
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button onClick={() => navigate('/customers')} className="text-left w-full transition-transform transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg">
                    <StatCard icon={<Users />} title="Customers" value={members.length} subtext={`${members.filter(m=>m.active).length} active`} color={{ bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'bg-blue-900/30' }} />
                </button>
                <button onClick={() => navigate('/actionHub')} className="text-left w-full transition-transform transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg">
                    <StatCard icon={<Bell />} title="Pending Notifications" value={undismissedNotificationCount} subtext="Birthdays, anniversaries & renewals" color={{ bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'bg-orange-900/30' }} />
                </button>
                <button onClick={() => navigate('/policies')} className="text-left w-full transition-transform transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg">
                    <StatCard icon={<Shield />} title="Active Policies" value={totalActivePolicies} subtext="Across all customers" color={{ bg: 'bg-green-100', text: 'text-green-600', darkBg: 'bg-green-900/30' }} />
                </button>
                
                {opportunitiesValue > 0 ? (
                    <button onClick={() => navigate('/actionHub')} className="text-left w-full transition-transform transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg">
                         <StatCard icon={<TrendingUp />} title="Opportunities" value={opportunitiesValue} subtext={`${opportunitiesValue} active opportunities`} color={{ bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'bg-purple-900/30' }} />
                    </button>
                ) : (
                    <div>
                         <StatCard icon={<TrendingUp />} title="Opportunities" value={opportunitiesValue} subtext={`${opportunitiesValue} active opportunities`} color={{ bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'bg-purple-900/30' }} />
                    </div>
                )}
            </div>

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
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <ShieldCheck size={20} className="text-orange-500" />
                                Completions
                            </h3>
                            {pendingMembers.length > 0 && (
                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-orange-900/50 dark:text-orange-200">
                                    {pendingMembers.length}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-2 -mr-2 max-h-80">
                            {pendingMembers.length > 0 ? (
                                pendingMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{member.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Created on {new Date(member.createdAt || 0).toLocaleDateString('en-GB')}
                                                {!isCurrentUserAdvisor && member.createdBy && (
                                                    <span className="text-gray-400 dark:text-gray-500"> by {userMap.get(member.createdBy) || 'Unknown'}</span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            size="small"
                                            variant="secondary"
                                            onClick={() => onOpenModal(member, ModalTab.Policies)}
                                            disabled={permissions.policies !== 'modify' && permissions.policies !== 'create'}
                                        >
                                            Add Policy
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-8 h-full">
                                    <CheckCircle size={32} className="text-green-500" />
                                    <p className="mt-2 font-semibold">All Clear!</p>
                                    <p className="text-sm">No new customers are waiting for policies.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {currentUser && <TaskOverview
                tasks={allTasks}
                users={users}
                currentUser={currentUser}
                onViewAllTasks={() => navigate('/taskManagement')}
                onViewTask={(task) => setSelectedTask(task)}
                permissions={permissions}
            />}

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Customer Distribution by Membership</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sortedTiers.map((tier, index) => (
                        <button
                            key={tier.id}
                            onClick={() => onViewTier(tier)}
                            className="text-left w-full transition-transform transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg"
                        >
                            <TierCard 
                                icon={tierIcons[index % tierIcons.length]}
                                title={tier.name}
                                count={customerDistribution[tier.name] || 0}
                                color={tierColors[index % tierColors.length]}
                            />
                        </button>
                    ))}
                </div>
            </div>

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