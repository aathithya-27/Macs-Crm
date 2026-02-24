import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Sun, Moon, Building, Calendar as CalendarIcon, Award, GitBranch, Mic, TrendingUp, Play } from 'lucide-react';
import Button from './ui/Button.tsx';
import { User as UserType, Branch, Company, FinancialYear, Role } from '../types.ts';
import Input from './ui/Input.tsx';
import { login, getFinancialYears } from '../services/apiService.ts';

interface LoginProps {
    onLogin: (user: UserType, finYearId: string) => void;
    onForgotPassword: (companyName: string, employeeId: string) => void;
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

    const calendarData = useMemo(() => {
        const today = new Date();
        const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
        const currentYear = today.getFullYear();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const weekDays = Array.from({ length: 7 }).map((_, index) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + index);
            return {
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: d.getDate(),
                isToday: d.toDateString() === today.toDateString()
            };
        });

        return { currentMonth, currentYear, weekDays };
    }, []);

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
    };

    const handleForgotPasswordClick = () => {
        setError('');
        if (!employeeId.trim()) {
            setError('Please provide your User ID to reset password');
            return;
        }
        if (!company) {
            setError('Please select a company');
            return;
        }
        onForgotPassword(company, employeeId);
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden flex font-sans">
            {}
            <div className="absolute inset-0 z-0">
                <img 
                    src="./img/loginscreen5.png" 
                    alt="Background" 
                    className="w-full h-full object-cover "
                />
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {}
            <div className="absolute top-6 right-6 z-50">
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all shadow-lg"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            {}
            <div className="hidden md:flex md:w-[60%] lg:w-1/2 relative z-10 flex-col justify-center p-6 lg:p-12">
                {}
                {
}

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-3xl h-auto lg:h-96">
                {}
                <div className="col-span-full bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 lg:p-6 shadow-2xl text-white flex flex-col justify-between min-h-[120px]">
                    <div className="flex justify-between items-center mb-2 opacity-90">
                        <span className="text-lg lg:text-xl font-bold">{calendarData.currentMonth}</span>
                        <span className="text-sm font-semibold opacity-70">{calendarData.currentYear}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs lg:text-sm text-gray-300 mb-1 font-bold">
                        {calendarData.weekDays.map((day) => (
                            <div key={day.dayName}>{day.dayName}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-lg lg:text-xl font-extrabold">
                        {calendarData.weekDays.map((day) => (
                            <div key={day.dayNumber} className={`relative ${day.isToday ? 'text-white scale-110' : 'text-gray-400 opacity-60'}`}>
                                {day.dayNumber}
                                {day.isToday && (
                                    <div className="absolute -top-1 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div className="col-span-1 bg-white rounded-2xl p-5 shadow-2xl flex flex-col justify-between min-h-[100px]">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base lg:text-lg">Daily Meeting</h3>
                            <p className="text-gray-400 text-xs mt-1">12:00pm - 01:00pm</p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></div>
                    </div>
                    <div className="flex -space-x-2 mt-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div className="col-span-1 bg-white rounded-2xl p-5 shadow-2xl flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-500">
                            <Mic size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm lg:text-base">Client Note</h3>
                            <p className="text-gray-400 text-[10px] lg:text-xs">00:42 / 02:30</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 h-8 justify-center mt-4">
                        {[40, 70, 50, 90, 60, 80, 40].map((h, i) => (
                            <div key={i} className="w-1.5 bg-red-400 rounded-full" style={{ height: `${h}%` }}></div>
                        ))}
                        <div className="ml-2 p-1.5 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200">
                            <Play size={10} fill="black" />
                        </div>
                    </div>
                </div>

                {}
                {}
                <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 shadow-2xl flex flex-col justify-between min-h-[100px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 text-sm lg:text-base">Sales Trend</h3>
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <div className="flex items-end justify-between h-16 gap-2">
                        {[30, 45, 35, 60, 50, 75, 65, 40, 55, 70].map((h, i) => (
                            <div key={i} className="w-full h-full bg-blue-50 rounded-t-sm relative">
                                <div 
                                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500" 
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>


            {}
            <div className="w-full md:w-[40%] lg:w-1/2 flex items-center justify-center lg:justify-end lg:pr-12 p-4 relative z-10">
                <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <img 
                                src="./img/logo1.png" 
                                alt="Company Logo" 
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MACS-CRM</h1>
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
                            <CalendarIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
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
                                onClick={handleForgotPasswordClick}
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
        </div>
    );
};

export default Login;