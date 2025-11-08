import React from 'react';
import { LeadStageMaster, Lead } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface LeadStageManagerProps {
    leadStageMasters: LeadStageMaster[];
    onUpdateLeadStageMasters: (data: LeadStageMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allLeads: Lead[];
    canCreate: boolean;
    canModify: boolean;
}

const LeadStageManager: React.FC<LeadStageManagerProps> = ({
    leadStageMasters,
    onUpdateLeadStageMasters,
    addToast,
    allLeads,
    canCreate,
    canModify,
}) => {
    return (
        <GenericMasterManager
            title="Manage Lead Pipeline Stages"
            items={leadStageMasters}
            onUpdate={onUpdateLeadStageMasters}
            addToast={addToast}
            noun="Lead Stage"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden" 

            dependencyCheck={(id) => {
                const stage = leadStageMasters.find(s => s.id === id);
                if (!stage) return [];
                return allLeads
                    .filter(lead => lead.status === stage.name)
                    .map(lead => ({ name: `Lead: ${lead.name}`, type: 'task' })); // Using 'task' type for a consistent icon
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default LeadStageManager;