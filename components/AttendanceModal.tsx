import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { Check, X, Briefcase, LucideIcon } from 'lucide-react';
import { AttendanceRecord } from '../types.ts';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAttendance: (status: AttendanceRecord['status'], reason?: string) => void;
  advisorName: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onMarkAttendance, advisorName }) => {
    const [selectedStatus, setSelectedStatus] = useState<AttendanceRecord['status'] | null>(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        // Reset state when modal is opened
        if (isOpen) {
            setSelectedStatus(null);
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!selectedStatus) {
            alert('Please select an attendance status.');
            return;
        }

        if (selectedStatus === 'Absent' && !reason.trim()) {
            alert('A reason is required for absence.');
            return;
        }
        onMarkAttendance(selectedStatus, reason);
    };

    const requiresReason = selectedStatus === 'Absent';

    const options: { status: AttendanceRecord['status']; label: string; IconComponent: LucideIcon; }[] = [
        { status: 'Present', label: 'Present', IconComponent: Check },
        { status: 'Work From Home', label: 'Work From Home', IconComponent: Briefcase },
        { status: 'Absent', label: 'Absent', IconComponent: X },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white">Mark Today's Attendance</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome, {advisorName}. Please mark your status for today.</p>
            </div>

            <div className="p-6 flex-grow space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {options.map(({ status, label, IconComponent }) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 transition-all duration-200
                                ${selectedStatus === status 
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 shadow-lg' 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
                                }`
                            }
                        >
                            <IconComponent 
                                className={`h-8 w-8 ${selectedStatus === status ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`} 
                            />
                            <span className={`font-semibold text-base text-center ${selectedStatus === status ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                {label}
                            </span>
                        </button>
                    ))}
                </div>

                {requiresReason && (
                    <div className="animate-fade-in space-y-2">
                        <label htmlFor="attendance-reason" className="font-semibold text-gray-800 dark:text-white">Reason for Absence</label>
                        <textarea
                            id="attendance-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                            placeholder={"e.g., Sick leave, personal emergency..."}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button 
                    variant="primary" 
                    onClick={handleSubmit} 
                    disabled={!selectedStatus || (requiresReason && !reason.trim())}
                >
                    Submit Attendance
                </Button>
            </div>
        </Modal>
    );
};