import React, { useState, useEffect } from 'react';
import { Role, RolePermissions, PermissionLevel } from '../../types';
import Button from '../ui/Button';
import { Save, AlertCircle, Check } from 'lucide-react';

interface MasterDataRolePermissionsManagerProps {
    roles: Role[];
    rolePermissions: RolePermissions[];
    onUpdate: (permissions: RolePermissions) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canModify: boolean;
}

type MasterDataModule = 
    | 'companyMaster'
    | 'branches'
    | 'businessVerticals'
    | 'campaign'
    | 'accountCategories'
    | 'bankMasters'
    | 'schemesAndMappings'
    | 'designation'
    | 'role'
    | 'rolePermissions'
    | 'customerMaster'
    | 'financialYear'
    | 'religionsAndFestivals'
    | 'leadSources'
    | 'leadStageMaster'
    | 'relationshipTypes'
    | 'geography'
    | 'documentMasters'
    | 'taskStatuses'
    | 'customerSegments'
    | 'genders'
    | 'maritalStatuses'
    | 'taskMasters'
    | 'tierManagement'
    | 'routes';

const masterDataModuleLabels: Record<MasterDataModule, string> = {
    companyMaster: 'Company Master',
    branches: 'Branch',
    businessVerticals: 'Business Vertical',
    campaign: 'Campaign Master',
    accountCategories: 'Account Categories',
    bankMasters: 'Bank Master',
    schemesAndMappings: 'Agencies & Schemes',
    designation: 'Designation',
    role: 'Role',
    rolePermissions: 'Role Permissions',
    customerMaster: 'Add Customer Field',
    financialYear: 'Financial Year',
    religionsAndFestivals: 'Religions & Festivals',
    leadSources: 'Lead/Referral',
    leadStageMaster: 'Lead Stage Master',
    relationshipTypes: 'Relationship',
    geography: 'Geography',
    documentMasters: 'Document Master',
    taskStatuses: 'Task Status',
    customerSegments: 'Customer Segment',
    genders: 'Gender',
    maritalStatuses: 'Marital Status',
    taskMasters: 'Task Type',
    tierManagement: 'Type & Gift Management',
    routes: 'Routes',
};

const visibilityOptions: { value: 'visible' | 'hidden'; label: string; color: string }[] = [
    { value: 'visible', label: 'Visible', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'hidden', label: 'Hidden', color: 'bg-red-100 text-red-800 border-red-200' },
];

const MasterDataRolePermissionsManager: React.FC<MasterDataRolePermissionsManagerProps> = ({ 
    roles, 
    rolePermissions, 
    onUpdate, 
    addToast, 
    canModify 
}) => {
    const [selectedRoleId, setSelectedRoleId] = useState<string>(roles.length > 0 ? roles[0].id : '');
    const [currentVisibility, setCurrentVisibility] = useState<{ [key in MasterDataModule]?: 'visible' | 'hidden' }>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (selectedRoleId) {
            const existingPerms = rolePermissions.find(p => p.roleId === selectedRoleId);
            const initializedVisibility: { [key in MasterDataModule]?: 'visible' | 'hidden' } = {};
            (Object.keys(masterDataModuleLabels) as MasterDataModule[]).forEach(module => {
                const visibilitySettings = (existingPerms?.permissions as any)?.masterDataVisibility;
                initializedVisibility[module] = visibilitySettings?.[module] || 'visible';
            });
            setCurrentVisibility(initializedVisibility);
            setHasUnsavedChanges(false);
        }
    }, [selectedRoleId, rolePermissions]);

    const handleVisibilityChange = (module: MasterDataModule, visibility: 'visible' | 'hidden') => {
        if (!canModify) return;
        setCurrentVisibility(prev => ({ ...prev, [module]: visibility }));
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        if (!selectedRoleId || !canModify) return;
        
        // Create a separate permissions object for master data visibility
        const existingPerms = rolePermissions.find(p => p.roleId === selectedRoleId);
        const visibilityPermissions: any = { ...existingPerms?.permissions };
        
        // Add visibility settings under a separate key
        visibilityPermissions.masterDataVisibility = currentVisibility;

        const updatedRolePermission: RolePermissions = {
            roleId: selectedRoleId,
            permissions: visibilityPermissions
        };

        onUpdate(updatedRolePermission);
        setHasUnsavedChanges(false);
        addToast('Master data tab visibility updated successfully', 'success');
    };

    const activeRoles = roles.filter(r => r.active);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Master Data Tab Visibility</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Control which master data tabs are visible for each role.</p>
                </div>
                
                <div className="w-full md:w-64">
                    <select 
                        value={selectedRoleId} 
                        onChange={(e) => {
                            if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Discard them?")) {
                                return;
                            }
                            setSelectedRoleId(e.target.value);
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {activeRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {(Object.entries(masterDataModuleLabels) as [MasterDataModule, string][]).map(([moduleKey, moduleName]) => (
                        <div key={moduleKey} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-medium text-gray-900 dark:text-white">{moduleName}</span>
                                {currentVisibility[moduleKey] === 'visible' && <Check size={16} className="text-green-500" />}
                            </div>
                            <div className="space-y-2">
                                {visibilityOptions.map((option) => (
                                    <label 
                                        key={option.value} 
                                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer border transition-all ${
                                            currentVisibility[moduleKey] === option.value 
                                                ? `${option.color} ring-1 ring-offset-1 dark:ring-offset-gray-800` 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name={`${moduleKey}-visibility`}
                                                value={option.value}
                                                checked={currentVisibility[moduleKey] === option.value}
                                                onChange={() => handleVisibilityChange(moduleKey, option.value)}
                                                disabled={!canModify}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-xs font-medium">{option.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t dark:border-gray-600 flex justify-between items-center sticky bottom-0">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {hasUnsavedChanges && (
                            <span className="flex items-center text-amber-600 dark:text-amber-400">
                                <AlertCircle size={16} className="mr-2" />
                                Unsaved changes
                            </span>
                        )}
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={!canModify || !hasUnsavedChanges} 
                        variant={hasUnsavedChanges ? 'primary' : 'secondary'}
                    >
                        <Save size={16} /> Save Visibility Settings
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MasterDataRolePermissionsManager;