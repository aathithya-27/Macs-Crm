import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, User, Member, TaskStatusMaster, Branch, Lead, TaskMaster, Designation, Role, AppModule, PermissionLevel } from '../types.ts';
import { ListTodo, Plus, Edit2, Calendar, User as UserIcon, Briefcase, Table, LayoutGrid, Search, ArrowUp, ArrowDown, Trash2, Users, Building, GitCommit, RefreshCw, History, MessageSquare, Clock } from 'lucide-react';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import Modal from './ui/Modal.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import MultiSelectDropdown from './ui/MultiSelectDropdown.tsx';
import Pagination from './ui/Pagination.tsx';

interface TaskManagementProps {
    allTasks: Task[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onCreateTask: (task: Omit<Task, 'id'>) => void;
    onCreateBulkTask: (task: Omit<Task, 'id'>, advisorIds: string[]) => void;
    onOpenTask: (taskId: string) => void;
    users: User[];
    members: Member[];
    leads: Lead[];
    taskStatusMasters: TaskStatusMaster[];
    taskMasters: TaskMaster[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    currentUser: User | null;
    Branches: Branch[];
    onReassignTask: (taskId: string, newAdvisorId: string, reassignerId: string, remark?: string) => void;
    onUpdateTaskWithRemark: (task: Task, remark: string) => void;
    designations: Designation[];
    roles: Role[];
    permissions: { [key in AppModule]?: PermissionLevel };
}

interface TaskHistoryEntry {
    timestamp: string;
    action: 'Created' | 'Status Change' | 'Assigned' | 'Reassigned' | 'Remark Added';
    details: string;
    by: string;
    oldValue?: string;
    newValue?: string;
}

const ITEMS_PER_PAGE = 10;

const TaskHistoryModal: React.FC<{
    task: Task;
    users: User[];
    isOpen: boolean;
    onClose: () => void;
}> = ({ task, users, isOpen, onClose }) => {
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    
    const history: TaskHistoryEntry[] = useMemo(() => {
        const entries: TaskHistoryEntry[] = [];
        
        if (task.creationDateTime) {
            const creationLog = task.activityLog?.find(log => log.action === 'Created');
            const creatorId = creationLog?.by || task.originalAssigneeId || 'System';
            const originalAssigneeName = userMap.get(task.originalAssigneeId || '') || 'Unknown';
            
            let details = `Task "${task.taskDescription}" was created`;
            if (creatorId !== task.originalAssigneeId && task.originalAssigneeId) {
                details += ` and assigned to ${originalAssigneeName}`;
            }
            
            entries.push({
                timestamp: task.creationDateTime,
                action: 'Created',
                details,
                by: creatorId
            });
        }
        
        if (task.activityLog) {
            task.activityLog.forEach(log => {
                if (log.action === 'Created') return;
                
                entries.push({
                    timestamp: log.timestamp,
                    action: log.action as any,
                    details: log.details,
                    by: log.by
                });
            });
        }
        
        return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [task, userMap]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white flex items-center gap-2">
                    <History size={20} />
                    Task History
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">"{task.taskDescription}"</p>
            </div>
            <div className="p-6 overflow-y-auto flex-grow max-h-96">
                {history.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No history available</p>
                ) : (
                    <div className="space-y-4">
                        {history.map((entry, index) => (
                            <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {entry.action}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                    {entry.details}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    By: {userMap.get(entry.by) || entry.by}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};

const CompletionRemarkModal: React.FC<{
    task: Task;
    newStatus: string;
    statusName: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (remark: string) => void;
}> = ({ task, newStatus, statusName, isOpen, onClose, onConfirm }) => {
    const [remark, setRemark] = React.useState('');
    
    const handleConfirm = () => {
        if (!remark.trim()) {
            return;
        }
        onConfirm(remark.trim());
        setRemark('');
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white flex items-center gap-2">
                    <MessageSquare size={20} />
                    Task Completion Remark
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Moving task to "{statusName}" status
                </p>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Please provide a remark explaining why this task is being marked as "{statusName}":
                </p>
                <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Enter your remark here..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                />
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleConfirm} disabled={!remark.trim()}>
                    Confirm & Update Status
                </Button>
            </div>
        </Modal>
    );
};

const ReassignTaskModal: React.FC<{
    task: Task;
    advisors: User[];
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newAdvisorId: string, remark: string) => void;
}> = ({ task, advisors, isOpen, onClose, onConfirm }) => {
    const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');
    const [remark, setRemark] = useState<string>('');

    const advisorOptions = useMemo(() => {
        const sortedAdvisors = [...advisors].sort((a, b) => {
            const aIsAlternate = task.alternateContactPersons?.includes(a.id);
            const bIsAlternate = task.alternateContactPersons?.includes(b.id);
            if (aIsAlternate && !bIsAlternate) return -1;
            if (!aIsAlternate && bIsAlternate) return 1;
            return a.name.localeCompare(b.name);
        }).filter(adv => adv.id !== task.primaryContactPerson && adv.profile?.status === 'Active');

        return sortedAdvisors.map(adv => ({
            value: adv.id,
            label: `${adv.name} ${task.alternateContactPersons?.includes(adv.id) ? ' (Alternate)' : ''}`
        }));
    }, [advisors, task]);

    const handleConfirm = () => {
        if (selectedAdvisor && remark.trim()) {
            onConfirm(selectedAdvisor, remark.trim());
        }
    };

    const currentAssigneeName = advisors.find(a => a.id === task.primaryContactPerson)?.name || 'N/A';

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Reassign Task</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">"{task.taskDescription}"</p>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                <p className="text-sm">This task is currently assigned to: <strong className="text-gray-800 dark:text-white">{currentAssigneeName}</strong></p>
                <SearchableSelect
                    label="Assign to New Employee *"
                    options={advisorOptions}
                    value={selectedAdvisor}
                    onChange={setSelectedAdvisor}
                    placeholder="Select new assignee..."
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Reassignment *</label>
                    <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Please provide a reason for reassigning this task..."
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleConfirm} disabled={!selectedAdvisor || !remark.trim()}>Confirm Reassignment</Button>
            </div>
        </Modal>
    );
};

const TaskCard: React.FC<{
    task: Task;
    users: User[];
    memberMap: Map<string, string>;
    leadMap: Map<string, string>;
    taskStatusMasters: TaskStatusMaster[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onOpenTask: (taskId: string) => void;
    onOpenModal: (task: Task) => void;
    onReassign: (task: Task) => void;
    onShowHistory: (task: Task) => void;
    currentUser: User | null;
    activeView: 'all' | 'customer' | 'personal';
    roles: Role[];
    canModify: boolean;
    onUpdateTaskWithRemark?: (task: Task, remark: string) => void;
}> = ({ task, users, memberMap, leadMap, taskStatusMasters, onUpdateTask, onDeleteTask, onOpenTask, onOpenModal, onReassign, onShowHistory, currentUser, activeView, roles, canModify, onUpdateTaskWithRemark }) => {

    const userRole = useMemo(() => roles.find(r => r.id === currentUser?.roleId), [currentUser, roles]);
    const isUserAdvisor = userRole?.isAdvisor === true;

    const isAssignedToCurrentUser = task.primaryContactPerson === currentUser?.id;
    
    const isJustCreated = task.statusId === 'ts-created';
    
    const isScheduledForFuture = task.taskType === 'Auto' && task.scheduledCreationDateTime && new Date(task.scheduledCreationDateTime) > new Date();
    
    const showBlurred = isUserAdvisor && isAssignedToCurrentUser && isJustCreated && !isScheduledForFuture;

    const currentStatusInfo = useMemo(() => taskStatusMasters.find(s => s.id === task.statusId), [taskStatusMasters, task.statusId]);
    const isEndState = currentStatusInfo?.isEndState === true;

    const isOverdue = !isEndState && !isScheduledForFuture && new Date(task.expectedCompletionDateTime) < new Date();

    const statusName = isScheduledForFuture 
        ? 'Scheduled' 
        : (isJustCreated ? 'Task Created' : (currentStatusInfo?.name || 'Unknown'));
    
    const [completionModal, setCompletionModal] = React.useState<{isOpen: boolean; newStatus: string; statusName: string} | null>(null);
    
    const handleStatusChange = (newStatusId: string) => {
        const newStatusInfo = taskStatusMasters.find(s => s.id === newStatusId);
        const isNowEndState = newStatusInfo?.isEndState;
        
        if (isNowEndState) {
            setCompletionModal({
                isOpen: true,
                newStatus: newStatusId,
                statusName: newStatusInfo?.name || 'Unknown'
            });
        } else {
            onUpdateTask({ ...task, statusId: newStatusId, isCompleted: !!isNowEndState });
        }
    };
    
    const handleCompletionConfirm = (remark: string) => {
        if (completionModal) {
            const updatedTask = { 
                ...task, 
                statusId: completionModal.newStatus, 
                isCompleted: true 
            };
            
            if (onUpdateTaskWithRemark) {
                onUpdateTaskWithRemark(updatedTask, remark);
            } else {
                onUpdateTask(updatedTask);
            }
        }
        setCompletionModal(null);
    };
    
    const statusColor = isScheduledForFuture ? 'text-cyan-500 dark:text-cyan-400' : (task.isCompleted ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400');

    const clientName = task.memberId ? memberMap.get(task.memberId) : leadMap.get(task.leadId || '');
    const clientType = task.memberId ? 'Customer' : 'Lead';
    
    const primaryAssignee = useMemo(() => users.find(u => u.id === task.primaryContactPerson), [users, task.primaryContactPerson]);
    const originalAssignee = useMemo(() => users.find(u => u.id === task.originalAssigneeId), [users, task.originalAssigneeId]);
    const alternateAssignees = useMemo(() => 
        (task.alternateContactPersons || []).map(id => users.find(u => u.id === id)).filter(Boolean) as User[],
    [users, task.alternateContactPersons]);

    const isCustomerTask = !!task.memberId || !!task.leadId;

    const cardBorderClass = activeView === 'all'
        ? (isCustomerTask ? 'border-l-4 border-blue-400 dark:border-blue-600' : 'border-l-4 border-purple-400 dark:border-purple-600')
        : 'border';

    return (
        <div className="relative">
            {showBlurred && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
                    <Button variant="primary" onClick={() => onOpenTask(task.id)}>
                        Open Task
                    </Button>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-300">This is a new task assignment.</p>
                </div>
            )}
            <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:border-gray-700 flex flex-col gap-3 transition-all ${cardBorderClass} ${showBlurred ? 'blur-sm' : ''}`}>
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800 dark:text-white flex-1 pr-2">{task.taskDescription}</p>
                    <div className="flex items-center gap-1">
                        <Button variant="light" size="small" className="!p-1.5 h-7 w-7" onClick={() => onShowHistory(task)} title="View History">
                            <History size={14}/>
                        </Button>
                        {canModify && (
                            <Button variant="light" size="small" className="!p-1.5 h-7 w-7" onClick={() => onOpenModal(task)}>
                                <Edit2 size={14}/>
                            </Button>
                        )}
                        {(isUserAdvisor || canModify) && !isEndState && !isScheduledForFuture && (
                             <Button variant="light" size="small" className="!p-1.5 h-7 w-7" onClick={() => onReassign(task)} title="Reassign Task">
                                <GitCommit size={14} />
                            </Button>
                        )}
                        {canModify && (
                            <Button variant="danger" size="small" className="!p-1.5 h-7 w-7" onClick={() => onDeleteTask(task.id)} title="Delete Task">
                                <Trash2 size={14} />
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-xs font-mono text-gray-400 dark:text-gray-500">ID: {task.id}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5" title="Due Date">
                        <Calendar size={12} />
                        <span>{new Date(task.expectedCompletionDateTime).toLocaleDateString()}</span>
                        {isOverdue && <span className="px-1.5 py-0.5 text-white bg-red-500 rounded-full text-[10px] font-bold">OVERDUE</span>}
                    </div>
                    {}
                    <div className="flex items-center gap-1.5" title={`Primary: ${primaryAssignee?.name || 'N/A'}${alternateAssignees.length > 0 ? ` | Alternates: ${alternateAssignees.map(a => a.name).join(', ')}`: ''}`}>
                        <UserIcon size={12} />
                        <div className="flex items-center gap-1">
                            <span>{primaryAssignee?.name || 'N/A'}</span>
                            {primaryAssignee?.profile?.status === 'Inactive' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Inactive"></span>}
                        </div>
                        {originalAssignee && (
                            <span title={`Originally assigned to ${originalAssignee.name}`}>
                                <RefreshCw size={12} className="text-blue-500" />
                            </span>
                        )}
                        {alternateAssignees.length > 0 && <span className="text-xs text-gray-400" title={alternateAssignees.map(a=>a.name).join(', ')}>(+{alternateAssignees.length})</span>}
                    </div>
                    {}
                    {clientName && <div className="flex items-center gap-1.5" title={`Related ${clientType}`}><Briefcase size={12} /><span>{clientName}</span></div>}
                </div>
                <div className="pt-3 border-t dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        {isAssignedToCurrentUser && !isEndState && !isJustCreated && !isScheduledForFuture ? (
                            <select
                                value={task.statusId || ''}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className={`font-semibold text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 focus:ring-blue-600 focus:border-blue-600 py-1 ${statusColor}`}
                            >
                                {currentStatusInfo && currentStatusInfo.active && <option key={currentStatusInfo.id} value={currentStatusInfo.id}>{currentStatusInfo.name}</option>}
                                {taskStatusMasters.filter(s => s.active && s.id !== task.statusId).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        ) : (
                             <p className={`font-semibold text-sm flex items-center gap-1.5 ${statusColor}`}>
                                {isScheduledForFuture && <Clock size={12}/>}
                                {statusName}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {completionModal && (
                <CompletionRemarkModal
                    task={task}
                    newStatus={completionModal.newStatus}
                    statusName={completionModal.statusName}
                    isOpen={completionModal.isOpen}
                    onClose={() => setCompletionModal(null)}
                    onConfirm={handleCompletionConfirm}
                />
            )}
        </div>
    );
};

const TaskTable: React.FC<{
    tasks: Task[];
    users: User[];
    memberMap: Map<string, string>;
    leadMap: Map<string, string>;
    branchMap: Map<string, string>;
    taskStatusMasters: TaskStatusMaster[];
    onOpenModal: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onReassign: (task: Task) => void;
    onShowHistory: (task: Task) => void;
    currentUser: User | null;
    onSort: (key: string) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    activeView: 'all' | 'customer' | 'personal';
    canModify: boolean;
    currentPage: number;
}> = ({ tasks, users, memberMap, leadMap, branchMap, taskStatusMasters, onOpenModal, onDeleteTask, onReassign, onShowHistory, currentUser, onSort, sortConfig, activeView, canModify, currentPage }) => {

    const SortableHeader = ({ sortKey, label }: { sortKey: string, label: string }) => (
        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            <button onClick={() => onSort(sortKey)} className="group inline-flex items-center">
                {label}
                <span className={`ml-2 flex-none rounded text-gray-400 ${sortConfig.key === sortKey ? 'group-hover:bg-gray-200 dark:group-hover:bg-gray-600' : ''}`}>
                    {sortConfig.key === sortKey ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                       <ArrowDown size={14} className="opacity-0 group-hover:opacity-50" />
                    )}
                </span>
            </button>
        </th>
    );

    return (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Task ID</th>
                    {activeView === 'all' && <SortableHeader sortKey="taskType" label="Type" />}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Task Description</th>
                    <SortableHeader sortKey="assignedTo" label="Assigned To" />
                    <SortableHeader sortKey="branch" label="Branch" />
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer / Lead</th>
                    <SortableHeader sortKey="creationDateTime" label="Creation Date" />
                    <SortableHeader sortKey="expectedCompletionDateTime" label="Due Date" />
                    <SortableHeader sortKey="status" label="Status" />
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task, index) => {
                    const currentStatusInfo = taskStatusMasters.find(s => s.id === task.statusId);
                    const isEndState = currentStatusInfo?.isEndState === true;
                    const isScheduledForFuture = task.taskType === 'Auto' && task.scheduledCreationDateTime && new Date(task.scheduledCreationDateTime) > new Date();
                    const isOverdue = !isEndState && !isScheduledForFuture && new Date(task.expectedCompletionDateTime) < new Date();
                    const employee = users.find(u => u.id === task.primaryContactPerson);
                    const branch_name = employee?.profile?.employeebranch_id ? branchMap.get(employee.profile.employeebranch_id) : 'N/A';
                    const clientName = task.memberId ? memberMap.get(task.memberId) : (task.leadId ? leadMap.get(task.leadId) : 'Personal Task');
                    const alternates = (task.alternateContactPersons || []).map(id => users.find(u=>u.id === id)?.name).filter(Boolean).join(', ');
                    const title = alternates ? `Alternate: ${alternates}` : undefined;
                    const canReassign = (canModify || task.primaryContactPerson === currentUser?.id) && !isEndState && !isScheduledForFuture;
                    const isCustomerTask = !!task.memberId || !!task.leadId;
                    const originalAssignee = users.find(u => u.id === task.originalAssigneeId);
                    const statusName = isScheduledForFuture ? 'Scheduled' : (task.statusId === 'ts-created' ? 'Task Created' : (currentStatusInfo?.name || 'Unknown'));

                    return (
                        <tr key={task.id}>
                             <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                             <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{task.id}</td>
                             {activeView === 'all' && (
                                <td className="px-4 py-3 text-sm">
                                    {isCustomerTask ? (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Customer</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">Personal</span>
                                    )}
                                </td>
                             )}
                                                      
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{task.taskDescription}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {}
                                 <div className="flex items-center gap-1" title={title}>
                                    <div className="flex items-center gap-1">
                                        <span>{employee?.name || 'N/A'}</span>
                                        {employee?.profile?.status === 'Inactive' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Inactive"></span>}
                                    </div>
                                    {originalAssignee && (
                                        <span title={`Originally assigned to ${originalAssignee.name}`}>
                                            <RefreshCw size={12} className="text-blue-500" />
                                        </span>
                                    )}
                                    {alternates && <span className="text-xs text-gray-400"> (+{task.alternateContactPersons?.length})</span>}
                                </div>
                                {}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{branch_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{clientName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{task.creationDateTime ? new Date(task.creationDateTime).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(task.expectedCompletionDateTime).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    {isScheduledForFuture && <Clock size={12} className="text-cyan-500"/>}
                                    <span>{statusName}</span>
                                    {isOverdue && <span className="px-1.5 py-0.5 text-white bg-red-500 rounded-full text-[10px] font-bold">OVERDUE</span>}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Button size="small" variant="light" onClick={() => onShowHistory(task)} title="View History">
                                        <History size={14} />
                                    </Button>
                                    {canReassign && (
                                        <Button size="small" variant="secondary" onClick={() => onReassign(task)} title="Reassign Task">
                                            <GitCommit size={14} /> Reassign
                                        </Button>
                                    )}
                                    {canModify && (
                                        <Button size="small" variant="light" onClick={() => onOpenModal(task)}><Edit2 size={14}/> Edit</Button>
                                    )}
                                    {canModify && (
                                        <Button size="small" variant="danger" className="!p-1.5 h-7 w-7" onClick={() => onDeleteTask(task.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
    );
};


export const TaskManagement: React.FC<TaskManagementProps> = ({
    allTasks, onUpdateTask, onDeleteTask, onCreateTask, onCreateBulkTask, onOpenTask,
    users, members, leads, taskStatusMasters, taskMasters, addToast, currentUser, 
    Branches, onReassignTask, onUpdateTaskWithRemark, designations, roles, permissions
}) => {
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [reassignTask, setReassignTask] = useState<Task | null>(null);
    const [historyTask, setHistoryTask] = useState<Task | null>(null);


    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [advisorFilter, setAdvisorFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'expectedCompletionDateTime', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    const [assignmentType, setAssignmentType] = useState<'individual' | 'allAdvisors'>('individual');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedBranchAdvisors, setSelectedBranchAdvisors] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<'all' | 'customer' | 'personal'>('all');

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const memberMap = useMemo(() => new Map(members.map(m => [m.id, m.name])), [members]);
    const leadMap = useMemo(() => new Map(leads.map(l => [l.id, l.name])), [leads]);
    
    const advisors = useMemo(() => {
        const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
        return users.filter(u => u.roleId && advisorRoleIds.has(u.roleId) && u.profile?.status === 'Active');
    }, [users, roles]);

    const branchMap = useMemo(() => new Map(Branches.map(b => [b.id, b.branch_name])), [Branches]);
    
    const isCurrentUserAdvisor = useMemo(() => roles.find(r => r.id === currentUser?.roleId)?.isAdvisor === true, [currentUser, roles]);
    const canCreate = (permissions?.taskManagement === 'create' || permissions?.taskManagement === 'modify') && !isCurrentUserAdvisor;
    const canModify = permissions?.taskManagement === 'modify';

    const advisorsForFilter = useMemo(() => {
        const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
        const allAdvisors = users.filter(u => u.roleId && advisorRoleIds.has(u.roleId));
        
        if (branchFilter === 'all') {
            return allAdvisors;
        }
        return allAdvisors.filter(adv => adv.profile?.employeebranch_id === branchFilter);
    }, [users, roles, branchFilter]);
    
    const advisorsForAssignment = useMemo(() => {
        if (!selectedBranch) {
            return advisors;
        }
        return advisors.filter(adv => adv.profile?.employeebranch_id === selectedBranch);
    }, [advisors, selectedBranch]);
    
    const manualTaskMaster = useMemo(() => taskMasters.find(tm => tm.name.toLowerCase() === 'manual' && tm.active), [taskMasters]);
    const autoTaskMaster = useMemo(() => taskMasters.find(tm => tm.name.toLowerCase() === 'auto' && tm.active), [taskMasters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, branchFilter, advisorFilter, activeView, viewMode]);

    useEffect(() => {
        setSelectedBranchAdvisors([]);
    }, [selectedBranches]);
    
    useEffect(() => {
        if (editingTask && !editingTask.id && assignmentType === 'individual') {
            setEditingTask(prev => prev ? { ...prev, primaryContactPerson: undefined } : null);
        }
    }, [selectedBranch, assignmentType]);


    const filteredAndSortedTasks = useMemo(() => {
        let tasks: Task[] = [];
        
        const now = new Date();

        if (isCurrentUserAdvisor) {
            tasks = allTasks.filter(task => task.primaryContactPerson === currentUser?.id);
        } else if (permissions?.taskManagement === 'modify' || permissions?.taskManagement === 'view') {
            tasks = [...allTasks];
        } else {
            tasks = allTasks.filter(task => task.primaryContactPerson === currentUser?.id);
        }
        
        tasks = tasks.filter(task => {
            const isScheduled = task.taskType === 'Auto' && task.scheduledCreationDateTime;
            if (!isScheduled) {
                return true; 
            }
            
            const isTriggered = new Date(task.scheduledCreationDateTime!) <= now;
            
            if (task.primaryContactPerson === currentUser?.id && !isTriggered) {
                return false;
            }
            
            return true;
        });


        if (activeView === 'customer') {
            tasks = tasks.filter(task => task.memberId || task.leadId);
        } else if (activeView === 'personal') {
            tasks = tasks.filter(task => !task.memberId && !task.leadId);
        }

        tasks = tasks.filter(task => {
            const searchMatch = !searchQuery || task.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());
            
            const isScheduledForFuture = task.taskType === 'Auto' && task.scheduledCreationDateTime && new Date(task.scheduledCreationDateTime) > now;
            const statusMatch = statusFilter === 'all' || 
                (statusFilter === 'scheduled' && isScheduledForFuture) ||
                (statusFilter !== 'scheduled' && task.statusId === statusFilter);
            
            const advisorMatch = advisorFilter === 'all' || task.primaryContactPerson === advisorFilter;
            const employeeForBranch = users.find(u => u.id === task.primaryContactPerson);
            const branch_id = employeeForBranch?.profile?.employeebranch_id;
            const branchMatch = branchFilter === 'all' || branch_id === branchFilter;
            return searchMatch && statusMatch && advisorMatch && branchMatch;
        });

        tasks.sort((a, b) => {
            const { key, direction } = sortConfig;
            let aValue: any;
            let bValue: any;

            switch(key) {
                case 'assignedTo':
                    aValue = users.find(u=>u.id === a.primaryContactPerson)?.name || 'Z';
                    bValue = users.find(u=>u.id === b.primaryContactPerson)?.name || 'Z';
                    break;
                case 'status':
                    const aIsScheduled = a.taskType === 'Auto' && a.scheduledCreationDateTime && new Date(a.scheduledCreationDateTime) > now;
                    const bIsScheduled = b.taskType === 'Auto' && b.scheduledCreationDateTime && new Date(b.scheduledCreationDateTime) > now;

                    const aStatusName = aIsScheduled ? 'Scheduled' : (a.statusId === 'ts-created' ? 'Task Created' : taskStatusMasters.find(s => s.id === a.statusId)?.name || 'Z');
                    const bStatusName = bIsScheduled ? 'Scheduled' : (b.statusId === 'ts-created' ? 'Task Created' : taskStatusMasters.find(s => s.id === b.statusId)?.name || 'Z');
                    aValue = aStatusName;
                    bValue = bStatusName;
                    break;
                case 'branch':
                    const aAdvisor = users.find(u => u.id === a.primaryContactPerson);
                    const bAdvisor = users.find(u => u.id === b.primaryContactPerson);
                    aValue = branchMap.get(aAdvisor?.profile?.employeebranch_id || '') || 'Z';
                    bValue = branchMap.get(bAdvisor?.profile?.employeebranch_id || '') || 'Z';
                    break;
                case 'taskType':
                    aValue = a.memberId || a.leadId ? 'Customer' : 'Personal';
                    bValue = b.memberId || b.leadId ? 'Customer' : 'Personal';
                    break;
                default:
                    aValue = a[key as keyof Task] ? new Date(a[key as keyof Task] as string).getTime() : 0;
                    bValue = b[key as keyof Task] ? new Date(b[key as keyof Task] as string).getTime() : 0;
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return tasks;
   
    }, [allTasks, currentUser, isCurrentUserAdvisor, permissions, searchQuery, statusFilter, advisorFilter, branchFilter, sortConfig, users, taskStatusMasters, branchMap, activeView]);

    const totalPages = Math.ceil(filteredAndSortedTasks.length / ITEMS_PER_PAGE);
    const currentTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredAndSortedTasks]);


    const handleOpenModal = (task: Task | null = null) => {
        if (!task && !manualTaskMaster && !autoTaskMaster) {
            addToast("No active task types available. Please enable 'Auto' or 'Manual' task types in Master Data.", 'error');
            return; 
        }
        
        if (task) {
            if (task.statusId === 'ts-created' && task.primaryContactPerson === currentUser?.id) {
                const isScheduledForFuture = task.taskType === 'Auto' && task.scheduledCreationDateTime && new Date(task.scheduledCreationDateTime) > new Date();
                if (!isScheduledForFuture) {
                    onOpenTask(task.id);
                }
            }
        }
        
        const defaultTaskType = manualTaskMaster ? 'Manual' : (autoTaskMaster ? 'Auto' : 'Manual');
        const todayStr = new Date().toISOString().split('T')[0];

        setEditingTask(task ? { ...task } : {
            triggeringPoint: 'Manual', 
            taskDescription: '', 
            expectedCompletionDateTime: todayStr,
            scheduledCreationDateTime: todayStr,
            isCompleted: false,
            taskType: defaultTaskType,
            taskTime: '09:00',
            primaryContactPerson: !canModify ? currentUser!.id : undefined,
        });

        setAssignmentType('individual');
        setSelectedBranch('');
        setSelectedBranches([]);
        setSelectedBranchAdvisors([]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleSaveTask = () => {
        if (!editingTask || !editingTask.taskDescription?.trim()) {
            addToast('Task description is required.', 'error');
            return;
        }

        if (assignmentType === 'individual' && !editingTask.primaryContactPerson) {
            addToast('Please assign the task to an employee.', 'error');
            return;
        }

        if (assignmentType === 'allAdvisors' && selectedBranchAdvisors.length === 0) {
            addToast('Please select at least one employee for assignment.', 'error');
            return;
        }

        if (isCurrentUserAdvisor && !editingTask.memberId && !editingTask.leadId) {
            addToast('Please select a customer or lead for the task.', 'error');
            return;
        }

        let scheduledDateTime: string | undefined = undefined;
        if (editingTask.taskType === 'Auto') {
            const creationDateStr = editingTask.scheduledCreationDateTime?.split('T')[0];
            if (!creationDateStr) {
                addToast('Task Creation Date is required for Auto tasks.', 'error');
                return;
            }
            
            const dueDateStr = editingTask.expectedCompletionDateTime?.split('T')[0];
            if (dueDateStr && dueDateStr < creationDateStr) {
                 addToast('Due Date cannot be before the Task Creation Date.', 'error');
                 return;
            }
            
            const time = editingTask.taskTime || '00:00';
            scheduledDateTime = `${creationDateStr}T${time}:00`;
        }

        const taskToSave = {
            ...editingTask,
            expectedCompletionDateTime: editingTask.expectedCompletionDateTime || new Date().toISOString(),
            taskType: editingTask.taskType || 'Manual',
            scheduledCreationDateTime: scheduledDateTime,
        };
        
        if (taskToSave.taskType === 'Manual') {
            taskToSave.scheduledCreationDateTime = undefined;
        }


        if (editingTask.id) {
            onUpdateTask(taskToSave as Task);
            addToast('Task updated successfully.', 'success');
        } else {
            const { id, ...createData } = taskToSave;

            if (isCurrentUserAdvisor) {
                onCreateTask(createData as Omit<Task, 'id'>);
                addToast('Task created successfully.', 'success');
            } else {
                let successMessage = 'Task created successfully.';
                if (assignmentType === 'individual') {
                    onCreateTask(createData as Omit<Task, 'id'>);
                } else if (assignmentType === 'allAdvisors') {
                    if (selectedBranchAdvisors.length > 0) {
                        onCreateBulkTask(createData as Omit<Task, 'id'>, selectedBranchAdvisors);
                        successMessage = `Task assigned to ${selectedBranchAdvisors.length} employee(s).`;
                    } else {
                        addToast('No employees selected for assignment.', 'error');
                        return;
                    }
                }
                addToast(successMessage, 'success');
            }
        }
        handleCloseModal();
    };


    const handleSort = (key: string) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };
    
    const advisorOptions = useMemo(() => 
        advisorsForAssignment.map(adv => ({ 
            value: adv.id, 
            label: adv.profile?.status === 'Inactive' ? `${adv.name} 🔴` : adv.name 
        })), 
    [advisorsForAssignment]);

    const advisorsInSelectedBranches = useMemo(() => {
        if (selectedBranches.length === 0) return [];
        return advisors
            .filter(a => a.profile?.employeebranch_id && selectedBranches.includes(a.profile.employeebranch_id))
            .map(adv => ({ 
                value: adv.id, 
                label: adv.profile?.status === 'Inactive' ? `${adv.name} 🔴` : adv.name 
            }));
    }, [advisors, selectedBranches]);

    const clientOptions = useMemo(() => {
        const memberOpts = members.map(mem => ({ value: `member:${mem.id}`, label: `${mem.name} (Customer)` }));
        const leadOpts = leads.map(lead => ({ value: `lead:${lead.id}`, label: `${lead.name} (Lead)` }));
        return [{ value: '', label: 'None (Personal Task)' }, ...memberOpts, ...leadOpts];
    }, [members, leads]);

    const selectedClientValue = useMemo(() => {
        if (editingTask?.memberId) return `member:${editingTask.memberId}`;
        if (editingTask?.leadId) return `lead:${editingTask.leadId}`;
        return '';
    }, [editingTask]);

    const handleClientChange = (value: string) => {
        if (!editingTask) return;

        if (!value) {
            setEditingTask(prev => ({ ...prev, memberId: undefined, leadId: undefined }));
            return;
        }

        const [type, id] = value.split(':');
        if (type === 'member') {
            setEditingTask(prev => ({ ...prev, memberId: id, leadId: undefined }));
        } else if (type === 'lead') {
            const selectedLead = leads.find(l => l.id === id);
            if (selectedLead && selectedLead.assignedTo) {
                setEditingTask(prev => ({
                    ...prev,
                    memberId: undefined,
                    leadId: id,
                    primaryContactPerson: selectedLead.assignedTo
                }));
            } else {
                setEditingTask(prev => ({ ...prev, memberId: undefined, leadId: id }));
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Task Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage all operational tasks.</p>
                </div>
                 {canCreate && (
                    <Button onClick={() => handleOpenModal(null)} variant="success">
                        <Plus size={16} /> Create New Task
                    </Button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                    <button onClick={() => setActiveView('all')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === 'all' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>All Tasks</button>
                    <button onClick={() => setActiveView('customer')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === 'customer' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Customer Tasks</button>
                    <button onClick={() => setActiveView('personal')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === 'personal' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Personal Tasks</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Tasks</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">All Statuses</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="ts-created">Task Created</option>
                            {taskStatusMasters.filter(status => status.active).map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                        </select>
                    </div>
                     {(permissions?.taskManagement === 'modify' || permissions?.taskManagement === 'view') && (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                                <select
                                    value={branchFilter}
                                    onChange={(e) => { setBranchFilter(e.target.value); setAdvisorFilter('all'); }}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="all">All Branches</option>
                                    {Branches.map(branch => <option key={branch.id} value={branch.id}>{branch.branch_name}</option>)}
                                </select>
                            </div>
                            {}
                            <div>
                                <SearchableSelect
                                    label="Employee"
                                    options={[
                                        { value: 'all', label: 'All Employees' },
                                        ...advisorsForFilter.map(adv => ({ 
                                            value: adv.id, 
                                            label: adv.profile?.status === 'Inactive' ? `${adv.name} 🔴` : adv.name 
                                        }))
                                    ]}
                                    value={advisorFilter}
                                    onChange={setAdvisorFilter}
                                    placeholder="Select an Employee..."
                                />
                            </div>
                            {}
                        </>
                    )}
                </div>
                 <div className="flex justify-end">
                     {(permissions?.taskManagement === 'modify' || permissions?.taskManagement === 'view') && (
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
                            <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-brand-primary dark:bg-gray-700' : 'text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-800'}`} aria-label="Card View"><LayoutGrid size={16}/></button>
                            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-brand-primary dark:bg-gray-700' : 'text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-800'}`} aria-label="Table View"><Table size={16}/></button>
                        </div>
                     )}
                </div>
            </div>

            {viewMode === 'table' && (permissions?.taskManagement === 'modify' || permissions?.taskManagement === 'view') ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <TaskTable tasks={currentTasks} users={users} memberMap={memberMap} leadMap={leadMap} branchMap={branchMap} taskStatusMasters={taskStatusMasters} onOpenModal={handleOpenModal} onDeleteTask={onDeleteTask} currentUser={currentUser} onSort={handleSort} sortConfig={sortConfig} onReassign={setReassignTask} onShowHistory={setHistoryTask} activeView={activeView} canModify={canModify} currentPage={currentPage} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            users={users}
                            memberMap={memberMap}
                            leadMap={leadMap}
                            taskStatusMasters={taskStatusMasters}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onOpenTask={onOpenTask}
                            onOpenModal={handleOpenModal}
                            onReassign={setReassignTask}
                            onShowHistory={setHistoryTask}
                            currentUser={currentUser}
                            activeView={activeView}
                            roles={roles}
                            canModify={canModify}
                            onUpdateTaskWithRemark={onUpdateTaskWithRemark}
                        />
                    ))}
                </div>
            )}

            {filteredAndSortedTasks.length === 0 && (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    <ListTodo size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
                    <p className="mt-2 text-sm font-semibold">No Tasks Found</p>
                    <p className="mt-1 text-xs">No tasks match the current filter.</p>
                </div>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredAndSortedTasks.length}
                />
            )}

             {isModalOpen && editingTask && (
                 <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-brand-dark dark:text-white">{editingTask.id ? 'Edit Task' : 'Create Task'}</h2>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow space-y-4">
                         <Input
                            label="Task Description *"
                            value={editingTask.taskDescription || ''}
                            onChange={(e) => setEditingTask({...editingTask, taskDescription: e.target.value})}
                            disabled={editingTask.id ? !canModify : !canCreate}
                        />
                        {canCreate && !editingTask.id && (
                            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignment Type</label>
                                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                        <button type="button" onClick={() => setAssignmentType('individual')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'individual' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}><UserIcon size={14}/> Individual</button>
                                        <button type="button" onClick={() => setAssignmentType('allAdvisors')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'allAdvisors' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}><Users size={14}/> All Advisors</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {assignmentType === 'individual' && (
                            <>
                                <SearchableSelect
                                    label="Select Branch"
                                    options={Branches.map(b => ({ value: b.id, label: b.branch_name }))}
                                    value={selectedBranch}
                                    onChange={setSelectedBranch}
                                    placeholder="Select branch to filter employees..."
                                    disabled={editingTask.id ? !canModify : !canCreate}
                                />
                                <SearchableSelect
                                    label="Assigned To (Primary) *"
                                    options={advisorOptions}
                                    value={editingTask.primaryContactPerson || ''}
                                    onChange={(value) => setEditingTask({...editingTask, primaryContactPerson: value})}
                                    placeholder={selectedBranch ? "Select Employee..." : "Select branch first..."}
                                    disabled={editingTask.id ? !canModify : (!canCreate || !selectedBranch)}
                                />
                            </>
                        )}
                        {assignmentType === 'allAdvisors' && (
                            <>
                                <MultiSelectDropdown
                                    label="Select Branches"
                                    options={Branches.map(b => ({ value: b.id, label: b.branch_name }))}
                                    selectedValues={selectedBranches}
                                    onChange={setSelectedBranches}
                                />
                                {selectedBranches.length > 0 && (
                                    <MultiSelectDropdown
                                        label="Select Employee(s) *"
                                        options={advisorsInSelectedBranches}
                                        selectedValues={selectedBranchAdvisors}
                                        onChange={setSelectedBranchAdvisors}
                                    />
                                )}
                            </>
                        )}
                        {canModify && assignmentType === 'individual' && (
                           <MultiSelectDropdown
                                label="Alternate Employees"
                                options={advisorOptions.filter(opt => opt.value !== editingTask.primaryContactPerson)}
                                selectedValues={editingTask.alternateContactPersons || []}
                                onChange={(values) => setEditingTask(prev => prev ? { ...prev, alternateContactPersons: values } : null)}
                            />
                        )}
                        <SearchableSelect
                            label={`Related Customer / Lead ${isCurrentUserAdvisor ? '*' : '(Optional)'}`}
                            options={clientOptions}
                            value={selectedClientValue}
                            onChange={handleClientChange}
                            placeholder="None (Personal Task)"
                            disabled={editingTask.id ? !canModify : !canCreate}
                        />
                        {(manualTaskMaster || autoTaskMaster) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                                <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                    {manualTaskMaster && (
                                        <button type="button" onClick={() => (editingTask.id ? !canModify : !canCreate) ? null : setEditingTask({...editingTask, taskType: 'Manual'})} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${editingTask.taskType === 'Manual' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`} disabled={editingTask.id ? !canModify : !canCreate}>Manual</button>
                                    )}
                                    {autoTaskMaster && (
                                        <button type="button" onClick={() => (editingTask.id ? !canModify : !canCreate) ? null : setEditingTask({...editingTask, taskType: 'Auto'})} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${editingTask.taskType === 'Auto' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`} disabled={editingTask.id ? !canModify : !canCreate}>Auto</button>
                                    )}
                                </div>
                            </div>
                        )}
                        {editingTask.taskType === 'Auto' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Task Creation Date *"
                                    type="date"
                                    value={editingTask.scheduledCreationDateTime?.split('T')[0] || ''}
                                    onChange={(e) => setEditingTask({...editingTask, scheduledCreationDateTime: e.target.value})}
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={editingTask.id ? !canModify : !canCreate}
                                />
                                <Input
                                    label="Task Time"
                                    type="time"
                                    value={editingTask.taskTime || ''}
                                    onChange={(e) => setEditingTask({...editingTask, taskTime: e.target.value})}
                                    disabled={editingTask.id ? !canModify : !canCreate}
                                />
                            </div>
                        )}
                        <Input
                            label="Due Date *"
                            type="date"
                            value={editingTask.expectedCompletionDateTime?.split('T')[0] || ''}
                            onChange={(e) => setEditingTask({...editingTask, expectedCompletionDateTime: e.target.value})}
                            min={editingTask.taskType === 'Auto' ? editingTask.scheduledCreationDateTime?.split('T')[0] : undefined}
                            disabled={editingTask.id ? !canModify : !canCreate}
                        />

                    </div>
                    <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        {(canCreate || canModify) && <Button variant="primary" onClick={handleSaveTask}>{editingTask.id ? 'Update Task' : 'Create Task'}</Button>}
                    </div>
                 </Modal>
             )}
            {reassignTask && (
                <ReassignTaskModal
                    task={reassignTask}
                    advisors={advisors}
                    isOpen={!!reassignTask}
                    onClose={() => setReassignTask(null)}
                    onConfirm={(newAdvisorId, remark) => {
                        onReassignTask(reassignTask.id, newAdvisorId, currentUser!.id, remark);
                        setReassignTask(null);
                    }}
                />
            )}
            {historyTask && (
                <TaskHistoryModal
                    task={historyTask}
                    users={users}
                    isOpen={!!historyTask}
                    onClose={() => setHistoryTask(null)}
                />
            )}

        </div>
    );
};