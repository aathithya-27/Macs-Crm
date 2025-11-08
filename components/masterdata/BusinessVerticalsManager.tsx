import React from 'react';
import { BusinessVertical, InsuranceTypeMaster, Member } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface BusinessVerticalsManagerProps {
    businessVerticals: BusinessVertical[];
    onUpdateBusinessVerticals: (data: BusinessVertical[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    insuranceTypes: InsuranceTypeMaster[];
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const BusinessVerticalsManager: React.FC<BusinessVerticalsManagerProps> = (props) => {
    const {
        businessVerticals,
        onUpdateBusinessVerticals,
        addToast,
        insuranceTypes,
        allMembers,
        canCreate,
        canModify,
    } = props;
    return (
        <GenericMasterManager
            title="Manage Business Vertical"
            items={businessVerticals}
            onUpdate={onUpdateBusinessVerticals}
            addToast={addToast}
            noun="Business Vertical"

            reorderable={true}
            showAddButton={false} 
            showSearchBar={true}
            codeColumnDisplay="hidden" 

            dependencyCheck={(id) => {
                const dependents = [];
                const vertical = businessVerticals.find(bv => bv.id === id);

                if (!vertical) return [];

                const linkedInsuranceTypes = insuranceTypes
                    .filter(it => it.verticalId === id)
                    .map(it => ({ name: `Insurance Type: ${it.name}`, type: 'field' as const }));
                dependents.push(...linkedInsuranceTypes);

                if (vertical.name.toLowerCase().includes('mutual funds')) {
                    const membersWithMF = allMembers.filter(m => m.mutualFundHoldings && m.mutualFundHoldings.length > 0);
                    if (membersWithMF.length > 0) {
                        const mfDependents = membersWithMF.map(m => ({ name: `Customer: ${m.name}`, type: 'member' as const }));
                        dependents.push(...mfDependents);
                    }
                }

                return dependents;
            }}
            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default BusinessVerticalsManager;