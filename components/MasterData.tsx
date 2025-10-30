import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// MODIFIED: Added FinancialYear, DocumentNumbering, InsuranceTypeDocumentRule and removed unused types
import { 
    BusinessVertical, LeadSourceMaster, SchemeMaster, Company, FinRootsBranch, Geography, RelationshipType, 
    DocumentMaster, /*SchemeDocumentMapping,*/ GiftMaster, TaskStatusMaster, CustomerCategory, PolicyType, GeneralInsuranceType,
    BankMaster, Member, FinRootsCompanyInfo, CustomerSubCategory, CustomerGroup, TaskMaster, EmployeeProfile, BranchCompanyMapping, /*PolicyChecklistMaster,*/
    InsuranceTypeMaster,
    InsuranceFieldMaster,
    CustomerFieldMaster,
    User,
    ConcretePolicyType,
    CustomerTier,
    ReferralType,
    Route,
    Designation, DesignationPermissions, AppModule,
    IncomeCategoryLevel1, 
    IncomeCategoryLevel2, 
    ExpenseCategoryLevel1,
    ExpenseCategoryLevel2,
    ExpenseCategoryLevel3,
    Religion,
    Festival,
    FestivalDate,
    AMC,
    MutualFundScheme,
    MutualFundSchemeCategory,
    MutualFundFieldMaster,
    Gender, MaritalStatus, CustomerType,
    ProcessStageMaster,AccountType,Role,RolePermissions,
    FinancialYear, DocumentNumbering,PermissionLevel,
    InsuranceTypeDocumentRule,LeadStageMaster,Lead
} from '../types.ts';
import { Database,Workflow, Briefcase,Layers,Handshake,Link2 ,HandCoins,UserPlus ,Sparkles ,HeartHandshake ,Globe2,Landmark ,Venus ,Heart , Users, GitBranch, MapPin, Link as LinkIcon, FileText as FileTextIcon, Gift, CheckSquare, Settings, Plus, Save, Edit2, Trash2, X, Building, Search, AlertTriangle, ChevronRight, ListTodo, SlidersHorizontal, ArrowUp, ArrowDown, CornerDownRight, GripVertical, ChevronDown, Lock, Award, IndianRupee, Calendar as CalendarIcon, Check, TrendingUp, UserCog, Route as RouteIcon } from 'lucide-react';

// --- MOVED PROPS INTERFACE TO TOP LEVEL ---
// --- MODIFIED: Added Roles and renamed permission props ---
interface MasterDataProps {
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    allLeads: Lead[];
    users: User[];
    businessVerticals: BusinessVertical[];
    onUpdateBusinessVerticals: (data: BusinessVertical[]) => void;
    leadSources: LeadSourceMaster[];
    onUpdateLeadSources: (data: LeadSourceMaster[]) => void;
    schemes: SchemeMaster[];
    onUpdateSchemes: (data: SchemeMaster[]) => void;
    agencies: Company[];
    onUpdateAgencies: (data: Company[]) => void;
    finrootsBranches: FinRootsBranch[];
    onUpdateFinrootsBranches: (data: FinRootsBranch[]) => void;
    finrootsCompanyInfo: FinRootsCompanyInfo;
    onUpdateFinRootsCompanyInfo: (data: FinRootsCompanyInfo) => void;
    geographies: Geography[];
    onUpdateGeographies: (data: Geography[]) => void;
    relationshipTypes: RelationshipType[];
    onUpdateRelationshipTypes: (data: RelationshipType[]) => void;
    documentMasters: DocumentMaster[];
    onUpdateDocumentMasters: (data: DocumentMaster[]) => void;
    // schemeDocumentMappings: SchemeDocumentMapping[]; // --- REMOVED ---
    // onUpdateSchemeDocumentMappings: (data: SchemeDocumentMapping[]) => void; // --- REMOVED ---
    insuranceTypeDocumentRules: InsuranceTypeDocumentRule[]; // --- ADDED ---
    onUpdateInsuranceTypeDocumentRules: (data: InsuranceTypeDocumentRule[]) => void; // --- ADDED ---
    giftMasters: GiftMaster[];
    onUpdateGiftMasters: (data: GiftMaster[]) => void;
    customerTiers: CustomerTier[];
    onUpdateCustomerTiers: (data: CustomerTier[]) => void;
    taskStatuses: TaskStatusMaster[];
    onUpdateTaskStatuses: (data: TaskStatusMaster[]) => void;
    customerCategories: CustomerCategory[];
    onUpdateCustomerCategories: (data: CustomerCategory[]) => void;
    bankMasters: BankMaster[];
    onUpdateBankMasters: (data: BankMaster[]) => void;
    customerSubCategories: CustomerSubCategory[];
    onUpdateCustomerSubCategories: (data: CustomerSubCategory[]) => void;
    customerGroups: CustomerGroup[];
    onUpdateCustomerGroups: (data: CustomerGroup[]) => void;
    taskMasters: TaskMaster[];
    onUpdateTaskMasters: (data: TaskMaster[]) => void;
    // policyChecklistMasters: PolicyChecklistMaster[]; // --- REMOVED ---
    // onUpdatePolicyChecklistMasters: (data: PolicyChecklistMaster[]) => void; // --- REMOVED ---
    insuranceTypes: InsuranceTypeMaster[];
    onUpdateInsuranceTypes: (data: InsuranceTypeMaster[]) => void;
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    customerFieldMasters: CustomerFieldMaster[]; 
    onUpdateCustomerFieldMasters: (data: CustomerFieldMaster[]) => void; 
    currentUser: User | null;
    operatingCompanies: Company[];
    onUpdateOperatingCompanies: (data: Company) => void;
    routes: Route[];
    onUpdateRoutes: (data: Route[]) => void;
    designations: Designation[];
    onUpdateDesignations: (data: Designation[]) => void;
    roles: Role[];
    onUpdateRoles: (data: Role[]) => void;
    rolePermissions: RolePermissions[]; // Corrected
    onUpdateRolePermissions: (permissions: RolePermissions) => void; // Corrected
    customerTierCalculationMethod: 'sumAssured' | 'premium';
    onUpdateCustomerTierCalculationMethod: (method: 'sumAssured' | 'premium') => void;
    expenseCategoriesLevel1: ExpenseCategoryLevel1[];
    onUpdateExpenseCategoriesLevel1: (data: ExpenseCategoryLevel1[]) => void;
    expenseCategoriesLevel2: ExpenseCategoryLevel2[];
    onUpdateExpenseCategoriesLevel2: (data: ExpenseCategoryLevel2[]) => void;
    expenseCategoriesLevel3: ExpenseCategoryLevel3[];
    onUpdateExpenseCategoriesLevel3: (data: ExpenseCategoryLevel3[]) => void;
    incomeCategoriesLevel1: IncomeCategoryLevel1[];
    onUpdateIncomeCategoriesLevel1: (data: IncomeCategoryLevel1[]) => void;
    incomeCategoriesLevel2: IncomeCategoryLevel2[];
    onUpdateIncomeCategoriesLevel2: (data: IncomeCategoryLevel2[]) => void;
    religions: Religion[];
    onUpdateReligions: (data: Religion[]) => void;
    festivals: Festival[];
    onUpdateFestivals: (data: Festival[]) => void;
    festivalDates: FestivalDate[];
    onUpdateFestivalDates: (data: FestivalDate[]) => void;
    amcs: AMC[];
    onUpdateAmcs: (data: AMC[]) => void;
    mutualFundSchemes: MutualFundScheme[];
    onUpdateMutualFundSchemes: (data: MutualFundScheme[]) => void;
    mutualFundFields: MutualFundFieldMaster[];
    onUpdateMutualFundFields: (data: MutualFundFieldMaster[]) => void;
    genders: Gender[];
    onUpdateGenders: (data: Gender[]) => void;
    maritalStatuses: MaritalStatus[];
    onUpdateMaritalStatuses: (data: MaritalStatus[]) => void;
    customerTypes: CustomerType[];
    onUpdateCustomerTypes: (data: CustomerType[]) => void;
    processStageMasters: ProcessStageMaster[];
    onUpdateProcessStageMasters: (data: ProcessStageMaster[]) => void;
    accountTypes: AccountType[];
    onUpdateAccountTypes: (data: AccountType[]) => void;
    financialYears: FinancialYear[];
    onUpdateFinancialYears: (data: FinancialYear[]) => void;
    documentNumbering: DocumentNumbering[];
    onUpdateDocumentNumbering: (data: DocumentNumbering[]) => void;
    activeFinancialYearId: string | null;
    leadStageMasters: LeadStageMaster[];
    onUpdateLeadStageMasters: (data: LeadStageMaster[]) => void;
}
// --- MOVED SHARED CONSTANTS TO TOP LEVEL ---
const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";
const themeAwareInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";
const modalInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";

// --- INLINED UI COMPONENTS TO FIX BUILD ERRORS ---

// amazonq-ignore-next-line
const Button = React.forwardRef<
    HTMLButtonElement,
    {
        onClick?: (event: React.MouseEvent<HTMLElement>) => void;
        children: React.ReactNode;
        variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'light';
        size?: 'small' | 'medium';
        disabled?: boolean;
        className?: string;
        type?: 'button' | 'submit';
        as?: 'button' | 'span';
        title?: string;
    }
>(({ onClick, children, variant = 'primary', size = 'medium', disabled = false, className = '', type = 'button', as = 'button', title }, ref) => {
    // Use inline-flex to avoid layout shrinking when buttons are placed inside flex parents
    const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeClasses = size === 'small' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        light: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/50 focus:ring-gray-400'
    };

    // sizeClasses is already the correct string for the selected size
    const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`;

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        if (onClick) {
            onClick(e);
        }
    };

    if (as === 'span') {
        return (
            <span onClick={handleClick} className={combinedClasses} title={title}>
                {children}
            </span>
        );
    }

    return (
        <button type={type} onClick={handleClick} disabled={disabled} className={combinedClasses} title={title} ref={ref}>
            {children}
        </button>
    );
});

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <input
            {...props}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 ${props.className}`}
        />
    </div>
);

const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    contentClassName?: string;
}> = ({ isOpen, onClose, children, contentClassName = "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all" }) => {
    const modalRef = useRef<HTMLDivElement>(null);

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

            if (event.key === 'Tab' && firstElement && lastElement) {
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
        
        const focusTimeout = setTimeout(() => {
            if (firstElement && modalNode) {
                firstElement.focus();
            }
        }, 100);

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} className={contentClassName} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    srLabel?: string;
    disabled?: boolean;
}> = ({ enabled, onChange, srLabel = 'Toggle', disabled = false }) => {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            className={`${enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}            role="switch"
            aria-checked={enabled}
            disabled={disabled}
        >
            <span className="sr-only">{srLabel}</span>
            <span
                aria-hidden="true"
                className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
};

const SortableHeader: React.FC<{
    sortKey: string;
    label: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: string) => void;
    className?: string;
    reorderable?: boolean;
}> = ({ sortKey, label, sortConfig, onSort, className = '', reorderable }) => (
    <th className={`px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase ${className}`}>
        <button onClick={() => !reorderable && onSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100" disabled={reorderable}>
            {label}
            {!reorderable && (
                <div className="w-4">
                    {sortConfig.key === sortKey ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                        <ArrowUp size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            )}
        </button>
    </th>
);

const SearchableSelect: React.FC<{
    label?: string;
    options: { value: string; label: string }[];
    value: string | null;
    onChange: (value: string | null) => void;
    onCreate?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ label, options, value, onChange, onCreate, placeholder = 'Select...', disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

       const filteredOptions = useMemo(() =>
        options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase())),
        [options, searchTerm]
    );

    const canCreate = onCreate && searchTerm && !filteredOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());

    const handleCreate = () => {
        if (onCreate && searchTerm) {
            onCreate(searchTerm);
            onChange(searchTerm); // Select the newly created item
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className="relative" ref={ref}>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border dark:border-gray-600 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm ${disabled ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
                <span className={`block truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {selectedOption?.label || placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    <div className="p-2">
                        <Input
                            type="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search or create..."
                            className="w-full"
                            autoFocus
                        />
                    </div>
                    {filteredOptions.length > 0 ? filteredOptions.map(option => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                            className="relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-between"
                        >
                            <span>{option.label}</span>
                            {value === option.value && <Check size={16} className="text-blue-600" />}
                        </div>
                    )) : (
                        !canCreate && 
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-500">
                            Nothing found.
                        </div>
                    )}
                    {canCreate && (
                         <div onClick={handleCreate}
                            className="relative cursor-pointer select-none py-2 px-4 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center gap-2"
                        >
                            <Plus size={16} /> Create "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- NEW: Financial Year Management Component (FINAL CORRECTED VERSION) ---
// --- START OF FINAL FIX: NEW DEDICATED MODAL COMPONENT ---
// --- START OF FINAL FIX: NEW DEDICATED MODAL COMPONENT ---
const DocNumRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<DocumentNumbering>) => void;
    initialData: Partial<DocumentNumbering> | null;
    financialYears: FinancialYear[];
    canModify: boolean; // Permissions Prop
}> = ({ isOpen, onClose, onSave, initialData, financialYears, canModify }) => {

    const [prefix, setPrefix] = useState('');
    const [startingNumber, setStartingNumber] = useState('');
    const [finYearId, setFinYearId] = useState<string | null>(null);
    const [suffix, setSuffix] = useState(''); // MODIFICATION: Added state for suffix

    useEffect(() => {
        if (isOpen && initialData) {
            setPrefix(initialData.prefix || '');
            setStartingNumber(String(initialData.startingNumber || '1'));
            setFinYearId(initialData.finYearId || null);
            setSuffix(initialData.suffix || ''); // MODIFICATION: Initialize suffix state
        }
    }, [isOpen, initialData]);

    const handleStartingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[0-9]*$/.test(val)) {
            setStartingNumber(val);
        }
    };

    const handleSaveClick = () => {
        const finalStartingNumber = parseInt(startingNumber, 10);
               if (!prefix.trim() || !finYearId) {
            alert('Prefix and Financial Year are required.'); // Replace with addToast in real app
            return;
        }
        if (isNaN(finalStartingNumber) || finalStartingNumber < 1) {
            alert('Starting Number must be a valid number of 1 or greater.'); // Replace with addToast
            return;
        }

        onSave({
            ...initialData,
            prefix,
            startingNumber: finalStartingNumber,
            finYearId,
            suffix, // MODIFICATION: Include suffix in save data
        });
    };
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={e => { e.preventDefault(); handleSaveClick(); }}>
                <div className="p-6 border-b"><h2 className="text-xl font-bold">{initialData?.id ? 'Edit' : 'Add'} {initialData?.type} Rule</h2></div>
                <div className="p-6 space-y-4">
                    <Input label="Prefix (Kword)" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="e.g., VCH/25-26/" required disabled={!canModify}/>
                    {/* --- MODIFICATION: Added Suffix Input --- */}
                    <Input label="Suffix (Optional)" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="e.g., /FIN" disabled={!canModify}/>
                    <Input 
                        label="Starting Number" 
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={startingNumber} 
                        onChange={handleStartingNumberChange} 
                        required 
                        disabled={!canModify}
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Financial Year</label>
                        <select value={finYearId || ''} onChange={e => setFinYearId(e.target.value)} className={selectClasses} required disabled={!canModify}>
                            <option value="" disabled>Select FY</option>
                            {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.finYear}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!canModify}>Save Rule</Button></div>
            </form>
        </Modal>
    );
};
// --- END OF NEW DEDICATED MODAL COMPONENT ---


// --- Financial Year Management Component ---
const FinancialYearManager: React.FC<MasterDataProps & { canCreate: boolean; canModify: boolean }> = (props) => {
    const { 
        financialYears, onUpdateFinancialYears, 
        documentNumbering, onUpdateDocumentNumbering,
        addToast, activeFinancialYearId, canCreate, canModify
    } = props;
    
    const [selectedFinYearId, setSelectedFinYearId] = useState<string | null>(activeFinancialYearId);
    const [isFYModalOpen, setIsFYModalOpen] = useState(false);
    const [editingFY, setEditingFY] = useState<Partial<FinancialYear> | null>(null);
    const [isDocNumModalOpen, setIsDocNumModalOpen] = useState(false);
    const [editingDocNum, setEditingDocNum] = useState<Partial<DocumentNumbering> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
    
    const openFYModal = (item: FinancialYear | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingFY(item ? { ...item } : { finYear: '', fromDate: '', toDate: '', status: 'Active' });
        setIsFYModalOpen(true);
    };

    const closeFYModal = () => {
        setIsFYModalOpen(false);
        setEditingFY(null);
        triggerButtonRef.current?.focus();
    };

    const handleSaveFY = () => {
        if (!canModify) return;
        if (!editingFY || !editingFY.finYear?.trim() || !editingFY.fromDate || !editingFY.toDate) {
            addToast('All fields are required.', 'error');
            return;
        }
        if (new Date(editingFY.fromDate) >= new Date(editingFY.toDate)) {
            addToast('"From Date" must be earlier than "To Date".', 'error');
            return;
        }
        
        // FIX: Ensure status is correctly typed before saving
        const statusToSave: 'Active' | 'Inactive' = (editingFY.status === 'Active' || editingFY.status === 'Inactive') ? editingFY.status : 'Active';

        if (editingFY.id) {
            onUpdateFinancialYears(financialYears.map(fy => fy.id === editingFY.id ? { ...editingFY as FinancialYear, status: statusToSave } : fy));
        } else {
            const newFY: FinancialYear = { id: `fy-${Date.now()}`, ...editingFY, status: statusToSave } as FinancialYear;
            onUpdateFinancialYears([...financialYears, newFY]);
        }
        closeFYModal();
    };

    const openDocNumModal = (type: 'Voucher' | 'Receipt', item: DocumentNumbering | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        const initialData = item ? { ...item } : { type, prefix: '', startingNumber: 1, finYearId: selectedFinYearId, status: 'Active' as const, suffix: '' };
        setEditingDocNum(initialData);
        setIsDocNumModalOpen(true);
    };
    
    const closeDocNumModal = () => {
        setIsDocNumModalOpen(false);
        setEditingDocNum(null);
        triggerButtonRef.current?.focus();
    };

    const handleSaveDocNum = (dataToSave: Partial<DocumentNumbering>) => {
        if (!canModify) return;
        const isDuplicate = documentNumbering.some(dn => 
            dn.id !== dataToSave.id &&
            dn.type === dataToSave.type &&
            dn.finYearId === dataToSave.finYearId
        );
        
        if (isDuplicate) {
            addToast(`A numbering rule for ${dataToSave.type}s already exists for this Financial Year.`, 'error');
            return;
        }

        // FIX: Explicitly cast status to the union type when mapping/updating
        if (dataToSave.id) {
            onUpdateDocumentNumbering(documentNumbering.map(dn => 
                dn.id === dataToSave.id 
                    ? { 
                        ...dataToSave as DocumentNumbering, 
                        status: (dataToSave.status === 'Active' || dataToSave.status === 'Inactive') ? dataToSave.status as 'Active' | 'Inactive' : dn.status
                      } 
                    : dn
            ));
        } else {
            const newDocNum: DocumentNumbering = {
                id: `dn-${Date.now()}`,
                ...dataToSave,
                status: 'Active' // Initial status is already literal 'Active'
            } as DocumentNumbering;
            onUpdateDocumentNumbering([...documentNumbering, newDocNum]);
        }
        closeDocNumModal();
    };
    
    const voucherNumbering = useMemo(() => documentNumbering.filter(dn => dn.finYearId === selectedFinYearId && dn.type === 'Voucher'), [documentNumbering, selectedFinYearId]);
    const receiptNumbering = useMemo(() => documentNumbering.filter(dn => dn.finYearId === selectedFinYearId && dn.type === 'Receipt'), [documentNumbering, selectedFinYearId]);
    
    const DocNumTable: React.FC<{title: string, type: 'Voucher' | 'Receipt', items: DocumentNumbering[]}> = ({title, type, items}) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
                {canCreate && <Button onClick={(e) => openDocNumModal(type, null, e)} disabled={!selectedFinYearId}><Plus size={16}/> Add Rule</Button>}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Prefix (Kword)</th>
                        {/* --- MODIFICATION: Added Suffix Header --- */}
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Suffix</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Start No.</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="px-4 py-2 font-mono">{item.prefix}</td>
                                {/* --- MODIFICATION: Added Suffix Cell --- */}
                                <td className="px-4 py-2 font-mono">{item.suffix || 'N/A'}</td>
                                <td className="px-4 py-2">{item.startingNumber}</td>
                                <td className="px-4 py-2"><ToggleSwitch enabled={item.status === 'Active'} onChange={val => onUpdateDocumentNumbering(documentNumbering.map(dn => dn.id === item.id ? {...dn, status: val ? 'Active' as const : 'Inactive' as const} : dn))} disabled={!canModify}/></td>
                                <td className="px-4 py-2"><Button size="small" variant="light" onClick={(e) => openDocNumModal(type, item, e)} disabled={!canModify}><Edit2 size={14}/></Button></td>
                            </tr>
                        ))}
                         {items.length === 0 && (
                            // --- MODIFICATION: Adjusted colspan for new column ---
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">No rules for this FY.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Financial Years</h3>
                    {canCreate && <Button onClick={(e) => openFYModal(null, e)}><Plus size={16}/> Add Financial Year</Button>}
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Financial Year</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">From Date</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">To Date</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {financialYears.map(fy => (
                                <tr key={fy.id} onClick={() => setSelectedFinYearId(fy.id)} className={`cursor-pointer ${selectedFinYearId === fy.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <td className="px-4 py-2 font-medium">{fy.finYear}</td>
                                    <td className="px-4 py-2">{fy.fromDate}</td>
                                    <td className="px-4 py-2">{fy.toDate}</td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={fy.status === 'Active'} onChange={val => onUpdateFinancialYears(financialYears.map(f => f.id === fy.id ? {...f, status: val ? 'Active' as const : 'Inactive' as const} : f))} disabled={!canModify}/></td>
                                    <td className="px-4 py-2"><Button size="small" variant="light" onClick={(e) => { e.stopPropagation(); openFYModal(fy, e);}} disabled={!canModify}><Edit2 size={14}/></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DocNumTable title="Voucher Numbering" type="Voucher" items={voucherNumbering} />
                <DocNumTable title="Receipt Numbering" type="Receipt" items={receiptNumbering} />
            </div>

            {isFYModalOpen && editingFY && (
                <Modal isOpen={isFYModalOpen} onClose={closeFYModal}>
                    <form onSubmit={e => {e.preventDefault(); handleSaveFY();}}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingFY.id ? 'Edit' : 'Add'} Financial Year</h2></div>
                        <div className="p-6 space-y-4">
                            <Input label="Financial Year Label" value={editingFY.finYear || ''} onChange={e => setEditingFY(p => p ? {...p, finYear: e.target.value} : null)} placeholder="e.g., 2025-2026" required disabled={!canModify} />
                            <Input label="From Date" type="date" value={editingFY.fromDate || ''} onChange={e => setEditingFY(p => p ? {...p, fromDate: e.target.value} : null)} required disabled={!canModify}/>
                            <Input label="To Date" type="date" value={editingFY.toDate || ''} onChange={e => setEditingFY(p => p ? {...p, toDate: e.target.value} : null)} required disabled={!canModify}/>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeFYModal}>Cancel</Button><Button type="submit" disabled={!canModify}>Save</Button></div>
                    </form>
                </Modal>
            )}

            <DocNumRuleModal
                isOpen={isDocNumModalOpen}
                onClose={closeDocNumModal}
                onSave={handleSaveDocNum}
                initialData={editingDocNum}
                financialYears={financialYears}
                canModify={canModify}
            />
        </div>
    );
};

// --- NEW: Role Management Component ---
const RoleManager: React.FC<{
    items: Role[];
    onUpdate: (items: Role[]) => void;
    addToast: MasterDataProps['addToast'];
    users: User[];
    canCreate: boolean;
    canModify: boolean;
}> = ({ items, onUpdate, addToast, users, canCreate, canModify }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Role> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    const openModal = (item: Role | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingItem(item ? { ...item } : { name: '', isAdvisor: false, active: true });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    };

    const handleSave = () => {
        if (!canModify) return;
        if (!editingItem || !editingItem.name?.trim()) {
            addToast('Role name is required.', 'error');
            return;
        }

        if (editingItem.id) {
            onUpdate(items.map(i => i.id === editingItem.id ? (editingItem as Role) : i));
        } else {
            const newItem: Role = {
                id: `role-${Date.now()}`,
                name: editingItem.name.trim(),
                isAdvisor: editingItem.isAdvisor || false,
                active: true,
                order: items.length,
            };
            onUpdate([...items, newItem]);
        }
        closeModal();
    };

    const handleToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
    };

    const handleDelete = (id: string) => {
        const usersWithRole = users.filter(u => u.roleId === id);
        if (usersWithRole.length > 0) {
            addToast(`Cannot delete: ${usersWithRole.length} employee(s) are assigned this role.`, 'error');
            return;
        }
        onUpdate(items.filter(i => i.id !== id));
        addToast('Role deleted successfully.', 'success');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Roles</h3>
                {canCreate && (
                    <Button onClick={(e) => openModal(null, e)} variant="primary">
                        <Plus size={16}/> Add Role
                    </Button>
                )}
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Is Advisor Role?</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 text-sm text-grey-500">{index + 1}</td>
                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                <td className="px-6 py-4">
                                    <ToggleSwitch
                                        enabled={item.isAdvisor}
                                        onChange={(val) => onUpdate(items.map(i => i.id === item.id ? { ...i, isAdvisor: val } : i))}
                                        disabled={!canModify}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <ToggleSwitch enabled={!!item.active} onChange={() => handleToggle(item.id)} disabled={!canModify}/>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Button size="small" variant="light" onClick={(e) => openModal(item, e)} disabled={!canModify}><Edit2 size={16}/></Button>
                                        {canModify && <Button size="small" variant="danger" onClick={() => handleDelete(item.id)}><Trash2 size={16}/></Button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && editingItem && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6">
                            <h2 className="text-xl font-bold">{editingItem.id ? 'Edit' : 'Add'} Role</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input
                                label="Role Name"
                                value={editingItem.name || ''}
                                onChange={e => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                                disabled={!canModify}
                            />
                            <div className="flex items-center gap-4 pt-2">
                                <label className="font-medium">Is Advisor Role?</label>
                                <ToggleSwitch
                                    enabled={!!editingItem.isAdvisor}
                                    onChange={val => setEditingItem(prev => prev ? { ...prev, isAdvisor: val } : null)}
                                    disabled={!canModify}
                                />
                                <p className="text-xs text-gray-500">Enable this if this role is for sales and customer-facing activities.</p>
                            </div>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
// --- NEW: Designation Rule Modal Component ---
const DesignationRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Designation>) => void;
    initialData: Partial<Designation> | null;
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, canModify }) => {

    const [name, setName] = useState('');
    const [rank, setRank] = useState<string>(''); // Use string for the input field

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setRank(initialData.rank?.toString() || ''); // Convert number to string for input
        }
    }, [isOpen, initialData]);

    const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow only numbers or an empty string
        if (/^[0-9]*$/.test(val)) {
            setRank(val);
        }
    };

    const handleSaveClick = () => {
        if (!name.trim()) {
            // In a real app, you'd use the addToast prop here
            alert('Designation name is required.');
            return;
        }

        onSave({
            ...initialData,
            name,
            rank: rank === '' ? undefined : parseInt(rank, 10), // Convert back to number or undefined
        });
    };
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={e => { e.preventDefault(); handleSaveClick(); }}>
                <div className="p-6 border-b"><h2 className="text-xl font-bold">{initialData?.id ? 'Edit' : 'Add'} Designation</h2></div>
                <div className="p-6 space-y-4">
                    <Input 
                        label="Designation Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        disabled={!canModify}
                    />
                    <Input 
                        label="Rank" 
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={rank} 
                        onChange={handleRankChange} 
                        placeholder="e.g., 1 (lower is higher rank)"
                        disabled={!canModify}
                    />
                </div>
                <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!canModify}>Save Designation</Button></div>
            </form>
        </Modal>
    );
};
const DesignationManager: React.FC<{
    items: Designation[];
    onUpdate: (items: Designation[]) => void;
    addToast: MasterDataProps['addToast'];
    users: User[];
    canCreate: boolean;
    canModify: boolean;
}> = ({ items, onUpdate, addToast, users, canCreate, canModify }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Designation> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    const openModal = (item: Designation | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        // --- FIX: Do NOT auto-fill rank for new items. Let it be undefined. ---
        setEditingItem(item ? { ...item } : { name: '', active: true });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    };

    const handleSave = (dataToSave: Partial<Designation>) => {
        if (!canModify) return;

        if (dataToSave.id) {
            onUpdate(items.map(i => i.id === dataToSave.id ? (dataToSave as Designation) : i));
        } else {
            const newItem: Designation = {
                id: `des-${Date.now()}`,
                name: dataToSave.name!.trim(),
                // --- FIX: The rank will be undefined if the user leaves it blank ---
                rank: dataToSave.rank, 
                active: true,
                order: items.length,
            };
            onUpdate([...items, newItem]);
        }
        closeModal();
    };

    const handleToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
    };

    const handleDelete = (id: string) => {
        const usersWithDesignation = users.filter(u => u.designationId === id);
        if (usersWithDesignation.length > 0) {
            addToast(`Cannot delete: ${usersWithDesignation.length} employee(s) are assigned this designation.`, 'error');
            return;
        }
        onUpdate(items.filter(i => i.id !== id));
        addToast('Designation deleted successfully.', 'success');
    };

    const sortedItems = useMemo(() => {
        // --- FIX: Sorting with `?? Infinity` ensures items without a rank appear at the end ---
        return [...items].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    }, [items]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Designations</h3>
                {canCreate && (
                    <Button onClick={(e) => openModal(null, e)} variant="primary">
                        <Plus size={16}/> Add Designation
                    </Button>
                )}
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase w-12">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Actions</th>
            </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.map((item, index) => (
                <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                        {item.rank ?? <span className="text-gray-400 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4">
                        <ToggleSwitch
                            enabled={!!item.active}
                            onChange={() => handleToggle(item.id)}
                            disabled={!canModify}
                        />
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Button
                                size="small"
                                variant="light"
                                onClick={(e) => openModal(item, e)}
                                disabled={!canModify}
                            >
                                <Edit2 size={16}/>
                            </Button>
                            {canModify && (
                                <Button
                                    size="small"
                                    variant="danger"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 size={16}/>
                                </Button>
                            )}
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
            
            <DesignationRuleModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
                initialData={editingItem}
                canModify={canModify}
            />
        </div>
    );
};
// --- NEW: Designation Permissions Management Component ---
// --- MODIFIED: Renamed to RolePermissionsManager and logic updated to use Roles ---
const RolePermissionsManager: React.FC<{
    roles: Role[];
    rolePermissions: RolePermissions[];
    onUpdate: (permissions: RolePermissions) => void;
    addToast: MasterDataProps['addToast'];
    canModify: boolean;
}> = ({ roles, rolePermissions, onUpdate, addToast, canModify }) => {
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [currentPermissions, setCurrentPermissions] = useState<RolePermissions['permissions'] | null>(null);

    const moduleDisplayOrder: { key: AppModule; name: string }[] = [
        { key: 'dashboard', name: 'Dashboard' },
        { key: 'reports & insights', name: 'Reports & Insights' },
        { key: 'profitAndLoss', name: 'Profit & Loss' },
        { key: 'advancedReports', name: 'Advanced Reports'},
        { key: 'pipeline', name: 'Lead Management' },
        { key: 'calendar', name: 'Calendar' },
        { key: 'upselling', name:'Upselling'},
        { key: 'customers', name: 'Customers' },
        { key: 'taskManagement', name: 'Task Management' },
        { key: 'policies', name: 'Policies' },
        { key: 'mutualFunds', name: 'Mutual Funds' },
        { key: 'notes', name: 'Notes' },
        { key: 'actionHub', name: 'Action Hub' },
        { key: 'servicesHub', name: 'Services Hub' },
        { key: 'location', name: 'Location Services' },
        { key: 'chatbot', name: 'WhatsApp Bot' },
        { key: 'employees', name: 'Employee Management' },
        { key: 'masterMember', name: 'Master Data' },
    ];

    // Map roles to the format expected by SearchableSelect
    const roleOptions = useMemo(() => 
        roles
            .filter(r => r.active)
            .map(r => ({ value: r.id, label: r.name }))
    , [roles]);

    useEffect(() => {
        if (selectedRoleId) {
            const perms = rolePermissions.find(p => p.roleId === selectedRoleId);
            setCurrentPermissions(perms ? { ...perms.permissions } : {});
        } else {
            setCurrentPermissions(null);
        }
    }, [selectedRoleId, rolePermissions]);

    const handlePermissionChange = (module: AppModule, level: PermissionLevel) => {
        setCurrentPermissions(prev => prev ? { ...prev, [module]: level } : null);
    };

    const handleSave = () => {
        if (!canModify) return;
        if (!selectedRoleId || !currentPermissions) {
            addToast('No role selected or permissions are invalid.', 'error');
            return;
        }
        onUpdate({
            roleId: selectedRoleId,
            permissions: currentPermissions,
        });
        addToast('Permissions updated successfully!', 'success');
    };

    return (
        <div className="space-y-6"> {/* Removed flex layout to simplify to a single column */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Manage Role Permissions
                </h3>
            </div>
            
            {/* --- NEW: Searchable Dropdown for Role Selection --- */}
            <SearchableSelect
                label="Select Role"
                options={roleOptions}
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                placeholder="Search for a role..."
            />
            {/* --- END NEW --- */}

            {selectedRoleId && currentPermissions ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Permissions for "{roles.find(r => r.id === selectedRoleId)?.name}"
                        </h3>
                        {canModify && <Button onClick={handleSave}><Save size={16}/> Save Permissions</Button>}
                    </div>
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Module</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Access Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {moduleDisplayOrder.map(({ key, name }) => (
                                    <tr key={key}>
                                        <td className="px-4 py-3 font-medium">{name}</td>
                                        <td className="px-4 py-3">
                                            <fieldset disabled={!canModify}>
                                                <div className="flex items-center gap-4">
                                                    {(['none', 'view', 'create', 'modify'] as PermissionLevel[]).map(level => (
                                                        <label key={level} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`perm-${key}`}
                                                                checked={(currentPermissions[key] || 'none') === level}
                                                                onChange={() => handlePermissionChange(key, level)}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="capitalize">{level}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </fieldset>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-lg p-8">
                    <div>
                        <Lock size={48} className="mx-auto text-gray-300 dark:text-gray-500"/>
                        <p className="mt-4 font-semibold">Select a Role</p>
                        <p className="text-sm">Select a role from the dropdown above to manage its application permissions.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
// --- NEW: Income Category Management Component ---
const IncomeCategoryManager: React.FC<{
    level1Data: IncomeCategoryLevel1[];
    level2Data: IncomeCategoryLevel2[];
    onUpdateLevel1: (data: IncomeCategoryLevel1[]) => void;
    onUpdateLevel2: (data: IncomeCategoryLevel2[]) => void;
    addToast: MasterDataProps['addToast'];
    canCreate: boolean;
    canModify: boolean;
}> = ({ level1Data, level2Data, onUpdateLevel1, onUpdateLevel2, addToast, canCreate, canModify }) => {
    
    type CategoryItem = IncomeCategoryLevel1 | IncomeCategoryLevel2;
    
    type ModalState = {
        isOpen: boolean;
        level: 1 | 2;
        data: Partial<CategoryItem> | null;
    };

    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, level: 1, data: null });
    const [searchQuery, setSearchQuery] = useState('');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    
    const openModal = (level: 1 | 2, data: Partial<CategoryItem> | null = null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setModalState({ isOpen: true, level, data: data ? { ...data } : { name: '', active: true } });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, level: 1, data: null });
        triggerButtonRef.current?.focus();
    };

    const handleSave = () => {
        if (!canModify) return;
        const { level, data } = modalState;
        if (!data || !data.name?.trim()) {
            addToast('Category name is required.', 'error');
            return;
        }

        switch (level) {
            case 1:
                const l1Data = data as Partial<IncomeCategoryLevel1>;
                onUpdateLevel1(
                    l1Data.id
                        ? level1Data.map(i => i.id === l1Data.id ? (l1Data as IncomeCategoryLevel1) : i)
                        : [...level1Data, { ...l1Data, id: `inc1-${Date.now()}` } as IncomeCategoryLevel1]
                );
                break;
            case 2:
                const l2Data = data as Partial<IncomeCategoryLevel2>;
                if (!l2Data.parentId) return addToast('An Income Category must be selected.', 'error');
                onUpdateLevel2(
                    l2Data.id
                        ? level2Data.map(i => i.id === l2Data.id ? (l2Data as IncomeCategoryLevel2) : i)
                        : [...level2Data, { ...l2Data, id: `inc2-${Date.now()}` } as IncomeCategoryLevel2]
                );
                break;
        }
        closeModal();
    };
    
    const handleToggle = (level: 1 | 2, id: string) => {
        const toggle = (items: any[], updateFn: (data: any[]) => void) => {
             updateFn(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
        }
        if (level === 1) toggle(level1Data, onUpdateLevel1);
        if (level === 2) toggle(level2Data, onUpdateLevel2);
    };

    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return {
                level1: level1Data,
                level2: level2Data,
            };
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        const l2Matches = new Set(level2Data.filter(l2 => l2.name.toLowerCase().includes(lowerCaseQuery) || l2.id.toLowerCase().includes(lowerCaseQuery)).map(i => i.id));
        const l1ParentIdsFromL2 = new Set(level2Data.filter(l2 => l2Matches.has(l2.id)).map(l2 => l2.parentId));

        const l1Matches = new Set(level1Data.filter(l1 => l1.name.toLowerCase().includes(lowerCaseQuery) || l1.id.toLowerCase().includes(lowerCaseQuery) || l1ParentIdsFromL2.has(l1.id)).map(i => i.id));
        
        const finalL2 = level2Data.filter(l2 => l1Matches.has(l2.parentId));
        
        return {
            level1: level1Data.filter(l1 => l1Matches.has(l1.id)),
            level2: finalL2,
        };

    }, [searchQuery, level1Data, level2Data]);
    
    const CategoryTable: React.FC<{
        title: string;
        items: CategoryItem[];
        onAdd: (event: React.MouseEvent<HTMLElement>) => void;
        onEdit: (item: CategoryItem, event: React.MouseEvent<HTMLElement>) => void;
        onToggle: (id: string) => void;
        level: 1 | 2;
    }> = ({ title, items, onAdd, onEdit, onToggle }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
                {canCreate && <Button onClick={onAdd}><Plus size={16}/> Add Category</Button>}
            </div>
            <div className="overflow-x-auto max-h-60">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase hidden">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => (
                            <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 py-2 text-sm font-mono text-gray-500 hidden">{item.id}</td>
                                <td className="px-4 py-2 font-medium">{item.name}</td>
                                <td className="px-4 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => onToggle(item.id)} disabled={!canModify} /></td>
                                <td className="px-4 py-2">
                                    <div className="flex gap-2">
                                        <Button size="small" variant="light" onClick={(e) => onEdit(item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Income Category Management</h3>
            <div className="relative my-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                    type="search"
                    placeholder="Search all categories by Name or Code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            <div className="space-y-8">
                <CategoryTable title="Manage Income Category" items={filteredData.level1} onAdd={(e) => openModal(1, null, e)} onEdit={(item, e) => openModal(1, item, e)} onToggle={(id) => handleToggle(1, id)} level={1} />
                <CategoryTable title="Manage Income Head Category" items={filteredData.level2} onAdd={(e) => openModal(2, null, e)} onEdit={(item, e) => openModal(2, item, e)} onToggle={(id) => handleToggle(2, id)} level={2} />
            </div>

            {modalState.isOpen && (
                <Modal isOpen={modalState.isOpen} onClose={closeModal}>
                    <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-brand-dark dark:text-white">
                                {modalState.data?.id ? 'Edit' : 'Add'} {modalState.level === 1 ? 'Income Category' : 'Income Head Category'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {modalState.level === 2 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Category</label>
                                    <select 
                                        value={(modalState.data as Partial<IncomeCategoryLevel2>).parentId || ''}
                                        onChange={e => setModalState(p => ({...p, data: {...p.data, parentId: e.target.value}}))}
                                        className={selectClasses}
                                        required
                                        disabled={!canModify}
                                    >
                                        <option value="">-- Select Income Category --</option>
                                        {level1Data.filter(l1 => l1.active).map(l1 => <option key={l1.id} value={l1.id}>{l1.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <Input label="Category Name" value={modalState.data?.name || ''} onChange={e => setModalState(p => ({...p, data: {...p.data, name: e.target.value}}))} required disabled={!canModify}/>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// --- NEW: Expense Category Management Component (copied from IncomeCategoryManager) ---
const ExpenseCategoryManager: React.FC<{
    level1Data: ExpenseCategoryLevel1[];
    level2Data: ExpenseCategoryLevel2[];
    level3Data: ExpenseCategoryLevel3[];
    onUpdateLevel1: (data: ExpenseCategoryLevel1[]) => void;
    onUpdateLevel2: (data: ExpenseCategoryLevel2[]) => void;
    onUpdateLevel3: (data: ExpenseCategoryLevel3[]) => void;
    addToast: MasterDataProps['addToast'];
    canCreate: boolean;
    canModify: boolean;
}> = ({ level1Data, level2Data, level3Data, onUpdateLevel1, onUpdateLevel2, onUpdateLevel3, addToast, canCreate, canModify }) => {
    
    type CategoryItem = ExpenseCategoryLevel1 | ExpenseCategoryLevel2 | ExpenseCategoryLevel3;
    
    type ModalState = {
        isOpen: boolean;
        level: 1 | 2 | 3;
        data: Partial<CategoryItem> | null;
    };

    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, level: 1, data: null });
    const [searchQuery, setSearchQuery] = useState('');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    const openModal = (level: 1 | 2 | 3, data: Partial<CategoryItem> | null = null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setModalState({ isOpen: true, level, data: data ? { ...data } : { name: '', active: true } });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, level: 1, data: null });
        triggerButtonRef.current?.focus();
    };

    const handleSave = () => {
        if (!canModify) return;
        const { level, data } = modalState;
        if (!data || !data.name?.trim()) {
            addToast('Category name is required.', 'error');
            return;
        }

        switch (level) {
            case 1:
                const l1Data = data as Partial<ExpenseCategoryLevel1>;
                onUpdateLevel1(
                    l1Data.id
                        ? level1Data.map(i => i.id === l1Data.id ? (l1Data as ExpenseCategoryLevel1) : i)
                        : [...level1Data, { ...l1Data, id: `exp1-${Date.now()}` } as ExpenseCategoryLevel1]
                );
                break;
            case 2:
                const l2Data = data as Partial<ExpenseCategoryLevel2>;
                if (!l2Data.parentId) return addToast('An Expense Category must be selected.', 'error');
                onUpdateLevel2(
                    l2Data.id
                        ? level2Data.map(i => i.id === l2Data.id ? (l2Data as ExpenseCategoryLevel2) : i)
                        : [...level2Data, { ...l2Data, id: `exp2-${Date.now()}` } as ExpenseCategoryLevel2]
                );
                break;
            case 3:
                const l3Data = data as Partial<ExpenseCategoryLevel3>;
                if (!l3Data.parentId) return addToast('An Expense Head Category must be selected.', 'error');
                onUpdateLevel3(
                    l3Data.id
                        ? level3Data.map(i => i.id === l3Data.id ? (l3Data as ExpenseCategoryLevel3) : i)
                        : [...level3Data, { ...l3Data, id: `exp3-${Date.now()}` } as ExpenseCategoryLevel3]
                );
                break;
        }
        closeModal();
    };
    
    const handleToggle = (level: 1 | 2 | 3, id: string) => {
        const toggle = (items: any[], updateFn: (data: any[]) => void) => {
             updateFn(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
        }
        if (level === 1) toggle(level1Data, onUpdateLevel1);
        if (level === 2) toggle(level2Data, onUpdateLevel2);
        if (level === 3) toggle(level3Data, onUpdateLevel3);
    };

    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return {
                level1: level1Data,
                level2: level2Data,
                level3: level3Data,
            };
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        const l3Matches = new Set(level3Data.filter(l3 => l3.name.toLowerCase().includes(lowerCaseQuery) || l3.id.toLowerCase().includes(lowerCaseQuery)).map(i => i.id));
        const l2ParentIdsFromL3 = new Set(level3Data.filter(l3 => l3Matches.has(l3.id)).map(l3 => l3.parentId));
        
        const l2Matches = new Set(level2Data.filter(l2 => l2.name.toLowerCase().includes(lowerCaseQuery) || l2.id.toLowerCase().includes(lowerCaseQuery) || l2ParentIdsFromL3.has(l2.id)).map(i => i.id));
        const l1ParentIdsFromL2 = new Set(level2Data.filter(l2 => l2Matches.has(l2.id)).map(l2 => l2.parentId));

        const l1Matches = new Set(level1Data.filter(l1 => l1.name.toLowerCase().includes(lowerCaseQuery) || l1.id.toLowerCase().includes(lowerCaseQuery) || l1ParentIdsFromL2.has(l1.id)).map(i => i.id));
        
        const finalL2 = level2Data.filter(l2 => l1Matches.has(l2.parentId));
        const finalL2Ids = new Set(finalL2.map(l2=>l2.id));
        
        return {
            level1: level1Data.filter(l1 => l1Matches.has(l1.id)),
            level2: finalL2,
            level3: level3Data.filter(l3 => finalL2Ids.has(l3.parentId)),
        };

    }, [searchQuery, level1Data, level2Data, level3Data]);
    
    const CategoryTable: React.FC<{
        title: string;
        items: CategoryItem[];
        onAdd: (event: React.MouseEvent<HTMLElement>) => void;
        onEdit: (item: CategoryItem, event: React.MouseEvent<HTMLElement>) => void;
        onToggle: (id: string) => void;
        level: 1 | 2 | 3;
    }> = ({ title, items, onAdd, onEdit, onToggle }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
                {canCreate && <Button onClick={onAdd}><Plus size={16}/> Add Category</Button>}
            </div>
            <div className="overflow-x-auto max-h-60">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase hidden">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => (
                            <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 py-2 text-sm font-mono text-gray-500 hidden">{item.id}</td>
                                <td className="px-4 py-2 font-medium">{item.name}</td>
                                <td className="px-4 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => onToggle(item.id)} disabled={!canModify} /></td>
                                <td className="px-4 py-2">
                                    <div className="flex gap-2">
                                        <Button size="small" variant="light" onClick={(e) => onEdit(item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    // For modal dropdowns
    const [modalLevel1Parent, setModalLevel1Parent] = useState<string | null>(null);

    useEffect(() => {
        if(modalState.isOpen && modalState.level > 1 && modalState.data) {
           const data = modalState.data as ExpenseCategoryLevel2 | ExpenseCategoryLevel3;
            if(data.parentId) {
                if(modalState.level === 2) {
                    setModalLevel1Parent(data.parentId);
                } else if (modalState.level === 3) {
                    const l2 = level2Data.find(l => l.id === data.parentId);
                    setModalLevel1Parent(l2?.parentId || null);
                }
            } else {
                 if (typeof data.parentId === 'undefined') {
                    setModalLevel1Parent(null);
                 }
            }
        }
    }, [modalState.isOpen, modalState.level, modalState.data, level2Data]);

    const getModalTitle = () => {
        const action = modalState.data?.id ? 'Edit' : 'Add';
        switch (modalState.level) {
            case 1: return `${action} Expense Category`;
            case 2: return `${action} Expense Head Category`;
            case 3: return `${action} Expense Individual Category`;
            default: return 'Manage Category';
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Expense Category Management</h3>
            <div className="relative my-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                    type="search"
                    placeholder="Search all categories by Name or Code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            <div className="space-y-8">
                <CategoryTable title="Manage Expense Category" items={filteredData.level1} onAdd={(e) => openModal(1, null, e)} onEdit={(item, e) => openModal(1, item, e)} onToggle={(id) => handleToggle(1, id)} level={1} />
                <CategoryTable title="Manage Expense Head Category" items={filteredData.level2} onAdd={(e) => openModal(2, null, e)} onEdit={(item, e) => openModal(2, item, e)} onToggle={(id) => handleToggle(2, id)} level={2} />
                <CategoryTable title="Manage Expense Individual Category" items={filteredData.level3} onAdd={(e) => openModal(3, null, e)} onEdit={(item, e) => openModal(3, item, e)} onToggle={(id) => handleToggle(3, id)} level={3} />
            </div>

            {modalState.isOpen && (
                <Modal isOpen={modalState.isOpen} onClose={closeModal}>
                    <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-brand-dark dark:text-white">
                                {getModalTitle()}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {modalState.level === 2 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Category</label>
                                    <select 
                                        value={(modalState.data as Partial<ExpenseCategoryLevel2>).parentId || ''}
                                        onChange={e => setModalState(p => ({...p, data: {...p.data, parentId: e.target.value}}))}
                                        className={selectClasses}
                                        required
                                        disabled={!canModify}
                                    >
                                        <option value="">-- Select Expense Category --</option>
                                        {level1Data.filter(l1 => l1.active).map(l1 => <option key={l1.id} value={l1.id}>{l1.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {modalState.level === 3 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Category</label>
                                        <select 
                                            value={modalLevel1Parent || ''}
                                            onChange={e => {
                                                setModalLevel1Parent(e.target.value);
                                                setModalState(p => ({...p, data: {...p.data, parentId: ''}}));
                                            }}
                                            className={selectClasses}
                                            required
                                            disabled={!canModify}
                                        >
                                            <option value="">-- Select Expense Category --</option>
                                            {level1Data.filter(l1 => l1.active).map(l1 => <option key={l1.id} value={l1.id}>{l1.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Head Category</label>
                                        <select 
                                            value={(modalState.data as Partial<ExpenseCategoryLevel3>).parentId || ''}
                                            onChange={e => setModalState(p => ({...p, data: {...p.data, parentId: e.target.value}}))}
                                            className={selectClasses}
                                            disabled={!modalLevel1Parent || !canModify}
                                            required
                                        >
                                            <option value="">-- Select Expense Head Category --</option>
                                            {level2Data.filter(l2 => l2.active && l2.parentId === modalLevel1Parent).map(l2 => <option key={l2.id} value={l2.id}>{l2.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            <Input label="Category Name" value={modalState.data?.name || ''} onChange={e => setModalState(p => ({...p, data: {...p.data, name: e.target.value}}))} required disabled={!canModify}/>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};


// --- MODIFICATION START: This is the updated ReligionsAndFestivalsManager component ---
const ReligionsAndFestivalsManager: React.FC<MasterDataProps & { canCreate: boolean; canModify: boolean }> = (props) => {
    const { religions, onUpdateReligions, festivals, onUpdateFestivals, festivalDates, onUpdateFestivalDates, addToast, allMembers, canCreate, canModify } = props;

    // State for main search query
    const [searchQuery, setSearchQuery] = useState('');

    // State for Festivals
    const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false);
    const [editingFestival, setEditingFestival] = useState<Partial<Festival> | null>(null);

    // State for Festival Dates
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [editingDate, setEditingDate] = useState<Partial<FestivalDate> | null>(null);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
    const [monthFilter, setMonthFilter] = useState('all');
    const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

    const religionMap = useMemo(() => new Map(religions.map(r => [r.id, r.name])), [religions]);
    const festivalMap = useMemo(() => new Map(festivals.map(f => [f.id, f.name])), [festivals]);
    const dateCountMap = useMemo(() => {
        const counts = new Map<string, number>();
        festivalDates.forEach(d => {
            counts.set(d.festivalId, (counts.get(d.festivalId) || 0) + 1);
        });
        return counts;
    }, [festivalDates]);

    // --- Festival Logic ---
    const openFestivalModal = (item: Festival | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingFestival(item ? { ...item } : { name: '', religionId: null, active: true });
        setIsFestivalModalOpen(true);
    };
    
    const closeFestivalModal = () => {
        setIsFestivalModalOpen(false);
        triggerButtonRef.current?.focus();
    }


    const handleSaveFestival = () => {
        if (!canModify) return;
        if (!editingFestival || !editingFestival.name?.trim()) {
            addToast('Festival name is required.', 'error');
            return;
        }
        
        const newFestivals = editingFestival.id
            ? festivals.map(i => i.id === editingFestival.id ? editingFestival as Festival : i)
            : [...festivals, { ...editingFestival, active: editingFestival.active ?? true, id: `fest-${Date.now()}` } as Festival];
        
        onUpdateFestivals(newFestivals);
        closeFestivalModal();
    };
    
    const handleToggleFestival = (id: string) => onUpdateFestivals(festivals.map(i => i.id === id ? { ...i, active: !i.active } : i));
    
    const handleDeleteFestival = (id: string) => {
        if (festivalDates.some(fd => fd.festivalId === id)) {
            addToast('Cannot delete festival as it has dates assigned. Please remove dates first.', 'error');
            return;
        }
        onUpdateFestivals(festivals.filter(f => f.id !== id));
        addToast('Festival deleted.', 'success');
    };

    // --- Festival Date Logic ---
    const openDateModal = (item: Partial<FestivalDate> | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        if (item && !item.id) { // This is for adding a new date via the '+' icon
            const parentFestival = festivals.find(f => f.id === item.festivalId);
            setEditingDate({ 
                festivalId: item.festivalId, 
                date: `${new Date().getFullYear()}-01-01`, 
                active: parentFestival ? parentFestival.active : true 
            });
        } else { // This is for editing an existing date or adding a completely new one
            setEditingDate(item ? { ...item } : { festivalId: '', date: `${new Date().getFullYear()}-01-01`, active: true });
        }
        setIsDateModalOpen(true);
    };
    
    const closeDateModal = () => {
        setIsDateModalOpen(false);
        triggerButtonRef.current?.focus();
    }

    const handleSaveDate = () => {
        if (!canModify) return;
        if (!editingDate || !editingDate.festivalId || !editingDate.date) {
            addToast('Festival and Date are required.', 'error');
            return;
        }

        const isDuplicate = festivalDates.some(
            d => d.id !== editingDate.id &&
                 d.festivalId === editingDate.festivalId && 
                 d.date === editingDate.date
        );

        if (isDuplicate) {
            const festivalName = festivalMap.get(editingDate.festivalId) || 'this festival';
            addToast(`The date ${editingDate.date} is already assigned to ${festivalName}.`, 'error');
            return;
        }

        const year = new Date(editingDate.date).getFullYear();
        const finalDate = { ...editingDate, year };

        onUpdateFestivalDates(
            editingDate.id
                ? festivalDates.map(d => d.id === editingDate.id ? finalDate as FestivalDate : d)
                : [...festivalDates, { ...finalDate, id: `fest-date-${Date.now()}` } as FestivalDate]
        );
        closeDateModal();
    };
    
    const handleToggleDate = (id: string) => onUpdateFestivalDates(festivalDates.map(d => d.id === id ? { ...d, active: !d.active } : d));
    const handleDeleteDate = (id: string) => onUpdateFestivalDates(festivalDates.filter(d => d.id !== id));

    // Combined data source for the second table
    const displayRows = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    const searchedFestivals = festivals.filter(f => 
        !searchQuery || f.name.toLowerCase().includes(lowerCaseQuery)
    );

    let rows: any[] = [];

    searchedFestivals.forEach(festival => {
        const datesForThisFestival = festivalDates.filter(d => d.festivalId === festival.id);

        const datesInFilter = datesForThisFestival.filter(d => {
            const date = new Date(d.date);
            // This is the corrected logic:
            const yearMatch = date.getFullYear() === yearFilter;
            const monthMatch = monthFilter === 'all' || date.getMonth() === parseInt(monthFilter);
            return yearMatch && monthMatch;
        });

        if (datesInFilter.length > 0) {
            datesInFilter.forEach(date => {
                rows.push({ ...date, isPlaceholder: false });
            });
        } else if (monthFilter === 'all') { // Only show placeholders if viewing the whole year
            rows.push({
                id: `placeholder-${festival.id}`,
                festivalId: festival.id,
                date: '',
                active: festival.active ?? true,
                isPlaceholder: true,
            });
        }
    });
    
    rows.sort((a, b) => {
        const nameA = festivalMap.get(a.festivalId) || '';
        const nameB = festivalMap.get(b.festivalId) || '';
        if (nameA !== nameB) {
            return nameA.localeCompare(nameB);
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return rows;

}, [festivals, festivalDates, yearFilter, monthFilter, searchQuery, festivalMap]);


    // --- Searchable Year Filter Component ---
    const SearchableYearFilter: React.FC = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const ref = useRef<HTMLDivElement>(null);

        const yearOptions = useMemo(() => {
            const yearsInData = new Set(festivalDates.map(d => new Date(d.date).getFullYear()));
            const currentYear = new Date().getFullYear();
            
            for (let i = 0; i < 5; i++) {
                yearsInData.add(currentYear + i);
            }
    
            return Array.from(yearsInData).sort((a, b) => b - a);
        }, [festivalDates]);

        const filteredYears = useMemo(() => {
            if (!searchTerm) return yearOptions;
            return yearOptions.filter(y => y.toString().includes(searchTerm));
        }, [searchTerm, yearOptions]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={ref}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border dark:border-gray-600 focus:outline-none sm:text-sm"
                >
                    <span className="block truncate">{yearFilter}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDown className="h-5 w-5 text-gray-400" /></span>
                </button>
                {isOpen && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                        <div className="p-2" onClick={e => e.stopPropagation()}>
                            <Input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search year..." autoFocus />
                        </div>
                        {filteredYears.map(year => (
                            <div key={year} onClick={() => { setYearFilter(year); setIsOpen(false); setSearchTerm(''); }} className="relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50">{year}</div>
                        ))}
                    </div>
                )}
            </div>
        )
    };

    const monthOptions = [
        { value: 'all', label: 'All Months' },
        ...Array.from({ length: 12 }, (_, i) => ({ value: i.toString(), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }))
    ];
    
    const filteredReligions = useMemo(() => {
        if (!searchQuery) return religions;
        return religions.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [religions, searchQuery]);

    const filteredFestivals = useMemo(() => {
        if (!searchQuery) return festivals;
        return festivals.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [festivals, searchQuery]);

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Religion & Festival Management</h3>
            <div className="relative my-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                    type="search"
                    placeholder="Search all religions and festivals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            
            <GenericMasterManager
                title="Manage Religion"
                items={filteredReligions}
                onUpdate={onUpdateReligions}
                addToast={addToast}
                noun="Religion"
                reorderable={true}
                showSearchBar={false}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => allMembers.filter(m => m.religionId === id).map(m => ({ name: m.name, type: 'member' }))}
                canCreate={canCreate}
                canModify={canModify}
            />

            {/* Festivals Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Festival</h3>
                    {canCreate && <Button onClick={(e) => openFestivalModal(null, e)}><Plus size={16}/> Add Festival</Button>}
                </div>
                <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Religion</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredFestivals.map((item, index) => (
                                <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2 text-sm">{religionMap.get(item.religionId!) || 'General'}</td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggleFestival(item.id)} disabled={!canModify} /></td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button size="small" variant="light" onClick={(e) => openFestivalModal(item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                            {canModify && <Button size="small" variant="danger" onClick={() => handleDeleteFestival(item.id)}><Trash2 size={14}/></Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Festival Dates Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Festival Date</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-40"><SearchableYearFilter /></div>
                        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className={selectClasses}>
                            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Festival</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {displayRows.map((row, index) => (
                                <tr key={row.id} className={!row.active ? 'opacity-50' : ''}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">
                                        {festivalMap.get(row.festivalId) || 'Unknown'}
                                        <span className="text-xs text-gray-400 ml-2">({dateCountMap.get(row.festivalId) || 0} Dates)</span>
                                    </td>
                                    {/* --- MODIFICATION START: Use fixed width for date and gap for spacing --- */}
                                    <td className="px-4 py-2 text-sm">
                                        <div className="flex items-center gap-4">
                                            <span className="w-48">
                                                {row.isPlaceholder ? 
                                                    <span className="italic text-gray-400">No date set</span> : 
                                                    new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                                                }
                                            </span>
                                            {canCreate && (
                                                <button 
                                                    type="button" 
                                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" 
                                                    title="Add another date for this festival" 
                                                    onClick={(e) => openDateModal({ festivalId: row.festivalId }, e)}
                                                >
                                                    <CalendarIcon size={16}/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {/* --- MODIFICATION END --- */}
                                    <td className="px-4 py-2">
                                        <ToggleSwitch enabled={!!row.active} onChange={() => row.isPlaceholder ? handleToggleFestival(row.festivalId) : handleToggleDate(row.id)} disabled={!canModify} />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            {!row.isPlaceholder && canModify && (
                                                <>
                                                    <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openDateModal(row as FestivalDate, e)}><Edit2 size={14}/></Button>
                                                    <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleDeleteDate(row.id)}><Trash2 size={14}/></Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isFestivalModalOpen && (
                <Modal isOpen={isFestivalModalOpen} onClose={closeFestivalModal}>
                    <form onSubmit={e => { e.preventDefault(); handleSaveFestival(); }}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingFestival?.id ? 'Edit' : 'Add'} Festival</h2></div>
                        <div className="p-6 space-y-4">
                            <Input label="Festival Name" value={editingFestival?.name || ''} onChange={e => setEditingFestival(p => p ? {...p, name: e.target.value} : null)} disabled={!canModify} />
                            <label className="block text-sm font-medium">Religion</label>
                            <select value={editingFestival?.religionId || ''} onChange={e => setEditingFestival(p => p ? {...p, religionId: e.target.value || null} : null)} className={selectClasses} disabled={!canModify}>
                                <option value="">-- General --</option>
                                {religions.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeFestivalModal}>Cancel</Button><Button type="submit" disabled={!canModify}>Save</Button></div>
                    </form>
                </Modal>
            )}

            {isDateModalOpen && (
                 <Modal isOpen={isDateModalOpen} onClose={closeDateModal}>
                    <form onSubmit={e => { e.preventDefault(); handleSaveDate(); }}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingDate?.id ? 'Edit' : 'Add'} Festival Date</h2></div>
                        <div className="p-6 space-y-4">
                             <label className="block text-sm font-medium">Festival</label>
                            <select value={editingDate?.festivalId || ''} onChange={e => setEditingDate(p => p ? {...p, festivalId: e.target.value} : null)} className={selectClasses} required disabled={!!editingDate?.festivalId && !editingDate.id || !canModify}>
                                <option value="">-- Select Festival --</option>
                                {festivals.filter(f => f.active).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <Input label="Date" type="date" value={editingDate?.date || ''} onChange={e => setEditingDate(p => p ? {...p, date: e.target.value} : null)} disabled={!canModify}/>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeDateModal}>Cancel</Button><Button type="submit" disabled={!canModify}>Save Date</Button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
// --- END: MODIFICATION ---


const TierRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (tierData: CustomerTier) => void;
    initialData: Partial<CustomerTier> | null;
    tiers: CustomerTier[];
    customerTypes: CustomerType[];
    gifts: GiftMaster[];
    mode: 'sumAssured' | 'premium' | 'edit';
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, tiers, customerTypes, gifts, mode, canModify }) => {
    const [formData, setFormData] = useState<Partial<CustomerTier>>({});

    useEffect(() => {
        // When the modal opens, initialize its internal state from the props.
        if (isOpen) {
            setFormData(initialData || { name: '', customerTypeId: '', minimumSumAssured: 0, minimumPremium: 0, giftId: null, active: true });
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof CustomerTier, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleNumericChange = (field: 'minimumSumAssured' | 'minimumPremium', value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        handleChange(field, numericValue === '' ? 0 : Number(numericValue));
    };

    const handleSaveClick = () => {
        if (!formData.customerTypeId) {
            // This is a placeholder for your addToast function.
            // You would pass addToast as a prop in a real app to show a message.
            alert('A Customer Type must be selected.');
            return;
        }
        onSave(formData as CustomerTier);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">{initialData?.id ? 'Edit' : 'Add'} Tier Rule</h2>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Type</label>
                    <select
                        value={formData.customerTypeId || ''}
                        onChange={e => handleChange('customerTypeId', e.target.value)}
                        className={selectClasses}
                        disabled={!canModify}
                    >
                        <option value="">-- Select a Type --</option>
                        {customerTypes.map(type => {
                            const isUsed = tiers.some(t => t.customerTypeId === type.id && t.id !== initialData?.id);
                            return (
                                <option key={type.id} value={type.id} disabled={isUsed} className={isUsed ? 'text-gray-400' : ''}>
                                    {type.name} {isUsed ? '(In Use)' : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {(mode === 'sumAssured' || mode === 'edit') && (
                    <Input
                        label="Minimum Sum Assured (₹)"
                        type="text"
                        inputMode="numeric"
                        value={formData.minimumSumAssured === 0 ? '' : String(formData.minimumSumAssured || '')}
                        onChange={e => handleNumericChange('minimumSumAssured', e.target.value)}
                        placeholder="e.g., 50000"
                        disabled={!canModify}
                    />
                )}

                {(mode === 'premium' || mode === 'edit') && (
                    <Input
                        label="Minimum Premium (₹)"
                        type="text"
                        inputMode="numeric"
                        value={formData.minimumPremium === 0 ? '' : String(formData.minimumPremium || '')}
                        onChange={e => handleNumericChange('minimumPremium', e.target.value)}
                        placeholder="e.g., 5000"
                        disabled={!canModify}
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Gift</label>
                    <select value={formData.giftId || ''} onChange={e => handleChange('giftId', e.target.value || null)} className={selectClasses} disabled={!canModify}>
                        <option value="">-- No Gift --</option>
                        {gifts.filter(g => g.active).map(gift => <option key={gift.id} value={gift.id}>{gift.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveClick} disabled={!canModify}>Save Tier</Button>
            </div>
        </Modal>
    );
};
// --- END: NEW DEDICATED MODAL COMPONENT ---


// --- REFACTORED: Tier & Gift Management Component ---
const TierManager: React.FC<{
    tiers: CustomerTier[];
    onUpdateTiers: (tiers: CustomerTier[]) => void;
    gifts: GiftMaster[];
    onUpdateGifts: (gifts: GiftMaster[]) => void;
    addToast: MasterDataProps['addToast'];
    calculationMethod: 'sumAssured' | 'premium';
    onUpdateCalculationMethod: (method: 'sumAssured' | 'premium') => void;
    customerTypes: CustomerType[];
    canCreate: boolean;
    canModify: boolean;
}> = ({ tiers, onUpdateTiers, gifts, onUpdateGifts, addToast, calculationMethod, onUpdateCalculationMethod, customerTypes, canCreate, canModify }) => {
    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<Partial<CustomerTier> | null>(null);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [editingGift, setEditingGift] = useState<Partial<GiftMaster> | null>(null);
    const [draggedTierId, setDraggedTierId] = useState<string | null>(null);
    const [tierModalMode, setTierModalMode] = useState<'sumAssured' | 'premium' | 'edit'>('edit');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);


    const sortedTiers = useMemo(() => [...tiers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [tiers]);
    const sortedGifts = useMemo(() => [...gifts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [gifts]);
    const customerTypeMap = useMemo(() => new Map(customerTypes.map(ct => [ct.id, ct.name])), [customerTypes]);

    const openTierModal = (tier: CustomerTier | null, mode: 'sumAssured' | 'premium' | 'edit', event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingTier(tier ? { ...tier } : { name: '', customerTypeId: '', minimumSumAssured: 0, minimumPremium: 0, giftId: null, active: true });
        setTierModalMode(mode);
        setIsTierModalOpen(true);
    };
    
    const closeTierModal = () => {
        setIsTierModalOpen(false);
        setEditingTier(null);
        triggerButtonRef.current?.focus();
    }

    const handleSaveTier = (tierData: CustomerTier) => {
        if (!canModify) return;
        let updatedTiers;
        if (tierData.id) { // Update
            updatedTiers = tiers.map(t => t.id === tierData.id ? tierData : t);
        } else { // Create
            const newTier: CustomerTier = {
                ...tierData,
                id: `tier-${Date.now()}`,
                name: customerTypeMap.get(tierData.customerTypeId) || 'Unnamed Tier',
                active: true,
                order: tiers.length,
            };
            updatedTiers = [...tiers, newTier];
        }
        onUpdateTiers(updatedTiers);
        closeTierModal();
    };

    const handleToggleTier = (tierId: string) => {
        onUpdateTiers(tiers.map(t => t.id === tierId ? { ...t, active: !t.active } : t));
    };

    const openGiftModal = (gift: GiftMaster | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingGift(gift ? { ...gift } : { name: '', active: true });
        setIsGiftModalOpen(true);
    };
    
    const closeGiftModal = () => {
        setIsGiftModalOpen(false);
        triggerButtonRef.current?.focus();
    }

    const handleSaveGift = () => {
        if (!canModify) return;
        if (!editingGift || !editingGift.name?.trim()) {
            addToast('Gift name is required.', 'error');
            return;
        }

        let updatedGifts;
        if (editingGift.id) { // Update
            updatedGifts = gifts.map(g => g.id === editingGift.id ? editingGift as GiftMaster : g);
        } else { // Create
            const newGift: GiftMaster = {
                id: `gift-${Date.now()}`,
                name: editingGift.name,
                active: true,
                order: gifts.length,
            };
            updatedGifts = [...gifts, newGift];
        }
        onUpdateGifts(updatedGifts);
        closeGiftModal();
    };

    const handleToggleGift = (giftId: string) => {
        onUpdateGifts(gifts.map(g => g.id === giftId ? { ...g, active: !g.active } : g));
    };

    const handleTierDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('tierId', id);
        setDraggedTierId(id);
    };

    const handleTierDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();

    const handleTierDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('tierId');
        setDraggedTierId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...sortedTiers];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);

        onUpdateTiers(currentItems.map((item, index) => ({ ...item, order: index })));
    };

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white"> Type & Gift Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-7">Define Customer Type based on sum assured or premium, and manage the gifts associated with them.</p>

            {/* Global Calculation Setting */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Type Calculation Method</h4>
                    <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                        <button
                            onClick={() => onUpdateCalculationMethod('sumAssured')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${calculationMethod === 'sumAssured' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                            disabled={!canModify}
                        >
                            Sum Assured
                        </button>
                        <button
                            onClick={() => onUpdateCalculationMethod('premium')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${calculationMethod === 'premium' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                            disabled={!canModify}
                        >
                            Premium
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Currently calculating Type by: <span className="font-semibold text-blue-600">{calculationMethod === 'sumAssured' ? 'Sum Assured' : 'Premium'}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Table for Sum Assured Tiers */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Type (by Sum Assured)</h3>
                        {canCreate && <Button onClick={(e) => openTierModal(null, 'sumAssured', e)}><Plus size={16}/> Add Tier</Button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="py-2 w-8"></th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Type Name</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Min. Sum Assured (₹)</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Assigned Gift</th>
                                    <th className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody onDragEnd={() => setDraggedTierId(null)}>
                                {sortedTiers.map(tier => (
                                    <tr 
                                        key={tier.id}
                                        draggable={canModify}
                                        onDragStart={e => handleTierDragStart(e, tier.id)}
                                        onDragOver={handleTierDragOver}
                                        onDrop={e => handleTierDrop(e, tier.id)}
                                        className={`border-b dark:border-gray-700/50 ${canModify ? 'cursor-move' : ''} ${draggedTierId === tier.id ? 'opacity-50' : ''} ${!tier.active ? 'opacity-50' : ''}`}
                                    >
                                        <td className="py-2"><GripVertical size={16} className="text-gray-400"/></td>
                                        <td className="py-2 font-medium">{customerTypeMap.get(tier.customerTypeId) || tier.name}</td>
                                        <td className="py-2">{tier.minimumSumAssured?.toLocaleString('en-IN') || '-'}</td>
                                        <td className="py-2">{gifts.find(g => g.id === tier.giftId)?.name || <span className="text-gray-400 italic">None</span>}</td>
                                        <td className="py-2 text-center"><ToggleSwitch enabled={tier.active !== false} onChange={() => handleToggleTier(tier.id)} disabled={!canModify}/></td>
                                        <td className="py-2 text-center"><Button size="small" variant="light" className="!p-1.5" onClick={(e) => openTierModal(tier, 'edit', e)} disabled={!canModify}><Edit2 size={14}/></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table for Premium Tiers */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Type (by Premium)</h3>
                        {canCreate && <Button onClick={(e) => openTierModal(null, 'premium', e)}><Plus size={16}/> Add Tier</Button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b dark:border-gray-600">
                                <tr>
                                    <th className="py-2 w-8"></th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Type Name</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase whitespace-nowrap">Min. Premium (₹)</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Assigned Gift</th>
                                    <th className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                    <th className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody onDragEnd={() => setDraggedTierId(null)}>
                                {sortedTiers.map(tier => (
                                    <tr 
                                        key={tier.id}
                                        draggable={canModify}
                                        onDragStart={e => handleTierDragStart(e, tier.id)}
                                        onDragOver={handleTierDragOver}
                                        onDrop={e => handleTierDrop(e, tier.id)}
                                        className={`border-b dark:border-gray-700/50 ${canModify ? 'cursor-move' : ''} ${draggedTierId === tier.id ? 'opacity-50' : ''} ${!tier.active ? 'opacity-50' : ''}`}
                                    >
                                        <td className="py-2"><GripVertical size={16} className="text-gray-400"/></td>
                                        <td className="py-2 font-medium">{customerTypeMap.get(tier.customerTypeId) || tier.name}</td>
                                        <td className="py-2">{tier.minimumPremium?.toLocaleString('en-IN') || '-'}</td>
                                        <td className="py-2">{gifts.find(g => g.id === tier.giftId)?.name || <span className="text-gray-400 italic">None</span>}</td>
                                        <td className="py-2 text-center"><ToggleSwitch enabled={tier.active !== false} onChange={() => handleToggleTier(tier.id)} disabled={!canModify}/></td>
                                        <td className="py-2 text-center"><Button size="small" variant="light" className="!p-1.5" onClick={(e) => openTierModal(tier, 'edit', e)} disabled={!canModify}><Edit2 size={14}/></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Master Gift List</h3>
                        {canCreate && <Button onClick={(e) => openGiftModal(null, e)}><Plus size={16}/></Button>}
                    </div>
                    <div className="overflow-y-auto max-h-80 pr-2">
                        <table className="w-full text-left text-sm">
                           <tbody>
                                {sortedGifts.map(gift => (
                                    <tr key={gift.id} className={`border-b dark:border-gray-700/50 ${!gift.active ? 'opacity-50' : ''}`}>
                                        <td className={`py-2 ${!gift.active ? 'line-through' : ''}`}>{gift.name}</td>
                                        <td className="py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ToggleSwitch enabled={gift.active !== false} onChange={() => handleToggleGift(gift.id)} disabled={!canModify}/>
                                                <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openGiftModal(gift, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <TierRuleModal
                isOpen={isTierModalOpen}
                onClose={closeTierModal}
                onSave={handleSaveTier}
                initialData={editingTier}
                tiers={tiers}
                customerTypes={customerTypes}
                gifts={gifts}
                mode={tierModalMode}
                canModify={canModify}
            />

            {isGiftModalOpen && (
                <Modal isOpen={isGiftModalOpen} onClose={closeGiftModal}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-brand-dark dark:text-white">{editingGift?.id ? 'Edit' : 'Add'} Gift</h2>
                    </div>
                    <div className="p-6">
                        <Input label="Gift Name" value={editingGift?.name || ''} onChange={e => setEditingGift(p => p ? {...p, name: e.target.value} : null)} disabled={!canModify}/>
                    </div>
                    <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="secondary" onClick={closeGiftModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveGift} disabled={!canModify}>Save Gift</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};


// --- Lead Source Management Component (with Search) ---
const LeadSourceManager: React.FC<{
    items: LeadSourceMaster[];
    onUpdate: (items: LeadSourceMaster[]) => void;
    addToast: MasterDataProps['addToast'];
    canCreate: boolean;
    canModify: boolean;
}> = ({ items, onUpdate, addToast, canCreate, canModify }) => {
    
    const [editingItem, setEditingItem] = useState<Partial<LeadSourceMaster> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ targetId: string | null; position: 'before' | 'after' | 'on' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);


    const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

    const visibleNodeIds = useMemo(() => {
        if (!searchQuery.trim()) {
            return null; // Return null to signify no filter is active
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        const visibleIds = new Set<string>();

        items.forEach(item => {
            if (item.name.toLowerCase().includes(lowerCaseQuery)) {
                // Add the item itself
                visibleIds.add(item.id);
                // Add all its parents
                let current = item;
                while (current.parentId && itemMap.has(current.parentId)) {
                    const parent = itemMap.get(current.parentId)!;
                    visibleIds.add(parent.id);
                    current = parent;
                }
            }
        });
        return visibleIds;
    }, [searchQuery, items, itemMap]);

    const openModal = (parentId: string | null, itemToEdit: LeadSourceMaster | null = null, event?: React.MouseEvent<HTMLElement>) => {
        if(event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        if (itemToEdit) {
            setEditingItem({ ...itemToEdit });
        } else {
            setEditingItem({ 
                id: null, 
                name: '', 
                parentId, 
                allowReferrerSelection: false,
            });
        }
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        triggerButtonRef.current?.focus();
    };

    const handleSave = () => {
        if (!canModify) return;
        if (!editingItem || !editingItem.name?.trim()) {
            addToast('Source name cannot be empty.', 'error');
            return;
        }

        let updatedItems;
        if (editingItem.id) { // Update
            updatedItems = items.map(i => i.id === editingItem.id ? editingItem as LeadSourceMaster : i);
        } else { // Create
            const siblings = items.filter(i => i.parentId === editingItem.parentId);
            const newItem: LeadSourceMaster = {
                id: `ls-${Date.now()}`,
                name: editingItem.name.trim(),
                parentId: editingItem.parentId,
                active: true,
                order: siblings.length,
                allowReferrerSelection: editingItem.allowReferrerSelection || false,
            };
            updatedItems = [...items, newItem];
        }
        onUpdate(updatedItems);
        closeModal();
    };
    
    const handleToggle = (id: string) => {
        const itemToToggle = items.find(i => i.id === id);
        if (!itemToToggle) return;

        const newStatus = !itemToToggle.active;

        // A Set to store the IDs of the item and all its descendants
        const idsToUpdate = new Set<string>();
        
        // A queue to process the hierarchy efficiently
        const idsToProcess: string[] = [id];
        idsToUpdate.add(id);

        // Traverse the tree to find all children, grandchildren, etc.
        while (idsToProcess.length > 0) {
            const currentParentId = idsToProcess.shift(); // Get the next parent from the queue

            // Find all direct children of the current parent
            items.forEach(item => {
                if (item.parentId === currentParentId) {
                    idsToUpdate.add(item.id);
                    idsToProcess.push(item.id); // Add the child to the queue to process its children
                }
            });
        }

        // Update the state for all items in the set
        const updatedItems = items.map(item => {
            if (idsToUpdate.has(item.id)) {
                return { ...item, active: newStatus };
            }
            return item;
        });

        onUpdate(updatedItems);
        addToast(`"${itemToToggle.name}" and all its sub-sources have been ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
    };
    
    const handleReferrerToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? { ...i, allowReferrerSelection: !i.allowReferrerSelection } : i));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sourceId: string) => {
        e.stopPropagation();
        e.dataTransfer.setData('sourceId', sourceId);
        setDraggedItemId(sourceId);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setDraggedItemId(null);
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItemId || draggedItemId === targetId) {
            setDropIndicator(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const dropY = e.clientY - rect.top;
        const height = rect.height;

        if (dropY < height * 0.25) {
            setDropIndicator({ targetId, position: 'before' });
        } else if (dropY > height * 0.75) {
            setDropIndicator({ targetId, position: 'after' });
        } else {
            setDropIndicator({ targetId, position: 'on' });
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDropIndicator(null);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = e.dataTransfer.getData('sourceId');
        const indicator = dropIndicator;
    
        setDraggedItemId(null);
        setDropIndicator(null);
    
        if (!sourceId || !indicator || sourceId === indicator.targetId) {
            return;
        }
    
        const sourceItem = items.find(i => i.id === sourceId);
        if (!sourceItem) return;
    
        let currentParentId = indicator.targetId;
        while (currentParentId) {
            if (currentParentId === sourceId) {
                addToast("Cannot move an item into its own descendant.", "error");
                return;
            }
            currentParentId = items.find(i => i.id === currentParentId)?.parentId || null;
        }
    
        const sourceParentId = sourceItem.parentId;
    
        let newParentId: string | null;
        if (indicator.position === 'on' && indicator.targetId) {
            newParentId = indicator.targetId;
        } else {
            const targetItem = items.find(i => i.id === indicator.targetId);
            newParentId = targetItem ? targetItem.parentId : null;
        }
    
        let tempItems = items.map(i => i.id === sourceId ? { ...i, parentId: newParentId } : i);
    
        const siblings = tempItems.filter(i => i.parentId === newParentId && i.id !== sourceId)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0));
    
        let targetIndex: number;
        if (indicator.position === 'on') {
            targetIndex = siblings.length;
        } else if (indicator.targetId) {
            targetIndex = siblings.findIndex(i => i.id === indicator.targetId);
            if (indicator.position === 'after') {
                targetIndex++;
            }
        } else {
            targetIndex = siblings.length;
        }
    
        siblings.splice(targetIndex, 0, { ...sourceItem, parentId: newParentId });
    
        const reorderedSiblings = siblings.map((item, index) => ({ ...item, order: index }));
    
        let finalItems = tempItems.filter(i => i.parentId !== newParentId || i.id === sourceId);
        finalItems = finalItems.map(item => {
            const reordered = reorderedSiblings.find(s => s.id === item.id);
            return reordered || item;
        });
    
        if (sourceParentId !== newParentId) {
            const oldSiblings = finalItems
                .filter(i => i.parentId === sourceParentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((item, index) => ({ ...item, order: index }));
            
            finalItems = finalItems.filter(i => i.parentId !== sourceParentId);
            finalItems.push(...oldSiblings);
        }
    
        onUpdate(finalItems);
        addToast('Lead source hierarchy updated.', 'success');
    };

    const Node: React.FC<{ source: LeadSourceMaster, level: number }> = ({ source, level }) => {
        const children = items.filter(i => i.parentId === source.id && (!visibleNodeIds || visibleNodeIds.has(i.id))).sort((a,b) => (a.order || 0) - (b.order || 0));

        const isDropTargetOn = dropIndicator?.targetId === source.id && dropIndicator.position === 'on';
        const isDropTargetBefore = dropIndicator?.targetId === source.id && dropIndicator.position === 'before';
        const isDropTargetAfter = dropIndicator?.targetId === source.id && dropIndicator.position === 'after';
        
        return (
            <div className="relative">
                {isDropTargetBefore && <div className="h-1 bg-blue-500 rounded-full mx-2 my-1"></div>}
                <div 
                    draggable={canModify}
                    onDragStart={e => handleDragStart(e, source.id)} 
                    onDragEnd={handleDragEnd} 
                    onDragOver={e => handleDragOver(e, source.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, source.id)}
                    className={`flex items-center gap-2 p-2 rounded-md border-2 transition-colors ${
                        isDropTargetOn ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' : 'border-transparent'
                    } ${source.active === false ? 'opacity-50' : ''} ${draggedItemId === source.id ? 'opacity-30' : ''}`}
                >
                    {level > 0 && <CornerDownRight size={16} className="text-gray-400" style={{ marginLeft: `${(level - 1) * 20}px` }}/>}
                    <div className="flex-grow">
                        <span className="font-medium text-gray-800 dark:text-gray-200" style={{ marginLeft: `${level === 0 ? 0 : 4}px` }}>{source.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ToggleSwitch enabled={source.active !== false} onChange={() => handleToggle(source.id)} disabled={!canModify}/>
                        {canCreate && <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openModal(source.id, null, e)}><Plus size={14}/></Button>}
                        <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openModal(source.parentId, source, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                    </div>
                </div>
                 {isDropTargetAfter && <div className="h-1 bg-blue-500 rounded-full mx-2 my-1"></div>}

                {children.map(child => <Node key={child.id} source={child} level={level + 1} />)}
            </div>
        );
    };

    const rootItems = items.filter(i => i.parentId === null && (!visibleNodeIds || visibleNodeIds.has(i.id))).sort((a,b) => (a.order || 0) - (b.order || 0));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Lead/Referral Management</h3>
                {canCreate && <Button onClick={(e) => openModal(null, null, e)} variant="primary"><Plus size={16}/> Add Lead Source</Button>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Build a hierarchy of your lead sources. Drag and drop to reorder or create sub-sources.
            </p>
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                    type="search"
                    placeholder="Search tree..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            <div 
                onDragOver={e => handleDragOver(e, null)} 
                onDrop={e => handleDrop(e, null)}
                onDragLeave={handleDragLeave}
                className={`p-4 border-2 border-dashed dark:border-gray-700 rounded-lg max-h-[60vh] overflow-y-auto space-y-1 min-h-[10rem] transition-colors ${
                    dropIndicator?.targetId === null ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                }`}
            >
                {rootItems.length > 0 ? (
                    rootItems.map(root => <Node key={root.id} source={root} level={0} />)
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        No matching sources found.
                    </div>
                )}
            </div>

            {isModalOpen && editingItem && (
                 <Modal isOpen={isModalOpen} onClose={closeModal}>
                     <div className="p-6">
                         <h2 className="text-xl font-bold text-brand-dark dark:text-white">{editingItem.id ? 'Edit' : 'Add'} Lead Source</h2>
                         {editingItem.parentId && <p className="text-sm text-gray-500">Adding as a sub-source to "{items.find(i => i.id === editingItem.parentId)?.name}"</p>}
                     </div>
                      <div className="p-6 overflow-y-auto flex-grow space-y-4">
                          <Input 
                              label="Source Name"
                              value={editingItem.name || ''}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                              disabled={!canModify}
                          />
                          <div className="flex items-center gap-3 pt-2">
                              <label htmlFor="allowReferrerSelection" className="font-medium text-gray-700 dark:text-gray-300">Allow Referrer Selection?</label>
                              <ToggleSwitch
                                  enabled={!!editingItem.allowReferrerSelection}
                                  onChange={val => setEditingItem(prev => prev ? { ...prev, allowReferrerSelection: val } : null)}
                                  disabled={!canModify}
                              />
                          </div>
                      </div>
                      <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                          <Button variant="primary" onClick={handleSave} disabled={!canModify}>Save</Button>
                      </div>
                 </Modal>
            )}
        </div>
    );
};


// --- Generic Manager for Simple Lists (REVISED) ---
// --- UPDATED CODE (Complete GenericMasterManager Component) ---
const GenericMasterManager: React.FC<{
    title: string;
    items: any[];
    onUpdate: (items: any[]) => void;
    addToast: MasterDataProps['addToast'];
    noun: string;
    dependencyCheck?: (itemId: string) => { name: string; type: 'member' | 'field' | 'policy' | 'task' }[];
    extraFields?: {
        label: string;
        field: string;
        type: 'select' | 'boolean' | 'multiselect';
        options?: {value: string; label: string}[];
    }[];
    reorderable?: boolean;
    showAddButton?: boolean;
    showSearchBar?: boolean;
    codeColumnDisplay?: 'default' | 'group' | 'hidden';
    onBeforeSave?: (item: any) => boolean;
    initialStateKey?: string;
    endStateKey?: string;
    onUpdateInitialState?: (itemId: string) => void;
    canCreate: boolean;
    canModify: boolean;
}> = ({ title, items, onUpdate, addToast, noun, dependencyCheck, extraFields, reorderable = false,showAddButton = true, showSearchBar = true, codeColumnDisplay = 'default', onBeforeSave, initialStateKey, endStateKey, onUpdateInitialState, canCreate, canModify }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToAction, setItemToAction] = useState<{id: string, name: string, action: 'toggle' | 'delete'} | null>(null);
    const [dependentItems, setDependentItems] = useState<{ name: string; type: 'member' | 'field' | 'policy' | 'task' }[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);

    const existingGroups = useMemo(() => {
        if (noun !== 'Field') return [];
        const groups = items.map(item => item.group).filter(Boolean);
        return [...new Set(groups)];
    }, [items, noun]);

    useEffect(() => {
        if (isModalOpen) {
            setGroupOptions(existingGroups.map(g => ({ value: g, label: g })));
        }
    }, [isModalOpen, existingGroups]);


    const filteredItems = useMemo(() => {
        const displayKey = noun === 'Field' ? 'label' : 'name';
        return items.filter(item => 
            (item[displayKey] && item[displayKey].toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [items, searchQuery, noun]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const sortedItems = useMemo(() => {
        const sortableItems = [...filteredItems];
        if (reorderable) {
            return sortableItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                const dir = sortConfig.direction === 'asc' ? 1 : -1;

                if (aValue === null || aValue === undefined) return 1 * dir;
                if (bValue === null || bValue === undefined) return -1 * dir;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * dir;
                }
                
                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (aValue === bValue) ? 0 : aValue ? -1 * dir : 1 * dir;
                }

                if (aValue < bValue) return -1 * dir;
                if (aValue > bValue) return 1 * dir;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredItems, reorderable, sortConfig]);

    const openModal = (item: any | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        const defaultState = { id: null, name: '', label: '', fieldType: 'text', columnHeaders: [''], rowHeaders: [''], options: [''], columnSpan: 1, group: '' };
        const initialState = item ? { ...defaultState, ...item } : defaultState;

        if (initialState.fieldType === 'table') {
            if (!Array.isArray(initialState.columnHeaders) || initialState.columnHeaders.length === 0) initialState.columnHeaders = [''];
            if (!Array.isArray(initialState.rowHeaders) || initialState.rowHeaders.length === 0) initialState.rowHeaders = [''];
        }
        if (['select', 'checkbox'].includes(initialState.fieldType)) {
             if (!Array.isArray(initialState.options) || initialState.options.length === 0) initialState.options = [''];
        }

        setEditingItem(initialState);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingItem(null);
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    };


    const handleSave = () => {
        if (!canModify) return;
        const displayKey = noun === 'Field' ? 'label' : 'name';
        const displayName = editingItem?.[displayKey];

        if (!editingItem || !displayName || !displayName.trim()) {
            return addToast(`${noun} ${noun === 'Field' ? 'Label' : 'Name'} cannot be empty.`, 'error');
        }

        if (onBeforeSave && !onBeforeSave(editingItem)) {
            return;
        }
    
        if (editingItem.id) { // Update
            onUpdate(items.map(i => i.id === editingItem.id ? editingItem : i));
            addToast(`${noun} updated successfully.`, 'success');
        } else { // Create
            if (items.some(i => i[displayKey].toLowerCase() === displayName.trim().toLowerCase())) {
                return addToast(`This ${noun} already exists.`, 'error');
            }
            const prefix = noun.toLowerCase().replace(/\s/g, '').substring(0, 3); // "Customer Field" -> "cus"
            const newId = `${prefix}-${Date.now()}`;
    
            const toCamelCase = (s: string) => s.replace(/[^a-zA-Z0-9 ]/g, "").replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase()).replace(/ /g, "");

            const newItem = { 
                ...editingItem, 
                id: newId, 
                [displayKey]: displayName.trim(),
                fieldName: noun === 'Field' ? toCamelCase(displayName.trim()) : undefined,
                active: true, 
                order: items.length 
            };
            onUpdate([...items, newItem]);
            addToast(`${noun} added successfully.`, 'success');
        }
        closeModal();
    };
    
    const performToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? {...i, active: i.active === false ? true : false } : i));
    };

    const performDelete = (id: string) => {
        onUpdate(items.filter(i => i.id !== id));
        addToast(`${noun} deleted successfully.`, 'success');
    };

    const handleDelete = (item: any) => {
        const displayKey = noun === 'Field' ? 'label' : 'name';
        if (dependencyCheck) {
            const dependents = dependencyCheck(item.id);
            if (dependents.length > 0) {
                setItemToAction({ id: item.id, name: item[displayKey], action: 'delete' });
                setDependentItems(dependents);
                setIsWarningModalOpen(true);
            } else {
                if(window.confirm(`Are you sure you want to delete this ${noun}? This action cannot be undone.`)) {
                   performDelete(item.id);
                }
            }
        } else {
            if(window.confirm(`Are you sure you want to delete this ${noun}? This action cannot be undone.`)) {
                performDelete(item.id);
            }
        }
    };
    
    const handleToggle = (item: any) => {
        const displayKey = noun === 'Field' ? 'label' : 'name';
        if (item.active === false) { 
            performToggle(item.id);
            return;
        }

        if (dependencyCheck) {
            const dependents = dependencyCheck(item.id);
            if (dependents.length > 0) {
                setItemToAction({ id: item.id, name: item[displayKey], action: 'toggle' });
                setDependentItems(dependents);
                setIsWarningModalOpen(true);
            } else {
                performToggle(item.id);
            }
        } else {
            performToggle(item.id);
        }
    };

    const confirmWarningAction = () => {
        if (itemToAction?.action === 'toggle') {
            performToggle(itemToAction.id);
        }
        setIsWarningModalOpen(false);
        setItemToAction(null);
        setDependentItems([]);
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        setDraggedItemId(id);
    };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedItemId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...items];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);
        
        const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));

        onUpdate(reorderedItems);
    };
    const handleDragEnd = () => setDraggedItemId(null);

    const handleHeaderChange = (type: 'column' | 'row', index: number, value: string) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        setEditingItem((prev: any) => {
            const newHeaders = [...(prev[headerKey] || [])];
            newHeaders[index] = value;
            return { ...prev, [headerKey]: newHeaders };
        });
    };

    const addHeader = (type: 'column' | 'row') => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        setEditingItem((prev: any) => ({
            ...prev,
            [headerKey]: [...(prev[headerKey] || []), '']
        }));
    };

    const removeHeader = (type: 'column' | 'row', index: number) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        setEditingItem((prev: any) => ({
            ...prev,
            [headerKey]: (prev[headerKey] || []).filter((_: any, i: number) => i !== index)
        }));
    };

    const handleOptionChange = (index: number, value: string) => {
        setEditingItem((prev: any) => {
            const newOptions = [...(prev.options || [])];
            newOptions[index] = value;
            return { ...prev, options: newOptions };
        });
    };
    
    const addOption = () => {
        setEditingItem((prev: any) => ({ ...prev, options: [...(prev.options || []), ''] }));
    };
    
    const removeOption = (index: number) => {
        setEditingItem((prev: any) => ({ ...prev, options: (prev.options || []).filter((_: any, i: number) => i !== index) }));
    };

    const displayKey = noun === 'Field' ? 'label' : 'name';

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {showSearchBar && (
                        <form onSubmit={(e) => e.preventDefault()} className="relative flex-grow w-full">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                label=""
                                type="search"
                                placeholder={`Search ${noun}s...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10"
                            />
                        </form>
                    )}
                    {showAddButton && canCreate && (
                        <Button onClick={(e) => openModal(null, e)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                            <Plus size={16}/> Add New {noun}
                        </Button>
                    )}
                </div>
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            {reorderable && <th className="px-2 py-3"></th>}
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase w-16">ID</th>
                            <SortableHeader
                                sortKey={codeColumnDisplay === 'group' ? 'group' : 'id'}
                                label={codeColumnDisplay === 'group' ? 'Group' : 'Code'}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                reorderable={reorderable}
                                className={codeColumnDisplay === 'hidden' ? 'hidden' : ''}
                            />
                            <SortableHeader sortKey={displayKey} label="Name" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            {initialStateKey && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Initial State</th>}
                            {endStateKey && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">End State</th>}
                            <SortableHeader sortKey="active" label="Status" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            {noun !== 'Business Vertical' && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedItems.map((item, index) => (
                            <tr 
                                key={item.id} 
                                draggable={reorderable && canModify}
                                onDragStart={e => reorderable && handleDragStart(e, item.id)}
                                onDragOver={e => reorderable && handleDragOver(e)}
                                onDrop={e => reorderable && handleDrop(e, item.id)}
                                onDragEnd={() => reorderable && handleDragEnd()}
                                className={`transition-all ${item.active === false ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''} ${reorderable && canModify ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-move' : ''}`}
                            >
                                {reorderable && <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>}
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className={`px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono ${codeColumnDisplay === 'hidden' ? 'hidden' : ''}`}>
                                    {codeColumnDisplay === 'group' ? (item.group || <span className="italic text-gray-400">N/A</span>) : item.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{item[displayKey]}</td>
                                {initialStateKey && onUpdateInitialState && (
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            name="initialStateRadio"
                                            checked={!!item[initialStateKey]}
                                            onChange={() => onUpdateInitialState(item.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            disabled={!canModify}
                                        />
                                    </td>
                                )}
                                {endStateKey && (
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <ToggleSwitch
                                            enabled={!!item[endStateKey]}
                                            onChange={val => onUpdate(items.map(i => i.id === item.id ? { ...i, [endStateKey]: val } : i))}
                                            disabled={!canModify}
                                        />
                                    </td>
                                )}
                                <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={item.active !== false} onChange={() => handleToggle(item)} disabled={!canModify} /></td>
                                {noun !== 'Business Vertical' && (
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {noun !== 'Task Type' && <button onClick={(e) => openModal(item, e)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Edit ${item.name}`} disabled={!canModify}><Edit2 size={16}/></button>}
                                            {noun !== 'Task Type' && canModify && (
                                                <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600" aria-label={`Delete ${item.name}`}><Trash2 size={16}/></button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredItems.length === 0 && <div className="p-8 text-center text-gray-500">No {noun}s found.</div>}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                contentClassName="bg-white dark:bg-[#2D3748] p-8 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingItem?.id ? 'Edit' : 'Add'} {noun}</h2>
                    <fieldset disabled={!canModify}>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <Input
                                label={noun === 'Field' ? 'Field Label' : `${noun} Name`}
                                value={editingItem?.[displayKey] || ''}
                                onChange={e => setEditingItem((prev: any) => prev ? {...prev, [displayKey]: e.target.value} : null)}
                            />
                            {extraFields?.map(field => {
                                if (field.type === 'boolean') {
                                    return (
                                        <div key={field.field} className="flex items-center justify-between gap-4 pt-2 border-t dark:border-gray-600">
                                            <label htmlFor={field.field} className="font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                                            <ToggleSwitch
                                                enabled={!!editingItem?.[field.field]}
                                                onChange={val => setEditingItem((prev: any) => prev ? { ...prev, [field.field]: val } : null)}
                                            />
                                        </div>
                                    );
                                }
                                if (field.type === 'multiselect') {
                                    return (
                                        <div key={field.field} className="pt-2 border-t dark:border-gray-600">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                            <select
                                                multiple
                                                value={editingItem?.[field.field] || []}
                                                onChange={e => {
                                                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                                                    setEditingItem((prev: any) => prev ? {...prev, [field.field]: selectedIds} : null);
                                                }}
                                                className={`${modalInputClasses} h-32`}
                                            >
                                                {field.options
                                                    ?.filter(opt => opt.value !== editingItem?.id) 
                                                    .map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            <p className="text-xs text-gray-400 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple options.</p>
                                        </div>
                                    )
                                }
                                if (field.type === 'select') {
                                    return (
                                    <div key={field.field}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                        <select
                                            value={editingItem?.[field.field] || ''}
                                            onChange={e => setEditingItem((prev: any) => prev ? {...prev, [field.field]: e.target.value} : null)}
                                            className={modalInputClasses}
                                        >
                                            <option value="">Select...</option>
                                            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    );
                                }
                                return null;
                            })}
                            {noun === 'Field' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <SearchableSelect
                                                label="Group Name (Optional)"
                                                options={groupOptions}
                                                value={editingItem?.group || ''}
                                                onChange={value => setEditingItem((prev: any) => prev ? { ...prev, group: value } : null)}
                                                onCreate={value => {
                                                    if (value) {
                                                        setEditingItem((prev: any) => prev ? { ...prev, group: value } : null);
                                                        setGroupOptions(prev => [...prev, { value, label: value}]);
                                                    }
                                                }}
                                                placeholder="Select or type..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column Span</label>
                                            <select
                                                value={editingItem?.columnSpan || 1}
                                                onChange={e => setEditingItem((prev: any) => prev ? { ...prev, columnSpan: parseInt(e.target.value, 10) } : null)}
                                                className={modalInputClasses}
                                            >
                                                <option value={1}>1 Column (Default)</option>
                                                <option value={2}>2 Columns</option>
                                                <option value={3}>3 Columns</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Type</label>
                                        <select
                                            value={editingItem?.fieldType || 'text'}
                                            onChange={e => setEditingItem((prev: any) => prev ? {...prev, fieldType: e.target.value} : null)}
                                            className={modalInputClasses}
                                        >
                                            <option value="text">Text Input</option>
                                            <option value="number">Number Input</option>
                                            <option value="date">Date Input</option>
                                            <option value="boolean">Toggle (Yes/No)</option>
                                            <option value="select">Dropdown (Select)</option>
                                            <option value="checkbox">Checkbox Group</option>
                                            <option value="table">Table</option>
                                        </select>
                                    </div>

                                    {['select', 'checkbox'].includes(editingItem?.fieldType) && (
                                        <div className="space-y-2 p-3 border dark:border-gray-600 rounded-lg animate-fade-in">
                                            <h4 className="text-sm font-semibold">Define Options</h4>
                                            {(editingItem.options || []).map((option: string, index: number) => (<div key={index} className="flex items-center gap-2"><Input label="" placeholder={`Option ${index + 1}`} value={option} onChange={e => handleOptionChange(index, e.target.value)} /><Button type="button" variant="danger" size="small" className="!p-2" onClick={() => removeOption(index)}><Trash2 size={14} /></Button></div>))}
                                            <Button type="button" variant="light" size="small" onClick={addOption}><Plus size={14} /> Add Option</Button>
                                        </div>
                                    )}
                                    
                                    {editingItem?.fieldType === 'table' && (
                                        <div className="space-y-4 p-3 border dark:border-gray-600 rounded-lg animate-fade-in">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold">Define Table Columns</h4>
                                                {(editingItem.columnHeaders || ['']).map((header: string, index: number) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input
                                                            label=""
                                                            placeholder={`Column ${index + 1} Name`}
                                                            value={header}
                                                            onChange={e => handleHeaderChange('column', index, e.target.value)}
                                                        />
                                                        <Button type="button" variant="danger" size="small" className="!p-2" onClick={() => removeHeader('column', index)}>
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="light" size="small" onClick={() => addHeader('column')}>
                                                    <Plus size={14} /> Add Column
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold">Define Table Rows</h4>
                                                {(editingItem.rowHeaders || ['']).map((header: string, index: number) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input
                                                            label=""
                                                            placeholder={`Row ${index + 1} Name`}
                                                            value={header}
                                                            onChange={e => handleHeaderChange('row', index, e.target.value)}
                                                        />
                                                        <Button type="button" variant="danger" size="small" className="!p-2" onClick={() => removeHeader('row', index)}>
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="light" size="small" onClick={() => addHeader('row')}>
                                                    <Plus size={14} /> Add Row
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {initialStateKey && (
                                <div className="flex items-center justify-between gap-4 pt-2 border-t dark:border-gray-600">
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Set as Initial State</label>
                                    <ToggleSwitch
                                        enabled={!!editingItem?.[initialStateKey]}
                                        onChange={val => setEditingItem((prev: any) => prev ? { ...prev, [initialStateKey]: val } : null)}
                                    />
                                </div>
                            )}
                            {endStateKey && (
                                <div className="flex items-center justify-between gap-4 pt-2 border-t dark:border-gray-600">
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Set as End State</label>
                                    <ToggleSwitch
                                        enabled={!!editingItem?.[endStateKey]}
                                        onChange={val => setEditingItem((prev: any) => prev ? { ...prev, [endStateKey]: val } : null)}
                                    />
                                </div>
                            )}
                        </div>
                    </fieldset>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            {itemToAction?.action === 'delete' ? 'Cannot Delete' : `Deactivate "${itemToAction?.name}"?`}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {itemToAction?.action === 'delete'
                                    ? (
                                        <>
                                            This item is currently used by <strong>{dependentItems.length} record(s)</strong> and cannot be deleted. Please remove its usage before proceeding.
                                        </>
                                    )
                                    : (
                                        <>
                                            This item is currently used by <strong>{dependentItems.length} record(s)</strong>. Deactivating it may cause data inconsistencies.
                                        </>
                                    )
                                }
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                Used by: {dependentItems.slice(0, 3).map(m => m.name).join(', ')}{dependentItems.length > 3 ? ', and others.' : '.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    {itemToAction?.action === 'toggle' ? (
                        <>
                            <Button variant="danger" onClick={confirmWarningAction}>
                                Deactivate Anyway
                            </Button>
                            <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                                Cancel
                            </Button>
                        </>
                    ) : (
                         <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                            OK
                        </Button>
                    )}
                </div>
            </Modal>
        </div>
    );
};
// --- MODIFICATION START: New component for managing process stages ---
const ProcessStageManager: React.FC<{
    title: string;
    items: ProcessStageMaster[];
    onUpdate: (items: ProcessStageMaster[]) => void;
    addToast: MasterDataProps['addToast'];
    allMembers: Member[];
    typeId: string | null; // insuranceTypeId or 'mutual-fund' for dependency check
    canCreate: boolean;
    canModify: boolean;
}> = ({ title, items, onUpdate, addToast, allMembers, typeId, canCreate, canModify }) => {
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ProcessStageMaster> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    
    const sortedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

    const openModal = (item: ProcessStageMaster | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingItem(item ? { ...item } : { name: '', active: true });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        triggerButtonRef.current?.focus();
    };
    
    const handleSave = () => {
        if (!canModify) return;
        if (!editingItem || !editingItem.name?.trim()) {
            addToast('Stage name is required.', 'error');
            return;
        }

        if (editingItem.id) { // Update
            onUpdate(items.map(i => i.id === editingItem.id ? (editingItem as ProcessStageMaster) : i));
        } else { // Create
            const newItem: ProcessStageMaster = {
                id: `ps-${Date.now()}`,
                name: editingItem.name.trim(),
                active: true,
                order: items.length,
            };
            onUpdate([...items, newItem]);
        }
        closeModal();
    };
    
    const handleToggle = (id: string) => onUpdate(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
    
    const handleDelete = (id: string) => {
        const stage = items.find(i => i.id === id);
        if (!stage || !typeId) return;

        const dependents = allMembers.filter(m => m.processStages && m.processStages[typeId] === stage.name);
        
        if (dependents.length > 0) {
            addToast(`Cannot delete: ${dependents.length} customer(s) are currently in this stage.`, 'error');
            return;
        }

        const newItems = items.filter(i => i.id !== id).map((item, index) => ({ ...item, order: index }));
        onUpdate(newItems);
        addToast('Stage deleted successfully.', 'success');
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        setDraggedItemId(id);
    };
    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        setDraggedItemId(null);
        if (draggedId === dropTargetId) return;

        const currentItems = [...sortedItems];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);
        
        onUpdate(currentItems.map((item, index) => ({ ...item, order: index })));
    };
    const handleDragEnd = () => setDraggedItemId(null);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
                {canCreate && <Button onClick={(e) => openModal(null, e)} size="small"><Plus size={14}/> Add Stage</Button>}
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                        <th className="px-2 py-3"></th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase w-16">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" onDragEnd={handleDragEnd}>
                        {sortedItems.map((item, index) => (
                            <tr key={item.id} draggable={canModify} onDragStart={e => handleDragStart(e, item.id)} onDragOver={handleDragOver} onDrop={e => handleDrop(e, item.id)}
                                className={`transition-all ${!item.active ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''} ${canModify ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-move' : ''}`}>
                                <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>
                                <td className="px-6 py-3 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-6 py-3 font-medium">{item.name}</td>
                                <td className="px-6 py-3"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggle(item.id)} disabled={!canModify}/></td>
                                <td className="px-6 py-3">
                                    <div className="flex gap-2">
                                        <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openModal(item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                        {canModify && <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleDelete(item.id)}><Trash2 size={14}/></Button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {isModalOpen && editingItem && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingItem.id ? 'Edit' : 'Add'} Stage</h2></div>
                        <div className="p-6"><Input label="Stage Name" value={editingItem.name || ''} onChange={e => setEditingItem(p => p ? {...p, name: e.target.value} : null)} disabled={!canModify}/></div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={!canModify}>Save</Button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
// --- MODIFICATION END ---

// --- MODIFICATION START: This is the updated PolicyConfigurationManager component ---

// --- NEW SELF-CONTAINED MODAL COMPONENT ---
const InsuranceTypeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InsuranceTypeMaster>) => void;
    initialData: Partial<InsuranceTypeMaster> | null;
    businessVerticals: BusinessVertical[];
    parentTypeName?: string;
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, businessVerticals, parentTypeName, canModify }) => {
    
    const [formData, setFormData] = useState<Partial<InsuranceTypeMaster>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof InsuranceTypeMaster, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold">{formData.id ? 'Edit' : 'Add'} {formData.parentId ? 'Insurance Sub-Type' : 'Insurance Type'}</h2>
                    {parentTypeName && <p className="text-sm text-gray-500">Adding as a Sub-Type of "{parentTypeName}"</p>}
                </div>
                <div className="p-6 space-y-4">
                    {!formData.parentId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Vertical</label>
                            <select
                                value={formData.verticalId || ''}
                                onChange={(e) => handleChange('verticalId', e.target.value)}
                                className={selectClasses}
                                required
                                disabled={!canModify}
                            >
                                <option value="">-- Select Vertical --</option>
                                {businessVerticals.filter(bv => bv.active).map(bv => (
                                    <option key={bv.id} value={bv.id}>{bv.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Input
                        label="Name"
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        disabled={!canModify}
                    />
                </div>
                <div className="flex justify-end p-6 gap-3 border-t">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={!canModify}>Save</Button>
                </div>
            </form>
        </Modal>
    );
};


const PolicyConfigurationManager: React.FC<MasterDataProps & { canCreate: boolean; canModify: boolean }> = (props) => {
    const { 
        insuranceTypes, onUpdateInsuranceTypes, 
        insuranceFields, onUpdateInsuranceFields, 
        addToast, allMembers, businessVerticals, schemes,
        processStageMasters, onUpdateProcessStageMasters,
        documentMasters, insuranceTypeDocumentRules, onUpdateInsuranceTypeDocumentRules,
        canCreate, canModify
    } = props;
    
    const [selectedParentTypeId, setSelectedParentTypeId] = useState<string | null>(null);
    const [selectedConfigTypeId, setSelectedConfigTypeId] = useState<string | null>(null);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<InsuranceTypeMaster> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToAction, setItemToAction] = useState<{ id: string; name: string; } | null>(null);
    const [dependentItems, setDependentItems] = useState<{ name: string; type: 'field' | 'policy' }[]>([]);

    const parentTypes = useMemo(() => insuranceTypes.filter(it => !it.parentId).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)), [insuranceTypes]);
    
    useEffect(() => {
        if (!selectedParentTypeId && parentTypes.length > 0) {
            const firstActive = parentTypes.find(p => p.active);
            if (firstActive) {
                setSelectedParentTypeId(firstActive.id);
                setSelectedConfigTypeId(firstActive.id);
            }
        }
    }, [parentTypes, selectedParentTypeId]);
    
    const filteredData = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        if (!lowerCaseQuery) {
            return {
                parentTypes,
                childTypes: selectedParentTypeId ? insuranceTypes.filter(it => it.parentId === selectedParentTypeId).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)) : [],
                fields: selectedConfigTypeId ? insuranceFields.filter(f => f.insuranceTypeId === selectedConfigTypeId) : [],
            };
        }

        const visibleTypeIds = new Set<string>();
        const filteredFields = insuranceFields.filter(f => f.label.toLowerCase().includes(lowerCaseQuery));
        filteredFields.forEach(f => visibleTypeIds.add(f.insuranceTypeId));
        
        insuranceTypes.forEach(type => { if (type.name.toLowerCase().includes(lowerCaseQuery)) { visibleTypeIds.add(type.id); } });
        visibleTypeIds.forEach(id => { const type = insuranceTypes.find(it => it.id === id); if (type?.parentId) { visibleTypeIds.add(type.parentId); } });
        
        const filteredParentTypes = parentTypes.filter(pt => visibleTypeIds.has(pt.id));
        const filteredChildTypes = selectedParentTypeId ? insuranceTypes.filter(it => it.parentId === selectedParentTypeId && visibleTypeIds.has(it.id)) : [];
        
        return { 
            parentTypes: filteredParentTypes, 
            childTypes: filteredChildTypes, 
            fields: selectedConfigTypeId ? filteredFields.filter(f => f.insuranceTypeId === selectedConfigTypeId) : [], 
        };
    }, [searchQuery, parentTypes, selectedParentTypeId, selectedConfigTypeId, insuranceTypes, insuranceFields]);

    const openTypeModal = (item: Partial<InsuranceTypeMaster> | null, event?: React.MouseEvent<HTMLElement>) => {
        if(event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        let initialData: Partial<InsuranceTypeMaster>;
        if (item && item.id) { initialData = { ...item }; } 
        else if (item && item.parentId) { const parent = parentTypes.find(p => p.id === item.parentId); initialData = { name: '', parentId: item.parentId, active: true, verticalId: parent ? parent.verticalId : '' }; } 
        else { initialData = { name: '', parentId: null, active: true, verticalId: '' }; }
        setEditingType(initialData);
        setIsTypeModalOpen(true);
    };
    
    const closeTypeModal = () => { setIsTypeModalOpen(false); triggerButtonRef.current?.focus(); }

    const handleSaveType = (typeData: Partial<InsuranceTypeMaster>) => {
        if (!canModify) return;
        if (!typeData || !typeData.name?.trim()) { addToast('Insurance Type name is required.', 'error'); return; }
        if (!typeData.verticalId) { addToast('Business Vertical is required.', 'error'); return; }
        let updatedTypes : InsuranceTypeMaster[];
        if (typeData.id) { updatedTypes = insuranceTypes.map(it => it.id === typeData.id ? (typeData as InsuranceTypeMaster) : it); } 
        else { const newItem: InsuranceTypeMaster = { id: `ins-type-${Date.now()}`, name: typeData.name.trim(), parentId: typeData.parentId || null, active: true, order: insuranceTypes.length, verticalId: typeData.verticalId, }; updatedTypes = [...insuranceTypes, newItem]; }
        onUpdateInsuranceTypes(updatedTypes);
        closeTypeModal();
    };
    
    const checkTypeDependencies = (typeId: string): { name: string; type: 'field' | 'policy' }[] => {
        const type = insuranceTypes.find(it => it.id === typeId);
        if (!type) return [];
        let dependents: { name: string; type: 'field' | 'policy' }[] = [];

        if (!type.parentId) { // It's a parent
            const children = insuranceTypes.filter(it => it.parentId === typeId);
            dependents.push(...children.map(c => ({ name: `Sub-Type: ${c.name}`, type: 'field' as const })));
        }

        const schemesLinked = schemes.filter(s => s.insuranceTypeId === typeId);
        dependents.push(...schemesLinked.map(s => ({ name: `Scheme: ${s.name}`, type: 'policy' as const })));

        return dependents;
    };

    const performToggle = (id: string) => {
        const typeToToggle = insuranceTypes.find(it => it.id === id);
        if (!typeToToggle) return;
        const newStatus = !typeToToggle.active;
        if (!typeToToggle.parentId) { // It's a parent, cascade the status
            const childIds = insuranceTypes.filter(it => it.parentId === id).map(it => it.id);
            onUpdateInsuranceTypes(insuranceTypes.map(it => (it.id === id || childIds.includes(it.id)) ? { ...it, active: newStatus } : it));
            addToast(`"${typeToToggle.name}" and its sub-types have been ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
        } else { // It's a child, toggle only itself
            onUpdateInsuranceTypes(insuranceTypes.map(it => it.id === id ? { ...it, active: newStatus } : it));
        }
    };
    
    const handleToggleType = (id: string) => {
        const typeToToggle = insuranceTypes.find(it => it.id === id);
        if (!typeToToggle) return;

        if (typeToToggle.active) { // Only show warning when DEACTIVATING
            const dependents = checkTypeDependencies(id);
            const childDependents = !typeToToggle.parentId 
                ? insuranceTypes.filter(it => it.parentId === id).flatMap(child => checkTypeDependencies(child.id))
                : [];
            const allDependents = [...dependents, ...childDependents];

            if (allDependents.length > 0) {
                setItemToAction({ id, name: typeToToggle.name });
                setDependentItems(allDependents);
                setIsWarningModalOpen(true);
            } else {
                performToggle(id); // Deactivate directly if no dependents
            }
        } else {
            performToggle(id); // Activate directly without warning
        }
    };
    
    const confirmWarningAction = () => {
        if (itemToAction) {
            performToggle(itemToAction.id);
        }
        setIsWarningModalOpen(false);
        setItemToAction(null);
        setDependentItems([]);
    };

    const TypeTable: React.FC<{
        title: string;
        items: InsuranceTypeMaster[];
        onSelectRow: (id: string) => void;
        selectedId: string | null;
        onAdd: (event: React.MouseEvent<HTMLElement>) => void;
    }> = ({ title, items, onSelectRow, selectedId, onAdd }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h4>
                {canCreate && <Button onClick={onAdd} size="small"><Plus size={14}/> Add</Button>}
            </div>
            <div className="overflow-x-auto max-h-60">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold uppercase w-8">ID</th>
                            <th className="px-3 py-2 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} onClick={() => onSelectRow(item.id)}
                                className={`cursor-pointer ${selectedId === item.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} ${!item.active ? 'opacity-50' : ''}`}
                            >
                                <td className="px-3 py-2 text-sm">{index + 1}</td>
                                <td className="px-3 py-2 font-medium">{item.name}</td>
                                <td className="px-3 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggleType(item.id)} disabled={!canModify}/></td>
                                <td className="px-3 py-2">
                                    <Button size="small" variant="light" className="!p-1.5" onClick={(e) => { e.stopPropagation(); openTypeModal(item, e); }} disabled={!canModify}><Edit2 size={14}/></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const DocumentRuleManager: React.FC<{typeId: string}> = ({ typeId }) => {
        const [docToAdd, setDocToAdd] = useState<string>('');
        
        const rulesForType = useMemo(() => 
            insuranceTypeDocumentRules.filter(r => r.insuranceTypeId === typeId),
        [insuranceTypeDocumentRules, typeId]);
        
        const documentMap = useMemo(() => new Map(documentMasters.map(d => [d.id, d.name])), [documentMasters]);
        
        const availableDocs = useMemo(() => 
            documentMasters.filter(d => d.active && !rulesForType.some(r => r.documentId === d.id)), 
        [documentMasters, rulesForType]);

        const handleAddRule = () => {
            if (!docToAdd || !canCreate) return;
            const newRule: InsuranceTypeDocumentRule = {
                id: `rule-${Date.now()}`,
                insuranceTypeId: typeId,
                documentId: docToAdd,
                isMandatory: false, // Default to not mandatory
            };
            onUpdateInsuranceTypeDocumentRules([...insuranceTypeDocumentRules, newRule]);
            setDocToAdd(''); // Reset dropdown
        };

        const handleToggleMandatory = (ruleId: string) => {
            onUpdateInsuranceTypeDocumentRules(
                insuranceTypeDocumentRules.map(r => r.id === ruleId ? { ...r, isMandatory: !r.isMandatory } : r)
            );
        };

        const handleRemoveRule = (ruleId: string) => {
            onUpdateInsuranceTypeDocumentRules(
                insuranceTypeDocumentRules.filter(r => r.id !== ruleId)
            );
        };

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Document Requirements</h3>
                {canCreate && (
                    <div className="flex items-center gap-2 mb-4">
                        <select 
                            value={docToAdd} 
                            onChange={e => setDocToAdd(e.target.value)} 
                            className={selectClasses + " flex-grow"}
                        >
                            <option value="">-- Select a document to add --</option>
                            {availableDocs.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                        <Button onClick={handleAddRule} disabled={!docToAdd}>
                            <Plus size={16}/> Add
                        </Button>
                    </div>
                )}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {rulesForType.length > 0 ? rulesForType.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <span className="font-medium text-sm">{documentMap.get(rule.documentId) || 'Unknown Document'}</span>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <ToggleSwitch 
                                        enabled={rule.isMandatory}
                                        onChange={() => handleToggleMandatory(rule.id)}
                                        disabled={!canModify}
                                    />
                                    Mandatory
                                </label>
                                {canModify && (
                                    <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleRemoveRule(rule.id)}>
                                        <Trash2 size={14}/>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-4">No documents required for this type.</p>
                    )}
                </div>
            </div>
        );
    };


    const checkFieldDependencies = (fieldId: string) => {
        const field = insuranceFields.find(f => f.id === fieldId);
        if (!field) return [];
        const dependents: { name: string; type: 'policy' }[] = [];
        for (const member of allMembers) { for (const policy of member.policies || []) { if (policy.insuranceTypeId === field.insuranceTypeId && policy.dynamicData) { if ( (policy.dynamicData[field.fieldName] !== undefined && policy.dynamicData[field.fieldName] !== '' && policy.dynamicData[field.fieldName]?.length !== 0) || (policy.dynamicData[field.label] !== undefined) ) { dependents.push({ name: `${member.name} (Policy: ${policy.schemeName || 'N/A'})`, type: 'policy' }); break; } } } }
        return dependents;
    };
    
    const isParentTypeSelected = selectedConfigTypeId && parentTypes.some(p => p.id === selectedConfigTypeId);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Policy Configuration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Define Insurance types, their Sub-Type, and the specific fields & checklists for each.</p>
            <div className="relative my-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"> <Search className="h-5 w-5 text-gray-400" /> </div>
                <Input type="search" placeholder="Search all types, fields, and checklist items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <TypeTable title="Manage Insurance Type" items={filteredData.parentTypes} selectedId={selectedParentTypeId} onSelectRow={(id) => { setSelectedParentTypeId(id); setSelectedConfigTypeId(id); }} onAdd={(e) => openTypeModal({ parentId: null }, e)} />
                <TypeTable title="Manage Insurance Sub-Type" items={filteredData.childTypes} selectedId={selectedConfigTypeId === selectedParentTypeId ? null : selectedConfigTypeId} onSelectRow={(id) => { setSelectedConfigTypeId(id); }} onAdd={(e) => { if (!selectedParentTypeId) { addToast('Please select a Insurance type first.', 'error'); return; } openTypeModal({ parentId: selectedParentTypeId }, e); }} />
            </div>
            {selectedConfigTypeId && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg animate-fade-in space-y-8">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300"> Configure for: <span className="text-blue-600 dark:text-blue-400">{insuranceTypes.find(it => it.id === selectedConfigTypeId)?.name}</span> </h4>
                    {isParentTypeSelected && (<ProcessStageManager key={`psm-${selectedConfigTypeId}`} title="Manage Process Flow" items={processStageMasters.filter(psm => psm.insuranceTypeId === selectedConfigTypeId)} onUpdate={(updatedStages) => { const otherStages = processStageMasters.filter(psm => psm.insuranceTypeId !== selectedConfigTypeId); const newStagesForType = updatedStages.map(s => ({ ...s, insuranceTypeId: selectedConfigTypeId, isMutualFund: false })); onUpdateProcessStageMasters([...otherStages, ...newStagesForType]); }} addToast={addToast} allMembers={allMembers} typeId={selectedConfigTypeId} canCreate={canCreate} canModify={canModify}/>)}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenericMasterManager codeColumnDisplay="group" reorderable={true} title={`Fields`} items={filteredData.fields} onUpdate={(newItemsForType) => { const otherFields = insuranceFields.filter(f => f.insuranceTypeId !== selectedConfigTypeId); const finalNewFields = newItemsForType.map((item: any) => ({ ...item, insuranceTypeId: selectedConfigTypeId, })); onUpdateInsuranceFields([...otherFields, ...finalNewFields] as InsuranceFieldMaster[]); }} addToast={addToast} noun="Field" dependencyCheck={checkFieldDependencies} showSearchBar={false} canCreate={canCreate} canModify={canModify}/>
                        <DocumentRuleManager key={selectedConfigTypeId} typeId={selectedConfigTypeId} />
                    </div>
                </div>
            )}

            <InsuranceTypeModal
                isOpen={isTypeModalOpen}
                onClose={closeTypeModal}
                onSave={handleSaveType}
                initialData={editingType}
                businessVerticals={businessVerticals}
                parentTypeName={editingType?.parentId ? parentTypes.find(p => p.id === editingType.parentId)?.name : undefined}
                canModify={canModify}
            />
            
            <Modal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Deactivate "{itemToAction?.name}"?
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This item is currently used by <strong>{dependentItems.length} record(s)</strong>. Deactivating it may cause data inconsistencies.
                            </p>
                            <ul className="text-xs text-gray-400 dark:text-gray-500 mt-2 list-disc list-inside max-h-24 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                {dependentItems.slice(0, 5).map((item, index) => <li key={index}>{item.name}</li>)}
                                {dependentItems.length > 5 && <li>...and {dependentItems.length - 5} more.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button variant="danger" onClick={confirmWarningAction}>
                        Deactivate Anyway
                    </Button>
                    <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                        Cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// --- MasterData.tsx -> SchemesAndMappingsManager Component ---

const SchemesAndMappingsManager: React.FC<MasterDataProps & { canCreate: boolean; canModify: boolean }> = (props) => {
    // --- FIX: Use 'agencies' prop instead of 'companies' ---
    const { schemes, onUpdateSchemes, agencies, onUpdateAgencies, addToast, documentMasters, allMembers, insuranceTypes, canCreate, canModify } = props;
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
    const [editingScheme, setEditingScheme] = useState<SchemeMaster | null>(null);
    const [schemeFormData, setSchemeFormData] = useState<Partial<SchemeMaster>>({});
    const [companySearch, setCompanySearch] = useState('');
    const [schemeSearch, setSchemeSearch] = useState('');
    const [warningModalContent, setWarningModalContent] = useState<{ title: string; message: string; onConfirm?: () => void; dependents?: Member[] } | null>(null);
    const [cannotDeleteModal, setCannotDeleteModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    
    const [modalParentType, setModalParentType] = useState<string | null>(null);

    // --- NESTED COMPONENT DEFINITION ---
    const SchemeCompanyDataTable: React.FC<{
        title: string;
        items: SchemeMaster[];
        onReorder: (reorderedItems: SchemeMaster[]) => void;
        onAddItem: (event: React.MouseEvent<HTMLElement>) => void;
        onEditItem: (item: SchemeMaster, event: React.MouseEvent<HTMLElement>) => void;
        onToggleItem: (id: string) => void;
        onDeleteItem: (id: string) => void;
        search: string;
        onSearch: (query: string) => void;
        noun: string;
        insuranceTypes: InsuranceTypeMaster[];
    }> = ({ title, items, onReorder, onAddItem, onEditItem, onToggleItem, onDeleteItem, search, onSearch, noun, insuranceTypes }) => {
        const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
        const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);
    
        const getInsuranceTypeName = (item: SchemeMaster) => {
            if (item.insuranceTypeId) {
                const type = insuranceTypeMap.get(item.insuranceTypeId);
                if (type) {
                    if (type.parentId) {
                        const parent = insuranceTypeMap.get(type.parentId);
                        return `${parent?.name} > ${type.name}`;
                    }
                    return type.name;
                }
            }
            return item.generalInsuranceType ? `${item.type} (${item.generalInsuranceType})` : item.type;
        };
    
        const sortedItems = useMemo(() => {
            return [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
        }, [items]);
    
        const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
            e.dataTransfer.setData('text/plain', id);
            setDraggedItemId(id);
        };
        const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => e.preventDefault();
        const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropTargetId: string) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            setDraggedItemId(null);
            if (draggedId === dropTargetId) return;
    
            const currentItems = [...sortedItems];
            const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
            const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);
    
            if (draggedIndex === -1 || targetIndex === -1) return;
    
            const [draggedItem] = currentItems.splice(draggedIndex, 1);
            currentItems.splice(targetIndex, 0, draggedItem);
            
            const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));
            onReorder(reorderedItems);
        };
        const handleDragEnd = () => setDraggedItemId(null);
    
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                    <div className="relative flex-grow w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="search"
                            className="block w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder={`Search ${noun}s...`}
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                    {canCreate && (
                        <Button onClick={onAddItem} variant="primary" className="w-full md:w-auto flex-shrink-0">
                            <Plus size={16}/> Add New {noun}
                        </Button>
                    )}
                </div>
                <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-2 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedItems.map((item, index) => (
                                <tr 
                                    key={item.id} 
                                    draggable={canModify}
                                    onDragStart={e => handleDragStart(e, item.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={e => handleDrop(e, item.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${canModify ? 'cursor-move' : ''} ${item.active === false ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''}`}
                                >
                                    <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{item.name}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getInsuranceTypeName(item)}</td>
                                    <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={item.active !== false} onChange={() => onToggleItem(item.id)} disabled={!canModify}/></td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Button size="small" variant="light" className="!p-1.5" onClick={(e) => onEditItem(item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                            {canModify && <Button size="small" variant="danger" className="!p-1.5" onClick={() => onDeleteItem(item.id)}><Trash2 size={14}/></Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {items.length === 0 && <div className="p-8 text-center text-gray-500">No {noun}s found for this company.</div>}
                </div>
            </div>
        );
    };

    const filteredCompanies = useMemo(() => agencies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())), [agencies, companySearch]);
    
    const schemesForSelectedCompany = useMemo(() => {
        if (!selectedCompanyId) return [];
        return schemes.filter(s => 
            s.companyId === selectedCompanyId && 
            (s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.id.toLowerCase().includes(schemeSearch.toLowerCase()))
        );
    }, [schemes, selectedCompanyId, schemeSearch]);

    const openCompanyModal = (company: Company | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingCompany(company ? {...company} : {id: '', name: '', companyCode: '', active: true});
        setIsCompanyModalOpen(true);
    };

    const closeCompanyModal = () => {
        setIsCompanyModalOpen(false);
        triggerButtonRef.current?.focus();
    };

    const saveCompany = () => {
        if(!canModify) return;
        if(!editingCompany || !editingCompany.name.trim()) return addToast('Agency name is required.', 'error');
        
        if (editingCompany.id) {
            onUpdateAgencies(agencies.map(c => c.id === editingCompany.id ? editingCompany : c));
        } else {
            const newCompany = { ...editingCompany, id: `comp-${Date.now()}`, companyCode: editingCompany.name.toUpperCase().replace(/\s/g, '').substring(0, 4) };
            onUpdateAgencies([...agencies, newCompany]);
        }
        closeCompanyModal();
    };
    const performCompanyToggle = (id: string) => {
        onUpdateAgencies(agencies.map(c => c.id === id ? { ...c, active: c.active === false ? true : false } : c));
    };
    const handleDeleteCompany = (companyId: string) => {
        const company = agencies.find(c => c.id === companyId);
        if (!company) return;
    
        const associatedSchemes = schemes.filter(s => s.companyId === companyId);
    
        if (associatedSchemes.length > 0) {
            setCannotDeleteModal({ isOpen: true, message: `You cannot delete "${company.name}" because it has ${associatedSchemes.length} scheme(s) linked to it. Please remove or reassign the schemes first.` });
        } else {
            if (window.confirm(`Are you sure you want to delete the Agency "${company.name}"? This action cannot be undone.`)) {
                onUpdateAgencies(agencies.filter(c => c.id !== companyId));
                addToast(`Agency "${company.name}" deleted successfully.`, 'success');
            }
        }
    };
    const toggleCompany = (id: string) => {
        const company = agencies.find(c => c.id === id);
        if (!company || company.active === false) {
            performCompanyToggle(id);
            return;
        }

        const companySchemes = schemes.filter(s => s.companyId === id);
        const dependents = allMembers.filter(m => m.policies.some(p => companySchemes.some(cs => cs.id === p.schemeId)));
        
        if (dependents.length > 0) {
             setWarningModalContent({
                title: `Deactivate "${company.name}"?`,
                message: `This Agency is linked to policies of ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                dependents,
                onConfirm: () => performCompanyToggle(id)
            });
        } else {
            performCompanyToggle(id);
        }
    };

    const openSchemeModal = (scheme: SchemeMaster | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        const initialData = scheme ? {...scheme} : { name: '', companyId: selectedCompanyId || '', type: 'Health Insurance' as ConcretePolicyType, active: true, insuranceTypeId: '' };
        setEditingScheme(scheme);
        setSchemeFormData(initialData);

        if (scheme && scheme.insuranceTypeId) {
            const type = insuranceTypes.find(t => t.id === scheme.insuranceTypeId);
            if (type) {
                setModalParentType(type.parentId || type.id);
            }
        } else {
            setModalParentType(null);
        }
        setIsSchemeModalOpen(true);
    };
    
    const closeSchemeModal = () => {
        setIsSchemeModalOpen(false);
        triggerButtonRef.current?.focus();
    }


    const saveScheme = () => {
        if (!canModify) return;
        if (!schemeFormData.name?.trim() || !schemeFormData.companyId) return addToast('Scheme Name and Agency are required.', 'error');
        if (!schemeFormData.insuranceTypeId) return addToast('Insurance Type must be selected.', 'error');

        const { type, generalInsuranceType, ...restOfData } = schemeFormData;
        const schemeToSave = { ...restOfData, name: schemeFormData.name!.trim() };

        if (schemeToSave.id) { // Update
            onUpdateSchemes(schemes.map(s => s.id === schemeToSave.id ? schemeToSave as SchemeMaster : s));
        } else { // Create
            schemeToSave.id = `scheme-${Date.now()}`;
            schemeToSave.order = schemes.filter(s => s.companyId === schemeToSave.companyId).length;
            onUpdateSchemes([...schemes, schemeToSave as SchemeMaster]);
        }
        closeSchemeModal();
        setModalParentType(null);
    };
    const performSchemeToggle = (id: string) => onUpdateSchemes(schemes.map(s => s.id === id ? { ...s, active: s.active === false ? true : false } : s));
    const toggleScheme = (id: string) => {
        const scheme = schemes.find(s => s.id === id);
        if (!scheme || scheme.active === false) {
            performSchemeToggle(id);
            return;
        }
        const dependents = allMembers.filter(m => m.policies.some(p => p.schemeId === scheme.id));
        if (dependents.length > 0) {
            setWarningModalContent({
                title: `Deactivate "${scheme.name}"?`,
                message: `This scheme is currently used by ${dependents.length} client(s). Deactivating it may cause data inconsistencies.`,
                dependents,
                onConfirm: () => performSchemeToggle(id)
            });
        } else {
            performSchemeToggle(id);
        }
    };
    
    const handleDeleteScheme = (schemeId: string) => {
        const scheme = schemes.find(s => s.id === schemeId);
        if (!scheme) return;
    
        const dependents = allMembers.filter(m => m.policies.some(p => p.schemeId === scheme.id));
        
        if (dependents.length > 0) {
            setCannotDeleteModal({ isOpen: true, message: `You cannot delete "${scheme.name}" because it is being used by ${dependents.length} client(s).` });
        } else {
            if (window.confirm(`Are you sure you want to delete the scheme "${scheme.name}"? This action cannot be undone.`)) {
                onUpdateSchemes(schemes.filter(s => s.id !== schemeId));
                addToast(`Scheme "${scheme.name}" deleted successfully.`, 'success');
            }
        }
    };

    const handleSchemeReorder = (reorderedSchemesForCompany: SchemeMaster[]) => {
        const reorderedMap = new Map(reorderedSchemesForCompany.map(s => [s.id, s]));
        const updatedSchemes = schemes.map(scheme => {
            return reorderedMap.get(scheme.id) || scheme;
        });
        onUpdateSchemes(updatedSchemes);
    };

    const confirmWarningAction = () => {
        if (warningModalContent?.onConfirm) {
            warningModalContent.onConfirm();
        }
        setWarningModalContent(null);
    };

    const parentTypeOptions = useMemo(() => insuranceTypes.filter(it => !it.parentId && it.active), [insuranceTypes]);
    const childTypeOptions = useMemo(() => {
        if (!modalParentType) return [];
        return insuranceTypes.filter(it => it.parentId === modalParentType && it.active);
    }, [insuranceTypes, modalParentType]);


    return (<div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="lg:w-2/5 xl:w-1/3 flex flex-col h-full">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Agency</h3>
             {/* --- MODIFICATION START: Repositioned Add button and adjusted layout --- */}
            <div className="flex flex-col gap-4 my-4">
                <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        className="block w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Search Agency..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                    />
                </div>
                {canCreate && (
                    <Button onClick={(e) => openCompanyModal(null, e)} variant="primary" className="w-full">
                        <Plus size={16}/> Add New Agency
                    </Button>
                )}
            </div>
            {/* --- MODIFICATION END --- */}
            <div className="flex-1 overflow-y-auto border dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredCompanies.map((company, index) => (
                            <tr 
                                key={company.id}
                                onClick={() => setSelectedCompanyId(company.id)}
                                className={`cursor-pointer ${selectedCompanyId === company.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} ${!company.active ? 'opacity-60' : ''}`}
                            >
                                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{company.name}</td>
                                <td className="px-4 py-3">
                                    <ToggleSwitch enabled={!!company.active} onChange={() => toggleCompany(company.id)} disabled={!canModify}/>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openCompanyModal(company, e)} disabled={!canModify}>
                                            <Edit2 size={14}/>
                                        </Button>
                                        {canModify && (
                                            <Button size="small" variant="danger" className="!p-1.5" onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company.id); }}>
                                                <Trash2 size={14}/>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="lg:w-3/5 xl:w-2/3 flex flex-col h-full">
             {selectedCompanyId ? (
                <SchemeCompanyDataTable
                    title={`Schemes for ${agencies.find(c => c.id === selectedCompanyId)?.name || ''}`}
                    items={schemesForSelectedCompany}
                    onReorder={handleSchemeReorder}
                    onAddItem={(e) => openSchemeModal(null, e)}
                    onEditItem={openSchemeModal}
                    onToggleItem={toggleScheme}
                    onDeleteItem={handleDeleteScheme}
                    search={schemeSearch}
                    onSearch={setSchemeSearch}
                    noun="Scheme"
                    insuranceTypes={insuranceTypes}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-lg">
                    <div>
                        <Building size={48} className="mx-auto text-gray-300 dark:text-gray-500"/>
                        <p className="mt-4 font-semibold">Select an Agency</p>
                        <p className="text-sm">Select an Agency from the left to view and manage its schemes.</p>
                    </div>
                </div>
            )}
        </div>

        {warningModalContent && (
            <Modal
                isOpen={!!warningModalContent}
                onClose={() => setWarningModalContent(null)}
                contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            {warningModalContent.title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {warningModalContent.message}
                            </p>
                            {warningModalContent.dependents && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Used by: {warningModalContent.dependents.slice(0, 3).map(m => m.name).join(', ')}{warningModalContent.dependents.length > 3 ? ', and others.' : '.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    {warningModalContent.onConfirm && (
                        <Button variant="danger" onClick={confirmWarningAction}>
                            Confirm Deactivation
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setWarningModalContent(null)}>
                        Cancel
                    </Button>
                </div>
            </Modal>
        )}

        {cannotDeleteModal.isOpen && (
            <Modal isOpen={cannotDeleteModal.isOpen} onClose={() => setCannotDeleteModal({ isOpen: false, message: '' })}>
                <div className="p-6">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Cannot Delete Item</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{cannotDeleteModal.message}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <Button variant="secondary" onClick={() => setCannotDeleteModal({ isOpen: false, message: '' })}>
                        OK
                    </Button>
                </div>
            </Modal>
        )}

        {isCompanyModalOpen && (
            <Modal
                isOpen={isCompanyModalOpen}
                onClose={closeCompanyModal}
                contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); saveCompany(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingCompany?.id ? 'Edit' : 'Add'} Agency</h2>
                    <div className="space-y-4">
                        <Input
                            label="Agency Name"
                            value={editingCompany?.name || ''}
                            onChange={e => setEditingCompany(c => c ? {...c, name: e.target.value} : null)}
                            disabled={!canModify}
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={closeCompanyModal}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                    </div>
                </form>
            </Modal>
        )}

        {isSchemeModalOpen && (
            <Modal
                isOpen={isSchemeModalOpen}
                onClose={closeSchemeModal}
                contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); saveScheme(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingScheme ? 'Edit' : 'New'} Scheme</h2>
                    <fieldset disabled={!canModify}>
                        <div className="space-y-4">
                            <Input label="Scheme Name" value={schemeFormData.name || ''} onChange={e => setSchemeFormData(s => ({...s, name: e.target.value}))}/>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Type (Parent)</label>
                                <select 
                                    value={modalParentType || ''} 
                                    onChange={e => {
                                        const newParentId = e.target.value;
                                        setModalParentType(newParentId);
                                        setSchemeFormData(s => ({...s, insuranceTypeId: newParentId}));
                                    }} 
                                    className={themeAwareInputClasses}>
                                        <option value="">Select Type...</option>
                                        {parentTypeOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                                </select>
                            </div>
                            {childTypeOptions.length > 0 && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Sub-Type (Child)</label>
                                    <select 
                                        value={schemeFormData.insuranceTypeId || ''} 
                                        onChange={e => setSchemeFormData(s => ({...s, insuranceTypeId: e.target.value}))} 
                                        className={themeAwareInputClasses}>
                                            <option value={modalParentType || ''}>-- Select Sub-Type (or keep parent) --</option>
                                            {childTypeOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency</label><select value={schemeFormData.companyId} onChange={e => setSchemeFormData(s => ({...s, companyId: e.target.value}))} className={themeAwareInputClasses} disabled={!!selectedCompanyId}><option value="">Select Agency...</option>{agencies.filter(c => c.active !== false).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        </div>
                    </fieldset>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={closeSchemeModal}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={!canModify}>Save Scheme</Button>
                    </div>
                </form>
            </Modal>
        )}
    </div>);
};

// --- END: REPLACE THIS ENTIRE COMPONENT in MasterData.tsx ---

const CompanyMasterManager: React.FC<MasterDataProps & { canModify: boolean }> = ({ operatingCompanies, onUpdateOperatingCompanies, currentUser, geographies, canModify }) => {
    const [companyData, setCompanyData] = useState<Company | null>(null);

    // State for cascading dropdowns
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    useEffect(() => {
        const company = operatingCompanies.find(c => c.id === currentUser?.companyId) || null;
        setCompanyData(company);
        if (company?.address) {
            const country = geographies.find(g => g.name === (company.address?.country || 'India') && g.type === 'Country');
            setSelectedCountry(country?.id || null);
            if (country) {
                const state = geographies.find(g => g.name === company.address?.state && g.type === 'State' && g.parentId === country.id);
                setSelectedState(state?.id || null);
                if(state) {
                    const district = geographies.find(g => g.name === company.address?.district && g.type === 'District' && g.parentId === state.id);
                    setSelectedDistrict(district?.id || null);
                    if(district) {
                        const city = geographies.find(g => g.name === company.address?.city && g.type === 'City' && g.parentId === district.id);
                        setSelectedCity(city?.id || null);
                    } else {
                        setSelectedCity(null);
                    }
                } else {
                    setSelectedDistrict(null);
                    setSelectedCity(null);
                }
            } else { 
                setSelectedState(null);
                setSelectedDistrict(null);
                setSelectedCity(null);
            } 
        }
    }, [operatingCompanies, currentUser, geographies]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setCompanyData(prev => prev ? { ...prev, [name]: val } : null);
    };
    
    const handleAddressChange = (name: string, value: string | null) => {
        setCompanyData(prev => {
            if (!prev) return null;
            const newAddress = { ...prev.address, [name]: value };
            // Reset downstream fields if a parent changes
            if (name === 'country') {
                newAddress.state = '';
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            if (name === 'state') {
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            return { ...prev, address: newAddress };
        });
    };
    
    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCompanyData(prev => prev ? { ...prev, contact: { ...prev.contact, [name]: value } } : null);
    };

    const handleSave = () => {
        if (companyData) {
            onUpdateOperatingCompanies(companyData);
        }
    };
    
    // Options for dropdowns
    const countryOptions = useMemo(() => geographies.filter(g => g.type === 'Country' && g.active).map(g => ({ value: g.id, label: g.name })), [geographies]);
    const stateOptions = useMemo(() => !selectedCountry ? [] : geographies.filter(g => g.type === 'State' && g.parentId === selectedCountry && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, selectedCountry]);
    const districtOptions = useMemo(() => !selectedState ? [] : geographies.filter(g => g.type === 'District' && g.parentId === selectedState && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, selectedState]);
    const cityOptions = useMemo(() => !selectedDistrict ? [] : geographies.filter(g => g.type === 'City' && g.parentId === selectedDistrict && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, selectedDistrict]);

    if (!companyData) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Company Master</h3>
                <div className="p-8 text-center text-gray-500 border-2 border-dashed dark:border-gray-600 rounded-lg mt-4">
                    <p>No company data found for the current user.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Company Master</h3>
                {canModify && <Button onClick={handleSave} variant="primary"><Save size={16}/> Save Company Details</Button>}
            </div>
            <fieldset disabled={!canModify}>
                <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Company Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Company Code" name="companyCode" value={companyData.companyCode || ''} onChange={handleInputChange} disabled/>
                            <Input label="Company Name" name="name" value={companyData.name} onChange={handleInputChange} />
                            <Input label="Registered Name" name="mailingName" value={companyData.mailingName || ''} onChange={handleInputChange} />
                            <Input label="Date of Creation" name="dateOfCreation" type="date" value={companyData.dateOfCreation || ''} onChange={handleInputChange} />
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <ToggleSwitch enabled={companyData.active || false} onChange={() => setCompanyData(prev => prev ? ({...prev, active: !prev.active}) : null)} />
                                <span>{companyData.active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Address & Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Line 1" value={companyData.address?.line1 || ''} onChange={e => handleAddressChange('line1', e.target.value)} />
                            <Input label="Line 2" value={companyData.address?.line2 || ''} onChange={e => handleAddressChange('line2', e.target.value)} />
                            <Input label="Line 3" value={companyData.address?.line3 || ''} onChange={e => handleAddressChange('line3', e.target.value)} />
                            
                            <SearchableSelect label="Country" options={countryOptions} value={selectedCountry} onChange={val => { setSelectedCountry(val); setSelectedState(null); setSelectedDistrict(null); setSelectedCity(null); handleAddressChange('country', val ? geographies.find(g => g.id === val)?.name || 'India' : 'India'); }} />
                            <SearchableSelect label="State" options={stateOptions} value={selectedState} onChange={val => { setSelectedState(val); setSelectedDistrict(null); setSelectedCity(null); handleAddressChange('state', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!selectedCountry} />
                            <SearchableSelect label="District" options={districtOptions} value={selectedDistrict} onChange={val => { setSelectedDistrict(val); setSelectedCity(null); handleAddressChange('district', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!selectedState} />
                            <SearchableSelect label="City" options={cityOptions} value={selectedCity} onChange={val => { setSelectedCity(val); handleAddressChange('city', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!selectedDistrict} />

                            <Input label="Area" value={companyData.address?.area || ''} onChange={e => handleAddressChange('area', e.target.value)} />
                            <Input label="Pin Code" value={companyData.address?.pinCode || ''} onChange={e => handleAddressChange('pinCode', e.target.value)} />

                            <Input label="Phone No." name="phoneNo" value={companyData.contact?.phoneNo || ''} onChange={handleContactChange} />
                            <Input label="Email ID" name="emailId" type="email" value={companyData.contact?.emailId || ''} onChange={handleContactChange} />
                            
                            <Input label="FAX No." name="faxNo" value={companyData.contact?.faxNo || ''} onChange={handleContactChange} />
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Tax Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="GSTIN" name="gstin" value={companyData.gstin || ''} onChange={handleInputChange} />
                            <Input label="PAN" name="pan" value={companyData.pan || ''} onChange={handleInputChange} />
                            <Input label="TAN" name="tan" value={companyData.tan || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
};

// ... (code from the start of the file down to the middle of BranchesManager)

const BranchesManager: React.FC<MasterDataProps & { canCreate: boolean; canModify: boolean }> = ({ finrootsBranches, onUpdateFinrootsBranches, addToast, operatingCompanies, currentUser, geographies, canCreate, canModify }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Partial<FinRootsBranch> | null>(null);
    const [branchIdSuffix, setBranchIdSuffix] = useState('');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);


    type SortKey = 'branchId' | 'branchName' | 'active';
    type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'branchName', direction: 'asc' });

    // State for modal dropdowns
    const [modalSelectedCountry, setModalSelectedCountry] = useState<string | null>(null);
    const [modalSelectedState, setModalSelectedState] = useState<string | null>(null);
    const [modalSelectedDistrict, setModalSelectedDistrict] = useState<string | null>(null);
    const [modalSelectedCity, setModalSelectedCity] = useState<string | null>(null);
    
    const handleSort = useCallback((key: string) => {
        setSortConfig(prev => ({
            key: key as SortKey,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const companyBranches = useMemo(() => {
        return finrootsBranches.filter(b => b.companyId === currentUser?.companyId);
    }, [finrootsBranches, currentUser]);
    
    const companyCode = useMemo(() => operatingCompanies.find(c => c.id === currentUser?.companyId)?.companyCode || '', [operatingCompanies, currentUser]);

    const sortedAndFilteredBranches = useMemo(() => {
        let filtered = companyBranches.filter(branch => 
            branch.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.branchId.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'asc' ? 1 : -1;
            let aValue: any;
            let bValue: any;

            switch (key) {
                case 'branchId': aValue = a.branchId; bValue = b.branchId; break;
                case 'branchName': aValue = a.branchName.toLowerCase(); bValue = b.branchName.toLowerCase(); break;
                case 'active': aValue = a.active; bValue = b.active; break;
                default: return 0;
            }
            
            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') return (aValue === bValue) ? 0 : aValue ? -1 * dir : 1 * dir;
            if (aValue < bValue) return -1 * dir;
            if (aValue > bValue) return 1 * dir;
            return 0;
        });

        return filtered;
    }, [companyBranches, searchQuery, sortConfig]);

    const openModal = (branch: FinRootsBranch | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingBranch(branch ? { ...branch } : { id: '', branchId: '', branchName: '', dateOfCreation: '', active: true, companyId: currentUser!.companyId });
        setBranchIdSuffix(branch ? branch.branchId.replace(`${companyCode}-`, '') : '');
        
        if (branch?.address) {
            const country = geographies.find(g => g.name === (branch.address?.country || 'India') && g.type === 'Country');
            setModalSelectedCountry(country?.id || null);
            if (country) {
                const state = geographies.find(g => g.name === branch.address?.state && g.type === 'State' && g.parentId === country.id);
                setModalSelectedState(state?.id || null);
                if(state) {
                    const district = geographies.find(g => g.name === branch.address?.district && g.type === 'District' && g.parentId === state.id);
                    setModalSelectedDistrict(district?.id || null);
                     if(district) {
                        const city = geographies.find(g => g.name === branch.address?.city && g.type === 'City' && g.parentId === district.id);
                        setModalSelectedCity(city?.id || null);
                     } else {
                         setModalSelectedCity(null);
                     }
                } else {
                    setModalSelectedDistrict(null);
                    setModalSelectedCity(null);
                }
            } else {
                setModalSelectedState(null);
                setModalSelectedDistrict(null);
                setModalSelectedCity(null);
            }
        } else {
            setModalSelectedCountry(geographies.find(g => g.name === 'India')?.id || null); // Default to India on new
            setModalSelectedState(null);
            setModalSelectedDistrict(null);
            setModalSelectedCity(null);
        }

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingBranch(null);
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    };


    const handleSave = () => {
        if (!canModify) return;
        if (!editingBranch || !editingBranch.branchName?.trim()) return addToast(`Branch name cannot be empty.`, 'error');
        if (!branchIdSuffix.trim()) return addToast('Branch code suffix cannot be empty.', 'error');

        const finalBranchId = `${companyCode}-${branchIdSuffix}`;
        const isDuplicate = finrootsBranches.some(b => b.id !== editingBranch.id && b.branchId === finalBranchId);
        if (isDuplicate) return addToast(`Branch ID "${finalBranchId}" already exists.`, 'error');

        const branchToSave = { ...editingBranch, branchId: finalBranchId };

        if (editingBranch.id) { // Update
            onUpdateFinrootsBranches(finrootsBranches.map(b => b.id === editingBranch.id ? branchToSave as FinRootsBranch : b));
            addToast(`Branch updated successfully.`, 'success');
        } else { // Create
            const newId = `frb-${Date.now()}`;
            onUpdateFinrootsBranches([...finrootsBranches, { ...(branchToSave as FinRootsBranch), id: newId }]);
            addToast(`Branch added successfully.`, 'success');
        }
        closeModal();
    };
    
    const handleToggle = (id: string) => {
        onUpdateFinrootsBranches(finrootsBranches.map(b => b.id === id ? { ...b, active: !b.active } : b));
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setEditingBranch(prev => {
            if (!prev) return null;
            return { ...prev, [name]: type === 'checkbox' ? checked : value };
        });
    };

    const handleAddressChange = (name: string, value: string | null) => {
        setEditingBranch(prev => {
            if (!prev) return null;
            const newAddress = { ...prev.address, [name]: value };
            if (name === 'country') {
                newAddress.state = '';
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            if (name === 'state') {
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            return { ...prev, address: newAddress };
        });
    };

    const modalCountryOptions = useMemo(() => geographies.filter(g => g.type === 'Country' && g.active).map(g => ({ value: g.id, label: g.name })), [geographies]);
    const modalStateOptions = useMemo(() => !modalSelectedCountry ? [] : geographies.filter(g => g.type === 'State' && g.parentId === modalSelectedCountry && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, modalSelectedCountry]);
    const modalDistrictOptions = useMemo(() => !modalSelectedState ? [] : geographies.filter(g => g.type === 'District' && g.parentId === modalSelectedState && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, modalSelectedState]);
    const modalCityOptions = useMemo(() => !modalSelectedDistrict ? [] : geographies.filter(g => g.type === 'City' && g.parentId === modalSelectedDistrict && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, modalSelectedDistrict]);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Branch</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <form onSubmit={(e) => e.preventDefault()} className="relative flex-grow w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                    <Input
                        label=""
                        type="search"
                        placeholder={`Search Branches by Name or ID...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </form>
                {canCreate && (
                    <Button onClick={(e) => openModal(null, e)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                        <Plus size={16}/> Add New Branch
                    </Button>
                )}
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ID</th>
                            <SortableHeader sortKey="branchId" label="Branch ID" sortConfig={sortConfig} onSort={handleSort} className="hidden" />
                            <SortableHeader sortKey="branchName" label="Branch Name" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader sortKey="active" label="Status" sortConfig={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredBranches.map((branch, index) => (
                            <tr key={branch.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${!branch.active ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono hidden">{branch.branchId}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{branch.branchName}</td>
                                <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={branch.active || false} onChange={() => handleToggle(branch.id)} disabled={!canModify}/></td>
                                <td className="px-6 py-3 whitespace-nowrap"><Button size="small" variant="light" onClick={(e) => openModal(branch, e)} disabled={!canModify}><Edit2 size={14}/> Edit</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedAndFilteredBranches.length === 0 && <div className="p-8 text-center text-gray-500">No Branches found.</div>}
            </div>

            {isModalOpen && editingBranch && (
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200"
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingBranch?.id ? 'Edit' : 'Add'} Branch</h2>
                    <fieldset disabled={!canModify}>
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Branch Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch ID *</label>
                                        <div className="flex items-end gap-2">
                                            <Input label="" value={companyCode} disabled />
                                            <span className="pb-2 font-bold">-</span>
                                            <Input
                                                label=""
                                                value={branchIdSuffix}
                                                onChange={e => setBranchIdSuffix(e.target.value.toUpperCase())}
                                                placeholder="e.g., ERD"
                                            />
                                        </div>
                                    </div>
                                    <Input label="Branch Name" name="branchName" value={editingBranch.branchName} onChange={handleInputChange} />
                                    <Input label="Date of Creation" name="dateOfCreation" type="date" value={editingBranch.dateOfCreation || ''} onChange={handleInputChange} />
                                    <div className="flex items-center gap-4 pt-6">
                                        <label className="flex items-center gap-2"><input type="checkbox" name="active" checked={editingBranch.active} onChange={handleInputChange} /> Active</label>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Address Details</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input label="Line 1" value={editingBranch.address?.line1 || ''} onChange={e => handleAddressChange('line1', e.target.value)} />
                                    <Input label="Line 2" value={editingBranch.address?.line2 || ''} onChange={e => handleAddressChange('line2', e.target.value)} />
                                    <Input label="Line 3" value={editingBranch.address?.line3 || ''} onChange={e => handleAddressChange('line3', e.target.value)} />
                                    <SearchableSelect label="Country" options={modalCountryOptions} value={modalSelectedCountry} onChange={val => { setModalSelectedCountry(val); setModalSelectedState(null); setModalSelectedDistrict(null); setModalSelectedCity(null); handleAddressChange('country', val ? geographies.find(g => g.id === val)?.name || 'India' : 'India'); }} />
                                    <SearchableSelect label="State" options={modalStateOptions} value={modalSelectedState} onChange={val => { setModalSelectedState(val); setModalSelectedDistrict(null); setModalSelectedCity(null); handleAddressChange('state', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!modalSelectedCountry} />
                                    <SearchableSelect label="District" options={modalDistrictOptions} value={modalSelectedDistrict} onChange={val => { setModalSelectedDistrict(val); setModalSelectedCity(null); handleAddressChange('district', val ? geographies.find(g => g.id === val)?.name || null : null);}} disabled={!modalSelectedState} />
                                    <SearchableSelect label="City" options={modalCityOptions} value={modalSelectedCity} onChange={val => { setModalSelectedCity(val); handleAddressChange('city', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!modalSelectedDistrict} />
                                    <Input label="Area" value={editingBranch.address?.area || ''} onChange={e => handleAddressChange('area', e.target.value)} />
                                    <Input label="Pin Code" value={editingBranch.address?.pinCode || ''} onChange={e => handleAddressChange('pinCode', e.target.value)} />
                                    <Input label="Phone No." value={editingBranch.address?.phone || ''} onChange={e => handleAddressChange('phone', e.target.value)} />
                                    <Input label="FAX No." value={editingBranch.address?.fax || ''} onChange={e => handleAddressChange('fax', e.target.value)} />
                                </div>
                            </div>
                            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Tax Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="GSTIN" name="gstin" value={editingBranch.gstin || ''} onChange={handleInputChange} />
                                    <Input label="PAN" name="pan" value={editingBranch.pan || ''} onChange={handleInputChange} />
                                    <Input label="TAN" name="tan" value={editingBranch.tan || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    <div className="flex justify-end gap-4 mt-8">
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                    </div>
                </form>
            </Modal>
            )}
        </div>
    );
};

const GeographyManager: React.FC<{geographies: Geography[];onUpdateGeographies: (geos: Geography[]) => void;addToast: MasterDataProps['addToast'];allMembers: Member[]; canCreate: boolean; canModify: boolean;}> = ({ geographies, onUpdateGeographies, addToast, allMembers, canCreate, canModify }) => {   
    type GeoTab = 'Country' | 'State' | 'District' | 'City' | 'Area';
    
    const [editingGeo, setEditingGeo] = useState<Partial<Geography> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<Geography | null>(null);
    const [dependentMembers, setDependentMembers] = useState<Member[]>([]);

    // State for cascading dropdowns in the modal
    const [modalCountry, setModalCountry] = useState<string | null>(null);
    const [modalState, setModalState] = useState<string | null>(null);
    const [modalDistrict, setModalDistrict] = useState<string | null>(null);
    const [modalCity, setModalCity] = useState<string | null>(null);
    
    const geoMap = useMemo(() => new Map(geographies.map(g => [g.id, g])), [geographies]);

    // --- MODIFICATION START: Centralized and memoized filtering logic ---
    const filteredGeographiesByType = useMemo(() => {
        const categorized: Record<GeoTab, Geography[]> = {
            Country: [],
            State: [],
            District: [],
            City: [],
            Area: [],
        };

        const lowerCaseQuery = searchQuery.toLowerCase();

        for (const geo of geographies) {
            // Check if the item matches the search query (if a query exists)
            const matchesSearch = !searchQuery ||
                geo.name.toLowerCase().includes(lowerCaseQuery) ||
                geo.id.toLowerCase().includes(lowerCaseQuery);

            if (matchesSearch && categorized[geo.type as GeoTab]) {
                categorized[geo.type as GeoTab].push(geo);
            }
        }

        // Sort each category
        for (const key in categorized) {
            categorized[key as GeoTab].sort((a, b) => a.name.localeCompare(b.name));
        }

        return categorized;
    }, [geographies, searchQuery]);
    // --- MODIFICATION END ---

    const getParent = (item: Geography | Partial<Geography>): Geography | undefined => {
        if (!item.parentId) return undefined;
        return geoMap.get(item.parentId);
    };
    
    const openModal = (type: GeoTab, item: Geography | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        if (item) {
            setEditingGeo({ ...item });
            let parent = getParent(item);
            if (type === 'State') setModalCountry(parent?.id || null);
            if (type === 'District') {
                const state = parent;
                const country = state ? getParent(state) : null;
                setModalCountry(country?.id || null);
                setModalState(state?.id || null);
            }
            if (type === 'City') {
                 const district = parent;
                 const state = district ? getParent(district) : null;
                 const country = state ? getParent(state) : null;
                 setModalCountry(country?.id || null);
                 setModalState(state?.id || null);
                 setModalDistrict(district?.id || null);
            }
            if (type === 'Area') {
                 const city = parent;
                 const district = city ? getParent(city) : null;
                 const state = district ? getParent(district) : null;
                 const country = state ? getParent(state) : null;
                 setModalCountry(country?.id || null);
                 setModalState(state?.id || null);
                 setModalDistrict(district?.id || null);
                 setModalCity(city?.id || null);
            }

        } else {
            setEditingGeo({ name: '', type, parentId: null, active: true });
            setModalCountry(null);
            setModalState(null);
            setModalDistrict(null);
            setModalCity(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    };

    const handleSave = () => {
        if (!canModify) return;
        if (!editingGeo || !editingGeo.name?.trim()) {
            addToast('Name is required', 'error');
            return;
        }

        // --- START: DUPLICATE CHECK LOGIC ---

        let parentId: string | null = null;
        switch(editingGeo.type) {
            case 'State': parentId = modalCountry; break;
            case 'District': parentId = modalState; break;
            case 'City': parentId = modalDistrict; break;
            case 'Area': parentId = modalCity; break;
        }

        const normalizedName = editingGeo.name.trim().toLowerCase();

        const isDuplicate = geographies.some(geo => {

            return (
                geo.id !== editingGeo.id &&
                geo.parentId === parentId &&
                geo.name.trim().toLowerCase() === normalizedName
            );
        });

        
        if (isDuplicate) {
            addToast(`A ${editingGeo.type} with this name already exists under the selected Type.`, 'error');
            return; 
        }

        const finalGeo = { ...editingGeo, parentId };

        if (finalGeo.id) {
            onUpdateGeographies(geographies.map(g => g.id === finalGeo.id ? finalGeo as Geography : g));
            addToast(`${finalGeo.type} updated.`, 'success');
        } else {
            onUpdateGeographies([...geographies, { ...finalGeo, id: `geo-${Date.now()}` } as Geography]);
            addToast(`${finalGeo.type} added.`, 'success');
        }
        closeModal();
    };

    const performToggle = (id: string) => {
        onUpdateGeographies(geographies.map(i => i.id === id ? {...i, active: i.active === false ? true : false } : i));
    };

    const handleToggle = (item: Geography) => {
        if (item.active === false) { // No check needed for re-activation
            performToggle(item.id);
            return;
        }

        const dependents = allMembers.filter(m => 
            m.state === item.name || m.district === item.name || m.city === item.name || m.area === item.name
        );
        
        if (dependents.length > 0) {
            setItemToToggle(item);
            setDependentMembers(dependents);
            setIsWarningModalOpen(true);
        } else {
            performToggle(item.id);
        }
    };

    const confirmDeactivation = () => {
        if (itemToToggle) {
            performToggle(itemToToggle.id);
        }
        setIsWarningModalOpen(false);
        setItemToToggle(null);
        setDependentMembers([]);
    };

    const getGeoCode = (item: Geography) => {
        const prefix = (item.type || '').substring(0, 4).toUpperCase();
        const idPart = (item.id || '').split('-').pop();
        return `${prefix}-${idPart}`;
    }

    // --- MODIFICATION START: Simplified GeoTable component ---
    const GeoTable: React.FC<{ type: GeoTab; items: Geography[] }> = ({ type, items }) => {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Manage {type}</h4>
                    {canCreate && <Button onClick={(e) => openModal(type, null, e)}><Plus size={16}/> Add {type}</Button>}
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase hidden">Code</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                             {items.map((item, index) => (
                                <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 text-sm font-mono text-gray-500 hidden">{getGeoCode(item)}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggle(item)} disabled={!canModify}/></td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button size="small" variant="light" onClick={(e) => openModal(type, item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {items.length === 0 && <div className="p-8 text-center text-gray-500">No {type}s found.</div>}
                </div>
            </div>
        )
    };
    // --- MODIFICATION END ---
    
    const countryOptions = useMemo(() => geographies.filter(g => g.type === 'Country' && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies]);
    const stateOptions = useMemo(() => !modalCountry ? [] : geographies.filter(g => g.type === 'State' && g.parentId === modalCountry && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies, modalCountry]);
    const districtOptions = useMemo(() => !modalState ? [] : geographies.filter(g => g.type === 'District' && g.parentId === modalState && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies, modalState]);
    const cityOptions = useMemo(() => !modalDistrict ? [] : geographies.filter(g => g.type === 'City' && g.parentId === modalDistrict && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies, modalDistrict]);
    
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Geography Management</h3>
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <div className="relative flex-grow w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                    <Input label="" type="search" placeholder="Search by name in all tables..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10"/>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* --- MODIFICATION START: Pass pre-filtered items to each table --- */}
                <GeoTable type="Country" items={filteredGeographiesByType.Country} />
                <GeoTable type="State" items={filteredGeographiesByType.State} />
                <GeoTable type="District" items={filteredGeographiesByType.District} />
                <GeoTable type="City" items={filteredGeographiesByType.City} />
                <GeoTable type="Area" items={filteredGeographiesByType.Area} />
                {/* --- MODIFICATION END --- */}
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                     <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6 border-b dark:border-gray-700">
                             <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingGeo?.id ? 'Edit' : 'Add'} {editingGeo?.type}</h2>
                        </div>
                        <fieldset disabled={!canModify}>
                            <div className="space-y-4 p-6 max-h-[60vh] overflow-y-auto">
                                {editingGeo?.type === 'State' && <div><label className="block text-sm font-medium mb-1">Country</label><SearchableSelect options={countryOptions} value={modalCountry} onChange={setModalCountry} placeholder="Select Country..."/></div>}
                                {editingGeo?.type === 'District' && <><div className="mb-4"><label className="block text-sm font-medium mb-1">Country</label><SearchableSelect options={countryOptions} value={modalCountry} onChange={val => { setModalCountry(val); setModalState(null); }} placeholder="Select Country..."/></div><div><label className="block text-sm font-medium mb-1">State</label><SearchableSelect options={stateOptions} value={modalState} onChange={setModalState} placeholder="Select State..." disabled={!modalCountry}/></div></>}
                                {editingGeo?.type === 'City' && <><div className="mb-4"><label className="block text-sm font-medium mb-1">Country</label><SearchableSelect options={countryOptions} value={modalCountry} onChange={val => { setModalCountry(val); setModalState(null); setModalDistrict(null); }} placeholder="Select Country..."/></div><div className="mb-4"><label className="block text-sm font-medium mb-1">State</label><SearchableSelect options={stateOptions} value={modalState} onChange={val => { setModalState(val); setModalDistrict(null);}} placeholder="Select State..." disabled={!modalCountry}/></div><div><label className="block text-sm font-medium mb-1">District</label><SearchableSelect options={districtOptions} value={modalDistrict} onChange={setModalDistrict} placeholder="Select District..." disabled={!modalState}/></div></>}
                                {editingGeo?.type === 'Area' && <><div className="mb-4"><label className="block text-s font-medium mb-1">Country</label><SearchableSelect options={countryOptions} value={modalCountry} onChange={val => { setModalCountry(val); setModalState(null); setModalDistrict(null); setModalCity(null); }} placeholder="Select Country..."/></div><div className="mb-4"><label className="block text-sm font-medium mb-1">State</label><SearchableSelect options={stateOptions} value={modalState} onChange={val => { setModalState(val); setModalDistrict(null); setModalCity(null); }} placeholder="Select State..." disabled={!modalCountry}/></div><div className="mb-4"><label className="block text-sm font-medium mb-1">District</label><SearchableSelect options={districtOptions} value={modalDistrict} onChange={val => {setModalDistrict(val); setModalCity(null);}} placeholder="Select District..." disabled={!modalState}/></div><div><label className="block text-sm font-medium mb-1">City</label><SearchableSelect options={cityOptions} value={modalCity} onChange={setModalCity} placeholder="Select City..." disabled={!modalDistrict}/></div></>}

                                <Input label="Name" value={editingGeo?.name || ''} onChange={e => setEditingGeo(g => g ? {...g, name: e.target.value} : null)}/>
                            </div>
                        </fieldset>
                         <div className="flex justify-end gap-4 p-6 border-t dark:border-gray-700">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {isWarningModalOpen && (
                <Modal
                    isOpen={isWarningModalOpen}
                    onClose={() => setIsWarningModalOpen(false)}
                    contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
                >
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                Deactivate "{itemToToggle?.name}"?
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This {itemToToggle?.type} is currently used by <strong>{dependentMembers.length} client(s)</strong>. Deactivating it may cause data inconsistencies.
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Used by: {dependentMembers.slice(0, 3).map(m => m.name).join(', ')}{dependentMembers.length > 3 ? ', and others.' : '.'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        <Button variant="danger" onClick={confirmDeactivation}>
                            Confirm Deactivation
                        </Button>
                        <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// --- MasterData.tsx -> Main MasterData Component ---

export const MasterData: React.FC<MasterDataProps> = (props) => {
    // --- MODIFIED: Destructure new and renamed props ---
    const { 
        addToast, allMembers,allLeads, users, businessVerticals, onUpdateBusinessVerticals,
        leadSources, onUpdateLeadSources, schemes, onUpdateSchemes, agencies, onUpdateAgencies,
        finrootsBranches, onUpdateFinrootsBranches, finrootsCompanyInfo, onUpdateFinRootsCompanyInfo,
        geographies, onUpdateGeographies, relationshipTypes, onUpdateRelationshipTypes,
        documentMasters, onUpdateDocumentMasters, insuranceTypeDocumentRules, onUpdateInsuranceTypeDocumentRules,
        giftMasters, onUpdateGiftMasters, customerTiers, onUpdateCustomerTiers,
        taskStatuses, onUpdateTaskStatuses, customerCategories, onUpdateCustomerCategories,
        bankMasters, onUpdateBankMasters, customerSubCategories, onUpdateCustomerSubCategories,
        customerGroups, onUpdateCustomerGroups, taskMasters, onUpdateTaskMasters,
        insuranceTypes, onUpdateInsuranceTypes,
        insuranceFields, onUpdateInsuranceFields, customerFieldMasters, onUpdateCustomerFieldMasters,
        currentUser, operatingCompanies, onUpdateOperatingCompanies, routes, onUpdateRoutes,
        designations, onUpdateDesignations,
        roles, onUpdateRoles, // --- NEW ---
        rolePermissions, onUpdateRolePermissions, // --- RENAMED ---
        customerTierCalculationMethod, onUpdateCustomerTierCalculationMethod,
        expenseCategoriesLevel1, onUpdateExpenseCategoriesLevel1, expenseCategoriesLevel2, onUpdateExpenseCategoriesLevel2,
        expenseCategoriesLevel3, onUpdateExpenseCategoriesLevel3, incomeCategoriesLevel1, onUpdateIncomeCategoriesLevel1,
        incomeCategoriesLevel2, onUpdateIncomeCategoriesLevel2, religions, onUpdateReligions,
        festivals, onUpdateFestivals, festivalDates, onUpdateFestivalDates, amcs, onUpdateAmcs,
        mutualFundSchemes, onUpdateMutualFundSchemes, mutualFundFields, onUpdateMutualFundFields,
        genders, onUpdateGenders, maritalStatuses, onUpdateMaritalStatuses, customerTypes, onUpdateCustomerTypes,
        processStageMasters, onUpdateProcessStageMasters, accountTypes, onUpdateAccountTypes,
        financialYears, onUpdateFinancialYears, documentNumbering, onUpdateDocumentNumbering,
        activeFinancialYearId
    } = props;

    const [activeTab, setActiveTab] = useState<string>('companyMaster');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const mobileNavRef = useRef<HTMLDivElement>(null);
    const [focusArea, setFocusArea] = useState<'nav' | 'content'>('nav');
    const navContainerRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    // --- FIX: Centralized permission checking ---
    const permissionLevel = useMemo(() => {
        if (!currentUser || !rolePermissions) return 'none';
        const userPermissions = rolePermissions.find(p => p.roleId === currentUser.roleId);
        return userPermissions?.permissions.masterMember || 'none';
    }, [currentUser, rolePermissions]);

    const canCreate = permissionLevel === 'create' || permissionLevel === 'modify';
    const canModify = permissionLevel === 'modify';
    // --- End of fix ---

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
                setIsMobileNavOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMobileNavOpen(false);
            }
        };
        if (isMobileNavOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMobileNavOpen]);

    useEffect(() => {
        if (focusArea === 'content') {
            const container = contentContainerRef.current;
            if (container) {
                const focusable = container.querySelector<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                focusable?.focus();
            }
        } else {
            navContainerRef.current?.querySelector<HTMLElement>('button')?.focus();
        }
    }, [focusArea, activeTab]);

    useEffect(() => {
        const contentNode = contentContainerRef.current;
        if (!contentNode) return;

        const handleContentKeyDown = (event: KeyboardEvent) => {
            const isModalOpen = !!document.querySelector('div[class*="fixed inset-0 bg-black"]');
            if (event.key === 'Escape' && !isModalOpen) {
                setFocusArea('nav');
                event.stopPropagation();
            }
        };

        contentNode.addEventListener('keydown', handleContentKeyDown, true);

        return () => {
            contentNode.removeEventListener('keydown', handleContentKeyDown, true);
        };
    }, [focusArea]);

    // --- MODIFIED: Navigation items updated ---
    const navItems = [
        { id: 'companyMaster', label: 'Company Master', icon: <Building size={18}/> },
        { id: 'branches', label: 'Branch', icon: <GitBranch size={18}/> },
        { id: 'businessVerticals', label: 'Business Vertical', icon: <Layers size={18}/> },
        { id: 'policyConfiguration', label: 'Policy Configuration', icon: <SlidersHorizontal size={18}/>},
        { id: 'schemesAndMappings', label: 'Agency and Scheme', icon: <Handshake  size={18}/> },
        { id: 'mutualFunds', label: 'Mutual Funds', icon: <HandCoins size={18}/> },
        { id: 'designation', label: 'Designation', icon: <UserCog size={18}/> }, 
        { id: 'role', label: 'Role', icon: <Award size={18}/> },
        { id: 'rolePermissions', label: 'Role Permissions', icon: <Lock size={18}/> }, 
        { id: 'customerMaster', label: 'Add Customer Field', icon: <UserPlus  size={18} /> },
        { id: 'financialYear', label: 'Financial Year', icon: <CalendarIcon size={18}/> },
        { id: 'religionsAndFestivals', label: 'Religions & Festivals', icon: <Sparkles  size={18}/> },
        { id: 'leadSources', label: 'Lead/Referral', icon: <Users size={18}/> },
        { id: 'leadStageMaster', label: 'Lead Stage Master', icon: <Workflow size={18}/> },
        { id: 'relationshipTypes', label: 'Relationship', icon: <HeartHandshake  size={18}/> },
        { id: 'geography', label: 'Geography', icon: <Globe2  size={18}/> },
        { id: 'documentMasters', label: 'Document Master', icon: <FileTextIcon size={18}/> },
        { id: 'bankMasters', label: 'Bank Master', icon: <Landmark  size={18} /> },
        { id: 'taskStatuses', label: 'Task Status', icon: <CheckSquare size={18}/> },
        { id: 'customerSegments', label: 'Customer Segment', icon: <Users size={18}/> },
        { id: 'genders', label: 'Gender', icon: <Venus  size={18}/> },
        { id: 'maritalStatuses', label: 'Marital Status', icon: <Heart size={18}/> },
        { id: 'taskMasters', label: 'Task Type', icon: <CheckSquare size={18}/> },
        { id: 'tierManagement', label: 'Type & Gift Management', icon: <Award size={18}/> },
        { id: 'expenseCategories', label: 'Expense Categories', icon: <ArrowUp  size={18}/> },
        { id: 'incomeCategories', label: 'Income Categories', icon: <ArrowDown size={18}/> },
        { id: 'routes', label: 'Routes', icon: <RouteIcon size={18}/> },
    ];
    
    const activeLabel = useMemo(() => 
        navItems.find(item => item.id === activeTab)?.label || 'Select a category',
    [activeTab, navItems]);
    
    // --- MODIFIED: renderContent function updated to pass permission props ---
    const renderContent = () => {
        const permissionProps = { canCreate, canModify };
        switch(activeTab) {
            case 'companyMaster': return <CompanyMasterManager {...props} {...permissionProps} />;
            case 'financialYear': return <FinancialYearManager {...props} {...permissionProps} />;
            case 'branches': return <BranchesManager {...props} {...permissionProps} />;
            case 'designation': return <DesignationManager items={designations} onUpdate={onUpdateDesignations} addToast={addToast} users={users} {...permissionProps} />;
            case 'role': return <RoleManager items={roles} onUpdate={onUpdateRoles} addToast={addToast} users={users} {...permissionProps} />;
            case 'rolePermissions': return <RolePermissionsManager roles={roles} rolePermissions={rolePermissions} onUpdate={onUpdateRolePermissions} addToast={addToast} {...permissionProps} />;
            case 'policyConfiguration': return <PolicyConfigurationManager {...props} {...permissionProps} />;
            case 'businessVerticals': return <GenericMasterManager 
    key="businessVerticals" 
    title="Manage Business Vertical" 
    items={businessVerticals} 
    onUpdate={onUpdateBusinessVerticals} 
    addToast={addToast} 
    noun="Business Vertical" 
    reorderable={true} 
    codeColumnDisplay="hidden" 
    dependencyCheck={(id) => {
        const dependents = [];
        const vertical = props.businessVerticals.find(bv => bv.id === id);

        if (!vertical) return [];

        // If the vertical is "Insurance", check for linked insurance types
        if (vertical.name.toLowerCase().includes('insurance')) {
            const linkedInsuranceTypes = props.insuranceTypes
                .filter(it => it.verticalId === id)
                .map(it => ({ name: `Insurance Type: ${it.name}`, type: 'field' as const }));
            dependents.push(...linkedInsuranceTypes);
        }

        // --- FIX: If the vertical is "Mutual Funds", check for any members with MF holdings ---
        if (vertical.name.toLowerCase().includes('mutual funds')) {
            const membersWithMF = props.allMembers.filter(m => m.mutualFundHoldings && m.mutualFundHoldings.length > 0);
            if (membersWithMF.length > 0) {
                // --- FIX: Map over ALL found members and add them to the dependents array. ---
                const mfDependents = membersWithMF.map(m => ({ name: `Customer: ${m.name}`, type: 'member' as const }));
                dependents.push(...mfDependents);
            }
        }
        
        return dependents;
    }} 
    showAddButton={false} 
    {...permissionProps} 
/>;
            case 'leadSources': return <LeadSourceManager items={props.leadSources} onUpdate={props.onUpdateLeadSources} addToast={props.addToast} {...permissionProps} />;
            case 'schemesAndMappings': return <SchemesAndMappingsManager {...props} {...permissionProps} />;
            case 'leadStageMaster': return <GenericMasterManager
                key="leadStageMaster"
                title="Manage Lead Pipeline Stages"
                items={props.leadStageMasters}
                onUpdate={props.onUpdateLeadStageMasters}
                addToast={props.addToast}
                noun="Lead Stage"
                reorderable={true}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => {
                    const stage = props.leadStageMasters.find(s => s.id === id);
                    if (!stage) return [];
                    return props.allLeads
                        .filter(lead => lead.status === stage.name)
                        .map(lead => ({ name: `Lead: ${lead.name}`, type: 'task' })); // Using 'task' type for icon consistency
                }}
                {...permissionProps}
            />;
            case 'mutualFunds':
                const mfCategories: { value: string; label: string }[] = ['Equity', 'Debt', 'Hybrid', 'Solution Oriented', 'Other'].map(c => ({ value: c, label: c }));
                return (
                    <div className="space-y-8">
                        <GenericMasterManager 
                            key="amcs" 
                            title="Manage Asset Management Companies (AMCs)" 
                            items={props.amcs} 
                            onUpdate={props.onUpdateAmcs} 
                            addToast={props.addToast} 
                            noun="AMC" 
                            reorderable={true}
                            codeColumnDisplay="hidden"
                            dependencyCheck={(id) => props.mutualFundSchemes.filter(s => s.amcId === id).map(s => ({ name: s.name, type: 'policy' }))}
                            extraFields={[
                                {
                                    label: 'Business Vertical',
                                    field: 'verticalId',
                                    type: 'select',
                                    options: props.businessVerticals.filter(v => v.active).map(v => ({ value: v.id, label: v.name }))
                                }
                            ]}
                            onBeforeSave={(item) => {
                                if (!item.verticalId) {
                                    props.addToast('Business Vertical is required for an AMC.', 'error');
                                    return false;
                                }
                                return true;
                            }}
                            {...permissionProps}
                        />
                        <GenericMasterManager
                            key="mfSchemes"
                            title="Manage Mutual Fund Schemes"
                            items={props.mutualFundSchemes}
                            onUpdate={props.onUpdateMutualFundSchemes}
                            addToast={props.addToast}
                            noun="Mutual Fund Scheme"
                            reorderable={true}
                            codeColumnDisplay="hidden"
                            extraFields={[
                                {
                                    label: 'AMC',
                                    field: 'amcId',
                                    type: 'select',
                                    options: props.amcs.filter(a => a.active).map(a => ({ value: a.id, label: a.name }))
                                },
                                {
                                    label: 'Category',
                                    field: 'category',
                                    type: 'select',
                                    options: mfCategories
                                }
                            ]}
                            dependencyCheck={(id) => props.allMembers.flatMap(m => m.mutualFundHoldings || []).filter(h => h.schemeId === id).map(h => ({ name: `Folio ${h.folioNumber}`, type: 'member' }))}
                            {...permissionProps}
                        />
                         <GenericMasterManager
                            key="mutualFundFields"
                            title="Manage Custom Mutual Fund Fields"
                            items={props.mutualFundFields}
                            onUpdate={props.onUpdateMutualFundFields}
                            addToast={props.addToast}
                            noun="Field"
                            reorderable={true}
                            codeColumnDisplay="group"
                            {...permissionProps}
                        />
                        <ProcessStageManager
                            key="psm-mf"
                            title="Manage Mutual Fund Process Flow"
                            items={props.processStageMasters.filter(psm => psm.isMutualFund)}
                            onUpdate={(updatedStages) => {
                                const otherStages = props.processStageMasters.filter(psm => !psm.isMutualFund);
                                const newStagesForMF = updatedStages.map(s => ({ ...s, isMutualFund: true, insuranceTypeId: null }));
                                props.onUpdateProcessStageMasters([...otherStages, ...newStagesForMF]);
                            }}
                            addToast={props.addToast}
                            allMembers={props.allMembers}
                            typeId="mutual-fund"
                            {...permissionProps}
                        />
                    </div>
                );
            case 'geography': return <GeographyManager geographies={props.geographies} onUpdateGeographies={props.onUpdateGeographies} addToast={props.addToast} allMembers={props.allMembers} {...permissionProps} />;
            case 'documentMasters': return <GenericMasterManager key="documentMasters" title="Manage Document Master" items={props.documentMasters} onUpdate={props.onUpdateDocumentMasters} addToast={props.addToast} noun="Document" reorderable={true} codeColumnDisplay="hidden" {...permissionProps} />;
            case 'tierManagement': return <TierManager
                tiers={props.customerTiers}
                onUpdateTiers={props.onUpdateCustomerTiers}
                gifts={props.giftMasters}
                onUpdateGifts={props.onUpdateGiftMasters}
                addToast={props.addToast}
                calculationMethod={props.customerTierCalculationMethod}
                onUpdateCalculationMethod={props.onUpdateCustomerTierCalculationMethod}
                customerTypes={props.customerTypes}
                {...permissionProps}
                />;
            case 'taskStatuses': return <GenericMasterManager 
                key="taskStatuses" 
                title="Manage Task Status" 
                items={props.taskStatuses} 
                onUpdate={props.onUpdateTaskStatuses} 
                addToast={props.addToast} 
                noun="Task Status" 
                reorderable={true} 
                codeColumnDisplay="hidden" 
                dependencyCheck={(id) => props.allMembers.flatMap(m => m.policies.flatMap(p => (p as any).tasks || [])).filter((t: any) => t.statusId === id).map((t: any) => ({ name: t.taskDescription, type: 'task' }))}
                initialStateKey="isInitialState"
                endStateKey="isEndState"
                onUpdateInitialState={(itemId) => {
                    const updatedStatuses = props.taskStatuses.map(status => ({
                        ...status,
                        isInitialState: status.id === itemId
                    }));
                    props.onUpdateTaskStatuses(updatedStatuses);
                }}
                {...permissionProps}
            />;
            case 'routes':
                return <GenericMasterManager 
                    key="routes" 
                    title="Manage Route" 
                    items={props.routes} 
                    onUpdate={props.onUpdateRoutes} 
                    addToast={props.addToast} 
                    noun="Route" 
                    reorderable={true} 
                    codeColumnDisplay="hidden"
                    {...permissionProps}
                />;
            case 'religionsAndFestivals': return <ReligionsAndFestivalsManager {...props} {...permissionProps} />;
            case 'expenseCategories': return <ExpenseCategoryManager 
                level1Data={props.expenseCategoriesLevel1} 
                level2Data={props.expenseCategoriesLevel2} 
                level3Data={props.expenseCategoriesLevel3} 
                onUpdateLevel1={props.onUpdateExpenseCategoriesLevel1}
                onUpdateLevel2={props.onUpdateExpenseCategoriesLevel2}
                onUpdateLevel3={props.onUpdateExpenseCategoriesLevel3}
                addToast={props.addToast}
                {...permissionProps}
                />;
            case 'incomeCategories': return <IncomeCategoryManager 
                level1Data={props.incomeCategoriesLevel1} 
                level2Data={props.incomeCategoriesLevel2} 
                onUpdateLevel1={props.onUpdateIncomeCategoriesLevel1}
                onUpdateLevel2={props.onUpdateIncomeCategoriesLevel2}
                addToast={props.addToast}
                {...permissionProps}
                />;
            case 'relationshipTypes': return <GenericMasterManager 
                key="relationshipTypes" 
                title="Manage Relationship Types" 
                items={props.relationshipTypes} 
                onUpdate={props.onUpdateRelationshipTypes}
                addToast={props.addToast}
                noun="Relationship Type" 
                reorderable={true}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => props.allMembers.filter(m => m.dynamicData?.relationship === props.relationshipTypes.find(rt => rt.id === id)?.name).map(m => ({ name: m.name, type: 'member' }))} 
                {...permissionProps}
                />;

            
            case 'customerSegments': return (
                <div className="space-y-8">
                    <GenericMasterManager 
                        title="Manage Customer Category" 
                        items={props.customerCategories} 
                        onUpdate={props.onUpdateCustomerCategories} 
                        addToast={props.addToast} 
                        noun="Customer Category"
                        dependencyCheck={(id) => props.allMembers.filter(m => m.customerCategoryId === id).map(m => ({ name: m.name, type: 'member' }))}
                        reorderable={true}
                        codeColumnDisplay="hidden"
                        {...permissionProps}
                    />
                    <GenericMasterManager 
                        title="Manage Customer Sub-Category" 
                        items={props.customerSubCategories} 
                        onUpdate={props.onUpdateCustomerSubCategories} 
                        addToast={props.addToast} 
                        noun="Customer Sub-Category"
                        dependencyCheck={(id) => props.allMembers.filter(m => m.customerSubCategoryId === id).map(m => ({ name: m.name, type: 'member' }))}
                        extraFields={[{
                            label: 'Customer Category',
                            field: 'parentId',
                            type: 'select',
                            options: props.customerCategories.map(c => ({ value: c.id, label: c.name }))
                        }]}
                        reorderable={true}
                        codeColumnDisplay="hidden"
                        {...permissionProps}
                    />
                    <GenericMasterManager 
                        title="Manage Customer Group" 
                        items={props.customerGroups} 
                        onUpdate={props.onUpdateCustomerGroups} 
                        addToast={props.addToast} 
                        noun="Customer Group"
                        dependencyCheck={(id) => props.allMembers.filter(m => m.customerGroupId === id).map(m => ({ name: m.name, type: 'member' }))}
                        reorderable={true}
                        codeColumnDisplay="hidden"
                        {...permissionProps}
                    />
                    <GenericMasterManager 
                        title="Manage Customer Type"
                        items={props.customerTypes}
                        onUpdate={props.onUpdateCustomerTypes}
                        addToast={props.addToast}
                        noun="Customer Type"
                        reorderable={true}
                        codeColumnDisplay="hidden"
                        dependencyCheck={(id) => props.customerTiers.filter(t => t.customerTypeId === id).map(t => ({ name: t.name || 'Unnamed Tier', type: 'policy' }))}
                        {...permissionProps}
                    />
                </div>
            );
            case 'genders': return <GenericMasterManager 
                key="genders" 
                title="Manage Genders" 
                items={props.genders} 
                onUpdate={props.onUpdateGenders} 
                addToast={props.addToast} 
                noun="Gender" 
                reorderable={true} 
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => props.allMembers.filter(m => m.gender === id).map(m => ({ name: m.name, type: 'member' }))}
                {...permissionProps}
            />;
            case 'maritalStatuses': return <GenericMasterManager 
                key="maritalStatuses" 
                title="Manage Marital Statuses" 
                items={props.maritalStatuses} 
                onUpdate={props.onUpdateMaritalStatuses} 
                addToast={props.addToast} 
                noun="Marital Status" 
                reorderable={true} 
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => props.allMembers.filter(m => m.maritalStatus === id).map(m => ({ name: m.name, type: 'member' }))}
                {...permissionProps}
            />;
            case 'customerMaster': return (
                <GenericMasterManager
                    key="customerMaster"
                    title="Manage Custom Customer Field"
                    items={props.customerFieldMasters}
                    onUpdate={props.onUpdateCustomerFieldMasters}
                    addToast={props.addToast}
                    noun="Field"
                    reorderable={true}
                    codeColumnDisplay="group"
                    {...permissionProps}
                />
            );
            case 'taskMasters': return (
                <div className="space-y-8">
                    <GenericMasterManager 
                        title="Manage Task Type" 
                        items={props.taskMasters} 
                        onUpdate={props.onUpdateTaskMasters} 
                        addToast={props.addToast} 
                        noun="Task Type"
                        reorderable={true}
                        codeColumnDisplay="hidden"
                        showAddButton={false}
                        dependencyCheck={(id) => props.allMembers.flatMap(m => (m as any).tasks || []).filter((t: any) => t.taskMasterId === id).map((t: any) => ({ name: t.taskDescription, type: 'task' }))}
                        {...permissionProps}
                    />
                </div>
            );
            case 'bankMasters': 
                return (
                    <div className="space-y-8">
                        <GenericMasterManager
                            key="bankMasters"
                            reorderable={true}
                            title="Manage Bank Master"
                            items={props.bankMasters.map(b => ({ id: b.id, name: b.bankName, active: b.active, order: b.order }))}
                            onUpdate={(updatedItems) => {
                                const originalBanksMap = new Map(props.bankMasters.map(b => [b.id, b]));
                                const newBankMasters = updatedItems.map(item => {
                                    const originalBank = originalBanksMap.get(item.id);
                                    if (originalBank) {
                                        return { ...originalBank, bankName: item.name, active: item.active !== false, order: item.order };
                                    } else {
                                        return {
                                            id: item.id,
                                            bankCode: `NEW-${item.id}`,
                                            bankName: item.name,
                                            branchName: 'Default Branch',
                                            active: item.active !== false,
                                            accountType: '',
                                            accountNumber: '',
                                            order: item.order,
                                        } as BankMaster;
                                    }
                                });
                                props.onUpdateBankMasters(newBankMasters);
                            }}
                            addToast={props.addToast}
                            noun="Bank"
                            dependencyCheck={(id) => {
                                const item = props.bankMasters.find(b => b.id === id);
                                if (!item) return [];
                                return props.allMembers.filter(m => m.bankDetails?.bankName === item.bankName).map(m => ({ name: m.name, type: 'member' }));
                            }}
                            codeColumnDisplay="hidden"
                            {...permissionProps}
                        />
                        <GenericMasterManager
                            key="accountTypes"
                            title="Manage Account Types"
                            items={props.accountTypes}
                            onUpdate={props.onUpdateAccountTypes}
                            addToast={props.addToast}
                            noun="Account Type"
                            reorderable={true}
                            codeColumnDisplay="hidden"
                            {...permissionProps}
                        />
                    </div>
                );
            default: return <div className="text-center p-8 text-gray-500">Select an item from the sidebar to manage it.</div>;
        }
    };
    
    const handleNavKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (focusArea !== 'nav' || event.key !== 'Tab') return;
        
        const focusable = Array.from(
            navContainerRef.current?.querySelectorAll<HTMLElement>('button') || []
        );
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        
        if (event.shiftKey && currentIndex === 0) {
            focusable[focusable.length - 1].focus();
            event.preventDefault();
        } else if (!event.shiftKey && currentIndex === focusable.length - 1) {
            focusable[0].focus();
            event.preventDefault();
        }
    };

    return (
        <div className="flex flex-col xl:flex-row gap-6 xl:h-full">
            <div 
                ref={navContainerRef}
                onKeyDown={handleNavKeyDown}
                className="hidden xl:flex w-full xl:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex-col"
            >
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Database/> Master Data</h2>
                <nav className="flex-1 space-y-1.5 overflow-y-auto -mr-2 pr-2">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => {
                            setActiveTab(item.id);
                            setFocusArea('content');
                        }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
                                activeTab === item.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="xl:hidden" ref={mobileNavRef}>
                <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white mb-4">
                    <Database/> Master Data
                </div>
                <div className="relative">
                    <button
                        onClick={() => setIsMobileNavOpen(prev => !prev)}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center"
                        aria-haspopup="listbox"
                        aria-expanded={isMobileNavOpen}
                    >
                        <span>{activeLabel}</span>
                        <ChevronDown size={16} className={`transition-transform text-gray-500 dark:text-gray-400 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMobileNavOpen && (
                        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20 max-h-80 overflow-y-auto animate-fade-in origin-top transition-transform">
                            <ul className="py-1" role="listbox">
                                {navItems.map(item => (
                                    <li key={item.id} role="option" aria-selected={activeTab === item.id}>
                                        <button
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                setIsMobileNavOpen(false);
                                            }}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            {React.cloneElement(item.icon, { className: "text-gray-500 dark:text-gray-400" })}
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            <div ref={contentContainerRef} className="flex-1 xl:overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};