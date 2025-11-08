import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Branch, Company, User, Geography } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import SearchableSelect from '../ui/SearchableSelect';
import { Plus, Edit2, Search, ArrowUp, ArrowDown } from 'lucide-react';

const SortableHeader = React.memo<{
    sortKey: string;
    label: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: string) => void;
}>(({ sortKey, label, sortConfig, onSort }) => (
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">
        <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100">
            {label}
            <div className="w-4">
                {sortConfig.key === sortKey ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                ) : (
                    <ArrowUp size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </button>
    </th>
));

interface BranchesManagerProps {
    Branches: Branch[];
    onUpdateBranches: (data: Branch[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    operatingCompanies: Company[];
    currentUser: User | null;
    geographies: Geography[];
    canCreate: boolean;
    canModify: boolean;
}

const BranchesManager: React.FC<BranchesManagerProps> = ({ 
    Branches, 
    onUpdateBranches, 
    addToast, 
    operatingCompanies, 
    currentUser, 
    geographies, 
    canCreate, 
    canModify 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
    const [branch_idSuffix, setbranch_idSuffix] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'branch_name', direction: 'asc' });
    const [modalSelectedCountry, setModalSelectedCountry] = useState<string | null>(null);
    const [modalSelectedState, setModalSelectedState] = useState<string | null>(null);
    const [modalSelectedDistrict, setModalSelectedDistrict] = useState<string | null>(null);
    const [modalSelectedCity, setModalSelectedCity] = useState<string | null>(null);
    
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    const comp_code = useMemo(() => 
        operatingCompanies.find(c => c.id === currentUser?.comp_id)?.comp_code || '', 
        [operatingCompanies, currentUser]
    );

    const companyBranches = useMemo(() => 
        Branches.filter(b => b.comp_id === currentUser?.comp_id), 
        [Branches, currentUser]
    );

    const sortedAndFilteredBranches = useMemo(() => {
        const filtered = companyBranches.filter(branch =>
            branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.branch_id.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'asc' ? 1 : -1;
            const aValue = a[key as keyof Branch];
            const bValue = b[key as keyof Branch];

            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return (aValue === bValue) ? 0 : aValue ? -1 * dir : 1 * dir;
            }
            if (aValue < bValue) return -1 * dir;
            if (aValue > bValue) return 1 * dir;
            return 0;
        });
    }, [companyBranches, searchQuery, sortConfig]);

    const modalCountryOptions = useMemo(() => 
        geographies.filter(g => g.type === 'Country' && g.active).map(g => ({ value: g.id, label: g.name })), 
        [geographies]
    );
    
    const modalStateOptions = useMemo(() => 
        !modalSelectedCountry ? [] : geographies.filter(g => g.type === 'State' && g.parentId === modalSelectedCountry && g.active).map(g => ({ value: g.id, label: g.name })), 
        [geographies, modalSelectedCountry]
    );
    
    const modalDistrictOptions = useMemo(() => 
        !modalSelectedState ? [] : geographies.filter(g => g.type === 'District' && g.parentId === modalSelectedState && g.active).map(g => ({ value: g.id, label: g.name })), 
        [geographies, modalSelectedState]
    );
    
    const modalCityOptions = useMemo(() => 
        !modalSelectedDistrict ? [] : geographies.filter(g => g.type === 'City' && g.parentId === modalSelectedDistrict && g.active).map(g => ({ value: g.id, label: g.name })), 
        [geographies, modalSelectedDistrict]
    );

    const handleSort = useCallback((key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setEditingBranch(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
    }, []);

    const handleAddressChange = useCallback((name: string, value: string | null) => {
        setEditingBranch(prev => {
            if (!prev) return null;
            const newAddress = { ...prev.address, [name]: value };
            if (name === 'country') {
                newAddress.state = '';
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            if (name === 'state') {
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            return { ...prev, address: newAddress };
        });
    }, []);

    const handleCountryChange = useCallback((val: string | null) => {
        setModalSelectedCountry(val);
        setModalSelectedState(null);
        setModalSelectedDistrict(null);
        setModalSelectedCity(null);
        handleAddressChange('country', val ? geographies.find(g => g.id === val)?.name || 'India' : 'India');
    }, [geographies, handleAddressChange]);

    const handleStateChange = useCallback((val: string | null) => {
        setModalSelectedState(val);
        setModalSelectedDistrict(null);
        setModalSelectedCity(null);
        handleAddressChange('state', val ? geographies.find(g => g.id === val)?.name || null : null);
    }, [geographies, handleAddressChange]);

    const handleDistrictChange = useCallback((val: string | null) => {
        setModalSelectedDistrict(val);
        setModalSelectedCity(null);
        handleAddressChange('district', val ? geographies.find(g => g.id === val)?.name || null : null);
    }, [geographies, handleAddressChange]);

    const handleCityChange = useCallback((val: string | null) => {
        setModalSelectedCity(val);
        handleAddressChange('city', val ? geographies.find(g => g.id === val)?.name || null : null);
    }, [geographies, handleAddressChange]);

    const openModal = useCallback((branch: Branch | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingBranch(branch ? { ...branch } : { 
            id: '', 
            branch_id: '', 
            branch_name: '', 
            dateOfCreation: '', 
            active: true, 
            comp_id: currentUser!.comp_id 
        });
        setbranch_idSuffix(branch ? branch.branch_id.replace(`${comp_code}-`, '') : '');

        if (branch?.address) {
            const country = geographies.find(g => g.name === (branch.address?.country || 'India') && g.type === 'Country');
            setModalSelectedCountry(country?.id || null);
            if (country) {
                const state = geographies.find(g => g.name === branch.address?.state && g.type === 'State' && g.parentId === country.id);
                setModalSelectedState(state?.id || null);
                if (state) {
                    const district = geographies.find(g => g.name === branch.address?.district && g.type === 'District' && g.parentId === state.id);
                    setModalSelectedDistrict(district?.id || null);
                    if (district) {
                        const city = geographies.find(g => g.name === branch.address?.city && g.type === 'City' && g.parentId === district.id);
                        setModalSelectedCity(city?.id || null);
                    } else {
                        setModalSelectedCity(null);
                    }
                } else {
                    setModalSelectedDistrict(null);
                    setModalSelectedCity(null);
                }
            } else {
                setModalSelectedState(null);
                setModalSelectedDistrict(null);
                setModalSelectedCity(null);
            }
        } else {
            setModalSelectedCountry(geographies.find(g => g.name === 'India')?.id || null);
            setModalSelectedState(null);
            setModalSelectedDistrict(null);
            setModalSelectedCity(null);
        }

        setIsModalOpen(true);
    }, [comp_code, currentUser, geographies]);

    const closeModal = useCallback(() => {
        setEditingBranch(null);
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    }, []);

    const handleSave = useCallback(() => {
        if (!canModify || !editingBranch || !editingBranch.branch_name?.trim()) {
            addToast('Branch name cannot be empty.', 'error');
            return;
        }
        if (!branch_idSuffix.trim()) {
            addToast('Branch code suffix cannot be empty.', 'error');
            return;
        }

        const finalbranch_id = `${comp_code}-${branch_idSuffix}`;
        const isDuplicate = Branches.some(b => b.id !== editingBranch.id && b.branch_id === finalbranch_id);
        if (isDuplicate) {
            addToast(`Branch ID "${finalbranch_id}" already exists.`, 'error');
            return;
        }

        const branchToSave = { ...editingBranch, branch_id: finalbranch_id };

        if (editingBranch.id) {
            onUpdateBranches(Branches.map(b => b.id === editingBranch.id ? branchToSave as Branch : b));
            addToast('Branch updated successfully.', 'success');
        } else {
            const newId = `frb-${Date.now()}`;
            onUpdateBranches([...Branches, { ...(branchToSave as Branch), id: newId }]);
            addToast('Branch added successfully.', 'success');
        }
        closeModal();
    }, [canModify, editingBranch, branch_idSuffix, comp_code, Branches, onUpdateBranches, addToast, closeModal]);

    const handleToggle = useCallback((id: string) => {
        onUpdateBranches(Branches.map(b => b.id === id ? { ...b, active: !b.active } : b));
    }, [Branches, onUpdateBranches]);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Branch</h3>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <div className="relative flex-grow w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                        label=""
                        type="search"
                        placeholder="Search Branches by Name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </div>
                {canCreate && (
                    <Button onClick={(e) => openModal(null, e)} variant="primary" className="w-full md:w-auto flex-shrink-0">
                        <Plus size={16}/> Add New Branch
                    </Button>
                )}
            </div>
            
            <div className="overflow-y-auto border dark:border-gray-700 rounded-lg max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">ID</th>
                            <SortableHeader sortKey="branch_id" label="Branch ID" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader sortKey="branch_name" label="Branch Name" sortConfig={sortConfig} onSort={handleSort} />
                            <SortableHeader sortKey="active" label="Status" sortConfig={sortConfig} onSort={handleSort} />
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredBranches.map((branch, index) => (
                            <tr key={branch.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 ${!branch.active ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono">{branch.branch_id}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{branch.branch_name}</td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <ToggleSwitch enabled={branch.active || false} onChange={() => handleToggle(branch.id)} disabled={!canModify}/>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <Button size="small" variant="light" onClick={(e) => openModal(branch, e)} disabled={!canModify}>
                                        <Edit2 size={14}/>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedAndFilteredBranches.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No Branches found.</div>
                )}
            </div>

            {isModalOpen && editingBranch && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    contentClassName="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200"
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingBranch?.id ? 'Edit' : 'Add'} Branch
                        </h2>
                        <fieldset disabled={!canModify}>
                            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Branch Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch ID *</label>
                                            <div className="flex items-end gap-2">
                                                <Input label="" value={comp_code} disabled />
                                                <span className="pb-2 font-bold">-</span>
                                                <Input label="" value={branch_idSuffix} onChange={e => setbranch_idSuffix(e.target.value.toUpperCase())} placeholder="e.g., ERD" />
                                            </div>
                                        </div>
                                        <Input label="Branch Name" name="branch_name" value={editingBranch.branch_name || ''} onChange={handleInputChange} />
                                        <Input label="Date of Creation" name="dateOfCreation" type="date" value={editingBranch.dateOfCreation || ''} onChange={handleInputChange} />
                                        <div className="flex items-center gap-4 pt-6">
                                            <label className="flex items-center gap-2">
                                                <input type="checkbox" name="active" checked={editingBranch.active || false} onChange={handleInputChange} /> 
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Address Details</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input label="Line 1" value={editingBranch.address?.line1 || ''} onChange={e => handleAddressChange('line1', e.target.value)} />
                                        <Input label="Line 2" value={editingBranch.address?.line2 || ''} onChange={e => handleAddressChange('line2', e.target.value)} />
                                        <Input label="Line 3" value={editingBranch.address?.line3 || ''} onChange={e => handleAddressChange('line3', e.target.value)} />
                                        <SearchableSelect label="Country" options={modalCountryOptions} value={modalSelectedCountry} onChange={handleCountryChange} />
                                        <SearchableSelect label="State" options={modalStateOptions} value={modalSelectedState} onChange={handleStateChange} disabled={!modalSelectedCountry} />
                                        <SearchableSelect label="District" options={modalDistrictOptions} value={modalSelectedDistrict} onChange={handleDistrictChange} disabled={!modalSelectedState} />
                                        <SearchableSelect label="City" options={modalCityOptions} value={modalSelectedCity} onChange={handleCityChange} disabled={!modalSelectedDistrict} />
                                        <Input label="Area" value={editingBranch.address?.area || ''} onChange={e => handleAddressChange('area', e.target.value)} />
                                        <Input label="Pin Code" value={editingBranch.address?.pinCode || ''} onChange={e => handleAddressChange('pinCode', e.target.value)} />
                                        <Input label="Phone No." value={editingBranch.address?.phone || ''} onChange={e => handleAddressChange('phone', e.target.value)} />
                                        <Input label="FAX No." value={editingBranch.address?.fax || ''} onChange={e => handleAddressChange('fax', e.target.value)} />
                                    </div>
                                </div>
                                
                                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Tax Info</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input label="GSTIN" name="gstin" value={editingBranch.gstin || ''} onChange={handleInputChange} />
                                        <Input label="PAN" name="pan" value={editingBranch.pan || ''} onChange={handleInputChange} />
                                        <Input label="TAN" name="tan" value={editingBranch.tan || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                        <div className="flex justify-end gap-4 mt-8">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default BranchesManager;