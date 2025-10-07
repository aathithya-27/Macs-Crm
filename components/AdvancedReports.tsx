// --- START OF FILE AdvancedReports.tsx ---

import React, { useState, useMemo, useEffect } from 'react';
import { Member, Policy, User, Task, Lead, FinRootsBranch, SchemeMaster, Company, Expense, ManualIncome, CustomerTier, AttendanceState, BusinessVertical, TaskStatusMaster, ExpenseCategoryLevel1, ExpenseCategoryLevel2, ExpenseCategoryLevel3, IncomeCategoryLevel1, IncomeCategoryLevel2, CustomerFieldMaster, InsuranceFieldMaster, InsuranceTypeMaster, ManualCommission, Designation } from '../types.ts'; // MODIFIED
import { Download, FileX, BarChart3, Info, PieChart as PieChartIcon, BarChartHorizontal } from 'lucide-react';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval, parseISO, Interval, isValid } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


// Correctly extends jsPDF to include autoTable functionality
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDFWithAutoTable;
}

// --- Component Props Definition ---
interface AdvancedReportsProps {
    members: Member[];
    users: User[];
    tasks: Task[];
    leads: Lead[];
    branches: FinRootsBranch[];
    schemes: SchemeMaster[];
    companies: Company[];
    expenses: Expense[];
    manualIncomes: ManualIncome[];
    manualCommissions: ManualCommission[];
    currentUser: User | null;
    customerTiers: CustomerTier[];
    attendance: AttendanceState;
    businessVerticals: BusinessVertical[];
    taskStatusMasters: TaskStatusMaster[];
    expenseCategoriesLevel1: ExpenseCategoryLevel1[];
    expenseCategoriesLevel2: ExpenseCategoryLevel2[];
    expenseCategoriesLevel3: ExpenseCategoryLevel3[];
    incomeCategoriesLevel1: IncomeCategoryLevel1[];
    incomeCategoriesLevel2: IncomeCategoryLevel2[];
    customerFieldMasters: CustomerFieldMaster[];
    insuranceFields: InsuranceFieldMaster[];
    insuranceTypes: InsuranceTypeMaster[];
    designations: Designation[]; // NEW PROP
}

// --- Type Definitions for Reporting ---
type ReportType = 'customerDetail' | 'comparativeBusiness' | 'policies' | 'commissions' | 'manualCommissions' | 'expenses' | 'income' | 'businessVertical' | 'attendance' | 'taskPerformance' | 'leadConversion';
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ViewMode = 'table' | 'chart';

interface ReportColumn {
    key: string;
    label: string;
    render?: (row: any) => React.ReactNode;
    isNumeric?: boolean;
}

// --- Helper Functions ---
const formatCsvCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) return 'N/A';
    if (Array.isArray(cellData)) cellData = cellData.join('; ');
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        const escapedData = stringData.replace(/"/g, '""');
        return `"${escapedData}"`;
    }
    return stringData;
};

const toLocaleCurrency = (num: number | undefined) => (num ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700/50">
                <p className="font-bold text-gray-800 dark:text-white mb-1">{label}</p>
                {payload.map((p: any, i: number) => {
                    const value = typeof p.value === 'number'
                        ? toLocaleCurrency(p.value)
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


// --- Main Component ---
const AdvancedReports: React.FC<AdvancedReportsProps> = (props) => {
    const { 
        members, users, tasks, leads, branches, schemes, companies, expenses, 
        manualIncomes, manualCommissions, currentUser, customerTiers, attendance, businessVerticals, 
        taskStatusMasters, expenseCategoriesLevel1, expenseCategoriesLevel2, 
        expenseCategoriesLevel3, incomeCategoriesLevel1, incomeCategoriesLevel2, 
         customerFieldMasters, insuranceFields, insuranceTypes, designations
    } = props;

    // --- State Management ---
    const [reportType, setReportType] = useState<ReportType>('policies');
    const [startDate, setStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [advisorFilter, setAdvisorFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [policyTypeFilter, setPolicyTypeFilter] = useState('all');
    const [subTypeFilter, setSubTypeFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [schemeFilter, setSchemeFilter] = useState('all');
    const [showAllCustomerFields, setShowAllCustomerFields] = useState(false);
    const [showAllPolicyFields, setShowAllPolicyFields] = useState(false);
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('table');


    // --- Memoized Select Options ---
    const advisorOptions = useMemo(() => {
        const advisorDesignationIds = new Set(designations.filter(d => d.isAdvisor).map(d => d.id));
        const advisors = users.filter(u => advisorDesignationIds.has(u.designationId));
        return [{ value: 'all', label: 'All Advisors' }, ...advisors.map(u => ({ value: u.id, label: u.name }))];
    }, [users, designations]);

    const branchOptions = useMemo(() => [{ value: 'all', label: 'All Branches' }, ...branches.map(b => ({ value: b.branchId, label: b.branchName }))], [branches]);
    const policyTypeOptions = useMemo(() => [{ value: 'all', label: 'All Policy Types' }, ...insuranceTypes.filter(it => !it.parentId && it.active).map(it => ({ value: it.id, label: it.name }))], [insuranceTypes]);
    const subTypeOptions = useMemo(() => {
        if (policyTypeFilter === 'all') return [];
        const children = insuranceTypes.filter(it => it.parentId === policyTypeFilter && it.active);
        if (children.length === 0) return [];
        return [{ value: 'all', label: 'All Sub-Types' }, ...children.map(it => ({ value: it.id, label: it.name }))];
    }, [insuranceTypes, policyTypeFilter]);
    const customerOptions = useMemo(() => members.map(m => ({ value: m.id, label: `${m.name} (${m.memberId})`})), [members]);
    const companyOptions = useMemo(() => [{ value: 'all', label: 'All Agencies' }, ...companies.map(c => ({ value: c.id, label: c.name }))], [companies]);
    const schemeOptions = useMemo(() => {
        const baseOptions = [{ value: 'all', label: 'All Schemes' }];
        const filteredSchemes = schemes.filter(s => companyFilter === 'all' || s.companyId === companyFilter);
        return [...baseOptions, ...filteredSchemes.map(s => ({ value: s.name, label: s.name }))]
    }, [schemes, companyFilter]);


    // --- Category & Data Lookup Helpers ---
    const getExpenseCategoryPath = (row: Expense) => {
        const l1 = expenseCategoriesLevel1.find(c => c.id === row.categoryLevel1Id)?.name;
        const l2 = expenseCategoriesLevel2.find(c => c.id === row.categoryLevel2Id)?.name;
        const l3 = expenseCategoriesLevel3.find(c => c.id === row.categoryLevel3Id)?.name;
        return [l1, l2, l3].filter(Boolean).join(' > ') || 'N/A';
    };
    const getIncomeCategoryPath = (row: ManualIncome) => {
        const l1 = incomeCategoriesLevel1.find(c => c.id === row.categoryLevel1Id)?.name;
        const l2 = incomeCategoriesLevel2.find(c => c.id === row.categoryLevel2Id)?.name;
        return [l1, l2].filter(Boolean).join(' > ') || 'N/A';
    };
    
    const advisorMatch = (item: any) => {
        if (advisorFilter === 'all') return true;
        const employee = users.find(u => 
            (item.id && item.designationId && u.id === item.id) || 
            (item.createdBy && u.id === item.createdBy) ||
            (item.primaryContactPerson && u.id === item.primaryContactPerson)
        );
        if (employee) return employee.id === advisorFilter;
        if (item.assignedTo) {
            const assignedToArray = Array.isArray(item.assignedTo) ? item.assignedTo : [item.assignedTo];
            return assignedToArray.includes(advisorFilter);
        }
        return false;
    };
    
    const branchMatch = (item: any) => {
        if (branchFilter === 'all') return true;
        if (item.branchId && item.branchId === branchFilter) return true;
        
        const employeeId = item.createdBy || item.primaryContactPerson || (Array.isArray(item.assignedTo) ? item.assignedTo[0] : item.assignedTo);
        if (employeeId) {
            const employee = users.find(u => u.id === employeeId);
            if (employee?.profile?.employeeBranchId === branchFilter) return true;
        }
        return false;
    };
    
    const customerMatch = (item: { id: string; }) => {
        if (selectedCustomerIds.length === 0) return true;
        return selectedCustomerIds.includes(item.id);
    };


    // --- Core Data Filtering and Aggregation Logic ---
    const filteredData = useMemo(() => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        const relevantTypeIds = new Set<string>();
        if (policyTypeFilter !== 'all') {
            if (subTypeFilter !== 'all') {
                relevantTypeIds.add(subTypeFilter);
            } else {
                relevantTypeIds.add(policyTypeFilter);
                insuranceTypes.forEach(it => {
                    if (it.parentId === policyTypeFilter) relevantTypeIds.add(it.id);
                });
            }
        }

        switch (reportType) {
            case 'customerDetail':
                return members.filter(m => {
                    const createdDate = m.createdAt ? parseISO(m.createdAt) : null;
                    if (!createdDate || !isValid(createdDate)) return false;
                    return (createdDate >= start && createdDate <= end) && advisorMatch(m) && branchMatch(m) && customerMatch(m);
                });

            case 'policies':
                const allPolicies = members.flatMap(m => m.policies.map(p => ({ ...p, member: m })));
                return allPolicies.filter(p => {
                    const createdDate = p.member.createdAt ? parseISO(p.member.createdAt) : null;
                    if (!createdDate || !isValid(createdDate)) return false;

                    const typeMatch = policyTypeFilter === 'all' || (p.insuranceTypeId && relevantTypeIds.has(p.insuranceTypeId));
                    const companyMatch = companyFilter === 'all' || p.companyId === companyFilter;
                    const schemeMatch = schemeFilter === 'all' || p.schemeName === schemeFilter;
                    return (createdDate >= start && createdDate <= end) && advisorMatch(p.member) && branchMatch(p.member) && typeMatch && companyMatch && schemeMatch;
                });

            case 'commissions':
                const policiesWithCommission = members.flatMap(m => m.policies.filter(p => p.commission).map(p => ({ ...p, member: m })));
                return policiesWithCommission.filter(p => {
                    const createdDate = p.member.createdAt ? parseISO(p.member.createdAt) : null;
                    if (!createdDate || !isValid(createdDate)) return false;
                    return (createdDate >= start && createdDate <= end) && advisorMatch(p.member) && branchMatch(p.member);
                });
            
            case 'manualCommissions':
                return manualCommissions.filter(mc => {
                    const commDate = parseISO(mc.date);
                    const member = members.find(m => m.id === mc.memberId);
                    return (commDate >= start && commDate <= end) && advisorMatch(mc) && branchMatch(member || {});
                });

            case 'expenses':
                return expenses.filter(e => {
                    const expenseDate = parseISO(e.date);
                    const creator = users.find(u => u.id === e.createdBy);
                    return (expenseDate >= start && expenseDate <= end) && branchMatch(e) && advisorMatch(creator || {});
                });

            case 'income':
                return manualIncomes.filter(i => {
                    const incomeDate = parseISO(i.date);
                    const creator = users.find(u => u.id === i.createdBy);
                    return (incomeDate >= start && incomeDate <= end) && advisorMatch(creator || {});
                });

            case 'attendance':
                const flatAttendance: any[] = [];
                Object.entries(attendance).forEach(([userId, records]) => {
                    const user = users.find(u => u.id === userId);
                    if (user && advisorMatch(user) && branchMatch(user)) {
                        records.forEach(rec => {
                            const recDate = parseISO(rec.timestamp);
                            if (recDate >= start && recDate <= end) {
                                flatAttendance.push({ ...rec, userName: user.name, branchName: branches.find(b => b.branchId === user.profile?.employeeBranchId)?.branchName || 'N/A' });
                            }
                        });
                    }
                });
                return flatAttendance;
            
            case 'taskPerformance':
                 return tasks.filter(t => {
                    const created = t.creationDateTime ? parseISO(t.creationDateTime) : null;
                    if (!created || !isValid(created)) return false;
                    const member = members.find(m => m.id === t.memberId);
                    return (created >= start && created <= end) && advisorMatch(t) && branchMatch(member || {});
                 });

            case 'leadConversion':
                return leads.filter(l => {
                    const created = parseISO(l.createdAt);
                    return (created >= start && created <= end) && advisorMatch(l) && branchMatch(l);
                });

            case 'comparativeBusiness':
            case 'businessVertical':
                return [];

            default:
                return [];
        }
    }, [reportType, startDate, endDate, advisorFilter, branchFilter, policyTypeFilter, subTypeFilter, companyFilter, schemeFilter, selectedCustomerIds, members, leads, tasks, expenses, manualIncomes, manualCommissions, attendance, users, branches, schemes, insuranceTypes]);
    
    const aggregatedReportData = useMemo(() => {
        if (reportType !== 'comparativeBusiness' && reportType !== 'businessVertical') return [];

        if (reportType === 'businessVertical') {
            const verticalMap = new Map<string, { policiesSold: number; totalPremium: number; totalCommission: number }>();
            businessVerticals.forEach(bv => verticalMap.set(bv.id, { policiesSold: 0, totalPremium: 0, totalCommission: 0 }));
            
            const insuranceTypeToVerticalMap = new Map<string, string>();
            insuranceTypes.forEach(it => insuranceTypeToVerticalMap.set(it.id, it.verticalId));

            members.forEach(member => {
                if (advisorMatch(member) && branchMatch(member)) {
                    member.policies.forEach(policy => {
                        const issueDate = member.createdAt ? parseISO(member.createdAt) : null;
                        const verticalId = policy.insuranceTypeId ? insuranceTypeToVerticalMap.get(policy.insuranceTypeId) : undefined;
                        if (issueDate && isValid(issueDate) && issueDate >= parseISO(startDate) && issueDate <= parseISO(endDate) && verticalId && verticalMap.has(verticalId)) {
                            const current = verticalMap.get(verticalId)!;
                            current.policiesSold += 1;
                            current.totalPremium += policy.premium;
                            current.totalCommission += policy.commission?.amount || 0;
                        }
                    });
                }
            });
            return Array.from(verticalMap.entries()).map(([id, data]) => ({
                id,
                name: businessVerticals.find(bv => bv.id === id)?.name || 'Unknown',
                ...data
            }));
        }

        if (reportType === 'comparativeBusiness') {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            let intervalGenerator;
            let formatter: (date: Date) => string;
            if (frequency === 'weekly') {
                intervalGenerator = (interval: Interval) => eachWeekOfInterval(interval, { weekStartsOn: 1 });
                formatter = (date: Date) => `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`;
            } else if (frequency === 'monthly') {
                intervalGenerator = eachMonthOfInterval;
                formatter = (date: Date) => format(date, 'MMMM yyyy');
            } else {
                intervalGenerator = (interval: Interval) => [interval.start as Date];
                formatter = (date: Date) => format(date, 'yyyy');
            }
            const intervals = intervalGenerator({ start, end });
            return intervals.map(intervalStart => {
                let intervalEnd;
                if (frequency === 'weekly') intervalEnd = endOfWeek(intervalStart, { weekStartsOn: 1 });
                else if (frequency === 'monthly') intervalEnd = endOfMonth(intervalStart);
                else intervalEnd = endOfYear(intervalStart);
                const periodLabel = formatter(intervalStart as Date);
                const periodMembers = members.filter(m => {
                    const created = m.createdAt ? parseISO(m.createdAt) : null;
                    return (created && isValid(created) && created >= intervalStart && created <= intervalEnd) && advisorMatch(m) && branchMatch(m);
                });
                const periodPolicies = members.flatMap(m => m.policies.map(p => ({ ...p, member: m }))).filter(p => {
                    const policyCreation = p.member.createdAt ? parseISO(p.member.createdAt) : null;
                    return (policyCreation && isValid(policyCreation) && policyCreation >= intervalStart && policyCreation <= intervalEnd) && advisorMatch(p.member) && branchMatch(p.member);
                });
                const periodExpenses = expenses.filter(e => {
                    const expenseDate = parseISO(e.date);
                    return (expenseDate >= intervalStart && expenseDate <= intervalEnd) && branchMatch(e);
                });
                const periodIncomes = manualIncomes.filter(i => {
                    const incomeDate = parseISO(i.date);
                    return (incomeDate >= intervalStart && incomeDate <= intervalEnd);
                });
                const totalPremium = periodPolicies.reduce((sum, p) => sum + p.premium, 0);
                const totalCommission = periodPolicies.reduce((sum, p) => sum + (p.commission?.amount || 0), 0);
                const totalExpense = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
                const totalIncome = periodIncomes.reduce((sum, i) => sum + i.amount, 0);
                return {
                    period: periodLabel,
                    newCustomers: periodMembers.length,
                    policiesSold: periodPolicies.length,
                    totalPremium,
                    totalCommission,
                    manualIncome: totalIncome,
                    totalExpenses: totalExpense,
                    net: (totalCommission + totalIncome) - totalExpense,
                };
            });
        }
        return [];
    }, [reportType, frequency, startDate, endDate, advisorFilter, branchFilter, members, expenses, manualIncomes, businessVerticals, insuranceTypes]);

    const customerInfoColumns = useMemo(() => {
        const base: ReportColumn[] = [
            { key: 'memberId', label: 'Member ID' }, { key: 'name', label: 'Name' }, { key: 'mobile', label: 'Mobile' },
            { key: 'city', label: 'City' }, { key: 'memberType', label: 'Tier' },
            { key: 'branchId', label: 'Branch', render: (r: Member) => branches.find(b => b.branchId === r.branchId)?.branchName || 'N/A' },
            { key: 'assignedTo', label: 'Assigned To', render: (r: Member) => r.assignedTo.map((id: string) => users.find(u=>u.id === id)?.name).join(', ') || 'N/A'},
            { key: 'createdAt', label: 'Creation Date', render: (r: Member) => r.createdAt ? format(parseISO(r.createdAt), 'dd/MM/yyyy') : 'N/A' },
        ];
        if (showAllCustomerFields) {
            base.push(
                { key: 'dob', label: 'DOB', render: r => r.dob ? format(parseISO(r.dob), 'dd/MM/yyyy') : 'N/A' },
                { key: 'gender', label: 'Gender' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' },
                { key: 'state', label: 'State' }, { key: 'district', label: 'District' }, { key: 'pincode', label: 'Pincode' },
                { key: 'panCard', label: 'PAN' }, { key: 'aadhaar', label: 'Aadhaar' },
                { key: 'maritalStatus', label: 'Marital Status' }, { key: 'anniversary', label: 'Anniversary' }
            );
            customerFieldMasters.filter(f => f.active).forEach(field => {
                base.push({
                    key: `dynamicData.${field.fieldName}`,
                    label: field.label,
                    render: (row: Member) => {
                        const value = row.dynamicData?.[field.fieldName];
                        if (value === undefined || value === null) return 'N/A';
                        if (Array.isArray(value)) return value.join(', ');
                        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                        if (field.fieldType === 'table' && value?.__type === 'table') return 'Table Data (Export to view)';
                        return value;
                    }
                });
            });
        }
        return base;
    }, [showAllCustomerFields, customerFieldMasters, users, branches]);
    
    const policyInfoColumns = useMemo(() => {
        const insuranceTypeMap = new Map(insuranceTypes.map(it => [it.id, it.name]));
        const base: ReportColumn[] = [
            { key: 'member.name', label: 'Holder Name' }, 
            { key: 'member.createdAt', label: 'Issue Date', render: (r: Policy & { member: Member }) => {
                const date = r.member.createdAt ? parseISO(r.member.createdAt) : null;
                return date && isValid(date) ? format(date, 'dd/MM/yyyy') : 'N/A';
            }},
            { key: 'insuranceTypeId', label: 'Type', render: (r: Policy) => insuranceTypeMap.get(r.insuranceTypeId || '') || 'N/A' },
            { key: 'schemeName', label: 'Scheme' },
            { key: 'coverage', label: 'Coverage', render: (r: Policy) => toLocaleCurrency(r.coverage), isNumeric: true },
            { key: 'premium', label: 'Annual Premium', render: (r: Policy) => toLocaleCurrency(r.premium), isNumeric: true },
            { key: 'renewalDate', label: 'Renewal Date', render: (r: Policy) => {
                const date = r.renewalDate ? parseISO(r.renewalDate) : null;
                return date && isValid(date) ? format(date, 'dd/MM/yyyy') : 'N/A';
            }},
            { key: 'status', label: 'Status' },
        ];
        if (showAllPolicyFields && policyTypeFilter !== 'all') {
            const relevantInsuranceTypeId = subTypeFilter !== 'all' ? subTypeFilter : policyTypeFilter;
            if (relevantInsuranceTypeId) {
                const relevantFields = insuranceFields.filter(f => f.active && f.insuranceTypeId === relevantInsuranceTypeId).sort((a,b) => a.order - b.order);
                relevantFields.forEach(field => {
                    base.push({
                        key: `dynamicData.${field.fieldName}`,
                        label: field.label,
                        render: (row: Policy) => {
                            const value = row.dynamicData?.[field.fieldName];
                            if (value === undefined || value === null) return 'N/A';
                            if (Array.isArray(value)) return value.join(', ');
                            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                            if (field.fieldType === 'table' && value?.__type === 'table') return 'Table Data (Export to view)';
                            return value;
                        }
                    });
                });
            }
        }
        return base;
    }, [showAllPolicyFields, policyTypeFilter, subTypeFilter, insuranceFields, insuranceTypes]);
    
    const currentColumns = useMemo(() => {
        const reportColumnMap: Record<ReportType, ReportColumn[]> = {
            customerDetail: customerInfoColumns,
            policies: policyInfoColumns,
            commissions: [
                 { key: 'member.name', label: 'Holder Name' }, { key: 'policyType', label: 'Policy Type' }, { key: 'schemeName', label: 'Scheme' },
                 { key: 'premium', label: 'Premium', render: r => toLocaleCurrency(r.premium), isNumeric: true },
                 { key: 'commission.amount', label: 'Commission Amt', render: r => toLocaleCurrency(r.commission?.amount), isNumeric: true },
                 { key: 'commission.status', label: 'Status' },
                 { key: 'commission.paidDate', label: 'Paid Date', render: r => {
                    const date = r.commission?.paidDate ? parseISO(r.commission.paidDate) : null;
                    return date && isValid(date) ? format(date, 'dd/MM/yyyy') : 'N/A';
                 }},
            ],
            manualCommissions: [
                { key: 'date', label: 'Date', render: r => format(parseISO(r.date), 'dd/MM/yyyy') },
                { key: 'memberId', label: 'Customer', render: r => members.find(m => m.id === r.memberId)?.name || 'N/A' },
                { key: 'policyId', label: 'Policy', render: r => {
                    const member = members.find(m => m.id === r.memberId);
                    const policy = member?.policies.find(p => p.id === r.policyId);
                    return policy?.schemeName || `Policy ID: ${r.policyId.substring(0,8)}...`;
                }},
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount', render: r => toLocaleCurrency(r.amount), isNumeric: true },
                { key: 'createdBy', label: 'Logged By', render: r => users.find(u => u.id === r.createdBy)?.name || 'N/A' },
            ],
            expenses: [
                { key: 'date', label: 'Date', render: r => format(parseISO(r.date), 'dd/MM/yyyy') }, { key: 'voucherNo', label: 'Voucher No.' },
                { key: 'category', label: 'Category', render: r => getExpenseCategoryPath(r) }, { key: 'description', label: 'Description' },
                { key: 'paidTo', label: 'Paid To' }, { key: 'amount', label: 'Amount', render: r => toLocaleCurrency(r.amount), isNumeric: true },
                { key: 'branchId', label: 'Branch', render: r => branches.find(b => b.branchId === r.branchId)?.branchName || 'N/A' },
            ],
            income: [
                { key: 'date', label: 'Date', render: r => format(parseISO(r.date), 'dd/MM/yyyy') },
                { key: 'category', label: 'Category', render: r => getIncomeCategoryPath(r) }, { key: 'description', label: 'Description' },
                { key: 'receivedFrom', label: 'Received From' }, { key: 'amount', label: 'Amount', render: r => toLocaleCurrency(r.amount), isNumeric: true },
                { key: 'createdBy', label: 'Logged By', render: r => users.find(u => u.id === r.createdBy)?.name || 'N/A' },
            ],
            attendance: [
                { key: 'timestamp', label: 'Date', render: r => format(parseISO(r.timestamp), 'dd/MM/yyyy') },
                { key: 'userName', label: 'Employee' }, { key: 'branchName', label: 'Branch' }, { key: 'status', label: 'Status' },
                { key: 'reason', label: 'Reason for Absence' },
            ],
            taskPerformance: [
                { key: 'taskDescription', label: 'Task' },
                { key: 'primaryContactPerson', label: 'Assigned To', render: r => users.find(u => u.id === r.primaryContactPerson)?.name || 'N/A' },
                { key: 'statusId', label: 'Status', render: r => taskStatusMasters.find(ts => ts.id === r.statusId)?.name || 'N/A' },
                { key: 'creationDateTime', label: 'Created', render: r => r.creationDateTime ? format(parseISO(r.creationDateTime), 'dd/MM/yyyy') : 'N/A' },
                { key: 'expectedCompletionDateTime', label: 'Due Date', render: r => format(parseISO(r.expectedCompletionDateTime), 'dd/MM/yyyy') },
            ],
            leadConversion: [
                { key: 'name', label: 'Lead Name' }, { key: 'phone', label: 'Phone' },
                { key: 'assignedTo', label: 'Assigned To', render: r => users.find(u => u.id === r.assignedTo)?.name || 'N/A' },
                { key: 'status', label: 'Status' }, { key: 'estimatedValue', label: 'Value', render: r => toLocaleCurrency(r.estimatedValue), isNumeric: true },
                { key: 'createdAt', label: 'Created On', render: r => format(parseISO(r.createdAt), 'dd/MM/yyyy') },
            ],
            comparativeBusiness: [
                { key: 'period', label: 'Period' },
                { key: 'newCustomers', label: 'New Customers', isNumeric: true },
                { key: 'policiesSold', label: 'Policies Sold', isNumeric: true },
                { key: 'totalPremium', label: 'Premium', render: r => toLocaleCurrency(r.totalPremium), isNumeric: true },
                { key: 'totalCommission', label: 'Commission', render: r => toLocaleCurrency(r.totalCommission), isNumeric: true },
                { key: 'manualIncome', label: 'Other Income', render: r => toLocaleCurrency(r.manualIncome), isNumeric: true },
                { key: 'totalExpenses', label: 'Expenses', render: r => toLocaleCurrency(r.totalExpenses), isNumeric: true },
                { key: 'net', label: 'Net Profit', render: r => toLocaleCurrency(r.net), isNumeric: true },
            ],
            businessVertical: [
                { key: 'name', label: 'Business Vertical' },
                { key: 'policiesSold', label: 'Policies Sold', isNumeric: true },
                { key: 'totalPremium', label: 'Total Premium', render: r => toLocaleCurrency(r.totalPremium), isNumeric: true },
                { key: 'totalCommission', label: 'Total Commission', render: r => toLocaleCurrency(r.totalCommission), isNumeric: true },
            ],
        };
        return reportColumnMap[reportType];
    }, [reportType, customerInfoColumns, policyInfoColumns, branches, users, taskStatusMasters, members]);

    const finalData = ['comparativeBusiness', 'businessVertical'].includes(reportType) ? aggregatedReportData : filteredData;

    useEffect(() => {
        const chartSupportedReports: ReportType[] = ['comparativeBusiness', 'policies', 'commissions', 'expenses', 'income', 'manualCommissions', 'businessVertical'];
        if (!chartSupportedReports.includes(reportType)) {
            setViewMode('table');
        }
    }, [reportType]);

    const chartData = useMemo(() => {
        if (viewMode !== 'chart') return [];
    
        const aggregate = (key: (item: any) => string, valueKey: string) => {
            const aggregationMap = new Map<string, number>();
            finalData.forEach(item => {
                const groupKey = key(item) || 'Unspecified';
                const value = Number(String(valueKey).split('.').reduce((o, i) => (o ? o[i] : 0), item as any)) || 0;
                aggregationMap.set(groupKey, (aggregationMap.get(groupKey) || 0) + value);
            });
            return Array.from(aggregationMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        };
    
        switch (reportType) {
            case 'policies':
                return aggregate(item => item.schemeName, 'premium');
            case 'commissions':
                return aggregate(item => item.schemeName, 'commission.amount');
            case 'manualCommissions':
                return aggregate(item => item.description, 'amount');
            case 'expenses':
                return aggregate(getExpenseCategoryPath, 'amount');
            case 'income':
                return aggregate(getIncomeCategoryPath, 'amount');
            case 'businessVertical':
                return finalData.map(item => ({name: item.name, value: item.totalPremium}));
            default:
                return finalData; 
        }
    }, [finalData, reportType, viewMode]);


    const grandTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        const numericColumns = currentColumns.filter(c => c.isNumeric);
        if (numericColumns.length === 0) return null;
    
        numericColumns.forEach(col => {
            totals[col.key] = finalData.reduce((acc, row) => {
                const keys = col.key.split('.');
                let value: any = row;
                for (const key of keys) {
                    if (value && typeof value === 'object' && key in value) { value = value[key]; }
                    else { value = 0; break; }
                }
                return acc + (Number(value) || 0);
            }, 0);
        });
        return totals;
    }, [finalData, currentColumns]);
    
    const downloadBlob = (content: string, filename: string, contentType: string) => {
        const blob = new Blob([`\uFEFF${content}`], { type: contentType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const exportCustomerDossier = (exportFormat: 'csv' | 'pdf') => {
        const customersToExport = members.filter(m => selectedCustomerIds.includes(m.id));
        if (customersToExport.length === 0) {
            alert("Please select customers from the filter to export their dossier.");
            return;
        }

        if (exportFormat === 'pdf') {
            const doc = new jsPDF({ orientation: 'p' });
            customersToExport.forEach((customer, index) => {
                if (index > 0) doc.addPage();
                (doc as jsPDFWithAutoTable).text(`Customer Dossier: ${customer.name}`, 14, 15);

                const customerData = customerInfoColumns.map(col => {
                    let value: any = col.render ? col.render(customer) : customer[col.key as keyof Member] || 'N/A';
                    if (React.isValidElement(value)) value = String((value.props as any).children ?? 'N/A');
                    return [col.label, value];
                });
                (doc as jsPDFWithAutoTable).autoTable({
                    head: [['Field', 'Value']],
                    body: customerData,
                    startY: 25, theme: 'striped',
                });
                
                if (customer.policies.length > 0) {
                    const policyData = customer.policies.map(p => policyInfoColumns.map(col => {
                         let value: any = col.render ? col.render(p) : p[col.key as keyof Policy] || 'N/A';
                         if (React.isValidElement(value)) value = String((value.props as any).children ?? 'N/A');
                         return value;
                    }));
                    (doc as jsPDFWithAutoTable).autoTable({
                        head: [policyInfoColumns.map(c => c.label)],
                        body: policyData,
                        theme: 'grid',
                    });
                } else {
                    (doc as jsPDFWithAutoTable).autoTable({ body: [['No policies found for this customer.']] });
                }
            });
            doc.save(`customer_dossiers_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        } else {
            const allHeaders = [...customerInfoColumns.map(c => `Customer ${c.label}`), ...policyInfoColumns.map(c => `Policy ${c.label}`)];
            const csvRows: Record<string, any>[] = [];
            
            customersToExport.forEach(customer => {
                const customerData: Record<string, any> = {};
                customerInfoColumns.forEach(col => {
                    let value: any = col.render ? col.render(customer) : customer[col.key as keyof Member];
                    if (React.isValidElement(value)) value = String((value.props as any).children ?? 'N/A');
                    customerData[`Customer ${col.label}`] = value ?? 'N/A';
                });

                if (customer.policies.length === 0) {
                    csvRows.push(customerData);
                } else {
                    customer.policies.forEach(policy => {
                        const policyData: Record<string, any> = {};
                        policyInfoColumns.forEach(col => {
                             let value: any = col.render ? col.render(policy) : policy[col.key as keyof Policy];
                             if (React.isValidElement(value)) value = String((value.props as any).children ?? 'N/A');
                             policyData[`Policy ${col.label}`] = value ?? 'N/A';
                        });
                        csvRows.push({ ...customerData, ...policyData });
                    });
                }
            });

            const csvContent = [
                allHeaders.map(formatCsvCell).join(','),
                ...csvRows.map(row => allHeaders.map(header => formatCsvCell(row[header])).join(','))
            ].join('\n');

            downloadBlob(csvContent, `customer_dossiers_${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8;');
        }
    };
    
    const handleExport = (exportFormat: 'csv' | 'pdf') => {
        if (reportType === 'customerDetail' && selectedCustomerIds.length > 0) {
            exportCustomerDossier(exportFormat);
            return;
        }

        if (finalData.length === 0) { alert("No data available to export."); return; }
        const headers = currentColumns.map(c => c.label);
        const data = finalData.map(row =>
            currentColumns.map(col => {
                const keys = col.key.split('.');
                let value: any = row;
                for (const key of keys) {
                    if (value && typeof value === 'object' && key in value) { value = value[key]; } 
                    else { value = undefined; break; }
                }
                if (col.render) {
                    const rendered = col.render(row);
                    if (React.isValidElement(rendered)) {
                        const childContent = (rendered.props as any).children;
                        return String(childContent ?? 'N/A');
                    }
                    return String(rendered ?? 'N/A');
                }
                if (value && typeof value === 'object') {
                    if (Array.isArray(value)) return value.join(', ');
                    if (value.__type === 'table') {
                         const tableRows = value.rows || [];
                         return tableRows.map((r: string[]) => r.join('|')).join('; ');
                    }
                    return JSON.stringify(value);
                }
                return String(value ?? 'N/A');
            })
        );
        const safeReportType = reportType.replace(/([A-Z])/g, '_$1').toLowerCase();
        const filename = `${safeReportType}_report_${format(new Date(), 'yyyy-MM-dd')}`;
        const reportTitle = `${reportType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Report (${startDate} to ${endDate})`;
        
        if (exportFormat === 'csv') {
            const csvContent = [headers.map(formatCsvCell).join(','), ...data.map(d => d.map(formatCsvCell).join(','))].join('\n');
            downloadBlob(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
        } else {
            const doc = new jsPDF({ orientation: currentColumns.length > 7 ? 'landscape' : 'portrait' });
            (doc as jsPDFWithAutoTable).text(reportTitle, 14, 15);
            (doc as jsPDFWithAutoTable).autoTable({
                head: [headers],
                body: data,
                startY: 20, theme: 'grid', styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });
            doc.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><BarChart3 size={24} />Advanced Reports</h2>
                <div className="flex items-center gap-2">
                    <Button variant="primary" onClick={() => handleExport('pdf')} disabled={finalData.length === 0 && selectedCustomerIds.length === 0}><Download size={16} /> PDF</Button>
                    <Button variant="secondary" onClick={() => handleExport('csv')} disabled={finalData.length === 0 && selectedCustomerIds.length === 0}><Download size={16} /> CSV</Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <SearchableSelect
                        label="Report Type"
                        options={[
                            { value: 'comparativeBusiness', label: 'Comparative Business' },
                            { value: 'businessVertical', label: 'Business Vertical Performance' },
                            { value: 'customerDetail', label: 'Customer Details' },
                            { value: 'policies', label: 'Policies' }, { value: 'commissions', label: 'Commissions' },
                            { value: 'manualCommissions', label: 'Manual Commissions' },
                            { value: 'expenses', label: 'Expenses' }, { value: 'income', label: 'Manual Income' },
                            { value: 'attendance', label: 'Staff Attendance' }, { value: 'taskPerformance', label: 'Task Performance' },
                            { value: 'leadConversion', label: 'Lead Conversion' },
                        ]}
                        value={reportType} onChange={(val) => setReportType(val as ReportType)}
                    />
                    {reportType === 'policies' && <SearchableSelect label="Filter by Policy Type" options={policyTypeOptions} value={policyTypeFilter} onChange={val => { setPolicyTypeFilter(val); setSubTypeFilter('all'); }} />}
                    <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    
                    <SearchableSelect label="Filter by Branch" options={branchOptions} value={branchFilter} onChange={setBranchFilter} />
                    <SearchableSelect label="Filter by Advisor" options={advisorOptions} value={advisorFilter} onChange={setAdvisorFilter} />
                    
                    {reportType === 'policies' && (
                        <>
                            {subTypeOptions.length > 0 && (
                                <SearchableSelect label="Filter by Sub-Type" options={subTypeOptions} value={subTypeFilter} onChange={setSubTypeFilter} />
                            )}
                            <SearchableSelect label="Filter by Agency" options={companyOptions} value={companyFilter} onChange={setCompanyFilter} />
                            <SearchableSelect label="Filter by Scheme" options={schemeOptions} value={schemeFilter} onChange={setSchemeFilter} />
                        </>
                    )}
                </div>

                {reportType === 'customerDetail' && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <SearchableSelect 
                            label="Filter by Customer Name (for Dossier Export)" 
                            options={customerOptions} 
                            value={selectedCustomerIds}
                            onChange={setSelectedCustomerIds}
                            isMulti={true}
                            placeholder="Select one or more customers..." 
                        />
                    </div>
                )}
                 <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center gap-6">
                    {reportType === 'customerDetail' && (
                         <label className="flex items-center gap-2 cursor-pointer">
                            <ToggleSwitch enabled={showAllCustomerFields} onChange={setShowAllCustomerFields} srLabel="Toggle all customer fields" />
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show All Fields in Table</span>
                        </label>
                    )}
                    {reportType === 'policies' && (
                        <div className="flex items-center gap-2">
                             <label className={`flex items-center gap-2 ${policyTypeFilter === 'all' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                <ToggleSwitch enabled={showAllPolicyFields && policyTypeFilter !== 'all'} onChange={setShowAllPolicyFields} srLabel="Toggle all policy fields" disabled={policyTypeFilter === 'all'} />
                                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show All Fields in Table</span>
                            </label>
                            {policyTypeFilter === 'all' && (
                                <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-500 gap-1">
                                    <Info size={14} />
                                    <span>Select a specific policy type to enable this.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{reportType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Report ({finalData.length} records)</h3>
                    {['comparativeBusiness', 'policies', 'commissions', 'expenses', 'income', 'manualCommissions', 'businessVertical'].includes(reportType) && (
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
                            <Button size="small" variant={viewMode === 'table' ? 'light' : 'ghost'} onClick={() => setViewMode('table')} className="flex items-center gap-1"><BarChartHorizontal size={14}/> Table</Button>
                            <Button size="small" variant={viewMode === 'chart' ? 'light' : 'ghost'} onClick={() => setViewMode('chart')} className="flex items-center gap-1"><PieChartIcon size={14}/> Chart</Button>
                        </div>
                    )}
                </div>

                {viewMode === 'chart' ? (
                     <div className="p-4 h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            {reportType === 'comparativeBusiness' ? (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="totalPremium" fill="#8884d8" name="Premium" />
                                    <Bar dataKey="net" fill="#82ca9d" name="Net Profit" />
                                </BarChart>
                            ) : (
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="value" fill="#3B82F6" name={
                                        reportType === 'policies' ? 'Total Premium' :
                                        reportType.includes('commission') ? 'Total Commission' : 'Total Amount'
                                    } />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                         {finalData.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>{currentColumns.map(col => (<th key={col.key} className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{col.label}</th>))}</tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {finalData.map((row, index) => (<tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                        {currentColumns.map(col => {
                                            const keys = col.key.split('.');
                                            let value: any = row;
                                            for(const key of keys) {
                                                if (value && typeof value === 'object' && key in value) { value = value[key]; } 
                                                else { value = undefined; break; }
                                            }
                                            return (
                                                <td key={`${col.key}-${index}`} className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                    {col.render ? col.render(row) : (value ?? 'N/A')}
                                                </td>
                                            );
                                        })}
                                    </tr>))}
                                </tbody>
                                {grandTotals && (
                                    <tfoot className="bg-gray-100 dark:bg-gray-700/80">
                                        <tr>
                                            {currentColumns.map((col, index) => (
                                                <td key={`total-${col.key}`} className="px-4 py-3 font-bold text-gray-800 dark:text-white whitespace-nowrap">
                                                    {index === 0 ? "Grand Total" : col.isNumeric ? toLocaleCurrency(grandTotals[col.key]) : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                         ) : (
                            <div className="text-center py-16 text-gray-500">
                                <FileX size={40} className="mx-auto mb-2" /><h4 className="font-semibold">No Data Found</h4>
                                <p className="text-xs">Adjust your filters or select a different report type.</p>
                            </div>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedReports;