import React, { useState, useCallback, useMemo, useEffect } from 'react';
// MODIFIED: Import permission types
import { Member, ModalTab, User, FinRootsBranch, Designation, AppModule, PermissionLevel } from '../types.ts';
import MemberTable from './MemberTable.tsx';
import Button from './ui/Button.tsx';
import { Plus, Search, BrainCircuit, Loader2, ArrowLeft, Settings2, Bot } from 'lucide-react';
import { searchMembersWithNL } from '../services/geminiService.ts';
import Input from './ui/Input.tsx';
import Pagination from './ui/Pagination.tsx';

// MODIFICATION: Removed 'processFlow' from the props interface
interface MemberDashboardProps {
  members: Member[];
  allMembers: Member[];
  currentUser: User | null;
  users: User[];
  onEditMember: (member: Member, initialTab?: ModalTab) => void;
  onCreateMember: () => void;
  onConversationalCreate: () => void;
  onDeleteMember: (memberId: string) => void;
  onToggleStatus: (memberId: string) => void;
  onGenerateReview: (memberId: string) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  finrootsBranches: FinRootsBranch[];
  designations: Designation[];
  permissions: { [key in AppModule]?: PermissionLevel };
}

type StatusFilter = 'Active' | 'Inactive' | 'All';
type SearchMode = 'ai' | 'advanced';
type AdvisorViewMode = 'all' | 'created';
type SortKey = 'createdAt';
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };

const ITEMS_PER_PAGE = 10;


const MemberDashboard: React.FC<MemberDashboardProps> = ({ 
    members, allMembers, currentUser, users, onEditMember, onCreateMember, 
    onConversationalCreate, onDeleteMember, onToggleStatus, onGenerateReview, 
    addToast, finrootsBranches, designations, permissions
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('ai');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Active');
  
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [filteredMemberIds, setFilteredMemberIds] = useState<string[] | null>(null);
  
  const [advFilters, setAdvFilters] = useState({ name: '', city: '', memberType: 'All', createdAtFrom: '', createdAtTo: '' });
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const [advisorViewMode, setAdvisorViewMode] = useState<AdvisorViewMode>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const canCreate = permissions?.customers === 'create' || permissions?.customers === 'modify';
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchMode, statusFilter, aiSearchQuery, advFilters, advisorViewMode]);


  const advisorMembers = useMemo(() => {
    const userDesignation = designations.find(d => d.id === currentUser?.designationId);
    if (userDesignation?.isAdvisor) {
      let filtered = members.filter(member => 
        member.assignedTo?.includes(currentUser!.id) || member.createdBy === currentUser!.id
      );
      if (advisorViewMode === 'created') {
        filtered = filtered.filter(member => member.createdBy === currentUser!.id);
      }
      return filtered;
    }
    return members;
  }, [members, currentUser, advisorViewMode, designations]);


  const handleAiSearch = useCallback(async () => {
    setIsAiSearching(true);
    setSearchPerformed(!!aiSearchQuery.trim());
    if (!aiSearchQuery.trim()) {
      setFilteredMemberIds(null);
    } else {
      const resultIds = await searchMembersWithNL(aiSearchQuery, advisorMembers, addToast);
      setFilteredMemberIds(resultIds);
    }
    setIsAiSearching(false);
  }, [aiSearchQuery, advisorMembers, addToast]);
  
  const handleClearSearch = useCallback(() => {
      setAiSearchQuery('');
      setAdvFilters({ name: '', city: '', memberType: 'All', createdAtFrom: '', createdAtTo: '' });
      setStatusFilter('Active');
      setSearchPerformed(false);
      setFilteredMemberIds(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAiSearch();
    }
  };
  
  const handleAdvancedFilterChange = (field: keyof typeof advFilters, value: string) => {
    setAdvFilters(prev => ({...prev, [field]: value}));
    setSearchPerformed(true);
  }

  const handleSort = useCallback((key: string) => {
    setSortConfig(prevConfig => ({
        key: 'createdAt',
        direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const displayedMembers = useMemo(() => {
    let baseMembers = advisorMembers;
    if (searchMode === 'ai' && searchPerformed && filteredMemberIds !== null) {
        const memberMap = new Map(baseMembers.map(m => [m.id, m]));
        baseMembers = filteredMemberIds.map(id => memberMap.get(id)).filter(Boolean) as Member[];
    }
    
    let filtered = baseMembers.filter(member => {
        if (statusFilter !== 'All') {
            if (member.active !== (statusFilter === 'Active')) {
                return false;
            }
        }
        
        if (searchMode === 'advanced') {
            const nameMatch = !advFilters.name || member.name.toLowerCase().includes(advFilters.name.toLowerCase());
            const cityMatch = !advFilters.city || member.city.toLowerCase().includes(advFilters.city.toLowerCase());
            const typeMatch = advFilters.memberType === 'All' ? true : member.memberType === advFilters.memberType;
            
            const createdAt = member.createdAt ? new Date(member.createdAt) : null;
            let dateMatch = true;
            if (createdAt) {
                if (advFilters.createdAtFrom) {
                    const fromDate = new Date(advFilters.createdAtFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (createdAt < fromDate) {
                        dateMatch = false;
                    }
                }
                if (advFilters.createdAtTo) {
                    const toDate = new Date(advFilters.createdAtTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (createdAt > toDate) {
                        dateMatch = false;
                    }
                }
            } else if (advFilters.createdAtFrom || advFilters.createdAtTo) {
                dateMatch = false;
            }

            if (!nameMatch || !cityMatch || !typeMatch || !dateMatch) {
                return false;
            }
        }

        return true;
    });
    
    filtered.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        const aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        if (aValue < bValue) return -1 * dir;
        if (aValue > bValue) return 1 * dir;
        return 0;
    });

    return filtered;

  }, [advisorMembers, searchMode, searchPerformed, filteredMemberIds, advFilters, statusFilter, sortConfig]);
  
  const totalPages = Math.ceil(displayedMembers.length / ITEMS_PER_PAGE);
  const currentMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, displayedMembers]);
  
  const SearchToggleButton = ({ mode, label, icon }: { mode: SearchMode, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => { setSearchMode(mode); handleClearSearch(); }}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
        searchMode === mode
          ? 'bg-brand-primary text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="bg-white shadow-lg rounded-xl dark:bg-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center p-6 border-b dark:border-gray-700 gap-4">
        <h2 className="text-xl font-semibold text-brand-dark dark:text-white">Customer Management</h2>
        {canCreate && (
            <div className="flex items-center gap-2">
                <Button onClick={onConversationalCreate} variant="light">
                    <Bot size={16} />
                    Create with AI
                </Button>
                <Button onClick={onCreateMember} variant="success">
                    <Plus size={16} />
                    Create Customer
                </Button>
            </div>
        )}
      </div>
      
       <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
             <SearchToggleButton mode="ai" label="AI Search" icon={<BrainCircuit size={14}/>} />
             <SearchToggleButton mode="advanced" label="Advanced Search" icon={<Settings2 size={14}/>} />
          </div>

          {designations.find(d => d.id === currentUser?.designationId)?.isAdvisor && (
            <div className="flex items-center gap-2 mb-4 p-1 bg-gray-200/70 dark:bg-gray-900/50 rounded-lg">
                <button
                    onClick={() => setAdvisorViewMode('all')}
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${advisorViewMode === 'all' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                    All My Customers
                </button>
                <button
                    onClick={() => setAdvisorViewMode('created')}
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${advisorViewMode === 'created' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                    Created by Me
                </button>
            </div>
           )}

          {searchMode === 'ai' ? (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <BrainCircuit className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder="Search with AI (e.g., 'inactive customers from Delhi', or by member ID)"
                            value={aiSearchQuery}
                            onChange={(e) => setAiSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isAiSearching}
                        />
                    </div>
                    <Button onClick={handleAiSearch} disabled={isAiSearching} className="flex-shrink-0">
                      {isAiSearching ? ( <> <Loader2 className="w-4 h-4 animate-spin"/> Searching... </> ) 
                                     : ( <> <Search size={16} /> Search </> )}
                    </Button>
                </div>
              </div>
          ) : (
              <div className="animate-fade-in space-y-4 p-4 border-2 border-dashed dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input label="Name" placeholder="Search by name" value={advFilters.name} onChange={(e) => handleAdvancedFilterChange('name', e.target.value)} />
                      <Input label="City" placeholder="Search by city" value={advFilters.city} onChange={(e) => handleAdvancedFilterChange('city', e.target.value)} />
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier</label>
                          <select value={advFilters.memberType} onChange={(e) => handleAdvancedFilterChange('memberType', e.target.value)} className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                              <option>All</option><option>Silver</option><option>Gold</option><option>Diamond</option><option>Platinum</option>
                          </select>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed dark:border-gray-600">
                    <Input label="Created From" type="date" value={advFilters.createdAtFrom} onChange={(e) => handleAdvancedFilterChange('createdAtFrom', e.target.value)} />
                    <Input label="Created To" type="date" value={advFilters.createdAtTo} onChange={(e) => handleAdvancedFilterChange('createdAtTo', e.target.value)} />
                  </div>
              </div>
          )}

           <div className="flex items-center gap-3 animate-fade-in mt-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
              <div className="flex items-center gap-2 p-1 bg-gray-200/70 dark:bg-gray-900/50 rounded-lg">
                  {(['Active', 'Inactive', 'All'] as const).map(s => (
                      <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                              statusFilter === s
                                  ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white'
                                  : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'
                          }`}
                      >
                          {s}
                      </button>
                  ))}
              </div>
          </div>

           {searchPerformed && (
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                      Found {displayedMembers.length} result{displayedMembers.length !== 1 ? 's' : ''} for your query.
                  </p>
                  <Button onClick={handleClearSearch} variant="secondary"> <ArrowLeft size={16} /> Back to Full List </Button>
              </div>
          )}
      </div>

      <div className="overflow-x-auto">
        {isAiSearching ? (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="mt-4 text-lg text-gray-600 dark:text-gray-300">Analyzing with Gemini...</span>
            </div>
        ) : (
            <MemberTable
              members={currentMembers}
              allMembers={allMembers}
              currentUser={currentUser}
              users={users}
              onEdit={onEditMember}
              onDelete={onDeleteMember}
              onToggleStatus={onToggleStatus}
              onGenerateReview={onGenerateReview}
              finrootsBranches={finrootsBranches}
              sortConfig={sortConfig}
              onSort={handleSort}
              designations={designations}
              permissions={permissions}
            />
        )}
      </div>
      {displayedMembers.length > 0 && (
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={displayedMembers.length}
        />
      )}
    </div>
  );
};

export default MemberDashboard;