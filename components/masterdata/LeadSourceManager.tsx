import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LeadSourceMaster } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Search, CornerDownRight, GripVertical } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface LeadSourceManagerProps {
    items: LeadSourceMaster[];
    onUpdate: (items: LeadSourceMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

const LeadSourceManager: React.FC<LeadSourceManagerProps> = ({ items, onUpdate, addToast, canCreate, canModify }) => {
    const [editingItem, setEditingItem] = useState<Partial<LeadSourceMaster> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ targetId: string | null; position: 'before' | 'after' | 'on' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const triggerButtonRef = useRef<HTMLButtonElement>(null);


    const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

    const visibleNodeIds = useMemo(() => {
        if (!searchQuery.trim()) {
            return null;
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        const visibleIds = new Set<string>();

        items.forEach(item => {
            if (item.name.toLowerCase().includes(lowerCaseQuery)) {
                visibleIds.add(item.id);
                let current = item;
                while (current.parentId && itemMap.has(current.parentId)) {
                    const parent = itemMap.get(current.parentId)!;
                    visibleIds.add(parent.id);
                    current = parent;
                }
            }
        });
        return visibleIds;
    }, [searchQuery, items, itemMap]);

    const openModal = (parentId: string | null, itemToEdit: LeadSourceMaster | null = null, event?: React.MouseEvent<HTMLElement>) => {
        if(event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        if (itemToEdit) {
            setEditingItem({ ...itemToEdit });
        } else {
            setEditingItem({
                id: undefined,
                name: '',
                parentId,
                allowReferrerSelection: false,
            });
        }
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
            addToast('Source name cannot be empty.', 'error');
            return;
        }

        let updatedItems;
        if (editingItem.id) {
            updatedItems = items.map(i => i.id === editingItem.id ? editingItem as LeadSourceMaster : i);
        } else {
            const siblings = items.filter(i => i.parentId === editingItem.parentId);
            const newItem: LeadSourceMaster = {
                id: `ls-${Date.now()}`,
                name: editingItem.name.trim(),
                parentId: editingItem.parentId || null,
                active: true,
                order: siblings.length,
                allowReferrerSelection: editingItem.allowReferrerSelection || false,
            };
            updatedItems = [...items, newItem];
        }
        onUpdate(updatedItems);
        closeModal();
    };

    const handleToggle = (id: string) => {
        const itemToToggle = items.find(i => i.id === id);
        if (!itemToToggle) return;

        const newStatus = !itemToToggle.active;
        const idsToUpdate = new Set<string>();
        const queue: string[] = [id];
        idsToUpdate.add(id);

        while (queue.length > 0) {
            const currentParentId = queue.shift()!;
            items.forEach(item => {
                if (item.parentId === currentParentId) {
                    idsToUpdate.add(item.id);
                    queue.push(item.id);
                }
            });
        }

        const updatedItems = items.map(item =>
            idsToUpdate.has(item.id) ? { ...item, active: newStatus } : item
        );

        onUpdate(updatedItems);
        addToast(`"${itemToToggle.name}" and all its sub-sources have been ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sourceId: string) => {
        e.stopPropagation();
        e.dataTransfer.setData('sourceId', sourceId);
        setDraggedItemId(sourceId);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setDraggedItemId(null);
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItemId || draggedItemId === targetId) {
            setDropIndicator(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const dropY = e.clientY - rect.top;
        const height = rect.height;

        if (dropY < height * 0.25) {
            setDropIndicator({ targetId, position: 'before' });
        } else if (dropY > height * 0.75) {
            setDropIndicator({ targetId, position: 'after' });
        } else {
            setDropIndicator({ targetId, position: 'on' });
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDropIndicator(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = e.dataTransfer.getData('sourceId');
        const indicator = dropIndicator;

        setDraggedItemId(null);
        setDropIndicator(null);

        if (!sourceId || !indicator || sourceId === indicator.targetId) {
            return;
        }

        const sourceItem = items.find(i => i.id === sourceId);
        if (!sourceItem) return;

        let currentParentId = indicator.targetId;
        while (currentParentId) {
            if (currentParentId === sourceId) {
                addToast("Cannot move an item into its own descendant.", "error");
                return;
            }
            currentParentId = items.find(i => i.id === currentParentId)?.parentId || null;
        }

        const sourceParentId = sourceItem.parentId;
        let newParentId: string | null = null;
        if (indicator.position === 'on' && indicator.targetId) {
            newParentId = indicator.targetId;
        } else {
            const targetItem = items.find(i => i.id === indicator.targetId);
            newParentId = targetItem ? targetItem.parentId : null;
        }
        
        let tempItems = items.map(i => i.id === sourceId ? { ...i, parentId: newParentId } : i);

        const newSiblings = tempItems.filter(i => i.parentId === newParentId);
        const draggedIndex = newSiblings.findIndex(i => i.id === sourceId);
        const [draggedItem] = newSiblings.splice(draggedIndex, 1);
        
        let targetIndexInNewSiblings = indicator.targetId ? newSiblings.findIndex(i => i.id === indicator.targetId) : -1;
        
        if (indicator.position === 'on') {
            newSiblings.push(draggedItem);
        } else if (targetIndexInNewSiblings !== -1) {
            if(indicator.position === 'after') targetIndexInNewSiblings++;
            newSiblings.splice(targetIndexInNewSiblings, 0, draggedItem);
        } else {
             newSiblings.push(draggedItem);
        }

        const reorderedNewSiblings = new Map(newSiblings.map((item, index) => [item.id, { ...item, order: index }]));
        
        const reorderedOldSiblings = new Map(tempItems.filter(i => i.parentId === sourceParentId).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map((item, index) => [item.id, { ...item, order: index }]));

        const finalItems = items.map(item => {
            if (reorderedNewSiblings.has(item.id)) return reorderedNewSiblings.get(item.id)!;
            if (reorderedOldSiblings.has(item.id)) return reorderedOldSiblings.get(item.id)!;
            return item;
        });

        onUpdate(finalItems);
        addToast('Lead source hierarchy updated.', 'success');
    };

    const Node: React.FC<{ source: LeadSourceMaster, level: number }> = ({ source, level }) => {
        const children = items.filter(i => i.parentId === source.id && (!visibleNodeIds || visibleNodeIds.has(i.id))).sort((a,b) => (a.order || 0) - (b.order || 0));

        const isDropTargetOn = dropIndicator?.targetId === source.id && dropIndicator.position === 'on';
        const isDropTargetBefore = dropIndicator?.targetId === source.id && dropIndicator.position === 'before';
        const isDropTargetAfter = dropIndicator?.targetId === source.id && dropIndicator.position === 'after';

        return (
            <div className="relative">
                {isDropTargetBefore && <div className="h-1 bg-blue-500 rounded-full mx-2 my-1"></div>}
                <div
                    draggable={canModify}
                    onDragStart={e => handleDragStart(e, source.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, source.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, source.id)}
                    className={`flex items-center gap-2 p-2 rounded-md border-2 transition-colors ${
                        isDropTargetOn ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' : 'border-transparent'
                    } ${source.active === false ? 'opacity-50' : ''} ${draggedItemId === source.id ? 'opacity-30' : ''}`}
                >
                    {level > 0 && <CornerDownRight size={16} className="text-gray-400" style={{ marginLeft: `${(level - 1) * 20}px` }}/>}
                    <div className="flex-grow">
                        <span className="font-medium text-gray-800 dark:text-gray-200" style={{ marginLeft: `${level === 0 ? 0 : 4}px` }}>{source.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ToggleSwitch enabled={source.active !== false} onChange={() => handleToggle(source.id)} disabled={!canModify}/>
                        {canCreate && <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openModal(source.id, null, e)}><Plus size={14}/></Button>}
                        <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openModal(source.parentId, source, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                    </div>
                </div>
                 {isDropTargetAfter && <div className="h-1 bg-blue-500 rounded-full mx-2 my-1"></div>}

                {children.map(child => <Node key={child.id} source={child} level={level + 1} />)}
            </div>
        );
    };

    const rootItems = items.filter(i => i.parentId === null && (!visibleNodeIds || visibleNodeIds.has(i.id))).sort((a,b) => (a.order || 0) - (b.order || 0));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Lead/Referral Management</h3>
                {canCreate && <Button onClick={(e) => openModal(null, null, e)} variant="primary"><Plus size={16}/> Add Lead Source</Button>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Build a hierarchy of your lead sources. Drag and drop to reorder or create sub-sources.
            </p>
            <div className="mb-4">
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search tree..."
                    className="w-full"
                />
            </div>
            <div
                onDragOver={e => handleDragOver(e, null)}
                onDrop={e => handleDrop(e, null)}
                onDragLeave={handleDragLeave}
                className={`p-4 border-2 border-dashed dark:border-gray-700 rounded-lg max-h-[60vh] overflow-y-auto space-y-1 min-h-[10rem] transition-colors ${
                    dropIndicator?.targetId === null ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                }`}
            >
                {rootItems.length > 0 ? (
                    rootItems.map(root => <Node key={root.id} source={root} level={0} />)
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        No matching sources found.
                    </div>
                )}
            </div>

            {isModalOpen && editingItem && (
                 <Modal isOpen={isModalOpen} onClose={closeModal}>
                     <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                         <div className="p-6">
                             <h2 className="text-xl font-bold text-brand-dark dark:text-white">{editingItem.id ? 'Edit' : 'Add'} Lead Source</h2>
                             {editingItem.parentId && <p className="text-sm text-gray-500">Adding as a sub-source to "{items.find(i => i.id === editingItem.parentId)?.name}"</p>}
                         </div>
                          <div className="p-6 overflow-y-auto flex-grow space-y-4">
                              <Input
                                  label="Source Name"
                                  value={editingItem.name || ''}
                                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                                  disabled={!canModify}
                              />
                              <div className="flex items-center gap-3 pt-2">
                                  <label htmlFor="allowReferrerSelection" className="font-medium text-gray-700 dark:text-gray-300">Allow Referrer Selection?</label>
                                  <ToggleSwitch
                                      enabled={!!editingItem.allowReferrerSelection}
                                      onChange={val => setEditingItem(prev => prev ? { ...prev, allowReferrerSelection: val } : null)}
                                      disabled={!canModify}
                                  />
                              </div>
                          </div>
                          <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                              <Button variant="primary" onClick={handleSave} disabled={!canModify}>Save</Button>
                          </div>
                     </form>
                 </Modal>
            )}
        </div>
    );
};

export default LeadSourceManager;