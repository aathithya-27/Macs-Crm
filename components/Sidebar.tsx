import React, { useRef, useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Shield, User, Users, MapPin, LayoutDashboard, FileText, LogOut, BarChart2, NotebookText,
    Zap, TrendingUp, Database, Wrench, ListTodo, 
    IndianRupee, Calendar as CalendarIcon, BarChart3, UserCog, HandCoins, Megaphone,
    ChevronDown, ChevronRight, PieChart, MessageSquare, Briefcase
} from 'lucide-react';
import { Tab, AppModule, PermissionLevel, User as UserType } from '../types.ts';

// --- Interfaces ---
interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    user: UserType | null;
    permissions: { [key in AppModule]?: PermissionLevel } | null;
    onHoverChange?: (isHovered: boolean) => void;
}

interface NavItem {
    tab: Tab;
    path: string;
    label: string;
    icon: React.ReactNode;
    category: string;
}

interface SidebarContentProps {
    isExpanded: boolean;
    groupedItems: Record<string, NavItem[]>;
    expandedCategories: Record<string, boolean>;
    toggleCategory: (category: string) => void;
    handleMouseEnter: () => void;
    handleMouseLeave: () => void;
    user: UserType | null;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
}

// --- Constants & Helpers ---
const ALL_NAV_ITEMS: NavItem[] = [
    // Insights
    { tab: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, category: 'Insights' },
    { tab: 'reports & insights', path: '/reports-insights', label: 'Reports and Insights', icon: <BarChart2 size={20}/>, category: 'Insights' },
    { tab: 'advancedReports', path: '/advancedReports', label: 'Adavanced Reports', icon: <BarChart3 size={20}/>, category: 'Insights' },
    
    // Finance
    { tab: 'incomeAndExpense', path: '/incomeAndExpense', label: 'Income & Expense', icon: <IndianRupee size={20}/>, category: 'Finance' },
    { tab: 'accounts', path: '/accounts', label: 'Accounts', icon: <PieChart size={20}/>, category: 'Finance' }, 
    
    // Sales & CRM
    { tab: 'pipeline', path: '/pipeline', label: 'Pipeline', icon: <Briefcase size={20}/>, category: 'Sales' },
    { tab: 'customers', path: '/customers', label: 'Customers', icon: <Users size={20}/>, category: 'Sales' },
    { tab: 'CrossSelling', path: '/CrossSelling', label: 'Cross Selling', icon: <TrendingUp size={20} />, category: 'Sales' },
    { tab: 'campaign', path: '/campaign', label: 'Campaigns', icon: <Megaphone size={20}/>, category: 'Sales' },
    { tab: 'mutualFunds', path: '/mutualFunds', label: 'Mutual Funds', icon: <HandCoins size={20}/>, category: 'Sales' },    
    { tab: 'policies', path: '/policies', label: 'Policies', icon: <FileText size={20}/>, category: 'Sales' },

    // Operations
    { tab: 'taskManagement', path: '/taskManagement', label: 'Tasks', icon: <ListTodo size={20}/>, category: 'Operations' },
    { tab: 'calendar', path: '/calendar', label: 'Calendar', icon: <CalendarIcon size={20}/>, category: 'Operations' },
    { tab: 'notes', path: '/notes', label: 'Notes', icon: <NotebookText size={20}/>, category: 'Operations' },
    { tab: 'actionHub', path: '/actionHub', label: 'Action Hub', icon: <Zap size={20}/>, category: 'Operations' },
    { tab: 'servicesHub', path: '/servicesHub', label: 'Services', icon: <Wrench size={20}/>, category: 'Operations' },
    { tab: 'location', path: '/location', label: 'Location', icon: <MapPin size={20}/>, category: 'Operations' },
    { tab: 'chatbot', path: '/chatbot', label: 'Chatbot', icon: <MessageSquare size={20}/>, category: 'Operations' },
    
    // Admin
    { tab: 'employees', path: '/employees', label: 'Employees', icon: <UserCog size={20}/>, category: 'Admin' },
    { tab: 'masterData', path: '/masterData', label: 'Master Data', icon: <Database size={20} />, category: 'Admin' }
];

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Insights':
            return <BarChart3 size={16} className="text-blue-500" />;
        case 'Sales':
            return <Users size={16} className="text-green-500" />;
        case 'Finance':
            return <IndianRupee size={16} className="text-emerald-500" />;
        case 'Operations':
            return <Briefcase size={16} className="text-purple-500" />;
        case 'Admin':
            return <UserCog size={16} className="text-orange-500" />;
        default:
            return <Shield size={16} className="text-gray-400" />;
    }
};

// --- Extracted Sidebar Content Component ---
// This sits OUTSIDE the main component to prevent re-mounting and scroll resetting
const SidebarInnerContent: React.FC<SidebarContentProps> = ({ 
    isExpanded, groupedItems, expandedCategories, toggleCategory, 
    handleMouseEnter, handleMouseLeave, user, setIsSidebarOpen, onLogout 
}) => {
    const navigate = useNavigate();

    return (
        <div 
            className={`flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans border-r border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-700 ease-out ${isExpanded ? 'w-72' : 'w-20'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Header */}
            <div className={`flex items-center gap-3 p-4 h-20 border-b border-gray-100 dark:border-gray-800 transition-all duration-700 ease-out ${isExpanded ? 'justify-start px-6' : 'justify-center'}`}>
                {user?.company_logo ? (
                    <button onClick={() => navigate('/masterData/companyMaster')} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                        <img src={user.company_logo} alt="Company Logo" className="w-10 h-10 object-contain" />
                    </button>
                ) : (
                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
                        <Shield className="text-white" size={24} />
                    </div>
                )}
                
                <div className={`overflow-hidden transition-all duration-700 ease-out ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                    <h1 className="text-lg font-bold tracking-tight leading-none whitespace-nowrap">{user?.company || 'Finroots'}</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-hide">
                {Object.entries(groupedItems).map(([category, items]) => {
                    const isOpen = expandedCategories[category];
                    
                    return (
                        <div key={category} className="group">
                            <button 
                                onClick={() => toggleCategory(category)}
                                className={`flex items-center w-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 transition-all duration-200 hover:text-blue-600 ${isExpanded ? 'justify-between px-2' : 'justify-center'}`}
                                title={!isExpanded ? category : ''}
                            >
                                <div className={`flex items-center gap-2 transition-all duration-700 ease-out ${isExpanded ? 'opacity-100' : 'opacity-100'}`}>
                                    {getCategoryIcon(category)}
                                    <span className={`transition-all duration-700 ease-out ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                                        {category}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>
                                ) : (
                                    <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
                                )}
                            </button>
                            
                            <div className={`space-y-1 overflow-hidden transition-all duration-700 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {items.map(item => (
                                    <NavLink
                                        key={item.tab}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            `relative flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap group/item ${
                                                isActive
                                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                                            } ${isExpanded ? 'justify-start' : 'justify-center'}`
                                        }
                                        title={!isExpanded ? item.label : ''}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span className={`transition-transform duration-200 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover/item:scale-105'}`}>
                                                    {item.icon}
                                                </span>
                                                <span className={`transition-all duration-700 ease-out ${isExpanded ? 'opacity-100 ml-1' : 'opacity-0 w-0 hidden'}`}>
                                                    {item.label}
                                                </span>
                                                {isActive && isExpanded && (
                                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <div className={`flex items-center gap-3 p-2 rounded-2xl transition-all duration-700 ease-out ${isExpanded ? 'justify-start bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700' : 'justify-center'}`}>
                    
                    {/* User Profile Link */}
                    <NavLink 
                        to="/profile" 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 flex-1 min-w-0 ${isExpanded ? '' : 'justify-center'}`}
                    >
                        <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md hover:ring-2 ring-blue-500/30 transition-all">
                            {user?.initials || <User size={18}/>}
                        </div>
                        
                        <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-700 ease-out ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                            <p className="text-sm font-semibold truncate hover:text-blue-600 transition-colors">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.role || 'User'}</p>
                        </div>
                    </NavLink>
                    
                    {/* Logout Button (Only visible when expanded) */}
                    {isExpanded && (
                        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Logout">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>

                 {/* Collapsed Logout Button (Fallback) */}
                 {!isExpanded && (
                     <button onClick={onLogout} className="mt-2 w-full p-2 flex justify-center text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main Sidebar Component ---
export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen, onLogout, user, permissions, onHoverChange }) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Insights': true, 'Sales': true, 'Finance': false, 'Operations': false, 'Admin': true
    });

    const isExpanded = isSidebarOpen || isHovered;

    const handleMouseEnter = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsHovered(true);
            if(onHoverChange) onHoverChange(true);
        }, 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovered(false);
        if(onHoverChange) onHoverChange(false);
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({...prev, [category]: !prev[category]}));
    };

    const validItems = useMemo(() => {
        if (!permissions) return [];
        return ALL_NAV_ITEMS.filter(item => permissions[item.tab as AppModule] && permissions[item.tab as AppModule] !== 'none');
    }, [permissions]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, NavItem[]> = {};
        validItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [validItems]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) setIsSidebarOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sidebarRef, setIsSidebarOpen]);

    // Gather props to pass to the extracted component
    const contentProps: SidebarContentProps = {
        isExpanded,
        groupedItems,
        expandedCategories,
        toggleCategory,
        handleMouseEnter,
        handleMouseLeave,
        user,
        setIsSidebarOpen,
        onLogout
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div className={`fixed inset-0 z-[60] md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
            
            {/* Mobile Sidebar */}
            <div ref={sidebarRef} className={`fixed top-0 left-0 h-full z-[70] transform transition-transform duration-700 ease-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarInnerContent {...contentProps} />
            </div>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-all duration-700 ease-out ${isExpanded ? 'w-72' : 'w-20'}`}>
                <SidebarInnerContent {...contentProps} />
            </aside>
        </>
    );
};

export default Sidebar;