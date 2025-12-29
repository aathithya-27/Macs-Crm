import React, { useState, useMemo,useEffect } from 'react';
import { User, Member, Branch, AttendanceState, Designation, AppModule, PermissionLevel, Role, AttendanceRecord } from '../types.ts';
import Button from './ui/Button.tsx';
import { Plus, Search, Edit, Users, Building, Info, ArrowUp, ArrowDown, Edit2, Briefcase, Clock, X, Calendar, Filter } from 'lucide-react';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import { ViewByBranchModal } from './ViewByBranchModal.tsx';
import Pagination from './ui/Pagination.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import { AttendanceReportModal } from './AttendanceReportModal.tsx';

type SortKey = 'name' | 'joiningDate' | 'branch' | 'attendance';
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };

const ITEMS_PER_PAGE = 10;

const EditLeaveReasonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
    initialReason: string;
    onSave: (newReason: string) => void;
}> = ({ isOpen, onClose, employee, initialReason, onSave }) => {
    const [reason, setReason] = useState(initialReason);

    useEffect(() => {
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Reason for Absence</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For {employee?.name}</p>
            </div>
            <div className="p-6">
                <Input
                    label="Reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    
                    placeholder="Enter reason..."
                    autoFocus
                />
            </div>
            <div className="flex justify-end p-6 gap-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={!reason.trim()}>Save Reason</Button>
            </div>
        </Modal>
    );
};

interface EmployeeManagementProps {
  users: User[];
  allMembers: Member[];
  onOpenEmployeeModal: (employee: User | null) => void;
  onToggleStatus: (userId: string) => void;
  attendance: AttendanceState;
  onUpdateAttendance: (userId: string, status: AttendanceRecord['status'], reason?: string) => void;
  Branches: Branch[];
  addToast: (message: string, type?: 'success' | 'error') => void;
  designations: Designation[];
  permissions: { [key in AppModule]?: PermissionLevel };
  roles: Role[];
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ users, allMembers, onOpenEmployeeModal, onToggleStatus, attendance, onUpdateAttendance, Branches, addToast, designations, permissions, roles }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All Employees' | 'Active' | 'Inactive'>('Active');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [editingEmployeeForReason, setEditingEmployeeForReason] = useState<User | null>(null);
  const [attendanceMenuFor, setAttendanceMenuFor] = useState<string | null>(null);
  const [isAttendanceReportOpen, setIsAttendanceReportOpen] = useState(false);

  const canCreate = permissions?.employees === 'create' || permissions?.employees === 'modify';
  const canModify = permissions?.employees === 'modify';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, branchFilter]);
  
  const branchMap = useMemo(() => new Map(Branches.map(b => [b.id, b.branch_name])), [Branches]);
  const designationMap = useMemo(() => new Map(designations.map(d => [d.id, d.name])), [designations]);
  const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r.name])), [roles]);

  const employees = useMemo(() => {
    let filteredEmployees = users.filter(user => {
        const query = searchQuery.toLowerCase();
        const designation = designationMap.get(user.designationId) || '';
        const role = user.roleId ? roleMap.get(user.roleId) || '' : '';
        const branch = branchMap.get(user.profile?.employeebranch_id || '') || '';
        const joiningDate = user.profile?.dateOfJoining ? new Date(user.profile.dateOfJoining).toLocaleDateString('en-GB') : '';
        
        return user.employeeId.toLowerCase().includes(query) ||
               user.name.toLowerCase().includes(query) ||
               designation.toLowerCase().includes(query) ||
               role.toLowerCase().includes(query) ||
               branch.toLowerCase().includes(query) ||
               joiningDate.includes(query);
    });

    if (statusFilter !== 'All Employees') {
        filteredEmployees = filteredEmployees.filter(emp => emp.profile?.status === statusFilter);
    }

    if (branchFilter.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => emp.profile?.employeebranch_id && branchFilter.includes(emp.profile.employeebranch_id));
    }
    
      
       const getTodaysStatus = (userId: string) => {
        
        const today = new Date().toISOString().split('T')[0];
        const records = attendance[userId];
        if (!records || records.length === 0) return 'Z';
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
                aValue = branchMap.get(a.profile?.employeebranch_id || '') || 'ZZZ';
                bValue = branchMap.get(b.profile?.employeebranch_id || '') || 'ZZZ';
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
  const currentEmployees = useMemo(() => {
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

  const handleAdminMarkAttendance = (employee: User, status: AttendanceRecord['status']) => {
    if (status === 'Present' || status === 'Work From Home') {
        onUpdateAttendance(employee.id, status, '');
        setAttendanceMenuFor(null);
    } else {
        setEditingEmployeeForReason(employee);
        setIsReasonModalOpen(true);
        setAttendanceMenuFor(null);
    }
  };
  
  const handleSaveReason = (newReason: string) => {
    if (editingEmployeeForReason) {
        onUpdateAttendance(editingEmployeeForReason.id, 'Absent', newReason);
        addToast(`Attendance for ${editingEmployeeForReason.name} updated.`, 'success');
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
        <div className="flex gap-2">
          <Button onClick={() => setIsAttendanceReportOpen(true)} variant="secondary" size="small" className="flex items-center gap-2">
            <Calendar size={16} /> Attendance Report
          </Button>
          {canCreate && (
              <Button onClick={() => onOpenEmployeeModal(null)} variant="success">
                  <Plus size={16} /> Create New Employee
              </Button>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, Name, Designation, Role, Branch, or Date..."
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
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
                            {employee.roleId ? roleMap.get(employee.roleId) : <span className="italic text-gray-400 dark:text-gray-500">None</span>}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                             {branchMap.get(employee.profile?.employeebranch_id || '') || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {employee.profile?.dateOfJoining ? new Date(employee.profile.dateOfJoining).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm relative" onClick={(e) => e.stopPropagation()}>
                            <div 
                                className="cursor-pointer inline-flex flex-col items-center group/att"
                                onClick={() => canModify && setAttendanceMenuFor(attendanceMenuFor === employee.id ? null : employee.id)}
                            >
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                                    todaysRecord?.status === 'Present' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 
                                    todaysRecord?.status === 'Absent' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                    todaysRecord?.status === 'Work From Home' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                                }`}>
                                    {todaysRecord?.status === 'Present' && <><Users size={12}/> Present</>}
                                    {todaysRecord?.status === 'Work From Home' && <><Briefcase size={12}/> WFH</>}
                                    {todaysRecord?.status === 'Absent' && <><X size={12}/> Absent</>}
                                    {!todaysRecord && 'Mark'}
                                </span>
                                {canModify && <span className="text-[10px] text-gray-400 group-hover/att:text-blue-500">Update</span>}
                            </div>

                            {todaysRecord?.reason && todaysRecord.status === 'Absent' && (
                                <p className="text-xs text-gray-400 truncate max-w-[150px] mt-1" title={todaysRecord.reason}>{todaysRecord.reason}</p>
                            )}

                            {/* Attendance Selection Menu */}
                            {attendanceMenuFor === employee.id && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10 cursor-default" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAttendanceMenuFor(null);
                                        }}
                                    />
                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20 bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-600 p-1 flex flex-col gap-1 w-32 animate-in fade-in zoom-in duration-200">
                                        <button onClick={() => handleAdminMarkAttendance(employee, 'Present')} className="px-2 py-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium rounded text-left flex items-center gap-2">
                                            <Users size={12}/> Present
                                        </button>
                                        <button onClick={() => handleAdminMarkAttendance(employee, 'Work From Home')} className="px-2 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded text-left flex items-center gap-2">
                                            <Briefcase size={12}/> WFH
                                        </button>
                                        <button onClick={() => handleAdminMarkAttendance(employee, 'Absent')} className="px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded text-left flex items-center gap-2">
                                            <X size={12}/> Absent
                                        </button>
                                    </div>
                                </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ToggleSwitch 
                              enabled={employee.profile?.status === 'Active'}
                              onChange={() => onToggleStatus(employee.id)}
                              srLabel={`Toggle status for ${employee.name}`}
                              disabled={!canModify}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
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
        branches={Branches}
        selectedBranches={branchFilter}
        onApplyFilter={setBranchFilter}
      />
      <EditLeaveReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        employee={editingEmployeeForReason}
        initialReason={todaysRecordForModal?.reason || ''}
        onSave={(newReason) => handleSaveReason(newReason)}
      />
      <AttendanceReportModal
        isOpen={isAttendanceReportOpen}
        onClose={() => setIsAttendanceReportOpen(false)}
        attendance={attendance}
        users={users}
        designations={designations}
        roles={roles}
      />
    </div>
  );
};

export default EmployeeManagement;