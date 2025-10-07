import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, User, Member, TaskStatusMaster, FinRootsBranch, Lead, TaskMaster, Designation } from '../types.ts'; // MODIFIED
import { ListTodo, Plus, Edit2, Calendar, User as UserIcon, Briefcase, Table, LayoutGrid, Search, ArrowUp, ArrowDown, Trash2, Users, Building, GitCommit, RefreshCw } from 'lucide-react';
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
    finrootsBranches: FinRootsBranch[];
    onReassignTask: (taskId: string, newAdvisorId: string, reassignerId: string) => void;
    designations: Designation[]; // NEW PROP
}

const ITEMS_PER_PAGE = 10;

const ReassignTaskModal: React.FC<{
    task: Task;
    advisors: User[];
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newAdvisorId: string) => void;
}> = ({ task, advisors, isOpen, onClose, onConfirm }) => {
    const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');

    const advisorOptions = useMemo(() => {
        const sortedAdvisors = [...advisors].sort((a, b) => {
            const aIsAlternate = task.alternateContactPersons?.includes(a.id);
            const bIsAlternate = task.alternateContactPersons?.includes(b.id);
            if (aIsAlternate && !bIsAlternate) return -1;
            if (!aIsAlternate && bIsAlternate) return 1;
            return a.name.localeCompare(b.name);
        }).filter(adv => adv.id !== task.primaryContactPerson);

        return sortedAdvisors.map(adv => ({
            value: adv.id,
            label: `${adv.name} ${task.alternateContactPersons?.includes(adv.id) ? ' (Alternate)' : ''}`
        }));
    }, [advisors, task]);

    const handleConfirm = () => {
        if (selectedAdvisor) {
            onConfirm(selectedAdvisor);
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
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleConfirm} disabled={!selectedAdvisor}>Confirm Reassignment</Button>
            </div>
        </Modal>
    );
};

const TaskCard: React.FC<{
    task: Task;
    userMap: Map<string, string>;
    memberMap: Map<string, string>;
    leadMap: Map<string, string>;
    taskStatusMasters: TaskStatusMaster[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onOpenTask: (taskId: string) => void;
    onOpenModal: (task: Task) => void;
    onReassign: (task: Task) => void;
    currentUser: User | null;
    activeView: 'all' | 'customer' | 'personal';
    designations: Designation[]; // NEW PROP
}> = ({ task, userMap, memberMap, leadMap, taskStatusMasters, onUpdateTask, onDeleteTask, onOpenTask, onOpenModal, onReassign, currentUser, activeView, designations }) => {

    const userDesignation = useMemo(() => designations.find(d => d.id === currentUser?.designationId), [currentUser, designations]);
    const isUserAdmin = userDesignation?.name === 'Admin';
    const isUserAdvisor = userDesignation?.isAdvisor === true;

    const isAssignedToCurrentUser = task.primaryContactPerson === currentUser?.id;

    const isAssigned = task.statusId === 'ts-6';
    const isViewed = task.statusId === 'ts-5';
    const isInProgress = task.statusId === 'ts-2';
    const isCompleted = task.statusId === 'ts-3';

    const canReassign = (isUserAdmin || isAssignedToCurrentUser) && !isCompleted;

    const showBlurred = isUserAdvisor && isAssignedToCurrentUser && isAssigned;

    const isOverdue = !isCompleted && new Date(task.expectedCompletionDateTime) < new Date();

    const handleStartProgress = () => {
        onUpdateTask({ ...task, statusId: 'ts-2', isCompleted: false });
    };

    const handleMarkCompleted = () => {
        onUpdateTask({ ...task, statusId: 'ts-3', isCompleted: true });
    };

    const statusName = taskStatusMasters.find(s => s.id === task.statusId)?.name || 'Unknown';
    const statusColor = {
        'ts-6': 'text-gray-500 dark:text-gray-400', // Assigned
        'ts-1': 'text-gray-500 dark:text-gray-400', // Pending
        'ts-5': 'text-blue-500 dark:text-blue-400', // Viewed
        'ts-2': 'text-yellow-500 dark:text-yellow-400', // In Progress
        'ts-3': 'text-green-500 dark:text-green-400', // Completed
        'ts-4': 'text-red-500 dark:text-red-400', // Cancelled
    }[task.statusId || 'ts-1'];

    const clientName = task.memberId ? memberMap.get(task.memberId) : leadMap.get(task.leadId || '');
    const clientType = task.memberId ? 'Customer' : 'Lead';
    const alternates = (task.alternateContactPersons || [])
        .map(id => userMap.get(id))
        .filter(Boolean)
        .join(', ');

    const isCustomerTask = !!task.memberId || !!task.leadId;

    const cardBorderClass = activeView === 'all'
        ? (isCustomerTask ? 'border-l-4 border-blue-400 dark:border-blue-600' : 'border-l-4 border-purple-400 dark:border-purple-600')
        : 'border';

    const originalAssigneeName = task.originalAssigneeId ? userMap.get(task.originalAssigneeId) : null;


    return (
        <div className="relative">
            {showBlurred && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
                    <Button variant="primary" onClick={() => onOpenTask(task.id)}>
                        Open Task
                    </Button>
                    <p className="text-xs mt-2 text-gray-600 dark:text-gray-300">This task is new.</p>
                </div>
            )}
            <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:border-gray-700 flex flex-col gap-3 transition-all ${cardBorderClass} ${showBlurred ? 'blur-sm' : ''}`}>
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800 dark:text-white flex-1 pr-2">{task.taskDescription}</p>
                    <div className="flex items-center gap-1">
                        {canReassign && (
                            <Button variant="light" size="small" className="!p-1.5 h-7 w-7" onClick={() => onReassign(task)} title="Reassign Task">
                                <GitCommit size={14} />
                            </Button>
                        )}
                        {isUserAdmin && (
                            <>
                                <Button variant="light" size="small" className="!p-1.5 h-7 w-7" onClick={() => onOpenModal(task)}>
                                    <Edit2 size={14}/>
                                </Button>
                                <Button variant="danger" size="small" className="!p-1.5 h-7 w-7" onClick={() => onDeleteTask(task.id)}>
                                    <Trash2 size={14}/>
                                </Button>
                            </>
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
                    <div className="flex items-center gap-1.5" title={`Primary: ${userMap.get(task.primaryContactPerson || '') || 'N/A'}${alternates ? ` | Alternates: ${alternates}`: ''}`}>
                        <UserIcon size={12} />
                        <span>{userMap.get(task.primaryContactPerson || '') || 'N/A'}</span>
                        {originalAssigneeName && (
                            <span title={`Originally assigned to ${originalAssigneeName}`}>
                                <RefreshCw size={12} className="text-blue-500" />
                            </span>
                        )}
                        {alternates && <span className="text-xs text-gray-400" title={alternates}>(+{task.alternateContactPersons?.length})</span>}
                    </div>
                    {clientName && <div className="flex items-center gap-1.5" title={`Related ${clientType}`}><Briefcase size={12} /><span>{clientName}</span></div>}
                </div>

                <div className="pt-3 border-t dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <p className={`font-semibold text-sm ${statusColor}`}>{statusName}</p>
                    </div>
                    {isUserAdvisor && isAssignedToCurrentUser && (
                        <div className="flex-shrink-0">
                            {isViewed && <Button size="small" variant="secondary" onClick={handleStartProgress}>Start Progress</Button>}
                            {isInProgress && <Button size="small" variant="success" onClick={handleMarkCompleted}>Mark as Completed</Button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TaskTable: React.FC<{
    tasks: Task[];
    userMap: Map<string, string>;
    memberMap: Map<string, string>;
    leadMap: Map<string, string>;
    branchMap: Map<string, string>;
    users: User[];
    taskStatusMasters: TaskStatusMaster[];
    onOpenModal: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onReassign: (task: Task) => void;
    currentUser: User | null;
    onSort: (key: string) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    activeView: 'all' | 'customer' | 'personal';
}> = ({ tasks, userMap, memberMap, leadMap, branchMap, users, taskStatusMasters, onOpenModal, onDeleteTask, onReassign, currentUser, onSort, sortConfig, activeView }) => {

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
                    const isCompleted = task.statusId === 'ts-3';
                    const isOverdue = !isCompleted && new Date(task.expectedCompletionDateTime) < new Date();
                    const employee = users.find(u => u.id === task.primaryContactPerson);
                    const branchName = employee?.profile?.employeeBranchId ? branchMap.get(employee.profile.employeeBranchId) : 'N/A';
                    const clientName = task.memberId ? memberMap.get(task.memberId) : (task.leadId ? leadMap.get(task.leadId) : 'Personal Task');
                    const alternates = (task.alternateContactPersons || []).map(id => userMap.get(id)).filter(Boolean).join(', ');
                    const title = alternates ? `Alternate: ${alternates}` : undefined;
                    const canReassign = (currentUser?.designationId === 'des-admin' || task.primaryContactPerson === currentUser?.id) && !isCompleted;
                    const isCustomerTask = !!task.memberId || !!task.leadId;
                    const originalAssigneeName = task.originalAssigneeId ? userMap.get(task.originalAssigneeId) : null;

                    return (
                        <tr key={task.id}>
                             <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">{index + 1}</td>
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
                                 <div className="flex items-center gap-1" title={title}>
                                    {userMap.get(task.primaryContactPerson || '') || 'N/A'}
                                    {originalAssigneeName && (
                                        <span title={`Originally assigned to ${originalAssigneeName}`}>
                                            <RefreshCw size={12} className="text-blue-500" />
                                        </span>
                                    )}
                                    {alternates && <span className="text-xs text-gray-400"> (+{task.alternateContactPersons?.length})</span>}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{branchName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{clientName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{task.creationDateTime ? new Date(task.creationDateTime).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(task.expectedCompletionDateTime).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <span>{taskStatusMasters.find(s => s.id === task.statusId)?.name || 'Unknown'}</span>
                                    {isOverdue && <span className="px-1.5 py-0.5 text-white bg-red-500 rounded-full text-[10px] font-bold">OVERDUE</span>}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {canReassign && (
                                        <Button size="small" variant="secondary" onClick={() => onReassign(task)} title="Reassign Task">
                                            <GitCommit size={14} /> Reassign
                                        </Button>
                                    )}
                                    <Button size="small" variant="light" onClick={() => onOpenModal(task)}><Edit2 size={14}/> Edit</Button>
                                    {currentUser?.designationId === 'des-admin' && (
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
    finrootsBranches, onReassignTask, designations
}) => {
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [reassignTask, setReassignTask] = useState<Task | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [advisorFilter, setAdvisorFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'expectedCompletionDateTime', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    const [assignmentType, setAssignmentType] = useState<'individual' | 'allAdvisors' | 'byBranch'>('individual');
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedBranchAdvisors, setSelectedBranchAdvisors] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<'all' | 'customer' | 'personal'>('all');

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const memberMap = useMemo(() => new Map(members.map(m => [m.id, m.name])), [members]);
    const leadMap = useMemo(() => new Map(leads.map(l => [l.id, l.name])), [leads]);
    // MODIFIED: Use designation to find advisors
    const advisors = useMemo(() => {
        const advisorDesignationIds = new Set(designations.filter(d => d.isAdvisor).map(d => d.id));
        return users.filter(u => advisorDesignationIds.has(u.designationId));
    }, [users, designations]);
    const branchMap = useMemo(() => new Map(finrootsBranches.map(b => [b.id, b.branchName])), [finrootsBranches]);
    const isAdmin = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin', [currentUser, designations]);

    const advisorsForFilter = useMemo(() => {
        if (branchFilter === 'all') {
            return advisors;
        }
        return advisors.filter(adv => adv.profile?.employeeBranchId === branchFilter);
    }, [advisors, branchFilter]);
    
    const manualTaskMaster = useMemo(() => taskMasters.find(tm => tm.name.toLowerCase() === 'manual' && tm.active), [taskMasters]);
    const autoTaskMaster = useMemo(() => taskMasters.find(tm => tm.name.toLowerCase() === 'auto' && tm.active), [taskMasters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, branchFilter, advisorFilter, activeView, viewMode]);

    useEffect(() => {
        setSelectedBranchAdvisors([]);
    }, [selectedBranches]);


    const filteredAndSortedTasks = useMemo(() => {
        let tasks: Task[] = [];
        if (isAdmin) {
            tasks = [...allTasks];
        } else {
            tasks = allTasks.filter(task => task.primaryContactPerson === currentUser?.id);
        }

        if (activeView === 'customer') {
            tasks = tasks.filter(task => task.memberId || task.leadId);
        } else if (activeView === 'personal') {
            tasks = tasks.filter(task => !task.memberId && !task.leadId);
        }

        tasks = tasks.filter(task => {
            const searchMatch = !searchQuery || task.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());
            const statusMatch = statusFilter === 'all' || task.statusId === statusFilter;
            const advisorMatch = advisorFilter === 'all' || task.primaryContactPerson === advisorFilter;
            const employeeForBranch = users.find(u => u.id === task.primaryContactPerson);
            const branchId = employeeForBranch?.profile?.employeeBranchId;
            const branchMatch = branchFilter === 'all' || branchId === branchFilter;
            return searchMatch && statusMatch && advisorMatch && branchMatch;
        });

        tasks.sort((a, b) => {
            const { key, direction } = sortConfig;
            let aValue: any;
            let bValue: any;

            switch(key) {
                case 'assignedTo':
                    aValue = userMap.get(a.primaryContactPerson || '') || 'Z';
                    bValue = userMap.get(b.primaryContactPerson || '') || 'Z';
                    break;
                case 'status':
                    aValue = taskStatusMasters.find(s => s.id === a.statusId)?.name || 'Z';
                    bValue = taskStatusMasters.find(s => s.id === b.statusId)?.name || 'Z';
                    break;
                case 'branch':
                    const aAdvisor = users.find(u => u.id === a.primaryContactPerson);
                    const bAdvisor = users.find(u => u.id === b.primaryContactPerson);
                    aValue = branchMap.get(aAdvisor?.profile?.employeeBranchId || '') || 'Z';
                    bValue = branchMap.get(bAdvisor?.profile?.employeeBranchId || '') || 'Z';
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
    }, [allTasks, currentUser, searchQuery, statusFilter, advisorFilter, branchFilter, sortConfig, users, userMap, taskStatusMasters, branchMap, activeView, isAdmin]);

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
            onOpenTask(task.id);
        }
        
        const defaultTaskType = manualTaskMaster ? 'Manual' : (autoTaskMaster ? 'Auto' : 'Manual');
        const currentUserIsAdvisor = designations.find(d => d.id === currentUser?.designationId)?.isAdvisor;

        setEditingTask(task ? { ...task } : {
            triggeringPoint: 'Manual', 
            taskDescription: '', 
            expectedCompletionDateTime: new Date().toISOString().split('T')[0],
            isCompleted: false, 
            taskType: defaultTaskType,
            taskTime: '09:00',
            primaryContactPerson: currentUserIsAdvisor ? currentUser!.id : undefined,
        });

        setAssignmentType('individual');
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

        if (assignmentType === 'byBranch' && selectedBranchAdvisors.length === 0) {
            addToast('Please select at least one employee from the chosen branch(es).', 'error');
            return;
        }

        if (!isAdmin && !editingTask.memberId && !editingTask.leadId) {
            addToast('Please select a customer or lead for the task.', 'error');
            return;
        }

        const taskToSave = {
            ...editingTask,
            expectedCompletionDateTime: editingTask.expectedCompletionDateTime || new Date().toISOString(),
            taskType: editingTask.taskType || 'Manual',
        };

        if (editingTask.id) {
            onUpdateTask(taskToSave as Task);
            addToast('Task updated successfully.', 'success');
        } else {
            const { id, ...createData } = taskToSave;

            if (!isAdmin) {
                onCreateTask(createData as Omit<Task, 'id'>);
                addToast('Task created successfully.', 'success');
            } else {
                let successMessage = 'Task created successfully.';
                if (assignmentType === 'individual') {
                    onCreateTask(createData as Omit<Task, 'id'>);
                } else if (assignmentType === 'allAdvisors') {
                    const targetAdvisorIds = advisors.map(a => a.id);
                    if (targetAdvisorIds.length > 0) {
                        onCreateBulkTask(createData as Omit<Task, 'id'>, targetAdvisorIds);
                        successMessage = `Task assigned to ${targetAdvisorIds.length} employees.`;
                    } else {
                        addToast('No employees with an advisor designation found for bulk assignment.', 'error');
                        return;
                    }
                } else if (assignmentType === 'byBranch') {
                    if (selectedBranchAdvisors.length > 0) {
                        onCreateBulkTask(createData as Omit<Task, 'id'>, selectedBranchAdvisors);
                        successMessage = `Task assigned to ${selectedBranchAdvisors.length} employee(s).`;
                    } else {
                        addToast('No employees selected from the branch(es).', 'error');
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

    const advisorOptions = useMemo(() => advisors.map(adv => ({ value: adv.id, label: adv.name })), [advisors]);

    const advisorsInSelectedBranches = useMemo(() => {
        if (selectedBranches.length === 0) return [];
        return advisors
            .filter(a => a.profile?.employeeBranchId && selectedBranches.includes(a.profile.employeeBranchId))
            .map(adv => ({ value: adv.id, label: adv.name }));
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
                 {isAdmin && (
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
                            {taskStatusMasters.map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                        </select>
                    </div>
                     {isAdmin && (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                                <select
                                    value={branchFilter}
                                    onChange={(e) => { setBranchFilter(e.target.value); setAdvisorFilter('all'); }}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="all">All Branches</option>
                                    {finrootsBranches.map(branch => <option key={branch.id} value={branch.id}>{branch.branchName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
                                <select
                                    value={advisorFilter}
                                    onChange={(e) => setAdvisorFilter(e.target.value)}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="all">All Employees</option>
                                    {advisorsForFilter.map(adv => <option key={adv.id} value={adv.id}>{adv.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </div>
                 <div className="flex justify-end">
                     {isAdmin && (
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
                            <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-brand-primary dark:bg-gray-700' : 'text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-800'}`} aria-label="Card View"><LayoutGrid size={16}/></button>
                            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-brand-primary dark:bg-gray-700' : 'text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-800'}`} aria-label="Table View"><Table size={16}/></button>
                        </div>
                     )}
                </div>
            </div>

            {viewMode === 'table' && isAdmin ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                    <TaskTable tasks={currentTasks} userMap={userMap} memberMap={memberMap} leadMap={leadMap} branchMap={branchMap} users={users} taskStatusMasters={taskStatusMasters} onOpenModal={handleOpenModal} onDeleteTask={onDeleteTask} currentUser={currentUser} onSort={handleSort} sortConfig={sortConfig} onReassign={setReassignTask} activeView={activeView} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            userMap={userMap}
                            memberMap={memberMap}
                            leadMap={leadMap}
                            taskStatusMasters={taskStatusMasters}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onOpenTask={onOpenTask}
                            onOpenModal={handleOpenModal}
                            onReassign={setReassignTask}
                            currentUser={currentUser}
                            activeView={activeView}
                            designations={designations}
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
                        />
                        {isAdmin && !editingTask.id && (
                            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignment Type</label>
                                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                        <button type="button" onClick={() => setAssignmentType('individual')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'individual' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}><UserIcon size={14}/> Individual</button>
                                        <button type="button" onClick={() => setAssignmentType('allAdvisors')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'allAdvisors' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}><Users size={14}/> All Advisors</button>
                                        <button type="button" onClick={() => setAssignmentType('byBranch')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'byBranch' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}><Building size={14}/> By Branch</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {assignmentType === 'individual' && (
                             <SearchableSelect
                                label="Assigned To (Primary) *"
                                options={advisorOptions}
                                value={editingTask.primaryContactPerson || ''}
                                onChange={(value) => setEditingTask({...editingTask, primaryContactPerson: value})}
                                placeholder="Select Employee..."
                                disabled={!isAdmin}
                            />
                        )}
                        {assignmentType === 'byBranch' && (
                            <>
                                <MultiSelectDropdown
                                    label="Select Branches"
                                    options={finrootsBranches.map(b => ({ value: b.id, label: b.branchName }))}
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
                        {isAdmin && assignmentType === 'individual' && (
                           <MultiSelectDropdown
                                label="Alternate Employees"
                                options={advisorOptions.filter(opt => opt.value !== editingTask.primaryContactPerson)}
                                selectedValues={editingTask.alternateContactPersons || []}
                                onChange={(values) => setEditingTask(prev => prev ? { ...prev, alternateContactPersons: values } : null)}
                            />
                        )}
                        <SearchableSelect
                            label={`Related Customer / Lead ${!isAdmin ? '*' : '(Optional)'}`}
                            options={clientOptions}
                            value={selectedClientValue}
                            onChange={handleClientChange}
                            placeholder="None (Personal Task)"
                        />
                        {(manualTaskMaster || autoTaskMaster) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                                <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                    {manualTaskMaster && (
                                        <button type="button" onClick={() => setEditingTask({...editingTask, taskType: 'Manual'})} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${editingTask.taskType === 'Manual' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Manual</button>
                                    )}
                                    {autoTaskMaster && (
                                        <button type="button" onClick={() => setEditingTask({...editingTask, taskType: 'Auto'})} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${editingTask.taskType === 'Auto' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>Auto</button>
                                    )}
                                </div>
                            </div>
                        )}
                        <Input
                            label="Due Date *"
                            type="date"
                            value={editingTask.expectedCompletionDateTime?.split('T')[0] || ''}
                            onChange={(e) => setEditingTask({...editingTask, expectedCompletionDateTime: e.target.value})}
                        />
                        {editingTask.taskType === 'Auto' && (
                             <Input
                                label="Task Time"
                                type="time"
                                value={editingTask.taskTime || ''}
                                onChange={(e) => setEditingTask({...editingTask, taskTime: e.target.value})}
                            />
                        )}
                        <div className="flex items-center gap-2">
                             <input type="checkbox" id="isShared" checked={editingTask.isShared} onChange={e => setEditingTask({...editingTask, isShared: e.target.checked})} />
                             <label htmlFor="isShared" className="text-sm font-medium text-gray-700 dark:text-gray-300">Share this task</label>
                        </div>
                    </div>
                    <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveTask}>Save Task</Button>
                    </div>
                 </Modal>
             )}
            {reassignTask && (
                <ReassignTaskModal
                    task={reassignTask}
                    advisors={advisors}
                    isOpen={!!reassignTask}
                    onClose={() => setReassignTask(null)}
                    onConfirm={(newAdvisorId) => {
                        onReassignTask(reassignTask.id, newAdvisorId, currentUser!.id);
                        setReassignTask(null);
                    }}
                />
            )}
        </div>
    );
};