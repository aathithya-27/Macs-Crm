import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// MODIFIED: Added Gender
import { User, EmployeeProfile, EmployeeModalTab, Member, FinRootsBranch, Geography, BankMaster, BusinessVertical, InsuranceTypeMaster, AMC, Designation, DesignationPermissions, Gender, DocumentMaster } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
// MODIFIED: Added Lock icon for permissions tab
import { X, User as UserIcon, MapPin, BookOpen, Edit, Users, FileText as FileTextIcon, Lock } from 'lucide-react';
// MODIFIED: Imported PermissionsTab
import { GeneralInfoTab, AddressTab, EducationTab, EmployeeCustomersTab, PermissionsTab } from './tabs/EmployeeProfileTabs.tsx';
import { EmployeeDocumentsTab } from './tabs/EmployeeDocumentsTab.tsx';

// --- Main Modal Component ---

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
    onSave: (employee: User, closeModal?: boolean) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    users: User[];
    finrootsBranches: FinRootsBranch[];
    currentUser: User | null;
    geographies: Geography[];
    onUpdateGeographies: (data: Geography[]) => void;
    bankMasters: BankMaster[];
    businessVerticals: BusinessVertical[];
    insuranceTypes: InsuranceTypeMaster[];
    amcs: AMC[];
    designations: Designation[];
    // NEW: Pass down all designation permissions
    designationPermissions: DesignationPermissions[];
    genders: Gender[]; // MODIFIED: Added genders prop
    // --- MODIFICATION START ---
    documentMasters: DocumentMaster[];
    // --- MODIFICATION END ---
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ 
    isOpen, onClose, employee, onSave, addToast, allMembers, users, 
    finrootsBranches, currentUser, geographies, onUpdateGeographies, 
    bankMasters, businessVerticals, insuranceTypes, amcs, designations,
    designationPermissions, genders, documentMasters // MODIFIED
}) => {
    const [activeTab, setActiveTab] = useState<EmployeeModalTab>(EmployeeModalTab.GeneralInfo);
    const [formData, setFormData] = useState<Partial<User>>({});
    const formDataRef = useRef(formData);
    formDataRef.current = formData;

    const getInitialFormData = (emp: User | null): Partial<User> => {
        if (emp) return JSON.parse(JSON.stringify(emp));

        const companyEmployeeIds = users
            .filter(u => u.companyId === currentUser?.companyId && !isNaN(parseInt(u.employeeId, 10)))
            .map(u => parseInt(u.employeeId, 10));
    
        const nextIdNumber = companyEmployeeIds.length > 0 ? Math.max(...companyEmployeeIds) + 1 : 1001;

        const today = new Date().toISOString().split('T')[0];
        return {
            name: '',
            email: '',
            employeeId: String(nextIdNumber),
            role: '',
            designationId: '',
            company: currentUser?.company || '',
            companyId: currentUser?.companyId || '',
            profile: {
                status: 'Active',
                dateOfCreation: today,
                dateOfJoining: today,
                educationDetails: [],
                permanentAddress: {},
                localAddress: {},
                companyId: currentUser?.companyId || '',
                documents: [],
                businessVerticalIds: [],
                specializationIds: [],
                amcIds: [],
                permissions: {}, // NEW: Initialize permissions object
            }
        };
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData(employee));
            setActiveTab(EmployeeModalTab.GeneralInfo);
        }
    }, [employee, isOpen, users, currentUser]);

    useEffect(() => {
      return () => {
          const url = formDataRef.current?.profile?.photoUrl;
          if (url && url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
          }
      };
    }, []);

    const handleChange = useCallback((field: keyof User | 'profile', value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const currentUrl = formData.profile?.photoUrl;
            if (currentUrl && currentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentUrl);
            }
            const newUrl = URL.createObjectURL(file);
            handleChange('profile', { ...formData.profile, photoUrl: newUrl });
        }
    };

    const validateForm = () => {
        if (!formData.name?.trim()) { addToast('Employee Name is required.', 'error'); return false; }
        if (!formData.email?.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) { addToast('A valid email is required.', 'error'); return false; }
        if (!formData.employeeId?.trim()) { addToast('Employee ID is required.', 'error'); return false; }
        if (!formData.designationId) { addToast('A Designation must be selected.', 'error'); return false; }
        if (!employee && (!formData.password || formData.password.length < 6)) {
            addToast('A password with at least 6 characters is required for new employees.', 'error');
            return false;
        }

        const profile = formData.profile;
        if (!profile) {
            addToast('Profile data is missing.', 'error');
            return false;
        }
        
        if (!profile.dateOfBirth) { addToast('Date of Birth is required.', 'error'); return false; }
        if (!profile.employeeBranchId) { addToast('Employee Branch is required.', 'error'); return false; }
        if (!profile.businessVerticalIds || profile.businessVerticalIds.length === 0) { addToast('Business Vertical is required.', 'error'); return false; }
        if (!profile.dateOfJoining) { addToast('Date of Joining is required.', 'error'); return false; }
        if (!profile.fatherMotherName?.trim()) { addToast("Father/Mother's Name is required.", 'error'); return false; }
        if (!profile.gender) { addToast('Gender is required.', 'error'); return false; }
        if (profile.drivingLicenceObtained && !profile.drivingLicenceNo?.trim()) { addToast('Driving Licence Number is required.', 'error'); return false; }
        if (profile.drivingLicenceObtained && !profile.dlExpiryDate) { addToast('Driving Licence Expiry Date is required.', 'error'); return false; }
        
        if (!profile.isFresher) {
            if (profile.workExperienceMonths === undefined || profile.workExperienceMonths < 0) { addToast('Work Experience (Months) is required.', 'error'); return false; }
            if (profile.workExperienceYears === undefined || profile.workExperienceYears < 0) { addToast('Work Experience (Years) is required.', 'error'); return false; }
            if (!profile.industry?.trim()) { addToast('Industry is required.', 'error'); return false; }
        }

        if (!profile.computerSkills?.trim()) { addToast('Skillset is required.', 'error'); return false; }
        
        if (!profile.bankDetails?.bankName) { addToast('Bank Name is required.', 'error'); return false; }
        if (!profile.bankDetails?.accountNumber) { addToast('Bank Account Number is required.', 'error'); return false; }
        if (!profile.bankDetails?.ifscCode) { addToast('Bank IFSC Code is required.', 'error'); return false; }
        if (!profile.bankDetails?.accountType) { addToast('Bank Account Type is required.', 'error'); return false; }

        const permAddress = profile.permanentAddress;
        if (!permAddress) { addToast('Permanent Address is required.', 'error'); return false; }
        if (!permAddress.line1?.trim()) { addToast('Permanent Address: Line 1 is required.', 'error'); return false; }
        if (!permAddress.state) { addToast('Permanent Address: State is required.', 'error'); return false; }
        if (!permAddress.district) { addToast('Permanent Address: District is required.', 'error'); return false; }
        if (!permAddress.city) { addToast('Permanent Address: City is required.', 'error'); return false; }
        if (!permAddress.pinCode?.trim()) { addToast('Permanent Address: Pin Code is required.', 'error'); return false; }

        return true;
    };

    const handleSave = () => {
        if (validateForm()) {
            if (!employee && users.some(u => u.employeeId === formData.employeeId && u.companyId === formData.companyId)) {
                addToast('An employee with this Employee ID already exists for this company.', 'error');
                return;
            }
            onSave(formData as User, true);
        }
    };
    
    const selectedDesignation = useMemo(() => designations.find(d => d.id === formData.designationId), [formData.designationId, designations]);
    const isAdvisorRole = selectedDesignation?.isAdvisor === true;
    // NEW: Check if the current user is an admin
    const isAdmin = useMemo(() => designations.find(d => d.id === currentUser?.designationId)?.name === 'Admin', [currentUser, designations]);

    // MODIFIED: TABS_CONFIG is now a memoized variable that conditionally includes the Permissions tab
    const TABS_CONFIG = useMemo(() => {
        const tabs = [
            { name: EmployeeModalTab.GeneralInfo, icon: <UserIcon size={16}/> },
            { name: EmployeeModalTab.Address, icon: <MapPin size={16}/> },
            { name: EmployeeModalTab.Education, icon: <BookOpen size={16}/> },
            { name: EmployeeModalTab.Documents, icon: <FileTextIcon size={16}/> },
        ];
        
        // NEW: Conditionally add the Permissions tab only for Admins
        if (isAdmin) {
            tabs.push({ name: EmployeeModalTab.Permissions, icon: <Lock size={16}/> });
        }

        return tabs;
    }, [isAdvisorRole, isAdmin]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white">{employee ? 'Edit Employee Details' : 'Create New Employee'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col items-center">
                        <div className="relative">
                            {formData.profile?.photoUrl ? (
                                <img src={formData.profile.photoUrl} alt="Employee" className="h-32 w-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 text-5xl">
                                    {formData.initials || '?'}
                                </div>
                            )}
                             <label htmlFor="employee-photo-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-600 rounded-full p-2 cursor-pointer shadow-md hover:bg-gray-100 dark:hover:bg-gray-500 border dark:border-gray-500">
                                <Edit size={16} className="text-gray-600 dark:text-gray-200" />
                                <input
                                    type="file"
                                    id="employee-photo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </label>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</p>
                            {employee ? (
                                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 rounded-md px-4 py-2">
                                    {formData.employeeId}
                                </p>
                            ) : (
                                <Input
                                    value={formData.employeeId || ''}
                                    onChange={(e) => handleChange('employeeId', e.target.value)}
                                    className="text-center text-lg font-semibold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 rounded-md px-4 py-2 border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <Input label="Employee Name *" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} autoComplete="off" />
                        <Input label="Email *" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} autoComplete="off" />
                        <Input label="PAN No." value={formData.profile?.panNo || ''} onChange={(e) => handleChange('profile', { ...formData.profile, panNo: e.target.value })} />
                        <Input label="Aadhar No." value={formData.profile?.aadhaarNo || ''} onChange={(e) => handleChange('profile', { ...formData.profile, aadhaarNo: e.target.value })} />
                    </div>
                </div>

                <div className="mt-8">
                     <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-2 -mb-px overflow-x-auto">
                          {TABS_CONFIG.map((tab) => (
                            <button
                              key={tab.name}
                              onClick={() => setActiveTab(tab.name)}
                              className={`inline-flex items-center gap-2 px-3 py-3 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-200 whitespace-nowrap
                                ${
                                  activeTab === tab.name
                                    ? 'border-b-2 border-brand-primary text-brand-primary'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent'
                                }`}
                            >
                              {tab.icon} {tab.name}
                            </button>
                          ))}
                        </nav>
                    </div>
                    <div className="pt-6">
                        {activeTab === EmployeeModalTab.GeneralInfo && <GeneralInfoTab data={formData} onChange={handleChange} onSave={onSave} finrootsBranches={finrootsBranches} addToast={addToast} bankMasters={bankMasters} businessVerticals={businessVerticals} insuranceTypes={insuranceTypes} amcs={amcs} designations={designations} permissions={{}} genders={genders} />}
                        {activeTab === EmployeeModalTab.Address && <AddressTab data={formData} onChange={handleChange} geographies={geographies} onUpdateGeographies={onUpdateGeographies} addToast={addToast} />}
                        {activeTab === EmployeeModalTab.Education && <EducationTab data={formData} onChange={handleChange} />}
                        {/* --- MODIFICATION START --- */}
                        {activeTab === EmployeeModalTab.Documents && <EmployeeDocumentsTab data={formData} onChange={handleChange} addToast={addToast} documentMasters={documentMasters} />}
                        {/* --- MODIFICATION END --- */}
                        {/* NEW: Render the PermissionsTab */}
                        {activeTab === EmployeeModalTab.Permissions && isAdmin && formData.profile && (
                            <PermissionsTab
                                profile={formData.profile}
                                designationId={formData.designationId || ''}
                                onProfileChange={(newProfile) => handleChange('profile', newProfile)}
                                designationPermissions={designationPermissions}
                                designations={designations}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 flex justify-end p-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                <Button onClick={onClose} variant="secondary">Cancel</Button>
                <Button onClick={handleSave} variant="primary">{employee ? 'Save Changes' : 'Create Employee'}</Button>
            </div>
        </Modal>
    );
};