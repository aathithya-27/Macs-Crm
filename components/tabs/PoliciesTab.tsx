import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
// CORRECTED: Fixed import path and added permission types
import { Member, Policy, PolicyType, GeneralInsuranceType, LICData, LICFamilyMember, LICPreviousPolicy, CoveredMember, Traveler, User, SchemeMaster, Company, InsuranceTypeMaster, InsuranceFieldMaster, HealthInsuranceData, Designation, AppModule, PermissionLevel } from '../../types.ts';
import Input from '../ui/Input';
// CORRECTED: Fixed import path
import Button from '../ui/Button';
import { getPolicySuggestions, analyzePaymentProof } from '../../services/geminiService.ts';
import { calculatePremium } from '../../services/apiService.ts';
import { X, Loader2, UploadCloud, CheckCircle, AlertTriangle, XCircle, Trash2, Eye, Check, PlusCircle, User as UserIcon, Users, FileSignature, Lightbulb, Percent, Plus, ArrowLeft, Save, Edit2, Info, ChevronDown } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';
import { bloodGroups } from '../../constants';
import Modal from '../ui/Modal'; 
import SearchableSelect from '../ui/SearchableSelect'; 


const getPremiumForFrequency = (annualPremium: number, frequency: Policy['premiumFrequency']) => {
    if (!annualPremium) return 0;
    switch (frequency) {
        case 'Monthly': return Math.round(annualPremium / 12);
        case 'Quarterly': return Math.round(annualPremium / 4);
        case 'Half-Yearly': return Math.round(annualPremium / 2);
        case 'Yearly':
        default:
            return annualPremium;
    }
};

const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- NEW Reusable FormSection Component ---
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    return (
        <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
            <div className="w-full p-4 text-left font-semibold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                {title}
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};

// --- Reusable Form Components ---
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-md font-semibold text-brand-dark dark:text-white border-b-2 border-brand-primary pb-2 mb-4 col-span-full">{title}</h3>
);

// --- REBUILT Editable Table Component for Custom Fields ---
const EditableTable: React.FC<{
    masterField: InsuranceFieldMaster;
    tableData: { rows: string[][] };
    onDataChange: (fieldName: string, value: any) => void;
    onMasterFieldUpdate: (updatedMasterField: InsuranceFieldMaster) => void;
    onRemoveField: (fieldName: string) => void;
    isReadOnly: boolean;
}> = ({ masterField, tableData, onDataChange, onMasterFieldUpdate, onRemoveField, isReadOnly }) => {

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = (tableData.rows || []).map((row, rIndex) =>
            rIndex === rowIndex
                ? row.map((cell, cIndex) => cIndex === colIndex ? value : cell)
                : row
        );
        onDataChange(masterField.fieldName, { ...tableData, __type: 'table', rows: newRows });
    };

    const handleHeaderChange = (type: 'column' | 'row', index: number, value: string) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        const newHeaders = (masterField[headerKey] || []).map((header, hIndex) => hIndex === index ? value : header);
        onMasterFieldUpdate({ ...masterField, [headerKey]: newHeaders });
    };

    const addHeader = (type: 'column' | 'row') => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        const newHeaders = [...(masterField[headerKey] || []), ''];
        onMasterFieldUpdate({ ...masterField, [headerKey]: newHeaders });
    };

    const removeHeader = (type: 'column' | 'row', index: number) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        const newHeaders = (masterField[headerKey] || []).filter((_, hIndex) => hIndex !== index);
        onMasterFieldUpdate({ ...masterField, [headerKey]: newHeaders });
    };

    // Sync local data if master headers change
    useEffect(() => {
        const masterCols = masterField.columnHeaders || [];
        const masterRows = masterField.rowHeaders || [];
        const dataRows = tableData.rows || [];

        const needsSync = dataRows.length !== masterRows.length || (dataRows[0] && dataRows[0].length !== masterCols.length);

        if (needsSync) {
            const newMatrix = Array.from({ length: masterRows.length }, () => Array(masterCols.length).fill(''));
            onDataChange(masterField.fieldName, {
                __type: 'table',
                rows: newMatrix
            });
        }
    }, [masterField.columnHeaders, masterField.rowHeaders, tableData.rows, masterField.fieldName, onDataChange]);

    return (
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
                 <h4 className="font-semibold text-gray-800 dark:text-white">{masterField.label}</h4>
                <Button 
                    variant="danger" 
                    size="small" 
                    className="!p-1.5" 
                    onClick={() => onRemoveField(masterField.fieldName)} 
                    disabled={isReadOnly}
                >
                    <Trash2 size={14} />
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border-separate" style={{ borderSpacing: '0.5rem' }}>
                    <thead>
                        <tr>
                            <th className="w-10"></th> {/* Empty corner */}
                            {(masterField.columnHeaders || []).map((header, colIndex) => (
                                <th key={`col-header-${colIndex}`} className="p-0 align-top">
                                    <div className="relative flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700/80 rounded-md border border-gray-700 dark:border-gray-400">
                                        <Input
                                            value={header}
                                            onChange={e => handleHeaderChange('column', colIndex, e.target.value)}
                                            className="font-semibold bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none p-2 text-center text-sm text-gray-700 dark:text-gray-200 w-full placeholder-gray-500"
                                            disabled={isReadOnly}
                                            placeholder={`Column ${colIndex + 1}`}
                                        />
                                        {!isReadOnly && (
                                            <Button 
                                                variant="danger" 
                                                size="small" 
                                                className="!p-1.5 flex-shrink-0" 
                                                onClick={() => removeHeader('column', colIndex)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(masterField.rowHeaders || []).map((rowHeader, rowIndex) => (
                             <tr key={`row-${rowIndex}`}>
                                <td className="p-0 align-top w-48">
                                    <div className="relative flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700/80 rounded-md border border-gray-700 dark:border-gray-400">
                                        <Input
                                            value={rowHeader}
                                            onChange={e => handleHeaderChange('row', rowIndex, e.target.value)}
                                            className="font-semibold bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:text-gray-200 w-full placeholder-gray-500"
                                            disabled={isReadOnly}
                                            placeholder={`Row ${rowIndex + 1}`}
                                        />
                                        {!isReadOnly && (
                                            <Button 
                                                variant="danger" 
                                                size="small" 
                                                className="!p-1.5 flex-shrink-0" 
                                                onClick={() => removeHeader('row', rowIndex)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                                {(masterField.columnHeaders || []).map((_, colIndex) => (
                                    <td key={`cell-${rowIndex}-${colIndex}`} className="p-0">
                                        <Input
                                            value={(tableData.rows?.[rowIndex]?.[colIndex]) || ''}
                                            onChange={e => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-700 dark:border-gray-400 rounded-md focus:ring-2 focus:ring-brand-primary"
                                            disabled={isReadOnly}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {!isReadOnly && (
                <div className="flex gap-2 mt-3">
                    <Button 
                        onClick={() => addHeader('row')} 
                        size="small" 
                        variant="light"
                    >
                        <Plus size={14} /> Add Row
                    </Button>
                    <Button 
                        onClick={() => addHeader('column')} 
                        size="small" 
                        variant="light"
                    >
                        <Plus size={14} /> Add Column
                    </Button>
                </div>
            )}
        </div>
    );
};

// --- REFACTORED Covered Members Manager (Card-based) ---
const EditableCoveredMemberCard: React.FC<{
    member: CoveredMember;
    onUpdate: (updatedMember: CoveredMember) => void;
    onRemove: () => void;
    isReadOnly: boolean;
    spocAddress?: string;
}> = ({ member, onUpdate, onRemove, isReadOnly, spocAddress }) => {
    const isNewMember = !member.name.trim() && !member.dob.trim();
    const [isEditing, setIsEditing] = useState(isNewMember);
    const [localMember, setLocalMember] = useState(member);
    const age = useMemo(() => calculateAge(localMember.dob), [localMember.dob]);
    const isAgeManual = !localMember.dob;

    useEffect(() => {
        setLocalMember(member);
        if (!isNewMember && isEditing) {
            setIsEditing(false);
        }
    }, [member, isNewMember]);

    const handleChange = (field: keyof CoveredMember, value: any) => {
        setLocalMember(prev => ({ ...prev, [field]: value }));
    };

    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAge = e.target.value;
        if (/^\d*$/.test(newAge)) {
            if (newAge) {
                const ageNum = parseInt(newAge, 10);
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - ageNum;
                handleChange('dob', `${birthYear}-01-01`);
            } else {
                handleChange('dob', '');
            }
        }
    };


    const handleSave = () => {
        if (isNewMember && (!localMember.name.trim() || !localMember.dob.trim())) {
            alert('Name and Date of Birth are required for a new member.');
            return;
        }
        onUpdate(localMember);
        setIsEditing(false);
    };

    const [addressLine1, addressLine2 = ''] = useMemo(() => (localMember.address || '').split('\n'), [localMember.address]);

    const handleAddressChange = useCallback((line: 1 | 2, value: string) => {
        let lines = (localMember.address || '').split('\n');
        if (lines.length < 2) {
            lines = [lines[0] || '', ''];
        }
        if (line === 1) {
            lines[0] = value;
        } else {
            lines[1] = value;
        }
        handleChange('address', lines.join('\n'));
    }, [localMember.address]);

    const handleCopyAddress = () => {
        if (spocAddress) {
            handleChange('address', spocAddress);
        }
    };


    const handleCancel = () => {
        if (isNewMember) {
            onRemove();
        } else {
            setLocalMember(member);
            setIsEditing(false);
        }
    };

    const selectClasses = 'w-full px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:ring-brand-primary focus:border-brand-primary';

    if (isEditing) {
        return (
            <div className="p-4 rounded-lg shadow-sm border-2 border-brand-primary bg-white dark:bg-gray-800 animate-fade-in space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{isNewMember ? 'Adding New Member' : 'Editing Member Details'}</h4>
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="small" 
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="success" 
                            size="small" 
                            onClick={handleSave}
                        >
                            <Save size={14}/> Save
                        </Button>
                    </div>
                </div>

                {!isNewMember && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-800 dark:text-blue-200 text-xs flex items-start gap-2">
                        <Info size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
                            To edit core details like Name or DOB, please go to this member's own profile.
                            Changes made there will automatically update here. You can only edit policy-specific details below.
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isNewMember ? (
                        <>
                            <Input label="Name *" value={localMember.name} onChange={e => handleChange('name', e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Date of Birth *" type="date" value={localMember.dob} onChange={e => handleChange('dob', e.target.value)} />
                                <Input
                                    label="Age"
                                    type="text"
                                    value={age !== null ? String(age) : ''}
                                    onChange={handleAgeChange}
                                    placeholder={isAgeManual ? "Enter age" : ""}
                                />
                            </div>
                            <Input label="Email" type="email" value={localMember.email || ''} onChange={e => handleChange('email', e.target.value)} />
                            <Input label="Mobile" type="tel" value={localMember.mobile || ''} onChange={e => handleChange('mobile', e.target.value)} />
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date of Birth</label>
                                    <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.dob}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Age</label>
                                    <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{age !== null ? String(age) : 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mobile</label>
                                <p className="font-semibold text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md min-h-[40px] flex items-center">{localMember.mobile || 'N/A'}</p>
                            </div>
                        </>
                    )}

                    <Input label="Relationship *" value={localMember.relationship} onChange={e => handleChange('relationship', e.target.value)} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                        <select value={localMember.gender || ''} onChange={e => handleChange('gender', e.target.value as any)} className={selectClasses}>
                            <option value="">Select...</option><option>Male</option><option>Female</option><option>Transgender</option><option>Other</option>
                        </select>
                    </div>
                    <Input label="Height (cm)" type="number" value={localMember.height || ''} onChange={e => handleChange('height', parseFloat(e.target.value) || undefined)} />
                    <Input label="Weight (kg)" type="number" value={localMember.weight || ''} onChange={e => handleChange('weight', parseFloat(e.target.value) || undefined)} />
                    <Input label="Occupation" value={localMember.occupation || ''} onChange={e => handleChange('occupation', e.target.value)} />
                    <Input label="Annual Income (₹)" type="number" value={localMember.annualIncome || ''} onChange={e => handleChange('annualIncome', parseFloat(e.target.value) || undefined)} />
                    <div className="flex items-center gap-2 pt-6">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Is in Good Health?</label>
                        <ToggleSwitch enabled={!!localMember.isGoodHealth} onChange={val => handleChange('isGoodHealth', val)} srLabel="Toggle good health"/>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <Button 
                            size="small" 
                            variant="light" 
                            type="button" 
                            onClick={handleCopyAddress}
                        >
                            Copy Primary Customer's Address
                        </Button>
                    </div>
                    <Input 
                        label="" 
                        placeholder="Address Line 1" 
                        value={addressLine1} 
                        onChange={e => handleAddressChange(1, e.target.value)} 
                    />
                    <Input 
                        label="" 
                        placeholder="Address Line 2" 
                        value={addressLine2} 
                        onChange={e => handleAddressChange(2, e.target.value)} 
                    />
                </div>
            </div>
        )
    }


    return (
        <div className="p-4 rounded-lg shadow-sm border bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.relationship} &bull; DOB: {member.dob || 'N/A'} {age !== null && `• Age: ${age}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{member.address?.split('\n').join(', ') || 'No address set'}</p>
                </div>
                 <div className="flex items-center gap-2">
                    {!isReadOnly && 
                        <Button 
                            variant="light" 
                            size="small" 
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit2 size={14}/> Edit
                        </Button>
                    }
                    {!isReadOnly && 
                        <Button 
                            variant="danger" 
                            size="small" 
                            className="!p-1.5" 
                            onClick={onRemove}
                        >
                            <Trash2 size={14}/>
                        </Button>
                    }
                </div>
            </div>
        </div>
    );
};

const CoveredMembersManager: React.FC<{
    coveredMembers: CoveredMember[],
    onMembersChange: (newMembers: CoveredMember[]) => void,
    isReadOnly: boolean,
    spocAddress?: string;
}> = ({ coveredMembers, onMembersChange, isReadOnly, spocAddress }) => {

    const handleAdd = () => onMembersChange([...coveredMembers, {
        id: `mem-${Date.now()}`,
        name: '',
        relationship: '',
        dob: '',
    }]);

    const handleUpdate = (index: number, updatedMember: CoveredMember) => {
        const newMembers = [...coveredMembers];
        newMembers[index] = updatedMember;
        onMembersChange(newMembers);
    };

    const handleRemove = (index: number) => {
        onMembersChange(coveredMembers.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {coveredMembers.map((m, i) => (
                    <EditableCoveredMemberCard
                        key={m.id}
                        member={m}
                        onUpdate={(updated) => handleUpdate(i, updated)}
                        onRemove={() => handleRemove(i)}
                        isReadOnly={isReadOnly}
                        spocAddress={spocAddress}
                    />
                ))}
            </div>
             {!isReadOnly && (
                <Button 
                    variant="secondary" 
                    size="small" 
                    onClick={handleAdd}
                >
                    <PlusCircle size={14}/> Add Covered Member
                </Button>
            )}
        </div>
    );
};

const PolicyEditor: React.FC<{
    policy: Policy;
    data: Partial<Member>;
    handlePolicyChange: (policyId: string, updatedFields: Partial<Policy>) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, policyId: string) => void;
    handlePaymentVerification: (policyId: string) => Promise<void>;
    verifyingPayment: string | null;
    onGenerateProposal: (member: Member, policy: Policy) => void;
    onSave: (memberData: Member, closeModal?: boolean) => void;
    currentUser: User | null;
    schemes: SchemeMaster[];
    companies: Company[];
    setEditingPolicyId: (id: string | null) => void;
    getPaymentStatusIcon: (status?: string) => React.ReactNode;
    addToast: (message: string, type?: 'success' | 'error') => void;
    insuranceTypes: InsuranceTypeMaster[];
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    designations: Designation[]; 
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ 
    policy, data, handlePolicyChange, handleFileUpload, handlePaymentVerification, 
    verifyingPayment, onGenerateProposal, onSave, currentUser, schemes, companies, 
    setEditingPolicyId, getPaymentStatusIcon, addToast, insuranceTypes, 
    insuranceFields, onUpdateInsuranceFields, designations, permissions
}) => {
    
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(policy.companyId || '');
    
    const [isAddingField, setIsAddingField] = useState(false);
    const [newFieldInfo, setNewFieldInfo] = useState({ label: '', fieldType: 'text' as InsuranceFieldMaster['fieldType'], group: '', columnSpan: 1 as 1 | 2 | 3, options: [''], columnHeaders: [''], rowHeaders: [''] });
    const [newFieldErrors, setNewFieldErrors] = useState<{ label?: string; options?: string; headers?: string }>({});
    const [groupOptions, setGroupOptions] = useState<{value: string, label: string}[]>([]);
    
    // CORRECTED: Permission check is now based on the passed prop
    const canModify = permissions?.policies === 'modify';
    const isReadOnly = !canModify;
    const isAdmin = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin', [currentUser, designations]);

    const selectedParentTypeId = useMemo(() => {
        if (!policy.insuranceTypeId) return null;
        const currentType = insuranceTypes.find(it => it.id === policy.insuranceTypeId);
        return currentType?.parentId || currentType?.id || null;
    }, [policy.insuranceTypeId, insuranceTypes]);
    
    const relevantInsuranceTypeId = useMemo(() => {
        return policy.insuranceTypeId || null;
    }, [policy]);

    useEffect(() => {
        if (relevantInsuranceTypeId) {
            const groups = insuranceFields
                .filter(field => field.insuranceTypeId === relevantInsuranceTypeId && field.group)
                .map(field => field.group as string);
            setGroupOptions([...new Set(groups)].map(g => ({ value: g, label: g })));
        }
    }, [insuranceFields, relevantInsuranceTypeId]);
    

    const handleDynamicDataChange = useCallback((fieldName: string, value: any) => {
        const newDynamicData = { ...(policy.dynamicData || {}), [fieldName]: value };
        handlePolicyChange(policy.id, { dynamicData: newDynamicData });
    }, [policy.id, policy.dynamicData, handlePolicyChange]);
    
    const removeDynamicField = useCallback((fieldName: string) => {
        const { [fieldName]: _, ...rest } = (policy.dynamicData || {});
        handlePolicyChange(policy.id, { dynamicData: rest });

        const fieldToRemove = insuranceFields.find(f => f.fieldName === fieldName);
        if (fieldToRemove && fieldToRemove.id.startsWith('if-custom-')) {
            onUpdateInsuranceFields(insuranceFields.filter(f => f.id !== fieldToRemove.id));
        }
    }, [policy.id, policy.dynamicData, handlePolicyChange, insuranceFields, onUpdateInsuranceFields]);

    const camelCase = (str: string) => str.replace(/[^a-zA-Z0-9 ]/g, "").replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase()).replace(/ /g, "");
    
    const handleConfirmAddField = useCallback(() => {
        const { label, fieldType, group, columnSpan, options, columnHeaders, rowHeaders } = newFieldInfo;
        const newErrors: { label?: string; options?: string; headers?: string } = {};

        if (!label.trim()) newErrors.label = "Field Label is required.";
        if (['select', 'checkbox'].includes(fieldType) && options.every(o => !o.trim())) newErrors.options = "At least one option is required.";
        if (fieldType === 'table' && (columnHeaders.every(h => !h.trim()) || rowHeaders.every(h => !h.trim()))) newErrors.headers = "At least one column and row header are required.";

        if (Object.keys(newErrors).length > 0) {
            setNewFieldErrors(newErrors);
            return;
        }

        if (!relevantInsuranceTypeId) {
            addToast('Cannot add field: policy type is not configured in master data.', 'error');
            return;
        }
    
        const fieldName = camelCase(label.trim());
        const existingMasterField = insuranceFields.some(f => f.insuranceTypeId === relevantInsuranceTypeId && (f.fieldName === fieldName || f.label.toLowerCase() === label.trim().toLowerCase()));
        
        if (existingMasterField) {
            addToast('A field with this name already exists for this policy type.', 'error');
            return;
        }
    
        const maxOrder = Math.max(0, ...insuranceFields.filter(f => f.insuranceTypeId === relevantInsuranceTypeId).map(f => f.order));
        
        const newMasterField: InsuranceFieldMaster = {
            id: `if-custom-${Date.now()}`,
            insuranceTypeId: relevantInsuranceTypeId,
            fieldName,
            label: label.trim(),
            fieldType,
            group: group.trim() || undefined,
            columnSpan: columnSpan as (1 | 2 | 3),
            options: ['select', 'checkbox'].includes(fieldType) ? options.filter(o => o.trim()) : undefined,
            columnHeaders: fieldType === 'table' ? columnHeaders.filter(h => h.trim()) : undefined,
            rowHeaders: fieldType === 'table' ? rowHeaders.filter(h => h.trim()) : undefined,
            order: maxOrder + 1,
            active: true,
        };
        onUpdateInsuranceFields([...insuranceFields, newMasterField]);
        addToast(`New field "${label.trim()}" created and saved to Master Data.`, 'success');
        
        if (fieldType === 'table') handleDynamicDataChange(newMasterField.fieldName, { __type: 'table', rows: [] });
        else handleDynamicDataChange(newMasterField.fieldName, fieldType === 'checkbox' ? [] : (fieldType === 'boolean' ? false : ''));
    
        setIsAddingField(false);
        setNewFieldInfo({ label: '', fieldType: 'text', group: '', columnSpan: 1, options: [''], columnHeaders: [''], rowHeaders: [''] });
        setNewFieldErrors({});

    }, [newFieldInfo, addToast, handleDynamicDataChange, relevantInsuranceTypeId, insuranceFields, onUpdateInsuranceFields]);
    
    const handleMasterFieldUpdate = useCallback((updatedField: InsuranceFieldMaster) => {
        onUpdateInsuranceFields(insuranceFields.map(f => f.id === updatedField.id ? updatedField : f));
    }, [insuranceFields, onUpdateInsuranceFields]);


    const parentTypeOptions = useMemo(() => insuranceTypes.filter(it => !it.parentId && it.active), [insuranceTypes]);
    const childTypeOptions = useMemo(() => {
        if (!selectedParentTypeId) return [];
        return insuranceTypes.filter(it => it.parentId === selectedParentTypeId && it.active);
    }, [insuranceTypes, selectedParentTypeId]);

    const companyIdsInSchemesForType = useMemo(() => {
        if (!selectedParentTypeId) return new Set<string>();
        
        const relevantTypeIds = new Set([selectedParentTypeId]);
        insuranceTypes.forEach(it => {
            if (it.parentId === selectedParentTypeId) {
                relevantTypeIds.add(it.id);
            }
        });
        
        return new Set(schemes.filter(s => s.insuranceTypeId && relevantTypeIds.has(s.insuranceTypeId)).map(s => s.companyId));
    }, [selectedParentTypeId, insuranceTypes, schemes]);

    const filteredCompanies = useMemo(() => {
        if (!selectedParentTypeId) return [];
        return companies.filter(c => c.active && companyIdsInSchemesForType.has(c.id));
    }, [selectedParentTypeId, companies, companyIdsInSchemesForType]);

    const filteredSchemes = useMemo(() => {
        if (!selectedCompanyId || !selectedParentTypeId) return [];
        
        const relevantTypeIds = new Set([selectedParentTypeId, policy.insuranceTypeId]);
        return schemes.filter(s => 
            s.companyId === selectedCompanyId && 
            s.insuranceTypeId && relevantTypeIds.has(s.insuranceTypeId) && 
            s.active
        );
    }, [selectedCompanyId, policy.insuranceTypeId, selectedParentTypeId, schemes]);


    const dynamicFields = useMemo(() => {
        if (!relevantInsuranceTypeId) return [];
        return insuranceFields
            .filter(field => field.insuranceTypeId === relevantInsuranceTypeId && field.active)
            .sort((a, b) => a.order - b.order);
    }, [relevantInsuranceTypeId, insuranceFields]);

    const groupedDynamicFields = useMemo(() => {
        if (!dynamicFields) return {};
        return dynamicFields.reduce((acc, field) => {
            const groupName = field.group || 'Policy Specific Information';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(field);
            return acc;
        }, {} as Record<string, InsuranceFieldMaster[]>);
    }, [dynamicFields]);

    const getColumnSpanClass = (span?: 1 | 2 | 3) => {
        switch (span) {
            case 2: return 'md:col-span-2';
            case 3: return 'md:col-span-3';
            default: return 'md:col-span-1';
        }
    };


    const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    const displayPremium = useMemo(() => {
        return getPremiumForFrequency(policy.premium, policy.premiumFrequency);
    }, [policy.premium, policy.premiumFrequency]);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-brand-primary animate-fade-in shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-brand-dark dark:text-white">Edit Policy Details</h3>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => setEditingPolicyId(null)}
                    >
                        <X size={16}/> Done
                    </Button>
                    <Button 
                        onClick={() => onSave(data as Member, false)} 
                        variant="success" 
                        disabled={isReadOnly}
                    >
                        <Save size={16}/> Save Changes
                    </Button>
                </div>
            </div>
            <div className="space-y-6">
                 <FormSection title="Core Policy Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Type</label>
                            <select
                                value={selectedParentTypeId || ''}
                                onChange={(e) => {
                                    const newParentId = e.target.value;
                                    setSelectedCompanyId('');
                                    handlePolicyChange(policy.id, { insuranceTypeId: newParentId, companyId: '', schemeId: '', schemeName: '' });
                                }}
                                className={selectClasses} 
                                disabled={isReadOnly}
                            >
                                <option value="">Select Type...</option>
                                {parentTypeOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                            </select>
                        </div>
                        <div className={childTypeOptions.length > 0 ? 'animate-fade-in' : 'hidden lg:block lg:opacity-100'}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Sub-Type</label>
                            <select
                                value={policy.insuranceTypeId === selectedParentTypeId ? '' : policy.insuranceTypeId || ''}
                                onChange={(e) => {
                                    handlePolicyChange(policy.id, { insuranceTypeId: e.target.value || selectedParentTypeId });
                                    setSelectedCompanyId('');
                                }}
                                className={selectClasses}
                                disabled={isReadOnly || !selectedParentTypeId || childTypeOptions.length === 0}
                            >
                                <option value="">-- Select Sub-Type (Optional) --</option>
                                {childTypeOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                            </select>
                        </div>
                        <div className={policy.insuranceTypeId ? '' : 'opacity-50'}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency/Company</label>
                            <select 
                                value={selectedCompanyId} 
                                onChange={(e) => {
                                    const newCompanyId = e.target.value;
                                    setSelectedCompanyId(newCompanyId);
                                    handlePolicyChange(policy.id, { companyId: newCompanyId, schemeId: '', schemeName: '' });
                                }} 
                                className={selectClasses} 
                                disabled={!policy.insuranceTypeId || isReadOnly}
                            >
                                <option value="">Select Company...</option>
                                {filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className={selectedCompanyId ? '' : 'opacity-50'}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme</label>
                            <select 
                                value={policy.schemeId || ''} 
                                onChange={(e) => {
                                    const selectedScheme = schemes.find(s => s.id === e.target.value);
                                    handlePolicyChange(policy.id, { 
                                        schemeId: selectedScheme?.id, 
                                        schemeName: selectedScheme?.name 
                                    });
                                }} 
                                className={selectClasses} 
                                disabled={!selectedCompanyId || isReadOnly}
                            >
                                <option value="">Select Scheme...</option>
                                {filteredSchemes.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Holder Type</label>
                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 text-gray-800 dark:text-gray-300">
                                    <input 
                                        type="radio" 
                                        value="Individual" 
                                        checked={policy.policyHolderType === 'Individual'} 
                                        onChange={(e) => handlePolicyChange(policy.id, { policyHolderType: e.target.value as any})} 
                                        className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600" 
                                        disabled={isReadOnly}
                                    />
                                    <UserIcon size={14} className="mr-1"/> Individual
                                </label>
                                <div className="relative flex items-center gap-2 text-gray-800 dark:text-gray-300">
                                    <input
                                        type="radio"
                                        value="Family"
                                        checked={policy.policyHolderType === 'Family'}
                                        onChange={(e) => handlePolicyChange(policy.id, { policyHolderType: e.target.value as any})}
                                        className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isReadOnly}
                                    />
                                    <Users size={14} className="mr-1"/> Family
                                </div>
                            </div>
                        </div>
                    </div>
                </FormSection>

                {policy.policyHolderType === 'Family' && (
                    <FormSection title="Covered Family Members">
                        <CoveredMembersManager
                            coveredMembers={policy.coveredMembers || []}
                            onMembersChange={(newMembers) => handlePolicyChange(policy.id, { coveredMembers: newMembers })}
                            isReadOnly={isReadOnly}
                            spocAddress={data.address}
                        />
                    </FormSection>
                )}

                <FormSection title="Coverage & Premium">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <Input 
                            label="Coverage (Sum Assured)" 
                            type="number" 
                            value={policy.coverage || ''} 
                            onChange={(e) => handlePolicyChange(policy.id, { coverage: parseFloat(e.target.value) || 0 })} 
                            disabled={isReadOnly} 
                        />
                        <Input 
                            label="Premium (Yearly)" 
                            type="number" 
                            value={policy.premium || ''} 
                            onChange={(e) => handlePolicyChange(policy.id, { premium: parseFloat(e.target.value) || 0 })} 
                            disabled={isReadOnly}
                        />
                        <Input 
                            label="Renewal Date" 
                            type="date" 
                            value={policy.renewalDate || ''} 
                            onChange={(e) => handlePolicyChange(policy.id, { renewalDate: e.target.value })} 
                            disabled={isReadOnly} 
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium Frequency</label>
                            <select
                                value={policy.premiumFrequency || 'Yearly'}
                                onChange={(e) => handlePolicyChange(policy.id, { premiumFrequency: e.target.value as any })}
                                className={selectClasses}
                                disabled={isReadOnly}
                            >
                                <option>Yearly</option>
                                <option>Half-Yearly</option>
                                <option>Quarterly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <Input 
                                label={`Premium (${policy.premiumFrequency || 'Yearly'})`} 
                                type="number" 
                                value={policy.premiumAsPerFrequency ?? displayPremium.toFixed(0)} 
                                onChange={(e) => handlePolicyChange(policy.id, { premiumAsPerFrequency: parseFloat(e.target.value) || 0 })}
                                disabled={isReadOnly} 
                            />
                        </div>
                    </div>
                </FormSection>

                <div className="grid grid-cols-2 gap-4 items-center p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Policy Status</label>
                        <ToggleSwitch 
                            enabled={policy.status === 'Active'} 
                            onChange={(enabled) => handlePolicyChange(policy.id, { status: enabled ? 'Active' : 'Inactive' })} 
                            srLabel="Toggle policy status" 
                            disabled={isReadOnly || !isAdmin}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Document Received</label>
                        <ToggleSwitch 
                            enabled={!!policy.documentReceived} 
                            onChange={(enabled) => handlePolicyChange(policy.id, { documentReceived: enabled })} 
                            srLabel="Toggle document received status" 
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                <FormSection title="Policy Data Fields">
                    <div className="space-y-8">
                        {Object.entries(groupedDynamicFields).map(([groupName, fieldsInGroup]) => (
                            <div key={groupName}>
                                <h4 className="text-md font-semibold text-brand-dark dark:text-white border-b-2 border-brand-primary pb-2 mb-4 col-span-full">{groupName}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                    {fieldsInGroup.map(field => {
                                        const colSpanClass = getColumnSpanClass(field.columnSpan);
                                        const value = policy.dynamicData?.[field.fieldName] ?? '';
                                        
                                        let fieldComponent;
                                        switch (field.fieldType) {
                                            case 'boolean':
                                                fieldComponent = (
                                                    <div className="flex flex-col h-full pt-2">
                                                        <label className="flex items-center justify-between gap-4 w-full">
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                                                            <ToggleSwitch
                                                                enabled={!!value}
                                                                onChange={(enabled) => handleDynamicDataChange(field.fieldName, enabled)}
                                                                srLabel={field.label}
                                                                disabled={isReadOnly}
                                                            />
                                                        </label>
                                                    </div>
                                                );
                                                break;
                                            case 'select':
                                                fieldComponent = (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                                        <select
                                                            value={value}
                                                            onChange={e => handleDynamicDataChange(field.fieldName, e.target.value)}
                                                            className={selectClasses}
                                                            disabled={isReadOnly}
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    </div>
                                                );
                                                break;
                                            case 'checkbox':
                                                const currentValue = Array.isArray(value) ? value : [];
                                                fieldComponent = (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
                                                        <div className="space-y-2">
                                                            {(field.options || []).map(option => (
                                                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                                                                        checked={currentValue.includes(option)}
                                                                        onChange={e => {
                                                                            const newValues = e.target.checked
                                                                                ? [...currentValue, option]
                                                                                : currentValue.filter((v: string) => v !== option);
                                                                            handleDynamicDataChange(field.fieldName, newValues);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                    <span className="text-sm text-gray-800 dark:text-gray-300">{option}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                                break;
                                            case 'table':
                                                fieldComponent = (
                                                    <div className="md:col-span-3">
                                                        <EditableTable
                                                            masterField={field}
                                                            tableData={policy.dynamicData?.[field.fieldName] || { __type: 'table', rows: [] }}
                                                            onDataChange={handleDynamicDataChange}
                                                            onMasterFieldUpdate={handleMasterFieldUpdate}
                                                            onRemoveField={removeDynamicField}
                                                            isReadOnly={isReadOnly}
                                                        />
                                                    </div>
                                                );
                                                break;
                                            default:
                                                fieldComponent = (
                                                    <Input
                                                        label={field.label}
                                                        type={field.fieldType}
                                                        value={value}
                                                        onChange={e => handleDynamicDataChange(field.fieldName, e.target.value)}
                                                        disabled={isReadOnly}
                                                    />
                                                );
                                        }

                                        return (
                                            <div key={field.id} className={colSpanClass}>
                                                {fieldComponent}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {!isReadOnly && (
                        isAddingField ? (
                            <div className="p-4 mt-4 border-t dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg animate-fade-in space-y-4">
                                <h4 className="font-semibold text-gray-800 dark:text-white">Create New Custom Field</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Input label="Field Label" value={newFieldInfo.label} onChange={e => setNewFieldInfo(s => ({ ...s, label: e.target.value }))} />
                                        {newFieldErrors.label && <p className="text-red-600 text-xs mt-1">{newFieldErrors.label}</p>}
                                    </div>
                                    <SearchableSelect 
                                        label="Group Name (Optional)" 
                                        options={groupOptions} 
                                        value={newFieldInfo.group} 
                                        onChange={val => setNewFieldInfo(s => ({ ...s, group: val }))} 
                                        onCreate={val => { 
                                            if (val) {
                                                const existingGroup = groupOptions.find(g => g.label.toLowerCase() === val.toLowerCase());
                                                if (existingGroup) {
                                                    addToast(`Group "${existingGroup.label}" already exists.`, 'error');
                                                    setNewFieldInfo(s => ({ ...s, group: existingGroup.value }));
                                                } else {
                                                    setNewFieldInfo(s => ({ ...s, group: val })); 
                                                    setGroupOptions(o => [...o, {value: val, label: val}])
                                                }
                                            }
                                        }} 
                                        placeholder="Select or type..."
                                    />
                                </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Type</label>
                                        <select value={newFieldInfo.fieldType} onChange={e => setNewFieldInfo(s => ({ ...s, fieldType: e.target.value as any, options: [''], columnHeaders: [''], rowHeaders: ['']}))} className={selectClasses}>
                                            <option value="text">Text Input</option><option value="number">Number Input</option><option value="date">Date Input</option><option value="boolean">Toggle (Yes/No)</option><option value="select">Dropdown (Select)</option><option value="checkbox">Checkbox Group</option><option value="table">Table</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column Span</label>
                                        <select value={newFieldInfo.columnSpan} onChange={e => setNewFieldInfo(s => ({ ...s, columnSpan: parseInt(e.target.value, 10) as 1 | 2 | 3 }))} className={selectClasses}>
                                            <option value={1}>1 Column</option><option value={2}>2 Columns</option><option value={3}>3 Columns</option>
                                        </select>
                                    </div>
                                </div>

                                {['select', 'checkbox'].includes(newFieldInfo.fieldType) && (
                                     <div className="space-y-2 p-3 border dark:border-gray-600 rounded-lg animate-fade-in">
                                        <h5 className="text-sm font-semibold">Define Options</h5>
                                        {newFieldInfo.options.map((option, index) => (<div key={index} className="flex items-center gap-2"><Input label="" placeholder={`Option ${index + 1}`} value={option} onChange={e => { const newOptions = [...newFieldInfo.options]; newOptions[index] = e.target.value; setNewFieldInfo(s => ({ ...s, options: newOptions })); }} /><Button type="button" variant="danger" size="small" className="!p-2" onClick={() => { setNewFieldInfo(s => ({ ...s, options: s.options.filter((_, i) => i !== index) })); }}><Trash2 size={14} /></Button></div>))}
                                        <Button type="button" variant="light" size="small" onClick={() => setNewFieldInfo(s => ({ ...s, options: [...s.options, ''] }))}><Plus size={14} /> Add Option</Button>
                                        {newFieldErrors.options && <p className="text-red-600 text-xs mt-1">{newFieldErrors.options}</p>}
                                    </div>
                                )}
                                
                                {newFieldInfo.fieldType === 'table' && (
                                    <div className="space-y-4 p-3 border dark:border-gray-600 rounded-lg animate-fade-in">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">Define Table Columns</h4>
                                            {(newFieldInfo.columnHeaders || ['']).map((h, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Input value={h} onChange={e => { const newHeaders = [...newFieldInfo.columnHeaders]; newHeaders[i] = e.target.value; setNewFieldInfo(s => ({ ...s, columnHeaders: newHeaders })); }} placeholder={`Column ${i + 1}`} />
                                                    <Button type="button" variant="danger" size="small" className="!p-1.5" onClick={() => setNewFieldInfo(s => ({ ...s, columnHeaders: s.columnHeaders.filter((_, idx) => idx !== i) }))}><Trash2 size={14} /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="light" size="small" onClick={() => setNewFieldInfo(s => ({ ...s, columnHeaders: [...s.columnHeaders, ''] }))}><Plus size={14} /> Add Column</Button>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">Define Table Rows</h4>
                                            {(newFieldInfo.rowHeaders || ['']).map((h, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <Input value={h} onChange={e => { const newHeaders = [...newFieldInfo.rowHeaders]; newHeaders[i] = e.target.value; setNewFieldInfo(s => ({ ...s, rowHeaders: newHeaders })); }} placeholder={`Row ${i + 1}`} />
                                                    <Button type="button" variant="danger" size="small" className="!p-1.5" onClick={() => setNewFieldInfo(s => ({ ...s, rowHeaders: s.rowHeaders.filter((_, idx) => idx !== i) }))}><Trash2 size={14} /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="light" size="small" onClick={() => setNewFieldInfo(s => ({ ...s, rowHeaders: [...s.rowHeaders, ''] }))}><Plus size={14} /> Add Row</Button>
                                        </div>
                                        {newFieldErrors.headers && <p className="text-red-600 text-xs mt-1">{newFieldErrors.headers}</p>}
                                    </div>
                                )}
                                <div className="flex justify-end gap-2">
                                    <Button variant="secondary" size="small" onClick={() => { setIsAddingField(false); setNewFieldErrors({}); }}>Cancel</Button>
                                    <Button variant="success" size="small" onClick={handleConfirmAddField}>Add Field</Button>
                                </div>
                            </div>
                        ) : (
                            <Button onClick={() => setIsAddingField(true)} variant="light" size="small" className="mt-3" disabled={isReadOnly}>
                                <Plus size={14} /> Add Custom Field
                            </Button>
                        )
                    )}
                </FormSection>

                <FormSection title="Payment & Verification">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Payment Verification</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                                    <select 
                                        value={policy.paymentMode || ''} 
                                        onChange={(e) => handlePolicyChange(policy.id, { paymentMode: e.target.value as any })} 
                                        className={selectClasses} 
                                        disabled={isReadOnly}
                                    >
                                        <option value="" disabled>Select mode...</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>NetBanking</option>
                                    </select>
                                </div>
                                {policy.paymentMode !== 'Cash' && (
                                    <div className="animate-fade-in space-y-3">
                                        <div className="flex items-center gap-2">
                                            <label 
                                                htmlFor={`payment-upload-${policy.id}`} 
                                                className="relative cursor-pointer"
                                            >
                                                <Button 
                                                    as="span" 
                                                    variant="light" 
                                                    className="w-full flex items-center justify-center" 
                                                    disabled={isReadOnly}
                                                >
                                                    <UploadCloud size={16}/> Upload Proof
                                                </Button>
                                                <input 
                                                    type="file" 
                                                    id={`payment-upload-${policy.id}`} 
                                                    className="sr-only" 
                                                    onChange={(e) => handleFileUpload(e, policy.id)} 
                                                    accept="image/*,application/pdf" 
                                                    disabled={isReadOnly} 
                                                />
                                            </label>
                                            <Button 
                                                onClick={() => handlePaymentVerification(policy.id)} 
                                                disabled={!policy.paymentProofUrl || !!verifyingPayment || isReadOnly} 
                                                variant="primary"
                                            >
                                                {verifyingPayment === policy.id ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />} Verify
                                            </Button>
                                        </div>
                                        {policy.paymentProofUrl && <a href={policy.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 truncate block">{policy.paymentProofFilename || 'View Uploaded Proof'}</a>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Verification Status</h4>
                            <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg min-h-[5rem] flex items-center">
                                {policy.paymentDetails ? (
                                    <div className="flex items-center gap-3">
                                        {getPaymentStatusIcon(policy.paymentDetails.status)}
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{policy.paymentDetails.status}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{policy.paymentDetails.statusReason}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {policy.paymentDetails.transactionId}</p>
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting verification...</p>}
                            </div>
                        </div>
                    </div>
                </FormSection>

                {isAdmin && policy.commission && (
                    <FormSection title="Commission Details (Admin Only)">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <Input
                                label="Commission Amount (₹)"
                                type="number"
                                value={policy.commission.amount || ''}
                                onChange={(e) => handlePolicyChange(policy.id, { commission: { ...policy.commission, amount: parseFloat(e.target.value) || 0 } })}
                                disabled={isReadOnly}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Status</label>
                                <select
                                    value={policy.commission.status}
                                    onChange={(e) => handlePolicyChange(policy.id, { commission: { ...policy.commission, status: e.target.value as any, paidDate: e.target.value === 'Paid' ? (policy.commission?.paidDate || new Date().toISOString().split('T')[0]) : undefined } })}
                                    className={selectClasses}
                                    disabled={isReadOnly}
                                >
                                    <option>Pending</option>
                                    <option>Paid</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>
                            <Input
                                label="Paid Date"
                                type="date"
                                value={policy.commission.paidDate || ''}
                                onChange={(e) => handlePolicyChange(policy.id, { commission: { ...policy.commission, paidDate: e.target.value } })}
                                disabled={policy.commission.status !== 'Paid' || isReadOnly}
                            />
                        </div>
                    </FormSection>
                )}
                <div className="pt-4 flex justify-end items-center">
                    <Button 
                        onClick={() => onGenerateProposal(data as Member, policy)} 
                        variant="success" 
                        disabled={isReadOnly}
                    >
                        <FileSignature size={16} /> Generate Proposal
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
interface PoliciesTabProps {
    allMembers: Member[];
    data: Partial<Member>;
    onChange: (field: keyof Member, value: any) => void;
    onSave: (memberData: Member, closeModal?: boolean) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    onGenerateProposal: (member: Member, policy: Policy) => void;
    currentUser: User | null;
    onFindUpsell: (member: Member) => Promise<string | null>;
    schemes: SchemeMaster[];
    companies: Company[];
    insuranceTypes: InsuranceTypeMaster[];
    insuranceFields: InsuranceFieldMaster[];
    onUpdateInsuranceFields: (data: InsuranceFieldMaster[]) => void;
    editingPolicyId: string | null;
    setEditingPolicyId: (id: string | null) => void;
    designations: Designation[];
    permissions: { [key in AppModule]?: PermissionLevel }; // CORRECTED: Added permissions prop
}
export const PoliciesTab: React.FC<PoliciesTabProps> = ({
    allMembers, data, onChange, onSave, addToast, onGenerateProposal, currentUser,
    onFindUpsell, schemes, companies, insuranceTypes, insuranceFields, 
    onUpdateInsuranceFields, editingPolicyId, setEditingPolicyId, designations, permissions
}) => {
    const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
    const [isFindingUpsell, setIsFindingUpsell] = useState(false);
    const [localUpsellSuggestion, setLocalUpsellSuggestion] = useState<string | null | undefined>(undefined);
    const insuranceTypeMap = useMemo(() => new Map(insuranceTypes.map(it => [it.id, it])), [insuranceTypes]);

    const canCreate = permissions?.policies === 'create' || permissions?.policies === 'modify';
    const canModify = permissions?.policies === 'modify';

    const displayPolicies = useMemo(() => {
        const ownPolicies = data.policies || [];
        const inheritedPolicies: Policy[] = [];

        if (data.spocId) {
            const spoc = allMembers.find(m => m.sno === data.spocId);
            if (spoc) {
                const isRelieved = !!data.relievedTimestamp;

                (spoc.policies || []).forEach(policy => {
                    if (policy.policyHolderType === 'Family') {
                        const isCurrentlyCovered = policy.coveredMembers?.some(cm =>
                            cm.name.toLowerCase() === data.name?.toLowerCase() && cm.dob === data.dob
                        );

                        if (isCurrentlyCovered || isRelieved) {
                            if (!ownPolicies.some(p => p.id === policy.id)) {
                                inheritedPolicies.push({
                                    ...policy,
                                    isLegacyFamilyPolicy: true,
                                    id: `${policy.id}-inherited-${data.id}`
                                });
                            }
                        }
                    }
                });
            }
        }

        return [...ownPolicies, ...inheritedPolicies];
    }, [data, allMembers]);

    const editingPolicy = useMemo(() => {
        if (!editingPolicyId) return null;
        return displayPolicies.find(p => p.id === editingPolicyId) || null;
    }, [editingPolicyId, displayPolicies]);

    const isReadOnly = (policy: Policy) => policy.isLegacyFamilyPolicy === true || !canModify;

    const handleAddNewPolicy = () => {
        const newPolicy: Policy = { id: `pol-${Date.now()}`, policyType: '', coverage: 0, premium: 0, renewalDate: '', status: 'Active', documentReceived: false, policyHolderType: 'Individual', coveredMembers: [], insuranceTypeId: null, dynamicData: {} };
        onChange('policies', [...(data.policies || []), newPolicy]);
        setEditingPolicyId(newPolicy.id);
    };

    const handleDeletePolicy = (id: string) => {
        if (window.confirm('Are you sure you want to delete this policy? This action is permanent and will save immediately.')) {
            const updatedPolicies = (data.policies || []).filter(p => p.id !== id);
            onChange('policies', updatedPolicies);
            const updatedMember = { ...data, policies: updatedPolicies };
            onSave(updatedMember as Member, false);
            addToast("Policy deleted.", "success");
        }
    };

    const handlePolicyChange = useCallback((id: string, updatedFields: Partial<Policy>) => {
        const updatedPolicies = (data.policies || []).map(p => {
            if (p.id === id) {
                const oldPolicy = { ...p };
                let newPolicy = { ...p, ...updatedFields };

                const premiumChanged = updatedFields.premium !== undefined;
                const frequencyChanged = updatedFields.premiumFrequency !== undefined;

                if (premiumChanged || frequencyChanged) {
                    if (oldPolicy.premiumAsPerFrequency === getPremiumForFrequency(oldPolicy.premium, oldPolicy.premiumFrequency)) {
                        newPolicy.premiumAsPerFrequency = getPremiumForFrequency(newPolicy.premium, newPolicy.premiumFrequency);
                    }
                }

                if (updatedFields.paymentMode !== undefined) {
                    if (!newPolicy.commission) {
                        newPolicy.commission = { amount: 0, status: 'Pending' };
                    }
                    if (updatedFields.paymentMode === 'Cash') {
                        newPolicy.paymentDetails = { transactionId: `cash-${Date.now()}`, amount: String(newPolicy.premium), date: new Date().toISOString().split('T')[0], status: 'Verified', statusReason: 'Payment made in cash. Auto-verified.' };
                        newPolicy.commission.amount = newPolicy.premium * 0.1;
                        newPolicy.paymentProofUrl = undefined;
                        newPolicy.paymentProofFilename = undefined;
                    } else if (oldPolicy.paymentMode === 'Cash') {
                        newPolicy.paymentDetails = undefined;
                        newPolicy.commission = { amount: 0, status: 'Pending' };
                    }
                }
                
                if (updatedFields.insuranceTypeId !== undefined && updatedFields.insuranceTypeId !== oldPolicy.insuranceTypeId) {
                    newPolicy.schemeId = '';
                    newPolicy.schemeName = '';
                    newPolicy.companyId = '';
                    newPolicy.dynamicData = {};
                }

                return newPolicy;
            }
            return p;
        });
        onChange('policies', updatedPolicies);
    }, [data.policies, onChange]);
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, policyId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            handlePolicyChange(policyId, { paymentProofUrl: url, paymentProofFilename: file.name });
        }
    };

    const handlePaymentVerification = async (policyId: string) => {
        const policy = data.policies?.find(p => p.id === policyId);
        if (!policy?.paymentProofUrl) return addToast("Please upload a payment proof first.", 'error');
        setVerifyingPayment(policyId);
        try {
            const response = await fetch(policy.paymentProofUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const paymentDetails = await analyzePaymentProof(base64String, blob.type, policy.premium, addToast);
                
                let updatedPolicyFields: Partial<Policy> = { paymentDetails };

                if (paymentDetails && paymentDetails.status === 'Verified') {
                    updatedPolicyFields.commission = { ...(policy.commission || {}), amount: policy.premium * 0.1, status: 'Pending' };
                }
                
                handlePolicyChange(policyId, updatedPolicyFields);

                const memberToSave = { 
                    ...data, 
                    policies: (data.policies || []).map(p => p.id === policyId ? { ...p, ...updatedPolicyFields } : p)
                };
                onSave(memberToSave as Member, false);

                addToast("Payment analysis complete!", "success");
            };
        } catch (error) { addToast("Failed to verify payment proof.", 'error'); }
        finally { setVerifyingPayment(null); }
    };

    const handleFindUpsellClick = async () => {
        setIsFindingUpsell(true);
        const suggestion = await onFindUpsell(data as Member);
        setLocalUpsellSuggestion(suggestion);
        setIsFindingUpsell(false);
    };

    const getPaymentStatusIcon = (status?: string) => {
        switch (status) {
            case 'Verified': return <CheckCircle className="text-green-500" />;
            case 'Mismatch': return <AlertTriangle className="text-orange-500" />;
            case 'Unverified': return <AlertTriangle className="text-yellow-500" />;
            case 'Error': return <XCircle className="text-red-500" />;
            default: return null;
        }
    };

    const PolicyCard = ({ policy }: { policy: Policy }) => {
        const displayPremium = getPremiumForFrequency(policy.premium, policy.premiumFrequency);
        
        const policyTypeInfo = useMemo(() => {
            if (!policy.insuranceTypeId) return { name: policy.policyType || 'Uncategorized', colorClass: 'bg-gray-100 text-gray-800' };
            const type = insuranceTypeMap.get(policy.insuranceTypeId);
            if (!type) return { name: 'Unknown Type', colorClass: 'bg-gray-100 text-gray-800' };

            const parent = type.parentId ? insuranceTypeMap.get(type.parentId) : null;
            const parentName = parent?.name || type.name;
            const colorClass = parentName.includes('Life') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                             : parentName.includes('Health') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                             : parentName.includes('General') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                             : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
            
            return {
                name: parent ? `${parent.name} (${type.name})` : type.name,
                colorClass
            };
        }, [policy.insuranceTypeId, insuranceTypeMap]);

        return (
            <div className={`p-4 rounded-lg shadow-sm border ${isReadOnly(policy) ? 'bg-gray-100 dark:bg-gray-700/50 opacity-70' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start">
                    <div>
                         <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${policyTypeInfo.colorClass}`}>
                            {policyTypeInfo.name}
                        </span>
                        <h4 className="font-semibold text-brand-dark dark:text-white mt-1">{policy.schemeName || 'Unspecified Scheme'}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button 
                            variant="light" 
                            size="small" 
                            onClick={() => setEditingPolicyId(policy.id)}
                        >
                            <Edit2 size={14}/> {canModify ? 'View/Edit' : 'View'}
                        </Button>
                        {!isReadOnly(policy) && canModify && 
                            <Button 
                                variant="danger" 
                                size="small" 
                                className="!p-1.5 h-7 w-7" 
                                onClick={() => handleDeletePolicy(policy.id)}
                            >
                                <Trash2 size={14}/>
                            </Button>
                        }
                    </div>
                </div>
                {isReadOnly(policy) && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">This is a view-only policy from a family plan.</p>}
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Coverage</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">₹{policy.coverage.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Premium ({policy.premiumFrequency || 'Yearly'})</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">₹{(policy.premiumAsPerFrequency ?? displayPremium).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Annual Renewal</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{policy.renewalDate && !isNaN(new Date(policy.renewalDate).getTime()) ? new Date(policy.renewalDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Status</p>
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                            {policy.status}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {editingPolicy ? (
                <PolicyEditor
                    policy={editingPolicy}
                    data={data}
                    handlePolicyChange={(policyId, updatedFields) => handlePolicyChange(policyId, updatedFields)}
                    handleFileUpload={handleFileUpload}
                    handlePaymentVerification={handlePaymentVerification}
                    verifyingPayment={verifyingPayment}
                    onGenerateProposal={onGenerateProposal}
                    onSave={onSave}
                    currentUser={currentUser}
                    schemes={schemes}
                    companies={companies}
                    setEditingPolicyId={setEditingPolicyId}
                    getPaymentStatusIcon={getPaymentStatusIcon}
                    addToast={addToast}
                    insuranceTypes={insuranceTypes}
                    insuranceFields={insuranceFields}
                    onUpdateInsuranceFields={onUpdateInsuranceFields}
                    designations={designations}
                    permissions={permissions} 
                />
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Policies</h3>
                        {canCreate && (
                            <Button 
                                onClick={handleAddNewPolicy} 
                                variant="primary"
                            >
                                <Plus size={16}/> Add New Policy
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 -mr-2">
                        {displayPolicies.length > 0 ? (
                            displayPolicies.map(policy => (
                                <div key={policy.id}>
                                    <PolicyCard policy={policy} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                <FileSignature size={40} className="mx-auto text-gray-300 dark:text-gray-600"/>
                                <p className="mt-2 text-sm font-semibold">No Policies Found</p>
                                <p className="mt-1 text-xs">Click "Add New Policy" to get started.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Lightbulb /> AI Opportunities
                            </h3>
                            <Button 
                                onClick={handleFindUpsellClick} 
                                disabled={isFindingUpsell}
                            >
                                {isFindingUpsell ? <Loader2 className="animate-spin" size={16} /> : <Lightbulb size={16} />}
                                {isFindingUpsell ? 'Searching...' : 'Find Upsell Opportunity'}
                            </Button>
                        </div>
                        {isFindingUpsell && (
                            <div className="text-center p-4 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                <p className="mt-2 text-sm">Gemini is analyzing the profile...</p>
                            </div>
                        )}
                        {localUpsellSuggestion && (
                             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg animate-fade-in">
                                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">Suggestion Found:</h4>
                                <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">
                                    {localUpsellSuggestion}
                                </p>
                            </div>
                        )}
                        {!isFindingUpsell && localUpsellSuggestion === null && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg animate-fade-in">
                               <p className="text-sm text-green-700 dark:text-green-300">
                                   No new specific upsell opportunities were found at this time.
                               </p>
                           </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};