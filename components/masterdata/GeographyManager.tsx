import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Geography, Member } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import SearchableSelect from '../ui/SearchableSelect';
import { Plus, Edit2, Search, AlertTriangle } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

interface GeographyManagerProps {
    geographies: Geography[];
    onUpdateGeographies: (geos: Geography[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const GeographyManager: React.FC<GeographyManagerProps> = ({ geographies, onUpdateGeographies, addToast, allMembers, canCreate, canModify }) => {
    type GeoTab = 'Country' | 'State' | 'District' | 'City' | 'Area';

    const [editingGeo, setEditingGeo] = useState<Partial<Geography> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<Geography | null>(null);
    const [dependentMembers, setDependentMembers] = useState<Member[]>([]);

    const [modalCountry, setModalCountry] = useState<string | null>(null);
    const [modalState, setModalState] = useState<string | null>(null);
    const [modalDistrict, setModalDistrict] = useState<string | null>(null);
    const [modalCity, setModalCity] = useState<string | null>(null);

    const geoMap = useMemo(() => new Map(geographies.map(g => [g.id, g])), [geographies]);

    const filteredGeographiesByType = useMemo(() => {
        const categorized: Record<GeoTab, Geography[]> = { Country: [], State: [], District: [], City: [], Area: [] };
        const lowerCaseQuery = searchQuery.toLowerCase();

        for (const geo of geographies) {
            const matchesSearch = !searchQuery || geo.name.toLowerCase().includes(lowerCaseQuery) || geo.id.toLowerCase().includes(lowerCaseQuery);
            if (matchesSearch && categorized[geo.type as GeoTab]) {
                categorized[geo.type as GeoTab].push(geo);
            }
        }

        for (const key in categorized) {
            categorized[key as GeoTab].sort((a, b) => a.name.localeCompare(b.name));
        }

        return categorized;
    }, [geographies, searchQuery]);

    const getParent = (item: Geography | Partial<Geography>): Geography | undefined => {
        if (!item.parentId) return undefined;
        return geoMap.get(item.parentId);
    };

    const openModal = (type: GeoTab, item: Geography | null, event: React.MouseEvent<HTMLElement>) => {
        triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        if (item) {
            setEditingGeo({ ...item });
            let parent = getParent(item);
            if (type === 'State') setModalCountry(parent?.id || null);
            if (type === 'District') {
                const state = parent;
                const country = state ? getParent(state) : null;
                setModalCountry(country?.id || null);
                setModalState(state?.id || null);
            }
            if (type === 'City') {
                 const district = parent;
                 const state = district ? getParent(district) : null;
                 const country = state ? getParent(state) : null;
                 setModalCountry(country?.id || null);
                 setModalState(state?.id || null);
                 setModalDistrict(district?.id || null);
            }
            if (type === 'Area') {
                 const city = parent;
                 const district = city ? getParent(city) : null;
                 const state = district ? getParent(district) : null;
                 const country = state ? getParent(state) : null;
                 setModalCountry(country?.id || null);
                 setModalState(state?.id || null);
                 setModalDistrict(district?.id || null);
                 setModalCity(city?.id || null);
            }
        } else {
            setEditingGeo({ name: '', type, parentId: null, active: true });
            setModalCountry(null);
            setModalState(null);
            setModalDistrict(null);
            setModalCity(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        triggerButtonRef.current?.focus();
    };

    const handleSave = () => {
        if (!canModify) return;
        if (!editingGeo || !editingGeo.name?.trim()) {
            addToast('Name is required', 'error');
            return;
        }

        let parentId: string | null = null;
        switch(editingGeo.type) {
            case 'State': parentId = modalCountry; break;
            case 'District': parentId = modalState; break;
            case 'City': parentId = modalDistrict; break;
            case 'Area': parentId = modalCity; break;
        }

        const normalizedName = editingGeo.name.trim().toLowerCase();
        const isDuplicate = geographies.some(geo =>
            geo.id !== editingGeo.id &&
            geo.parentId === parentId &&
            geo.name.trim().toLowerCase() === normalizedName
        );

        if (isDuplicate) {
            addToast(`A ${editingGeo.type} with this name already exists under the selected parent.`, 'error');
            return;
        }

        const finalGeo = { ...editingGeo, parentId };

        if (finalGeo.id) {
            onUpdateGeographies(geographies.map(g => g.id === finalGeo.id ? finalGeo as Geography : g));
            addToast(`${finalGeo.type} updated.`, 'success');
        } else {
            onUpdateGeographies([...geographies, { ...finalGeo, id: `geo-${Date.now()}` } as Geography]);
            addToast(`${finalGeo.type} added.`, 'success');
        }
        closeModal();
    };

    const performToggle = (id: string) => {
        onUpdateGeographies(geographies.map(i => i.id === id ? {...i, active: i.active === false ? true : false } : i));
    };

    const handleToggle = (item: Geography) => {
        if (item.active === false) {
            performToggle(item.id);
            return;
        }

        const dependents = allMembers.filter(m =>
            m.state === item.name || m.district === item.name || m.city === item.name || m.area === item.name
        );

        if (dependents.length > 0) {
            setItemToToggle(item);
            setDependentMembers(dependents);
            setIsWarningModalOpen(true);
        } else {
            performToggle(item.id);
        }
    };

    const confirmDeactivation = () => {
        if (itemToToggle) {
            performToggle(itemToToggle.id);
        }
        setIsWarningModalOpen(false);
        setItemToToggle(null);
        setDependentMembers([]);
    };

    const getGeoCode = (item: Geography) => {
        const prefix = (item.type || '').substring(0, 4).toUpperCase();
        const idPart = (item.id || '').split('-').pop();
        return `${prefix}-${idPart}`;
    }

    const GeoTable: React.FC<{ type: GeoTab; items: Geography[] }> = ({ type, items }) => {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Manage {type}</h4>
                    {canCreate && <Button variant="primary" onClick={(e) => openModal(type, null, e)}><Plus size={16}/> Add {type}</Button>}
                </div>
                <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase hidden">Code</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                             {items.map((item, index) => (
                                <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 text-sm font-mono text-gray-500 hidden">{getGeoCode(item)}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggle(item)} disabled={!canModify}/></td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button size="small" variant="light" onClick={(e) => openModal(type, item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {items.length === 0 && <div className="p-8 text-center text-gray-500">No {type}s found.</div>}
                </div>
            </div>
        )
    };

    const countryOptions = useMemo(() => geographies.filter(g => g.type === 'Country' && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies]);
    const stateOptions = useMemo(() => !modalCountry ? [] : geographies.filter(g => g.type === 'State' && g.parentId === modalCountry && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies, modalCountry]);
    const districtOptions = useMemo(() => !modalState ? [] : geographies.filter(g => g.type === 'District' && g.parentId === modalState && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies, modalState]);
    const cityOptions = useMemo(() => !modalDistrict ? [] : geographies.filter(g => g.type === 'City' && g.parentId === modalDistrict && g.active).sort((a,b) => a.name.localeCompare(b.name)).map(g=>({value: g.id, label: g.name})), [geographies, modalDistrict]);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Geography Management</h3>
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 my-4">
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search by name in all tables..."
                    className="w-full md:w-1/2"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <GeoTable type="Country" items={filteredGeographiesByType.Country} />
                <GeoTable type="State" items={filteredGeographiesByType.State} />
                <GeoTable type="District" items={filteredGeographiesByType.District} />
                <GeoTable type="City" items={filteredGeographiesByType.City} />
                <GeoTable type="Area" items={filteredGeographiesByType.Area} />
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                     <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6 border-b dark:border-gray-700">
                             <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingGeo?.id ? 'Edit' : 'Add'} {editingGeo?.type}</h2>
                        </div>
                        <fieldset disabled={!canModify}>
                            <div className="space-y-4 p-6 max-h-[60vh] overflow-y-auto">
                                {editingGeo?.type === 'State' && <div><SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={setModalCountry} placeholder="Select Country..."/></div>}
                                {editingGeo?.type === 'District' && <><div className="mb-4"><SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={val => { setModalCountry(val); setModalState(null); }} placeholder="Select Country..."/></div><div><SearchableSelect label="State" options={stateOptions} value={modalState} onChange={setModalState} placeholder="Select State..." disabled={!modalCountry}/></div></>}
                                {editingGeo?.type === 'City' && <><div className="mb-4"><SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={val => { setModalCountry(val); setModalState(null); setModalDistrict(null); }} placeholder="Select Country..."/></div><div className="mb-4"><SearchableSelect label="State" options={stateOptions} value={modalState} onChange={val => { setModalState(val); setModalDistrict(null);}} placeholder="Select State..." disabled={!modalCountry}/></div><div><SearchableSelect label="District" options={districtOptions} value={modalDistrict} onChange={setModalDistrict} placeholder="Select District..." disabled={!modalState}/></div></>}
                                {editingGeo?.type === 'Area' && <><div className="mb-4"><SearchableSelect label="Country" options={countryOptions} value={modalCountry} onChange={val => { setModalCountry(val); setModalState(null); setModalDistrict(null); setModalCity(null); }} placeholder="Select Country..."/></div><div className="mb-4"><SearchableSelect label="State" options={stateOptions} value={modalState} onChange={val => { setModalState(val); setModalDistrict(null); setModalCity(null); }} placeholder="Select State..." disabled={!modalCountry}/></div><div className="mb-4"><SearchableSelect label="District" options={districtOptions} value={modalDistrict} onChange={val => {setModalDistrict(val); setModalCity(null);}} placeholder="Select District..." disabled={!modalState}/></div><div><SearchableSelect label="City" options={cityOptions} value={modalCity} onChange={setModalCity} placeholder="Select City..." disabled={!modalDistrict}/></div></>}
                                <Input label="Name" value={editingGeo?.name || ''} onChange={e => setEditingGeo(g => g ? {...g, name: e.target.value} : null)}/>
                            </div>
                        </fieldset>
                         <div className="flex justify-end gap-4 p-6 border-t dark:border-gray-700">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {isWarningModalOpen && (
                <Modal isOpen={isWarningModalOpen} onClose={() => setIsWarningModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Deactivate "{itemToToggle?.name}"?
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        This {itemToToggle?.type} is currently used by <strong>{dependentMembers.length} client(s)</strong>. Deactivating it may cause data inconsistencies.
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        Used by: {dependentMembers.slice(0, 3).map(m => m.name).join(', ')}{dependentMembers.length > 3 ? ', and others.' : '.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <Button variant="danger" onClick={confirmDeactivation}>
                                Confirm Deactivation
                            </Button>
                            <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GeographyManager;