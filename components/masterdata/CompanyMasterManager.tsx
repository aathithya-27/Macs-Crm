import React, { useState, useMemo, useEffect } from 'react';

import { Company, Branch, Geography, User } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import SearchableSelect from '../ui/SearchableSelect';
import { Save, Upload, X, Eye, ZoomIn, ZoomOut } from 'lucide-react';

interface CompanyMasterManagerProps {
    operatingCompanies: Company[];
    onUpdateOperatingCompanies: (data: Company) => void;
    currentUser: User | null;
    geographies: Geography[];
    canModify: boolean;
}

const CompanyMasterManager: React.FC<CompanyMasterManagerProps> = ({ operatingCompanies, onUpdateOperatingCompanies, currentUser, geographies, canModify }) => {
    const [companyData, setCompanyData] = useState<Company | null>(null);
    const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    useEffect(() => {
        const company = operatingCompanies.find(c => c.id === currentUser?.comp_id) || null;
        setCompanyData(company);
        if (company?.address) {
            const country = geographies.find(g => g.name === (company.address?.country || 'India') && g.type === 'Country');
            setSelectedCountry(country?.id || null);
            if (country) {
                const state = geographies.find(g => g.name === company.address?.state && g.type === 'State' && g.parentId === country.id);
                setSelectedState(state?.id || null);
                if(state) {
                    const district = geographies.find(g => g.name === company.address?.district && g.type === 'District' && g.parentId === state.id);
                    setSelectedDistrict(district?.id || null);
                    if(district) {
                        const city = geographies.find(g => g.name === company.address?.city && g.type === 'City' && g.parentId === district.id);
                        setSelectedCity(city?.id || null);
                    } else {
                        setSelectedCity(null);
                    }
                } else {
                    setSelectedDistrict(null);
                    setSelectedCity(null);
                }
            } else {
                setSelectedState(null);
                setSelectedDistrict(null);
                setSelectedCity(null);
            }
        }
    }, [operatingCompanies, currentUser, geographies]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setCompanyData(prev => prev ? { ...prev, [name]: val } : null);
    };

    const handleAddressChange = (name: string, value: string | null) => {
        setCompanyData(prev => {
            if (!prev) return null;
            const newAddress = { ...prev.address, [name]: value };
            if (name === 'country') {
                newAddress.state = '';
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            if (name === 'state') {
                newAddress.district = '';
                newAddress.city = '';
                newAddress.area = '';
            }
            return { ...prev, address: newAddress };
        });
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCompanyData(prev => prev ? { ...prev, contact: { ...prev.contact, [name]: value } } : null);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setCompanyData(prev => prev ? { ...prev, logoUrl: reader.result as string } : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setCompanyData(prev => prev ? { ...prev, logoUrl: undefined } : null);
    };

    const handleSave = () => {
        if (companyData) {
            onUpdateOperatingCompanies(companyData);
        }
    };

    const countryOptions = useMemo(() => geographies.filter(g => g.type === 'Country' && g.active).map(g => ({ value: g.id, label: g.name })), [geographies]);
    const stateOptions = useMemo(() => !selectedCountry ? [] : geographies.filter(g => g.type === 'State' && g.parentId === selectedCountry && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, selectedCountry]);
    const districtOptions = useMemo(() => !selectedState ? [] : geographies.filter(g => g.type === 'District' && g.parentId === selectedState && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, selectedState]);
    const cityOptions = useMemo(() => !selectedDistrict ? [] : geographies.filter(g => g.type === 'City' && g.parentId === selectedDistrict && g.active).map(g => ({ value: g.id, label: g.name })), [geographies, selectedDistrict]);

    if (!companyData) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Company Master</h3>
                <div className="p-8 text-center text-gray-500 border-2 border-dashed dark:border-gray-600 rounded-lg mt-4">
                    <p>No company data found for the current user.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Company Master</h3>
                {canModify && <Button onClick={handleSave} variant="primary"><Save size={16}/> Save Company Details</Button>}
            </div>
            <fieldset disabled={!canModify}>
                <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Company Info</h4>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                            <div className="flex items-center gap-4">
                                {companyData.logoUrl ? (
                                    <div className="relative group">
                                        <img 
                                            src={companyData.logoUrl} 
                                            alt="Company Logo" 
                                            className="w-20 h-20 object-contain border rounded cursor-pointer hover:opacity-80" 
                                            onClick={() => setIsLogoModalOpen(true)}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer" onClick={() => setIsLogoModalOpen(true)}>
                                            <Eye size={16} className="text-white" />
                                        </div>
                                        <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                                        <Upload size={24} className="text-gray-400" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                                    <label htmlFor="logo-upload" className="cursor-pointer bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm">
                                        {companyData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Company Code" name="comp_code" value={companyData.comp_code || ''} onChange={handleInputChange} disabled/>
                            <Input label="Company Name" name="name" value={companyData.name} onChange={handleInputChange} />
                            <Input label="Registered Name" name="mailingName" value={companyData.mailingName || ''} onChange={handleInputChange} />
                            <Input label="Date of Creation" name="dateOfCreation" type="date" value={companyData.dateOfCreation || ''} onChange={handleInputChange} />
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <ToggleSwitch enabled={companyData.active || false} onChange={() => setCompanyData(prev => prev ? ({...prev, active: !prev.active}) : null)} />
                                <span>{companyData.active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Address & Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Line 1" value={companyData.address?.line1 || ''} onChange={e => handleAddressChange('line1', e.target.value)} />
                            <Input label="Line 2" value={companyData.address?.line2 || ''} onChange={e => handleAddressChange('line2', e.target.value)} />
                            <Input label="Line 3" value={companyData.address?.line3 || ''} onChange={e => handleAddressChange('line3', e.target.value)} />

                            <SearchableSelect label="Country" options={countryOptions} value={selectedCountry} onChange={val => { setSelectedCountry(val); setSelectedState(null); setSelectedDistrict(null); setSelectedCity(null); handleAddressChange('country', val ? geographies.find(g => g.id === val)?.name || 'India' : 'India'); }} />
                            <SearchableSelect label="State" options={stateOptions} value={selectedState} onChange={val => { setSelectedState(val); setSelectedDistrict(null); setSelectedCity(null); handleAddressChange('state', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!selectedCountry} />
                            <SearchableSelect label="District" options={districtOptions} value={selectedDistrict} onChange={val => { setSelectedDistrict(val); setSelectedCity(null); handleAddressChange('district', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!selectedState} />
                            <SearchableSelect label="City" options={cityOptions} value={selectedCity} onChange={val => { setSelectedCity(val); handleAddressChange('city', val ? geographies.find(g => g.id === val)?.name || null : null); }} disabled={!selectedDistrict} />

                            <Input label="Area" value={companyData.address?.area || ''} onChange={e => handleAddressChange('area', e.target.value)} />
                            <Input label="Pin Code" value={companyData.address?.pinCode || ''} onChange={e => handleAddressChange('pinCode', e.target.value)} />

                            <Input label="Phone No." name="phoneNo" value={companyData.contact?.phoneNo || ''} onChange={handleContactChange} />
                            <Input label="Email ID" name="emailId" type="email" value={companyData.contact?.emailId || ''} onChange={handleContactChange} />

                            <Input label="FAX No." name="faxNo" value={companyData.contact?.faxNo || ''} onChange={handleContactChange} />
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Tax Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="GSTIN" name="gstin" value={companyData.gstin || ''} onChange={handleInputChange} />
                            <Input label="PAN" name="pan" value={companyData.pan || ''} onChange={handleInputChange} />
                            <Input label="TAN" name="tan" value={companyData.tan || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </fieldset>
            
            {/* Logo View Modal */}
            {isLogoModalOpen && companyData.logoUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => { setIsLogoModalOpen(false); setZoomLevel(1); }}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-5xl max-h-[90vh] w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Company Logo</h3>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))} 
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    disabled={zoomLevel <= 0.5}
                                >
                                    <ZoomOut size={20} />
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
                                <button 
                                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))} 
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    disabled={zoomLevel >= 3}
                                >
                                    <ZoomIn size={20} />
                                </button>
                                <button onClick={() => { setIsLogoModalOpen(false); setZoomLevel(1); }} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center">
                            <img 
                                src={companyData.logoUrl} 
                                alt="Company Logo" 
                                className="max-w-full max-h-full object-contain transition-transform duration-200" 
                                style={{ transform: `scale(${zoomLevel})` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyMasterManager;