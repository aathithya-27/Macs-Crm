import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Member, UploadedDocument, BankDetails, BankMaster, Policy, DocumentMaster, InsuranceTypeMaster, AppModule, PermissionLevel, AccountType, InsuranceTypeDocumentRule } from '../../types.ts';
import Input from '../ui/Input.tsx';
import { extractDataFromImage } from '../../services/geminiService.ts';
import { ImageIcon, Loader2, FileText, Download, FileText as FileTextIcon, Send, CheckCircle, Clock, Banknote, ClipboardList, Check, Plus, Trash2, Save, X, UploadCloud, Eye, ZoomIn, Image, FileType, Sheet, Video, Music, File } from 'lucide-react';
import Button from '../ui/Button.tsx';

interface DocumentsTabProps {
  data: Partial<Member>;
  allMembers: Member[];
  onChange: (field: keyof Member, value: any) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  errors: Partial<Record<keyof Member | 'bankDetailsError', string>>;
  bankMasters: BankMaster[];
  accountTypes: AccountType[];
  documentMasters: DocumentMaster[];
  onAddDocumentMaster: (name: string) => void;
  insuranceTypes: InsuranceTypeMaster[];
  insuranceTypeDocumentRules: InsuranceTypeDocumentRule[];
  permissions: { [key in AppModule]?: PermissionLevel };
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
    data, 
    allMembers, 
    onChange, 
    addToast, 
    errors, 
    bankMasters, 
    accountTypes,
    documentMasters,
    onAddDocumentMaster,
    insuranceTypes,
    insuranceTypeDocumentRules,
}) => {
  const [loadingOcr, setLoadingOcr] = useState<'pan' | 'aadhaar' | null>(null);


  const handleOcrFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, field: 'panCard' | 'aadhaar') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ocrType = field === 'panCard' ? 'pan' : 'aadhaar';
    const documentType = field === 'panCard' ? 'PAN Card' : 'Aadhaar Card';
    setLoadingOcr(ocrType);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const extractedData = await extractDataFromImage(base64String, file.type, addToast);
        
        if (extractedData) {
            if (field === 'panCard' && extractedData.idNumber) onChange('panCard', extractedData.idNumber);
            if (field === 'aadhaar' && extractedData.idNumber) onChange('aadhaar', extractedData.idNumber);
            if (extractedData.name && !data.name) onChange('name', extractedData.name);
            if (extractedData.dob && !data.dob) onChange('dob', extractedData.dob);
            if (extractedData.address && !data.address) onChange('address', extractedData.address);
            if (extractedData.phoneNumber && !data.mobile) onChange('mobile', extractedData.phoneNumber);
            addToast(`Extracted data from ${documentType}`, 'success');
        } else {
             addToast(`Could not extract data from ${documentType}. Please enter manually.`, 'error');
        }
        
        const objectUrl = URL.createObjectURL(file);
        const newDoc: UploadedDocument = {
            id: `doc-${Date.now()}`,
            documentType,
            fileName: file.name,
            fileUrl: objectUrl,
            mimeType: file.type,
            status: 'Uploaded',
        };
        onChange('documents', (prevDocs: UploadedDocument[] | undefined) => [...(prevDocs || []), newDoc]);

      } catch (error) {
        console.error("OCR failed", error);
        addToast(`Failed to extract text from ${field}. Please enter manually.`, 'error');
      } finally {
        setLoadingOcr(null);
      }
    };
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      setLoadingOcr(null);
    };
  }, [onChange, data.name, data.dob, data.address, data.mobile, addToast]);
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (file && documentType) {
      const objectUrl = URL.createObjectURL(file);
      
      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}`,
        documentType,
        fileName: file.name,
        fileUrl: objectUrl,
        mimeType: file.type,
        status: 'Uploaded',
      };

      onChange('documents', (prevDocs: UploadedDocument[] | undefined) => [...(prevDocs || []), newDoc]);
      
      if(documentType === 'Photo') onChange('photoUrl', objectUrl);
      
      addToast(`'${file.name}' uploaded for ${documentType}.`, 'success');
      event.target.value = ''; // Reset file input
    }
  }, [onChange, addToast]);

    // --- MODIFICATION START: Logic now groups strictly by the policy's specific insurance type ---
    const groupedDocumentRequirements = useMemo(() => {
        const activePolicies = (data.policies || []).filter(p => p.status === 'Active');
        if (activePolicies.length === 0) return {};

        const insuranceTypeMap = new Map(insuranceTypes.map(it => [it.id, it]));
        const requirements: Record<string, { docId: string; name: string; isMandatory: boolean; }[]> = {};
        
        // Get unique insurance type IDs from active policies
        const uniqueTypeIds = [...new Set(activePolicies.map(p => p.insuranceTypeId).filter(Boolean))];

        uniqueTypeIds.forEach(typeId => {
            const typeInfo = insuranceTypeMap.get(typeId as string);
            if (!typeInfo) return;

            const groupName = typeInfo.name;
            if (!requirements[groupName]) {
                requirements[groupName] = [];
            }

            // Get rules ONLY for this specific type
            const rulesForThisType = insuranceTypeDocumentRules.filter(rule => rule.insuranceTypeId === typeId);

            rulesForThisType.forEach(rule => {
                const docMaster = documentMasters.find(dm => dm.id === rule.documentId);
                if (docMaster) {
                    requirements[groupName].push({
                        docId: docMaster.id,
                        name: docMaster.name,
                        isMandatory: rule.isMandatory,
                    });
                }
            });
        });
        
        // Sort docs within each group
        Object.values(requirements).forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));
        
        return requirements;
    }, [data.policies, insuranceTypes, insuranceTypeDocumentRules, documentMasters]);
    // --- MODIFICATION END ---


    const handleBankDetailsChange = useCallback((field: keyof BankDetails, value: string) => {
        const newBankDetails = {
            ...(data.bankDetails || {}),
            [field]: value,
        };
        onChange('bankDetails', newBankDetails);
    }, [data.bankDetails, onChange]);

    const handleRemoveDocument = (docType: string) => {
        const updatedDocs = (data.documents || []).filter(doc => doc.documentType !== docType);
        onChange('documents', updatedDocs);
        addToast(`Document for ${docType} removed.`, 'success');
    }

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image size={24} className="text-blue-500" />;
        if (mimeType === 'application/pdf') return <FileType size={24} className="text-red-500" />;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <Sheet size={24} className="text-green-500" />;
        if (mimeType.startsWith('video/')) return <Video size={24} className="text-purple-500" />;
        if (mimeType.startsWith('audio/')) return <Music size={24} className="text-orange-500" />;
        if (mimeType.includes('word') || mimeType.includes('document')) return <FileTextIcon size={24} className="text-blue-600" />;
        return <File size={24} className="text-gray-500" />;
    };

    const isImageFile = (mimeType: string) => {
        return mimeType.startsWith('image/');
    };

    const handlePreviewClick = (fileUrl: string, fileName: string, mimeType: string) => {
        window.open(fileUrl, '_blank');
    };

  const fileInputClasses = "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700 cursor-pointer dark:text-gray-400";
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="PAN Card *" id="panCard" value={data.panCard || ''} onChange={(e) => onChange('panCard', e.target.value)} />
        <Input label="Aadhaar *" id="aadhaar" value={data.aadhaar || ''} onChange={(e) => onChange('aadhaar', e.target.value)} />
        
        <div>
          <label htmlFor="panUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan PAN Card (via OCR)</label>
          <div className="flex items-center gap-2">
            <input type="file" id="panUpload" accept="image/*,application/pdf" className={fileInputClasses} onChange={(e) => handleOcrFileChange(e, 'panCard')} disabled={loadingOcr === 'pan'}/>
            {loadingOcr === 'pan' && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
        </div>

        <div>
          <label htmlFor="aadhaarUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan Aadhaar (via OCR)</label>
          <div className="flex items-center gap-2">
            <input type="file" id="aadhaarUpload" accept="image/*,application/pdf" className={fileInputClasses} onChange={(e) => handleOcrFileChange(e, 'aadhaar')} disabled={loadingOcr === 'aadhaar'} />
            {loadingOcr === 'aadhaar' && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                    {data.photoUrl ? (
                        <img src={data.photoUrl} alt="Photo preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
                    ) : (
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label htmlFor="photoUpload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-brand-primary hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary">
                            <span>Upload a file</span>
                            <input id="photoUpload" name="photoUpload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'Photo')} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
      </div>
       
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">Policy Document Requirements</h3>
        {Object.keys(groupedDocumentRequirements).length > 0 ? (
            Object.entries(groupedDocumentRequirements).map(([groupName, requirements]) => (
                <div key={groupName}>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{groupName} Requirements</h4>
                    {requirements.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No required documents for this insurance type.</p>
                    ) : (
                        <div className="space-y-3">
                            {requirements.map(req => {
                            const uploadedFile = (data.documents || []).find(d => d.documentType === req.name);
                            return (
                                <div key={req.docId} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 dark:text-white">
                                            {req.name}
                                            {req.isMandatory && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                        {uploadedFile && (
                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="relative group cursor-pointer" onClick={() => handlePreviewClick(uploadedFile.fileUrl, uploadedFile.fileName, uploadedFile.mimeType)}>
                                                    {isImageFile(uploadedFile.mimeType) ? (
                                                        <>
                                                            <img 
                                                                src={uploadedFile.fileUrl} 
                                                                alt={uploadedFile.fileName}
                                                                className="w-16 h-16 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-md">
                                                                <ZoomIn size={20} className="text-white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-md flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                                                            {getFileIcon(uploadedFile.mimeType)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="truncate block max-w-48">{uploadedFile.fileName}</span>
                                                    <span className="text-xs text-gray-400">{uploadedFile.mimeType}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        {uploadedFile ? (
                                            <>
                                                <button 
                                                    onClick={() => handlePreviewClick(uploadedFile.fileUrl, uploadedFile.fileName, uploadedFile.mimeType)}
                                                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600" 
                                                    title="Preview Document"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <a href={uploadedFile.fileUrl} download={uploadedFile.fileName} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600" title="Download Document">
                                                    <Download size={16} />
                                                </a>
                                                <Button size="small" variant="danger" className="!p-1.5" onClick={() => handleRemoveDocument(req.name)} title="Remove Document">
                                                    <Trash2 size={14}/>
                                                </Button>
                                            </>
                                        ) : (
                                            <label className="relative cursor-pointer">
                                                <Button as="span" variant="light" size="small">
                                                    <UploadCloud size={14}/> Upload
                                                </Button>
                                                <input type="file" className="sr-only" onChange={(e) => handleFileUpload(e, req.name)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    )}
                </div>
            ))
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Add an active policy in the 'Policies' tab to see the required document list.</p>
        )}
      </div>

       <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Banknote /> Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                  <select
                      value={data.bankDetails?.bankName || ''}
                      onChange={e => handleBankDetailsChange('bankName', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                      <option value="">Select a Bank...</option>
                      {bankMasters.filter(b => b.active).map(b => <option key={b.id} value={b.bankName}>{b.bankName}</option>)}
                  </select>
              </div>
              <Input label="Account Number" value={data.bankDetails?.accountNumber || ''} onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)} />
              <Input label="CIF Number" value={data.bankDetails?.cifNumber || ''} onChange={(e) => handleBankDetailsChange('cifNumber', e.target.value)} />
              <Input label="IFSC Code" value={data.bankDetails?.ifscCode || ''} onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)} />
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                   <select
                      value={data.bankDetails?.accountType || ''}
                      onChange={e => handleBankDetailsChange('accountType', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                      <option value="">Select Account Type...</option>
                      {accountTypes.filter(at => at.active).map(at => (
                          <option key={at.id} value={at.name}>{at.name}</option>
                      ))}
                  </select>
              </div>
          </div>
          {errors.bankDetailsError && <p className="text-red-600 text-xs mt-2">{errors.bankDetailsError}</p>}
      </div>


    </div>
  );
};