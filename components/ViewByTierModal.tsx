
import React, { useMemo } from 'react';
import { Member, CustomerTier, User, ModalTab } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { X, Users as UsersIcon, Eye, IndianRupee, Shield } from 'lucide-react';

interface ViewByTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: CustomerTier;
  allMembers: Member[];
  allTiers: CustomerTier[];
  calculationMethod: 'sumAssured' | 'premium';
  onViewMember: (member: Member, initialTab?: ModalTab) => void;
  users: User[];
}

export const ViewByTierModal: React.FC<ViewByTierModalProps> = ({
  isOpen,
  onClose,
  tier,
  allMembers,
  allTiers,
  calculationMethod,
  onViewMember,
  users
}) => {
    
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  const filteredMembers = useMemo(() => {
    const sortedTiers = [...allTiers].sort((a, b) => {
        const aValue = calculationMethod === 'sumAssured' ? (a.minimumSumAssured ?? 0) : (a.minimumPremium ?? 0);
        const bValue = calculationMethod === 'sumAssured' ? (b.minimumSumAssured ?? 0) : (b.minimumPremium ?? 0);
        return aValue - bValue;
    });

    const getMemberTier = (member: Member): CustomerTier | null => {
        const totalSumAssured = member.policies.reduce((sum, p) => sum + (p.coverage || 0), 0);
        const totalPremium = member.policies.reduce((sum, p) => sum + (p.premium || 0), 0);

        let assignedTier: CustomerTier | null = null;
        for (const currentTier of [...sortedTiers].reverse()) {
             if (calculationMethod === 'sumAssured') {
                if (totalSumAssured >= (currentTier.minimumSumAssured ?? 0)) {
                    assignedTier = currentTier;
                    break;
                }
            } else { // 'premium'
                 if (totalPremium >= (currentTier.minimumPremium ?? 0)) {
                    assignedTier = currentTier;
                    break;
                }
            }
        }
        return assignedTier;
    };

    return allMembers.filter(member => {
        const memberTier = getMemberTier(member);
        return memberTier?.id === tier.id;
    });
  }, [allMembers, allTiers, calculationMethod, tier]);

  const CustomerCard = ({ member }: { member: Member }) => {
    const totalSumAssured = member.policies.reduce((sum, p) => sum + (p.coverage || 0), 0);
    const totalPremium = member.policies.reduce((sum, p) => sum + (p.premium || 0), 0);
    const assignedAdvisor = userMap.get(member.assignedTo?.[0] || '');

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-brand-dark dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {member.sno}</p>
                </div>
                <Button size="small" variant="light" onClick={() => onViewMember(member, ModalTab.BasicInfo)}>
                    <Eye size={14}/> View Profile
                </Button>
            </div>
            <div className="mt-3 pt-3 border-t dark:border-gray-600 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Assigned Advisor</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{assignedAdvisor || 'N/A'}</p>
                </div>
                 <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Active Policies</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{member.policies.filter(p => p.status === 'Active').length}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-blue-500"/>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total Sum Assured</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">₹{totalSumAssured.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <IndianRupee size={14} className="text-green-500"/>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total Premium</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">₹{totalPremium.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-dark dark:text-white">
            Customers in {tier.name} Tier
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Displaying {filteredMembers.length} customer(s) based on the current calculation method: <span className="font-semibold text-brand-primary">{calculationMethod}</span>.
        </p>
      </div>

      <div className="p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900/50">
        {filteredMembers.length > 0 ? (
          <div className="space-y-4">
            {filteredMembers.map(member => (
              <CustomerCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <UsersIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-lg font-semibold">No Customers Found</p>
            <p className="mt-1 text-sm">There are no customers that currently match the criteria for the {tier.name} tier.</p>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onClose} variant="primary">
          Close
        </Button>
      </div>
    </Modal>
  );
};
