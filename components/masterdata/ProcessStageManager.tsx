import React, { useState, useMemo, useRef } from 'react';
import { ProcessStageMaster, Member } from '../../types';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

interface ProcessStageManagerProps {
    title: string;
    items: ProcessStageMaster[];
    onUpdate: (items: ProcessStageMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    typeId: string | null; 
    canCreate: boolean;
    canModify: boolean;
}

const ProcessStageManager: React.FC<ProcessStageManagerProps> = ({
    title, items, onUpdate, addToast, allMembers, typeId, canCreate, canModify
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ProcessStageMaster> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const sortedItems = useMemo(() => [...items].sort((a, b) => (a.order || 0) - (b.order || 0)), [items]);

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

        if (editingItem.id) { 
            onUpdate(items.map(i => i.id === editingItem.id ? (editingItem as ProcessStageMaster) : i));
        } else {
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

    const handleToggle = (id: string) => {
        if (!canModify) return;
        onUpdate(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
    };

    const handleDelete = (id: string) => {
        if (!canModify) return;
        const stage = items.find(i => i.id === id);
        if (!stage || !typeId) return;

        const dependents = allMembers.filter(m => m.processStages && m.processStages[typeId] === stage.name);

        if (dependents.length > 0) {
            addToast(`Cannot delete: ${dependents.length} customer(s) are currently in this stage for this process flow.`, 'error');
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
                {canCreate && <Button onClick={(e) => openModal(null, e)} variant="primary"><Plus size={16}/> Add Stage</Button>}
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-2 py-3"></th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase w-16">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" onDragEnd={handleDragEnd}>
                        {sortedItems.map((item, index) => (
                            <tr
                                key={item.id}
                                draggable={canModify}
                                onDragStart={e => handleDragStart(e, item.id)}
                                onDragOver={handleDragOver}
                                onDrop={e => handleDrop(e, item.id)}
                                className={`transition-all ${!item.active ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''} ${canModify ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-move' : ''}`}
                            >
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
                <Modal isOpen={isModalOpen} onClose={closeModal} contentClassName="bg-white dark:bg-[#2D3748] rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6 space-y-4">
                            <h2 className="text-xl font-bold">{editingItem.id ? 'Edit' : 'Add'} Stage</h2>
                            <Input
                                label="Stage Name"
                                value={editingItem.name || ''}
                                onChange={e => setEditingItem(p => p ? {...p, name: e.target.value} : null)}
                                disabled={!canModify}
                                autoFocus
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ProcessStageManager;