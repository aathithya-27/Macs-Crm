import React, { useState, useMemo, useEffect, useRef } from 'react';

import { Religion, Festival, FestivalDate, Member } from '../../types';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Trash2, Search, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import SearchBar from '../ui/SearchBar';

import GenericMasterManager from './GenericMasterManager';

interface ReligionsAndFestivalsManagerProps {
    religions: Religion[];
    onUpdateReligions: (data: Religion[]) => void;
    festivals: Festival[];
    onUpdateFestivals: (data: Festival[]) => void;
    festivalDates: FestivalDate[];
    onUpdateFestivalDates: (data: FestivalDate[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const ReligionsAndFestivalsManager: React.FC<ReligionsAndFestivalsManagerProps> = ({
    religions, onUpdateReligions, festivals, onUpdateFestivals, festivalDates, onUpdateFestivalDates, addToast, allMembers, canCreate, canModify
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false);
    const [editingFestival, setEditingFestival] = useState<Partial<Festival> | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [editingDate, setEditingDate] = useState<Partial<FestivalDate> | null>(null);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
    const [monthFilter, setMonthFilter] = useState('all');
    const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

    const religionMap = useMemo(() => new Map(religions.map(r => [r.id, r.name])), [religions]);
    const festivalMap = useMemo(() => new Map(festivals.map(f => [f.id, f.name])), [festivals]);
    const dateCountMap = useMemo(() => {
        const counts = new Map<string, number>();
        festivalDates.forEach(d => {
            counts.set(d.festivalId, (counts.get(d.festivalId) || 0) + 1);
        });
        return counts;
    }, [festivalDates]);

    const openFestivalModal = (item: Festival | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        setEditingFestival(item ? { ...item } : { name: '', religionId: null, active: true });
        setIsFestivalModalOpen(true);
    };

    const closeFestivalModal = () => setIsFestivalModalOpen(false);

    const handleSaveFestival = () => {
        if (!canModify) return;
        if (!editingFestival || !editingFestival.name?.trim()) {
            addToast('Festival name is required.', 'error');
            return;
        }

        const newFestivals = editingFestival.id
            ? festivals.map(i => i.id === editingFestival.id ? editingFestival as Festival : i)
            : [...festivals, { ...editingFestival, active: editingFestival.active ?? true, id: `fest-${Date.now()}` } as Festival];

        onUpdateFestivals(newFestivals);
        closeFestivalModal();
    };

    const handleToggleFestival = (id: string) => onUpdateFestivals(festivals.map(i => i.id === id ? { ...i, active: !i.active } : i));

    const handleDeleteFestival = (id: string) => {
        if (festivalDates.some(fd => fd.festivalId === id)) {
            addToast('Cannot delete festival as it has dates assigned. Please remove dates first.', 'error');
            return;
        }
        onUpdateFestivals(festivals.filter(f => f.id !== id));
        addToast('Festival deleted.', 'success');
    };

    const openDateModal = (item: Partial<FestivalDate> | null, event?: React.MouseEvent<HTMLElement>) => {
        if (event) triggerButtonRef.current = event.currentTarget as HTMLButtonElement;
        if (item && !item.id) {
            const parentFestival = festivals.find(f => f.id === item.festivalId);
            setEditingDate({ festivalId: item.festivalId, date: `${new Date().getFullYear()}-01-01`, active: parentFestival ? parentFestival.active : true });
        } else {
            setEditingDate(item ? { ...item } : { festivalId: '', date: `${new Date().getFullYear()}-01-01`, active: true });
        }
        setIsDateModalOpen(true);
    };

    const closeDateModal = () => setIsDateModalOpen(false);

    const handleSaveDate = () => {
        if (!canModify) return;
        if (!editingDate || !editingDate.festivalId || !editingDate.date) {
            addToast('Festival and Date are required.', 'error');
            return;
        }

        const isDuplicate = festivalDates.some(d => d.id !== editingDate.id && d.festivalId === editingDate.festivalId && d.date === editingDate.date);
        if (isDuplicate) {
            addToast(`This date is already assigned to this festival.`, 'error');
            return;
        }

        const year = new Date(editingDate.date).getFullYear();
        const finalDate = { ...editingDate, year };

        onUpdateFestivalDates(
            editingDate.id
                ? festivalDates.map(d => d.id === editingDate.id ? finalDate as FestivalDate : d)
                : [...festivalDates, { ...finalDate, id: `fest-date-${Date.now()}` } as FestivalDate]
        );
        closeDateModal();
    };

    const handleToggleDate = (id: string) => onUpdateFestivalDates(festivalDates.map(d => d.id === id ? { ...d, active: !d.active } : d));
    const handleDeleteDate = (id: string) => onUpdateFestivalDates(festivalDates.filter(d => d.id !== id));

    const displayRows = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const searchedFestivals = festivals.filter(f => !searchQuery || f.name.toLowerCase().includes(lowerCaseQuery));
        let rows: any[] = [];

        searchedFestivals.forEach(festival => {
            const datesInFilter = festivalDates.filter(d => {
                const date = new Date(d.date);
                return d.festivalId === festival.id &&
                       date.getFullYear() === yearFilter &&
                       (monthFilter === 'all' || date.getMonth() === parseInt(monthFilter));
            });

            if (datesInFilter.length > 0) {
                datesInFilter.forEach(date => rows.push({ ...date, isPlaceholder: false }));
            } else if (monthFilter === 'all') {
                rows.push({ id: `placeholder-${festival.id}`, festivalId: festival.id, date: '', active: festival.active ?? true, isPlaceholder: true });
            }
        });

        return rows.sort((a, b) => (festivalMap.get(a.festivalId) || '').localeCompare(festivalMap.get(b.festivalId) || '') || new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [festivals, festivalDates, yearFilter, monthFilter, searchQuery, festivalMap]);
    
    const SearchableYearFilter: React.FC = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const ref = useRef<HTMLDivElement>(null);
    
        const yearOptions = useMemo(() => {
            const yearsInData = new Set(festivalDates.map(d => new Date(d.date).getFullYear()));
            const currentYear = new Date().getFullYear();
            for (let i = 0; i < 5; i++) { yearsInData.add(currentYear + i); }
            return Array.from(yearsInData).sort((a, b) => b - a);
        }, [festivalDates]);
    
        const filteredYears = useMemo(() => !searchTerm ? yearOptions : yearOptions.filter(y => y.toString().includes(searchTerm)), [searchTerm, yearOptions]);
    
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);
    
        return (
            <div className="relative" ref={ref}>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border dark:border-gray-600 focus:outline-none sm:text-sm">
                    <span className="block truncate">{yearFilter}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDown className="h-5 w-5 text-gray-400" /></span>
                </button>
                {isOpen && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                        <div className="p-2" onClick={e => e.stopPropagation()}><Input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search year..." autoFocus /></div>
                        {filteredYears.map(year => (<div key={year} onClick={() => { setYearFilter(year); setIsOpen(false); setSearchTerm(''); }} className="relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50">{year}</div>))}
                    </div>
                )}
            </div>
        )
    };

    const monthOptions = useMemo(() => [
        { value: 'all', label: 'All Months' },
        ...Array.from({ length: 12 }, (_, i) => ({ value: i.toString(), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }))
    ], []);

    const filteredReligions = useMemo(() => !searchQuery ? religions : religions.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())), [religions, searchQuery]);
    const filteredFestivals = useMemo(() => !searchQuery ? festivals : festivals.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [festivals, searchQuery]);

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Religion & Festival Management</h3>
            <div className="my-4">
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search all religions and festivals..."
                    className="w-full"
                />
            </div>
            <GenericMasterManager
                title="Manage Religion"
                items={filteredReligions}
                onUpdate={onUpdateReligions}
                addToast={addToast}
                noun="Religion"
                reorderable={true}
                showSearchBar={false}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => allMembers.filter(m => m.religionId === id).map(m => ({ name: `Customer: ${m.name}`, type: 'member' }))}
                canCreate={canCreate}
                canModify={canModify}
            />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Festival</h3>
                    {canCreate && <Button variant="primary" onClick={(e) => openFestivalModal(null, e)}><Plus size={16}/> Add Festival</Button>}
                </div>
                <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Religion</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredFestivals.map((item, index) => (
                                <tr key={item.id} className={!item.active ? 'opacity-50' : ''}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2 text-sm">{religionMap.get(item.religionId!) || 'General'}</td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggleFestival(item.id)} disabled={!canModify} /></td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button size="small" variant="light" onClick={(e) => openFestivalModal(item, e)} disabled={!canModify}><Edit2 size={14}/></Button>
                                            {canModify && <Button size="small" variant="danger" onClick={() => handleDeleteFestival(item.id)}><Trash2 size={14}/></Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Festival Date</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-40"><SearchableYearFilter /></div>
                        <div className="w-48">
                            <SearchableSelect
                                label=""
                                options={monthOptions}
                                value={monthFilter}
                                onChange={value => setMonthFilter(value || 'all')}
                                placeholder="Select month..."
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0"><tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase w-12">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Festival</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {displayRows.map((row, index) => (
                                <tr key={row.id} className={!row.active ? 'opacity-50' : ''}>
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{festivalMap.get(row.festivalId) || 'Unknown'}<span className="text-xs text-gray-400 ml-2">({dateCountMap.get(row.festivalId) || 0} Dates)</span></td>
                                    <td className="px-4 py-2 text-sm">
                                        <div className="flex items-center gap-4">
                                            <span className="w-48">{row.isPlaceholder ? <span className="italic text-gray-400">No date set for {yearFilter}</span> : new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            {canCreate && <button type="button" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Add another date for this festival" onClick={(e) => openDateModal({ festivalId: row.festivalId }, e)}><CalendarIcon size={16}/></button>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2"><ToggleSwitch enabled={!!row.active} onChange={() => row.isPlaceholder ? handleToggleFestival(row.festivalId) : handleToggleDate(row.id)} disabled={!canModify} /></td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            {!row.isPlaceholder && canModify && (
                                                <>
                                                    <Button size="small" variant="light" className="!p-1.5" onClick={(e) => openDateModal(row as FestivalDate, e)}><Edit2 size={14}/></Button>
                                                    <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleDeleteDate(row.id)}><Trash2 size={14}/></Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFestivalModalOpen && (
                <Modal isOpen={isFestivalModalOpen} onClose={closeFestivalModal}>
                    <form onSubmit={e => { e.preventDefault(); handleSaveFestival(); }}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingFestival?.id ? 'Edit' : 'Add'} Festival</h2></div>
                        <div className="p-6 space-y-4">
                            <Input label="Festival Name" value={editingFestival?.name || ''} onChange={e => setEditingFestival(p => p ? {...p, name: e.target.value} : null)} disabled={!canModify} autoFocus/>
                            <label className="block text-sm font-medium">Religion</label>
                            <select value={editingFestival?.religionId || ''} onChange={e => setEditingFestival(p => p ? {...p, religionId: e.target.value || null} : null)} className={selectClasses} disabled={!canModify}>
                                <option value="">-- General --</option>
                                {religions.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeFestivalModal}>Cancel</Button><Button type="submit" variant="success" disabled={!canModify}>Save</Button></div>
                    </form>
                </Modal>
            )}

            {isDateModalOpen && (
                 <Modal isOpen={isDateModalOpen} onClose={closeDateModal}>
                    <form onSubmit={e => { e.preventDefault(); handleSaveDate(); }}>
                        <div className="p-6"><h2 className="text-xl font-bold">{editingDate?.id ? 'Edit' : 'Add'} Festival Date</h2></div>
                        <div className="p-6 space-y-4">
                             <label className="block text-sm font-medium">Festival</label>
                            <select value={editingDate?.festivalId || ''} onChange={e => setEditingDate(p => p ? {...p, festivalId: e.target.value} : null)} className={selectClasses} required disabled={!!(editingDate?.id) || !canModify}>
                                <option value="">-- Select Festival --</option>
                                {festivals.filter(f => f.active).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <Input label="Date" type="date" value={editingDate?.date || ''} onChange={e => setEditingDate(p => p ? {...p, date: e.target.value} : null)} disabled={!canModify}/>
                        </div>
                        <div className="flex justify-end p-6 gap-3 border-t"><Button type="button" variant="secondary" onClick={closeDateModal}>Cancel</Button><Button type="submit" variant="success" disabled={!canModify}>Save Date</Button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ReligionsAndFestivalsManager;