import React, { useState, useMemo, useEffect, useRef } from 'react';

import {
    InsuranceTypeMaster, InsuranceFieldMaster, BusinessVertical, SchemeMaster, ProcessStageMaster,
    DocumentMaster, InsuranceTypeDocumentRule, Member
} from '../../types';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Plus, Edit2, Save, Search, AlertTriangle, SlidersHorizontal, GripVertical, Trash2, Calendar as CalendarIcon } from 'lucide-react';

import GenericMasterManager from './GenericMasterManager';
import ProcessStageManager from './ProcessStageManager';
import SearchBar from '../ui/SearchBar'; 


interface PolicyConfigurationManagerProps {
    insuranceTypes: InsuranceTypeMaster[];
    onUpdateInsuranceTypes: (data: InsuranceTypeMaster[]) => void;
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    businessVerticals: BusinessVertical[];
    schemes: SchemeMaster[];
    processStageMasters: ProcessStageMaster[];
    onUpdateProcessStageMasters: (data: ProcessStageMaster[]) => void;
    documentMasters: DocumentMaster[];
    insuranceTypeDocumentRules: InsuranceTypeDocumentRule[];
    onUpdateInsuranceTypeDocumentRules: (data: InsuranceTypeDocumentRule[]) => void;
    canCreate: boolean;
    canModify: boolean;
    currentVerticalId?: string;
}

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800";


const InsuranceTypeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InsuranceTypeMaster>) => void;
    initialData: Partial<InsuranceTypeMaster> | null;
    businessVerticals: BusinessVertical[];
    parentTypeName?: string;
    canModify: boolean;
}> = ({ isOpen, onClose, onSave, initialData, businessVerticals, parentTypeName, canModify }) => {

    const [formData, setFormData] = useState<Partial<InsuranceTypeMaster>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        }
    }, [isOpen, initialData]);

    const handleChange = (field: keyof InsuranceTypeMaster, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} contentClassName="bg-white dark:bg-[#2D3748] p-8 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-gray-200">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }}>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{formData.id ? 'Edit' : 'Add'} {formData.parentId ? 'Insurance Sub-Type' : 'Insurance Type'}</h2>
                    {parentTypeName && <p className="text-sm text-gray-500">Adding as a Sub-Type of "{parentTypeName}"</p>}
                </div>
                <div className="space-y-4">
                    {!formData.parentId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Vertical</label>
                            <select
                                value={formData.verticalId || ''}
                                onChange={(e) => handleChange('verticalId', e.target.value)}
                                className={selectClasses}
                                required
                                disabled={!canModify}
                            >
                                <option value="">-- Select Vertical --</option>
                                {businessVerticals.filter(bv => bv.active).map(bv => (
                                    <option key={bv.id} value={bv.id}>{bv.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Input label="Name" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} required disabled={!canModify} />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="success" disabled={!canModify}>Save</Button>
                </div>
            </form>
        </Modal>
    );
};


const PolicyConfigurationManager: React.FC<PolicyConfigurationManagerProps> = ({
    insuranceTypes, onUpdateInsuranceTypes,
    insuranceFields, onUpdateInsuranceFields,
    addToast, allMembers, businessVerticals, schemes,
    processStageMasters, onUpdateProcessStageMasters,
    documentMasters, insuranceTypeDocumentRules, onUpdateInsuranceTypeDocumentRules,
    canCreate, canModify, currentVerticalId
}) => {
    const [selectedParentTypeId, setSelectedParentTypeId] = useState<string | null>(null);
    const [selectedConfigTypeId, setSelectedConfigTypeId] = useState<string | null>(null);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<InsuranceTypeMaster> | null>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const typeTriggerRef = useRef<HTMLButtonElement>(null);
    const subtypeTriggerRef = useRef<HTMLButtonElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [itemToAction, setItemToAction] = useState<{ id: string; name: string; } | null>(null);
    const [dependentItems, setDependentItems] = useState<{ name: string; type: 'field' | 'policy' }[]>([]);

    const parentTypes = useMemo(() => insuranceTypes.filter(it => !it.parentId).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)), [insuranceTypes]);

    useEffect(() => {
        if (!selectedParentTypeId && parentTypes.length > 0) {
            const firstActive = parentTypes.find(p => p.active);
            if (firstActive) {
                setSelectedParentTypeId(firstActive.id);
                setSelectedConfigTypeId(firstActive.id);
            }
        }
    }, [parentTypes, selectedParentTypeId]);

    const filteredData = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        if (!lowerCaseQuery) {
            return {
                parentTypes,
                childTypes: selectedParentTypeId ? insuranceTypes.filter(it => it.parentId === selectedParentTypeId).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)) : [],
                fields: selectedConfigTypeId ? insuranceFields.filter(f => f.insuranceTypeId === selectedConfigTypeId) : [],
            };
        }

        const visibleTypeIds = new Set<string>();
        const filteredFields = insuranceFields.filter(f => f.label.toLowerCase().includes(lowerCaseQuery));
        filteredFields.forEach(f => visibleTypeIds.add(f.insuranceTypeId));

        insuranceTypes.forEach(type => { if (type.name.toLowerCase().includes(lowerCaseQuery)) { visibleTypeIds.add(type.id); } });
        visibleTypeIds.forEach(id => { const type = insuranceTypes.find(it => it.id === id); if (type?.parentId) { visibleTypeIds.add(type.parentId); } });

        const filteredParentTypes = parentTypes.filter(pt => visibleTypeIds.has(pt.id));
        const filteredChildTypes = selectedParentTypeId ? insuranceTypes.filter(it => it.parentId === selectedParentTypeId && visibleTypeIds.has(it.id)) : [];

        return {
            parentTypes: filteredParentTypes,
            childTypes: filteredChildTypes,
            fields: selectedConfigTypeId ? filteredFields.filter(f => f.insuranceTypeId === selectedConfigTypeId) : [],
        };
    }, [searchQuery, parentTypes, selectedParentTypeId, selectedConfigTypeId, insuranceTypes, insuranceFields]);

    const openTypeModal = (item: Partial<InsuranceTypeMaster> | null, event?: React.MouseEvent<HTMLElement>) => {
        if(event) {
            const targetRef = item?.parentId ? subtypeTriggerRef : typeTriggerRef;
            targetRef.current = event.currentTarget as HTMLButtonElement;
        }
        let initialData: Partial<InsuranceTypeMaster>;
        if (item && item.id) { initialData = { ...item }; }
        else if (item && item.parentId) { const parent = parentTypes.find(p => p.id === item.parentId); initialData = { name: '', parentId: item.parentId, active: true, verticalId: parent ? parent.verticalId : '' }; }
        else { initialData = { name: '', parentId: null, active: true, verticalId: currentVerticalId || '' }; }
        setEditingType(initialData);
        setIsTypeModalOpen(true);
    };

    const closeTypeModal = () => { 
        setIsTypeModalOpen(false); 
        const wasSubtype = editingType?.parentId;
        setEditingType(null);
        if (wasSubtype) {
            subtypeTriggerRef.current?.focus();
        } else {
            typeTriggerRef.current?.focus();
        }
    }

    const handleSaveType = (typeData: Partial<InsuranceTypeMaster>) => {
        if (!canModify) return;
        if (!typeData || !typeData.name?.trim()) { addToast('Insurance Type name is required.', 'error'); return; }
        if (!typeData.verticalId && !typeData.parentId) { addToast('Business Vertical is required for a parent type.', 'error'); return; }
        
        let finalData = {...typeData};
        if(finalData.parentId){
            const parent = insuranceTypes.find(it => it.id === finalData.parentId);
            if(parent) finalData.verticalId = parent.verticalId;
        }

        let updatedTypes : InsuranceTypeMaster[];
        if (finalData.id) { updatedTypes = insuranceTypes.map(it => it.id === finalData.id ? (finalData as InsuranceTypeMaster) : it); }
        else { const newItem: InsuranceTypeMaster = { id: `ins-type-${Date.now()}`, name: finalData.name.trim(), parentId: finalData.parentId || null, active: true, order: insuranceTypes.length, verticalId: finalData.verticalId!, }; updatedTypes = [...insuranceTypes, newItem]; }
        onUpdateInsuranceTypes(updatedTypes);
        closeTypeModal();
    };

    const checkTypeDependencies = (typeId: string): { name: string; type: 'field' | 'policy' }[] => {
        const type = insuranceTypes.find(it => it.id === typeId);
        if (!type) return [];
        let dependents: { name: string; type: 'field' | 'policy' }[] = [];

        if (!type.parentId) { 
            const children = insuranceTypes.filter(it => it.parentId === typeId);
            dependents.push(...children.map(c => ({ name: `Sub-Type: ${c.name}`, type: 'field' as const })));
        }

        const schemesLinked = schemes.filter(s => s.insuranceTypeId === typeId);
        dependents.push(...schemesLinked.map(s => ({ name: `Scheme: ${s.name}`, type: 'policy' as const })));

        return dependents;
    };

    const performToggle = (id: string) => {
        const typeToToggle = insuranceTypes.find(it => it.id === id);
        if (!typeToToggle) return;
        const newStatus = !typeToToggle.active;
        if (!typeToToggle.parentId) {
            const childIds = insuranceTypes.filter(it => it.parentId === id).map(it => it.id);
            onUpdateInsuranceTypes(insuranceTypes.map(it => (it.id === id || childIds.includes(it.id)) ? { ...it, active: newStatus } : it));
            addToast(`"${typeToToggle.name}" and its sub-types have been ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
        } else { 
            onUpdateInsuranceTypes(insuranceTypes.map(it => it.id === id ? { ...it, active: newStatus } : it));
        }
    };

    const handleToggleType = (id: string) => {
        const typeToToggle = insuranceTypes.find(it => it.id === id);
        if (!typeToToggle) return;

        if (typeToToggle.active) { 
            const dependents = checkTypeDependencies(id);
            const childDependents = !typeToToggle.parentId
                ? insuranceTypes.filter(it => it.parentId === id).flatMap(child => checkTypeDependencies(child.id))
                : [];
            const allDependents = [...dependents, ...childDependents];

            if (allDependents.length > 0) {
                setItemToAction({ id, name: typeToToggle.name });
                setDependentItems(allDependents);
                setIsWarningModalOpen(true);
            } else {
                performToggle(id); 
            }
        } else {
            performToggle(id); 
        }
    };

    const confirmWarningAction = () => {
        if (itemToAction) {
            performToggle(itemToAction.id);
        }
        setIsWarningModalOpen(false);
        setItemToAction(null);
        setDependentItems([]);
    };



    const DocumentRuleManager: React.FC<{typeId: string}> = ({ typeId }) => {
        const [docToAdd, setDocToAdd] = useState<string>('');

        const rulesForType = useMemo(() =>
            insuranceTypeDocumentRules.filter(r => r.insuranceTypeId === typeId),
        [insuranceTypeDocumentRules, typeId]);

        const documentMap = useMemo(() => new Map(documentMasters.map(d => [d.id, d.name])), [documentMasters]);

        const availableDocs = useMemo(() =>
            documentMasters.filter(d => d.active && !rulesForType.some(r => r.documentId === d.id)),
        [documentMasters, rulesForType]);

        const handleAddRule = () => {
            if (!docToAdd || !canCreate) return;
            const newRule: InsuranceTypeDocumentRule = {
                id: `rule-${Date.now()}`,
                insuranceTypeId: typeId,
                documentId: docToAdd,
                isMandatory: false, 
            };
            onUpdateInsuranceTypeDocumentRules([...insuranceTypeDocumentRules, newRule]);
            setDocToAdd(''); 
        };

        const handleToggleMandatory = (ruleId: string) => {
            onUpdateInsuranceTypeDocumentRules(
                insuranceTypeDocumentRules.map(r => r.id === ruleId ? { ...r, isMandatory: !r.isMandatory } : r)
            );
        };

        const handleRemoveRule = (ruleId: string) => {
            onUpdateInsuranceTypeDocumentRules(
                insuranceTypeDocumentRules.filter(r => r.id !== ruleId)
            );
        };

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Document Requirements</h3>
                {canCreate && (
                    <div className="flex items-center gap-2 mb-4">
                        <select
                            value={docToAdd}
                            onChange={e => setDocToAdd(e.target.value)}
                            className={selectClasses + " flex-grow"}
                        >
                            <option value="">-- Select a document to add --</option>
                            {availableDocs.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                        <Button onClick={handleAddRule} disabled={!docToAdd}><Plus size={16}/> Add</Button>
                    </div>
                )}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {rulesForType.length > 0 ? rulesForType.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <span className="font-medium text-sm">{documentMap.get(rule.documentId) || 'Unknown Document'}</span>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <ToggleSwitch enabled={rule.isMandatory} onChange={() => handleToggleMandatory(rule.id)} disabled={!canModify} />
                                    Mandatory
                                </label>
                                {canModify && (
                                    <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleRemoveRule(rule.id)}><Trash2 size={14}/></Button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-4">No documents required for this type.</p>
                    )}
                </div>
            </div>
        );
    };


    const checkFieldDependencies = (fieldId: string) => {
        const field = insuranceFields.find(f => f.id === fieldId);
        if (!field) return [];
        const dependents: { name: string; type: 'policy' }[] = [];
        for (const member of allMembers) { for (const policy of member.policies || []) { if (policy.insuranceTypeId === field.insuranceTypeId && policy.dynamicData) { if ( (policy.dynamicData[field.fieldName] !== undefined && policy.dynamicData[field.fieldName] !== '' && policy.dynamicData[field.fieldName]?.length !== 0) || (policy.dynamicData[field.label] !== undefined) ) { dependents.push({ name: `${member.name} (Policy: ${policy.schemeName || 'N/A'})`, type: 'policy' }); break; } } } }
        return dependents;
    };

    const isParentTypeSelected = selectedConfigTypeId && parentTypes.some(p => p.id === selectedConfigTypeId);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Policy Configuration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Define Insurance types, their Sub-Type, and the specific fields & checklists for each.</p>
            <div className="my-4">
                 <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search all types, fields, and checklist items..." className="w-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Insurance Type</h4>
                        {canCreate && <Button ref={typeTriggerRef} onClick={(e) => openTypeModal({ parentId: null }, e)} variant="primary"><Plus size={16}/> Add</Button>}
                    </div>
                    <div className="overflow-x-auto max-h-60">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase w-8">ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.parentTypes.map((item, index) => (
                                    <tr key={item.id} onClick={() => { setSelectedParentTypeId(item.id); setSelectedConfigTypeId(item.id); }}
                                        className={`cursor-pointer ${selectedParentTypeId === item.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} ${!item.active ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-3 py-2 text-sm">{index + 1}</td>
                                        <td className="px-3 py-2 font-medium">{item.name}</td>
                                        <td className="px-3 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggleType(item.id)} disabled={!canModify}/></td>
                                        <td className="px-3 py-2">
                                            <Button size="small" variant="light" className="!p-1.5" onClick={(e) => { e.stopPropagation(); typeTriggerRef.current = e.currentTarget; openTypeModal(item, e); }} disabled={!canModify}><Edit2 size={14}/></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Insurance Sub-Type</h4>
                        {canCreate && <Button ref={subtypeTriggerRef} onClick={(e) => { if (!selectedParentTypeId) { addToast('Please select a Insurance type first.', 'error'); return; } openTypeModal({ parentId: selectedParentTypeId }, e); }} variant="primary"><Plus size={16}/> Add</Button>}
                    </div>
                    <div className="overflow-x-auto max-h-60">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase w-8">ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.childTypes.map((item, index) => (
                                    <tr key={item.id} onClick={() => { setSelectedConfigTypeId(item.id); }}
                                        className={`cursor-pointer ${selectedConfigTypeId === selectedParentTypeId ? '' : selectedConfigTypeId === item.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} ${!item.active ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-3 py-2 text-sm">{index + 1}</td>
                                        <td className="px-3 py-2 font-medium">{item.name}</td>
                                        <td className="px-3 py-2"><ToggleSwitch enabled={!!item.active} onChange={() => handleToggleType(item.id)} disabled={!canModify}/></td>
                                        <td className="px-3 py-2">
                                            <Button size="small" variant="light" className="!p-1.5" onClick={(e) => { e.stopPropagation(); subtypeTriggerRef.current = e.currentTarget; openTypeModal(item, e); }} disabled={!canModify}><Edit2 size={14}/></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {selectedConfigTypeId && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg animate-fade-in space-y-8">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300"> Configure for: <span className="text-blue-600 dark:text-blue-400">{insuranceTypes.find(it => it.id === selectedConfigTypeId)?.name}</span> </h4>
                    {isParentTypeSelected && (<ProcessStageManager key={`psm-${selectedConfigTypeId}`} title="Manage Process Flow" items={processStageMasters.filter(psm => psm.insuranceTypeId === selectedConfigTypeId)} onUpdate={(updatedStages) => { const otherStages = processStageMasters.filter(psm => psm.insuranceTypeId !== selectedConfigTypeId); const newStagesForType = updatedStages.map(s => ({ ...s, insuranceTypeId: selectedConfigTypeId, isMutualFund: false })); onUpdateProcessStageMasters([...otherStages, ...newStagesForType]); }} addToast={addToast} allMembers={allMembers} typeId={selectedConfigTypeId} canCreate={canCreate} canModify={canModify}/>)}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenericMasterManager codeColumnDisplay="group" reorderable={true} title={`Fields`} items={filteredData.fields} onUpdate={(newItemsForType) => { const otherFields = insuranceFields.filter(f => f.insuranceTypeId !== selectedConfigTypeId); const finalNewFields = newItemsForType.map((item: any) => ({ ...item, insuranceTypeId: selectedConfigTypeId, })); onUpdateInsuranceFields([...otherFields, ...finalNewFields] as InsuranceFieldMaster[]); }} addToast={addToast} noun="Field" dependencyCheck={checkFieldDependencies} showSearchBar={false} canCreate={canCreate} canModify={canModify}/>
                        <DocumentRuleManager key={selectedConfigTypeId} typeId={selectedConfigTypeId} />
                    </div>
                </div>
            )}

            <InsuranceTypeModal
                isOpen={isTypeModalOpen}
                onClose={closeTypeModal}
                onSave={handleSaveType}
                initialData={editingType}
                businessVerticals={businessVerticals}
                parentTypeName={editingType?.parentId ? parentTypes.find(p => p.id === editingType.parentId)?.name : undefined}
                canModify={canModify}
            />

            <Modal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                contentClassName="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg"
            >
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            Deactivate "{itemToAction?.name}"?
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This item is currently used by <strong>{dependentItems.length} record(s)</strong>. Deactivating it may cause data inconsistencies.
                            </p>
                            <ul className="text-xs text-gray-400 dark:text-gray-500 mt-2 list-disc list-inside max-h-24 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                {dependentItems.slice(0, 5).map((item, index) => <li key={index}>{item.name}</li>)}
                                {dependentItems.length > 5 && <li>...and {dependentItems.length - 5} more.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button variant="danger" onClick={confirmWarningAction}>Deactivate Anyway</Button>
                    <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>Cancel</Button>
                </div>
            </Modal>
        </div>
    );
};

export default PolicyConfigurationManager;