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
    currentVerticalId?: string;
}

const MutualFundsManager: React.FC<MutualFundsManagerProps> = (props) => {
    const {
        mutualFundFields, onUpdateMutualFundFields,
        processStageMasters, onUpdateProcessStageMasters,
        allMembers,
        addToast,
        canCreate,
        canModify
    } = props;

    return (
        <div className="space-y-8">
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