import React from 'react';
import { RelationshipType, Member } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface RelationshipTypesManagerProps {
    relationshipTypes: RelationshipType[];
    onUpdateRelationshipTypes: (data: RelationshipType[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const RelationshipTypesManager: React.FC<RelationshipTypesManagerProps> = ({
    relationshipTypes,
    onUpdateRelationshipTypes,
    addToast,
    allMembers,
    canCreate,
    canModify,
}) => {
    return (
        <GenericMasterManager
            title="Manage Relationship Types"
            items={relationshipTypes}
            onUpdate={onUpdateRelationshipTypes}
            addToast={addToast}
            noun="Relationship Type"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden"

            dependencyCheck={(id) => {
                const relationship = relationshipTypes.find(rt => rt.id === id);
                if (!relationship) return [];

                const dependents: { name: string; type: 'member' }[] = [];
                allMembers.forEach(member => {
                    const isInUse = member.policies.some(policy =>
                        (policy.coveredMembers || []).some(covered => covered.relationship === relationship.name)
                    );
                    if (isInUse) {
                        dependents.push({ name: `Customer: ${member.name}`, type: 'member' });
                    }
                });
                return dependents;
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default RelationshipTypesManager;