import React, { useState, useMemo } from 'react';
import { Member, User, Task, AttendanceState, AttendanceRecord, Designation, Role, Lead } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import { 
    Users, Briefcase, X, ChevronRight, Trophy, TrendingUp, 
    CheckCircle, AlertCircle, Calendar, Shield, Filter, ListTodo, Clock, UserCheck, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { 
    ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell 
} from 'recharts';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;
const SortIcon = ({ columnKey, sortConfig }: { columnKey: string, sortConfig: SortConfig }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-gray-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
        ? <ArrowUp size={14} className="ml-1 text-blue-500" /> 
        : <ArrowDown size={14} className="ml-1 text-blue-500" />;
};

export const EmployeePerformance: React.FC<{
    members: Member[];
    users: User[];
    tasks: Task[];
    attendance: AttendanceState;
    onUpdateAttendance: (userId: string, status: AttendanceRecord['status'], reason?: string) => void;
    allLeads: Lead[];
    onOpenAttendanceReport: () => void;
    designations: Designation[];
    roles: Role[];
}> = ({ members, users, tasks, attendance, onUpdateAttendance, allLeads, onOpenAttendanceReport, designations, roles }) => {
    
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [viewAdvisorsOnly, setViewAdvisorsOnly] = useState(false);
    const [attendanceMenuFor, setAttendanceMenuFor] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskModalFilter, setTaskModalFilter] = useState<'All' | 'Pending' | 'Overdue' | 'Completed'>('All');

    const designationMap = useMemo(() => new Map(designations.map(d => [d.id, d.name])), [designations]);
    const roleMap = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);

    const stats = useMemo(() => {
        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7);
        const todayStr = today.toISOString().slice(0, 10);

        const rawData = users.map(user => {
            const isAdvisor = roleMap.get(user.roleId || '')?.isAdvisor ?? false;
            
            const myCustomers = members.filter(m => m.assignedTo.includes(user.id));
            const revenue = myCustomers.reduce((sum, m) => sum + m.policies.reduce((pSum, p) => pSum + p.premium, 0), 0);
            
            const myLeads = allLeads.filter(l => l.assignedTo === user.id);
            const convertedCount = myCustomers.filter(m => m.leadSource).length; 
            const conversionRate = myLeads.length > 0 ? (convertedCount / (myLeads.length + convertedCount)) * 100 : 0;

            const myTasks = tasks.filter(t => t.primaryContactPerson === user.id);
            const completed = myTasks.filter(t => t.isCompleted).length;
            const overdue = myTasks.filter(t => !t.isCompleted && new Date(t.expectedCompletionDateTime) < today).length;
            
            const records = attendance[user.id] || [];
            const monthRecords = records.filter(r => r.timestamp.startsWith(currentMonth));
            const presentDays = monthRecords.filter(r => r.status === 'Present' || r.status === 'Work From Home').length;
            const attendancePct = Math.min(100, Math.round((presentDays / Math.max(1, today.getDate())) * 100));
            
            const todayStatus = records.slice().reverse().find(r => r.timestamp.startsWith(todayStr))?.status;

            return { 
                id: user.id, 
                user, 
                isAdvisor, 
                revenue, 
                conversionRate,
                convertedCount,
                tasks: { total: myTasks.length, completed, overdue, all: myTasks }, 
                attendancePct,
                todayStatus
            };
        });

        const maxRevenue = Math.max(...rawData.map(d => d.revenue), 1);
        
        return rawData.map(d => {
            let score = 0;
            if (d.isAdvisor) {
                score = ((d.revenue / maxRevenue) * 60) + 
                        ((d.tasks.total > 0 ? d.tasks.completed / d.tasks.total : 0) * 20) + 
                        (d.attendancePct * 0.2);
            } else {
                score = ((d.tasks.total > 0 ? d.tasks.completed / d.tasks.total : 0) * 70) + 
                        (d.attendancePct * 0.3);
            }
            return { ...d, score: Math.round(score) };
        }).sort((a, b) => b.score - a.score).map((d, i) => ({ ...d, rank: i + 1 }));

    }, [users, members, tasks, allLeads, attendance, roleMap]);

    const filteredAndSortedStats = useMemo(() => {
        let items = viewAdvisorsOnly ? stats.filter(s => s.isAdvisor) : stats;

        if (sortConfig) {
            items = [...items].sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                switch(sortConfig.key) {
                    case 'rank': valA = a.rank; valB = b.rank; break;
                    case 'name': valA = a.user.name; valB = b.user.name; break;
                    case 'converted': valA = a.convertedCount; valB = b.convertedCount; break;
                    case 'revenue': valA = a.revenue; valB = b.revenue; break;
                    case 'tasks': valA = a.tasks.total > 0 ? (a.tasks.completed/a.tasks.total) : 0; valB = b.tasks.total > 0 ? (b.tasks.completed/b.tasks.total) : 0; break;
                    case 'attendance': valA = a.attendancePct; valB = b.attendancePct; break;
                    default: return 0;
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [stats, viewAdvisorsOnly, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const topPerformer = stats[0];
    const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
    const presentTodayCount = stats.filter(s => s.todayStatus === 'Present' || s.todayStatus === 'Work From Home').length;
    const totalStaff = stats.length;

    const allTasksList = useMemo(() => {
        return tasks.map(t => ({
            ...t,
            assigneeName: users.find(u => u.id === t.primaryContactPerson)?.name || 'Unknown'
        }));
    }, [tasks, users]);

    const filteredTasksList = useMemo(() => {
        if (taskModalFilter === 'All') return allTasksList;
        const today = new Date();
        if (taskModalFilter === 'Completed') return allTasksList.filter(t => t.isCompleted);
        if (taskModalFilter === 'Pending') return allTasksList.filter(t => !t.isCompleted);
        if (taskModalFilter === 'Overdue') return allTasksList.filter(t => !t.isCompleted && new Date(t.expectedCompletionDateTime) < today);
        return allTasksList;
    }, [allTasksList, taskModalFilter]);

    const selectedEmpData = selectedEmployeeId ? stats.find(s => s.id === selectedEmployeeId) : null;

    const handleMarkAttendance = (userId: string, status: AttendanceRecord['status']) => {
        onUpdateAttendance(userId, status, 'Manual Update from Dashboard');
        setAttendanceMenuFor(null);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={24} /> 
                        Employee Performance Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track targets, tasks, and team availability.</p>
                </div>
                <div>
                    <Button onClick={onOpenAttendanceReport} variant="secondary" size="small" className="flex items-center gap-2">
                        <Calendar size={16} /> Full Attendance Report
                    </Button>
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {}
                <div className="md:col-span-1 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy size={80} /></div>
                    <p className="text-xs font-bold uppercase tracking-wider text-yellow-100">Star Performer</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                            {topPerformer?.user.initials}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{topPerformer?.user.name}</h3>
                            <p className="text-xs text-yellow-100 opacity-90">{designationMap.get(topPerformer?.user.designationId)}</p>
                        </div>
                    </div>
                </div>

                {}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase">Team Revenue (Month)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded">
                        <TrendingUp size={14} /> Active
                    </div>
                </div>

                {}
                <div 
                    className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors group"
                    onClick={() => setIsTaskModalOpen(true)}
                >
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-gray-500 text-xs font-bold uppercase">Task Completion</p>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500"/>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {Math.round(stats.reduce((acc, s) => acc + s.tasks.completed, 0) / Math.max(1, stats.reduce((acc, s) => acc + s.tasks.total, 0)) * 100)}%
                        </h3>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '75%'}}></div>
                    </div>
                </div>

                {}
                <div 
                    className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between cursor-pointer hover:border-purple-300 transition-colors group"
                    onClick={onOpenAttendanceReport}
                >
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-gray-500 text-xs font-bold uppercase">Present Today</p>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-500"/>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {presentTodayCount} <span className="text-sm font-normal text-gray-400">/ {totalStaff}</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                        <Users size={14} /> View Full Report
                    </div>
                </div>
            </div>

            {}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-gray-800 dark:text-white">Performance Leaderboard</h3>
                    
                    <button 
                        onClick={() => setViewAdvisorsOnly(!viewAdvisorsOnly)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                            viewAdvisorsOnly 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Filter size={14} />
                        {viewAdvisorsOnly ? 'Showing: Advisors Only' : 'Showing: All Staff'}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('rank')}>
                                        <div className="flex items-center">Rank <SortIcon columnKey="rank" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('name')}>
                                        <div className="flex items-center">Employee <SortIcon columnKey="name" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('converted')}>
                                        <div className="flex items-center justify-center">Converted <SortIcon columnKey="converted" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('revenue')}>
                                        <div className="flex items-center justify-end">Revenue <SortIcon columnKey="revenue" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('tasks')}>
                                        <div className="flex items-center justify-center">Tasks <SortIcon columnKey="tasks" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('attendance')}>
                                        <div className="flex items-center justify-center">Attendance (Today) <SortIcon columnKey="attendance" sortConfig={sortConfig}/></div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredAndSortedStats.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setSelectedEmployeeId(emp.id)}>
                                        <td className="px-6 py-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${emp.rank === 1 ? 'bg-yellow-100 text-yellow-700' : emp.rank === 2 ? 'bg-gray-200 text-gray-700' : emp.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {emp.rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{emp.user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    {emp.isAdvisor ? <Shield size={10} className="text-blue-500"/> : <Briefcase size={10}/>}
                                                    {designationMap.get(emp.user.designationId)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.convertedCount > 0 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}>
                                                <UserCheck size={12}/> {emp.convertedCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {emp.isAdvisor ? (
                                                <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(emp.revenue)}</span>
                                            ) : <span className="text-xs text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{emp.tasks.completed}/{emp.tasks.total}</span>
                                                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                                                    <div className="bg-green-500 h-1 rounded-full" style={{width: `${emp.tasks.total > 0 ? (emp.tasks.completed/emp.tasks.total)*100 : 0}%`}}></div>
                                                </div>
                                            </div>
                                        </td>
                                        {}
                                        <td className="px-6 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                                            <div 
                                                className="cursor-pointer inline-flex flex-col items-center group/att"
                                                onClick={() => setAttendanceMenuFor(attendanceMenuFor === emp.id ? null : emp.id)}
                                            >
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                                                    emp.todayStatus === 'Present' ? 'bg-green-100 text-green-800 border-green-200' : 
                                                    emp.todayStatus === 'Absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    emp.todayStatus === 'Work From Home' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                    {emp.todayStatus || 'Mark'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 group-hover/att:text-blue-500">Update</span>
                                            </div>

                                            {}
                                            {attendanceMenuFor === emp.id && (
                                                <>
                                                    <div 
                                                        className="fixed inset-0 z-10 cursor-default" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAttendanceMenuFor(null);
                                                        }}
                                                    />
                                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20 bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-600 p-1 flex flex-col gap-1 w-32 animate-in fade-in zoom-in duration-200">
                                                        <button onClick={() => handleMarkAttendance(emp.id, 'Present')} className="px-2 py-1.5 hover:bg-green-50 text-green-700 text-xs font-medium rounded text-left flex items-center gap-2">
                                                            <Users size={12}/> Present
                                                        </button>
                                                        <button onClick={() => handleMarkAttendance(emp.id, 'Work From Home')} className="px-2 py-1.5 hover:bg-blue-50 text-blue-700 text-xs font-medium rounded text-left flex items-center gap-2">
                                                            <Briefcase size={12}/> WFH
                                                        </button>
                                                        <button onClick={() => handleMarkAttendance(emp.id, 'Absent')} className="px-2 py-1.5 hover:bg-red-50 text-red-700 text-xs font-medium rounded text-left flex items-center gap-2">
                                                            <X size={12}/> Absent
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAndSortedStats.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No employees found matching the filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {}
            {selectedEmpData && (
                <Modal isOpen={!!selectedEmployeeId} onClose={() => setSelectedEmployeeId(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden w-full max-w-4xl mx-auto flex flex-col h-auto max-h-[90vh] shadow-2xl">
                        {}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white shrink-0">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 text-2xl font-bold flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
                                        {selectedEmpData.user.initials}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedEmpData.user.name}</h2>
                                        <p className="text-indigo-100">{designationMap.get(selectedEmpData.user.designationId)}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm">Rank
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm">Score: {selectedEmpData.score}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedEmployeeId(null)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                        </div>

                        {}
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ListTodo size={16}/> Workload</h4>
                                    <div className="h-48 flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Completed', value: selectedEmpData.tasks.completed, fill: '#10B981' },
                                                        { name: 'Pending', value: selectedEmpData.tasks.total - selectedEmpData.tasks.completed - selectedEmpData.tasks.overdue, fill: '#F59E0B' },
                                                        { name: 'Overdue', value: selectedEmpData.tasks.overdue, fill: '#EF4444' }
                                                    ]}
                                                    cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value"
                                                >
                                                    {}
                                                </Pie>
                                                <Tooltip />
                                                <Legend iconSize={8} wrapperStyle={{fontSize: '12px'}}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        {selectedEmpData.tasks.overdue > 0 ? <span className="text-red-500 font-bold flex items-center justify-center gap-1"><AlertCircle size={12}/> {selectedEmpData.tasks.overdue} Critical Tasks</span> : "No Overdue Tasks"}
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={16}/> Sales Performance</h4>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Premium</span>
                                            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedEmpData.revenue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</span>
                                            <span className="text-lg font-bold text-gray-800 dark:text-white">{selectedEmpData.conversionRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Lead Funnel</p>
                                            <div className="flex gap-1 h-3">
                                                <div className="bg-blue-200 dark:bg-blue-900/40 flex-1 rounded-l-full"></div>
                                                <div className="bg-blue-400 dark:bg-blue-600 w-2/3"></div>
                                                <div className="bg-blue-600 dark:bg-blue-400 w-1/3 rounded-r-full"></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                <span>Assigned</span>
                                                <span>Contacted</span>
                                                <span>Won</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="pt-2 pb-2">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><Calendar size={16}/> Recent Attendance</h4>
                                <div className="flex gap-2">
                                    {[...Array(7)].map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - i));
                                        const dateStr = d.toISOString().split('T')[0];
                                        const rec = attendance[selectedEmpData.user.id]?.find(r => r.timestamp.startsWith(dateStr));
                                        const statusColor = rec?.status === 'Present' ? 'bg-green-500' : rec?.status === 'Absent' ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700';
                                        
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <div className={`w-full h-2 rounded-full ${statusColor}`}></div>
                                                <span className="text-[10px] text-gray-400">{d.getDate()}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {}
            {isTaskModalOpen && (
                <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-auto my-8 flex flex-col max-h-[85vh]">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <ListTodo size={20} className="text-blue-500"/> Task Summary
                            </h3>
                            
                            {}
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                {['All', 'Pending', 'Overdue', 'Completed'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setTaskModalFilter(tab as any)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                            taskModalFilter === tab 
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20}/></button>
                        </div>
                        
                        <div className="p-0 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Task Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Assignee</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredTasksList.map(task => {
                                        const isOverdue = !task.isCompleted && new Date(task.expectedCompletionDateTime) < new Date();
                                        return (
                                            <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900 dark:text-white">{task.taskDescription}</p>
                                                    <p className="text-xs text-gray-500">{task.taskType}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {task.assigneeName}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <Clock size={12}/> {new Date(task.expectedCompletionDateTime).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        task.isCompleted ? 'bg-green-100 text-green-800' :
                                                        isOverdue ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {task.isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredTasksList.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-8 text-gray-400">No tasks found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};