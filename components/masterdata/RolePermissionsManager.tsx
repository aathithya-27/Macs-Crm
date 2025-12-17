import React, { useState, useEffect } from 'react';
import { Role, RolePermissions, AppModule, PermissionLevel } from '../../types';
import Button from '../ui/Button';
import { Save, AlertCircle, Check } from 'lucide-react';

interface RolePermissionsManagerProps {
    roles: Role[];
    rolePermissions: RolePermissions[];
    onUpdate: (permissions: RolePermissions) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canModify: boolean;
}

const moduleLabels: Record<AppModule, string> = {
    dashboard: 'Dashboard',
    'reports & insights': 'Reports & Insights',
    advancedReports: 'Advanced Reports',
    incomeAndExpense: 'Income & Expense',
    accounts: 'Profit & Loss',
    calendar: 'Calendar',
    employees: 'Employee Management',
    pipeline: 'Lead Pipeline',
    customers: 'Customers',
    taskManagement: 'Task Management',
    policies: 'Policies',
    mutualFunds: 'Mutual Funds',
    CrossSelling: 'CrossSelling',
    campaign: 'Campaigns',
    notes: 'Notes',
    actionHub: 'Action Hub',
    servicesHub: 'Services Hub',
    location: 'Location Services',
    chatbot: 'WhatsApp Chatbot',
    masterData: 'Master Data',
};

const permissionOptions: { value: PermissionLevel; label: string; color: string }[] = [
    { value: 'modify', label: 'Modify (Full Access)', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'create', label: 'Create/View', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'view', label: 'View Only', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'none', label: 'No Access', color: 'bg-red-100 text-red-800 border-red-200' },
];

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({ roles, rolePermissions, onUpdate, addToast, canModify }) => {
    const [selectedRoleId, setSelectedRoleId] = useState<string>(roles.length > 0 ? roles[0].id : '');
    const [currentPermissions, setCurrentPermissions] = useState<{ [key in AppModule]?: PermissionLevel }>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (selectedRoleId) {
            const existingPerms = rolePermissions.find(p => p.roleId === selectedRoleId);
            const initializedPerms: { [key in AppModule]?: PermissionLevel } = {};
            (Object.keys(moduleLabels) as AppModule[]).forEach(module => {
                initializedPerms[module] = existingPerms?.permissions[module] || 'none';
            });
            setCurrentPermissions(initializedPerms);
            setHasUnsavedChanges(false);
        }
    }, [selectedRoleId, rolePermissions]);

    const handlePermissionChange = (module: AppModule, level: PermissionLevel) => {
        if (!canModify) return;
        setCurrentPermissions(prev => ({ ...prev, [module]: level }));
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        if (!selectedRoleId || !canModify) return;
        
        const updatedRolePermission: RolePermissions = {
            roleId: selectedRoleId,
            permissions: currentPermissions
        };

        onUpdate(updatedRolePermission);
        setHasUnsavedChanges(false);
    };

    const activeRoles = roles.filter(r => r.active);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Role Permissions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure access levels for each module per role.</p>
                </div>
                
                {}
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

            {}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {(Object.entries(moduleLabels) as [AppModule, string][]).map(([moduleKey, moduleName]) => (
                        <div key={moduleKey} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-medium text-gray-900 dark:text-white">{moduleName}</span>
                                {currentPermissions[moduleKey] === 'modify' && <Check size={16} className="text-green-500" />}
                            </div>
                            <div className="space-y-2">
                                {permissionOptions.map((option) => (
                                    <label 
                                        key={option.value} 
                                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer border transition-all ${
                                            currentPermissions[moduleKey] === option.value 
                                                ? `${option.color} ring-1 ring-offset-1 dark:ring-offset-gray-800` 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name={`${moduleKey}-perm`}
                                                value={option.value}
                                                checked={currentPermissions[moduleKey] === option.value}
                                                onChange={() => handlePermissionChange(moduleKey, option.value)}
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
                
                {}
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
                        <Save size={16} /> Save Permissions
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RolePermissionsManager;