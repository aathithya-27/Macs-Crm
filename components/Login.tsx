import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Lock, Sun, Moon, Building, User as UserIcon, GitBranch, Calendar, Award } from 'lucide-react';
import Button from './ui/Button.tsx';
import { User as UserType, Branch, Company, Designation, FinancialYear, Role } from '../types.ts';
import Input from './ui/Input.tsx';
import { login, getFinancialYears } from '../services/apiService.ts';

interface LoginProps {
    onLogin: (user: UserType, finYearId: string) => void; 
    onForgotPassword: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    allBranches: Branch[];
    operatingCompanies: Company[];
    roles: Role[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword, theme, toggleTheme, allBranches, operatingCompanies, roles }) => {
    const [company, setCompany] = useState('');
    const [roleId, setRoleId] = useState('');
    const [branch_id, setbranch_id] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
    const [financialYearId, setFinancialYearId] = useState('');

    const companyOptions = useMemo(() => operatingCompanies.filter(c => c.active), [operatingCompanies]);
    const roleOptions = useMemo(() => roles.filter(r => r.active), [roles]);

    const companyBranches = useMemo(() => {
        const selectedCompany = companyOptions.find(c => c.name === company);
        if (!selectedCompany) return [];
        return allBranches.filter(b => b.comp_id === selectedCompany.id && b.active);
    }, [company, allBranches, companyOptions]);

    useEffect(() => {
        setbranch_id('');
    }, [company, roleId]);
    
    useEffect(() => {
        const fetchFYs = async () => {
            const fys = await getFinancialYears();
            const activeFYs = fys.filter(fy => fy.status === 'Active');
            setFinancialYears(activeFYs);
            if (activeFYs.length > 0) {
                setFinancialYearId(activeFYs[0].id); 
            }
        };
        fetchFYs();

        if (companyOptions.length > 0 && !company) {
            setCompany(companyOptions[0].name);
        }
        if (roleOptions.length > 0 && !roleId) {
            const adminRole = roleOptions.find(r => r.name === 'System Administrator');
            setRoleId(adminRole ? adminRole.id : roleOptions[0].id);
        }
    }, [companyOptions, roleOptions, company, roleId]);

    useEffect(() => {
        const savedData = localStorage.getItem('rememberedUser');
        if (savedData) {
            const { company, employeeId, roleId: savedRoleId } = JSON.parse(savedData);
            setCompany(company);
            setEmployeeId(employeeId);
            if (savedRoleId) setRoleId(savedRoleId);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!company || !roleId || !employeeId || !password || !financialYearId) {
            setError('Please fill in all fields, including Role and Financial Year.');
            return;
        }

        // --- MODIFICATION BEGINS ---
        try {
            const user = await login(company, employeeId, password, roleId, branch_id, financialYearId);

            if (user) {
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', JSON.stringify({ company, employeeId, roleId }));
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                onLogin(user, financialYearId);
            } else {
                setError('Invalid credentials. Please check your details or contact an administrator.');
            }
        } catch (err) {
            if ((err as Error).message === 'INACTIVE_ACCOUNT') {
                setError('Your account is inactive. Please contact your administrator for assistance.');
            } else {
                setError('An error occurred during login. Please try again.');
            }
        }
        // --- MODIFICATION ENDS ---
    };

    return (
        <div className="flex items-center justify-center w-full min-h-screen bg-gray-100 dark:bg-gray-900 relative p-4">
            <div className="absolute top-5 right-5">
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
            <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        MACS-CRM
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome! Please sign in.</p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="company" className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                        <Building className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                        <select
                            id="company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {companyOptions.map(comp => (
                                <option key={comp.id} value={comp.name}>{comp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <label htmlFor="financialYear" className="text-sm font-medium text-gray-700 dark:text-gray-300">Financial Year</label>
                        <Calendar className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                        <select
                            id="financialYear"
                            value={financialYearId}
                            onChange={(e) => setFinancialYearId(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="" disabled>Select Financial Year...</option>
                            {financialYears.map(fy => (
                                <option key={fy.id} value={fy.id}>{fy.finYear}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <Award className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                        <select
                            id="role"
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="" disabled>Select Role...</option>
                            {roleOptions.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {companyBranches.length > 0 && (
                        <div className="relative animate-fade-in">
                            <label htmlFor="branch" className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                            <GitBranch className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                            <select
                                id="branch"
                                value={branch_id}
                                onChange={(e) => setbranch_id(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Select Branch...</option>
                                {companyBranches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Input
                        id="employeeId"
                        label="User ID"
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="Enter your User ID"
                        required
                    />

                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full justify-center !text-base !py-3"
                    >
                        <Lock className="mr-2" /> Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Login;