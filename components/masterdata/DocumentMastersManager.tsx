import React from 'react';
import { DocumentMaster, InsuranceTypeDocumentRule } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface DocumentMastersManagerProps {
    documentMasters: DocumentMaster[];
    onUpdateDocumentMasters: (data: DocumentMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    insuranceTypeDocumentRules: InsuranceTypeDocumentRule[];
    canCreate: boolean;
    canModify: boolean;
}

const DocumentMastersManager: React.FC<DocumentMastersManagerProps> = ({
    documentMasters,
    onUpdateDocumentMasters,
    addToast,
    insuranceTypeDocumentRules,
    canCreate,
    canModify,
}) => {
    return (
        <GenericMasterManager
            title="Manage Document Master"
            items={documentMasters}
            onUpdate={onUpdateDocumentMasters}
            addToast={addToast}
            noun="Document"
            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden" 

            dependencyCheck={(id) => {
                return insuranceTypeDocumentRules
                    .filter(rule => rule.documentId === id)
                    .map(rule => ({ name: `Policy Config Rule ID: ${rule.id}`, type: 'field' })); 
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default DocumentMastersManager;