import React, { useState, useMemo } from 'react';
import { Member, User, Task, AttendanceState, AttendanceRecord, Designation, Role, AppModule, PermissionLevel, Lead } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import { BarChart3, Users as UsersIcon, Briefcase, X, Edit2 } from 'lucide-react';

export const StaffPerformance: React.FC<{
    members: Member[];
    users: User[];
    tasks: Task[];
    attendance: AttendanceState;
    onUpdateAttendance: (userId: string, status: AttendanceRecord['status'], reason?: string) => void;
    allLeads: Lead[];
    currentUser: User | null;
    onOpenAttendanceReport: () => void;
    designations: Designation[];
    roles: Role[];
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ members, users, tasks, attendance, onUpdateAttendance, allLeads, currentUser, onOpenAttendanceReport, designations, roles, permissions }) => {
    const [attendanceMenuFor, setAttendanceMenuFor] = useState<string | null>(null);
    const [editingEmployeeForReason, setEditingEmployeeForReason] = useState<User | null>(null);
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [reasonText, setReasonText] = useState('');

    const designationMap = useMemo(() => new Map(designations.map(d => [d.id, d.name])), [designations]);
    const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);

    const canViewStaffPerformance = useMemo(() => {
        const employeesPermission = permissions?.employees;
        return employeesPermission === 'view' || employeesPermission === 'create' || employeesPermission === 'modify';
    }, [permissions]);
    const isCurrentUserAdvisor = useMemo(() => {
        const userRole = currentUser?.roleId ? roleMap.get(currentUser.roleId) : null;
        return userRole?.isAdvisor === true;
    }, [currentUser, roleMap]);

    const employeeStats = useMemo(() => {
        const employeeData = users.map(user => {
            const assignedCustomers = members.filter(m => m.assignedTo.includes(user.id));
            const assignedLeads = allLeads.filter(l => l.assignedTo === user.id);
            const convertedLeads = assignedCustomers.filter(m => m.leadSource).length;

            return {
                ...user,
                createdCustomers: members.filter(m => m.createdBy === user.id).length,
                pendingTasks: tasks.filter(t => t.primaryContactPerson === user.id && !t.isCompleted).length,
                totalPremium: assignedCustomers.reduce((sum, m) => sum + m.policies.reduce((pSum, p) => pSum + p.premium, 0), 0),
                conversionRate: assignedLeads.length > 0 ? ((convertedLeads / assignedLeads.length) * 100).toFixed(1) : '0.0',
            }
        });

        if (!canViewStaffPerformance && isCurrentUserAdvisor) {
             return employeeData.filter(emp => emp.id === currentUser?.id);
        }
        return employeeData;
    }, [users, members, tasks, allLeads, currentUser, canViewStaffPerformance, isCurrentUserAdvisor]);

    const handleAdminMarkAttendance = (employee: User, status: AttendanceRecord['status']) => {
        if (status === 'Present' || status === 'Work From Home') {
            onUpdateAttendance(employee.id, status, 'Admin Override');
            setAttendanceMenuFor(null);
        } else { // Absent
            setEditingEmployeeForReason(employee);
            const today = new Date().toISOString().split('T')[0];
            const todaysRecord = attendance[employee.id]?.slice().reverse().find(rec => rec.timestamp.startsWith(today));
            setReasonText(todaysRecord?.reason || '');
            setIsReasonModalOpen(true);
            setAttendanceMenuFor(null);
        }
    };

    const handleSaveReason = () => {
        if (editingEmployeeForReason) {
            onUpdateAttendance(editingEmployeeForReason.id, 'Absent', reasonText);
            setIsReasonModalOpen(false);
            setEditingEmployeeForReason(null);
            setReasonText('');
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const todaysRecordForModal = editingEmployeeForReason ? attendance[editingEmployeeForReason.id]?.slice().reverse().find(rec => rec.timestamp.startsWith(today)) : null;

    return (
         <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Staff Performance & Attendance</h3>
                 {canViewStaffPerformance && (
                      <Button onClick={onOpenAttendanceReport} variant="secondary" size="small">
                          <BarChart3 size={14} /> View Attendance Report
                      </Button>
                  )}
              </div>
              <div className="overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Employee</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Attendance</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Premium (Ann.)</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Conversion</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Pending Tasks</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {employeeStats.map(emp => {
                            const todaysRecord = attendance[emp.id]?.slice().reverse().find(rec => rec.timestamp.startsWith(today));
                            const userRole = emp.roleId ? roleMap.get(emp.roleId) : null;
                            const isEmpAdvisor = userRole?.isAdvisor === true;

                            return (
                            <tr key={emp.id}>
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                        {emp.name}
                                        {emp.profile?.status === 'Inactive' && <span className="w-2 h-2 bg-red-500 rounded-full" title="Inactive Employee"></span>}
                                    </div>
                                    <p className="text-xs text-gray-500">{designationMap.get(emp.designationId) || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-2 relative">
                                     {attendanceMenuFor === emp.id ? (
                                        <div className="absolute z-10 top-0 left-0 bg-white dark:bg-gray-900 shadow-lg rounded-lg p-2 flex items-center gap-2 border dark:border-gray-600">
                                            <Button size="small" variant="light" className="!p-2" onClick={() => handleAdminMarkAttendance(emp, 'Present')} title="Present"><UsersIcon size={18}/></Button>
                                            <Button size="small" variant="light" className="!p-2" onClick={() => handleAdminMarkAttendance(emp, 'Work From Home')} title="Work From Home"><Briefcase size={18}/></Button>
                                            <Button size="small" variant="light" className="!p-2" onClick={() => handleAdminMarkAttendance(emp, 'Absent')} title="Absent"><X size={18}/></Button>
                                            <div className="border-l h-6 mx-1 dark:border-gray-600"></div>
                                            <Button size="small" variant="light" className="!p-2" onClick={() => setAttendanceMenuFor(null)} title="Cancel"><X size={18} className="text-red-500"/></Button>
                                        </div>
                                    ) : todaysRecord ? (
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-2">
                                                {todaysRecord.status === 'Present' && <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2"><UsersIcon size={14}/> Present</span>}
                                                {todaysRecord.status === 'Work From Home' && <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2"><Briefcase size={14}/> WFH</span>}
                                                {todaysRecord.status === 'Absent' && <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2"><X size={14}/> Absent</span>}

                                                {canViewStaffPerformance && <Button size="small" variant="light" className="!p-1" onClick={() => setAttendanceMenuFor(emp.id)}><Edit2 size={12}/></Button>}
                                            </div>
                                            {todaysRecord.reason && todaysRecord.status === 'Absent' && (
                                                <p className="text-xs text-gray-400 truncate max-w-[150px]" title={todaysRecord.reason}>{todaysRecord.reason}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <button onClick={() => canViewStaffPerformance && setAttendanceMenuFor(emp.id)} className="text-gray-500 italic hover:text-gray-700 dark:hover:text-gray-300 disabled:cursor-not-allowed" disabled={!canViewStaffPerformance}>
                                            Not Marked
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{isEmpAdvisor ? `₹${emp.totalPremium.toLocaleString('en-IN')}` : 'N/A'}</td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{isEmpAdvisor ? `${emp.conversionRate}%` : 'N/A'}</td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{emp.pendingTasks}</td>
                            </tr>
                            )
                        })}
                    </tbody>
                </table>
              </div>

              <Modal isOpen={isReasonModalOpen} onClose={() => {
                setIsReasonModalOpen(false);
                setEditingEmployeeForReason(null);
                setReasonText('');
              }}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reason for Absence</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For {editingEmployeeForReason?.name}</p>
                </div>
                <div className="p-6">
                    <Input
                        label="Reason"
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        placeholder="Enter reason..."
                        autoFocus
                    />
                </div>
                <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={() => {
                        setIsReasonModalOpen(false);
                        setEditingEmployeeForReason(null);
                        setReasonText('');
                    }}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveReason}>Save</Button>
                </div>
              </Modal>
        </div>
    );
};
