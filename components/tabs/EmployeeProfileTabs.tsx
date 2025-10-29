import React, { useState, useMemo, useCallback } from 'react';
import { User, EmployeeProfile, AdvisorEducation, AdvisorAddress, Member, FinRootsBranch, Geography, BankMaster, BusinessVertical, InsuranceTypeMaster, AMC, Designation, AppModule, PermissionLevel, RolePermissions, Gender, AccountType, Role, DocumentMaster } from '../../types.ts';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { Trash2, PlusCircle, X, Users, Copy, Banknote, KeyRound } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect.tsx';

const selectClasses = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const SkillTagsInput: React.FC<{ skills: string; onSkillsChange: (skills: string) => void; }> = ({ skills, onSkillsChange }) => {
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const removeSkill = (skillToRemove: string) => {
        onSkillsChange(skillsArray.filter(s => s !== skillToRemove).join(', '));
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            const newSkill = e.currentTarget.value.trim().replace(/,$/, '');
            if (newSkill && !skillsArray.includes(newSkill)) {
                onSkillsChange([...skillsArray, newSkill].join(', '));
            }
            e.currentTarget.value = '';
        }
    };
    return (
        <div>
            <Input label="Skillset *" onKeyDown={handleKeyDown} placeholder="Type a skill and press Enter" />
            <div className="flex flex-wrap gap-2 mt-2">
                {skillsArray.map((skill, index) => (
                    <span key={index} className="flex items-center gap-1.5 bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-200">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={12} /></button>
                    </span>
                ))}
            </div>
        </div>
    );
};

const TagsSelectionInput: React.FC<{
    label: string;
    placeholder: string;
    selectedIds: string[];
    options: { id: string; name: string }[];
    onIdsChange: (ids: string[]) => void;
}> = ({ label, placeholder, selectedIds, options, onIdsChange }) => {
    
    const selectedItems = useMemo(() => 
        selectedIds.map(id => options.find(opt => opt.id === id)).filter(Boolean) as { id: string; name: string }[],
        [selectedIds, options]
    );

    const availableOptions = useMemo(() =>
        options.filter(opt => !selectedIds.includes(opt.id)),
        [selectedIds, options]
    );

    const handleAddItem = (id: string) => {
        if (id && !selectedIds.includes(id)) {
            onIdsChange([...selectedIds, id]);
        }
    };
    
    const handleRemoveItem = (idToRemove: string) => {
        onIdsChange(selectedIds.filter(id => id !== idToRemove));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select
                value=""
                onChange={(e) => {
                    handleAddItem(e.target.value);
                    e.target.value = ""; // Reset select
                }}
                className={selectClasses}
            >
                <option value="" disabled>{placeholder}</option>
                {availableOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
            <div className="flex flex-wrap gap-2 mt-2 min-h-[2.5rem]">
                {selectedItems.map(item => (
                    <span key={item.id} className="flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-200">
                        {item.name}
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-blue-500 hover:text-blue-800 dark:text-blue-400 dark:hover:text-white"><X size={12} /></button>
                    </span>
                ))}
            </div>
        </div>
    );
};

// --- MODIFIED: GeneralInfoTab updated ---
// --- Place this inside your EmployeeProfileTabs.tsx file, replacing the existing GeneralInfoTab ---

export const GeneralInfoTab: React.FC<{ 
    data: Partial<User>; 
    onChange: (field: keyof User | 'profile', value: any) => void;
    onSave: (employee: User, closeModal?: boolean) => void;
    finrootsBranches?: FinRootsBranch[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    bankMasters: BankMaster[];
    businessVerticals?: BusinessVertical[];
    insuranceTypes?: InsuranceTypeMaster[];
    amcs?: AMC[];
    designations: Designation[];
    roles: Role[];
    genders: Gender[];
    accountTypes: AccountType[]; 
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ 
    data, onChange, onSave, finrootsBranches, addToast, bankMasters, businessVerticals, 
    insuranceTypes, amcs, designations, roles, genders, accountTypes, permissions  
}) => {
    const profile = data.profile || { status: 'Active' };
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const handleProfileChange = (field: keyof EmployeeProfile, value: any) => {
        onChange('profile', { ...profile, [field]: value });
    };

    const isInsuranceVerticalSelected = useMemo(() => {
        const insuranceVertical = businessVerticals?.find(v => v.name.toLowerCase().includes('insurance'));
        return !!(insuranceVertical && profile.businessVerticalIds?.includes(insuranceVertical.id));
    }, [businessVerticals, profile.businessVerticalIds]);

    const isMutualFundsVerticalSelected = useMemo(() => {
        const mfVertical = businessVerticals?.find(v => v.name.toLowerCase().includes('mutual funds') || v.name.toLowerCase().includes('mutual fund'));
        return !!(mfVertical && profile.businessVerticalIds?.includes(mfVertical.id));
    }, [businessVerticals, profile.businessVerticalIds]);
    
    const isAgentAppointmentVerticalSelected = useMemo(() => {
        const aaVertical = businessVerticals?.find(v => v.name.toLowerCase().includes('agent appointments') || v.name.toLowerCase().includes('agent appointment'));
        return !!(aaVertical && profile.businessVerticalIds?.includes(aaVertical.id));
    }, [businessVerticals, profile.businessVerticalIds]);


    const handleSavePassword = () => {
        if (newPassword.length < 6) {
            addToast('New password must be at least 6 characters.', 'error');
            return;
        }
        const updatedUser = { ...data, password: newPassword } as User;
        
        onSave(updatedUser, false);
        
        setNewPassword('');
        setIsResettingPassword(false);
    };
    
    const handleFresherToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        
        const newProfileData = { ...profile };

        if (isChecked) {
            newProfileData.isFresher = true;
            newProfileData.workExperienceYears = 0;
            newProfileData.workExperienceMonths = 0;
            newProfileData.industry = 'N/A';
        } else {
            newProfileData.isFresher = false;
            newProfileData.workExperienceYears = undefined;
            newProfileData.workExperienceMonths = undefined;
            newProfileData.industry = '';
        }
        
        onChange('profile', newProfileData);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Date of Birth *" type="date" value={profile.dateOfBirth || ''} onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)} />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                    <select
                        value={profile.gender || ''}
                        onChange={(e) => handleProfileChange('gender', e.target.value || null)}
                        className={selectClasses}
                    >
                        <option value="">Select Gender...</option>
                        {genders.filter(g => g.active).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation *</label>
                    <select value={data.designationId || ''} onChange={e => onChange('designationId', e.target.value)} className={selectClasses}>
                        <option value="">-- Select Designation --</option>
                        {designations.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <select value={data.roleId || ''} onChange={e => onChange('roleId', e.target.value || null)} className={selectClasses}>
                        <option value="">-- No Role --</option>
                        {roles.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                    <select value={profile.employeeBranchId || ''} onChange={e => handleProfileChange('employeeBranchId', e.target.value)} className={selectClasses} disabled={!finrootsBranches}>
                        <option value="">{finrootsBranches ? 'Select Branch...' : 'Branch Info Unavailable'}</option>
                        {finrootsBranches?.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.branchName}</option>
                        ))}
                    </select>
                </div>
                <Input label="Date of Joining *" type="date" value={profile.dateOfJoining || ''} onChange={e => handleProfileChange('dateOfJoining', e.target.value)} />
            </div>

            <div className="md:col-span-2">
                <TagsSelectionInput
                    label="Business Vertical *"
                    placeholder="Add a vertical..."
                    selectedIds={profile.businessVerticalIds || []}
                    options={businessVerticals?.filter(v => v.active) || []}
                    onIdsChange={(ids) => handleProfileChange('businessVerticalIds', ids)}
                />
            </div>
            
            <div className="md:col-span-2 space-y-4">
                {isInsuranceVerticalSelected && (
                    <div className="animate-fade-in">
                        <TagsSelectionInput
                            label="Insurance Specializations"
                            placeholder="Add a specialization..."
                            selectedIds={profile.specializationIds || []}
                            options={insuranceTypes?.filter(it => it.active && !it.parentId) || []}
                            onIdsChange={(ids) => handleProfileChange('specializationIds', ids)}
                        />
                    </div>
                )}
                
                {isMutualFundsVerticalSelected && (
                    <div className="animate-fade-in">
                        <TagsSelectionInput
                            label="Associated AMCs"
                            placeholder="Add an AMC..."
                            selectedIds={profile.amcIds || []}
                            options={amcs?.filter(amc => amc.active) || []}
                            onIdsChange={(ids) => handleProfileChange('amcIds', ids)}
                        />
                    </div>
                )}

                {isAgentAppointmentVerticalSelected && (
                    <div className="animate-fade-in">
                         <Input 
                            label="Agent Code"
                            value={profile.agentCode || ''}
                            onChange={(e) => handleProfileChange('agentCode', e.target.value)}
                            placeholder="Enter Agent Code"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Father Name *" value={profile.fatherName || ''} onChange={(e) => handleProfileChange('fatherName', e.target.value)} />
                <Input label="Mother Name *" value={profile.motherName || ''} onChange={(e) => handleProfileChange('motherName', e.target.value)} />
            </div>
            
                        {/* --- RE-ADDED: Password Management Section --- */}
            <div className="md:col-span-2 p-4 border rounded-lg dark:border-gray-600 space-y-3 mt-6">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><KeyRound size={16}/> Password Management</h4>
                {!data.id ? (
                    <Input
                        label="Set Initial Password *"
                        type="password"
                        value={data.password || ''}
                        onChange={(e) => onChange('password', e.target.value)}
                        placeholder="Min. 6 characters"
                    />
                ) : (
                    <div className="space-y-3">
                        <Input
                            label="Current Password"
                            type="password"
                            value={data.password || ''}
                            onChange={() => {}}
                            readOnly
                            disabled
                        />
                        {isResettingPassword ? (
                            <div className="animate-fade-in space-y-2">
                                <Input 
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                                <div className="flex items-center gap-2">
                                    <Button variant="primary" size="small" onClick={handleSavePassword}>Save New Password</Button>
                                    <Button variant="secondary" size="small" onClick={() => setIsResettingPassword(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="secondary" onClick={() => setIsResettingPassword(true)}>
                                Reset Password
                            </Button>
                        )}
                    </div>
                )}
            </div>
            {/* Driving Licence Section */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mt-4">
                <label className="block text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Driving Licence
                </label>

                <div className="flex items-center mb-3">
                    <input
                    type="checkbox"
                    checked={!!profile.drivingLicenceObtained}
                    onChange={(e) => handleProfileChange('drivingLicenceObtained', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Do you have a Driving Licence?</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                    label="Driving Licence No *"
                    value={profile.drivingLicenceNo || ''}
                    onChange={(e) => handleProfileChange('drivingLicenceNo', e.target.value)}
                    disabled={!profile.drivingLicenceObtained}
                    />
                    <Input
                    label="DL Expiry Date *"
                    type="date"
                    value={profile.dlExpiryDate || ''}
                    onChange={(e) => handleProfileChange('dlExpiryDate', e.target.value)}
                    disabled={!profile.drivingLicenceObtained}
                    />
                </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border p-4 rounded-lg dark:border-gray-600">
                <h4 className="col-span-full font-semibold text-gray-700 dark:text-gray-300">Work Experience</h4>
                <div className="md:col-span-2 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isFresher"
                        checked={!!profile.isFresher}
                        onChange={handleFresherToggle}
                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary accent-brand-primary"
                    />
                    <label htmlFor="isFresher" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fresher (No prior work experience)
                    </label>
                </div>
                <Input
                    label="Years *"
                    type="number"
                    value={profile.workExperienceYears ?? ''}
                                       onChange={e => handleProfileChange('workExperienceYears', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    disabled={!!profile.isFresher}
                />
                <Input
                    label="Months *"
                    type="number"
                    value={profile.workExperienceMonths ?? ''}
                    onChange={e => handleProfileChange('workExperienceMonths', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    disabled={!!profile.isFresher}
                />
                <Input
                    label="Industry *"
                    value={profile.industry || ''}
                    onChange={e => handleProfileChange('industry', e.target.value)}
                    disabled={!!profile.isFresher}
                />
            </div>

            <div className="md:col-span-2"><SkillTagsInput skills={profile.computerSkills || ''} onSkillsChange={(skills) => handleProfileChange('computerSkills', skills)}/></div>

            <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Banknote /> Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name *</label>
                        <select
                            value={profile.bankDetails?.bankName || ''}
                                                       onChange={(e) => handleProfileChange('bankDetails', { ...profile.bankDetails, bankName: e.target.value })}
                            className={selectClasses}
                        >
                            <option value="">Select a Bank...</option>
                            {bankMasters.filter(b => b.active).map(b => <option key={b.id} value={b.bankName}>{b.bankName}</option>)}
                        </select>
                    </div>
                    <Input label="Account Number *" value={profile.bankDetails?.accountNumber || ''} onChange={(e) => handleProfileChange('bankDetails', { ...profile.bankDetails, accountNumber: e.target.value })} />
                    <Input label="IFSC Code *" value={profile.bankDetails?.ifscCode || ''} onChange={(e) => handleProfileChange('bankDetails', { ...profile.bankDetails, ifscCode: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type *</label>
                        <select
                            value={profile.bankDetails?.accountType || ''}
                            onChange={e => handleProfileChange('bankDetails', { ...profile.bankDetails, accountType: e.target.value })}
                            className={selectClasses}
                        >
                            <option value="">Select Account Type...</option>
                            {accountTypes.filter(at => at.active).map(at => (
                                <option key={at.id} value={at.name}>{at.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>


        </div>
    );
};

// ... (The rest of your components like AddressTab, EducationTab, etc. remain unchanged)

const AddressForm: React.FC<{
  title: string;
  isPermanent?: boolean;
  addressType: 'permanentAddress' | 'localAddress';
  formData: Partial<AdvisorAddress>;
  onFormChange: (addressType: 'permanentAddress' | 'localAddress', newAddressData: AdvisorAddress) => void;
  onCopyPermanent?: () => void;
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}> = React.memo(({ title, isPermanent = false, addressType, formData, onFormChange, onCopyPermanent, geographies, onUpdateGeographies, addToast }) => {
  const handleChange = (field: keyof AdvisorAddress, value: string) => {
    onFormChange(addressType, { ...formData, [field]: value } as AdvisorAddress);
  };
  
  // --- MODIFICATION START ---
  const countries = useMemo(() => {
    return geographies.filter(g => g.type === 'Country' && g.active !== false)
      .map(c => ({ value: c.name, label: c.name }));
  }, [geographies]);

  const selectedCountryObject = useMemo(() => {
    // Default to India if no country is selected
    const countryName = formData.country || 'India';
    return geographies.find(g => g.name === countryName && g.type === 'Country');
  }, [formData.country, geographies]);

  const states = useMemo(() => {
    if (!selectedCountryObject) return [];
    return geographies.filter(g => g.parentId === selectedCountryObject.id && g.type === 'State' && g.active !== false)
      .map(s => ({ value: s.name, label: s.name }));
  }, [selectedCountryObject, geographies]);
  // --- MODIFICATION END ---

  const selectedStateObject = useMemo(() => {
    return geographies.find(g => g.name === formData.state && g.type === 'State');
  }, [formData.state, geographies]);

  const districts = useMemo(() => {
    if (!selectedStateObject) return [];
    return geographies.filter(g => g.parentId === selectedStateObject.id && g.type === 'District' && g.active !== false)
      .map(d => ({ value: d.name, label: d.name }));
  }, [selectedStateObject, geographies]);

  const selectedDistrictObject = useMemo(() => {
      if (!selectedStateObject) return null;
      return geographies.find(g => g.name === formData.district && g.type === 'District' && g.parentId === selectedStateObject.id);
  }, [formData.district, selectedStateObject, geographies]);

  const cities = useMemo(() => {
    if (!selectedDistrictObject) return [];
    return geographies.filter(g => g.parentId === selectedDistrictObject.id && g.type === 'City' && g.active !== false)
      .map(c => ({ value: c.name, label: c.name }));
  }, [selectedDistrictObject, geographies]);

  const selectedCityObject = useMemo(() => {
      if(!selectedDistrictObject) return null;
      return geographies.find(g => g.name === formData.city && g.type === 'City' && g.parentId === selectedDistrictObject.id);
  }, [formData.city, selectedDistrictObject, geographies]);

  const areas = useMemo(() => {
      if(!selectedCityObject) return [];
      return geographies.filter(g => g.parentId === selectedCityObject.id && g.type === 'Area' && g.active !== false)
        .map(a => ({value: a.name, label: a.name}));
  }, [selectedCityObject, geographies]);

  // --- MODIFICATION START ---
  const handleCountryChange = (newCountryName: string) => {
    onFormChange(addressType, { ...formData, country: newCountryName, state: '', district: '', city: '', area: '' } as AdvisorAddress);
  };
  // --- MODIFICATION END ---

  const handleStateChange = (newStateName: string) => {
    onFormChange(addressType, { ...formData, state: newStateName, district: '', city: '', area: '' } as AdvisorAddress);
  };
  
  const handleDistrictChange = (newDistrictName: string) => {
    onFormChange(addressType, { ...formData, district: newDistrictName, city: '', area: '' } as AdvisorAddress);
  };

  const handleCityChange = (newCityName: string) => {
    onFormChange(addressType, { ...formData, city: newCityName, area: '' } as AdvisorAddress);
  };

  const handleAreaChange = (newAreaName: string) => {
    onFormChange(addressType, { ...formData, area: newAreaName } as AdvisorAddress);
  };

  const handleCreateGeography = (name: string, type: 'Country' | 'State' | 'District' | 'City' | 'Area') => {
    if (type === 'Country') {
        const newCountry: Geography = { id: `geo-${Date.now()}`, name, type: 'Country', parentId: null, active: true };
        onUpdateGeographies([...geographies, newCountry]);
        handleCountryChange(name);
        addToast(`Country "${name}" created.`, 'success');
    } else if (type === 'State') {
        if (!selectedCountryObject) return addToast("Please select a country first.", "error");
        const newState: Geography = { id: `geo-${Date.now()}`, name, type: 'State', parentId: selectedCountryObject.id, active: true };
        onUpdateGeographies([...geographies, newState]);
        handleStateChange(name);
        addToast(`State "${name}" created.`, 'success');
    } else if (type === 'District') {
        if (!selectedStateObject) return addToast("Please select a state first.", "error");
        const newDistrict: Geography = { id: `geo-${Date.now()}`, name, type: 'District', parentId: selectedStateObject.id, active: true };
        onUpdateGeographies([...geographies, newDistrict]);
        handleDistrictChange(name);
        addToast(`District "${name}" created.`, 'success');
    } else if (type === 'City') {
        if (!selectedDistrictObject) return addToast("Please select a district first.", "error");
        const newCity: Geography = { id: `geo-${Date.now()}`, name, type: 'City', parentId: selectedDistrictObject.id, active: true };
        onUpdateGeographies([...geographies, newCity]);
        handleCityChange(name);
        addToast(`City "${name}" created.`, 'success');
    } else { // Area
        if (!selectedCityObject) return addToast("Please select a city first.", "error");
        const newArea: Geography = { id: `geo-${Date.now()}`, name, type: 'Area', parentId: selectedCityObject.id, active: true };
        onUpdateGeographies([...geographies, newArea]);
        handleAreaChange(name);
        addToast(`Area "${name}" created.`, 'success');
    }
  };


  return (
    <div className="space-y-4 p-4 border rounded-lg dark:border-gray-600">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
            {onCopyPermanent && (
                <Button type="button" size="small" variant="light" onClick={onCopyPermanent}>
                    <Copy size={14} /> Same as Permanent
                </Button>
            )}
        </div>
        <Input label={`Line 1 ${isPermanent ? '*' : ''}`} value={formData.line1 || ''} onChange={(e) => handleChange('line1', e.target.value)} />
        <Input label="Line 2" value={formData.line2 || ''} onChange={(e) => handleChange('line2', e.target.value)} />
        <Input label="Line 3" value={formData.line3 || ''} onChange={(e) => handleChange('line3', e.target.value)} />
        {/* --- MODIFICATION START --- */}
        <SearchableSelect
            label={`Country ${isPermanent ? '*' : ''}`}
            options={countries}
            value={formData.country || 'India'}
            onChange={handleCountryChange}
            onCreate={(name) => handleCreateGeography(name, 'Country')}
            placeholder="Select or type to create..."
        />
        <SearchableSelect
            label={`State ${isPermanent ? '*' : ''}`}
            options={states}
            value={formData.state || ''}
            onChange={handleStateChange}
            onCreate={(name) => handleCreateGeography(name, 'State')}
            placeholder="Select or type to create..."
            disabled={!formData.country && !selectedCountryObject}
        />
        {/* --- MODIFICATION END --- */}
        <SearchableSelect
            label={`District ${isPermanent ? '*' : ''}`}
            options={districts}
            value={formData.district || ''}
            onChange={handleDistrictChange}
            onCreate={(name) => handleCreateGeography(name, 'District')}
            placeholder="Select or type to create..."
            disabled={!formData.state}
        />
        <SearchableSelect
            label={`City ${isPermanent ? '*' : ''}`}
            options={cities}
            value={formData.city || ''}
            onChange={handleCityChange}
            onCreate={(name) => handleCreateGeography(name, 'City')}
            placeholder="Select or type to create..."
            disabled={!formData.district}
        />
        <SearchableSelect
            label={`Area`}
            options={areas}
            value={formData.area || ''}
            onChange={handleAreaChange}
            onCreate={(name) => handleCreateGeography(name, 'Area')}
            placeholder="Select or type to create..."
            disabled={!formData.city}
        />
        <Input label={`Pin Code ${isPermanent ? '*' : ''}`} value={formData.pinCode || ''} onChange={(e) => handleChange('pinCode', e.target.value)} />
        <Input label="Phone 1" value={formData.phone1 || ''} onChange={(e) => handleChange('phone1', e.target.value)} />
    </div>
  );
});


export const AddressTab: React.FC<{
  data: Partial<User>;
  onChange: (field: 'profile', value: any) => void;
  geographies: Geography[];
  onUpdateGeographies: (data: Geography[]) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}> = ({ data, onChange, geographies, onUpdateGeographies, addToast }) => {
    const profile = data.profile || { status: 'Active' };

    const handleFormChange = useCallback((addressType: 'permanentAddress' | 'localAddress', newAddressData: AdvisorAddress) => {
        onChange('profile', {
            ...profile,
            [addressType]: newAddressData
        });
    }, [profile, onChange]);

    const copyPermanentToLocal = useCallback(() => {
        onChange('profile', {
            ...profile,
            localAddress: { ...(profile.permanentAddress || {}) }
        });
    }, [profile, onChange]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AddressForm
                title="Permanent Address"
                isPermanent={true}
                addressType="permanentAddress"
                formData={profile.permanentAddress || {}}
                onFormChange={handleFormChange}
                geographies={geographies}
                onUpdateGeographies={onUpdateGeographies}
                addToast={addToast}
            />
            <AddressForm
                title="Local Address"
                addressType="localAddress"
                formData={profile.localAddress || {}}
                onFormChange={handleFormChange}
                onCopyPermanent={copyPermanentToLocal}
                geographies={geographies}
                onUpdateGeographies={onUpdateGeographies}
                addToast={addToast}
            />
        </div>
    );
};

export const EducationTab: React.FC<{ data: Partial<User>; onChange: (field: 'profile', value: any) => void; }> = ({ data, onChange }) => {
    const profile = data.profile || { status: 'Active' };
    const educationDetails = profile.educationDetails || [];

    const handleAddEducation = () => {
        const newEducation: Partial<AdvisorEducation> = { id: `edu-${Date.now()}`, education: '', specialization: '', instituteName: '', university: '', fromDate: '', toDate: '', grade: '' };
        onChange('profile', { ...profile, educationDetails: [...educationDetails, newEducation] });
    };

    const handleRemoveEducation = (id: string) => {
        onChange('profile', { ...profile, educationDetails: educationDetails.filter(edu => edu.id !== id) });
    };

    const handleEducationChange = (id: string, field: keyof AdvisorEducation, value: any) => {
        const updatedEducation = educationDetails.map(edu => edu.id === id ? { ...edu, [field]: value } : edu);
        onChange('profile', { ...profile, educationDetails: updatedEducation });
    };

    return (
        <div className="space-y-4">
            {educationDetails.map(edu => (
                <div key={edu.id} className="p-4 border rounded-lg dark:border-gray-600 space-y-4 relative">
                    <Button variant="danger" size="small" onClick={() => handleRemoveEducation(edu.id!)} className="absolute top-2 right-2 !p-2"><Trash2 size={16} /></Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Education" value={edu.education} onChange={(e) => handleEducationChange(edu.id!, 'education', e.target.value)} />
                        <Input label="Specialization" value={edu.specialization} onChange={(e) => handleEducationChange(edu.id!, 'specialization', e.target.value)} />
                        <Input label="Institute Name" value={edu.instituteName} onChange={(e) => handleEducationChange(edu.id!, 'instituteName', e.target.value)} />
                        <Input label="University" value={edu.university} onChange={(e) => handleEducationChange(edu.id!, 'university', e.target.value)} />
                        <Input label="From Date" type="date" value={edu.fromDate} onChange={(e) => handleEducationChange(edu.id!, 'fromDate', e.target.value)} />
                        <Input label="To Date" type="date" value={edu.toDate} onChange={(e) => handleEducationChange(edu.id!, 'toDate', e.target.value)} />
                        <Input label="Percentage/CGPA" value={edu.grade} onChange={(e) => handleEducationChange(edu.id!, 'grade', e.target.value)} />
                    </div>
                </div>
            ))}
            <Button variant="secondary" onClick={handleAddEducation}><PlusCircle size={16} /> Add Education</Button>
        </div>
    );
};

// RENAMED from AdvisorCustomersTab to EmployeeCustomersTab
export const EmployeeCustomersTab: React.FC<{
    employee: Partial<User>; // RENAMED
    allMembers: Member[];
    users: User[];
}> = ({ employee, allMembers, users }) => {
    const assignedCustomers = useMemo(() => {
        return allMembers.filter(m => m.assignedTo?.includes(employee.id || ''));
    }, [employee, allMembers]);

    const MemberTierBadge = ({ memberType }: { memberType: Member['memberType']}) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            memberType === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
            memberType === 'Silver' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
            memberType === 'Diamond' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
            'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
        }`}>
            {memberType}
        </span>
      );

    return (
        <div className="space-y-4">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Policies</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {assignedCustomers.map(member => (
                            <tr key={member.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{member.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><MemberTierBadge memberType={member.memberType} /></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.city}, {member.state}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.policies.length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {assignedCustomers.length === 0 && <div className="text-center py-10 text-gray-500 dark:text-gray-400"><Users size={32} className="mx-auto text-gray-300 dark:text-gray-600"/>No customers assigned.</div>}
            </div>
        </div>
    );
};