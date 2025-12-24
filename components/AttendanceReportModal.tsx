import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Designation, Role, AttendanceState, AttendanceRecord } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import SearchableSelect from './ui/SearchableSelect.tsx';
import Button from './ui/Button.tsx';
import { X, Filter } from 'lucide-react';

export const AttendanceReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    attendance: AttendanceState;
    users: User[];
    designations: Designation[];
    roles: Role[];
}> = ({ isOpen, onClose, attendance, users, designations, roles }) => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const modalRef = useRef<HTMLDivElement>(null);

    const [startDate, setStartDate] = useState(last7Days.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<'All' | 'Advisor' | 'Non-Advisor'>('All');

    const filteredUsers = useMemo(() => {
        if (selectedRoleFilter === 'All') return users;
        return users.filter(u => {
            const role = roles.find(r => r.id === u.roleId);
            if (selectedRoleFilter === 'Advisor') return role?.isAdvisor;
            if (selectedRoleFilter === 'Non-Advisor') return !role?.isAdvisor;
            return true;
        });
    }, [users, roles, selectedRoleFilter]);

    useEffect(() => {
        if (selectedEmployee !== 'all' && !filteredUsers.find(u => u.id === selectedEmployee)) {
            setSelectedEmployee('all');
        }
    }, [selectedRoleFilter, filteredUsers]);

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
            if (event.key === 'Escape') onClose();
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
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const reportData = useMemo(() => {
        let flattenedData: (AttendanceRecord & { userId: string, userName: string, userRole: string, userStatus: 'Active' | 'Inactive' })[] = [];

        filteredUsers.forEach(user => {
            const records = attendance[user.id] || [];
            const roleName = roles.find(r => r.id === user.roleId)?.name || 'Unknown';
            records.forEach(record => {
                flattenedData.push({ 
                    ...record, 
                    userId: user.id, 
                    userName: user.name, 
                    userRole: roleName,
                    userStatus: user.profile?.status || 'Inactive' 
                });
            });
        });

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = flattenedData.filter(record => {
            const recordDate = new Date(record.timestamp);
            const dateMatch = recordDate >= start && recordDate <= end;
            const employeeMatch = selectedEmployee === 'all' || record.userId === selectedEmployee;
            return dateMatch && employeeMatch;
        });

        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [attendance, filteredUsers, startDate, endDate, selectedEmployee, roles]);

    const setDateRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div ref={modalRef} className="flex flex-col h-[85vh]">
                {}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-white dark:bg-gray-800 rounded-t-lg shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Filter size={20}/></span>
                            Attendance Report
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review historical attendance records.</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        {}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Role Type</label>
                            <select 
                                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedRoleFilter}
                                onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
                            >
                                <option value="All">All Roles</option>
                                <option value="Advisor">Advisors Only</option>
                                <option value="Non-Advisor">Employees (Non-Advisors)</option>
                            </select>
                        </div>

                        {}
                        <div className="lg:col-span-2">
                            <SearchableSelect
                                label="Employee Name"
                                options={[{ value: 'all', label: 'All Selected Users' }, ...filteredUsers.map(u => ({ value: u.id, label: u.name }))]}
                                value={selectedEmployee}
                                onChange={setSelectedEmployee}
                                placeholder="Select employee..."
                            />
                        </div>

                        {}
                        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    
                    {}
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => setDateRange(0)} className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">Today</button>
                        <button onClick={() => setDateRange(7)} className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">Last 7 Days</button>
                        <button onClick={() => setDateRange(30)} className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">Last 30 Days</button>
                    </div>
                </div>

                {}
                <div className="flex-1 overflow-auto p-0 bg-white dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/30 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Employee</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Role</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Reason</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {reportData.map((record, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                        {new Date(record.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            {record.userName}
                                            {record.userStatus === 'Inactive' && <span className="w-2 h-2 bg-red-500 rounded-full" title="Inactive"></span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                        {record.userRole}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                            record.status === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                            record.status === 'Absent' ? 'bg-red-100 text-red-700 border border-red-200' : 
                                            'bg-blue-100 text-blue-700 border border-blue-200'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 italic max-w-xs truncate" title={record.reason}>
                                        {record.reason || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-xs">
                                        {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        No attendance records found for these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center text-xs text-gray-500">
                    <span>Showing {reportData.length} records</span>
                </div>
            </div>
        </Modal>
    );
};