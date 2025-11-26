import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, Search, Megaphone, Activity, Calendar } from 'lucide-react';
import { CampaignMaster } from '../../types';
import { getCampaigns, createCampaign, updateCampaign } from '../../services/apiService';

interface CampaignMasterManagerProps {
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

const CampaignMasterManager: React.FC<CampaignMasterManagerProps> = ({ addToast, canCreate, canModify }) => {
    const [campaigns, setCampaigns] = useState<CampaignMaster[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<CampaignMaster | null>(null);
    const [formData, setFormData] = useState<Partial<CampaignMaster>>({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        active: true
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const data = await getCampaigns();
            setCampaigns(data);
        } catch (error) {
            addToast('Failed to load campaigns', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (campaign?: CampaignMaster) => {
        if (campaign) {
            setEditingCampaign(campaign);
            setFormData({ ...campaign });
        } else {
            setEditingCampaign(null);
            setFormData({ name: '', description: '', startDate: '', endDate: '', active: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCampaign(null);
        setFormData({ name: '', description: '', startDate: '', endDate: '', active: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            addToast('Campaign Name is required', 'error');
            return;
        }
        if (!formData.startDate) {
            addToast('Start Date is required', 'error');
            return;
        }
        if (!formData.endDate) {
            addToast('End Date is required', 'error');
            return;
        }
        if (formData.startDate >= formData.endDate) {
            addToast('End Date must be after Start Date', 'error');
            return;
        }

        try {
            if (editingCampaign) {
                const updated = await updateCampaign({ ...editingCampaign, ...formData } as CampaignMaster);
                setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
                addToast('Campaign updated successfully', 'success');
            } else {
                const created = await createCampaign(formData as Omit<CampaignMaster, 'id'>);
                setCampaigns(prev => [...prev, created]);
                addToast('Campaign created successfully', 'success');
            }
            handleCloseModal();
        } catch (error) {
            addToast('Failed to save campaign', 'error');
        }
    };



    const toggleStatus = async (campaign: CampaignMaster) => {
        if (!canModify) return;
        try {
            const updated = await updateCampaign({ ...campaign, active: !campaign.active });
            setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
            addToast(`Campaign ${updated.active ? 'activated' : 'deactivated'}`, 'success');
        } catch (error) {
            addToast('Failed to update status', 'error');
        }
    };

    const filteredCampaigns = campaigns.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Megaphone className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Campaign Master</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Define marketing campaigns for execution.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Campaigns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                    
                    {canCreate && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            <Plus size={18} />
                            New Campaign
                        </button>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">ID</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Date</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Date</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                {canModify && <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredCampaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={canModify ? 7 : 6} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        <Megaphone className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                        <p>No campaigns found.</p>
                                        <p className="text-sm mt-1">Create a new campaign to get started.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCampaigns.map((campaign, index) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                        <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white">{campaign.name}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{campaign.description || '-'}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(campaign.startDate).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(campaign.endDate).toLocaleDateString()}</td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => toggleStatus(campaign)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${campaign.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${campaign.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        {canModify && (
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleOpenModal(campaign)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                {editingCampaign ? <Edit2 size={20} className="text-blue-600"/> : <Plus size={20} className="text-green-600"/>}
                                {editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Campaign Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow"
                                    placeholder="e.g. Diwali Bonanza"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow"
                                    rows={3}
                                    placeholder="Optional description of the campaign..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.startDate || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={formData.endDate || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-shadow"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-gray-500"/>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Status</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                                >
                                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignMasterManager;