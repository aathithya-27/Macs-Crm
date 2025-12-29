import React, { useState, useMemo } from 'react';
import {
    Member,
    User,
    Task,
    AttendanceState,
    Lead,
    LeadSourceMaster,
    SchemeMaster,
    InsuranceTypeMaster,
    Designation,
    Role,
    AppModule,
    PermissionLevel,
    AttendanceRecord,
    InsuranceAgency
} from '../types.ts';
import { EmployeePerformance } from './EmployeePerformance.tsx';
import { SchemeConversionReports } from './SchemeConversionReports.tsx';
import { LeadAnalyticsReports } from './LeadAnalyticsReports.tsx';
import { BusinessTrendsReports } from './BusinessTrendsReports.tsx';

export const ReportsAndInsights: React.FC<{
    members: Member[];
    users: User[];
    tasks: Task[];
    attendance: AttendanceState;
    onUpdateAttendance: (userId: string, status: AttendanceRecord['status'], reason?: string) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allLeads: Lead[];
    currentUser: User | null;
    leadSources: LeadSourceMaster[];
    schemes: SchemeMaster[];
    insuranceTypes: InsuranceTypeMaster[];
    agencies: InsuranceAgency[];
    onOpenAttendanceReport: () => void;
    designations: Designation[];
    roles: Role[];
    permissions: { [key in AppModule]?: PermissionLevel };
}> = ({ 
    members = [], 
    users = [], 
    tasks = [], 
    attendance = {}, 
    onUpdateAttendance, 
    addToast, 
    allLeads = [], 
    currentUser, 
    leadSources = [], 
    schemes = [], 
    insuranceTypes = [], 
    agencies = [],
    onOpenAttendanceReport, 
    designations = [], 
    roles = [], 
    permissions 
}) => {
    type ReportTab = 'Employee' | 'schemes' | 'leadAnalytics' | 'trends';
    const [activeReportTab, setActiveReportTab] = useState<ReportTab>('Employee');

    const canViewEmployeePerformance = useMemo(() => {
        const employeesPermission = permissions?.employees;
        const reportsPermission = permissions?.['reports & insights'];
        return (employeesPermission === 'view' || employeesPermission === 'create' || employeesPermission === 'modify') ||
               (reportsPermission === 'view' || reportsPermission === 'create' || reportsPermission === 'modify');
    }, [permissions]);

    const canViewBusinessTrends = useMemo(() => {
        const reportsPermission = permissions?.['reports & insights'];
        return reportsPermission === 'view' || reportsPermission === 'create' || reportsPermission === 'modify';
    }, [permissions]);

    const ReportTabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
        <button 
            onClick={onClick} 
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                isActive 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700 overflow-x-auto">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    {canViewEmployeePerformance && (
                        <ReportTabButton label="Employee Performance" isActive={activeReportTab === 'Employee'} onClick={() => setActiveReportTab('Employee')} />
                    )}
                    <ReportTabButton label="Scheme Conversion" isActive={activeReportTab === 'schemes'} onClick={() => setActiveReportTab('schemes')} />
                    <ReportTabButton label="Lead Analytics" isActive={activeReportTab === 'leadAnalytics'} onClick={() => setActiveReportTab('leadAnalytics')} />
                    {canViewBusinessTrends && (
                        <ReportTabButton label="Business Trends" isActive={activeReportTab === 'trends'} onClick={() => setActiveReportTab('trends')} />
                    )}
                </div>
            </div>

            {}
            <div className="min-h-[500px]">
                {activeReportTab === 'Employee' && canViewEmployeePerformance && (
                    <EmployeePerformance 
                        members={members} 
                        users={users} 
                        tasks={tasks} 
                        attendance={attendance} 
                        onUpdateAttendance={onUpdateAttendance}
                        allLeads={allLeads} 
                        designations={designations} 
                        roles={roles} 
                    />
                )}

                {activeReportTab === 'schemes' && (
                    <SchemeConversionReports 
                        members={members} 
                        schemes={schemes} 
                        insuranceTypes={insuranceTypes} 
                        users={users} 
                        leads={allLeads} 
                    />
                )}

                {activeReportTab === 'leadAnalytics' && (
                    <LeadAnalyticsReports 
                        members={members} 
                        leadSources={leadSources} 
                        users={users} 
                        allLeads={allLeads} 
                    />
                )}

                {activeReportTab === 'trends' && canViewBusinessTrends && (
                    <BusinessTrendsReports 
                        members={members} 
                        schemes={schemes}
                        insuranceTypes={insuranceTypes}
                        agencies={agencies}
                    />
                )}
            </div>
        </div>
    );
};