import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';

import { Member } from '../../types';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import SearchableSelect from '../ui/SearchableSelect';
import { Plus, Save, Edit2, Trash2, AlertTriangle, GripVertical, ArrowUp, ArrowDown, Search } from 'lucide-react';
import SearchBar from '../ui/SearchBar'; 


const SortableHeader: React.FC<{
    sortKey: string;
    label: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: string) => void;
    className?: string;
    reorderable?: boolean;
}> = ({ sortKey, label, sortConfig, onSort, className = '', reorderable }) => (
    <th className={`px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase ${className}`}>
        <button onClick={() => !reorderable && onSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100" disabled={reorderable}>
            {label}
            {!reorderable && (
                <div className="w-4">
                    {sortConfig.key === sortKey ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                        <ArrowUp size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            )}
        </button>
    </th>
);

interface GenericMasterManagerProps {
    title: string;
    items: any[];
    onUpdate: (items: any[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    noun: string;
    dependencyCheck?: (itemId: string) => { name: string; type: 'member' | 'field' | 'policy' | 'task' }[];
    extraFields?: {
        label: string;
        field: string;
        type: 'select' | 'boolean' | 'multiselect' | 'text';
        options?: {value: string; label: string}[];
    }[];
    reorderable?: boolean;
    showAddButton?: boolean;
    showSearchBar?: boolean;
    codeColumnDisplay?: 'default' | 'group' | 'hidden';
    onBeforeSave?: (item: any) => boolean;
    initialStateKey?: string;
    endStateKey?: string;
    onUpdateInitialState?: (itemId: string) => void;
    canCreate: boolean;
    canModify: boolean;
}

const modalInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";

const ItemForm = memo<{
    editingItem: any;
    onUpdate: (item: any) => void;
    noun: string;
    displayKey: string;
    extraFields?: any[];
    groupOptions: { value: string; label: string }[];
    onGroupOptionsUpdate: (options: { value: string; label: string }[]) => void;
    canModify: boolean;
}>(({ editingItem, onUpdate, noun, displayKey, extraFields, groupOptions, onGroupOptionsUpdate, canModify }) => {
    const handleFieldChange = useCallback((field: string, value: any) => {
        onUpdate({ ...editingItem, [field]: value });
    }, [editingItem, onUpdate]);

    const handleOptionChange = useCallback((index: number, value: string) => {
        const newOptions = [...(editingItem.options || [])];
        newOptions[index] = value;
        onUpdate({ ...editingItem, options: newOptions });
    }, [editingItem, onUpdate]);

    const addOption = useCallback(() => {
        onUpdate({ ...editingItem, options: [...(editingItem.options || []), ''] });
    }, [editingItem, onUpdate]);

    const removeOption = useCallback((index: number) => {
        const newOptions = (editingItem.options || []).filter((_: any, i: number) => i !== index);
        onUpdate({ ...editingItem, options: newOptions });
    }, [editingItem, onUpdate]);

    const handleHeaderChange = useCallback((type: 'column' | 'row', index: number, value: string) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        const newHeaders = [...(editingItem[headerKey] || [])];
        newHeaders[index] = value;
        onUpdate({ ...editingItem, [headerKey]: newHeaders });
    }, [editingItem, onUpdate]);

    const addHeader = useCallback((type: 'column' | 'row') => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        onUpdate({ ...editingItem, [headerKey]: [...(editingItem[headerKey] || []), ''] });
    }, [editingItem, onUpdate]);

    const removeHeader = useCallback((type: 'column' | 'row', index: number) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        const newHeaders = (editingItem[headerKey] || []).filter((_: any, i: number) => i !== index);
        onUpdate({ ...editingItem, [headerKey]: newHeaders });
    }, [editingItem, onUpdate]);

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <Input
                label={noun === 'Field' ? 'Field Label' : `${noun} Name`}
                value={editingItem?.[displayKey] || ''}
                onChange={e => handleFieldChange(displayKey, e.target.value)}
                autoFocus
            />
            {extraFields?.map(field => {
                if (field.type === 'boolean') {
                    return (
                        <div key={field.field} className="flex items-center justify-between gap-4 pt-2 border-t dark:border-gray-600">
                            <label htmlFor={field.field} className="font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                            <ToggleSwitch
                                enabled={!!editingItem?.[field.field]}
                                onChange={val => handleFieldChange(field.field, val)}
                            />
                        </div>
                    );
                }
                if (field.type === 'multiselect') {
                    return (
                        <div key={field.field} className="pt-2 border-t dark:border-gray-600">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                            <select
                                multiple
                                value={editingItem?.[field.field] || []}
                                onChange={e => {
                                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                                    handleFieldChange(field.field, selectedIds);
                                }}
                                className={`${modalInputClasses} h-32`}
                            >
                                {field.options
                                    ?.filter(opt => opt.value !== editingItem?.id)
                                    .map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple options.</p>
                        </div>
                    )
                }
                if (field.type === 'select') {
                    return (
                    <div key={field.field}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                        <select
                            value={editingItem?.[field.field] || ''}
                            onChange={e => handleFieldChange(field.field, e.target.value)}
                            className={modalInputClasses}
                        >
                            <option value="">Select...</option>
                            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    );
                }
                if (field.type === 'text') {
                    return (
                        <div key={field.field}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                            <input
                                type="text"
                                value={editingItem?.[field.field] || ''}
                                onChange={e => handleFieldChange(field.field, e.target.value)}
                                className={modalInputClasses}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                        </div>
                    );
                }
                return null;
            })}
            {noun === 'Field' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <SearchableSelect
                                label="Group Name (Optional)"
                                options={groupOptions}
                                value={editingItem?.group || ''}
                                onChange={value => handleFieldChange('group', value)}
                                onCreate={value => {
                                    if (value) {
                                        handleFieldChange('group', value);
                                        onGroupOptionsUpdate([...groupOptions, { value, label: value}]);
                                    }
                                }}
                                placeholder="Select or type..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column Span</label>
                            <select value={editingItem?.columnSpan || 1} onChange={e => handleFieldChange('columnSpan', parseInt(e.target.value, 10))} className={modalInputClasses}>
                                <option value={1}>1 Column (Default)</option>
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Type</label>
                        <select value={editingItem?.fieldType || 'text'} onChange={e => handleFieldChange('fieldType', e.target.value)} className={modalInputClasses}>
                            <option value="text">Text Input</option>
                            <option value="number">Number Input</option>
                            <option value="date">Date Input</option>
                            <option value="boolean">Toggle (Yes/No)</option>
                            <option value="select">Dropdown (Select)</option>
                            <option value="checkbox">Checkbox Group</option>
                            <option value="table">Table</option>
                        </select>
                    </div>
                    {['select', 'checkbox'].includes(editingItem?.fieldType) && (
                        <div className="space-y-2 p-3 border dark:border-gray-600 rounded-lg animate-fade-in">
                            <h4 className="text-sm font-semibold">Define Options</h4>
                            {(editingItem.options || []).map((option: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input label="" placeholder={`Option ${index + 1}`} value={option} onChange={e => handleOptionChange(index, e.target.value)} />
                                    <Button type="button" variant="danger" size="small" className="!p-2" onClick={() => removeOption(index)}><Trash2 size={14} /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="light" size="small" onClick={addOption}><Plus size={14} /> Add Option</Button>
                        </div>
                    )}
                    {editingItem?.fieldType === 'table' && (
                        <div className="space-y-4 p-3 border dark:border-gray-600 rounded-lg animate-fade-in">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Define Table Columns</h4>
                                {(editingItem.columnHeaders || ['']).map((header: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input label="" placeholder={`Column ${index + 1} Name`} value={header} onChange={e => handleHeaderChange('column', index, e.target.value)} />
                                        <Button type="button" variant="danger" size="small" className="!p-2" onClick={() => removeHeader('column', index)}><Trash2 size={14} /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="light" size="small" onClick={() => addHeader('column')}><Plus size={14} /> Add Column</Button>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Define Table Rows</h4>
                                {(editingItem.rowHeaders || ['']).map((header: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input label="" placeholder={`Row ${index + 1} Name`} value={header} onChange={e => handleHeaderChange('row', index, e.target.value)} />
                                        <Button type="button" variant="danger" size="small" className="!p-2" onClick={() => removeHeader('row', index)}><Trash2 size={14} /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="light" size="small" onClick={() => addHeader('row')}><Plus size={14} /> Add Row</Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

const GenericMasterManager: React.FC<GenericMasterManagerProps> = memo(({
    title, items, onUpdate, addToast, noun, dependencyCheck, extraFields, reorderable = false,showAddButton = true,
    showSearchBar = true, codeColumnDisplay = 'default', onBeforeSave, initialStateKey, endStateKey, onUpdateInitialState, canCreate, canModify
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToAction, setItemToAction] = useState<{id: string, name: string, action: 'toggle' | 'delete'} | null>(null);
    const [dependentItems, setDependentItems] = useState<{ name: string; type: 'member' | 'field' | 'policy' | 'task' }[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);

    const existingGroups = useMemo(() => {
        if (noun !== 'Field') return [];
        const groups = items.map(item => item.group).filter(Boolean);
        return [...new Set(groups)];
    }, [items, noun]);

    useEffect(() => {
        if (isModalOpen) {
            setGroupOptions(existingGroups.map(g => ({ value: g, label: g })));
        }
    }, [isModalOpen, existingGroups]);

    const displayKey = noun === 'Field' ? 'label' : 'name';

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            (item[displayKey] && item[displayKey].toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [items, searchQuery, displayKey]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const sortedItems = useMemo(() => {
        const sortableItems = [...filteredItems];
        if (reorderable) {
            return sortableItems.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                const dir = sortConfig.direction === 'asc' ? 1 : -1;

                if (aValue === null || aValue === undefined) return 1 * dir;
                if (bValue === null || bValue === undefined) return -1 * dir;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * dir;
                }

                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (aValue === bValue) ? 0 : aValue ? -1 * dir : 1 * dir;
                }

                if (aValue < bValue) return -1 * dir;
                if (aValue > bValue) return 1 * dir;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredItems, reorderable, sortConfig]);

    const openModal = useCallback((item: any | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        const defaultState = { id: null, name: '', label: '', fieldType: 'text', columnHeaders: [''], rowHeaders: [''], options: [''], columnSpan: 1, group: '' };
        const initialState = item ? { ...defaultState, ...item } : defaultState;

        if (initialState.fieldType === 'table') {
            if (!Array.isArray(initialState.columnHeaders) || initialState.columnHeaders.length === 0) initialState.columnHeaders = [''];
            if (!Array.isArray(initialState.rowHeaders) || initialState.rowHeaders.length === 0) initialState.rowHeaders = [''];
        }
        if (['select', 'checkbox'].includes(initialState.fieldType)) {
             if (!Array.isArray(initialState.options) || initialState.options.length === 0) initialState.options = [''];
        }

        setEditingItem(initialState);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setEditingItem(null);
        setIsModalOpen(false);
    }, []);

    const handleEditingItemUpdate = useCallback((updatedItem: any) => {
        setEditingItem(updatedItem);
    }, []);

    const handleGroupOptionsUpdate = useCallback((options: { value: string; label: string }[]) => {
        setGroupOptions(options);
    }, []);

    const handleSave = useCallback(() => {
        if (!canModify) return;
        const displayName = editingItem?.[displayKey];

        if (!editingItem || !displayName || !displayName.trim()) {
            return addToast(`${noun} ${noun === 'Field' ? 'Label' : 'Name'} cannot be empty.`, 'error');
        }

        if (onBeforeSave && !onBeforeSave(editingItem)) {
            return;
        }

        if (editingItem.id) {
            onUpdate(items.map(i => i.id === editingItem.id ? editingItem : i));
            addToast(`${noun} updated successfully.`, 'success');
        } else {
            if (items.some(i => i[displayKey].toLowerCase() === displayName.trim().toLowerCase())) {
                return addToast(`This ${noun} already exists.`, 'error');
            }
            const prefix = noun.toLowerCase().replace(/\s/g, '').substring(0, 3);
            const newId = `${prefix}-${Date.now()}`;

            const toCamelCase = (s: string) => s.replace(/[^a-zA-Z0-9 ]/g, "").replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase()).replace(/ /g, "");

            const newItem = {
                ...editingItem,
                id: newId,
                [displayKey]: displayName.trim(),
                fieldName: noun === 'Field' ? toCamelCase(displayName.trim()) : undefined,
                active: true,
                order: items.length
            };
            onUpdate([...items, newItem]);
            addToast(`${noun} added successfully.`, 'success');
        }
        closeModal();
    }, [canModify, editingItem, displayKey, addToast, noun, onBeforeSave, onUpdate, items, closeModal]);

    const performToggle = (id: string) => {
        onUpdate(items.map(i => i.id === id ? {...i, active: i.active === false ? true : false } : i));
    };

    const performDelete = (id: string) => {
        onUpdate(items.filter(i => i.id !== id));
        addToast(`${noun} deleted successfully.`, 'success');
    };

    const handleDelete = (item: any) => {
        if (dependencyCheck) {
            const dependents = dependencyCheck(item.id);
            if (dependents.length > 0) {
                setItemToAction({ id: item.id, name: item[displayKey], action: 'delete' });
                setDependentItems(dependents);
                setIsWarningModalOpen(true);
            } else {
                if(window.confirm(`Are you sure you want to delete this ${noun}? This action cannot be undone.`)) {
                   performDelete(item.id);
                }
            }
        } else {
            if(window.confirm(`Are you sure you want to delete this ${noun}? This action cannot be undone.`)) {
                performDelete(item.id);
            }
        }
    };

    const handleToggle = (item: any) => {
        if (item.active === false) {
            performToggle(item.id);
            return;
        }

        if (dependencyCheck) {
            const dependents = dependencyCheck(item.id);
            if (dependents.length > 0) {
                setItemToAction({ id: item.id, name: item[displayKey], action: 'toggle' });
                setDependentItems(dependents);
                setIsWarningModalOpen(true);
            } else {
                performToggle(item.id);
            }
        } else {
            performToggle(item.id);
        }
    };

    const confirmWarningAction = () => {
        if (itemToAction?.action === 'toggle') {
            performToggle(itemToAction.id);
        }
        setIsWarningModalOpen(false);
        setItemToAction(null);
        setDependentItems([]);
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

        const currentItems = [...items];
        const draggedIndex = currentItems.findIndex(item => item.id === draggedId);
        const targetIndex = currentItems.findIndex(item => item.id === dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = currentItems.splice(draggedIndex, 1);
        currentItems.splice(targetIndex, 0, draggedItem);

        const reorderedItems = currentItems.map((item, index) => ({ ...item, order: index }));

        onUpdate(reorderedItems);
    };
    const handleDragEnd = useCallback(() => setDraggedItemId(null), []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {showSearchBar && (
                         <SearchBar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            placeholder={`Search ${noun}s...`}
                            className="w-full sm:w-64"
                        />
                    )}
                    {showAddButton && canCreate && (
                        <Button onClick={(e) => openModal(null, e)} variant="primary" className="w-full sm:w-auto whitespace-nowrap">
                            <Plus size={16}/> Add New {noun}
                        </Button>
                    )}
                </div>
            </div>
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            {reorderable && <th className="px-2 py-3"></th>}
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase w-16">ID</th>
                            <SortableHeader
                                sortKey={codeColumnDisplay === 'group' ? 'group' : 'id'}
                                label={codeColumnDisplay === 'group' ? 'Group' : 'Code'}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                reorderable={reorderable}
                                className={codeColumnDisplay === 'hidden' ? 'hidden' : ''}
                            />
                            <SortableHeader sortKey={displayKey} label="Name" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            {extraFields?.filter(f => f.type === 'boolean').map(field => (
                                <SortableHeader key={field.field} sortKey={field.field} label={field.label} sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            ))}
                            {extraFields?.filter(f => f.type === 'text').map(field => (
                                <SortableHeader key={field.field} sortKey={field.field} label={field.label} sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            ))}
                            {initialStateKey && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Initial State</th>}
                            {endStateKey && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">End State</th>}
                            <SortableHeader sortKey="active" label="Status" sortConfig={sortConfig} onSort={handleSort} reorderable={reorderable} />
                            {noun !== 'Business Vertical' && noun !== 'Task Type' && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" onDragEnd={handleDragEnd}>
                        {sortedItems.map((item, index) => (
                            <tr
                                key={item.id}
                                draggable={reorderable && canModify}
                                onDragStart={e => reorderable && handleDragStart(e, item.id)}
                                onDragOver={e => reorderable && handleDragOver(e)}
                                onDrop={e => reorderable && handleDrop(e, item.id)}
                                className={`transition-all ${item.active === false ? 'opacity-60' : ''} ${draggedItemId === item.id ? 'opacity-30' : ''} ${reorderable && canModify ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-move' : ''}`}
                            >
                                {reorderable && <td className="px-2 py-3"><GripVertical size={16} className="text-gray-400" /></td>}
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className={`px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono ${codeColumnDisplay === 'hidden' ? 'hidden' : ''}`}>
                                    {codeColumnDisplay === 'group' ? (item.group || <span className="italic text-gray-400">N/A</span>) : item.id}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{item[displayKey]}</td>
                                {extraFields?.filter(f => f.type === 'boolean').map(field => (
                                    <td key={field.field} className="px-6 py-3 whitespace-nowrap">
                                        <ToggleSwitch
                                            enabled={!!item[field.field]}
                                            onChange={val => onUpdate(items.map(i => i.id === item.id ? { ...i, [field.field]: val } : i))}
                                            disabled={!canModify}
                                        />
                                    </td>
                                ))}
                                {extraFields?.filter(f => f.type === 'text').map(field => (
                                    <td key={field.field} className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                        {item[field.field] || '-'}
                                    </td>
                                ))}
                                {initialStateKey && onUpdateInitialState && (
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            name="initialStateRadio"
                                            checked={!!item[initialStateKey]}
                                            onChange={() => onUpdateInitialState(item.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            disabled={!canModify}
                                        />
                                    </td>
                                )}
                                {endStateKey && (
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <ToggleSwitch
                                            enabled={!!item[endStateKey]}
                                            onChange={val => onUpdate(items.map(i => i.id === item.id ? { ...i, [endStateKey]: val } : i))}
                                            disabled={!canModify}
                                        />
                                    </td>
                                )}
                                <td className="px-6 py-3 whitespace-nowrap"><ToggleSwitch enabled={item.active !== false} onChange={() => handleToggle(item)} disabled={!canModify} /></td>
                                {noun !== 'Business Vertical' && noun !== 'Task Type' && (
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => openModal(item, e)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Edit ${item.name}`} disabled={!canModify}><Edit2 size={16}/></button>
                                            {canModify && (
                                                <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600" aria-label={`Delete ${item.name}`}><Trash2 size={16}/></button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredItems.length === 0 && <div className="p-8 text-center text-gray-500">No {noun}s found.</div>}
            </div>

            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    contentClassName="bg-white dark:bg-[#2D3748] p-8 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200"
                    triggerRef={triggerButtonRef}
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingItem?.id ? 'Edit' : 'Add'} {noun}</h2>
                        <fieldset disabled={!canModify}>
                            <ItemForm
                                editingItem={editingItem}
                                onUpdate={handleEditingItemUpdate}
                                noun={noun}
                                displayKey={displayKey}
                                extraFields={extraFields?.filter(f => f.field !== 'postingBankName')}
                                groupOptions={groupOptions}
                                onGroupOptionsUpdate={handleGroupOptionsUpdate}
                                canModify={canModify}
                            />
                            {initialStateKey && (<div className="flex items-center justify-between gap-4 pt-2 border-t dark:border-gray-600"><label className="font-medium text-gray-700 dark:text-gray-300">Set as Initial State</label><ToggleSwitch enabled={!!editingItem?.[initialStateKey]} onChange={val => setEditingItem((prev: any) => prev ? { ...prev, [initialStateKey]: val } : null)}/></div>)}
                            {endStateKey && (<div className="flex items-center justify-between gap-4 pt-2 border-t dark:border-gray-600"><label className="font-medium text-gray-700 dark:text-gray-300">Set as End State</label><ToggleSwitch enabled={!!editingItem?.[endStateKey]} onChange={val => setEditingItem((prev: any) => prev ? { ...prev, [endStateKey]: val } : null)}/></div>)}
                        </fieldset>
                        <div className="flex justify-end gap-4 mt-8">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {isWarningModalOpen && (
                 <Modal isOpen={isWarningModalOpen} onClose={() => setIsWarningModalOpen(false)} contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {itemToAction?.action === 'delete' ? 'Cannot Delete' : `Deactivate "${itemToAction?.name}"?`}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {itemToAction?.action === 'delete' ? `This item is currently used by ${dependentItems.length} record(s) and cannot be deleted.` : `This item is currently used by ${dependentItems.length} record(s). Deactivating it may cause inconsistencies.`}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Used by: {dependentItems.slice(0, 3).map(m => m.name).join(', ')}{dependentItems.length > 3 ? ', and others.' : '.'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        {itemToAction?.action === 'toggle' ? (
                            <>
                                <Button variant="danger" onClick={confirmWarningAction}>Deactivate Anyway</Button>
                                <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>Cancel</Button>
                            </>
                        ) : (
                             <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>OK</Button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
});

export default GenericMasterManager;