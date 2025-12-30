import React, { useState } from 'react';
import { 
    BusinessVertical, InsuranceTypeMaster, Member, InsuranceFieldMaster, 
    SchemeMaster, ProcessStageMaster, DocumentMaster, InsuranceTypeDocumentRule,
    AMC, MutualFundScheme, MutualFundFieldMaster
} from '../../types';
import GenericMasterManager from './GenericMasterManager';
import PolicyConfigurationManager from './PolicyConfigurationManager';
import MutualFundsManager from './MutualFundsManager';
import ToggleSwitch from '../ui/ToggleSwitch';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BusinessVerticalsManagerProps {
    businessVerticals: BusinessVertical[];
    onUpdateBusinessVerticals: (data: BusinessVertical[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    insuranceTypes: InsuranceTypeMaster[];
    onUpdateInsuranceTypes: (data: InsuranceTypeMaster[]) => void;
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    schemes: SchemeMaster[];
    processStageMasters: ProcessStageMaster[];
    onUpdateProcessStageMasters: (data: ProcessStageMaster[]) => void;
    documentMasters: DocumentMaster[];
    insuranceTypeDocumentRules: InsuranceTypeDocumentRule[];
    onUpdateInsuranceTypeDocumentRules: (data: InsuranceTypeDocumentRule[]) => void;
    amcs: AMC[];
    onUpdateAmcs: (data: AMC[]) => void;
    mutualFundSchemes: MutualFundScheme[];
    onUpdateMutualFundSchemes: (data: MutualFundScheme[]) => void;
    mutualFundFields: MutualFundFieldMaster[];
    onUpdateMutualFundFields: (data: MutualFundFieldMaster[]) => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const BusinessVerticalsManager: React.FC<BusinessVerticalsManagerProps> = (props) => {
    const {
        businessVerticals, onUpdateBusinessVerticals,
        insuranceTypes, onUpdateInsuranceTypes,
        insuranceFields, onUpdateInsuranceFields,
        schemes, processStageMasters, onUpdateProcessStageMasters,
        documentMasters, insuranceTypeDocumentRules, onUpdateInsuranceTypeDocumentRules,
        amcs, onUpdateAmcs,
        mutualFundSchemes, onUpdateMutualFundSchemes,
        mutualFundFields, onUpdateMutualFundFields,
        allMembers, addToast, canCreate, canModify
    } = props;
    
    const [expandedVerticalId, setExpandedVerticalId] = useState<string | null>(null);

    const handleToggleExpand = (verticalId: string) => {
        setExpandedVerticalId(expandedVerticalId === verticalId ? null : verticalId);
    };

    const handleToggleVertical = (id: string) => {
        if (!canModify) return;
        const vertical = businessVerticals.find(bv => bv.id === id);
        if (!vertical) return;
        onUpdateBusinessVerticals(
            businessVerticals.map(bv => bv.id === id ? { ...bv, active: !bv.active } : bv)
        );
    };

    return (
        <div>
            <GenericMasterManager
                title="Manage Business Verticals"
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
                    if (vertical.name.toLowerCase().includes('mutual fund')) {
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

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white p-4 border-b dark:border-gray-700">Business Vertical Configuration</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase w-8"></th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {businessVerticals.filter(bv => bv.active && !bv.name.toLowerCase().includes('agent')).map((vertical) => {
                                const isExpanded = expandedVerticalId === vertical.id;
                                const isInsurance = !vertical.name.toLowerCase().includes('mutual fund');
                                const isMutualFund = vertical.name.toLowerCase().includes('mutual fund');
                                
                                return (
                                    <React.Fragment key={vertical.id}>
                                        <tr 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                            onClick={() => handleToggleExpand(vertical.id)}
                                        >
                                            <td className="px-6 py-4">
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{vertical.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {isMutualFund ? 'Mutual Fund' : isInsurance ? 'Insurance' : 'Other'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <ToggleSwitch 
                                                    enabled={vertical.active} 
                                                    onChange={() => handleToggleVertical(vertical.id)}
                                                    disabled={!canModify}
                                                />
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={4} className="px-0 py-0">
                                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6">
                                                        {isInsurance && (
                                                            <PolicyConfigurationManager
                                                                insuranceTypes={insuranceTypes.filter(it => it.verticalId === vertical.id)}
                                                                onUpdateInsuranceTypes={(updatedTypes) => {
                                                                    const otherTypes = insuranceTypes.filter(it => it.verticalId !== vertical.id);
                                                                    onUpdateInsuranceTypes([...otherTypes, ...updatedTypes]);
                                                                }}
                                                                insuranceFields={insuranceFields}
                                                                onUpdateInsuranceFields={onUpdateInsuranceFields}
                                                                addToast={addToast}
                                                                allMembers={allMembers}
                                                                businessVerticals={businessVerticals}
                                                                schemes={schemes}
                                                                processStageMasters={processStageMasters}
                                                                onUpdateProcessStageMasters={onUpdateProcessStageMasters}
                                                                documentMasters={documentMasters}
                                                                insuranceTypeDocumentRules={insuranceTypeDocumentRules}
                                                                onUpdateInsuranceTypeDocumentRules={onUpdateInsuranceTypeDocumentRules}
                                                                canCreate={canCreate}
                                                                canModify={canModify}
                                                                currentVerticalId={vertical.id}
                                                            />
                                                        )}
                                                        {isMutualFund && (
                                                            <MutualFundsManager
                                                                amcs={amcs.filter(amc => amc.verticalId === vertical.id)}
                                                                onUpdateAmcs={(updatedAmcs) => {
                                                                    const otherAmcs = amcs.filter(amc => amc.verticalId !== vertical.id);
                                                                    onUpdateAmcs([...otherAmcs, ...updatedAmcs]);
                                                                }}
                                                                mutualFundSchemes={mutualFundSchemes}
                                                                onUpdateMutualFundSchemes={onUpdateMutualFundSchemes}
                                                                mutualFundFields={mutualFundFields}
                                                                onUpdateMutualFundFields={onUpdateMutualFundFields}
                                                                businessVerticals={businessVerticals}
                                                                processStageMasters={processStageMasters}
                                                                onUpdateProcessStageMasters={onUpdateProcessStageMasters}
                                                                allMembers={allMembers}
                                                                addToast={addToast}
                                                                canCreate={canCreate}
                                                                canModify={canModify}
                                                                currentVerticalId={vertical.id}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BusinessVerticalsManager;