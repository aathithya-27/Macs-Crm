import React, { useMemo } from 'react';

import {
    AMC, MutualFundScheme, MutualFundFieldMaster, BusinessVertical,
    ProcessStageMaster, Member
} from '../../types';

import GenericMasterManager from './GenericMasterManager';
import ProcessStageManager from './ProcessStageManager';

interface MutualFundsManagerProps {
    amcs: AMC[];
    onUpdateAmcs: (data: AMC[]) => void;
    mutualFundSchemes: MutualFundScheme[];
    onUpdateMutualFundSchemes: (data: MutualFundScheme[]) => void;
    mutualFundFields: MutualFundFieldMaster[];
    onUpdateMutualFundFields: (data: MutualFundFieldMaster[]) => void;
    businessVerticals: BusinessVertical[];
    processStageMasters: ProcessStageMaster[];
    onUpdateProcessStageMasters: (data: ProcessStageMaster[]) => void;
    allMembers: Member[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

const MutualFundsManager: React.FC<MutualFundsManagerProps> = (props) => {
    const {
        amcs, onUpdateAmcs,
        mutualFundSchemes, onUpdateMutualFundSchemes,
        mutualFundFields, onUpdateMutualFundFields,
        businessVerticals,
        processStageMasters, onUpdateProcessStageMasters,
        allMembers,
        addToast,
        canCreate,
        canModify
    } = props;

    const mfCategories: { value: string; label: string }[] = [
        'Equity', 'Debt', 'Hybrid', 'Solution Oriented', 'Other'
    ].map(c => ({ value: c, label: c }));

    return (
        <div className="space-y-8">
            <GenericMasterManager
                key="amcs"
                title="Manage Asset Management Companies (AMCs)"
                items={amcs}
                onUpdate={onUpdateAmcs}
                addToast={addToast}
                noun="AMC"
                reorderable={true}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => mutualFundSchemes.filter(s => s.amcId === id).map(s => ({ name: `Scheme: ${s.name}`, type: 'policy' }))}
                extraFields={[
                    {
                        label: 'Business Vertical',
                        field: 'verticalId',
                        type: 'select',
                        options: businessVerticals.filter(v => v.active && v.name.toLowerCase().includes('mutual fund')).map(v => ({ value: v.id, label: v.name }))
                    }
                ]}
                onBeforeSave={(item) => {
                    if (!item.verticalId) {
                        addToast('Business Vertical is required for an AMC.', 'error');
                        return false;
                    }
                    return true;
                }}
                canCreate={canCreate}
                canModify={canModify}
            />

            <GenericMasterManager
                key="mfSchemes"
                title="Manage Mutual Fund Schemes"
                items={mutualFundSchemes}
                onUpdate={onUpdateMutualFundSchemes}
                addToast={addToast}
                noun="Mutual Fund Scheme"
                reorderable={true}
                codeColumnDisplay="hidden"
                extraFields={[
                    {
                        label: 'AMC',
                        field: 'amcId',
                        type: 'select',
                        options: amcs.filter(a => a.active).map(a => ({ value: a.id, label: a.name }))
                    },
                    {
                        label: 'Category',
                        field: 'category',
                        type: 'select',
                        options: mfCategories
                    }
                ]}
                dependencyCheck={(id) =>
                    allMembers.flatMap(member => // Changed 'm' to 'member'
                        (member.mutualFundHoldings || []).filter(h => h.schemeId === id)
                                                      .map(h => ({ name: `Folio ${h.folioNumber} for ${member.name}`, type: 'member' }))
                    )
                }
                canCreate={canCreate}
                canModify={canModify}
            />

            <GenericMasterManager
                key="mutualFundFields"
                title="Manage Custom Mutual Fund Fields"
                items={mutualFundFields}
                onUpdate={onUpdateMutualFundFields}
                addToast={addToast}
                noun="Field"
                reorderable={true}
                codeColumnDisplay="group"
                canCreate={canCreate}
                canModify={canModify}
            />

            <ProcessStageManager
                key="psm-mf"
                title="Manage Mutual Fund Process Flow"
                items={processStageMasters.filter(psm => psm.isMutualFund)}
                onUpdate={(updatedStages) => {
                    const otherStages = processStageMasters.filter(psm => !psm.isMutualFund);
                    const newStagesForMF = updatedStages.map(s => ({ ...s, isMutualFund: true, insuranceTypeId: null }));
                    onUpdateProcessStageMasters([...otherStages, ...newStagesForMF]);
                }}
                addToast={addToast}
                allMembers={allMembers}
                typeId="mutual-fund"
                canCreate={canCreate}
                canModify={canModify}
            />
        </div>
    );
};

export default MutualFundsManager;