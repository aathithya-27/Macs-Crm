import React from 'react';
import { Gender, Member } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface GendersManagerProps {
    genders: Gender[];
    onUpdateGenders: (data: Gender[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const GendersManager: React.FC<GendersManagerProps> = ({
    genders,
    onUpdateGenders,
    addToast,
    allMembers,
    canCreate,
    canModify
}) => {
    return (
        <GenericMasterManager
            title="Manage Genders"
            items={genders}
            onUpdate={onUpdateGenders}
            addToast={addToast}
            noun="Gender"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden"

            dependencyCheck={(id) => {
                return allMembers
                    .filter(member => member.gender === id)
                    .map(member => ({ name: `Customer: ${member.name}`, type: 'member' }));
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default GendersManager;