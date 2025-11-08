import React, { useState, useMemo, useEffect } from 'react';
import { Role, RolePermissions, AppModule, PermissionLevel } from '../../types';

import Button from '../ui/Button';
import SearchableSelect from '../ui/SearchableSelect';
import { Save, Lock } from 'lucide-react';

interface RolePermissionsManagerProps {
    roles: Role[];
    rolePermissions: RolePermissions[];
    onUpdate: (permissions: RolePermissions) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canModify: boolean;
}

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({ roles, rolePermissions, onUpdate, addToast, canModify }) => {
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
        { key: 'masterData', name: 'Master Data' },
    ];

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Manage Role Permissions
                </h3>
            </div>

            <SearchableSelect
                label="Select Role"
                options={roleOptions}
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                placeholder="Search for a role..."
            />

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

export default RolePermissionsManager;