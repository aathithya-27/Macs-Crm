import React from 'react';
import {
    CustomerCategory, CustomerSubCategory, CustomerGroup,
    CustomerType, Member, CustomerTier
} from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface CustomerSegmentsManagerProps {
    customerCategories: CustomerCategory[];
    onUpdateCustomerCategories: (data: CustomerCategory[]) => void;
    customerSubCategories: CustomerSubCategory[];
    onUpdateCustomerSubCategories: (data: CustomerSubCategory[]) => void;
    customerGroups: CustomerGroup[];
    onUpdateCustomerGroups: (data: CustomerGroup[]) => void;
    customerTypes: CustomerType[];
    onUpdateCustomerTypes: (data: CustomerType[]) => void;
    customerTiers: CustomerTier[];
    allMembers: Member[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    canCreate: boolean;
    canModify: boolean;
}

const CustomerSegmentsManager: React.FC<CustomerSegmentsManagerProps> = (props) => {
    const {
        customerCategories, onUpdateCustomerCategories,
        customerSubCategories, onUpdateCustomerSubCategories,
        customerGroups, onUpdateCustomerGroups,
        customerTypes, onUpdateCustomerTypes,
        customerTiers,
        allMembers,
        addToast,
        canCreate,
        canModify
    } = props;

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Customer Segment Management</h3>

            <GenericMasterManager
                title="Manage Customer Category"
                items={customerCategories}
                onUpdate={onUpdateCustomerCategories}
                addToast={addToast}
                noun="Customer Category"
                dependencyCheck={(id) => allMembers.filter(m => m.customerCategoryId === id).map(m => ({ name: `Customer: ${m.name}`, type: 'member' }))}
                reorderable={true}
                codeColumnDisplay="hidden"
                canCreate={canCreate}
                canModify={canModify}
            />

            <GenericMasterManager
                title="Manage Customer Sub-Category"
                items={customerSubCategories}
                onUpdate={onUpdateCustomerSubCategories}
                addToast={addToast}
                noun="Customer Sub-Category"
                dependencyCheck={(id) => allMembers.filter(m => m.customerSubCategoryId === id).map(m => ({ name: `Customer: ${m.name}`, type: 'member' }))}
                extraFields={[{
                    label: 'Parent Category',
                    field: 'parentId',
                    type: 'select',
                    options: customerCategories.map(c => ({ value: c.id, label: c.name }))
                }]}
                reorderable={true}
                codeColumnDisplay="hidden"
                canCreate={canCreate}
                canModify={canModify}
            />

            <GenericMasterManager
                title="Manage Customer Group"
                items={customerGroups}
                onUpdate={onUpdateCustomerGroups}
                addToast={addToast}
                noun="Customer Group"
                dependencyCheck={(id) => allMembers.filter(m => m.customerGroupId === id).map(m => ({ name: `Customer: ${m.name}`, type: 'member' }))}
                reorderable={true}
                codeColumnDisplay="hidden"
                canCreate={canCreate}
                canModify={canModify}
            />

            <GenericMasterManager
                title="Manage Customer Type"
                items={customerTypes}
                onUpdate={onUpdateCustomerTypes}
                addToast={addToast}
                noun="Customer Type"
                reorderable={true}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => customerTiers.filter(t => t.customerTypeId === id).map(t => ({ name: `Tier Rule: ${t.name || 'Unnamed'}`, type: 'policy' }))}
                canCreate={canCreate}
                canModify={canModify}
            />
        </div>
    );
};

export default CustomerSegmentsManager;