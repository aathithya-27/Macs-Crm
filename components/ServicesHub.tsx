import React, { useState, useMemo } from 'react';
import { Member, ModalTab, User, Designation } from '../types.ts';
import CommissionDashboard from './CommissionDashboard.tsx';
import AgentAppointments from './AgentAppointments.tsx';
import { Percent, Calendar } from 'lucide-react';

// Define the props interface for clarity
interface ServicesHubProps {
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    onViewMember: (member: Member, initialTab?: ModalTab) => void;
    onUpdateCommissionStatus: (memberId: string, policyId: string, status: 'Pending' | 'Paid' | 'Cancelled') => void;
    currentUser: User | null;
    designations: Designation[];
}

const ServicesHub: React.FC<ServicesHubProps> = (props) => {
    type Service = 'commissions' | 'agentAppointments';
    const [activeService, setActiveService] = useState<Service>('commissions');

    const serviceComponents: Record<Service, React.ReactNode> = {
        commissions: <CommissionDashboard members={props.allMembers} onViewMember={props.onViewMember} onUpdateCommissionStatus={props.onUpdateCommissionStatus} />,
        agentAppointments: <AgentAppointments />,
    };

    const navItems = [
        { id: 'commissions', label: 'Commissions', icon: <Percent size={20} /> },
        { id: 'agentAppointments', label: 'Agent Appointments', icon: <Calendar size={20} /> },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Services Hub</h2>
                <nav className="space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveService(item.id as Service)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${
                                activeService === item.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1">
                {serviceComponents[activeService]}
            </div>
        </div>
    );
};

export default ServicesHub;