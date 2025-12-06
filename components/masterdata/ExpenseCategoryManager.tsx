import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ExpenseCategoryLevel1, ExpenseCategoryLevel2 } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2 } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface ExpenseCategoryManagerProps {
    level1Data: ExpenseCategoryLevel1[];
    level2Data: ExpenseCategoryLevel2[];
    onUpdateLevel1: (data: ExpenseCategoryLevel1[]) => void;
    onUpdateLevel2: (data: ExpenseCategoryLevel2[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

type CategoryItem = ExpenseCategoryLevel1 | ExpenseCategoryLevel2;

const ExpenseCategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<CategoryItem>, level: 1 | 2) => void;
    initialData: Partial<CategoryItem> | null;
    level: 1 | 2;
    level1Data: ExpenseCategoryLevel1[];
    level2Data: ExpenseCategoryLevel2[];
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, level, level1Data, level2Data, canModify }) => {
    const [formData, setFormData] = useState({
        name: '',
        parentId: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const data = initialData as any;
                setFormData({
                    name: data.name || '',
                    parentId: data.parentId || ''
                });
            } else {
                setFormData({
                    name: '',
                    parentId: ''
                });
            }
        }
    }, [isOpen, initialData, level, level2Data]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            alert('Category name is required.');
            return;
        }

        if (level > 1 && !formData.parentId) {
            alert('A Expense Category must be selected.');
            return;
        }

        onSave({
            ...initialData,
            name: formData.name.trim(),
            parentId: formData.parentId || undefined,
            active: true
        }, level);
    };

    const getModalTitle = () => {
        const action = initialData?.id ? 'Edit' : 'Add';
        switch (level) {
            case 1: return `${action} Expense Category`;
            case 2: return `${action} Expense Head Category`;
            default: return 'Manage Category';
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">{getModalTitle()}</h2>
                    {level === 2 && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Expense Category</label>
                            <select 
                                value={formData.parentId} 
                                onChange={(e) => handleInputChange('parentId', e.target.value)}
                                className={selectClasses} 
                                required 
                                disabled={!canModify}
                            >
                                <option value="">-- Select Category --</option>
                                {level1Data.filter(l1 => l1.active).map(l1 => (
                                    <option key={l1.id} value={l1.id}>{l1.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Input label="Category Name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter category name" required disabled={!canModify} autoFocus />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

const ExpenseCategoryManager: React.FC<ExpenseCategoryManagerProps> = ({
    level1Data, level2Data, onUpdateLevel1, onUpdateLevel2, addToast, canCreate, canModify
}) => {
    const [modalState, setModalState] = useState<{ 
        isOpen: boolean; 
        level: 1 | 2; 
        data: Partial<CategoryItem> | null; 
    }>({ isOpen: false, level: 1, data: null });
    const [searchQuery, setSearchQuery] = useState('');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const level1TriggerRef = useRef<HTMLButtonElement>(null);
    const level2TriggerRef = useRef<HTMLButtonElement>(null);

    const openModal = (level: 1 | 2, data: Partial<CategoryItem> | null = null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) {
            const targetRef = level === 1 ? level1TriggerRef : level2TriggerRef;
            targetRef.current = event.currentTarget as HTMLButtonElement;
        }
        setModalState({ isOpen: true, level, data: data ? { ...data } : null });
    };

    const closeModal = () => {
        const currentLevel = modalState.level;
        setModalState({ isOpen: false, level: 1, data: null });
        if (currentLevel === 1) {
            level1TriggerRef.current?.focus();
        } else if (currentLevel === 2) {
            level2TriggerRef.current?.focus();
        }
    };

    const handleSave = (data: Partial<CategoryItem>, level: 1 | 2) => {
        if (!canModify) return;

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
                onUpdateLevel2(
                    l2Data.id
                        ? level2Data.map(i => i.id === l2Data.id ? (l2Data as ExpenseCategoryLevel2) : i)
                        : [...level2Data, { ...l2Data, id: `exp2-${Date.now()}` } as ExpenseCategoryLevel2]
                );
                break;
        }
        addToast('Category saved successfully!', 'success');
        closeModal();
    };

    const handleToggle = (level: 1 | 2, id: string) => {
        if (!canModify) return;
        const toggle = (items: any[], updateFn: (data: any[]) => void) => {
            updateFn(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
        };
        if (level === 1) toggle(level1Data, onUpdateLevel1);
        if (level === 2) toggle(level2Data, onUpdateLevel2);
    };

    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return { level1: level1Data, level2: level2Data };
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        const l2Matches = new Set(level2Data.filter(l2 => l2.name.toLowerCase().includes(lowerCaseQuery)).map(i => i.id));
        const l1ParentIdsFromL2 = new Set(level2Data.filter(l2 => l2Matches.has(l2.id)).map(l2 => l2.parentId));
        const l1Matches = new Set(level1Data.filter(l1 => l1.name.toLowerCase().includes(lowerCaseQuery) || l1ParentIdsFromL2.has(l1.id)).map(i => i.id));
        const finalL2 = level2Data.filter(l2 => l1Matches.has(l2.parentId) || l2Matches.has(l2.id));
        return {
            level1: level1Data.filter(l1 => l1Matches.has(l1.id)),
            level2: finalL2
        };
    }, [searchQuery, level1Data, level2Data]);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Expense Category Management
            </h3>
            <div className="my-4">
                <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search all categories..." className="w-full" />
            </div>
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Expense Category</h3>
                        {canCreate && (
                            <Button ref={level1TriggerRef} variant="primary" onClick={(e) => openModal(1, null, e)}><Plus size={16} /> Add Category</Button>
                        )}
                    </div>
                    <div className="overflow-x-auto max-h-60">
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
                                {filteredData.level1.map((item, index) => (
                                    <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                        <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.name}</td>
                                        <td className="px-4 py-2">
                                            <ToggleSwitch enabled={!!item.active} onChange={() => handleToggle(1, item.id)} disabled={!canModify} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Button size="small" variant="light" onClick={(e) => { level1TriggerRef.current = e.currentTarget; openModal(1, item, e); }} disabled={!canModify}><Edit2 size={14} /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Expense Head Category</h3>
                        {canCreate && (
                            <Button ref={level2TriggerRef} variant="primary" onClick={(e) => openModal(2, null, e)}><Plus size={16} /> Add Category</Button>
                        )}
                    </div>
                    <div className="overflow-x-auto max-h-60">
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
                                {filteredData.level2.map((item, index) => (
                                    <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                        <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.name}</td>
                                        <td className="px-4 py-2">
                                            <ToggleSwitch enabled={!!item.active} onChange={() => handleToggle(2, item.id)} disabled={!canModify} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <Button size="small" variant="light" onClick={(e) => { level2TriggerRef.current = e.currentTarget; openModal(2, item, e); }} disabled={!canModify}><Edit2 size={14} /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <ExpenseCategoryModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onSave={handleSave}
                initialData={modalState.data}
                level={modalState.level}
                level1Data={level1Data}
                level2Data={level2Data}
                canModify={canModify}
            />
        </div>
    );
};

export default ExpenseCategoryManager;