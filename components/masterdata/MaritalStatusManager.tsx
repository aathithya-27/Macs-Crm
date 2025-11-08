import React from 'react';
import { MaritalStatus, Member } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface MaritalStatusManagerProps {
    maritalStatuses: MaritalStatus[];
    onUpdateMaritalStatuses: (data: MaritalStatus[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const MaritalStatusManager: React.FC<MaritalStatusManagerProps> = ({
    maritalStatuses,
    onUpdateMaritalStatuses,
    addToast,
    allMembers,
    canCreate,
    canModify
}) => {
    return (
        <GenericMasterManager
            title="Manage Marital Statuses"
            items={maritalStatuses}
            onUpdate={onUpdateMaritalStatuses}
            addToast={addToast}
            noun="Marital Status"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden"

            dependencyCheck={(id) => {
                return allMembers
                    .filter(member => member.maritalStatus === id)
                    .map(member => ({ name: `Customer: ${member.name}`, type: 'member' }));
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default MaritalStatusManager;