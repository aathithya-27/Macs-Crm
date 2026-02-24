import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';

import CompanyMasterManager from './CompanyMasterManager';
import BranchesManager from './BranchesManager';
import FinancialYearManager from './FinancialYearManager';
import DesignationManager from './DesignationManager';
import RoleManager from './RoleManager';
import RolePermissionsManager from './RolePermissionsManager';
import PolicyConfigurationManager from './PolicyConfigurationManager';
import BusinessVerticalsManager from './BusinessVerticalsManager';
import LeadSourceManager from './LeadSourceManager';
import SchemesAndMappingsManager from './SchemesAndMappingsManager';
import LeadStageManager from './LeadStageManager';
import GeographyManager from './GeographyManager';
import DocumentMastersManager from './DocumentMastersManager';
import TierAndGiftManager from './TierAndGiftManager';
import TaskStatusManager from './TaskStatusManager';
import RoutesManager from './RoutesManager';
import ReligionsAndFestivalsManager from './ReligionsAndFestivalsManager';
import AccountCategoryManager from './AccountCategoryManager';
import RelationshipTypesManager from './RelationshipTypesManager';
import CustomerSegmentsManager from './CustomerSegmentsManager';
import GendersManager from './GendersManager';
import MaritalStatusManager from './MaritalStatusManager';
import CustomerFieldManager from './CustomerFieldManager';
import TaskTypeManager from './TaskTypeManager';
import BankMastersManager from './BankMastersManager';
import CampaignMasterManager from './CampaignMasterManager';
import MasterDataRolePermissionsManager from './MasterDataRolePermissionsManager';

import {
    Member, Lead, User, BusinessVertical, LeadSourceMaster, SchemeMaster, Company, Branch, Geography, RelationshipType,
    DocumentMaster, InsuranceTypeDocumentRule, GiftMaster, TaskStatusMaster, CustomerCategory, BankMaster, CompanyInfo,
    CustomerSubCategory, CustomerGroup, TaskMaster, InsuranceTypeMaster, InsuranceFieldMaster, CustomerFieldMaster, Route as RouteType,
    Designation, Role, RolePermissions, CustomerTier, 
    AccountCategory, AccountSubCategory, AccountHead,
    Religion, Festival, FestivalDate, AMC, MutualFundScheme, MutualFundFieldMaster,
    Gender, MaritalStatus,InsuranceAgency, CustomerType, ProcessStageMaster, AccountType, FinancialYear, DocumentNumbering, LeadStageMaster, Task
} from '../../types';

import { Database, GitBranch, Building, SlidersHorizontal, Handshake, HandCoins, UserCog, Award, Lock, UserPlus, Calendar as CalendarIcon, Sparkles, Users, Workflow, HeartHandshake, Globe2, FileTextIcon, Landmark, CheckSquare, Heart, Venus, Route as RouteIcon, Layers, ChevronDown, Megaphone, Shield } from 'lucide-react';

interface MasterDataProps {
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    allLeads: Lead[];
    users: User[];
    allTasks: Task[];
    businessVerticals: BusinessVertical[];
    onUpdateBusinessVerticals: (data: BusinessVertical[]) => void;
    leadSources: LeadSourceMaster[];
    onUpdateLeadSources: (data: LeadSourceMaster[]) => void;
    schemes: SchemeMaster[];
    onUpdateSchemes: (data: SchemeMaster[]) => void;
    agencies: InsuranceAgency[];
    onUpdateAgencies: (data: InsuranceAgency[]) => void;
    Branches: Branch[];
    onUpdateBranches: (data: Branch[]) => void;
    CompanyInfo: CompanyInfo;
    onUpdateCompanyInfo: (data: CompanyInfo) => void;
    geographies: Geography[];
    onUpdateGeographies: (data: Geography[]) => void;
    relationshipTypes: RelationshipType[];
    onUpdateRelationshipTypes: (data: RelationshipType[]) => void;
    documentMasters: DocumentMaster[];
    onUpdateDocumentMasters: (data: DocumentMaster[]) => void;
    insuranceTypeDocumentRules: InsuranceTypeDocumentRule[];
    onUpdateInsuranceTypeDocumentRules: (data: InsuranceTypeDocumentRule[]) => void;
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
    insuranceTypes: InsuranceTypeMaster[];
    onUpdateInsuranceTypes: (data: InsuranceTypeMaster[]) => void;
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    customerFieldMasters: CustomerFieldMaster[];
    onUpdateCustomerFieldMasters: (data: CustomerFieldMaster[]) => void;
    currentUser: User | null;
    operatingCompanies: Company[];
    onUpdateOperatingCompanies: (data: Company) => void;
    routes: RouteType[];
    onUpdateRoutes: (data: RouteType[]) => void;
    designations: Designation[];
    onUpdateDesignations: (data: Designation[]) => void;
    roles: Role[];
    onUpdateRoles: (data: Role[]) => void;
    rolePermissions: RolePermissions[];
    onUpdateRolePermissions: (permissions: RolePermissions) => void;
    customerTierCalculationMethod: 'sumAssured' | 'premium';
    onUpdateCustomerTierCalculationMethod: (method: 'sumAssured' | 'premium') => void;
    
    accountCategories: AccountCategory[];
    onUpdateAccountCategories: (data: AccountCategory[]) => void;
    accountSubCategories: AccountSubCategory[];
    onUpdateAccountSubCategories: (data: AccountSubCategory[]) => void;
    accountHeads: AccountHead[];
    onUpdateAccountHeads: (data: AccountHead[]) => void;

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


export const MasterData: React.FC<MasterDataProps> = (props) => {
    const { currentUser, rolePermissions } = props;
    const location = useLocation();

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [focusArea, setFocusArea] = useState<'nav' | 'content'>('nav');
    const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);
    const mobileNavRef = useRef<HTMLDivElement>(null);
    const navContainerRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const navLinkRefs = useRef(new Map<string, HTMLElement>());

    const permissionLevel = useMemo(() => {
        if (!currentUser || !rolePermissions) return 'none';
        const userPermissions = rolePermissions.find(p => p.roleId === currentUser.roleId);
        return userPermissions?.permissions.masterData || 'none';
    }, [currentUser, rolePermissions]);

    const canCreate = permissionLevel === 'create' || permissionLevel === 'modify';
    const canModify = permissionLevel === 'modify';

    const campaignPermissionLevel = useMemo(() => {
        if (!currentUser || !rolePermissions) return 'none';
        const userPermissions = rolePermissions.find(p => p.roleId === currentUser.roleId);
        return userPermissions?.permissions.campaign || 'none';
    }, [currentUser, rolePermissions]);

    const canCreateCampaign = campaignPermissionLevel === 'create' || campaignPermissionLevel === 'modify';
    const canModifyCampaign = campaignPermissionLevel === 'modify';

    const masterDataVisibility = useMemo(() => {
        if (!currentUser || !rolePermissions) return {};
        const userPermissions = rolePermissions.find(p => p.roleId === currentUser.roleId);
        return (userPermissions?.permissions as any)?.masterDataVisibility || {};
    }, [currentUser, rolePermissions]);

    const allNavItems = useMemo(() => [
        { id: 'companyMaster', path: '/masterData/companyMaster', label: 'Company Master', icon: <Building size={18}/> },
        { id: 'branches', path: '/masterData/branches', label: 'Branch', icon: <GitBranch size={18}/> },
        { id: 'businessVerticals', path: '/masterData/businessVerticals', label: 'Business Vertical', icon: <Layers size={18}/> },
        { id: 'campaign', path: '/masterData/campaign', label: 'Campaign Master', icon: <Megaphone size={18} /> },
        { id: 'accountCategories', path: '/masterData/accountCategories', label: 'Account Categories', icon: <Layers size={18}/> },
        { id: 'bankMasters', path: '/masterData/bankMasters', label: 'Bank Master', icon: <Landmark size={18} /> },
        { id: 'schemesAndMappings', path: '/masterData/schemesAndMappings', label: 'Agencies & Schemes', icon: <Handshake size={18}/> },
        { id: 'designation', path: '/masterData/designation', label: 'Designation', icon: <UserCog size={18}/> },
        { id: 'role', path: '/masterData/role', label: 'Role', icon: <Award size={18}/> },
        { id: 'rolePermissions', path: '/masterData/rolePermissions', label: 'Role Permissions', icon: <Lock size={18}/> },
        { id: 'masterDataPermissions', path: '/masterData/masterDataPermissions', label: 'Master Data Permissions', icon: <Shield size={18}/> },
        { id: 'customerMaster', path: '/masterData/customerMaster', label: 'Add Customer Field', icon: <UserPlus size={18} /> },
        { id: 'financialYear', path: '/masterData/financialYear', label: 'Financial Year', icon: <CalendarIcon size={18}/> },
        { id: 'religionsAndFestivals', path: '/masterData/religionsAndFestivals', label: 'Religions & Festivals', icon: <Sparkles size={18}/> },
        { id: 'leadSources', path: '/masterData/leadSources', label: 'Lead/Referral', icon: <Users size={18}/> },
        { id: 'leadStageMaster', path: '/masterData/leadStageMaster', label: 'Lead Stage Master', icon: <Workflow size={18}/> },
        { id: 'relationshipTypes', path: '/masterData/relationshipTypes', label: 'Relationship', icon: <HeartHandshake size={18}/> },
        { id: 'geography', path: '/masterData/geography', label: 'Geography', icon: <Globe2 size={18}/> },
        { id: 'documentMasters', path: '/masterData/documentMasters', label: 'Document Master', icon: <FileTextIcon size={18}/> },
        { id: 'taskStatuses', path: '/masterData/taskStatuses', label: 'Task Status', icon: <CheckSquare size={18}/> },
        { id: 'customerSegments', path: '/masterData/customerSegments', label: 'Customer Segment', icon: <Users size={18}/> },
        { id: 'genders', path: '/masterData/genders', label: 'Gender', icon: <Venus size={18}/> },
        { id: 'maritalStatuses', path: '/masterData/maritalStatuses', label: 'Marital Status', icon: <Heart size={18}/> },
        { id: 'taskMasters', path: '/masterData/taskMasters', label: 'Task Type', icon: <CheckSquare size={18}/> },
        { id: 'tierManagement', path: '/masterData/tierManagement', label: 'Type & Gift Management', icon: <Award size={18}/> },
        { id: 'routes', path: '/masterData/routes', label: 'Routes', icon: <RouteIcon size={18}/> },
    ], []);

    const navItems = useMemo(() => {
        return allNavItems.filter(item => {
            const visibility = masterDataVisibility[item.id];
            return visibility !== 'hidden';
        });
    }, [allNavItems, masterDataVisibility]);

    const activeNavItem = useMemo(() => {
        return navItems.find(item => location.pathname.startsWith(item.path));
    }, [location.pathname, navItems]);
    const activeTabId = activeNavItem?.id || 'companyMaster';
    const activeLabel = activeNavItem?.label || 'Select a category';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
                setIsMobileNavOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
                if (lastFocusedElement && container.contains(lastFocusedElement)) {
                    lastFocusedElement.focus();
                } else {
                    const focusable = container.querySelector<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    focusable?.focus();
                }
            }
        } else {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && contentContainerRef.current?.contains(activeElement)) {
                setLastFocusedElement(activeElement);
            }
            
            const activeLink = navLinkRefs.current.get(activeTabId);
            if (activeLink) {
                activeLink.focus();
            } else {
                navContainerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
            }
        }
    }, [focusArea, activeTabId]);

    useEffect(() => {
        const contentNode = contentContainerRef.current;
        if (!contentNode) return;

        const handleContentKeyDown = (event: KeyboardEvent) => {
            const isModalOpen = !!document.querySelector('div[role="dialog"]');
            if (event.key === 'Escape' && !isModalOpen) {
                setFocusArea('nav');
                event.preventDefault();
                event.stopPropagation();
            }
        };

        if (focusArea === 'content') {
            contentNode.addEventListener('keydown', handleContentKeyDown, true);
        }

        return () => {
            contentNode.removeEventListener('keydown', handleContentKeyDown, true);
        };
    }, [focusArea]);

    return (
        <div className="flex flex-col xl:flex-row gap-6 xl:h-full">
            <div ref={navContainerRef} className="hidden xl:flex w-full xl:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex-col">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Database/> Master Data</h2>
                <nav className="flex-1 space-y-1.5 overflow-y-auto -mr-2 pr-2">
                    {navItems.map(item => (
                        <NavLink 
                            key={item.id} 
                            to={item.path} 
                            ref={(node) => {
                                if (node) navLinkRefs.current.set(item.id, node);
                                else navLinkRefs.current.delete(item.id);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === ' ') {
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }}
                            onClick={() => {
                                setFocusArea('content');
                                setLastFocusedElement(null);
                            }}
                            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="xl:hidden" ref={mobileNavRef}>
                <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white mb-4"><Database/> Master Data</div>
                <div className="relative">
                    <button onClick={() => setIsMobileNavOpen(prev => !prev)} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center">
                        <span>{activeLabel}</span>
                        <ChevronDown size={16} className={`transition-transform text-gray-500 dark:text-gray-400 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMobileNavOpen && (
                        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20 max-h-80 overflow-y-auto">
                            <ul className="py-1">
                                {navItems.map(item => (
                                    <li key={item.id}>
                                        <NavLink 
                                            to={item.path}
                                            ref={(node) => {
                                                if (node) navLinkRefs.current.set(item.id, node);
                                                else navLinkRefs.current.delete(item.id);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ') {
                                                    e.preventDefault();
                                                    e.currentTarget.click();
                                                }
                                            }}
                                            onClick={() => {
                                                setIsMobileNavOpen(false);
                                                setFocusArea('content');
                                                setLastFocusedElement(null);
                                            }} 
                                            className={({ isActive }) => `w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div ref={contentContainerRef} className="flex-1 xl:overflow-y-auto" tabIndex={-1} style={{ outline: 'none' }}>
                <Routes>
                    <Route path="/" element={<Navigate to="companyMaster" replace />} />
                    <Route path="companyMaster" element={<CompanyMasterManager operatingCompanies={props.operatingCompanies} onUpdateOperatingCompanies={props.onUpdateOperatingCompanies} currentUser={props.currentUser} geographies={props.geographies} canModify={canModify} />} />
                    <Route path="branches" element={<BranchesManager {...props} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="financialYear" element={<FinancialYearManager {...props} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="designation" element={<DesignationManager items={props.designations} onUpdate={props.onUpdateDesignations} addToast={props.addToast} users={props.users} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="role" element={<RoleManager items={props.roles} onUpdate={props.onUpdateRoles} addToast={props.addToast} users={props.users} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="rolePermissions" element={<RolePermissionsManager roles={props.roles} rolePermissions={props.rolePermissions} onUpdate={props.onUpdateRolePermissions} addToast={props.addToast} canModify={canModify} />} />
                    <Route path="businessVerticals" element={<BusinessVerticalsManager {...props} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="leadSources" element={<LeadSourceManager items={props.leadSources} onUpdate={props.onUpdateLeadSources} addToast={props.addToast} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="schemesAndMappings" element={<SchemesAndMappingsManager {...props} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="leadStageMaster" element={<LeadStageManager leadStageMasters={props.leadStageMasters} onUpdateLeadStageMasters={props.onUpdateLeadStageMasters} addToast={props.addToast} allLeads={props.allLeads} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="geography" element={<GeographyManager geographies={props.geographies} onUpdateGeographies={props.onUpdateGeographies} addToast={props.addToast} allMembers={props.allMembers} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="documentMasters" element={<DocumentMastersManager documentMasters={props.documentMasters} onUpdateDocumentMasters={props.onUpdateDocumentMasters} addToast={props.addToast} insuranceTypeDocumentRules={props.insuranceTypeDocumentRules} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="tierManagement" element={<TierAndGiftManager tiers={props.customerTiers} onUpdateTiers={props.onUpdateCustomerTiers} gifts={props.giftMasters} onUpdateGifts={props.onUpdateGiftMasters} addToast={props.addToast} calculationMethod={props.customerTierCalculationMethod} onUpdateCalculationMethod={props.onUpdateCustomerTierCalculationMethod} customerTypes={props.customerTypes} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="taskStatuses" element={<TaskStatusManager taskStatuses={props.taskStatuses} onUpdateTaskStatuses={props.onUpdateTaskStatuses} addToast={props.addToast} allTasks={props.allTasks} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="routes" element={<RoutesManager routes={props.routes} onUpdateRoutes={props.onUpdateRoutes} addToast={props.addToast} allMembers={props.allMembers} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="religionsAndFestivals" element={<ReligionsAndFestivalsManager {...props} canCreate={canCreate} canModify={canModify} />} />
                    
                    {}
                    <Route path="accountCategories" element={<AccountCategoryManager categories={props.accountCategories} subCategories={props.accountSubCategories} heads={props.accountHeads} onUpdateCategories={props.onUpdateAccountCategories} onUpdateSubCategories={props.onUpdateAccountSubCategories} onUpdateHeads={props.onUpdateAccountHeads} addToast={props.addToast} canCreate={canCreate} canModify={canModify} />} />
                    
                    <Route path="relationshipTypes" element={<RelationshipTypesManager relationshipTypes={props.relationshipTypes} onUpdateRelationshipTypes={props.onUpdateRelationshipTypes} addToast={props.addToast} allMembers={props.allMembers} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="customerSegments" element={<CustomerSegmentsManager {...props} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="genders" element={<GendersManager genders={props.genders} onUpdateGenders={props.onUpdateGenders} addToast={props.addToast} allMembers={props.allMembers} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="maritalStatuses" element={<MaritalStatusManager maritalStatuses={props.maritalStatuses} onUpdateMaritalStatuses={props.onUpdateMaritalStatuses} addToast={props.addToast} allMembers={props.allMembers} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="customerMaster" element={<CustomerFieldManager customerFieldMasters={props.customerFieldMasters} onUpdateCustomerFieldMasters={props.onUpdateCustomerFieldMasters} addToast={props.addToast} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="taskMasters" element={<TaskTypeManager taskMasters={props.taskMasters} onUpdateTaskMasters={props.onUpdateTaskMasters} addToast={props.addToast} allTasks={props.allTasks} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="bankMasters" element={<BankMastersManager bankMasters={props.bankMasters} onUpdateBankMasters={props.onUpdateBankMasters} accountTypes={props.accountTypes} onUpdateAccountTypes={props.onUpdateAccountTypes} addToast={props.addToast} allMembers={props.allMembers} canCreate={canCreate} canModify={canModify} />} />
                    <Route path="campaign" element={<CampaignMasterManager addToast={props.addToast} canCreate={canCreateCampaign} canModify={canModifyCampaign} />} />
                    <Route path="masterDataPermissions" element={<MasterDataRolePermissionsManager roles={props.roles} rolePermissions={props.rolePermissions} onUpdate={props.onUpdateRolePermissions} addToast={props.addToast} canModify={canModify} />} />
                </Routes>
            </div>
        </div>
    );
};