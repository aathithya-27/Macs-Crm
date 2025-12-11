import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AccountCategory, AccountSubCategory, AccountHead } from '../../types.ts';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import Modal from '../ui/Modal.tsx';
import ToggleSwitch from '../ui/ToggleSwitch.tsx';
import { Plus, Edit2, X } from 'lucide-react';
import SearchBar from '../ui/SearchBar.tsx';

interface AccountCategoryManagerProps {
    categories: AccountCategory[];
    subCategories: AccountSubCategory[];
    heads: AccountHead[];
    onUpdateCategories: (data: AccountCategory[]) => void;
    onUpdateSubCategories: (data: AccountSubCategory[]) => void;
    onUpdateHeads: (data: AccountHead[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

type EntityType = 'Category' | 'SubCategory' | 'Head';

interface ModalState {
    isOpen: boolean;
    type: EntityType;
    data: any | null;
    parentId?: string;
}

interface FormProps {
    type: EntityType;
    initialData: any | null;
    parentId: string;
    categories: AccountCategory[];
    subCategories: AccountSubCategory[];
    canModify: boolean;
    onCancel: () => void;
    onSave: (formData: any) => void;
    addToast: (msg: string, type: 'success' | 'error') => void;
}

const AccountCategoryForm: React.FC<FormProps> = ({
    type, initialData, parentId, categories, subCategories, canModify, onCancel, onSave, addToast
}) => {
    const [formData, setFormData] = useState({ 
        name: initialData?.name || '', 
        parentId: initialData ? (type === 'SubCategory' ? initialData.categoryId : initialData.subCategoryId) : parentId, 
        postingBank: initialData?.postingBank || false,
        isCash: initialData?.isCash || false 
    });

    const [warningMessage, setWarningMessage] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return addToast('Name is required', 'error');

        if (type === 'Head' && formData.postingBank && formData.isCash) {
            setWarningMessage('Only one flag can be selected. Please choose either Posting Bank or Is Cash, not both.');
            return;
        }

        onSave(formData);
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {initialData ? 'Edit' : 'Add'} {type === 'Category' ? 'Account Category' : (type === 'SubCategory' ? 'Sub-Category' : 'Account Head')}
                </h2>
                <fieldset disabled={!canModify}>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {type === 'SubCategory' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Category</label>
                                <select 
                                    value={formData.parentId} 
                                    onChange={e => handleInputChange('parentId', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" 
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        {type === 'Head' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Sub-Category</label>
                                <select 
                                    value={formData.parentId} 
                                    onChange={e => handleInputChange('parentId', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" 
                                    required
                                >
                                    <option value="">Select Sub-Category</option>
                                    {subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                </select>
                            </div>
                        )}
                        <Input 
                            label={`${type} Name`} 
                            value={formData.name} 
                            onChange={e => handleInputChange('name', e.target.value)}
                            required 
                            ref={inputRef}
                        />
                        {type === 'Head' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-600">
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Posting Bank</label>
                                    <ToggleSwitch 
                                        enabled={formData.postingBank} 
                                        onChange={(enabled) => {
                                            if (enabled && formData.isCash) {
                                                setWarningMessage('Only one flag can be selected. Please turn off Is Cash first.');
                                                return;
                                            }
                                            handleInputChange('postingBank', enabled);
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-600">
                                    <label className="font-medium text-gray-700 dark:text-gray-300">Is Cash</label>
                                    <ToggleSwitch 
                                        enabled={formData.isCash} 
                                        onChange={(enabled) => {
                                            if (enabled && formData.postingBank) {
                                                setWarningMessage('Only one flag can be selected. Please turn off Posting Bank first.');
                                                return;
                                            }
                                            handleInputChange('isCash', enabled);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </fieldset>
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                </div>
            </form>

            {}
            {warningMessage && (
                <Modal 
                    isOpen={!!warningMessage} 
                    onClose={() => setWarningMessage('')} 
                    contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
                >
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <X className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Warning</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{warningMessage}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        <Button variant="secondary" onClick={() => setWarningMessage('')}>OK</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};

const AccountCategoryManager: React.FC<AccountCategoryManagerProps> = ({
    categories, subCategories, heads,
    onUpdateCategories, onUpdateSubCategories, onUpdateHeads,
    addToast, canCreate, canModify
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState<ModalState>({ isOpen: false, type: 'Category', data: null });

    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return { categories, subCategories, heads };
        }

        const lowerQuery = searchQuery.toLowerCase();

        const matchingHeads = new Set(heads.filter(h => h.name.toLowerCase().includes(lowerQuery)).map(h => h.id));
        const subCategoryIdsFromHeads = new Set(Array.from(matchingHeads).map(hid => heads.find(h => h.id === hid)?.subCategoryId));

        const matchingSubCategories = new Set(subCategories.filter(sc =>
            sc.name.toLowerCase().includes(lowerQuery) || subCategoryIdsFromHeads.has(sc.id)
        ).map(sc => sc.id));
        const categoryIdsFromSubCategories = new Set(Array.from(matchingSubCategories).map(scid => subCategories.find(sc => sc.id === scid)?.categoryId));

        const matchingCategories = new Set(categories.filter(c =>
            c.name.toLowerCase().includes(lowerQuery) || categoryIdsFromSubCategories.has(c.id)
        ).map(c => c.id));

        return {
            categories: categories.filter(c => matchingCategories.has(c.id)),
            subCategories: subCategories.filter(sc => matchingSubCategories.has(sc.id) || matchingCategories.has(sc.categoryId)),
            heads: heads.filter(h => matchingHeads.has(h.id) || matchingSubCategories.has(h.subCategoryId))
        };
    }, [searchQuery, categories, subCategories, heads]);
    
    const openModal = useCallback((type: EntityType, data: any = null, parentId: string = '') => {
        setModal({ isOpen: true, type, data, parentId });
    }, []);

    const handleSaveData = (formData: any) => {
        const isEdit = !!modal.data;
        const id = modal.data?.id || `${modal.type.toLowerCase()}-${Date.now()}`;

        if (modal.type === 'Category') {
            const newCat: AccountCategory = {
                id,
                name: formData.name,
                active: modal.data?.active ?? true,
                order: categories.length
            };
            const updated = isEdit ? categories.map(c => c.id === id ? newCat : c) : [...categories, newCat];
            onUpdateCategories(updated);
        } else if (modal.type === 'SubCategory') {
            const newSub: AccountSubCategory = {
                id,
                name: formData.name,
                categoryId: formData.parentId,
                active: modal.data?.active ?? true,
                order: subCategories.length
            };
            const updated = isEdit ? subCategories.map(sc => sc.id === id ? newSub : sc) : [...subCategories, newSub];
            onUpdateSubCategories(updated);
        } else if (modal.type === 'Head') {
            const newHead: AccountHead = {
                id,
                name: formData.name,
                subCategoryId: formData.parentId,
                active: modal.data?.active ?? true,
                order: heads.length,
                postingBank: formData.postingBank,
                isCash: formData.isCash
            };
            const updated = isEdit ? heads.map(h => h.id === id ? newHead : h) : [...heads, newHead];
            onUpdateHeads(updated);
        }

        addToast(`${modal.type} saved successfully`, 'success');
        setModal({ isOpen: false, type: 'Category', data: null });
    };

    const toggleActive = (type: EntityType, id: string, currentStatus: boolean) => {
        if (!canModify) return;
        if (type === 'Category') onUpdateCategories(categories.map(c => c.id === id ? { ...c, active: !currentStatus } : c));
        else if (type === 'SubCategory') onUpdateSubCategories(subCategories.map(sc => sc.id === id ? { ...sc, active: !currentStatus } : sc));
        else onUpdateHeads(heads.map(h => h.id === id ? { ...h, active: !currentStatus } : h));
    };
    
    const handleHeadToggle = (item: AccountHead, field: 'postingBank' | 'isCash', currentValue: boolean) => {
        if (!canModify) return;
        const newValue = !currentValue;
        
        const updated = heads.map(h => {
            if (h.id === item.id) {
                return {
                    ...h,
                    [field]: newValue,
                    ...(newValue && field === 'postingBank' ? { isCash: false } : {}),
                    ...(newValue && field === 'isCash' ? { postingBank: false } : {})
                };
            }
            return h;
        });
        onUpdateHeads(updated);
    };

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Account Category Management</h3>
            <div className="my-4">
                <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search all categories, sub-categories, and heads..." />
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Account Categories</h3>
                    {canCreate && (<Button variant="primary" onClick={() => openModal('Category')}><Plus size={16} /> Add Category</Button>)}
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-28">Status</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredData.categories.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center">
                                            <ToggleSwitch enabled={!!item.active} onChange={() => toggleActive('Category', item.id, !!item.active)} disabled={!canModify} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center gap-2">
                                            <Button size="small" variant="light" onClick={() => openModal('Category', item)} disabled={!canModify}><Edit2 size={14} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Account Sub-Categories</h3>
                    {canCreate && (<Button variant="primary" onClick={() => openModal('SubCategory')}><Plus size={16} /> Add Sub-Category</Button>)}
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-2/5">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-2/5">Category</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-28">Status</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredData.subCategories.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{categories.find(c => c.id === item.categoryId)?.name || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center">
                                            <ToggleSwitch enabled={!!item.active} onChange={() => toggleActive('SubCategory', item.id, !!item.active)} disabled={!canModify} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center gap-2">
                                            <Button size="small" variant="light" onClick={() => openModal('SubCategory', item)} disabled={!canModify}><Edit2 size={14} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Account Heads</h3>
                    {canCreate && (<Button variant="primary" onClick={() => openModal('Head')}><Plus size={16} /> Add Head</Button>)}
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-1/4">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase w-1/4">Sub-Category</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-24">Posting Bank</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-24">Is Cash</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-20">Status</th>
                                <th className="px-4 py-2 text-center text-xs font-bold uppercase w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredData.heads.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{subCategories.find(sc => sc.id === item.subCategoryId)?.name || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center">
                                            <ToggleSwitch enabled={!!item.postingBank} onChange={() => handleHeadToggle(item, 'postingBank', !!item.postingBank)} disabled={!canModify} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center">
                                            <ToggleSwitch enabled={!!item.isCash} onChange={() => handleHeadToggle(item, 'isCash', !!item.isCash)} disabled={!canModify} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center">
                                            <ToggleSwitch enabled={!!item.active} onChange={() => toggleActive('Head', item.id, !!item.active)} disabled={!canModify} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center gap-2">
                                            <Button size="small" variant="light" onClick={() => openModal('Head', item)} disabled={!canModify}><Edit2 size={14} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            {modal.isOpen && (
                <Modal
                    isOpen={modal.isOpen}
                    onClose={() => setModal({ ...modal, isOpen: false })}
                    contentClassName="bg-white dark:bg-[#2D3748] p-8 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200"
                >
                    <AccountCategoryForm 
                        type={modal.type}
                        initialData={modal.data}
                        parentId={modal.parentId || ''}
                        categories={categories}
                        subCategories={subCategories}
                        canModify={canModify}
                        onCancel={() => setModal({ ...modal, isOpen: false })}
                        onSave={handleSaveData}
                        addToast={addToast}
                    />
                </Modal>
            )}
        </div>
    );
};

export default AccountCategoryManager;