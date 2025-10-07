import React, { useState, useMemo } from 'react';
import { Member, UpsellCategory, InsuranceTypeMaster, User, FinRootsBranch } from '../types';
import { generateUpsellSuggestion } from '../services/geminiService';
import { CheckCircle, XCircle, Sparkles, Loader2, Search } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SearchableSelect from './ui/SearchableSelect';

interface UpsellingDashboardProps {
    members: Member[];
    upsellCategories: UpsellCategory[];
    insuranceTypes: InsuranceTypeMaster[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    users: User[];
    branches: FinRootsBranch[];
}

const SuggestionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    member: Member | null;
    isLoading: boolean;
    result: { suggestion: string; pitch: string } | null;
}> = ({ isOpen, onClose, member, isLoading, result }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <Sparkles className="text-brand-primary w-8 h-8" />
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark dark:text-white">AI Upsell Suggestion</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">For {member?.name}</p>
                    </div>
                </div>
            </div>
            <div className="p-6 border-y dark:border-gray-700 min-h-[200px] flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                        <p className="text-gray-500 dark:text-gray-400">Analyzing customer profile...</p>
                    </div>
                ) : result ? (
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Recommended Product:</p>
                        <h3 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">{result.suggestion}</h3>
                        <blockquote className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-brand-primary">
                            {result.pitch}
                        </blockquote>
                    </div>
                ) : (
                    <p className="text-gray-500">No suggestion available or an error occurred.</p>
                )}
            </div>
            <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                <Button onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};

const UpsellingDashboard: React.FC<UpsellingDashboardProps> = ({ members, upsellCategories, insuranceTypes, addToast, users, branches }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [suggestionResult, setSuggestionResult] = useState<{ suggestion: string; pitch: string } | null>(null);
    
    const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');

    const advisors = useMemo(() => users.filter(u => u.role === 'Advisor'), [users]);
    const sortedCategories = useMemo(() => [...upsellCategories].sort((a, b) => a.order - b.order), [upsellCategories]);

    // --- START OF CORRECTION: Filter for members with at least one policy ---
    const membersWithPolicies = useMemo(() => {
        return members.filter(member => member.policies && member.policies.length > 0);
    }, [members]);
    // --- END OF CORRECTION ---

    const categoryToInsuranceTypeMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        if (!insuranceTypes || insuranceTypes.length === 0) return map;

        const insuranceTypeMap = new Map(insuranceTypes.map(it => [it.id, it]));

        const getAllDescendantIds = (parentId: string, allTypes: Map<string, InsuranceTypeMaster>): string[] => {
            const children = Array.from(allTypes.values()).filter(it => it.parentId === parentId).map(it => it.id);
            let descendantIds: string[] = [...children];
            for (const childId of children) {
                descendantIds = [...descendantIds, ...getAllDescendantIds(childId, allTypes)];
            }
            return descendantIds;
        };

        sortedCategories.forEach(category => {
            const allLinkedIds = new Set<string>();
            category.linkedInsuranceTypeIds.forEach(parentTypeId => {
                allLinkedIds.add(parentTypeId);
                const descendants = getAllDescendantIds(parentTypeId, insuranceTypeMap);
                descendants.forEach(id => allLinkedIds.add(id));
            });
            map.set(category.id, allLinkedIds);
        });

        return map;
    }, [sortedCategories, insuranceTypes]);


    const memberUpsellStatus = useMemo(() => {
        const statusMap = new Map<string, Set<string>>();
        if (!membersWithPolicies) return statusMap;

        // Use the filtered list here
        membersWithPolicies.forEach(member => {
            const ownedCategoryIds = new Set<string>();
            member.policies.forEach(policy => {
                if (policy.insuranceTypeId) {
                    for (const category of sortedCategories) {
                        const allLinkedIds = categoryToInsuranceTypeMap.get(category.id);
                        if (allLinkedIds && allLinkedIds.has(policy.insuranceTypeId)) {
                            ownedCategoryIds.add(category.id);
                            break; 
                        }
                    }
                }
            });
            statusMap.set(member.id, ownedCategoryIds);
        });

        return statusMap;
    }, [membersWithPolicies, sortedCategories, categoryToInsuranceTypeMap]);

    const filteredMembers = useMemo(() => {
        // Start with the pre-filtered list of members who have policies
        return membersWithPolicies.filter(member => {
            const searchMatch = searchQuery === '' ||
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.memberId.toLowerCase().includes(searchQuery.toLowerCase());

            const advisorMatch = selectedAdvisor === 'all' || member.assignedTo.includes(selectedAdvisor);
            const branchMatch = selectedBranch === 'all' || member.branchId === selectedBranch;
            const productMatch = selectedProductFilter === 'all' || !memberUpsellStatus.get(member.id)?.has(selectedProductFilter);

            return searchMatch && advisorMatch && branchMatch && productMatch;
        });
    }, [membersWithPolicies, searchQuery, selectedAdvisor, selectedBranch, selectedProductFilter, memberUpsellStatus]);

    const categoryCounts = useMemo(() => {
        const counts = new Map<string, number>();
        sortedCategories.forEach(cat => {
            let count = 0;
            filteredMembers.forEach(member => {
                if (memberUpsellStatus.get(member.id)?.has(cat.id)) {
                    count++;
                }
            });
            counts.set(cat.id, count);
        });
        return counts;
    }, [filteredMembers, sortedCategories, memberUpsellStatus]);


    const handleGetSuggestion = async (member: Member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
        setIsLoadingSuggestion(true);
        setSuggestionResult(null);
        try {
            const result = await generateUpsellSuggestion(member, upsellCategories, addToast);
            setSuggestionResult(result);
        } catch (error) {
            addToast('Failed to get AI suggestion.', 'error');
            console.error(error);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMember(null);
        setSuggestionResult(null);
    };

    return (
        <div className="space-y-6">
            <SuggestionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                member={selectedMember}
                isLoading={isLoadingSuggestion}
                result={suggestionResult}
            />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <h1 className="text-2xl font-bold text-brand-dark dark:text-white">Upselling / Business Promotion</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View customer product ownership at a glance and get AI-powered suggestions for the next best product to offer.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                <div className="p-4 border-b dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="upsell-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Customer
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="upsell-search"
                                name="upsell-search"
                                type="text"
                                placeholder="By name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full h-10 pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            />
                        </div>
                    </div>
                     <SearchableSelect
                        label="Filter by Advisor"
                        options={[{ value: 'all', label: 'All Advisors' }, ...advisors.map(a => ({ value: a.id, label: a.name }))]}
                        value={selectedAdvisor}
                        onChange={setSelectedAdvisor}
                    />
                     <SearchableSelect
                        label="Filter by Branch"
                        options={[{ value: 'all', label: 'All Branches' }, ...branches.map(b => ({ value: b.id, label: b.branchName }))]}
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                    />
                     <SearchableSelect
                        label="Find Opportunity In"
                        options={[{ value: 'all', label: 'All Products' }, ...sortedCategories.map(c => ({ value: c.id, label: c.name }))]}
                        value={selectedProductFilter}
                        onChange={setSelectedProductFilter}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-1/4">
                                    Customer ({filteredMembers.length})
                                </th>
                                {sortedCategories.map(cat => (
                                    <th key={cat.id} className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{cat.name}</span>
                                            <span className="bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200 rounded-full px-2 py-0.5 text-xs font-bold">
                                                {categoryCounts.get(cat.id) || 0}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">AI Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap">
                                        <div className="font-bold">{member.name}</div>
                                        <div className="text-xs text-gray-500">{member.memberId}</div>
                                    </td>
                                    {sortedCategories.map(cat => {
                                        const hasCategory = memberUpsellStatus.get(member.id)?.has(cat.id);
                                        return (
                                            <td key={cat.id} className="px-4 py-3 text-center">
                                                {hasCategory ? (
                                                    <CheckCircle className="mx-auto w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="mx-auto w-5 h-5 text-gray-400" />
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-center">
                                        <Button
                                            variant="light"
                                            size="small"
                                            onClick={() => handleGetSuggestion(member)}
                                        >
                                            <Sparkles size={14} className="mr-1.5" />
                                            Get Suggestion
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredMembers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No customers found for your search or filter criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpsellingDashboard;