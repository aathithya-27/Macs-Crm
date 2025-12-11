import React from 'react';
import { BankMaster, AccountType, Member } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface BankMastersManagerProps {
    bankMasters: BankMaster[];
    onUpdateBankMasters: (data: BankMaster[]) => void;
    accountTypes: AccountType[];
    onUpdateAccountTypes: (data: AccountType[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const BankMastersManager: React.FC<BankMastersManagerProps> = ({
    bankMasters,
    onUpdateBankMasters,
    accountTypes,
    onUpdateAccountTypes,
    addToast,
    allMembers,
    canCreate,
    canModify,
}) => {
    return (
        <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Bank Management</h3>
            <GenericMasterManager
                key="bankMasters"
                title="Manage Bank Master"
                items={bankMasters.map(b => ({ id: b.id, name: b.bankName, active: b.active, order: b.order }))}
                onUpdate={(updatedItems) => {
                    const originalBanksMap = new Map(bankMasters.map(b => [b.id, b]));
                    const newBankMasters = updatedItems.map(item => {
                        const originalBank = originalBanksMap.get(item.id);
                        if (originalBank) {
                            return { ...originalBank, bankName: item.name, active: item.active !== false, order: item.order };
                        }
                        return {
                            id: item.id,
                            bankCode: `NEW-${item.id.slice(-4)}`,
                            bankName: item.name,
                            branch_name: 'Default Branch',
                            active: item.active !== false,
                            accountType: '',
                            accountNumber: '',
                            order: item.order,
                        } as BankMaster;
                    });
                    onUpdateBankMasters(newBankMasters);
                }}
                addToast={addToast}
                noun="Bank"
                reorderable={true}
                codeColumnDisplay="hidden"
                dependencyCheck={(id) => {
                    const item = bankMasters.find(b => b.id === id);
                    if (!item) return [];
                    return allMembers.filter(m => m.bankDetails?.bankName === item.bankName).map(m => ({ name: `Customer: ${m.name}`, type: 'member' }));
                }}
                canCreate={canCreate}
                canModify={canModify}
            />

            <GenericMasterManager
                key="accountTypes"
                title="Manage Account Types"
                items={accountTypes}
                onUpdate={onUpdateAccountTypes}
                addToast={addToast}
                noun="Account Type"
                reorderable={true}
                codeColumnDisplay="hidden"
                canCreate={canCreate}
                canModify={canModify}
            />
        </div>
    );
};

export default BankMastersManager;