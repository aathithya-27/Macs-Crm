import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Member, Festival, Religion, FestivalDate } from '../types';
import { ChevronLeft, ChevronRight, User as UserIcon, Star as StarIcon, Gift, Users, Plus, Search } from 'lucide-react';
import SearchableSelect from './ui/SearchableSelect.tsx';

// Define the structure for a calendar event
interface CalendarEvent {
  date: Date;
  type: 'Festival' | 'Birthday' | 'Special Occasion';
  title: string;
  description?: string;
  member?: { id: string; name: string };
}

// Props for the main calendar component
interface FestivalCalendarProps {
  allMembers: Member[];
  festivals: Festival[];
  festivalDates: FestivalDate[];
  religions: Religion[];
  onViewMember: (member: Member) => void;
}

// --- Reusable UI Components ---

const Button: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'light' | 'ghost';
    size?: 'small' | 'medium' | 'icon';
    className?: string;
    title?: string;
    disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', size = 'medium', className = '', title, disabled = false }) => {
    const baseClasses = "flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const sizeClasses = {
        small: 'px-2.5 py-1.5 text-xs',
        medium: 'px-4 py-2 text-sm',
        icon: 'p-2',
    };

    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600',
        light: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/50 focus:ring-gray-400',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} title={title}>{children}</button>;
};

const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                    {children}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

// --- Date Helper Functions ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const areDatesEqual = (date1: Date, date2: Date) => date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();

// --- Main FestivalCalendar Component ---

const FestivalCalendar: React.FC<FestivalCalendarProps> = ({ allMembers, festivals, festivalDates, religions, onViewMember }) => {
  const [mainDate, setMainDate] = useState(new Date());
  const [miniCalDate, setMiniCalDate] = useState(new Date());
  const [modalData, setModalData] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const memberOptions = useMemo(() => allMembers.map(m => ({ value: m.id, label: m.name })), [allMembers]);

  // --- MODIFIED Event Processing Logic ---
  const calendarEvents = useMemo(() => {
    let events: CalendarEvent[] = [];
    const membersToProcess = selectedMemberId ? allMembers.filter(m => m.id === selectedMemberId) : allMembers;
    
    // Process festivals
    if (!selectedMemberId) {
        festivalDates.forEach(fd => {
            const festival = festivals.find(f => f.id === fd.festivalId);
            // ADDED CHECK: Ensure both the festival and the specific date are active
            if (festival && festival.active !== false && fd.active !== false) {
                events.push({
                    date: new Date(fd.date),
                    type: 'Festival',
                    title: festival.name,
                    description: religions.find(r => r.id === festival.religionId)?.name || 'General Festival'
                });
            }
        });
    }

    // Process member events (birthdays, etc.) by calculating for the currently viewed year
    membersToProcess.forEach(member => {
      if (member.active) {
        const currentYear = mainDate.getFullYear();
        if (member.dob) {
            const dob = new Date(member.dob);
            dob.setFullYear(currentYear);
            events.push({ date: dob, type: 'Birthday', title: `${member.name}'s Birthday`, member: { id: member.id, name: member.name } });
        }
        (member.otherSpecialOccasions || []).forEach(occasion => {
            const occDate = new Date(occasion.date);
            occDate.setFullYear(currentYear);
            events.push({ date: occDate, type: 'Special Occasion', title: `${member.name} - ${occasion.name}`, member: { id: member.id, name: member.name } });
        });
      }
    });

    return events;
  }, [allMembers, festivals, festivalDates, religions, selectedMemberId, mainDate]);

  const handleDayClick = (date: Date) => {
    const eventsForDay = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return areDatesEqual(eventDate, date);
    });
    setModalData({ date, events: eventsForDay });
  };
  
  const EventBadge: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const colors = {
        Birthday: 'bg-blue-500 text-white',
        Festival: 'bg-green-500 text-white',
        'Special Occasion': 'bg-purple-500 text-white',
    };
    return (
      <div 
        className={`text-xs font-bold px-2 py-0.5 rounded-full truncate cursor-pointer ${colors[event.type]}`}
        title={event.title}
      >
        {event.title}
      </div>
    );
  };

  const MiniCalendar: React.FC = () => {
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const totalDays = getDaysInMonth(year, month);
    const grid = Array(firstDay).fill(null).concat(Array.from({ length: totalDays }, (_, i) => i + 1));

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-gray-800 dark:text-white">{miniCalDate.toLocaleString('default', { month: 'long' })} {year}</p>
                <div className="flex gap-2">
                    <Button onClick={() => setMiniCalDate(new Date(year, month - 1, 1))} variant="ghost" size="icon" className="!p-1"><ChevronLeft size={16} /></Button>
                    <Button onClick={() => setMiniCalDate(new Date(year, month + 1, 1))} variant="ghost" size="icon" className="!p-1"><ChevronRight size={16} /></Button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {daysOfWeek.map((d, i) => <div key={i}>{d}</div>)}
                {grid.map((day, i) => {
                    const date = day ? new Date(year, month, day) : null;
                    return (
                        <button key={i} onClick={() => date && handleDayClick(date)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm 
                                ${!day ? 'cursor-default' : 'hover:bg-gray-200 dark:hover:bg-gray-600'} 
                                text-gray-700 dark:text-gray-300`}>
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
  }

  const MainCalendarHeader = () => {
    const handleNav = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setMainDate(new Date());
            return;
        }
        setMainDate(prev => {
            const newDate = new Date(prev);
            const increment = direction === 'prev' ? -1 : 1;
            if (view === 'month') newDate.setMonth(prev.getMonth() + increment, 1);
            else if (view === 'year') newDate.setFullYear(prev.getFullYear() + increment);
            else if (view === 'week') newDate.setDate(prev.getDate() + (7 * increment));
            else if (view === 'day') newDate.setDate(prev.getDate() + increment);
            return newDate;
        });
    };

    const getHeaderText = () => {
        switch(view) {
            case 'month': return `${mainDate.toLocaleString('default', { month: 'long' })} ${mainDate.getFullYear()}`;
            case 'year': return mainDate.getFullYear();
            case 'week': 
                const startOfWeek = new Date(mainDate);
                startOfWeek.setDate(mainDate.getDate() - mainDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - ${endOfWeek.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}`;
            case 'day': return mainDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            default: return '';
        }
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white">{getHeaderText()}</h3>
                <Button onClick={() => handleNav('prev')} variant="ghost" size="icon"><ChevronLeft size={20} /></Button>
                <Button onClick={() => handleNav('next')} variant="ghost" size="icon"><ChevronRight size={20} /></Button>
                <Button onClick={() => handleNav('today')} variant="secondary" size="small">Today</Button>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button onClick={() => setView('day')} variant={view === 'day' ? 'primary' : 'secondary'} size="small">Day</Button>
                <Button onClick={() => setView('week')} variant={view === 'week' ? 'primary' : 'secondary'} size="small">Week</Button>
                <Button onClick={() => setView('month')} variant={view === 'month' ? 'primary' : 'secondary'} size="small">Month</Button>
                <Button onClick={() => setView('year')} variant={view === 'year' ? 'primary' : 'secondary'} size="small">Year</Button>
            </div>
        </div>
    );
  };

  const MonthView = () => {
    const year = mainDate.getFullYear();
    const month = mainDate.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const daysInCurrentMonth = getDaysInMonth(year, month);

    const prevMonthDays = Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + i + 1);
    const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
    const totalGridCells = 42; // 6 weeks * 7 days
    const nextMonthDaysCount = totalGridCells - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

    const today = new Date();

    return (
        <div className="grid grid-cols-7 grid-rows-6 flex-grow">
            {/* Previous Month Days */}
            {prevMonthDays.map(day => (
                <div key={`prev-${day}`} className="border-t border-l border-gray-200 dark:border-gray-700 p-2 text-gray-400 dark:text-gray-500">
                    <span className="font-semibold text-lg">{day}</span>
                </div>
            ))}
            {/* Current Month Days */}
            {currentMonthDays.map(day => {
                const date = new Date(year, month, day);
                const events = calendarEvents.filter(e => areDatesEqual(new Date(e.date), date));
                const isToday = areDatesEqual(date, today);
                return (
                    <div key={`curr-${day}`} 
                         className={`border-t border-l border-gray-200 dark:border-gray-700 p-2 flex flex-col ${events.length > 0 ? 'cursor-pointer' : ''}`} 
                         onClick={() => handleDayClick(date)}>
                        <span className={`font-semibold text-lg ${isToday ? 'text-indigo-600' : 'text-gray-800 dark:text-gray-200'}`}>{day}</span>
                        <div className="space-y-1 mt-2 overflow-hidden">
                            {events.map((event, i) => <EventBadge key={i} event={event} />)}
                        </div>
                    </div>
                );
            })}
            {/* Next Month Days */}
            {nextMonthDays.map(day => (
                <div key={`next-${day}`} className="border-t border-l border-gray-200 dark:border-gray-700 p-2 text-gray-400 dark:text-gray-500">
                     <span className="font-semibold text-lg">{day}</span>
                </div>
            ))}
        </div>
    );
  };

  const YearView = () => {
    const year = mainDate.getFullYear();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-grow overflow-y-auto p-4">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
                const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long' });
                const firstDay = getFirstDayOfMonth(year, monthIndex);
                const totalDays = getDaysInMonth(year, monthIndex);
                const grid = Array(firstDay).fill(null).concat(Array.from({ length: totalDays }, (_, i) => i + 1));
                return (
                    <div key={monthIndex} className="p-3">
                        <button onClick={() => { setMainDate(new Date(year, monthIndex, 1)); setView('month'); }} className="font-bold text-center w-full mb-2 text-indigo-600 dark:text-indigo-400 hover:underline">{monthName}</button>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                            {grid.map((day, i) => <div key={i} className={`h-6 flex items-center justify-center rounded-full ${day && areDatesEqual(new Date(), new Date(year, monthIndex, day)) ? 'bg-indigo-600 text-white font-bold' : ''}`}>{day}</div>)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };
  
  const DayView = () => {
    const events = calendarEvents.filter(e => areDatesEqual(new Date(e.date), mainDate));
    return (
        <div className="flex-grow flex flex-col p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <div className="space-y-2 overflow-y-auto">
                {events.length > 0 ? (
                    events.map((event, i) => (
                        <div key={i} className="p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                           <EventBadge event={event} />
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center pt-8">No events scheduled for this day.</p>
                )}
            </div>
        </div>
    );
  };

  const WeekView = () => {
    const startOfWeek = new Date(mainDate);
    startOfWeek.setDate(mainDate.getDate() - mainDate.getDay()); // Start from Sunday
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
    });

    return (
        <div className="grid grid-cols-7 flex-grow gap-px bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
            {weekDays.map((date, index) => {
                const events = calendarEvents.filter(e => areDatesEqual(new Date(e.date), date));
                return (
                    <div key={index} className="bg-white dark:bg-gray-800 p-2 overflow-hidden flex flex-col">
                        <span className={`font-semibold text-center mb-2 text-lg ${areDatesEqual(date, new Date()) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {date.getDate()}
                        </span>
                        <div className="space-y-1 overflow-y-auto flex-grow">
                            {events.map((event, i) => <EventBadge key={i} event={event} />)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderView = () => {
    switch(view) {
        case 'month': return <MonthView />;
        case 'year': return <YearView />;
        case 'day': return <DayView />;
        case 'week': return <WeekView />;
        default: return <MonthView />;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 h-full flex gap-6">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col">
            <MiniCalendar />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">People</h3>
                 <SearchableSelect 
                    label=""
                    options={[{ value: 'all', label: 'All People' }, ...memberOptions]}
                    value={selectedMemberId || 'all'}
                    onChange={(val) => setSelectedMemberId(val === 'all' ? null : val)}
                    placeholder="Search for people..."
                />
            </div>
        </div>

        {/* Main Calendar View */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <MainCalendarHeader />
            {(view === 'month' || view === 'week') && <div className="grid grid-cols-7 text-center font-bold text-gray-500 dark:text-gray-400 text-sm py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>}
            {renderView()}
        </div>
        
        {modalData && (
            <Modal 
                isOpen={!!modalData} 
                onClose={() => setModalData(null)}
                title={`Events for ${modalData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
            >
                <div className="space-y-3">
                    {modalData.events.length > 0 ? modalData.events.map((event, index) => (
                        <div key={index} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                            <div className="flex justify-between items-start">
                               <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{event.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{event.type}</p>
                               </div>
                                {event.member && (
                                    <Button size="small" variant="light" onClick={() => { const member = allMembers.find(m => m.id === event.member?.id); if (member) { onViewMember(member); setModalData(null); } }}>
                                        View Client
                                    </Button>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-gray-500 dark:text-gray-400">No events for this day.</p>}
                </div>
            </Modal>
        )}
    </div>
  );
};

export default FestivalCalendar;