import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// MODIFIED: Import permission-related types
import { 
    Member, ModalTab, User, Route, ProcessStage, ProcessLog, Policy, BankDetails, SchemeMaster, 
    Company, DocumentMaster, SchemeDocumentMapping, RelationshipType, LeadSourceMaster, Geography, 
    BankMaster, CustomerCategory, CustomerSubCategory, CustomerGroup, FamilyMemberNode, Task, 
    TaskStatusMaster, TaskMaster, PolicyChecklistMaster, InsuranceTypeMaster, InsuranceFieldMaster, 
    BusinessVertical, CoveredMember, FinRootsBranch, Religion, CustomerFieldMaster, AMC, 
    MutualFundScheme, MutualFundHolding, MutualFundTransaction, MutualFundFieldMaster, Designation,
    AppModule, PermissionLevel
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

const FamilyTreeTab: React.FC<{
    member: Member;
    allMembers: Member[];
    onRelieveMember: (memberId: string) => void;
    currentUser: User | null;
    designations: Designation[];
}> = ({ member, allMembers, onRelieveMember, currentUser, designations }) => {

    const isAdmin = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin', [currentUser, designations]);

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
        const dependentMembers = allMembers.filter(m => m.spocId === spocToBuildFrom.sno && m.id !== spocToBuildFrom.id);

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


    const handleRelieveClick = (memberToRelieve: Member) => {
        if (window.confirm(`Are you sure you want to relieve ${memberToRelieve.name} from the family group? They will become an independent customer.`)) {
            onRelieveMember(memberToRelieve.id);
        }
    };

    const TreeNode: React.FC<{ node: FamilyMemberNode; isRoot?: boolean; }> = ({ node, isRoot = false }) => {
        const memberNode = allMembers.find(m => m.id === node.id);
        const isRelieved = !!memberNode?.relievedTimestamp;
        const hasChildren = node.children && node.children.length > 0;

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
                                <p className="text-xs text-gray-500 dark:text-gray-400">{node.isSPOC ? `${node.memberId} (SPOC)` : node.memberId}</p>
                                {isRelieved && <span className="mt-1 text-xs font-bold bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full">Relieved</span>}
                            </div>
                            {memberNode && !memberNode.isSPOC && isAdmin && !isRelieved && (
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

    if (!familyTree || !treeRootSpoc || !titleSpoc) {
        return <div className="text-center p-8 text-gray-500 dark:text-gray-400">This member is not part of a family group. To create one, go to the 'Policies' tab, edit a policy, and change the 'Policy Holder Type' to 'Family'.</div>;
    }

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Family Group: {titleSpoc.familyName || `${titleSpoc.name}'s Family`}
            </h3>
            <ul className="space-y-4">
                <TreeNode node={familyTree} isRoot />
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
    permissions: { [key in AppModule]?: PermissionLevel }; // NEW
}> = ({ member, tasks, taskStatusMasters, taskMasters, users, onCreateTask, addToast, permissions }) => {
    const [isCreating, setIsCreating] = useState(false);
    
    // NEW: Permission check
    const canCreate = permissions?.taskManagement === 'create' || permissions?.taskManagement === 'modify';

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
                {/* MODIFIED: Button is permission-gated */}
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
  addToast: (message: string, type?: 'success' | 'error') => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
  onRelieveMember: (memberId: string) => void; 
  currentUser: User | null;
  users: User[];
  routes: Route[];
  onUpdateRoutes: (data: Route[]) => void;
  processFlow: ProcessStage[];
  onGenerateProposal: (member: Member, policy: Policy) => void;
  onFindUpsell: (member: Member) => Promise<string | null>;
  allMembers: Member[];
  schemes: SchemeMaster[];
  companies: Company[];
  documentMasters: DocumentMaster[];
  schemeDocumentMappings: SchemeDocumentMapping[];
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
  policyChecklistMasters: PolicyChecklistMaster[];
  onUpdatePolicyChecklistMasters: (data: PolicyChecklistMaster[]) => void;
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
  // NEW: Accept permissions prop
  permissions: { [key in AppModule]?: PermissionLevel };
}

export const MemberModal: React.FC<MemberModalProps> = ({
    isOpen, onClose, member, initialTab, onSave, addToast, onCreateTask, onRelieveMember, 
    currentUser, users, routes, onUpdateRoutes, processFlow, onGenerateProposal, onFindUpsell, 
    allMembers, schemes, companies, documentMasters, schemeDocumentMappings, relationshipTypes, 
    leadSources, geographies, onUpdateGeographies, bankMasters, customerCategories, 
    customerSubCategories, customerGroups, allTasks, taskStatusMasters, taskMasters, 
    policyChecklistMasters, onUpdatePolicyChecklistMasters, insuranceTypes, insuranceFields, 
    onUpdateInsuranceFields, customerFieldMasters, onUpdateCustomerFieldMasters, 
    onCreateReferrer, finrootsBranches, religions, onAddDocumentMaster, amcs, 
    mutualFundSchemes, mutualFundFields, designations, permissions
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab | string>(ModalTab.BasicInfo);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Member | 'bankDetailsError' | 'email' | 'address', string>>>({});
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const [jumpState, setJumpState] = useState<{isOpen: boolean; targetStage: ProcessStage | null; skippedStages: ProcessStage[]}>({ isOpen: false, targetStage: null, skippedStages: [] });
  const [jumpRemarks, setJumpRemarks] = useState('');

  const prevMemberIdRef = useRef<string | null>(null);
  const [isNewReferrerModalOpen, setIsNewReferrerModalOpen] = useState(false);
  
  // NEW: Permission checks for the customer module
  const canCreate = permissions?.customers === 'create' || permissions?.customers === 'modify';
  const canModify = permissions?.customers === 'modify';
  // If we are editing an existing member but don't have modify rights, the modal is read-only.
  const isReadOnly = !!member && !canModify;

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  const creatorName = useMemo(() => {
    if (formData.createdBy) {
        return userMap.get(formData.createdBy) || 'Unknown User';
    }
    return null;
  }, [formData.createdBy, userMap]);

  const getInitialFormData = (member: Member | null): Partial<Member> => {
    if (member) return JSON.parse(JSON.stringify(member));
    const isCurrentUserAdvisor = designations.find(d => d.id === currentUser?.designationId)?.isAdvisor;
    return {
      name: '', dob: '', maritalStatus: 'Single', mobile: '', state: 'Maharashtra', city: 'Mumbai City', address: '',
      memberType: 'Silver', active: true, panCard: '', aadhaar: '', policies: [], voiceNotes: [], documents: [],
      documentChecklist: {}, lat: 0, lng: 0,
      assignedTo: isCurrentUserAdvisor ? [currentUser!.id] : [],
      routeId: null, processStage: processFlow[0] || 'Initial Contact', processHistory: [],
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
  }, [member, isOpen, initialTab, currentUser, processFlow, designations]);

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
    const newErrors: Partial<Record<keyof Member | 'bankDetailsError' | 'email' | 'address', string>> = {};
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
    }
  };

  const handleSaveAndClose = () => {
    if (validateForm()) {
        onSave(formData as Member, true);
    } else {
        addToast('Please correct the errors before saving.', 'error');
    }
  };

  const handleVoiceNoteSave = useCallback((memberData: Member) => {
    onSave(memberData, false);
    setFormData(prev => ({...prev, ...memberData}));
  }, [onSave]);

  const handleStageClick = useCallback((stage: ProcessStage) => {
    const currentIndex = processFlow.indexOf(formData.processStage || processFlow[0]);
    const clickedIndex = processFlow.indexOf(stage);

    if (clickedIndex <= currentIndex) return;

    if (clickedIndex > currentIndex + 1) {
      const skipped = processFlow.slice(currentIndex + 1, clickedIndex);
      setJumpState({ isOpen: true, targetStage: stage, skippedStages: skipped });
    } else {
      const updatedHistory: ProcessLog[] = [
          ...(formData.processHistory || []),
          { stage: formData.processStage!, timestamp: new Date().toISOString(), skipped: false }
      ];
      const updatedData = { ...formData, processStage: stage, processHistory: updatedHistory, stageLastChanged: new Date().toISOString() };
      setFormData(updatedData);
      onSave(updatedData as Member, false);
      addToast(`Stage updated to "${stage}"`, 'success');
    }
  }, [formData, processFlow, onSave, addToast]);

  const handleSaveJumpRemarks = () => {
    if (!jumpState.targetStage || !jumpRemarks.trim()) {
      addToast('Remarks are mandatory for skipped stages.', 'error');
      return;
    }
    const timestamp = new Date().toISOString();
    const newHistory: ProcessLog[] = [...(formData.processHistory || [])];

    newHistory.push({ stage: formData.processStage!, timestamp, skipped: false });

    jumpState.skippedStages.forEach(skipped => {
        newHistory.push({ stage: skipped, timestamp, remarks: jumpRemarks, skipped: true });
    });

    const updatedData = {
        ...formData,
        processStage: jumpState.targetStage,
        processHistory: newHistory,
        stageLastChanged: timestamp,
    };

    setFormData(updatedData);
    onSave(updatedData as Member, false);
    addToast(`Jumped to stage "${jumpState.targetStage}" with remarks.`, 'success');

    setJumpState({ isOpen: false, targetStage: null, skippedStages: [] });
    setJumpRemarks('');
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
                        // MODIFIED: Pass permissions
                        permissions={permissions}
                    />}
                {activeTab === ModalTab.Documents && 
                    <DocumentsTab 
                        data={formData} 
                        allMembers={allMembers} 
                        onChange={handleChange} 
                        addToast={addToast} 
                        errors={errors} 
                        bankMasters={bankMasters} 
                        policyChecklistMasters={policyChecklistMasters} 
                        onUpdatePolicyChecklistMasters={onUpdatePolicyChecklistMasters} 
                        documentMasters={documentMasters} 
                        onAddDocumentMaster={onAddDocumentMaster} 
                        insuranceTypes={insuranceTypes}
                        // MODIFIED: Pass permissions
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
                        // MODIFIED: Pass permissions
                        permissions={permissions}
                    />}
                {activeTab === ModalTab.Investments &&
                    <InvestmentsTab
                        data={formData}
                        onChange={handleChange}
                        amcs={amcs}
                        schemes={mutualFundSchemes}
                        addToast={addToast}
                        mutualFundFields={mutualFundFields}
                        // MODIFIED: Pass permissions
                        permissions={permissions}
                    />
                }
                {activeTab === ModalTab.ProcessFlow && (
                    <ProcessFlowTracker
                        currentStage={formData.processStage || processFlow[0]}
                        processSteps={processFlow}
                        onStageClick={handleStageClick}
                        // MODIFIED: Pass permissions
                        canModify={canModify}
                    />
                )}
                {activeTab === ModalTab.NeedsAnalysis && 
                    <NeedsAnalysisTab 
                        data={formData} 
                        onChange={handleChange} 
                        addToast={addToast} 
                        // MODIFIED: Pass permissions
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
                        // MODIFIED: Pass permissions
                        permissions={permissions}
                    />}
                {activeTab === ModalTab.Family && 
                    <FamilyTreeTab 
                        member={formData as Member} 
                        allMembers={allMembers} 
                        onRelieveMember={onRelieveMember} 
                        currentUser={currentUser} 
                        designations={designations}
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
                        // MODIFIED: Pass permissions
                        permissions={permissions}
                    />}
            </div>
        </div>

        <div className="flex-shrink-0 flex justify-between items-center p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
            <div>
                {creatorName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created by: <span className="font-semibold">{creatorName}</span>
                    </p>
                )}
            </div>
            <div className="flex gap-3">
                <Button 
                    onClick={onClose} 
                    variant="secondary"
                >
                    Cancel
                </Button>
                {/* MODIFIED: Save/Create buttons are now permission-gated */}
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