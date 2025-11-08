import React from 'react';
import { CustomerFieldMaster } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface CustomerFieldManagerProps {
    customerFieldMasters: CustomerFieldMaster[];
    onUpdateCustomerFieldMasters: (data: CustomerFieldMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

const CustomerFieldManager: React.FC<CustomerFieldManagerProps> = ({
    customerFieldMasters,
    onUpdateCustomerFieldMasters,
    addToast,
    canCreate,
    canModify
}) => {
    return (
        <GenericMasterManager
            title="Manage Custom Customer Fields"
            items={customerFieldMasters}
            onUpdate={onUpdateCustomerFieldMasters}
            addToast={addToast}
            noun="Field"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="group" 

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default CustomerFieldManager;