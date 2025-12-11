import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Member, User, LeadSource, Route, LeadSourceMaster, Geography, CustomerCategory, CustomerSubCategory, CustomerGroup, Branch, Religion, CustomerFieldMaster, Designation, AppModule, PermissionLevel, Gender, MaritalStatus, Role } from '../../types.ts';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { ShieldCheck, Loader2, Info, MapPin, Copy, Target, BrainCircuit, Link as LinkIcon, Plus, Trash2, X } from 'lucide-react';
import { bloodGroups } from '../../constants.tsx';
import { generateDigipinFromCoords, enrichDigipinLocation, getCoordsFromDigipin } from '../../services/geminiService.ts';
import ToggleSwitch from '../ui/ToggleSwitch.tsx';
import LeadSourceSelector from '../LeadSourceSelector.tsx';
import SearchableSelect from '../ui/SearchableSelect.tsx';
import Modal from '../ui/Modal.tsx';

const EditableTable: React.FC<{
    masterField: CustomerFieldMaster;
    tableData: { rows: string[][] };
    onDataChange: (fieldName: string, value: any) => void;
    onMasterFieldUpdate: (updatedMasterField: CustomerFieldMaster) => void;
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
                            <th className="w-10"></th> {}
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


interface AddFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fieldInfo: Omit<CustomerFieldMaster, 'id' | 'order' | 'active'>) => void;
    existingGroups: string[];
    addToast: (message: string, type?: 'success' | 'error') => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({ isOpen, onClose, onConfirm, existingGroups, addToast }) => {
    const [fieldInfo, setFieldInfo] = useState({
        label: '',
        fieldType: 'text' as CustomerFieldMaster['fieldType'],
        group: '',
        columnSpan: 1 as 1 | 2 | 3,
        options: [''],
        columnHeaders: [''],
        rowHeaders: ['']
    });
    const [errors, setErrors] = useState<{ label?: string; options?: string; headers?: string }>({});
    const [groupOptions, setGroupOptions] = useState(() => existingGroups.map(g => ({ value: g, label: g })));

    useEffect(() => {
        setGroupOptions(existingGroups.map(g => ({ value: g, label: g })));
    }, [existingGroups]);

    const resetState = useCallback(() => {
        setFieldInfo({
            label: '',
            fieldType: 'text' as CustomerFieldMaster['fieldType'],
            group: '',
            columnSpan: 1 as 1 | 2 | 3,
            options: [''],
            columnHeaders: [''],
            rowHeaders: ['']
        });
        setGroupOptions(existingGroups.map(g => ({ value: g, label: g })));
        setErrors({});
    }, [existingGroups]);

    const handleClose = () => {
        onClose();
        resetState();
    };

    const validateForm = () => {
        const newErrors: { label?: string; options?: string; headers?: string } = {};
        if (!fieldInfo.label.trim()) {
            newErrors.label = "Field Label is required.";
        }
        if (['select', 'checkbox'].includes(fieldInfo.fieldType) && fieldInfo.options.filter(o => o.trim()).length === 0) {
            newErrors.options = "At least one option is required for this field type.";
        }
        if (fieldInfo.fieldType === 'table' && (fieldInfo.columnHeaders.filter(h => h.trim()).length === 0 || fieldInfo.rowHeaders.filter(h => h.trim()).length === 0)) {
            newErrors.headers = "At least one column and one row header are required for tables.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirmClick = () => {
        if (!validateForm()) return;
        
        onConfirm({
            ...fieldInfo,
            fieldName: fieldInfo.label.replace(/[^a-zA-Z0-9 ]/g, "").replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase()).replace(/ /g, ""),
            options: fieldInfo.fieldType === 'select' || fieldInfo.fieldType === 'checkbox' ? fieldInfo.options.filter(o => o.trim()) : undefined,
            columnHeaders: fieldInfo.fieldType === 'table' ? fieldInfo.columnHeaders.filter(h => h.trim()) : undefined,
            rowHeaders: fieldInfo.fieldType === 'table' ? fieldInfo.rowHeaders.filter(h => h.trim()) : undefined,
        });
        handleClose();
    };

    const handleChange = (field: keyof typeof fieldInfo, value: any) => {
        setFieldInfo(s => ({ ...s, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field as keyof typeof errors]: undefined }));
        }
    };
    
    const handleGroupCreate = (newGroupName: string) => {
        const existingGroup = existingGroups.find(g => g.toLowerCase() === newGroupName.toLowerCase());
        if (existingGroup) {
            addToast(`Group "${existingGroup}" already exists.`, 'error');
            handleChange('group', existingGroup);
        } else {
            handleChange('group', newGroupName);
            setGroupOptions(prev => [...prev, { value: newGroupName, label: newGroupName }]);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...fieldInfo.options];
        newOptions[index] = value;
        handleChange('options', newOptions);
    };
    const addOption = () => handleChange('options', [...fieldInfo.options, '']);
    const removeOption = (index: number) => handleChange('options', fieldInfo.options.filter((_, i) => i !== index));

    const handleHeaderChange = (type: 'column' | 'row', index: number, value: string) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        const newHeaders = [...fieldInfo[headerKey]];
        newHeaders[index] = value;
        handleChange(headerKey, newHeaders);
    };
    const addHeader = (type: 'column' | 'row') => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        handleChange(headerKey, [...fieldInfo[headerKey], '']);
    };
    const removeHeader = (type: 'column' | 'row', index: number) => {
        const headerKey = type === 'column' ? 'columnHeaders' : 'rowHeaders';
        handleChange(headerKey, fieldInfo[headerKey].filter((_, i) => i !== index));
    };


    return (
        <Modal isOpen={isOpen} onClose={handleClose} contentClassName="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
            <div className="p-6"><h2 className="text-xl font-bold">Add New Custom Field</h2></div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                    <Input 
                        label="Field Label" 
                        value={fieldInfo.label} 
                        onChange={e => handleChange('label', e.target.value)}
                    />
                    {errors.label && <p className="text-red-600 text-xs mt-1">{errors.label}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Field Type</label>
                        <select 
                            value={fieldInfo.fieldType} 
                            onChange={e => handleChange('fieldType', e.target.value as any)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Toggle</option>
                            <option value="select">Dropdown</option>
                            <option value="checkbox">Checkboxes</option>
                            <option value="table">Table</option>
                        </select>
                    </div>
                     <div>
                        <SearchableSelect
                            label="Group Name"
                            options={groupOptions}
                            value={fieldInfo.group}
                            onChange={(value) => handleChange('group', value)}
                            onCreate={handleGroupCreate}
                            placeholder="Select or type..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Column Span</label>
                        <select 
                            value={fieldInfo.columnSpan} 
                            onChange={e => handleChange('columnSpan', parseInt(e.target.value, 10) as 1 | 2 | 3)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value={1}>1 (Normal)</option>
                            <option value={2}>2 (Wide)</option>
                            <option value={3}>3 (Full Row)</option>
                        </select>
                    </div>
                </div>
                 {['select', 'checkbox'].includes(fieldInfo.fieldType) && (
                    <div className="space-y-2 p-3 border dark:border-gray-600 rounded-lg">
                        <h4 className="text-sm font-semibold">Options</h4>
                        {fieldInfo.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input 
                                    value={opt} 
                                    onChange={e => handleOptionChange(i, e.target.value)} 
                                    placeholder={`Option ${i+1}`} 
                                />
                                <Button 
                                    variant="danger" 
                                    size="small" 
                                    onClick={() => removeOption(i)}
                                >
                                    <Trash2 size={14}/>
                                </Button>
                            </div>
                        ))}
                        <Button 
                            variant="light" 
                            size="small" 
                            onClick={addOption}
                        >
                            <Plus size={14}/> Add Option
                        </Button>
                        {errors.options && <p className="text-red-600 text-xs mt-1">{errors.options}</p>}
                    </div>
                )}
                {fieldInfo.fieldType === 'table' && (
                    <div className="space-y-4 p-3 border dark:border-gray-600 rounded-lg">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Column Headers</h4>
                            {fieldInfo.columnHeaders.map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input 
                                        value={h} 
                                        onChange={e => handleHeaderChange('column', i, e.target.value)} 
                                        placeholder={`Column ${i+1}`} 
                                    />
                                    <Button 
                                        variant="danger" 
                                        size="small" 
                                        onClick={() => removeHeader('column', i)}
                                    >
                                        <Trash2 size={14}/>
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                variant="light" 
                                size="small" 
                                onClick={() => addHeader('column')}
                            >
                                <Plus size={14}/> Add Column
                            </Button>
                        </div>
                         <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Row Headers</h4>
                            {fieldInfo.rowHeaders.map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input 
                                        value={h} 
                                        onChange={e => handleHeaderChange('row', i, e.target.value)} 
                                        placeholder={`Row ${i+1}`} 
                                    />
                                    <Button 
                                        variant="danger" 
                                        size="small" 
                                        onClick={() => removeHeader('row', i)}
                                    >
                                        <Trash2 size={14}/>
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                variant="light" 
                                size="small" 
                                onClick={() => addHeader('row')}
                            >
                                <Plus size={14}/> Add Row
                            </Button>
                        </div>
                        {errors.headers && <p className="text-red-600 text-xs mt-1">{errors.headers}</p>}
                    </div>
                )}
            </div>
            <div className="flex justify-end p-4 gap-3 border-t dark:border-gray-700">
                <Button 
                    variant="secondary" 
                    onClick={handleClose}
                >
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleConfirmClick}
                >
                    Add Field
                </Button>
            </div>
        </Modal>
    );
};


interface BasicInfoTabProps {
  data: Partial<Member>;
  onChange: (field: keyof Member, value: any) => void;
  errors: Partial<Record<keyof Member | 'bankDetailsError' | 'email' | 'address', string>>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  currentUser: User | null;
  users: User[];
  routes: Route[];
  onUpdateRoutes: (data: Route[]) => void;
  allMembers: Member[];
  leadSources: LeadSourceMaster[];
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  customerCategories: CustomerCategory[];
  customerSubCategories: CustomerSubCategory[];
  customerGroups: CustomerGroup[];
  onAddNewReferrer?: () => void;
  Branches: Branch[];
  religions: Religion[];
  customerFieldMasters: CustomerFieldMaster[]; 
  onUpdateCustomerFieldMasters: (data: CustomerFieldMaster[]) => void;
  designations: Designation[];
  permissions: { [key in AppModule]?: PermissionLevel };
  genders: Gender[];
  maritalStatuses: MaritalStatus[];
  roles: Role[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

const MemberTypeBadge = ({ memberType }: { memberType: Member['memberType']}) => (
    <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${
        memberType === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
        memberType === 'Silver' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
        memberType === 'Diamond' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
        'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
    }`}>
        {memberType}
    </span>
);

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


export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ 
    data, onChange, errors, addToast, currentUser, users, routes, onUpdateRoutes, 
    allMembers, leadSources, geographies, onUpdateGeographies, customerCategories, 
    customerSubCategories, customerGroups, onAddNewReferrer, Branches, 
    religions, customerFieldMasters, onUpdateCustomerFieldMasters, designations,
    permissions, genders, maritalStatuses, roles
}) => {
  const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [isSyncingDigipin, setIsSyncingDigipin] = useState(false);
  const [isSyncingCoords, setIsSyncingCoords] = useState(false);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false); 

  const lastCoordsSetByAI = useRef<{ lat?: number, lng?: number }>({});
  const lastDigipinSetByAI = useRef<string | undefined>(undefined);

  const debouncedLat = useDebounce(data.lat, 800);
  const debouncedLng = useDebounce(data.lng, 800);
  const debouncedDigipin = useDebounce(data.digipin, 800);

  const advisors = useMemo(() => {
    const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
    return users.filter(u => u.profile?.status === 'Active' && u.roleId && advisorRoleIds.has(u.roleId));
  }, [users, roles]);

  const advisorOptions = useMemo(() => advisors.map(adv => ({ 
      value: adv.id, 
      label: adv.name 
    })), [advisors]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  const branchOptions = useMemo(() => Branches.map(branch => ({ value: branch.id, label: branch.branch_name })), [Branches]);
  const canToggleStatus = permissions?.customers === 'modify';

  const canDeactivate = useMemo(() => {
    if (!data.policies || data.policies.length === 0) return true;
    return data.policies.every(p => p.status === 'Inactive');
  }, [data.policies]);

  const hasFamilyPolicy = useMemo(() => (data.policies || []).some(p => p.policyHolderType === 'Family'), [data.policies]);

  const potentialSpocs = useMemo(() => {
    const spocs = [{ id: data.id, name: data.name, mobile: data.mobile }];
    if (hasFamilyPolicy) {
        const coveredMembers = (data.policies || []).filter(p => p.policyHolderType === 'Family').flatMap(p => p.coveredMembers || []);
        coveredMembers.forEach(cm => { if (!spocs.some(s => s.name === cm.name)) { spocs.push({ id: `cm-${cm.id}`, name: cm.name, mobile: cm.mobile || undefined }); } });
    }
    return spocs;
  }, [data, hasFamilyPolicy]);

  const handleStatusToggle = (newStatus: boolean) => {
    if (newStatus === false && !canDeactivate) {
        addToast("Cannot deactivate member. All of their policies must be set to 'Inactive' first.", "error");
        return;
    }
    onChange('active', newStatus);
  };

    const countries = useMemo(() => geographies.filter(g => g.type === 'Country' && g.active !== false), [geographies]);
    const selectedCountryObject = useMemo(() => geographies.find(g => g.name === data.country && g.type === 'Country' && g.active !== false), [data.country, geographies]);

    const states = useMemo(() => {
        const country = selectedCountryObject;
        if (!country) return [];
        return geographies.filter(g => g.parentId === country.id && g.type === 'State' && g.active !== false);
    }, [selectedCountryObject, geographies]);
    const selectedStateObject = useMemo(() => geographies.find(g => g.name === data.state && g.parentId === selectedCountryObject?.id && g.type === 'State' && g.active !== false), [data.state, selectedCountryObject, geographies]);
    const districts = useMemo(() => { if (!selectedStateObject) return []; return geographies.filter(g => g.parentId === selectedStateObject.id && g.type === 'District' && g.active !== false); }, [selectedStateObject, geographies]);
    const selectedDistrictObject = useMemo(() => geographies.find(g => g.name === data.district && g.parentId === selectedStateObject?.id && g.type === 'District' && g.active !== false), [data.district, selectedStateObject, geographies]);
    const cities = useMemo(() => { if (!selectedDistrictObject) return []; return geographies.filter(g => g.parentId === selectedDistrictObject.id && g.type === 'City' && g.active !== false); }, [selectedDistrictObject, geographies]);
    const selectedCityObject = useMemo(() => geographies.find(g => g.name === data.city && g.parentId === selectedDistrictObject?.id && g.type === 'City' && g.active !== false), [data.city, selectedDistrictObject, geographies]);
    const areas = useMemo(() => { if (!selectedCityObject) return []; return geographies.filter(g => g.parentId === selectedCityObject.id && g.type === 'Area' && g.active !== false); }, [selectedCityObject, geographies]);

    const handleCountryChange = (newCountryName: string) => { onChange('country', newCountryName); onChange('state', ''); onChange('district', ''); onChange('city', ''); onChange('area', ''); onChange('pincode', ''); };
    const handleStateChange = (newStateName: string) => { onChange('state', newStateName); onChange('district', ''); onChange('city', ''); onChange('area', ''); onChange('pincode', ''); };
    const handleDistrictChange = (newDistrictName: string) => { onChange('district', newDistrictName); onChange('city', ''); onChange('area', ''); onChange('pincode', ''); };
    const handleCityChange = (newCityName: string) => { onChange('city', newCityName); onChange('area', ''); };
    const handleAreaChange = (newAreaName: string) => onChange('area', newAreaName);

       const handleCreateCountry = (newCountryName: string) => { const newCountry: Geography = { id: `geo-${Date.now()}`, name: newCountryName, type: 'Country', parentId: null, active: true }; onUpdateGeographies([...geographies, newCountry]); handleCountryChange(newCountryName); addToast(`Country "${newCountryName}" created.`, 'success'); };
    const handleCreateState = (newStateName: string) => { if (!selectedCountryObject) return addToast("Please select a country first.", "error"); const newState: Geography = { id: `geo-${Date.now()}`, name: newStateName, type: 'State', parentId: selectedCountryObject.id, active: true }; onUpdateGeographies([...geographies, newState]); handleStateChange(newStateName); addToast(`State "${newStateName}" created.`, 'success'); };
    const handleCreateDistrict = (newDistrictName: string) => { if (!selectedStateObject) return addToast("Please select a state first.", "error"); const newDistrict: Geography = { id: `geo-${Date.now()}`, name: newDistrictName, type: 'District', parentId: selectedStateObject.id, active: true }; onUpdateGeographies([...geographies, newDistrict]); handleDistrictChange(newDistrictName); addToast(`District "${newDistrictName}" created.`, 'success'); };
    const handleCreateCity = (newCityName: string) => { if (!selectedDistrictObject) return addToast("Please select a district first.", "error"); const newCity: Geography = { id: `geo-${Date.now()}`, name: newCityName, type: 'City', parentId: selectedDistrictObject.id, active: true }; onUpdateGeographies([...geographies, newCity]); onChange('city', newCityName); addToast(`City "${newCityName}" created.`, 'success'); };
    const handleCreateArea = (newAreaName: string) => { if (!selectedCityObject) return addToast("Please select a city first.", "error"); const newArea: Geography = { id: `geo-${Date.now()}`, name: newAreaName, type: 'Area', parentId: selectedCityObject.id, active: true }; onUpdateGeographies([...geographies, newArea]); handleAreaChange(newAreaName); addToast(`Area "${newAreaName}" created.`, 'success'); };

  useEffect(() => {
    if (data.id) return;
       const namePart = (data.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, '_');
    const addressDigits = (data.address || '').replace(/[^0-9]/g, '');
    const addressPart = addressDigits.slice(0, 2).padEnd(2, '0');
       const mobilePart = (data.mobile || '').replace(/[^0-9]/g, '').slice(-5).padEnd(5, '_');
    const newId = `${namePart}${addressPart}${mobilePart}`;
    if (newId !== data.memberId) { onChange('memberId', newId); }
  }, [data.id, data.name, data.address, data.mobile, data.memberId, onChange]);

  const handleMultiAssigneeChange = (advisorId: string) => { onChange('assignedTo', advisorId ? [advisorId] : []); };
  const filteredSubCategories = useMemo(() => { if (!data.customerCategoryId) return []; return customerSubCategories.filter(sc => sc.parentId === data.customerCategoryId); }, [data.customerCategoryId, customerSubCategories]);
  const handleSpocChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const selectedSpocId = e.target.value; const spoc = potentialSpocs.find(s => s.id === selectedSpocId); onChange('spocMemberId', selectedSpocId); onChange('spocMobile', spoc?.mobile || ''); };

  useEffect(() => {
    const isValidCoord = (c: number | undefined) => typeof c === 'number' && !isNaN(c);
    if (lastCoordsSetByAI.current.lat === debouncedLat && lastCoordsSetByAI.current.lng === debouncedLng) return;
    if (isValidCoord(debouncedLat) && isValidCoord(debouncedLng)) {
        const syncDigipin = async () => {
            setIsSyncingDigipin(true);
            try {
                const digipin = await generateDigipinFromCoords(debouncedLat!, debouncedLng!, addToast);
                lastDigipinSetByAI.current = digipin; onChange('digipin', digipin);
                const enrichment = await enrichDigipinLocation(debouncedLat!, debouncedLng!, addToast);
                onChange('digipinDetails', enrichment);
            } catch (error) { addToast('Failed to generate Digipin.', 'error'); }
            finally { setIsSyncingDigipin(false); }
        };
        syncDigipin();
    }
  }, [debouncedLat, debouncedLng, onChange, addToast]);

  useEffect(() => {
    const digipinRegex = /^[2-9CFGHJMPQRVWX]{8}\+[2-9CFGHJMPQRVWX]{2,3}$/i;
    if (lastDigipinSetByAI.current === debouncedDigipin) return;
    if (debouncedDigipin && digipinRegex.test(debouncedDigipin)) {
        const syncCoords = async () => {
            setIsSyncingCoords(true);
            try {
                const coords = await getCoordsFromDigipin(debouncedDigipin, addToast);
                if (coords) {
                    lastCoordsSetByAI.current = coords; onChange('lat', coords.lat); onChange('lng', coords.lng);
                    const enrichment = await enrichDigipinLocation(coords.lat, coords.lng, addToast);
                    onChange('digipinDetails', enrichment);
                }
            } catch (error) { addToast('Failed to resolve Digipin.', 'error'); }
            finally { setIsSyncingCoords(false); }
        };
        syncCoords();
    }
  }, [debouncedDigipin, onChange, addToast]);

  const handleGpsCapture = useCallback(() => {
    if (!navigator.geolocation) return addToast("Geolocation is not supported.", "error");
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            onChange('lat', latitude); onChange('lng', longitude);
            addToast("Location captured! Generating Digipin...", 'success');
            setIsCapturingGps(false);
        },
        (error) => { addToast("Could not get location.", "error"); setIsCapturingGps(false); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [addToast, onChange]);

  const handleCopyDigipin = () => { if (data.digipin) { navigator.clipboard.writeText(data.digipin); addToast('Digipin copied!', 'success'); } };
  const [addressLine1, addressLine2 = ''] = useMemo(() => (data.address || '').split('\n'), [data.address]);
  const handleAddressChange = useCallback((line: 1 | 2, value: string) => { let lines = (data.address || '').split('\n'); if (lines.length < 2) lines = [lines[0] || '', '']; if (line === 1) lines[0] = value; else lines[1] = value; onChange('address', lines.slice(0, 2).join('\n')); }, [data.address, onChange]);

  const handleCreateRoute = (newRouteName: string) => {
      if (routes.some(r => r.name.toLowerCase() === newRouteName.toLowerCase())) return addToast(`Route "${newRouteName}" already exists.`, "error");
      const newRoute: Route = { id: `route-${Date.now()}`, name: newRouteName, active: true, order: routes.length };
      onUpdateRoutes([...routes, newRoute]);
      onChange('routeId', newRoute.id);
      addToast(`Route "${newRouteName}" created and selected.`, 'success');
  };

  const age = useMemo(() => calculateAge(data.dob || ''), [data.dob]);
  const isAgeManual = !data.dob;
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = e.target.value;
    if (/^\d*$/.test(newAge)) {
        if (newAge) {
            const ageNum = parseInt(newAge, 10);
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - ageNum;
            onChange('dob', `${birthYear}-01-01`);
        } else {
            onChange('dob', '');
        }
    }
  };

  const handleDynamicDataChange = useCallback((fieldName: string, value: any) => {
    onChange('dynamicData', (prev: any) => ({ ...prev, [fieldName]: value }));
  }, [onChange]);

  const removeDynamicField = useCallback((fieldName: string) => {
    onChange('dynamicData', (prev: any) => {
      const { [fieldName]: _, ...rest } = prev || {};
      return rest;
    });
  }, [onChange]);
  
  const groupedDynamicFields = useMemo(() => {
    const activeFields = customerFieldMasters.filter(field => field.active).sort((a, b) => a.order - b.order);
    return activeFields.reduce((acc, field) => {
        const groupName = field.group || 'Additional Information';
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(field);
        return acc;
    }, {} as Record<string, CustomerFieldMaster[]>);
  }, [customerFieldMasters]);

  const handleAddNewField = useCallback((fieldInfo: Omit<CustomerFieldMaster, 'id'|'order'|'active'>) => {
      const newField: CustomerFieldMaster = {
          ...fieldInfo,
          id: `cf-${Date.now()}`,
          order: customerFieldMasters.length,
          active: true
      };
      onUpdateCustomerFieldMasters([...customerFieldMasters, newField]);
      addToast(`New field "${newField.label}" added to Customer Master.`, 'success');
  }, [customerFieldMasters, onUpdateCustomerFieldMasters, addToast]);

  const handleMasterFieldUpdate = useCallback((updatedField: CustomerFieldMaster) => {
      onUpdateCustomerFieldMasters(customerFieldMasters.map(f => f.id === updatedField.id ? updatedField : f));
  }, [customerFieldMasters, onUpdateCustomerFieldMasters]);

  const handleRemoveMasterField = useCallback((field: CustomerFieldMaster) => {
      if (window.confirm(`Are you sure you want to permanently delete the field "${field.label}" from the Customer Master? This will remove it for ALL customers and cannot be undone.`)) {
          removeDynamicField(field.fieldName);
          onUpdateCustomerFieldMasters(customerFieldMasters.filter(f => f.id !== field.id));
          addToast(`Master field "${field.label}" has been deleted.`, 'success');
      }
  }, [customerFieldMasters, onUpdateCustomerFieldMasters, removeDynamicField, addToast]);


  return (
    <div className="space-y-6">
        <AddFieldModal
            isOpen={isAddFieldModalOpen}
            onClose={() => setIsAddFieldModalOpen(false)}
            onConfirm={handleAddNewField}
            existingGroups={[...new Set(customerFieldMasters.map(f => f.group).filter(Boolean) as string[])]}
            addToast={addToast}
        />

        <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-200 dark:border-gray-600">
             <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Family Grouping (SPOC)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={!!data.isSPOC} 
                            onChange={(e) => onChange('isSPOC', e.target.checked)} 
                            className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" 
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">This member is the primary contact (SPOC)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-7">Check this if this member manages the family policies.</p>
                </div>
                {hasFamilyPolicy ? (
                    <div className="animate-fade-in">
                        <label 
                            htmlFor="spocMemberId" 
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Select Point of Contact
                        </label>
                        <select 
                            id="spocMemberId" 
                            value={data.spocMemberId || ''} 
                            onChange={handleSpocChange} 
                            className={selectClasses}
                        >
                            <option value="">Select a SPOC...</option>
                            {potentialSpocs.map(spoc => (
                                <option key={spoc.id} value={spoc.id}>
                                    {spoc.name} {spoc.mobile ? `(${spoc.mobile})` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select who should be contacted for this family's policies.</p>
                    </div>
                ) : (
                    <div>
                        <Input 
                            label="Family Name (Optional)" 
                            id="familyName" 
                            value={data.familyName || ''} 
                            onChange={(e) => onChange('familyName', e.target.value)} 
                            placeholder="e.g., The Kumar Family" 
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input 
                label="ID" 
                id="sno" 
                value={data.sno || ''} 
                readOnly 
                disabled 
            />
            <div className="hidden">
                <Input 
                    label="Customer ID" 
                    id="memberId" 
                    value={data.memberId || ''} 
                    readOnly 
                    disabled 
                />
            </div>
            <div>
                <label 
                    htmlFor="memberType" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    Customer Type
                </label>
                <div className="h-10 flex items-center">
                    <MemberTypeBadge memberType={data.memberType || 'Silver'} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tier is automatically calculated based on policies.</p>
            </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Segmentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label 
                        htmlFor="customerCategoryId" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Category
                    </label>
                    <select 
                        id="customerCategoryId" 
                        value={data.customerCategoryId || ''} 
                        onChange={e => { onChange('customerCategoryId', e.target.value); onChange('customerSubCategoryId', ''); }} 
                        className={selectClasses}
                    >
                        <option value="">Select Category...</option>
                        {customerCategories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label 
                        htmlFor="customerSubCategoryId" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Sub-Category
                    </label>
                    <select 
                        id="customerSubCategoryId" 
                        value={data.customerSubCategoryId || ''} 
                        onChange={e => onChange('customerSubCategoryId', e.target.value)} 
                        className={selectClasses} 
                        disabled={!data.customerCategoryId}
                    >
                        <option value="">Select Sub-Category...</option>
                        {filteredSubCategories.filter(sc => sc.active).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                    </select>
                </div>
                <div>
                    <label 
                        htmlFor="customerGroupId" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Group
                    </label>
                    <select 
                        id="customerGroupId" 
                        value={data.customerGroupId || ''} 
                        onChange={e => onChange('customerGroupId', e.target.value)} 
                        className={selectClasses}
                    >
                        <option value="">Select Group...</option>
                        {customerGroups.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
        
        <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                    label="Name *" 
                    id="name" 
                    value={data.name || ''} 
                    onChange={(e) => onChange('name', e.target.value)} 
                />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input 
                            label="Date of Birth *" 
                            id="dob" 
                            type="date" 
                            value={data.dob || ''} 
                            onChange={(e) => onChange('dob', e.target.value)} 
                        />
                        {errors.dob && <p className="text-red-600 text-xs mt-1">{errors.dob}</p>}
                    </div>
                     <div>
                        <Input 
                            label="Age"
                            id="age"
                            type="text"
                            value={age !== null ? String(age) : ''}
                            onChange={handleAgeChange}
                            disabled={!isAgeManual}
                            placeholder={isAgeManual ? "Enter age..." : ""}
                        />
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Input 
                        label="Wedding Anniversary" 
                        id="anniversary" 
                        type="date" 
                        value={data.anniversary || ''} 
                        onChange={(e) => onChange('anniversary', e.target.value)} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                    <select
                        id="gender"
                        value={data.gender || ''}
                        onChange={(e) => onChange('gender', e.target.value || null)}
                        className={selectClasses}
                    >
                        <option value="">-- Select Gender --</option>
                        {genders.filter(g => g.active).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    {errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender as string}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 <div>
                    <label 
                        htmlFor="bloodGroup" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Blood Group
                    </label>
                    <select 
                        id="bloodGroup" 
                        value={data.bloodGroup || ''} 
                        onChange={(e) => onChange('bloodGroup', e.target.value)} 
                        className={selectClasses}
                    >
                        <option value="">Select...</option>
                        {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                </div>
                <div>
                    <Input 
                        label="Mobile Number *" 
                        id="mobile" 
                        type="tel" 
                        value={data.mobile || ''} 
                        onChange={(e) => onChange('mobile', e.target.value)} 
                    />
                    {errors.mobile && <p className="text-red-600 text-xs mt-1">{errors.mobile}</p>}
                </div>
                <div>
                    <Input 
                        label="Alternate Mobile Number" 
                        id="mobile2" 
                        type="tel" 
                        value={data.mobile2 || ''} 
                        onChange={(e) => onChange('mobile2', e.target.value)} 
                    />
                </div>
                <div>
                    <label 
                        htmlFor="religionId" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Religion
                    </label>
                    <select
                        id="religionId"
                        value={data.religionId || ''}
                        onChange={(e) => onChange('religionId', e.target.value || null)}
                        className={selectClasses}
                    >
                        <option value="">-- Select Religion --</option>
                        {religions.filter(r => r.active).map(religion => (
                            <option key={religion.id} value={religion.id}>
                                {religion.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Input 
                        label="Email *" 
                        id="email" 
                        type="email" 
                        value={data.email || ''} 
                        onChange={(e) => onChange('email', e.target.value)} 
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email as string}</p>}
                </div>
                <div>
                    <SearchableSelect 
                        label="Branch" 
                        options={branchOptions} 
                        value={data.branch_id || ''} 
                        onChange={(value) => onChange('branch_id', value)} 
                        placeholder="Select a branch..." 
                    />
                </div>
            </div>
        </div>

        <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label
                        htmlFor="maritalStatus"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Marital Status
                    </label>
                    <select
                        id="maritalStatus"
                        value={data.maritalStatus || ''}
                        onChange={(e) => onChange('maritalStatus', e.target.value || null)}
                        className={selectClasses}
                    >
                        <option value="">-- Select Status --</option>
                        {maritalStatuses.filter(ms => ms.active).map(ms => (
                            <option key={ms.id} value={ms.id}>{ms.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <SearchableSelect 
                        label="Assigned Advisor(s)" 
                        options={advisorOptions} 
                        value={(data.assignedTo && data.assignedTo[0]) || ''} 
                        onChange={handleMultiAssigneeChange} 
                        placeholder={!canToggleStatus ? (users.find(u=>u.id === data.assignedTo?.[0])?.name || 'Unassigned') : 'Select an advisor...'} 
                    />
                </div>
            </div>
            <div>
                <SearchableSelect 
                    label="Routes" 
                    options={routes.filter(r => r.active).map(r => ({ value: r.id, label: r.name }))} 
                    value={data.routeId || ''} 
                    onChange={(value) => onChange('routeId', value)} 
                    onCreate={handleCreateRoute} 
                    placeholder="Select or type to create a new route..." 
                />
            </div>
            <div>
                <LeadSourceSelector 
                    value={data.leadSource} 
                    onLeadSourceChange={(newValue) => onChange('leadSource', newValue)} 
                    leadSources={leadSources} 
                    allMembers={allMembers} 
                    currentMemberId={data.id} 
                    referrerId={data.referrerId} 
                    onReferrerSelect={(memberId) => onChange('referrerId', memberId)} 
                    onAddNewReferrer={onAddNewReferrer} 
                />
            </div>
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <SearchableSelect 
                        label="Country"
                        options={countries.map(c => ({ value: c.name, label: c.name }))}
                        value={data.country || ''}
                        onChange={handleCountryChange}
                        onCreate={handleCreateCountry}
                        placeholder="Select or type to create..."
                    />
                </div>
                <div>
                    <SearchableSelect 
                        label="State" 
                        options={states.map(s => ({ value: s.name, label: s.name }))} 
                        value={data.state || ''} 
                        onChange={handleStateChange} 
                        onCreate={handleCreateState} 
                        placeholder="Select or type to create..."
                        disabled={!data.country} 
                    />
                </div>
                <div>
                   <SearchableSelect 
                        label="District" 
                        options={districts.map(d => ({ value: d.name, label: d.name }))} 
                        value={data.district || ''} 
                        onChange={handleDistrictChange} 
                        onCreate={handleCreateDistrict} 
                        placeholder="Select or type to create..." 
                        disabled={!data.state} 
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <SearchableSelect 
                        label="City" 
                        options={cities.map(c => ({ value: c.name, label: c.name }))} 
                        value={data.city || ''} 
                        onChange={handleCityChange} 
                        onCreate={handleCreateCity} 
                        placeholder="Select or type to create..." 
                        disabled={!data.district} 
                    />
                </div>
                <div>
                     <SearchableSelect 
                        label="Area" 
                        options={areas.map(a => ({ value: a.name, label: a.name }))} 
                        value={data.area || ''} 
                        onChange={handleAreaChange} 
                        onCreate={handleCreateArea} 
                        placeholder="Select or type to create..." 
                        disabled={!data.city} 
                    />
                </div>
                 <div>
                    <Input 
                        label="Pincode" 
                        id="pincode" 
                        value={data.pincode || ''} 
                        onChange={(e) => onChange('pincode', e.target.value)} 
                        placeholder="e.g., 600001"
                        maxLength={6}
                    />
                </div>
            </div>
            <div>
                <Input 
                    label="Address Line 1 *" 
                    id="address1" 
                    value={addressLine1} 
                    onChange={(e) => handleAddressChange(1, e.target.value)} 
                    placeholder="House No, Street Name" 
                />
                {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address as string}</p>}
            </div>
            <div>
                <Input 
                    label="Address Line 2" 
                    id="address2" 
                    value={addressLine2} 
                    onChange={(e) => handleAddressChange(2, e.target.value)} 
                    placeholder="Landmark" 
                />
                 </div>
        </div>

        <div className="space-y-6">
            {Object.entries(groupedDynamicFields).map(([groupName, fieldsInGroup]) => (
                <div key={groupName} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{groupName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {fieldsInGroup.map(field => {
                            const value = data.dynamicData?.[field.fieldName] ?? '';
                            const colSpanClass = field.columnSpan === 2 ? 'md:col-span-2' : field.columnSpan === 3 ? 'md:col-span-3' : 'md:col-span-1';

                            let fieldComponent;
                            switch (field.fieldType) {
                                case 'boolean':
                                    fieldComponent = (
                                        <div className="flex flex-col h-full pt-2">
                                            <label className="flex items-center justify-between gap-4 w-full">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                                                <ToggleSwitch 
                                                    enabled={!!value} 
                                                    onChange={val => handleDynamicDataChange(field.fieldName, val)} 
                                                />
                                            </label>
                                        </div>
                                    );
                                    break;
                                case 'select':
                                    fieldComponent = (
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{field.label}</label>
                                            <select 
                                                value={value} 
                                                onChange={e => handleDynamicDataChange(field.fieldName, e.target.value)} 
                                                className={selectClasses}
                                            >
                                                <option value="">-- Select --</option>
                                                {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    );
                                    break;
                                case 'checkbox':
                                    const currentValues = Array.isArray(value) ? value : [];
                                    fieldComponent = (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{field.label}</label>
                                            <div className="space-y-2">
                                                {(field.options || []).map(opt => (
                                                    <label key={opt} className="flex items-center gap-2">
                                                        <input 
                                                            type="checkbox" 
                                                            className="h-4 w-4 rounded" 
                                                            checked={currentValues.includes(opt)} 
                                                            onChange={e => {
                                                                const newValues = e.target.checked ? [...currentValues, opt] : currentValues.filter((v:string) => v !== opt);
                                                                handleDynamicDataChange(field.fieldName, newValues);
                                                            }}
                                                        />
                                                        {opt}
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
                                                tableData={value || { __type: 'table', rows: [] }}
                                                onDataChange={handleDynamicDataChange}
                                                onMasterFieldUpdate={handleMasterFieldUpdate}
                                                onRemoveField={() => handleRemoveMasterField(field)}
                                                isReadOnly={false} 
                                            />
                                        </div>
                                    );
                                    break;
                                default:
                                    fieldComponent = <Input 
                                        label={field.label} 
                                        type={field.fieldType} 
                                        value={value} 
                                        onChange={e => handleDynamicDataChange(field.fieldName, e.target.value)} 
                                    />;
                            }
                            return <div key={field.id} className={colSpanClass}>{fieldComponent}</div>;
                        })}
                    </div>
                </div>
            ))}
            <Button 
                variant="light" 
                size="small" 
                onClick={() => setIsAddFieldModalOpen(true)}
            >
                <Plus size={14}/> Add New Custom Field to Master
            </Button>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><MapPin size={20} /> Location</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="relative">
                        <Input 
                            label="Latitude" 
                            type="number" 
                            step="any" 
                            value={data.lat === undefined ? '' : data.lat}
                            onChange={(e) => onChange('lat', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="e.g., 12.722" 
                        />
                        {isSyncingCoords && <Loader2 className="animate-spin w-4 h-4 text-gray-400 absolute right-3 top-10" />}
                    </div>
                    <div className="relative">
                        <Input 
                            label="Longitude" 
                            type="number" 
                            step="any" 
                            value={data.lng === undefined ? '' : data.lng}
                            onChange={(e) => onChange('lng', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            placeholder="e.g., 77.832" 
                        />
                        {isSyncingCoords && <Loader2 className="animate-spin w-4 h-4 text-gray-400 absolute right-3 top-10" />}
                    </div>
                    <Button 
                        type="button" 
                        onClick={handleGpsCapture} 
                        disabled={isCapturingGps} 
                        className="flex-1 justify-center h-10" 
                        title="Get Current Location"
                    >
                        {isCapturingGps ? <Loader2 className="animate-spin" /> : <Target />}
                        {isCapturingGps ? 'Capturing...' : 'Get Location'}
                    </Button>
                </div>
                <div className="relative">
                    <Input 
                        label="Digipin (Plus Code)" 
                        id="digipin" 
                        value={data.digipin || ''} 
                        onChange={(e) => onChange('digipin', e.target.value)} 
                        placeholder="e.g., 7J5R9R5Q+5R" 
                    />
                    {isSyncingDigipin && <Loader2 className="animate-spin w-4 h-4 text-gray-400 absolute right-3 top-10" />}
                </div>
            </div>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Account Status</h4>
                <p className={`text-sm font-semibold ${data.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>{data.active ? 'Active' : 'Inactive'}</p>
                {!canDeactivate && data.active && <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">To deactivate, all policies must be set to 'Inactive' first.</p>}
            </div>
            <ToggleSwitch 
                enabled={!!data.active} 
                onChange={handleStatusToggle} 
                srLabel="Toggle account status" 
                disabled={!canToggleStatus}
            />
        </div>
    </div>
  );
};