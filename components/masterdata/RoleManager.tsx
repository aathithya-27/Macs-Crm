import React, { useState, useRef, useMemo } from 'react';

import { Role, User } from '../../types';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface RoleManagerProps {
    items: Role[];
    onUpdate: (items: Role[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    users: User[];
    canCreate: boolean;
    canModify: boolean;
}

const RoleManager: React.FC<RoleManagerProps> = ({ items, onUpdate, addToast, users, canCreate, canModify }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Role> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    return (
        <div>
            {}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Roles</h3>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <SearchBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        placeholder="Search Roles..."
                        className="w-full md:w-64"
                    />
                    {canCreate && (
                        <Button onClick={(e) => openModal(null, e)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                            <Plus size={16}/> Add Role
                        </Button>
                    )}
                </div>
            </div>
            {}
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
                        {}
                        {filteredItems.map((item, index) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
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
                            <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default RoleManager;