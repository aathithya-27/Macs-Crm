import React, { useState, useEffect, useCallback } from 'react';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import { X, KeyRound, Mail, Loader2, CheckCircle, AtSign, Building } from 'lucide-react';
import { User, Company } from '../types.ts';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onResetPassword: (company: string, employeeId: string, newPassword: string) => Promise<boolean>;
    addToast: (message: string, type?: 'success' | 'error') => void;
    operatingCompanies: Company[];
    initialCompany: string;     // Passed from Login
    initialEmployeeId: string;  // Passed from Login
}

type Step = 'enter_id' | 'enter_otp_password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
    isOpen, 
    onClose, 
    users, 
    onResetPassword, 
    addToast, 
    operatingCompanies,
    initialCompany,
    initialEmployeeId
}) => {
    const [step, setStep] = useState<Step>('enter_id');
    const [companyEmail, setCompanyEmail] = useState('');
    const [userDisplayName, setUserDisplayName] = useState('');
    
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Logic to set up the view based on passed props
    useEffect(() => {
        if (isOpen) {
            // 1. Find the User to format "1002 - Rohan Patel"
            const user = users.find(u => u.employeeId.toLowerCase() === initialEmployeeId.toLowerCase() && u.company === initialCompany);
            if (user) {
                setUserDisplayName(`${user.employeeId} - ${user.name}`);
            } else {
                setUserDisplayName(initialEmployeeId); // Fallback if user not found in local list (though login check should catch it)
            }

            // 2. Find the Company Email from Master Data
            const opComp = operatingCompanies.find(c => c.name === initialCompany);
            if (opComp && opComp.contact && opComp.contact.emailId) {
                setCompanyEmail(opComp.contact.emailId);
            } else {
                setCompanyEmail(''); // Handle case where company has no email
            }
        }
    }, [isOpen, initialCompany, initialEmployeeId, users, operatingCompanies]);


    const handleSendOtp = () => {
        setError('');
        
        if (!companyEmail) {
            setError('No registered email found for the selected company. Please contact support.');
            return;
        }

        // Mask the company email
        const maskedEmail = companyEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
        addToast(`Simulated OTP (123456) sent to Company Email: ${maskedEmail}`, 'success');
        setStep('enter_otp_password');
    };

    const handleReset = async () => {
        setError('');
        if (!otp || !newPassword || !confirmPassword) {
            setError('All fields are required.');
            return;
        }
        if (otp !== '123456') {
            setError('Invalid OTP.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setIsLoading(true);
        // We use initialCompany and initialEmployeeId for the actual reset action
        const success = await onResetPassword(initialCompany, initialEmployeeId, newPassword);
        setIsLoading(false);

        if (success) {
            setStep('success');
        } else {
            setError('Failed to reset password. Please try again.');
        }
    };

    const handleClose = useCallback(() => {
        setStep('enter_id');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setIsLoading(false);
        onClose();
    }, [onClose]);
    
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(handleClose, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, handleClose]);

    const renderStepContent = () => {
        switch (step) {
            case 'enter_id':
                return (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                           Please verify your details. An OTP will be sent to the registered <strong>Company Email ID</strong>.
                        </p>
                        
                        {/* Company Name Display (Read Only) */}
                        <div className="relative mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                            <Building className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={initialCompany}
                                readOnly
                                disabled
                                className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                            />
                        </div>

                        {/* Username Display 1002 - Name (Read Only) */}
                        <div className="relative mb-4">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID/Username</label>
                             <input
                                type="text"
                                value={userDisplayName}
                                readOnly
                                disabled
                                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                            />
                        </div>

                        {/* Company Email Display (Read Only) */}
                        <div className="relative mt-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email ID</label>
                            <AtSign className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={companyEmail}
                                readOnly
                                disabled
                                placeholder="Email will appear here"
                                className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <Button onClick={handleSendOtp} variant="primary" className="w-full mt-4" disabled={!companyEmail}>
                            <Mail size={16} /> Send OTP to Company Email
                        </Button>
                    </>
                );
            case 'enter_otp_password':
                return (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            An OTP has been sent to <strong>{companyEmail}</strong>. Please enter it below along with your new password. (Hint: use 123456)
                        </p>
                         <Input
                            label="One-Time Password (OTP)"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button onClick={handleReset} variant="primary" className="w-full mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <KeyRound size={16} />}
                            Reset Password
                        </Button>
                    </>
                );
            case 'success':
                return (
                    <div className="text-center py-8">
                        <CheckCircle size={48} className="mx-auto text-green-500" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">Password Reset Successfully!</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">You can now log in with your new password.</p>
                        <Button onClick={handleClose} variant="primary" className="mt-6">
                            Back to Login
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
                        <KeyRound />
                        Forgot Password
                    </h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center" role="alert">
                        {error}
                    </div>
                )}
                {renderStepContent()}
            </div>
        </Modal>
    );
};