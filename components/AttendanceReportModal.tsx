import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { User, Designation, Role, AttendanceState, AttendanceRecord } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import Button from './ui/Button.tsx';

export const AttendanceReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    attendance: AttendanceState;
    users: User[];
    designations: Designation[];
    roles: Role[]; // NEW PROP
}> = ({ isOpen, onClose, attendance, users, designations, roles }) => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const modalRef = useRef<HTMLDivElement>(null);

    const [startDate, setStartDate] = useState(last7Days.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedAdvisor, setSelectedAdvisor] = useState('all');

    // --- MODIFICATION BEGINS ---
    // MODIFIED: Logic now based on Role and INCLUDES inactive employees
    const advisors = useMemo(() => {
        const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
        // Filter for active status is removed to include all employees
        return users.filter(u => u.roleId && advisorRoleIds.has(u.roleId));
    }, [users, roles]);
    // --- MODIFICATION ENDS ---

    useEffect(() => {
        if (!isOpen) return;

        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }

            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        firstElement?.focus();

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    const reportData = useMemo(() => {
        // --- MODIFICATION BEGINS ---
        let flattenedData: (AttendanceRecord & { userId: string, userName: string, userStatus: 'Active' | 'Inactive' })[] = [];

        for (const userId in attendance) {
            const user = advisors.find(u => u.id === userId);
            if (user) {
                attendance[userId].forEach(record => {
                    // Also push the user's status to use for the red dot indicator
                    flattenedData.push({ ...record, userId, userName: user.name, userStatus: user.profile?.status || 'Inactive' });
                });
            }
        }
        // --- MODIFICATION ENDS ---

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = flattenedData.filter(record => {
            const recordDate = new Date(record.timestamp);
            const dateMatch = recordDate >= start && recordDate <= end;
            const advisorMatch = selectedAdvisor === 'all' || record.userId === selectedAdvisor;
            return dateMatch && advisorMatch;
        });

        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [attendance, advisors, startDate, endDate, selectedAdvisor]);

    const setDateRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div ref={modalRef}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-brand-dark dark:text-white">Attendance Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review historical attendance records for all employees.</p>
                </div>
                <div className="p-6 border-y dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        {/* --- MODIFICATION BEGINS --- */}
                        <SearchableSelect
                            label="Filter by Employee"
                            options={[{ value: 'all', label: 'All Employees' }, ...advisors.map(a => ({ value: a.id, label: a.profile?.status === 'Inactive' ? `${a.name} 🔴` : a.name }))]}
                            value={selectedAdvisor}
                            onChange={setSelectedAdvisor}
                        />
                        {/* --- MODIFICATION ENDS --- */}
                        <div className="flex items-center gap-2">
                            <Button variant="light" size="small" onClick={() => setDateRange(0)}>Today</Button>
                            <Button variant="light" size="small" onClick={() => setDateRange(7)}>7 Days</Button>
                            <Button variant="light" size="small" onClick={() => setDateRange(30)}>30 Days</Button>
                        </div>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Employee Name</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Reason for Absence</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.map((record, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(record.timestamp).toLocaleDateString()}</td>
                                        {/* --- MODIFICATION BEGINS --- */}
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                {record.userName}
                                                {record.userStatus === 'Inactive' && <span className="w-2 h-2 bg-red-500 rounded-full" title="Inactive Employee"></span>}
                                            </div>
                                        </td>
                                        {/* --- MODIFICATION ENDS --- */}
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record.reason || 'N/A'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{new Date(record.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {reportData.length === 0 && <p className="text-center py-8 text-gray-500">No records found for the selected filters.</p>}
                    </div>
                </div>
                <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};