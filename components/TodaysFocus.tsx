import React, { useMemo } from 'react';
// MODIFIED: Import permission-related types
import { Member, Lead, UpsellOpportunity, TodaysFocusItem, ModalTab, AppModule, PermissionLevel } from '../types.ts';
import { Loader2, Zap, Lightbulb, TrendingUp, AlertTriangle, Phone, Star, Eye, X, RefreshCw, ListTodo } from 'lucide-react'; // MODIFIED: Imported ListTodo
import Button from './ui/Button.tsx';

interface TodaysFocusProps {
    members: Member[];
    leads: Lead[];
    notifications: any[];
    upsellOpportunities: UpsellOpportunity[];
    onOpenModal: (member: Member | null, initialTab?: ModalTab | null) => void;
    onOpenLeadModal: (lead: Lead | null) => void;
    dismissedFocusItems: string[];
    onDismissFocusItem: (itemId: string) => void;
    focusItems: TodaysFocusItem[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    // NEW: Accept permissions prop
    permissions: { [key in AppModule]?: PermissionLevel };
}

const FocusItemCard: React.FC<{ 
    item: TodaysFocusItem, 
    members: Member[], 
    leads: Lead[],
    onOpenModal: (member: Member | null, initialTab?: ModalTab | null) => void,
    onOpenLeadModal: (lead: Lead | null) => void,
    onDismiss: (itemId: string) => void;
    // NEW: Accept permissions prop
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ item, members, leads, onOpenModal, onOpenLeadModal, onDismiss, permissions }) => {
    const priorityStyles = {
        High: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-500',
            icon: <AlertTriangle className="text-red-500" size={20} />
        },
        Medium: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-500',
            icon: <TrendingUp className="text-orange-500" size={20} />
        },
        Low: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-500',
            icon: <Lightbulb className="text-blue-500" size={20} />
        },
    };

    const style = priorityStyles[item.priority];
    const member = members.find(m => m.id === item.relatedId);
    const lead = leads.find(l => l.id === item.relatedId);

    // NEW: Permission checks for different actions
    const canViewCustomer = permissions?.customers && permissions.customers !== 'none';
    const canViewLead = permissions?.pipeline && permissions.pipeline !== 'none';
    const canCreateTask = permissions?.taskManagement === 'create' || permissions?.taskManagement === 'modify';

    const handleCall = () => {
        const phone = member?.mobile || lead?.phone;
        if (phone) {
                      window.location.href = `tel:${phone}`;
        }
    };

    const handleView = () => {
        if (member && canViewCustomer) {
            onOpenModal(member);
        } else if (lead && canViewLead) {
            onOpenLeadModal(lead);
        }
    };

    // NEW: Handler for creating a task (simulation)
    const handleCreateTask = () => {
        // In a real app, this would likely open a task creation modal pre-filled with this info.
        // For now, we simulate the action.
        console.log(`(Simulated) Creating task: ${item.title} for ${item.relatedName}`);
    };

    return (
        <div className={`p-4 rounded-lg border-l-4 flex flex-col md:flex-row md:items-start gap-4 ${style.bg} ${style.border} relative group`}>
             <button 
                onClick={() => onDismiss(item.id)} 
                className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Dismiss item"
            >
                <X size={14} />
            </button>
            <div className="flex-shrink-0 mt-1">
                {style.icon}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.rationale}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 self-end md:self-start">
                 {/* MODIFIED: Action buttons are now permission-aware */}
                 {item.action === 'call' && <Button onClick={handleCall} variant="light" size="small" disabled={!member && !lead}><Phone size={14}/> Call</Button>}
                 {(item.action === 'review' || item.action === 'follow-up') && <Button onClick={handleView} variant="secondary" size="small" disabled={!member && !lead}><Eye size={14}/> View</Button>}
                 {/* NEW: Conditionally render Create Task button */}
                 {item.action === 'task' && (
                    <Button onClick={handleCreateTask} variant="secondary" size="small" disabled={!canCreateTask}>
                        <ListTodo size={14}/> Create Task
                    </Button>
                 )}
            </div>
        </div>
    );
};

const TodaysFocus: React.FC<TodaysFocusProps> = ({ members, leads, onOpenModal, onOpenLeadModal, dismissedFocusItems, onDismissFocusItem, focusItems, isLoading, error, onRefresh, permissions }) => {
    
    const visibleItems = useMemo(() => {
        return focusItems.filter(item => !dismissedFocusItems.includes(item.id));
    }, [focusItems, dismissedFocusItems]);


    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <Zap size={20} className="text-brand-primary" />
                    Today's Focus
                </h3>
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    <p className="mt-3 font-semibold">Gemini is analyzing your day...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-brand-primary" />
                    Today's Focus
                </h3>
                <Button onClick={onRefresh} variant="light" size="small" disabled={isLoading}>
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </Button>
            </div>
            <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
                {error ? (
                    <div className="text-center py-10 text-red-600">{error}</div>
                ) : visibleItems.length > 0 ? (
                    <div className="space-y-4">
                        {visibleItems.map(item => (
                            <FocusItemCard 
                                key={item.id} 
                                item={item} 
                                members={members} 
                                leads={leads} 
                                onOpenModal={onOpenModal} 
                                onOpenLeadModal={onOpenLeadModal} 
                                onDismiss={onDismissFocusItem} 
                                // NEW: Pass permissions down
                                permissions={permissions}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center">
                        <Star size={32} className="mx-auto text-gray-300 dark:text-gray-600"/>
                        <p className="mt-2 font-semibold">All Clear!</p>
                        <p className="text-sm">No high-priority actions from the AI today.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodaysFocus;