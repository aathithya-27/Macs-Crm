import React, { useState, useMemo, useCallback, useEffect, useRef, forwardRef } from 'react';
import { Search, Calendar, AlertTriangle, CheckCircle, Clock, FileText, X, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
// MODIFIED: Import permission types
import { Member, Policy, ModalTab, User, FinRootsBranch, InsuranceTypeMaster, Designation, AppModule, PermissionLevel } from '../types.ts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval, parseISO, Interval, isValid } from 'date-fns';

// Correctly extends jsPDF to include autoTable functionality
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDFWithAutoTable;
}

// --- SELF-CONTAINED UI COMPONENTS ---

const ViewIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'light' | 'danger' | 'success'; size?: 'small' | 'medium' }
>(({ className, variant = 'primary', size = 'medium', ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const sizeClasses = {
    small: "h-9 px-3",
    medium: "h-10 py-2 px-4",
  };
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    light: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ className, type, label, ...props }, ref) => {
  return (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <input
            type={type}
            className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50 dark:focus:ring-blue-500 ${className}`}
            ref={ref}
            {...props}
        />
    </div>
  );
});

const MultiSelectDropdown: React.FC<{
    label: string;
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
}> = ({ label, options, selectedValues, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = (value: string) => {
        const newSelected = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newSelected);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full h-10 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm dark:bg-gray-700 dark:border-gray-600">
                <span className="text-gray-700 dark:text-gray-200">{selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Select...'}</span>
                 <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border dark:bg-gray-800 dark:border-gray-700">
                    <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
                        {options.map(option => (
                            <li key={option.value} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleToggle(option.value)}>
                                <div className="flex items-center">
                                    <input type="checkbox" checked={selectedValues.includes(option.value)} readOnly className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    <span className="ml-3">{option.label}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
}> = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    if (totalPages <= 1) return null;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
                <Button variant="light" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                <Button variant="light" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalItems}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                         <Button variant="light" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-r-none">Previous</Button>
                         <Button variant="light" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-l-none">Next</Button>
                    </nav>
                </div>
            </div>
        </div>
    );
};


interface PolicyManagerProps {
  members: Member[];
  onRenewPolicy: (memberId: string, policyId: string) => Promise<boolean>;
  onViewMember: (member: Member, initialTab?: ModalTab) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  users: User[];
  finrootsBranches: FinRootsBranch[];
  insuranceTypes: InsuranceTypeMaster[];
  designations: Designation[]; // NEW PROP
  // NEW: Accept permissions prop
  permissions: { [key in AppModule]?: PermissionLevel };
}

interface Filters {
    renewalDateRange: { start: string; end: string };
    premiumRange: { min: number; max: number };
    advisors: string[];
    branches: string[];
    insuranceTypeIds: string[];
}

const ITEMS_PER_PAGE = 10;

type RenewalStatusFilter = 'All' | 'Due in 30 Days' | 'Due in 7 Days' | 'Overdue';

const FilterPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onFilterChange: React.Dispatch<React.SetStateAction<Filters>>;
    onApply: () => void;
    onClear: () => void;
    advisors: User[];
    branches: FinRootsBranch[];
    insuranceTypes: InsuranceTypeMaster[];
    valueBounds: { min: number; max: number };
}> = ({ isOpen, onClose, filters, onFilterChange, onApply, onClear, advisors, branches, insuranceTypes, valueBounds }) => {
    const handleDateChange = (field: 'start' | 'end', value: string) => {
        onFilterChange(prev => ({ ...prev, renewalDateRange: { ...prev.renewalDateRange, [field]: value } }));
    };

    const handleValueChange = (field: 'min' | 'max', value: string) => {
        const numValue = parseInt(value);
        onFilterChange(prev => ({...prev, premiumRange: { ...prev.premiumRange, [field]: isNaN(numValue) ? 0 : numValue }}));
    };
    
    const parentTypes = useMemo(() => insuranceTypes.filter(it => !it.parentId && it.active), [insuranceTypes]);

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Filter Policies</h3>
                    <Button onClick={onClose} variant="light" className="!p-2"><X size={16} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Type</label>
                        <div className="space-y-2">
                            {parentTypes.map(parent => {
                                const children = insuranceTypes.filter(it => it.parentId === parent.id && it.active);
                                return (
                                    <div key={parent.id} className="p-2 border dark:border-gray-600 rounded-md">
                                        <label className="flex items-center gap-2 font-semibold">
                                            <input type="checkbox" checked={filters.insuranceTypeIds.includes(parent.id)} onChange={() => {
                                                const newSelection = filters.insuranceTypeIds.includes(parent.id) ? filters.insuranceTypeIds.filter(id => id !== parent.id) : [...filters.insuranceTypeIds, parent.id];
                                                onFilterChange(prev => ({...prev, insuranceTypeIds: newSelection}));
                                            }}/>
                                            {parent.name}
                                        </label>
                                        {children.length > 0 && (
                                            <div className="pl-6 mt-2 space-y-1">
                                                {children.map(child => (
                                                    <label key={child.id} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={filters.insuranceTypeIds.includes(child.id)} onChange={() => {
                                                             const newSelection = filters.insuranceTypeIds.includes(child.id) ? filters.insuranceTypeIds.filter(id => id !== child.id) : [...filters.insuranceTypeIds, child.id];
                                                             onFilterChange(prev => ({...prev, insuranceTypeIds: newSelection}));
                                                        }}/>
                                                        {child.name}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Renewal Date</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="From" type="date" value={filters.renewalDateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} />
                            <Input label="To" type="date" value={filters.renewalDateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-gray-600 dark:text-gray-300">Premium Range (₹)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Min Premium" type="number" value={filters.premiumRange.min || ''} onChange={(e) => handleValueChange('min', e.target.value)} placeholder={`${valueBounds.min.toLocaleString('en-IN')}`} />
                            <Input label="Max Premium" type="number" value={filters.premiumRange.max || ''} onChange={(e) => handleValueChange('max', e.target.value)} placeholder={`${valueBounds.max.toLocaleString('en-IN')}`} />
                        </div>
                    </div>
                     <MultiSelectDropdown label="Filter by Advisor" options={advisors.map(a => ({ value: a.id, label: a.name }))} selectedValues={filters.advisors} onChange={selected => onFilterChange(prev => ({...prev, advisors: selected}))} />
                     <MultiSelectDropdown label="Filter by Branch" options={branches.map(b => ({ value: b.id, label: b.branchName }))} selectedValues={filters.branches} onChange={selected => onFilterChange(prev => ({...prev, branches: selected}))} />
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
                    <Button variant="secondary" onClick={onClear}>Clear All</Button>
                    <Button variant="primary" onClick={onApply}>Apply Filters</Button>
                </div>
            </div>
        </>
    );
};


const PolicyManager: React.FC<PolicyManagerProps> = ({ members, onRenewPolicy, onViewMember, addToast, users, finrootsBranches, insuranceTypes, designations, permissions }) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'daysLeft', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [renewalStatusFilter, setRenewalStatusFilter] = useState<RenewalStatusFilter>('All');

  // NEW: Permission check for the policies module
  const canModify = permissions?.policies === 'modify';

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
  const branchMap = useMemo(() => new Map(finrootsBranches.map(b => [b.id, b.branchName])), [finrootsBranches]);
  const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

  const getPolicyTypeName = useCallback((insuranceTypeId?: string | null) => {
    if (!insuranceTypeId) return 'N/A';
    const type = insuranceTypeMap.get(insuranceTypeId);
    if (!type) return 'Unknown';
    if (type.parentId) {
        const parent = insuranceTypeMap.get(type.parentId);
        return parent ? `${parent.name} > ${type.name}` : type.name;
    }
    return type.name;
  }, [insuranceTypeMap]);

  const allPolicies = useMemo(() => {
    let pk_counter = 1;
    return members.flatMap(member =>
      member.policies
      .map(policy => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const renewalDate = new Date(policy.renewalDate);
        renewalDate.setHours(0, 0, 0, 0);

        const diffTime = renewalDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let renewalStatus: 'Active' | 'Pending' | 'Overdue' = 'Active';
        if (daysLeft < 0) {
            renewalStatus = 'Overdue';
        } else if (daysLeft <= 30) {
            renewalStatus = 'Pending';
        }

        const primaryAdvisor = users.find(u => u.id === member.assignedTo?.[0]);

        return {
          ...policy,
          pk: pk_counter++,
          memberName: member.name,
          memberId: member.id,
          fullMember: member,
          daysLeft,
          renewalStatus: renewalStatus,
          advisorId: primaryAdvisor?.id,
          branchId: primaryAdvisor?.profile?.employeeBranchId,
          policyTypeName: getPolicyTypeName(policy.insuranceTypeId),
        };
      })
    );
  }, [members, users, getPolicyTypeName]);
  
  const valueBounds = useMemo(() => {
    if (allPolicies.length === 0) return { min: 0, max: 100000 };
    const values = allPolicies.map(p => p.premium);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [allPolicies]);

  const initialFilters: Filters = useMemo(() => ({
    renewalDateRange: { start: '', end: '' },
    premiumRange: { min: valueBounds.min, max: valueBounds.max },
    advisors: [],
    branches: [],
    insuranceTypeIds: [],
  }), [valueBounds]);

  const [activeFilters, setActiveFilters] = useState<Filters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
      if (isFilterPanelOpen) {
          setTempFilters(activeFilters);
      }
  }, [isFilterPanelOpen, activeFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, searchTerm, renewalStatusFilter]);

  const filteredAndSortedPolicies = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    let filtered = allPolicies.filter(policy => {
        if (policy.status !== 'Active') {
            return false;
        }

        if (lowercasedSearchTerm) {
            const advisorName = userMap.get(policy.advisorId || '') || '';
            const branchName = branchMap.get(policy.branchId || '') || '';
            const renewalDateString = new Date(policy.renewalDate).toLocaleDateString('en-GB');

            const searchMatch = 
                policy.memberName.toLowerCase().includes(lowercasedSearchTerm) ||
                (policy.schemeName || '').toLowerCase().includes(lowercasedSearchTerm) ||
                policy.id.toLowerCase().includes(lowercasedSearchTerm) ||
                (policy.policyTypeName || '').toLowerCase().includes(lowercasedSearchTerm) ||
                advisorName.toLowerCase().includes(lowercasedSearchTerm) ||
                branchName.toLowerCase().includes(lowercasedSearchTerm) ||
                policy.premium.toString().includes(lowercasedSearchTerm) ||
                renewalDateString.includes(lowercasedSearchTerm);

            if (!searchMatch) return false;
        }

        const { renewalDateRange, premiumRange, advisors, branches, insuranceTypeIds } = activeFilters;
        
        if (advisors.length > 0 && !advisors.includes(policy.advisorId || '')) return false;
        if (branches.length > 0 && !branches.includes(policy.branchId || '')) return false;
        if (policy.premium < premiumRange.min || policy.premium > premiumRange.max) return false;

        const renewalDate = new Date(policy.renewalDate).getTime();
        if (renewalDateRange.start) {
            const startDate = new Date(renewalDateRange.start).getTime();
            if (renewalDate < startDate) return false;
        }
        if (renewalDateRange.end) {
            const endDate = new Date(renewalDateRange.end).setHours(23, 59, 59, 999);
            if (renewalDate > endDate) return false;
        }
        
        if (insuranceTypeIds.length > 0) {
            if (!policy.insuranceTypeId) return false;
            const type = insuranceTypeMap.get(policy.insuranceTypeId);
            if (!type) return false;

            const isInFilter = insuranceTypeIds.includes(type.id) || (type.parentId && insuranceTypeIds.includes(type.parentId));
            if (!isInFilter) return false;
        }

        if (renewalStatusFilter !== 'All') {
            const daysLeft = policy.daysLeft;
            if (renewalStatusFilter === 'Overdue' && daysLeft >= 0) return false;
            if (renewalStatusFilter === 'Due in 7 Days' && (daysLeft < 0 || daysLeft > 7)) return false;
            if (renewalStatusFilter === 'Due in 30 Days' && (daysLeft < 0 || daysLeft > 30)) return false;
        }

        return true;
    });

    filtered.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;
        let aValue: any;
        let bValue: any;
        switch (key) {
            case 'pk': aValue = a.pk; bValue = b.pk; break;
            case 'memberName': aValue = a.memberName.toLowerCase(); bValue = b.memberName.toLowerCase(); break;
            case 'policyType': aValue = a.policyTypeName; bValue = b.policyTypeName; break;
            case 'premium': aValue = a.premium; bValue = b.premium; break;
            case 'renewalDate': aValue = new Date(a.renewalDate).getTime(); bValue = new Date(b.renewalDate).getTime(); break;
            case 'daysLeft': aValue = a.daysLeft; bValue = b.daysLeft; break;
            case 'renewalStatus': aValue = a.renewalStatus; bValue = b.renewalStatus; break;
            case 'advisor': aValue = userMap.get(a.advisorId || '') || 'Z'; bValue = userMap.get(b.advisorId || '') || 'Z'; break;
            case 'branch': aValue = branchMap.get(a.branchId || '') || 'Z'; bValue = branchMap.get(b.branchId || '') || 'Z'; break;
            default: return 0;
        }
        if (aValue < bValue) return -1 * dir;
        if (aValue > bValue) return 1 * dir;
        return 0;
    });

    return filtered;
  }, [allPolicies, activeFilters, searchTerm, sortConfig, userMap, branchMap, renewalStatusFilter, insuranceTypeMap]);

  const totalPages = Math.ceil(filteredAndSortedPolicies.length / ITEMS_PER_PAGE);
  const currentPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedPolicies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredAndSortedPolicies]);

  const summaryStats = useMemo(() => {
    return allPolicies.reduce((acc, policy) => {
        if (policy.status === 'Active') {
            acc.totalPolicies += 1;
            if (policy.daysLeft < 0) {
                acc.overduePolicies += 1;
            } else {
                if (policy.daysLeft <= 30) acc.dueIn30Days += 1;
                if (policy.daysLeft <= 7) acc.dueIn7Days += 1;
            }
        }
        return acc;
    }, { totalPolicies: 0, dueIn30Days: 0, dueIn7Days: 0, overduePolicies: 0 });
  }, [allPolicies]);

  const handleRenew = (memberId: string, policyId: string) => onRenewPolicy(memberId, policyId);

  const SortableHeader: React.FC<{ sortKey: string; label: string }> = ({ sortKey, label }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        <button onClick={() => setSortConfig(prev => ({ key: sortKey, direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc' }))} className="group inline-flex items-center">
            {label}
            <span className={`ml-2 flex-none rounded ${sortConfig.key === sortKey ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-200' : 'text-gray-400 invisible group-hover:visible'}`}>
                {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUp size={14} />}
            </span>
        </button>
    </th>
  );
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.renewalDateRange.start || activeFilters.renewalDateRange.end) count++;
    if (activeFilters.premiumRange.min > valueBounds.min || activeFilters.premiumRange.max < valueBounds.max) count++;
    if (activeFilters.advisors.length > 0) count++;
    if (activeFilters.branches.length > 0) count++;
    if (activeFilters.insuranceTypeIds.length > 0) count++;
    return count;
  }, [activeFilters, valueBounds]);

  const StatCard = ({ title, value, icon, colorClasses, isActive, onClick }: { title: string; value: string | number; icon: React.ReactNode; colorClasses: string, isActive: boolean, onClick: () => void }) => (
      <button onClick={onClick} className={`text-left w-full h-full transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900`}>
        <div className={`p-4 rounded-lg border h-full flex items-center gap-4 transition-all duration-200 ${isActive ? 'bg-gray-50 dark:bg-gray-700/50 shadow-md border-gray-300 dark:border-gray-600' : 'bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700'}`}>
            <div className={`p-3 rounded-full ${colorClasses}`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    </button>
  );

  const StatusBadge = ({ status } : { status: string }) => {
    const statusStyles = {
        Active: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', dot: 'bg-green-500' },
        Pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
        Overdue: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' }
    };
    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles['Active'];
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}><span className={`w-2 h-2 mr-1.5 rounded-full ${style.dot}`}></span>{status}</span>);
  };

  const EmptyState = () => (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
        <p className="mt-2 text-sm font-semibold">No Policies Found</p>
        <p className="mt-1 text-xs">No policies match the current filters or search term.</p>
    </div>
  );
  
  const handleRenewalFilterClick = (filter: RenewalStatusFilter) => {
    setRenewalStatusFilter(prev => prev === filter ? 'All' : filter);
  };

  const advisorsForFilter = useMemo(() => {
      const advisorDesignationIds = new Set(designations.filter(d => d.isAdvisor).map(d => d.id));
      return users.filter(u => advisorDesignationIds.has(u.designationId));
  }, [users, designations]);

  return (
    <div className="space-y-6">
      <FilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={() => setIsFilterPanelOpen(false)} 
        filters={tempFilters} 
        onFilterChange={setTempFilters} 
        onApply={() => { setActiveFilters(tempFilters); setIsFilterPanelOpen(false); }} 
        onClear={() => { const clearedFilters = { ...initialFilters, premiumRange: { min: valueBounds.min, max: valueBounds.max } }; setActiveFilters(clearedFilters); setTempFilters(clearedFilters); }} 
        advisors={advisorsForFilter} 
        branches={finrootsBranches} 
        insuranceTypes={insuranceTypes} 
        valueBounds={valueBounds}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Policy Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage all customer policies and renewals.</p>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Active Policies" value={summaryStats.totalPolicies} icon={<FileText size={22} className="text-purple-600 dark:text-purple-300" />} colorClasses="bg-purple-100 dark:bg-purple-900/50" isActive={renewalStatusFilter === 'All'} onClick={() => handleRenewalFilterClick('All')} />
          <StatCard title="Due in 30 Days" value={summaryStats.dueIn30Days} icon={<Calendar size={22} className="text-blue-600 dark:text-blue-300" />} colorClasses="bg-blue-100 dark:bg-blue-900/50" isActive={renewalStatusFilter === 'Due in 30 Days'} onClick={() => handleRenewalFilterClick('Due in 30 Days')} />
          <StatCard title="Due in 7 Days" value={summaryStats.dueIn7Days} icon={<Clock size={22} className="text-orange-600 dark:text-orange-300" />} colorClasses="bg-orange-100 dark:bg-orange-900/50" isActive={renewalStatusFilter === 'Due in 7 Days'} onClick={() => handleRenewalFilterClick('Due in 7 Days')} />
          <StatCard title="Overdue" value={summaryStats.overduePolicies} icon={<AlertTriangle size={22} className="text-red-600 dark:text-red-300" />} colorClasses="bg-red-100 dark:bg-red-900/50" isActive={renewalStatusFilter === 'Overdue'} onClick={() => handleRenewalFilterClick('Overdue')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div className="flex-grow">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                            id="policy-search"
                            type="text"
                            placeholder="Search by customer, scheme, policy ID, advisor, premium..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 w-full !h-11 !rounded-lg"
                        />
                    </div>
                </div>
                <div className="flex-shrink-0">
                     <Button onClick={() => setIsFilterPanelOpen(true)} variant="light" className="w-full md:w-auto">
                        <SlidersHorizontal size={16} /> <span className="ml-2">Advanced Filter</span> {activeFilterCount > 0 && <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
                    </Button>
                </div>
            </div>
            
            <div className="mt-6 overflow-x-auto">
              {filteredAndSortedPolicies.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <SortableHeader sortKey="pk" label="ID" />
                      <SortableHeader sortKey="memberName" label="Customer" />
                      <SortableHeader sortKey="policyType" label="Policy Type" />
                      <SortableHeader sortKey="advisor" label="Assigned To" />
                      <SortableHeader sortKey="branch" label="Branch" />
                      <SortableHeader sortKey="premium" label="Premium" />
                      <SortableHeader sortKey="renewalDate" label="Renewal Date" />
                      <SortableHeader sortKey="daysLeft" label="Days Left" />
                      <SortableHeader sortKey="renewalStatus" label="Status" />
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentPolicies.map(policy => (
                      <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">{policy.pk}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{policy.memberName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{policy.policyTypeName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{userMap.get(policy.advisorId || '') || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{branchMap.get(policy.branchId || '') || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(policy.premium)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(policy.renewalDate).toLocaleDateString('en-GB')}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${policy.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{policy.daysLeft >= 0 ? `${policy.daysLeft} days` : `${Math.abs(policy.daysLeft)} days overdue`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={policy.renewalStatus} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button size="small" variant="light" onClick={() => onViewMember(policy.fullMember, ModalTab.Policies)}><ViewIcon className="w-4 h-4 mr-1" /> View</Button>
                            {/* MODIFIED: Renew button is disabled based on permission */}
                            <Button 
                                size="small" 
                                variant="primary" 
                                onClick={() => handleRenew(policy.memberId, policy.id)}
                                disabled={!canModify}
                                title={!canModify ? "You don't have permission to modify policies" : "Renew this policy"}
                            >
                                <CheckCircle className="w-4 h-4 mr-1" /> Renew
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700"><EmptyState /></div>
              )}
            </div>
        </div>
        {filteredAndSortedPolicies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredAndSortedPolicies.length}
          />
        )}
      </div>
    </div>
  );
};

export default PolicyManager;