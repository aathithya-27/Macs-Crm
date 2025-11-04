import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Member, ModalTab, User, Route, ProcessStage, ProcessLog, Policy, BankDetails, SchemeMaster, 
    Company, DocumentMaster, RelationshipType, LeadSourceMaster, Geography, 
    BankMaster, CustomerCategory, CustomerSubCategory, CustomerGroup, FamilyMemberNode, Task, 
    TaskStatusMaster, TaskMaster, InsuranceTypeMaster, InsuranceFieldMaster, 
    BusinessVertical, CoveredMember, FinRootsBranch, Religion, CustomerFieldMaster, AMC, 
    MutualFundScheme, MutualFundHolding, MutualFundTransaction, MutualFundFieldMaster, Designation,
    AppModule, PermissionLevel,
    Gender, MaritalStatus, ProcessStageMaster, AccountType, Role, RolePermissions,
    InsuranceTypeDocumentRule,
    OccasionTypeMaster 
} from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { BasicInfoTab } from './tabs/BasicInfoTab.tsx';
import { DocumentsTab } from './tabs/DocumentsTab.tsx';
import { PoliciesTab } from './tabs/PoliciesTab.tsx';
import { NeedsAnalysisTab } from './tabs/NeedsAnalysisTab.tsx';
import { NotesAndRemindersTab } from './tabs/NotesAndRemindersTab.tsx';
import { InvestmentsTab } from './tabs/InvestmentsTab.tsx';
import ProcessFlowTracker from './ProcessFlowTracker.tsx';
import { X, Users, UserCheck, Plus, ListTodo, SlidersHorizontal, UserPlus as UserPlusIcon, Info, ShieldX, Shield, FileText as FileTextIcon, Mic, BarChart3, User as UserIcon, TrendingUp, Save, Trash2 } from 'lucide-react';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';

// Constants for validation and security
const VALIDATION_PATTERNS = {
    MOBILE: /^\+?[0-9\s-]{10,15}$/,
    EMAIL: /^\S+@\S+\.\S+$/,
    XSS_CHARS: /[<>"'&]/g
} as const;

const ERROR_MESSAGES = {
    REQUIRED_FIELDS: 'Name, Date of Birth, and Relationship are required.',
    TASK_DESCRIPTION_REQUIRED: 'Task description is required.',
    REFERRER_NAME_REQUIRED: 'Referrer name is required.',
    MOBILE_INVALID: 'A valid mobile number is required.',
    CREATION_FAILED: 'Failed to create. Please try again.',
    SAVE_FAILED: 'Failed to save. Please try again.'
} as const;

const SUCCESS_MESSAGES = {
    TASK_CREATED: 'Task created successfully.',
    REFERRER_SAVED: 'Referrer saved successfully.'
} as const;

const FamilyTreeTab: React.FC<{
    member: Member;
    allMembers: Member[];
    onRelieveMember: (memberId: string) => void;
    onCreateDependent: (dependentData: Partial<Member>) => void; 
    onSetSpoc: () => void;
    currentUser: User | null;
    designations: Designation[];
    genders: Gender[]; 
    maritalStatuses: MaritalStatus[];
    relationshipTypes: RelationshipType[];
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ member, allMembers, onRelieveMember, onCreateDependent, onSetSpoc, currentUser, designations, genders, maritalStatuses, relationshipTypes, permissions }) => {

    const [isAdding, setIsAdding] = useState(false);
    const [newDependent, setNewDependent] = useState<Partial<Member>>({});
    
    const canRelieveMember = permissions?.customers === 'modify';

    const titleSpoc = useMemo(() => {
        if (member.spocId) {
            const parentSpoc = allMembers.find(m => m.sno === member.spocId);
            if (parentSpoc) {
                return parentSpoc;
            }
        }
        if (member.isSPOC) {
            return member;
        }
        return null;
    }, [member, allMembers]);

    const treeRootSpoc = useMemo(() => {
        if (member.isSPOC) {
            return member;
        }
        if (member.spocId) {
            return allMembers.find(m => m.sno === member.spocId);
        }
        return null;
    }, [member, allMembers]);

    const buildTree = useCallback((spocToBuildFrom: Member): FamilyMemberNode => {
        const dependentMembers = (spocToBuildFrom.sno)
            ? allMembers.filter(m => m.spocId === spocToBuildFrom.sno && m.id !== spocToBuildFrom.id)
            : [];

        const policyDependents = (spocToBuildFrom.policies || [])
            .filter(p => p.policyHolderType === 'Family')
            .flatMap(p => p.coveredMembers || [])
            .filter(cm => cm.name && !dependentMembers.some(dm => dm.name === cm.name && dm.dob === cm.dob))
            .map(cm => ({
                id: cm.id,
                name: cm.name,
                memberId: `(Covered)`,
                isSPOC: false,
                children: []
            }));

        const childrenNodes = [
            ...dependentMembers.map(child => ({
                id: child.id,
                name: child.name,
                memberId: child.memberId,
                isSPOC: !!child.isSPOC,
                children: [], 
            })),
            ...policyDependents
        ];

        return {
            id: spocToBuildFrom.id,
            name: spocToBuildFrom.name,
            memberId: spocToBuildFrom.memberId,
            isSPOC: !!spocToBuildFrom.isSPOC,
            children: childrenNodes,
        };
    }, [allMembers]);

    const familyTree = useMemo(() => {
        return treeRootSpoc ? buildTree(treeRootSpoc) : null;
    }, [treeRootSpoc, buildTree]);

    const handleAddClick = () => {
        setNewDependent({
            name: '',
            dob: '',
            gender: genders.length > 0 ? genders[0].id : '',
            maritalStatus: maritalStatuses.length > 0 ? maritalStatuses[0].id : '',
            state: member.state,
            district: member.district,
            city: member.city,
            address: member.address,
        });
        setIsAdding(true);
    };
    
    const handleSaveDependent = () => {
        const dep = newDependent as Member & { relationship?: string };
        if (!dep.name || !dep.dob || !dep.relationship) {
            alert("Name, Date of Birth, and Relationship are required.");
            return;
        }
        onCreateDependent(newDependent);
        setIsAdding(false);
    };

    const handleRelieveClick = (memberToRelieve: Member) => {
        if (window.confirm(`Are you sure you want to relieve ${memberToRelieve.name} from the family group? They will become an independent customer.`)) {
            onRelieveMember(memberToRelieve.id);
        }
    };
    
    const handleCopyAddress = () => {
        setNewDependent(p => ({
            ...p,
            address: member.address,
            state: member.state,
            district: member.district,
            city: member.city,
            pincode: member.pincode,
        }));
    };


    const TreeNode: React.FC<{ node: FamilyMemberNode; isRoot?: boolean; }> = ({ node, isRoot = false }) => {
        const memberNode = allMembers.find(m => m.id === node.id);
        const isRelieved = !!memberNode?.relievedTimestamp;
        const hasChildren = node.children && node.children.length > 0;
        const relationship = memberNode?.dynamicData?.relationship;

        return (
            <li className={`relative ${hasChildren ? 'pl-8' : 'pl-1'} before:absolute before:left-3 before:top-4 before:h-full before:w-px before:bg-gray-300 dark:before:bg-gray-600 last:before:h-0`}>
                <div className="relative flex items-start gap-4">
                        {hasChildren && <div className="absolute -left-3.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 ring-4 ring-gray-200 dark:ring-gray-700">
                            {node.isSPOC ? <UserCheck className="text-blue-600 dark:text-blue-300" size={18}/> : <UserIcon className="text-gray-600 dark:text-gray-300" size={18}/>}
                        </div>}
                    <div className="flex-1 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-full">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">{node.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {node.isSPOC ? `${node.memberId} (SPOC)` : node.memberId}
                                    {relationship && ` • ${relationship}`}
                                </p>
                                {isRelieved && <span className="mt-1 text-xs font-bold bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full">Relieved</span>}
                            </div>
                            {memberNode && !memberNode.isSPOC && canRelieveMember && !isRelieved && (
                                <Button 
                                    size="small" 
                                    variant="danger" 
                                    onClick={() => handleRelieveClick(memberNode)}
                                >
                                    <ShieldX size={14}/> Relieve
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                {node.children.length > 0 && (
                    <ul className="pt-4 space-y-4">
                        {node.children.map(child => <TreeNode key={child.id} node={child} />)}
                    </ul>
                )}
            </li>
        );
    };

    if (!treeRootSpoc || !titleSpoc) {
        return (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600"/>
                <p className="mt-4 text-lg font-semibold">This member is not yet part of a family group.</p>
                <p className="mt-1 text-sm">To start adding family members, you must first designate this customer as the primary contact.</p>
                <Button onClick={onSetSpoc} variant="primary" className="mt-4">
                    <UserCheck size={16}/> Become SPOC and Create Family
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Family Group: {titleSpoc.familyName || `${titleSpoc.name}'s Family`}
                </h3>
                {!isAdding && member.isSPOC && (
                    <Button onClick={handleAddClick} variant="primary">
                        <UserPlusIcon size={16}/> Add Family Member
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="p-4 mb-4 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-gray-700/50 space-y-4 animate-fade-in">
                    <h4 className="font-semibold text-lg text-brand-dark dark:text-white">New Family Member</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Input label="Name *" value={newDependent.name || ''} onChange={e => setNewDependent(p => ({...p, name: e.target.value}))} />
                        <Input label="Date of Birth *" type="date" value={newDependent.dob || ''} onChange={e => setNewDependent(p => ({...p, dob: e.target.value}))} />
                        <Input label="Email" type="email" value={newDependent.email || ''} onChange={e => setNewDependent(p => ({...p, email: e.target.value}))} />
                        <Input label="Mobile" type="tel" value={newDependent.mobile || ''} onChange={e => setNewDependent(p => ({...p, mobile: e.target.value}))} />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship *</label>
                            <select
                                value={(newDependent as any).relationship || ''}
                                onChange={e => setNewDependent(p => ({...p, relationship: e.target.value}))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                style={{ maxHeight: '200px', overflowY: 'auto' }}
                            >
                                <option value="">Select...</option>
                                {relationshipTypes.filter(rt => rt.active).map(rt => (
                                    <option key={rt.id} value={rt.name}>{rt.name}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                            <select
                                value={newDependent.gender || ''}
                                onChange={(e) => setNewDependent(p => ({...p, gender: e.target.value}))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                style={{ maxHeight: '200px', overflowY: 'auto' }}
                            >
                                <option value="">-- Select Gender --</option>
                                {genders.filter(g => g.active).map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray300">Address</label>
                            <Button size="small" variant="light" type="button" onClick={handleCopyAddress}>
                                Copy Primary Customer's Address
                            </Button>
                        </div>
                        <Input 
                            label="" 
                            placeholder="Address Line 1" 
                            value={(newDependent.address || '').split('\n')[0]} 
                            onChange={e => {
                                const lines = (newDependent.address || '').split('\n');
                                lines[0] = e.target.value;
                                setNewDependent(p => ({...p, address: lines.join('\n')}));
                            }} 
                        />
                        <Input 
                            label="" 
                            placeholder="Address Line 2" 
                            value={(newDependent.address || '\n').split('\n')[1] || ''} 
                            onChange={e => {
                                const lines = (newDependent.address || '\n').split('\n');
                                if (lines.length === 1) lines.push('');
                                lines[1] = e.target.value;
                                setNewDependent(p => ({...p, address: lines.join('\n')}));
                            }} 
                        />
                    </div>
                     <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button variant="success" onClick={handleSaveDependent}><Save size={14}/> Save Member</Button>
                    </div>
                </div>
            )}
            
            <ul className="space-y-4">
                <TreeNode node={familyTree!} isRoot />
            </ul>
        </div>
    );
};

const TasksTab: React.FC<{
    member: Member;
    tasks: Task[];
    taskStatusMasters: TaskStatusMaster[];
    taskMasters: TaskMaster[];
    users: User[];
    onCreateTask: (task: Omit<Task, 'id'>) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    permissions: { [key in AppModule]?: PermissionLevel };
    isCurrentUserAdvisor: boolean; 
}> = ({ member, tasks, taskStatusMasters, taskMasters, users, onCreateTask, addToast, permissions, isCurrentUserAdvisor }) => {
    const [isCreating, setIsCreating] = useState(false);
    
    const canCreate = (permissions?.taskManagement === 'create' || permissions?.taskManagement === 'modify') && !isCurrentUserAdvisor;

    const manualTaskMaster = useMemo(() => taskMasters.find(tm => tm.name.toLowerCase() === 'manual' && tm.active), [taskMasters]);
    const autoTaskMaster = useMemo(() => taskMasters.find(tm => tm.name.toLowerCase() === 'auto' && tm.active), [taskMasters]);
    
    const [newTask, setNewTask] = useState<Partial<Task>>({ taskType: manualTaskMaster ? 'Manual' : (autoTaskMaster ? 'Auto' : undefined), expectedCompletionDateTime: new Date().toISOString().split('T')[0] });

    const memberTasks = useMemo(() => {
        if (!member || !member.id) {
            return [];
        }
        return tasks.filter(t => t.memberId === member.id);
    }, [tasks, member]);

    const advisors = useMemo(() => users.filter(u => u.role === 'Advisor'), [users]);
    const advisorOptions = useMemo(() => advisors.map(adv => ({ value: adv.id, label: adv.name })), [advisors]);

    const handleCreate = () => {
        if (!newTask.taskDescription?.trim()) {
            alert('Task description is required.');
            return;
        }
        onCreateTask({
            ...newTask,
            triggeringPoint: 'Manual',
            taskDescription: newTask.taskDescription,
            expectedCompletionDateTime: newTask.expectedCompletionDateTime || new Date().toISOString(),
            isCompleted: false,
            memberId: member.id,
        } as Omit<Task, 'id'>);
        setIsCreating(false);
        setNewTask({ taskType: 'Manual', expectedCompletionDateTime: new Date().toISOString().split('T')[0] });
    };
    
    const handleNewTaskClick = () => {
        if (!manualTaskMaster && !autoTaskMaster) {
            addToast('No active task modes available. Please enable at least one in Master Data.', 'error');
            return;
        }
        setIsCreating(true);
    };

    const handleMultiSelectChange = (field: 'alternateContactPersons', selectedValues: string[]) => {
        setNewTask(prev => ({ ...prev, [field]: selectedValues }));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tasks for {member.name}</h3>
                {!isCreating && canCreate && <Button onClick={handleNewTaskClick} variant="primary"><Plus size={16}/> New Task</Button>}
            </div>

            {isCreating && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50 space-y-4 animate-fade-in">
                    <Input 
                        label="Task Description" 
                        value={newTask.taskDescription || ''} 
                        onChange={e => setNewTask({...newTask, taskDescription: e.target.value})} 
                        placeholder="e.g., Follow up on policy documents"
                    />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SearchableSelect
                                label="Assigned To"
                                options={advisorOptions}
                                value={newTask.primaryContactPerson || ''}
                                onChange={(value) => setNewTask({...newTask, primaryContactPerson: value})}
                                placeholder="Select Advisor..."
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alternate Advisors</label>
                                <SearchableSelect
                                    label=""
                                    options={advisorOptions.filter(opt => opt.value !== newTask.primaryContactPerson)}
                                    value={newTask.alternateContactPersons?.[0] || ''}
                                    onChange={(value) => handleMultiSelectChange('alternateContactPersons', value ? [value] : [])}
                                    placeholder="Select Backup..."
                                />
                            </div>
                        </div>
                    {(manualTaskMaster || autoTaskMaster) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                            <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                                {manualTaskMaster && (
                                    <button 
                                        type="button" 
                                        onClick={() => setNewTask({...newTask, taskType: 'Manual'})} 
                                        className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${newTask.taskType === 'Manual' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                                    >
                                        Manual
                                    </button>
                                )}
                                {autoTaskMaster && (
                                    <button 
                                        type="button" 
                                        onClick={() => setNewTask({...newTask, taskType: 'Auto'})} 
                                        className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${newTask.taskType === 'Auto' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {newTask.taskType === 'Auto' && (
                                <Input 
                                    label="Creation Date" 
                                    type="date" 
                                    value={newTask.creationDateTime?.split('T')[0] || ''} 
                                    onChange={e => setNewTask({...newTask, creationDateTime: e.target.value})} 
                                />
                            )}
                            <Input 
                                label="Due Date" 
                                type="date" 
                                value={newTask.expectedCompletionDateTime?.split('T')[0] || ''} 
                                onChange={e => setNewTask({...newTask, expectedCompletionDateTime: e.target.value})} 
                            />
                            {newTask.taskType === 'Auto' && (
                                <Input 
                                    label="Task Time" 
                                    type="time" 
                                    value={newTask.taskTime || ''} 
                                    onChange={e => setNewTask({...newTask, taskTime: e.target.value})} 
                                />
                            )}
                        </div>
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsCreating(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="success" 
                            onClick={handleCreate}
                        >
                            Create Task
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {memberTasks.length > 0 ? memberTasks.map(task => {
                    const status = taskStatusMasters.find(s => s.id === task.statusId)?.name || 'Unknown';
                    const assignedTo = users.find(u => u.id === task.primaryContactPerson)?.name || 'Unassigned';
                    return (
                        <div key={task.id} className="p-3 bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700">
                           <p className="font-medium text-gray-800 dark:text-gray-200">{task.taskDescription}</p>
                           <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                               <span>Due: {new Date(task.expectedCompletionDateTime).toLocaleDateString()}</span>
                               <span>To: {assignedTo}</span>
                               <span>Status: {status}</span>
                           </div>
                        </div>
                    )
                }) : (
                    <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                        <ListTodo size={32} className="mx-auto text-gray-400 dark:text-gray-500" />
                        <p className="mt-2">No tasks found for this customer.</p>
                    </div>
                )}
            </div>
        </div>
    )
};

const NewReferrerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; mobile: string; email?: string }) => Promise<void>;
    addToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ isOpen, onClose, onSave, addToast }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');

    const handleSave = async () => {
        if (!name.trim()) return addToast('Referrer name is required.', 'error');
        if (!mobile.trim() || !/^\+?[0-9\s-]{10,15}$/.test(mobile)) return addToast('A valid mobile number is required.', 'error');

        await onSave({ name, mobile, email });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
        >
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Add New Referrer</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This will create a basic contact record for the referrer.</p>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                <Input 
                    label="Full Name *" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                />
                <Input 
                    label="Phone Number *" 
                    type="tel" 
                    value={mobile} 
                    onChange={e => setMobile(e.target.value)} 
                />
                <Input 
                    label="Email Address" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                />
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button 
                    variant="secondary" 
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSave}
                >
                    Save Referrer
                </Button>
            </div>
        </Modal>
    );
};

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  initialTab: ModalTab | null;
  onSave: (member: Member, closeModal?: boolean) => void;
  onCreateDependentMember: (spoc: Member, dependentData: Partial<Member>) => Promise<Member | null>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
  onRelieveMember: (memberId: string) => void; 
  currentUser: User | null;
  users: User[];
  routes: Route[];
  onUpdateRoutes: (data: Route[]) => void;
  processFlow: ProcessStageMaster[];
  onGenerateProposal: (member: Member, policy: Policy) => void;
  onFindUpsell: (member: Member) => Promise<string | null>;
  allMembers: Member[];
  schemes: SchemeMaster[];
  companies: Company[];
  documentMasters: DocumentMaster[];
  insuranceTypeDocumentRules: InsuranceTypeDocumentRule[];
  relationshipTypes: RelationshipType[];
  leadSources: LeadSourceMaster[];
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  bankMasters: BankMaster[];
  customerCategories: CustomerCategory[];
  customerSubCategories: CustomerSubCategory[];
  customerGroups: CustomerGroup[];
  allTasks: Task[];
  taskStatusMasters: TaskStatusMaster[];
  taskMasters: TaskMaster[];
  insuranceTypes: InsuranceTypeMaster[];
  insuranceFields: InsuranceFieldMaster[];
  onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
  customerFieldMasters: CustomerFieldMaster[];
  onUpdateCustomerFieldMasters: (data: CustomerFieldMaster[]) => void;
  onCreateReferrer: (referrerData: { name: string; mobile: string; email?: string }) => Promise<Member | null>;
  finrootsBranches: FinRootsBranch[]; 
  religions: Religion[]; 
  onAddDocumentMaster: (name: string) => void;
  amcs: AMC[];
  mutualFundSchemes: MutualFundScheme[];
  mutualFundFields: MutualFundFieldMaster[];
  designations: Designation[];
  permissions: { [key in AppModule]?: PermissionLevel };
  genders: Gender[];
  maritalStatuses: MaritalStatus[];
  accountTypes: AccountType[];
  roles: Role[];
  occasionTypeMasters: OccasionTypeMaster[];
  onUpdateOccasionTypeMasters: (data: OccasionTypeMaster[]) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
    isOpen, onClose, member, initialTab, onSave, onCreateDependentMember, addToast, onCreateTask, onRelieveMember, 
    currentUser, users, routes, onUpdateRoutes, processFlow, onGenerateProposal, onFindUpsell, 
    allMembers, schemes, companies, documentMasters, insuranceTypeDocumentRules, relationshipTypes, 
    leadSources, geographies, onUpdateGeographies, bankMasters, customerCategories, 
    customerSubCategories, customerGroups, allTasks, taskStatusMasters, taskMasters, 
    insuranceTypes, insuranceFields, onUpdateInsuranceFields, customerFieldMasters, onUpdateCustomerFieldMasters, 
    onCreateReferrer, finrootsBranches, religions, onAddDocumentMaster, amcs, 
    mutualFundSchemes, mutualFundFields, designations, permissions,
    genders, maritalStatuses, accountTypes, roles,
    occasionTypeMasters, onUpdateOccasionTypeMasters
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab | string>(ModalTab.BasicInfo);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Member | 'bankDetailsError' | 'email' | 'address' | 'documentsError', string>>>({});
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const [selectedProcessFlowKey, setSelectedProcessFlowKey] = useState<string | null>(null);
  const [jumpState, setJumpState] = useState<{isOpen: boolean; targetStage: ProcessStage | null; skippedStages: ProcessStage[]}>({ isOpen: false, targetStage: null, skippedStages: [] });
  const [jumpRemarks, setJumpRemarks] = useState('');

  const prevMemberIdRef = useRef<string | null>(null);
  const [isNewReferrerModalOpen, setIsNewReferrerModalOpen] = useState(false);
  
  const canCreate = permissions?.customers === 'create' || permissions?.customers === 'modify';
  const canModify = permissions?.customers === 'modify';
  const isReadOnly = !!member && !canModify;

  // --- MODIFICATION BEGINS ---
  const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r.name])), [roles]);

  const creatorInfo = useMemo(() => {
    if (formData.createdBy) {
        const creatorUser = users.find(u => u.id === formData.createdBy);
        if (creatorUser) {
            return {
                name: creatorUser.name,
                role: creatorUser.roleId ? roleMap.get(creatorUser.roleId) || 'Unknown Role' : 'Unknown Role',
                isInactive: creatorUser.profile?.status === 'Inactive'
            };
        }
    }
    return null;
  }, [formData.createdBy, users, roleMap]); 
  // --- MODIFICATION ENDS ---

  const isCurrentUserAdvisor = useMemo(() => roles.find(r => r.id === currentUser?.roleId)?.isAdvisor === true, [currentUser, roles]);

  const getInitialFormData = (member: Member | null): Partial<Member> => {
    if (member) return JSON.parse(JSON.stringify(member));

    return {
      name: '', dob: '', maritalStatus: null, gender: null, mobile: '', state: 'Maharashtra', city: 'Mumbai City', address: '',
      memberType: 'Silver', active: true, panCard: '', aadhaar: '', policies: [], voiceNotes: [], documents: [],
      lat: 0, lng: 0,
      assignedTo: isCurrentUserAdvisor ? [currentUser!.id] : [],
      routeId: null, 
      processStages: {}, processHistories: {}, stageLastChangedMap: {},
      financialProfile: {}, bankDetails: {}, otherSpecialOccasions: [], isSPOC: false,
      spocId: null, familyName: null, leadSource: { sourceId: null, detail: '' },
      dynamicData: {}, mutualFundHoldings: [],
    };
  };

  useEffect(() => {
      if (isOpen) {
          const currentMemberId = member?.id || null;
          const isNewMemberBeingOpened = currentMemberId !== prevMemberIdRef.current;

          setFormData(getInitialFormData(member));
          setErrors({});

          if (isNewMemberBeingOpened) {
              setActiveTab(initialTab || ModalTab.BasicInfo);
              setEditingPolicyId(null);
          }

          prevMemberIdRef.current = currentMemberId;
      } else {
          prevMemberIdRef.current = null;
      }
  }, [member, isOpen, initialTab, currentUser, roles, isCurrentUserAdvisor]);

  useEffect(() => {
    return () => {
        const lastFormData = formData;
        if (lastFormData.photoUrl && lastFormData.photoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(lastFormData.photoUrl);
        }
        if (lastFormData.addressProofUrl && lastFormData.addressProofUrl.startsWith('blob:')) {
            URL.revokeObjectURL(lastFormData.addressProofUrl);
        }
        (lastFormData.documents || []).forEach(doc => {
            if (doc.fileUrl && doc.fileUrl.startsWith('blob:')) {
                URL.revokeObjectURL(doc.fileUrl);
            }
        });
        (lastFormData.policies || []).forEach(policy => {
            if (policy.paymentProofUrl && policy.paymentProofUrl.startsWith('blob:')) {
                URL.revokeObjectURL(policy.paymentProofUrl);
            }
        });
    };
  }, []);


  const handleChange = useCallback((field: keyof Member, value: any) => {
    setFormData(prev => {
        const newValue = typeof value === 'function' ? value(prev[field]) : value;
        return { ...prev, [field]: newValue };
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (field === 'bankDetails' && errors.bankDetailsError) {
      setErrors(prev => ({ ...prev, bankDetailsError: undefined }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Member | 'bankDetailsError' | 'email' | 'address' | 'documentsError', string>> = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required.';
    if (!formData.mobile?.trim()) newErrors.mobile = 'Mobile number is required.';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required.';

    if (!formData.email?.trim()) {
        newErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.address?.trim()) {
        newErrors.address = 'Address is required.';
    }

    if (formData.mobile && !/^\+?[0-9\s-]{10,15}$/.test(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid mobile number.';
    }

    const { bankDetails } = formData;
    const bankDetailsProvided = bankDetails && Object.values(bankDetails).some(v => v);
    if (bankDetailsProvided) {
        if (!bankDetails.bankName?.trim() || !bankDetails.accountNumber?.trim() || !bankDetails.ifscCode?.trim()) {
            newErrors.bankDetailsError = 'Please complete Bank Name, Account Number, and IFSC fields, or leave them all empty.';
        }
    }

    const activePolicies = (formData.policies || []).filter(p => p.status === 'Active');
    if (activePolicies.length > 0) {
        const insuranceTypeMap = new Map(insuranceTypes.map(it => [it.id, it]));
        const allMandatoryDocNames = new Set<string>();

        activePolicies.forEach(policy => {
            if (!policy.insuranceTypeId) return;

            let currentTypeId: string | null = policy.insuranceTypeId;
            while (currentTypeId) {
                const rulesForType = insuranceTypeDocumentRules.filter(rule => rule.insuranceTypeId === currentTypeId && rule.isMandatory);
                rulesForType.forEach(rule => {
                    const docMaster = documentMasters.find(dm => dm.id === rule.documentId);
                    if (docMaster) {
                        allMandatoryDocNames.add(docMaster.name);
                    }
                });
                currentTypeId = insuranceTypeMap.get(currentTypeId)?.parentId || null;
            }
        });

        if (allMandatoryDocNames.size > 0) {
            const uploadedDocTypes = new Set((formData.documents || []).map(d => d.documentType));
            const missingMandatoryDocs: string[] = [];
            
            allMandatoryDocNames.forEach(docName => {
                if (!uploadedDocTypes.has(docName)) {
                    missingMandatoryDocs.push(docName);
                }
            });

            if (missingMandatoryDocs.length > 0) {
                newErrors.documentsError = `The following mandatory documents are missing: ${missingMandatoryDocs.join(', ')}. Please upload them in the Documents tab.`;
            }
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSaveChanges = () => {
    if (validateForm()) {
        onSave(formData as Member, false);
        if (editingPolicyId) {
            setEditingPolicyId(null);
        }
    } else {
        addToast('Please correct the validation errors.', 'error');
        if (errors.documentsError || 'documentsError' in errors) {
            setActiveTab(ModalTab.Documents);
        }
    }
  };

  const handleSaveAndClose = () => {
    if (validateForm()) {
        onSave(formData as Member, true);
    } else {
        addToast('Please correct the errors before saving.', 'error');
        if (errors.documentsError || 'documentsError' in errors) {
            setActiveTab(ModalTab.Documents);
        }
    }
  };

  const handleVoiceNoteSave = useCallback((memberData: Member) => {
    onSave(memberData, false);
    setFormData(prev => ({...prev, ...memberData}));
  }, [onSave]);

  const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

  const getParentInsuranceType = useCallback((typeId: string): InsuranceTypeMaster | null => {
      let current = insuranceTypeMap.get(typeId);
      if (!current) return null;
      while(current.parentId) {
          const parent = insuranceTypeMap.get(current.parentId);
          if (!parent) break;
          current = parent;
      }
      return current;
  }, [insuranceTypeMap]);

  const applicableWorkflows = useMemo(() => {
      const workflows: { key: string; name: string }[] = [];
      (formData.policies || []).forEach(policy => {
          if (policy.insuranceTypeId) {
              const parentType = getParentInsuranceType(policy.insuranceTypeId);
              if (parentType) {
                  workflows.push({
                      key: policy.id,
                      name: `${parentType.name} - (${policy.schemeName || 'Unspecified'})`
                  });
              }
          }
      });
      if (formData.mutualFundHoldings && formData.mutualFundHoldings.length > 0) {
          workflows.push({ key: 'mutual-fund', name: 'Mutual Funds' });
      }
      return workflows;
  }, [formData, getParentInsuranceType]);

  useEffect(() => {
      if (applicableWorkflows.length > 0) {
          if (!selectedProcessFlowKey || !applicableWorkflows.some(w => w.key === selectedProcessFlowKey)) {
              setSelectedProcessFlowKey(applicableWorkflows[0].key);
          }
      } else {
          setSelectedProcessFlowKey(null);
      }
  }, [applicableWorkflows, selectedProcessFlowKey]);

  const currentProcessStages = useMemo(() => {
      if (!selectedProcessFlowKey) return [];

      const isMF = selectedProcessFlowKey === 'mutual-fund';
      if (isMF) {
          return processFlow
              .filter(p => p.isMutualFund)
              .sort((a, b) => a.order - b.order);
      }

      const selectedPolicy = formData.policies?.find(p => p.id === selectedProcessFlowKey);
      if (!selectedPolicy || !selectedPolicy.insuranceTypeId) return [];

      const parentType = getParentInsuranceType(selectedPolicy.insuranceTypeId);

      return processFlow
          .filter(p => p.insuranceTypeId === parentType?.id)
          .sort((a, b) => a.order - b.order);
  }, [processFlow, selectedProcessFlowKey, formData.policies, getParentInsuranceType]);

  const currentStageForTracker = useMemo(() => {
      if (!selectedProcessFlowKey || !formData.processStages) return currentProcessStages[0]?.name;
      return formData.processStages[selectedProcessFlowKey] || currentProcessStages[0]?.name;
  }, [formData.processStages, selectedProcessFlowKey, currentProcessStages]);

  const handleStageClick = useCallback((stage: ProcessStage) => {
      if (!selectedProcessFlowKey) return;
      
      const stageNames = currentProcessStages.map(s => s.name);
      const currentIndex = stageNames.indexOf(currentStageForTracker || stageNames[0]);
      const clickedIndex = stageNames.indexOf(stage);

      if (clickedIndex <= currentIndex) return;

      const performUpdate = (targetStage: string, history: ProcessLog[]) => {
          const updatedData = {
              ...formData,
              processStages: { ...formData.processStages, [selectedProcessFlowKey]: targetStage },
              processHistories: { ...formData.processHistories, [selectedProcessFlowKey]: history },
              stageLastChangedMap: { ...formData.stageLastChangedMap, [selectedProcessFlowKey]: new Date().toISOString() }
          };
          setFormData(updatedData);
          onSave(updatedData as Member, false);
          addToast(`Stage updated to "${targetStage}"`, 'success');
      };

      const currentHistory = formData.processHistories?.[selectedProcessFlowKey] || [];

      if (clickedIndex > currentIndex + 1) {
          const skipped = stageNames.slice(currentIndex + 1, clickedIndex);
          setJumpState({ isOpen: true, targetStage: stage, skippedStages: skipped });
      } else {
          const updatedHistory: ProcessLog[] = [
              ...currentHistory,
              { stage: currentStageForTracker!, timestamp: new Date().toISOString(), skipped: false }
          ];
          performUpdate(stage, updatedHistory);
      }
  }, [formData, onSave, addToast, currentProcessStages, currentStageForTracker, selectedProcessFlowKey]);

  const handleSaveJumpRemarks = () => {
      if (!jumpState.targetStage || !jumpRemarks.trim() || !selectedProcessFlowKey) {
          addToast('Remarks are mandatory for skipped stages.', 'error');
          return;
      }
      const timestamp = new Date().toISOString();
      const newHistory: ProcessLog[] = [...(formData.processHistories?.[selectedProcessFlowKey] || [])];

      newHistory.push({ stage: currentStageForTracker!, timestamp, skipped: false });

      jumpState.skippedStages.forEach(skipped => {
          newHistory.push({ stage: skipped, timestamp, remarks: jumpRemarks, skipped: true });
      });

      const updatedData = {
          ...formData,
          processStages: { ...formData.processStages, [selectedProcessFlowKey]: jumpState.targetStage },
          processHistories: { ...formData.processHistories, [selectedProcessFlowKey]: newHistory },
          stageLastChangedMap: { ...formData.stageLastChangedMap, [selectedProcessFlowKey]: timestamp }
      };

      setFormData(updatedData);
      onSave(updatedData as Member, false);
      addToast(`Jumped to stage "${jumpState.targetStage}" with remarks.`, 'success');

      setJumpState({ isOpen: false, targetStage: null, skippedStages: [] });
      setJumpRemarks('');
  };
  
    const handleCreateDependent = async (dependentData: Partial<Member>) => {
        const newMember = await onCreateDependentMember(formData as Member, dependentData);
        if (newMember) {
            addToast(`${newMember.name} has been added to the family.`, 'success');
        }
    };


  const handleLinkNewMember = useCallback((newMemberData: Partial<Member>) => {
      addToast(`Creating and linking ${newMemberData.name}... (simulation)`, 'success');

      const firstFamilyPolicyIndex = (formData.policies || []).findIndex(p => p.policyHolderType === 'Family');
      if (firstFamilyPolicyIndex > -1) {
        const newCoveredMember: CoveredMember = {
            id: `cm-${Date.now()}`,
            name: newMemberData.name || 'New Member',
            relationship: 'Family',
            dob: '',
        };

        const updatedPolicies = [...(formData.policies || [])];
        const updatedPolicy = { ...updatedPolicies[firstFamilyPolicyIndex] };
        updatedPolicy.coveredMembers = [...(updatedPolicy.coveredMembers || []), newCoveredMember];
        updatedPolicies[firstFamilyPolicyIndex] = updatedPolicy;

        handleChange('policies', updatedPolicies);
        addToast(`${newMemberData.name} added to the first family policy.`, 'success');
      } else {
          addToast('No family policy found to link to. Please change a policy type to "Family" first.', 'error');
      }

  }, [formData, handleChange, addToast]);

  const handleSaveNewReferrer = async (referrerData: { name: string; mobile: string; email?: string }) => {
    const newReferrer = await onCreateReferrer(referrerData);
    if (newReferrer) {
        handleChange('referrerId', newReferrer.id);
        setIsNewReferrerModalOpen(false);
    }
  };

  const TABS_CONFIG = [
      { name: ModalTab.BasicInfo, icon: <UserPlusIcon size={16}/> },
      { name: ModalTab.Documents, icon: <FileTextIcon size={16}/> },
      { name: ModalTab.Policies, icon: <Shield size={16}/> },
      { name: ModalTab.Investments, icon: <TrendingUp size={16}/> },
      { name: ModalTab.ProcessFlow, icon: <SlidersHorizontal size={16}/> },
      { name: ModalTab.Family, icon: <Users size={16}/> },
      { name: ModalTab.Tasks, icon: <ListTodo size={16}/> },
      { name: ModalTab.NotesAndReminders, icon: <Mic size={16}/> },
      { name: ModalTab.NeedsAnalysis, icon: <BarChart3 size={16}/> }
  ];

  if (!isOpen) return null;

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        contentClassName="bg-white rounded-lg shadow-xl w-full max-w-7xl transform transition-all dark:bg-gray-800 flex flex-col max-h-[95vh]"
    >
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white">{member?.id ? `Edit Customer: ${formData.name}` : 'Create New Customer'}</h2>
                <button 
                    onClick={onClose} 
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            {errors.documentsError && activeTab !== ModalTab.Documents && (
                <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded animate-fade-in">
                    <p className="text-sm font-semibold">{errors.documentsError}</p>
                </div>
            )}
        </div>

        <div className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-shrink-0 px-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-2 -mb-px overflow-x-auto">
                    {TABS_CONFIG.map((tab) => (
                        <button 
                            key={tab.name} 
                            onClick={() => setActiveTab(tab.name)} 
                            className={`inline-flex items-center gap-2 px-3 py-3 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-200 whitespace-nowrap ${ activeTab === tab.name ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent' }`}
                        >
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
                {activeTab === ModalTab.BasicInfo && 
                    <BasicInfoTab 
                        data={formData} 
                        onChange={handleChange} 
                        errors={errors} 
                        addToast={addToast} 
                        currentUser={currentUser} 
                        users={users} 
                        routes={routes} 
                        onUpdateRoutes={onUpdateRoutes} 
                        allMembers={allMembers} 
                        leadSources={leadSources} 
                        geographies={geographies} 
                        onUpdateGeographies={onUpdateGeographies} 
                        customerCategories={customerCategories} 
                        customerSubCategories={customerSubCategories} 
                        customerGroups={customerGroups} 
                        onAddNewReferrer={() => setIsNewReferrerModalOpen(true)} 
                        finrootsBranches={finrootsBranches} 
                        religions={religions}
                        customerFieldMasters={customerFieldMasters}
                        onUpdateCustomerFieldMasters={onUpdateCustomerFieldMasters}
                        designations={designations}
                        permissions={permissions}
                        genders={genders}
                        maritalStatuses={maritalStatuses}
                        roles={roles}
                    />}
                {activeTab === ModalTab.Documents && 
                    <DocumentsTab 
                        data={formData} 
                        allMembers={allMembers} 
                        onChange={handleChange} 
                        addToast={addToast} 
                        errors={errors} 
                        bankMasters={bankMasters} 
                        accountTypes={accountTypes}
                        documentMasters={documentMasters} 
                        onAddDocumentMaster={onAddDocumentMaster} 
                        insuranceTypes={insuranceTypes}
                        insuranceTypeDocumentRules={insuranceTypeDocumentRules}
                        permissions={permissions}
                    />}
                {activeTab === ModalTab.Policies && 
                    <PoliciesTab 
                        allMembers={allMembers} 
                        data={formData} 
                        onChange={(field, value) => { handleChange(field, value); }} 
                        onSave={(memberData) => onSave(memberData, false)} 
                        addToast={addToast} 
                        onGenerateProposal={onGenerateProposal} 
                        currentUser={currentUser} 
                        onFindUpsell={onFindUpsell} 
                        schemes={schemes} 
                        companies={companies} 
                        insuranceTypes={insuranceTypes} 
                        insuranceFields={insuranceFields} 
                        onUpdateInsuranceFields={onUpdateInsuranceFields} 
                        editingPolicyId={editingPolicyId} 
                        setEditingPolicyId={setEditingPolicyId} 
                        designations={designations}
                        permissions={permissions}
                        genders={genders}
                    />}
                {activeTab === ModalTab.Investments &&
                    <InvestmentsTab
                        data={formData}
                        onChange={handleChange}
                        amcs={amcs}
                        schemes={mutualFundSchemes}
                        addToast={addToast}
                        mutualFundFields={mutualFundFields}
                        permissions={permissions}
                    />
                }
                {activeTab === ModalTab.ProcessFlow && (
                    <div>
                        {applicableWorkflows.length > 0 ? (
                            <>
                                {applicableWorkflows.length > 1 && (
                                    <div className="mb-4 max-w-sm">
                                        <label htmlFor="workflow-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Workflow</label>
                                        <select
                                            id="workflow-select"
                                            value={selectedProcessFlowKey || ''}
                                            onChange={(e) => setSelectedProcessFlowKey(e.target.value)}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            {applicableWorkflows.map(wf => (
                                                <option key={wf.key} value={wf.key}>{wf.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <ProcessFlowTracker
                                    currentStage={currentStageForTracker}
                                    processSteps={currentProcessStages.map(s => s.name)}
                                    onStageClick={handleStageClick}
                                    canModify={canModify}
                                />
                            </>
                        ) : (
                            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                                No policies or investments have been added for this customer yet. Add a product in the 'Policies' or 'Investments' tab to see its process flow.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === ModalTab.NeedsAnalysis && 
                    <NeedsAnalysisTab 
                        data={formData} 
                        onChange={handleChange} 
                        addToast={addToast} 
                        permissions={permissions}
                    />}
                {activeTab === ModalTab.NotesAndReminders && 
                    <NotesAndRemindersTab 
                        data={formData} 
                        onSave={handleVoiceNoteSave} 
                        addToast={addToast} 
                        onCreateTask={(task) => onCreateTask(task)} 
                        onChange={handleChange} 
                        currentUser={currentUser} 
                        designations={designations}
                        permissions={permissions}
                        isCurrentUserAdvisor={isCurrentUserAdvisor}
                        occasionTypeMasters={occasionTypeMasters}
                        onUpdateOccasionTypeMasters={onUpdateOccasionTypeMasters}
                    />}
                {activeTab === ModalTab.Family && 
                    <FamilyTreeTab 
                        member={formData as Member} 
                        allMembers={allMembers} 
                        onRelieveMember={onRelieveMember} 
                        onCreateDependent={handleCreateDependent}
                        onSetSpoc={() => handleChange('isSPOC', true)}
                        currentUser={currentUser} 
                        designations={designations}
                        genders={genders}
                        maritalStatuses={maritalStatuses}
                        relationshipTypes={relationshipTypes}
                        permissions={permissions}
                    />}
                {activeTab === ModalTab.Tasks && 
                    <TasksTab 
                        member={formData as Member} 
                        tasks={allTasks} 
                        taskStatusMasters={taskStatusMasters} 
                        taskMasters={taskMasters} 
                        users={users} 
                        onCreateTask={onCreateTask} 
                        addToast={addToast} 
                        permissions={permissions}
                        isCurrentUserAdvisor={isCurrentUserAdvisor}
                    />}
            </div>
        </div>
        {/* --- MODIFICATION BEGINS --- */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
            <div>
                {creatorInfo && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>Created by:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{creatorInfo.name} ({creatorInfo.role})</span>
                        {creatorInfo.isInactive && <span className="w-2 h-2 bg-red-500 rounded-full" title="Inactive Employee"></span>}
                    </div>
                )}
            </div>
        {/* --- MODIFICATION ENDS --- */}
            <div className="flex gap-3">
                <Button 
                    onClick={onClose} 
                    variant="secondary"
                >
                    Cancel
                </Button>
                {member?.id ? (
                    <>
                        <Button 
                            onClick={handleSaveChanges} 
                            variant="primary"
                            disabled={isReadOnly}
                        >
                            Save Changes
                        </Button>
                        <Button 
                            onClick={handleSaveAndClose} 
                            variant="success"
                            disabled={isReadOnly}
                        >
                            Save & Close
                        </Button>
                    </>
                ) : (
                    <Button 
                        onClick={handleSaveAndClose} 
                        variant="success"
                        disabled={!canCreate}
                    >
                        Create Customer
                    </Button>
                )}
            </div>
        </div>

        {jumpState.isOpen && (
            <Modal 
                isOpen={jumpState.isOpen} 
                onClose={() => setJumpState({ ...jumpState, isOpen: false })}
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Jump to Stage: {jumpState.targetStage}</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You are skipping the following stage(s): <strong>{jumpState.skippedStages.join(', ')}</strong>. Please provide a mandatory remark for this action.
                    </p>
                    <div className="mt-4">
                        <textarea
                            value={jumpRemarks}
                            onChange={(e) => setJumpRemarks(e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="e.g., Customer provided all documents upfront."
                        />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={() => setJumpState({ ...jumpState, isOpen: false })}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveJumpRemarks}
                    >
                        Confirm Jump
                    </Button>
                </div>
            </Modal>
        )}
        {isNewReferrerModalOpen && (
            <NewReferrerModal
                isOpen={isNewReferrerModalOpen}
                onClose={() => setIsNewReferrerModalOpen(false)}
                onSave={handleSaveNewReferrer}
                addToast={addToast}
            />
        )}
    </Modal>
  );
};