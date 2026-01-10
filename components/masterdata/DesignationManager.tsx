import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Designation, User } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Save, Edit2, Trash2 } from 'lucide-react';
import SearchBar from '../ui/SearchBar'; 

interface DesignationManagerProps {
    items: Designation[];
    onUpdate: (items: Designation[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    users: User[];
    canCreate: boolean;
    canModify: boolean;
}

const DesignationRuleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Designation>) => void;
    initialData: Partial<Designation> | null;
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, canModify }) => {

    const [name, setName] = useState('');
    const [rank, setRank] = useState<string>(''); 

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setRank(initialData.rank?.toString() || ''); 
        }
    }, [isOpen, initialData]);

    const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[0-9]*$/.test(val)) {
            setRank(val);
        }
    };

    const handleSaveClick = () => {
        if (!name.trim()) {
            alert('Designation name is required.');
            return;
        }

        onSave({
            ...initialData,
            name,
            rank: rank === '' ? undefined : parseInt(rank, 10),
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
            <form onSubmit={e => { e.preventDefault(); handleSaveClick(); }}>
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">{initialData?.id ? 'Edit' : 'Add'} Designation</h2>
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
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={!canModify}>Save Designation</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};


const DesignationManager: React.FC<DesignationManagerProps> = ({ items, onUpdate, addToast, users, canCreate, canModify }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Designation> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const openModal = (item: Designation | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
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
        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    }, [items, searchQuery]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-4">
                 <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Designations</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <SearchBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        placeholder="Search Designations..."
                        className="w-full sm:w-64"
                    />
                    {canCreate && (
                        <Button onClick={(e) => openModal(null, e)} variant="primary" className="w-full sm:w-auto whitespace-nowrap">
                            <Plus size={16}/> Add Designation
                        </Button>
                    )}
                </div>
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

export default DesignationManager;