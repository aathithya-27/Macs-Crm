// import React, { useState, useEffect, useMemo } from 'react';
// import { Lock, Sun, Moon, Building, Calendar as CalendarIcon, Award, GitBranch, Mic, TrendingUp, Play } from 'lucide-react';
// import Button from './ui/Button.tsx';
// import { User as UserType, Branch, Company, FinancialYear, Role } from '../types.ts';
// import Input from './ui/Input.tsx';
// import { login, getFinancialYears } from '../services/apiService.ts';

// interface LoginProps {
//     onLogin: (user: UserType, finYearId: string) => void;
//     onForgotPassword: (companyName: string, employeeId: string) => void;
//     theme: 'light' | 'dark';
//     toggleTheme: () => void;
//     allBranches: Branch[];
//     operatingCompanies: Company[];
//     roles: Role[];
// }

// const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword, theme, toggleTheme, allBranches, operatingCompanies, roles }) => {
//     const [company, setCompany] = useState('');
//     const [roleId, setRoleId] = useState('');
//     const [branch_id, setbranch_id] = useState('');
//     const [employeeId, setEmployeeId] = useState('');
//     const [password, setPassword] = useState('');
//     const [rememberMe, setRememberMe] = useState(false);
//     const [error, setError] = useState('');
//     const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
//     const [financialYearId, setFinancialYearId] = useState('');

//     const companyOptions = useMemo(() => operatingCompanies.filter(c => c.active), [operatingCompanies]);
//     const roleOptions = useMemo(() => roles.filter(r => r.active), [roles]);
//     const companyBranches = useMemo(() => {
//         const selectedCompany = companyOptions.find(c => c.name === company);
//         if (!selectedCompany) return [];
//         return allBranches.filter(b => b.comp_id === selectedCompany.id && b.active);
//     }, [company, allBranches, companyOptions]);

//     const calendarData = useMemo(() => {
//         const today = new Date();
//         const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
//         const currentYear = today.getFullYear();
//         const startOfWeek = new Date(today);
//         startOfWeek.setDate(today.getDate() - today.getDay());

//         const weekDays = Array.from({ length: 7 }).map((_, index) => {
//             const d = new Date(startOfWeek);
//             d.setDate(startOfWeek.getDate() + index);
//             return {
//                 dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
//                 dayNumber: d.getDate(),
//                 isToday: d.toDateString() === today.toDateString()
//             };
//         });

//         return { currentMonth, currentYear, weekDays };
//     }, []);

//     useEffect(() => {
//         setbranch_id('');
//     }, [company, roleId]);
    
//     useEffect(() => {
//         const fetchFYs = async () => {
//             const fys = await getFinancialYears();
//             const activeFYs = fys.filter(fy => fy.status === 'Active');
//             setFinancialYears(activeFYs);
//             if (activeFYs.length > 0) {
//                 setFinancialYearId(activeFYs[0].id); 
//             }
//         };
//         fetchFYs();

//         if (companyOptions.length > 0 && !company) {
//             setCompany(companyOptions[0].name);
//         }
//         if (roleOptions.length > 0 && !roleId) {
//             const adminRole = roleOptions.find(r => r.name === 'System Administrator');
//             setRoleId(adminRole ? adminRole.id : roleOptions[0].id);
//         }
//     }, [companyOptions, roleOptions, company, roleId]);

//     useEffect(() => {
//         const savedData = localStorage.getItem('rememberedUser');
//         if (savedData) {
//             const { company, employeeId, roleId: savedRoleId } = JSON.parse(savedData);
//             setCompany(company);
//             setEmployeeId(employeeId);
//             if (savedRoleId) setRoleId(savedRoleId);
//             setRememberMe(true);
//         }
//     }, []);

//     const handleLogin = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');

//         if (!company || !roleId || !employeeId || !password || !financialYearId) {
//             setError('Please fill in all fields, including Role and Financial Year.');
//             return;
//         }

//         try {
//             const user = await login(company, employeeId, password, roleId, branch_id, financialYearId);

//             if (user) {
//                 if (rememberMe) {
//                     localStorage.setItem('rememberedUser', JSON.stringify({ company, employeeId, roleId }));
//                 } else {
//                     localStorage.removeItem('rememberedUser');
//                 }
//                 onLogin(user, financialYearId);
//             } else {
//                 setError('Invalid credentials. Please check your details or contact an administrator.');
//             }
//         } catch (err) {
//             if ((err as Error).message === 'INACTIVE_ACCOUNT') {
//                 setError('Your account is inactive. Please contact your administrator for assistance.');
//             } else {
//                 setError('An error occurred during login. Please try again.');
//             }
//         }
//     };

//     const handleForgotPasswordClick = () => {
//         setError('');
//         if (!employeeId.trim()) {
//             setError('Please provide your User ID to reset password');
//             return;
//         }
//         if (!company) {
//             setError('Please select a company');
//             return;
//         }
//         onForgotPassword(company, employeeId);
//     };

//     return (
//         <div className="relative w-full min-h-screen overflow-hidden flex font-sans">
//             {/* Background */}
//             <div className="absolute inset-0 z-0">
//                 <img 
//                     src="./img/loginscreen6.png" 
//                     alt="Background" 
//                     className="w-full h-full object-cover blur-sm"
//                 />
//                 <div className="absolute inset-0 bg-black/10"></div>
//             </div>

//             {/* Theme Toggle */}
//             <div className="absolute top-6 right-6 z-50">
//                 <button 
//                     onClick={toggleTheme} 
//                     className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all shadow-lg"
//                 >
//                     {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
//                 </button>
//             </div>

//             {/* Left Side - Hero Text & Bento Grid */}
//             <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center p-12">
//                 {/* Hero Text */}
//                 <div className="mb-12 text-white">
//                     <h1 className="text-5xl font-bold mb-4 leading-tight">
//                         Streamline your Finance Workflow.
//                     </h1>
//                     <p className="text-xl opacity-90 max-w-lg">
//                         The all-in-one CRM for Insurance, Mutual Funds, and Wealth Management.
//                     </p>
//                 </div>

//                 {/* Bento Grid */}
//                 <div className="grid grid-cols-3 grid-rows-3 gap-4 max-w-2xl h-96">
//                     {/* Task Widget - Large */}
//                     <div className="col-span-2 row-span-1 bg-[#2D2D2D] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
//                         <div className="absolute -top-2 -right-2 w-16 h-16 bg-[#FFD75E] rounded-full opacity-20"></div>
//                         <div className="flex justify-between items-start mb-2">
//                             <span className="text-[#FFD75E] text-xs font-bold tracking-widest uppercase">Upcoming</span>
//                             <div className="w-2 h-2 rounded-full bg-[#FFD75E]"></div>
//                         </div>
//                         <h3 className="text-white text-lg font-bold">Task Review With Team</h3>
//                         <p className="text-gray-400 text-sm">09:30am - 10:00am</p>
//                     </div>

//                     {/* Sales Trend - Large (swapped position) */}
//                     <div className="col-span-1 row-span-2 bg-white rounded-2xl p-4 shadow-2xl">
//                         <div className="flex justify-between items-center mb-4">
//                             <h3 className="font-bold text-gray-900 text-sm">Sales Trend</h3>
//                             <TrendingUp size={16} className="text-green-500" />
//                         </div>
//                         <div className="flex items-end justify-between h-32 gap-1">
//                             {[30, 45, 35, 60, 50, 75, 65].map((h, i) => (
//                                 <div key={i} className="w-full h-full bg-blue-50 rounded-t-sm relative">
//                                     <div 
//                                         className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500" 
//                                         style={{ height: `${h}%` }}
//                                     ></div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Daily Meeting */}
//                     <div className="col-span-1 row-span-1 bg-white rounded-2xl p-4 shadow-2xl">
//                         <div className="flex justify-between items-start mb-2">
//                             <div>
//                                 <h3 className="font-bold text-gray-900 text-sm">Daily Meeting</h3>
//                                 <p className="text-gray-400 text-xs">12:00pm - 01:00pm</p>
//                             </div>
//                             <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
//                         </div>
//                         <div className="flex -space-x-1">
//                             {[1, 2, 3].map((i) => (
//                                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
//                                     <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" className="w-full h-full object-cover" />
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Voice Note */}
//                     <div className="col-span-1 row-span-1 bg-white rounded-2xl p-4 shadow-2xl">
//                         <div className="flex items-center gap-2 mb-2">
//                             <div className="p-1 bg-red-100 rounded-full text-red-500">
//                                 <Mic size={12} />
//                             </div>
//                             <div>
//                                 <h3 className="font-bold text-gray-900 text-xs">Client Note</h3>
//                                 <p className="text-gray-400 text-[8px]">00:42 / 02:30</p>
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-1 h-4 justify-center">
//                             {[40, 70, 50, 90, 60, 80, 40].map((h, i) => (
//                                 <div key={i} className="w-1 bg-red-400 rounded-full" style={{ height: `${h}%` }}></div>
//                             ))}
//                             <div className="ml-1 p-1 bg-gray-100 rounded-full cursor-pointer">
//                                 <Play size={8} fill="black" />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Calendar Widget - Small (swapped position and reduced size) */}
//                     <div className="col-span-3 row-span-1 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl text-white">
//                         <div className="flex justify-between items-center mb-2 opacity-90">
//                             <span className="text-sm font-bold">{calendarData.currentMonth}</span>
//                             <span className="text-xs font-semibold opacity-70">{calendarData.currentYear}</span>
//                         </div>
//                         <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-300 mb-1 font-bold">
//                             {calendarData.weekDays.map((day) => (
//                                 <div key={day.dayName}>{day.dayName}</div>
//                             ))}
//                         </div>
//                         <div className="grid grid-cols-7 gap-1 text-center text-sm font-extrabold">
//                             {calendarData.weekDays.map((day) => (
//                                 <div key={day.dayNumber} className={`relative ${day.isToday ? 'text-white scale-110' : 'text-gray-400 opacity-60'}`}>
//                                     {day.dayNumber}
//                                     {day.isToday && (
//                                         <div className="absolute -top-1 right-0 w-1 h-1 bg-yellow-400 rounded-full"></div>
//                                     )}
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Right Side - Login Form */}
//             <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative z-10">
//                 <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in">
//                     <div className="text-center">
//                         <div className="flex justify-center mb-4">
//                             <img 
//                                 src="./img/logo1.png" 
//                                 alt="Company Logo" 
//                                 className="h-16 w-auto object-contain"
//                             />
//                         </div>
//                         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MACS-CRM</h1>
//                         <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome! Please sign in.</p>
//                     </div>

//                     {error && (
//                         <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm text-center" role="alert">
//                             {error}
//                         </div>
//                     )}

//                     <form onSubmit={handleLogin} className="space-y-4">
//                         <div className="relative">
//                             <label htmlFor="company" className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
//                             <Building className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
//                             <select
//                                 id="company"
//                                 value={company}
//                                 onChange={(e) => setCompany(e.target.value)}
//                                 className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//                             >
//                                 {companyOptions.map(comp => (
//                                     <option key={comp.id} value={comp.name}>{comp.name}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div className="relative">
//                             <label htmlFor="financialYear" className="text-sm font-medium text-gray-700 dark:text-gray-300">Financial Year</label>
//                             <CalendarIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
//                             <select
//                                 id="financialYear"
//                                 value={financialYearId}
//                                 onChange={(e) => setFinancialYearId(e.target.value)}
//                                 required
//                                 className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//                             >
//                                 <option value="" disabled>Select Financial Year...</option>
//                                 {financialYears.map(fy => (
//                                     <option key={fy.id} value={fy.id}>{fy.finYear}</option>
//                                 ))}
//                             </select>
//                         </div>
                        
//                         <div className="relative">
//                             <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
//                             <Award className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
//                             <select
//                                 id="role"
//                                 value={roleId}
//                                 onChange={(e) => setRoleId(e.target.value)}
//                                 required
//                                 className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//                             >
//                                 <option value="" disabled>Select Role...</option>
//                                 {roleOptions.map(role => (
//                                     <option key={role.id} value={role.id}>{role.name}</option>
//                                 ))}
//                             </select>
//                         </div>
                        
//                         {companyBranches.length > 0 && (
//                             <div className="relative animate-fade-in">
//                                 <label htmlFor="branch" className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
//                                 <GitBranch className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
//                                 <select
//                                     id="branch"
//                                     value={branch_id}
//                                     onChange={(e) => setbranch_id(e.target.value)}
//                                     className="w-full pl-10 pr-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//                                 >
//                                     <option value="">Select Branch...</option>
//                                     {companyBranches.map(branch => (
//                                         <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
//                                     ))}
//                                 </select>
//                             </div>
//                         )}

//                         <Input
//                             id="employeeId"
//                             label="User ID"
//                             type="text"
//                             value={employeeId}
//                             onChange={(e) => setEmployeeId(e.target.value)}
//                             placeholder="Enter your User ID"
//                             required
//                         />

//                         <Input
//                             id="password"
//                             label="Password"
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             placeholder="••••••••"
//                             required
//                         />

//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center">
//                                 <input
//                                     id="remember-me"
//                                     name="remember-me"
//                                     type="checkbox"
//                                     checked={rememberMe}
//                                     onChange={(e) => setRememberMe(e.target.checked)}
//                                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                                 />
//                                 <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
//                                     Remember me
//                                 </label>
//                             </div>
//                             <button
//                                 type="button"
//                                 onClick={handleForgotPasswordClick}
//                                 className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
//                             >
//                                 Forgot password?
//                             </button>
//                         </div>

//                         <Button
//                             type="submit"
//                             variant="primary"
//                             className="w-full justify-center !text-base !py-3"
//                         >
//                             <Lock className="mr-2" /> Sign In
//                         </Button>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;