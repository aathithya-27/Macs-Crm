import React, { useState, useMemo, useEffect } from 'react';
// MODIFIED: Import permission types
import { User, Member, FinRootsBranch, AttendanceState, Designation, AppModule, PermissionLevel } from '../types.ts';
import Button from './ui/Button.tsx';
import { Plus, Search, Edit, Users, Building, Info, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import { ViewByBranchModal } from './ViewByBranchModal.tsx';
import Pagination from './ui/Pagination.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';

type SortKey = 'name' | 'joiningDate' | 'branch' | 'attendance';
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };

const ITEMS_PER_PAGE = 10;

// --- New Modal for Editing Leave Reason ---
const EditLeaveReasonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    employee: User | null; // RENAMED
    initialReason: string;
    onSave: (newReason: string) => void;
}> = ({ isOpen, onClose, employee, initialReason, onSave }) => {
    const [reason, setReason] = React.useState(initialReason);

    React.useEffect(() => {
        if (isOpen) {
            setReason(initialReason);
        }
    }, [isOpen, initialReason]);

    const handleSave = () => {
        onSave(reason);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Leave Reason</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For {employee?.name}</p>
            </div>
            <div className="p-6">
                <Input
                    label="Reason for Absence"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason..."
                />
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Reason</Button>
            </div>
        </Modal>
    );
};


interface EmployeeManagementProps { // RENAMED
  users: User[];
  allMembers: Member[];
  onOpenEmployeeModal: (employee: User | null) => void; // RENAMED
  onToggleStatus: (userId: string) => void;
  attendance: AttendanceState;
  onUpdateAttendance: (userId: string, status: 'Present' | 'Absent', reason?: string) => void;
  finrootsBranches: FinRootsBranch[];
  addToast: (message: string, type?: 'success' | 'error') => void;
  designations: Designation[]; // NEW PROP
  // NEW: Accept permissions prop
  permissions: { [key in AppModule]?: PermissionLevel };
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ users, allMembers, onOpenEmployeeModal, onToggleStatus, attendance, onUpdateAttendance, finrootsBranches, addToast, designations, permissions }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'All Employees' | 'Active' | 'Inactive'>('Active'); // RENAMED
  const [branchFilter, setBranchFilter] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isReasonModalOpen, setIsReasonModalOpen] = React.useState(false);
  const [editingEmployeeForReason, setEditingEmployeeForReason] = React.useState<User | null>(null); // RENAMED

  // NEW: Permission checks for the employees module
  const canCreate = permissions?.employees === 'create' || permissions?.employees === 'modify';
  const canModify = permissions?.employees === 'modify';

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, branchFilter]);
  
  const branchMap = React.useMemo(() => new Map(finrootsBranches.map(b => [b.id, b.branchName])), [finrootsBranches]);
  const designationMap = React.useMemo(() => new Map(designations.map(d => [d.id, d.name])), [designations]);

  const employees = React.useMemo(() => { // RENAMED
    let filteredEmployees = users.filter(user => 
        (user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) || 
         user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (statusFilter !== 'All Employees') {
        filteredEmployees = filteredEmployees.filter(emp => emp.profile?.status === statusFilter);
    }

    if (branchFilter.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => emp.profile?.employeeBranchId && branchFilter.includes(emp.profile.employeeBranchId));
    }
    
    const getTodaysStatus = (userId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const records = attendance[userId];
        if (!records || records.length === 0) return 'Z'; // Not Marked
        const todaysRecord = records.slice().reverse().find(rec => rec.timestamp.startsWith(today));
        return todaysRecord ? todaysRecord.status : 'Z';
    };

    filteredEmployees.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
            case 'joiningDate':
                aValue = new Date(a.profile?.dateOfJoining || 0).getTime();
                bValue = new Date(b.profile?.dateOfJoining || 0).getTime();
                break;
            case 'branch':
                aValue = branchMap.get(a.profile?.employeeBranchId || '') || 'ZZZ'; // Unassigned last
                bValue = branchMap.get(b.profile?.employeeBranchId || '') || 'ZZZ';
                break;
            case 'attendance':
                aValue = getTodaysStatus(a.id);
                bValue = getTodaysStatus(b.id);
                break;
            case 'name':
            default:
                aValue = a.name;
                bValue = b.name;
                break;
        }
        
        if (aValue === bValue) return 0;
        
        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return filteredEmployees;
  }, [users, searchQuery, statusFilter, branchFilter, sortConfig, branchMap, attendance]);
  
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const currentEmployees = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return employees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, employees]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleOpenReasonModal = (employee: User) => {
    setEditingEmployeeForReason(employee);
    setIsReasonModalOpen(true);
  };

  const handleSaveReason = (newReason: string) => {
    if (editingEmployeeForReason) {
        onUpdateAttendance(editingEmployeeForReason.id, 'Absent', newReason);
        addToast(`Leave reason for ${editingEmployeeForReason.name} updated.`, 'success');
    }
  };

  const SortableHeader: React.FC<{ sortKey: SortKey; label: string; className?: string; }> = ({ sortKey, label, className = '' }) => (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
        <button onClick={() => handleSort(sortKey)} className="flex items-center gap-1 group transition-colors hover:text-gray-700 dark:hover:text-gray-100">
            {label}
            <div className="w-4">
                {sortConfig.key === sortKey ? (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                ) : (
                    <ArrowUp size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </button>
    </th>
  );
  
  const today = new Date().toISOString().split('T')[0];
  const todaysRecordForModal = editingEmployeeForReason ? attendance[editingEmployeeForReason.id]?.slice().reverse().find(rec => rec.timestamp.startsWith(today)) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Employee Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create, view, and manage employee profiles.</p>
        </div>
        {/* MODIFIED: Button is now permission-gated */}
        {canCreate && (
            <Button onClick={() => onOpenEmployeeModal(null)} variant="success">
                <Plus size={16} /> Create New Employee
            </Button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Employee ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                 <Button onClick={() => setIsBranchModalOpen(true)} variant="light" className="h-10 justify-center">
                    <Building size={16} /> 
                    Filter by Branch {branchFilter.length > 0 ? `(${branchFilter.length})` : ''}
                </Button>
                 <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee</label>
                    <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-primary bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="All Employees">All Employees</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                    <SortableHeader sortKey="name" label="Employee" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Designation</th>
                    <SortableHeader sortKey="branch" label="Branch" />
                    <SortableHeader sortKey="joiningDate" label="Date of Joining" />
                    <SortableHeader sortKey="attendance" label="Attendance Today" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentEmployees.map((employee, index) => {
                    const today = new Date().toISOString().split('T')[0];
                    const todaysRecord = attendance[employee.id]?.slice().reverse().find(rec => rec.timestamp.startsWith(today));

                    return (
                        <tr key={employee.id} className={`transition-opacity ${employee.profile?.status === 'Active' ? 'opacity-100' : 'opacity-60'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                {employee.profile?.photoUrl ? (
                                    <img className="h-10 w-10 rounded-full object-cover" src={employee.profile.photoUrl} alt={employee.name} />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">
                                        {employee.initials}
                                    </div>
                                )}
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{employee.employeeId}</div>
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {designationMap.get(employee.designationId) || 'N/A'}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                             {branchMap.get(employee.profile?.employeeBranchId || '') || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {employee.profile?.dateOfJoining ? new Date(employee.profile.dateOfJoining).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {todaysRecord ? (
                                todaysRecord.status === 'Present' ? (
                                    <span className="font-semibold text-green-600 dark:text-green-400">Present</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                            Absent {todaysRecord.reason ? `- ${todaysRecord.reason}` : ''}
                                        </span>
                                        <Button size="small" variant="light" className="!p-1" onClick={() => handleOpenReasonModal(employee)} title="Edit Reason" disabled={!canModify}>
                                            <Edit2 size={12}/>
                                        </Button>
                                    </div>
                                )
                            ) : (
                                <div className="flex gap-2">
                                    <Button size="small" variant="success" onClick={() => onUpdateAttendance(employee.id, 'Present')} disabled={!canModify}>P</Button>
                                    <Button size="small" variant="danger" onClick={() => onUpdateAttendance(employee.id, 'Absent', 'Marked by Admin')} disabled={!canModify}>A</Button>
                                </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* MODIFIED: Toggle is disabled if user lacks modify permission */}
                            <ToggleSwitch 
                              enabled={employee.profile?.status === 'Active'}
                              onChange={() => onToggleStatus(employee.id)}
                              srLabel={`Toggle status for ${employee.name}`}
                              disabled={!canModify}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                                {/* MODIFIED: Edit button is now disabled based on permission */}
                                <Button size="small" variant="light" onClick={() => onOpenEmployeeModal(employee)} disabled={!canModify} title={!canModify ? "You don't have permission to modify employees" : "Edit employee details"}>
                                    <Edit className="w-4 h-4" /> Edit
                                </Button>
                            </div>
                          </td>
                        </tr>
                    )
                  })}
                </tbody>
              </table>
              {employees.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No employees found matching your search.
                </div>
              )}
            </div>
        </div>
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={employees.length}
        />
      </div>
      
      <ViewByBranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={finrootsBranches}
        selectedBranches={branchFilter}
        onApplyFilter={setBranchFilter}
      />
      <EditLeaveReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        employee={editingEmployeeForReason}
        initialReason={todaysRecordForModal?.reason || ''}
        onSave={handleSaveReason}
      />
    </div>
  );
};

export default EmployeeManagement;