import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Member, VoiceNote, User, Lead, Branch, Designation, AppModule, PermissionLevel, Role, Task } from '../types.ts';
import { searchVoiceNotes, SearchResult, summarizeTranscript, transcribeAudioToEnglish, summarizeManualText } from '../services/geminiService.ts';
import Button from './ui/Button.tsx';
import { NotebookText, Search, BrainCircuit, Loader2, Calendar, Download, FileText, ArrowLeft, Mic, StopCircle, Save, X, Brain, PlusCircle, Trash2, Tag, Languages, RefreshCw, XCircle, PencilLine, Settings2, User as UserIcon, CheckCircle, GripVertical, List, Briefcase, ChevronDown } from 'lucide-react';
import Input from './ui/Input.tsx';
import Pagination from './ui/Pagination.tsx';

// SpeechRecognition types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

type ScribeStatus = 'idle' | 'recording' | 'transcribing' | 'summarizing' | 'error' | 'done';
type SearchMode = 'ai' | 'advanced';
type CreatorMode = 'voice' | 'manual';
type AdminViewMode = 'date' | 'client';

type NoteGroup = {
    memberName: string;
    notes: {
        note: VoiceNote;
        highlights: string[];
        memberId: string;
        creator?: User; // --- MODIFICATION: Added creator ---
    }[];
};

const ITEMS_PER_PAGE = 10;

const NoteCard = ({ note, memberName, memberId, highlights = [], onCreateTaskFromActionItem, onDismissActionItem, creator }: { note: VoiceNote, memberName: string, memberId: string, highlights: string[], onCreateTaskFromActionItem: (memberId: string, memberName: string, noteId: string, actionItemText: string) => void, onDismissActionItem: (memberId: string, noteId: string, actionItemText: string) => void, creator?: User }) => {
    
    const highlightText = (text: string, highlights: string[]) => {
      if (!highlights || highlights.length === 0) return text;
     
      const regex = new RegExp(`(${highlights.join('|')})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, i) =>
            regex.test(part) ? (
              <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/70 rounded px-1 py-0.5 text-black">{part}</mark>
            ) : ( part )
          )}
        </>
      );
    };

    const downloadAudio = (audioUrl: string | undefined, filename: string) => {
        if(!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const downloadTranscript = (summary: string, filename: string) => {
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
                   
        a.href = url;
        a.download = filename.replace(/\.[^/.]+$/, ".txt");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 animate-fade-in flex flex-col">
            <div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-brand-primary dark:text-blue-400">
                    <UserIcon size={14} />
                    <span>{memberName}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{new Date(note.recording_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
            
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">
                {highlightText(note.summary, highlights)}
            </p>
            
            {note.audioUrl && (
                <div className="mt-4">
                    <audio src={note.audioUrl} controls className="w-full h-10" />
                </div>
            )}
            {note.actionItems && note.actionItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                    <h4 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-2">Detected Action Items</h4>
                    <ul className="space-y-2">
                        {note.actionItems.map((item, index) => (
                            <li key={index} className="flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                <span>- {item}</span>
                                <div className="flex items-center gap-1">
                                    <Button size="small" variant="light" onClick={() => onCreateTaskFromActionItem(memberId, memberName, note.id, item)}>
                                        <PlusCircle size={14} /> Create Task
                                    </Button>
                                    <Button size="small" variant="danger" className="!p-2" onClick={() => onDismissActionItem(memberId, note.id, item)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* --- MODIFICATION BEGINS --- */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap justify-between items-center gap-2">
                <div className="flex gap-2">
                    <Button size="small" variant="light" onClick={() => downloadAudio(note.audioUrl, note.filename)} disabled={!note.audioUrl}>
                        <Download size={14} /> Audio
                    </Button>
                    <Button size="small" variant="light" onClick={() => downloadTranscript(note.summary || note.transcript_snippet, note.filename)}>
                        <FileText size={14} /> Summary
                    </Button>
                </div>
                {creator && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <span>Created by:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{creator.name}</span>
                        {creator.profile?.status === 'Inactive' && <span className="w-2 h-2 bg-red-500 rounded-full" title="Inactive Employee"></span>}
                    </div>
                )}
            </div>
            {/* --- MODIFICATION ENDS --- */}
        </div>
    );
};


interface NotesPageProps {
  members: Member[];
  leads: Lead[];
  onSaveMember: (member: Member, closeModal?: boolean) => void;
  onSaveLeadNote: (leadId: string, newNote: VoiceNote) => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
  currentUser: User | null;
  users: User[];
  Branches: Branch[];
  designations: Designation[];
  permissions: { [key in AppModule]?: PermissionLevel };
  roles: Role[];
}


const NotesPage: React.FC<NotesPageProps> = ({ 
    members, leads, onSaveMember, onSaveLeadNote, onCreateTask, addToast, 
    currentUser, users, Branches, designations, permissions, roles
}) => {
    const [creatorMode, setCreatorMode] = useState<CreatorMode>('voice');
    const [scribeStatus, setScribeStatus] = useState<ScribeStatus>('idle');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [manualNote, setManualNote] = useState('');
    const [isSummarizingManual, setIsSummarizingManual] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<any | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [searchMode, setSearchMode] = useState<SearchMode>('ai');
    const [adminViewMode, setAdminViewMode] = useState<AdminViewMode>('date');
    const [aiSearchQuery, setAiSearchQuery] = useState('');
    const [advSearchFilters, setAdvSearchFilters] = useState({ keyword: '', startDate: '', endDate: '' });
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [advisorFilter, setAdvisorFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    
    const { selectedClient, isLead } = useMemo(() => {
        if (!selectedClientId) return { selectedClient: null, isLead: false };
        const [type, id] = selectedClientId.split(':');
        if (type === 'member') {
            return { selectedClient: members.find(m => m.id === id), isLead: false };
        }
        if (type === 'lead') {
            return { selectedClient: leads.find(l => l.id === id), isLead: true };
        }
        return { selectedClient: null, isLead: false };
    }, [selectedClientId, members, leads]);
    
    const canCreateNote = useMemo(() => {
        if (!selectedClient || !currentUser) {
            return false;
        }
        
        const requiredPermission = isLead ? permissions?.pipeline : permissions?.customers;
        return requiredPermission === 'create' || requiredPermission === 'modify';
        
    }, [selectedClient, currentUser, isLead, permissions]);

    const membersForDropdown = useMemo(() => {
        const userRole = roles.find(r => r.id === currentUser?.roleId);
        const hasViewAllPermission = permissions?.customers === 'view' || permissions?.customers === 'create' || permissions?.customers === 'modify';

        if (hasViewAllPermission && !userRole?.isAdvisor) {
            return members.filter(m => m.active);
        }
        if (userRole?.isAdvisor) {
            return members.filter(member => member.active && (member.assignedTo || []).includes(currentUser!.id));
        }
        return [];
    }, [members, currentUser, roles, permissions]);
    
    const clientsForDropdown = useMemo(() => {
        const memberOptions = membersForDropdown.map(m => ({ value: `member:${m.id}`, label: m.name, type: 'Customer' }));
        
        const userRole = roles.find(r => r.id === currentUser?.roleId);
        const hasViewAllLeads = permissions?.pipeline === 'view' || permissions?.pipeline === 'create' || permissions?.pipeline === 'modify';

        const leadOptions = (leads || [])
            .filter(l => l.status !== 'Won' && l.status !== 'Lost' && (hasViewAllLeads && !userRole?.isAdvisor || l.assignedTo === currentUser?.id))
            .map(l => ({ value: `lead:${l.id}`, label: l.name, type: 'Lead' }));
            
        return [...memberOptions, ...leadOptions].sort((a, b) => a.label.localeCompare(b.label));
    }, [membersForDropdown, leads, currentUser, roles, permissions]);

    useEffect(() => {
        return () => {
          if (audioURL) URL.revokeObjectURL(audioURL);
          mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
          recognitionRef.current?.stop();
        };
    }, [audioURL]);

    const resetCreatorState = useCallback(() => {
        if (audioURL) URL.revokeObjectURL(audioURL);
        setScribeStatus('idle');
        setLiveTranscript('');
        setAudioURL('');
        setManualNote('');
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
        recognitionRef.current?.stop();
    }, [audioURL]);

    const startRecording = useCallback(async () => {
        if (scribeStatus !== 'idle' && scribeStatus !== 'error') return;
        if (!selectedClient) return addToast('Please select a client or lead first.', 'error');
        resetCreatorState();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm;codecs=opus' };
            mediaRecorderRef.current = new MediaRecorder(stream, options);
            audioChunksRef.current = [];

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.onresult = (event: any) => {
                    let interim = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) interim += event.results[i][0].transcript;
                    setLiveTranscript(interim);
                };
                recognitionRef.current.start();
            }

            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                stream.getTracks().forEach(track => track.stop());
                recognitionRef.current?.stop();

                setScribeStatus('transcribing');
                try {
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        const transcript = await transcribeAudioToEnglish(base64Audio, options.mimeType, addToast);
                        
                        if (!transcript || transcript.toLowerCase().includes('error')) throw new Error(transcript || "Transcription failed.");
                        
                        const previousSummaries = selectedClient.voiceNotes?.map(n => n.summary) || [];
                        setScribeStatus('summarizing');
                        const summaryResult = await summarizeTranscript(transcript, selectedClient.name || 'Unassigned', previousSummaries, addToast);
                        
                        if (!summaryResult) throw new Error("Summarization failed.");

                        const newNote: VoiceNote = {
                            ...summaryResult,
                            id: `note-${Date.now()}`,
                            filename: `${selectedClient.name.replace(/\s/g, '') || 'Client'}Rec-${(selectedClient.voiceNotes?.length || 0) + 1}.webm`,
                            audioUrl: url,
                            transcript_snippet: transcript,
                            createdBy: currentUser?.id,
                        };
                        
                        if (isLead) {
                            onSaveLeadNote(selectedClient.id, newNote);
                        } else {
                            const updatedMember = { ...selectedClient, voiceNotes: [...(selectedClient.voiceNotes || []), newNote] };
                            onSaveMember(updatedMember as Member, false);
                        }
                        addToast(`Note saved for ${selectedClient.name}.`, 'success');
                        resetCreatorState();
                    };
                } catch (e) {
                    addToast((e as Error).message, 'error');
                    setScribeStatus('error');
                }
            };
            mediaRecorderRef.current.start();
            setScribeStatus('recording');
        } catch (err) {
            addToast("Microphone access denied. Please enable it in browser settings.", "error");
            setScribeStatus('error');
        }
    }, [scribeStatus, resetCreatorState, selectedClient, isLead, addToast, onSaveMember, onSaveLeadNote, currentUser]);

    const stopRecording = useCallback(() => {
        if (scribeStatus === 'recording' && mediaRecorderRef.current) mediaRecorderRef.current.stop();
    }, [scribeStatus]);

    const handleSaveManualNote = async (summarize: boolean) => {
        if (!selectedClient) return addToast("Please select a client.", 'error');
        if (!manualNote.trim()) return addToast("Note content cannot be empty.", 'error');

        let noteToSave: Partial<VoiceNote> = {};
        if (summarize) {
            setIsSummarizingManual(true);
            const summaryResult = await summarizeManualText(manualNote, selectedClient.name, addToast);
            noteToSave = { ...summaryResult, transcript_snippet: manualNote };
            setIsSummarizingManual(false);
        } else {
            noteToSave = {
                summary: manualNote,
                transcript_snippet: manualNote,
                client: selectedClient.name,
                recording_date: new Date().toISOString(),
                detected_language: 'Manual',
                tags: ['manual-note'],
                status: 'Completed',
                actionItems: [],
            };
        }
        
        const newNote: VoiceNote = {
            ...noteToSave,
            id: `note-${Date.now()}`,
            filename: `ManualNote-${Date.now()}.txt`,
            audioUrl: '',
            createdBy: currentUser?.id,
        } as VoiceNote;
        
        if (isLead) {
            onSaveLeadNote(selectedClient.id, newNote);
        } else {
            const updatedMember = { ...selectedClient, voiceNotes: [...(selectedClient.voiceNotes || []), newNote] };
            onSaveMember(updatedMember as Member, false);
        }
        addToast(`Manual note saved for ${selectedClient.name}.`, 'success');
        resetCreatorState();
    };

    // --- MODIFICATION BEGINS ---
    const allNotesWithContext = useMemo(() => {
        const userLookup = new Map(users.map(u => [u.id, u]));
        const memberNotes = members.flatMap(member => 
            (member.voiceNotes || []).map(note => ({
                note,
                isLead: false,
                memberName: member.name,
                memberId: member.id,
                member: member,
                creator: userLookup.get(note.createdBy || ''),
            }))
        );
        const leadNotes = (leads || []).flatMap(lead => 
            (lead.voiceNotes || []).map(note => ({
                note,
                isLead: true,
                memberName: lead.name,
                memberId: lead.id,
                member: lead as any,
                creator: userLookup.get(note.createdBy || ''),
            }))
        );
        return [...memberNotes, ...leadNotes]
            .sort((a, b) => new Date(b.note.recording_date).getTime() - new Date(a.note.recording_date).getTime());
    }, [members, leads, users]);
    // --- MODIFICATION ENDS ---
    
    const visibleNotesForUser = useMemo(() => {
        if (!currentUser) return [];
        const userRole = roles.find(r => r.id === currentUser.roleId);
        const hasViewAllPermission = (permissions?.customers === 'view' || permissions?.customers === 'create' || permissions?.customers === 'modify') && 
                                   (permissions?.pipeline === 'view' || permissions?.pipeline === 'create' || permissions?.pipeline === 'modify');

        if (hasViewAllPermission && !userRole?.isAdvisor) {
            return allNotesWithContext;
        }

        if (userRole?.isAdvisor) {
            const assignedMemberIds = new Set(
                members
                    .filter(m => (m.assignedTo || []).includes(currentUser.id))
                    .map(m => m.id)
            );
            const assignedLeadIds = new Set(
                (leads || [])
                    .filter(l => l.assignedTo === currentUser.id)
                    .map(l => l.id)
            );
            return allNotesWithContext.filter(item => 
                item.isLead 
                    ? assignedLeadIds.has(item.memberId) 
                    : assignedMemberIds.has(item.memberId)
            );
        }
        return [];
    }, [allNotesWithContext, currentUser, members, leads, roles, permissions]);


    const handleSearch = useCallback(async () => {
        setIsSearching(true);
        setSearchPerformed(!!aiSearchQuery.trim());
        if (!aiSearchQuery.trim()) {
            setSearchResults(null);
        } else {
            const notesToSearch = visibleNotesForUser.map(item => ({
                noteId: item.note.id, clientName: item.memberName, summary: item.note.summary, recording_date: item.note.recording_date,
            }));
            const results = await searchVoiceNotes(aiSearchQuery, notesToSearch, addToast);
            setSearchResults(results);
        }
        setIsSearching(false);
    }, [aiSearchQuery, visibleNotesForUser, addToast]);
    
    const handleClearSearch = useCallback(() => {
        setAiSearchQuery('');
        setAdvSearchFilters({ keyword: '', startDate: '', endDate: '' });
        setSearchPerformed(false);
        setSearchResults(null);
        setAdvisorFilter('all');
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };
    
    // --- MODIFICATION BEGINS ---
    const noteTakers = useMemo(() => {
        const userRole = roles.find(r => r.id === currentUser?.roleId);
        const hasManagementPermission = (permissions?.customers === 'create' || permissions?.customers === 'modify') && !userRole?.isAdvisor;
        if (!hasManagementPermission) return [];
        
        const advisorRoleIds = new Set(roles.filter(r => r.isAdvisor).map(r => r.id));
        return users.filter(user => user.roleId && advisorRoleIds.has(user.roleId));
    }, [users, currentUser, roles, permissions]);
    // --- MODIFICATION ENDS ---

    useEffect(() => {
        setCurrentPage(1);
    }, [searchMode, aiSearchQuery, advSearchFilters, advisorFilter, adminViewMode]);

    const displayedNotes = useMemo(() => {
        let notesToDisplay;
        if (searchMode === 'ai') {
            if (!searchPerformed || searchResults === null) {
                notesToDisplay = visibleNotesForUser.map(item => ({...item, highlights: []}));
            } else {
                const resultsMap = new Map(searchResults.map(r => [r.noteId, r.matchedText]));
                notesToDisplay = visibleNotesForUser.filter(item => resultsMap.has(item.note.id)).map(item => ({ ...item, highlights: resultsMap.get(item.note.id) || [] }));
            }
        } else {
            notesToDisplay = visibleNotesForUser.filter(({note}) => {
                const keywordMatch = !advSearchFilters.keyword || (note.summary || '').toLowerCase().includes(advSearchFilters.keyword.toLowerCase()) || (note.transcript_snippet || '').toLowerCase().includes(advSearchFilters.keyword.toLowerCase());
                const noteDate = new Date(note.recording_date);
                const startDate = advSearchFilters.startDate ? new Date(advSearchFilters.startDate) : null;
                const endDate = advSearchFilters.endDate ? new Date(advSearchFilters.endDate) : null;
                if(startDate) startDate.setHours(0,0,0,0);
                if(endDate) endDate.setHours(23,59,59,999);
                const startDateMatch = !startDate || noteDate >= startDate;
                const endDateMatch = !endDate || noteDate <= endDate;
                return keywordMatch && startDateMatch && endDateMatch;
            }).map(item => ({...item, highlights: advSearchFilters.keyword ? [advSearchFilters.keyword] : []}));
        }

        const userRole = roles.find(r => r.id === currentUser?.roleId);
        const hasFilterPermission = (permissions?.customers === 'create' || permissions?.customers === 'modify') && !userRole?.isAdvisor;
        if (hasFilterPermission && advisorFilter !== 'all') {
            return notesToDisplay.filter(item => item.note.createdBy === advisorFilter);
        }

        return notesToDisplay;
    }, [searchMode, searchResults, visibleNotesForUser, searchPerformed, advSearchFilters, currentUser, advisorFilter, roles, permissions]);
    
    const notesGroupedByClient = useMemo(() => {
        const userRole = roles.find(r => r.id === currentUser?.roleId);
        const hasGroupViewPermission = (permissions?.customers === 'create' || permissions?.customers === 'modify') && !userRole?.isAdvisor;
        if (adminViewMode === 'client' && hasGroupViewPermission) {
            type GroupedNotes = Record<string, NoteGroup>;
            const initialValue: GroupedNotes = {};
            
            return displayedNotes.reduce((acc: GroupedNotes, { note, memberName, memberId, highlights, creator }) => {
                if (!acc[memberId]) {
                    acc[memberId] = { memberName, notes: [] };
                }
                acc[memberId].notes.push({ note, highlights, memberId, creator });
                return acc;
            }, initialValue);
        }
        return null;
    }, [adminViewMode, displayedNotes, currentUser, roles, permissions]);

    const totalPages = Math.ceil((notesGroupedByClient ? Object.keys(notesGroupedByClient).length : displayedNotes.length) / ITEMS_PER_PAGE);
    const currentNotes = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        if (notesGroupedByClient) {
            return Object.entries(notesGroupedByClient).slice(startIndex, endIndex);
        }
        return displayedNotes.slice(startIndex, endIndex);
    }, [currentPage, displayedNotes, notesGroupedByClient]);
    
     const handleDismissActionItem = useCallback((clientId: string, noteId: string, actionItemText: string) => {
        const member = members.find(m => m.id === clientId);
        if (member) {
            const updatedNotes = (member.voiceNotes || []).map(note => {
                if (note.id === noteId) {
                    return {
                        ...note,
                        actionItems: (note.actionItems || []).filter(item => item !== actionItemText)
                    };
                }
                return note;
            });
            onSaveMember({ ...member, voiceNotes: updatedNotes }, false);
            addToast('Action item dismissed.', 'success');
        }
    }, [members, onSaveMember, addToast]);

    const handleCreateTaskFromActionItem = useCallback((clientId: string, clientName: string, noteId: string, actionItemText: string) => {
        onCreateTask({
            triggeringPoint: 'Voice Note Action Item',
            taskDescription: actionItemText,
            expectedCompletionDateTime: new Date().toISOString(),
            memberId: clientId,
            taskType: 'Manual',
            isCompleted: false,
        });
        handleDismissActionItem(clientId, noteId, actionItemText);
    }, [onCreateTask, handleDismissActionItem]);

    const ClientSearchableSelect = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [filter, setFilter] = useState('');
        const wrapperRef = useRef<HTMLDivElement>(null);

        const selectedOption = clientsForDropdown.find(opt => opt.value === selectedClientId);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) { setIsOpen(false); }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const filteredOptions = clientsForDropdown.filter(opt => {
            const searchLabel = `${opt.label} (${opt.type})`.toLowerCase();
            return searchLabel.includes(filter.toLowerCase())
        });

        const handleSelect = (optionValue: string) => {
            setSelectedClientId(optionValue);
            setIsOpen(false);
            setFilter('');
        };
        
        const getAssigneeName = () => {
            if (!selectedClient) return null;
            const userMap = new Map(users.map(u => [u.id, u.name]));
            if (isLead) {
                const lead = selectedClient as Lead;
                return userMap.get(lead.assignedTo) || 'Unassigned';
            } else {
                const member = selectedClient as Member;
                if (!member.assignedTo || member.assignedTo.length === 0) return 'Unassigned';
                return member.assignedTo.map(id => userMap.get(id)).join(', ');
            }
        };

        const assigneeName = getAssigneeName();

        return (
            <div className="space-y-2">
                 <div ref={wrapperRef} className="relative w-full md:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full h-10 px-3 py-2 text-left border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center"
                    >
                        <span className={selectedOption ? 'text-gray-900 dark:text-white flex items-center gap-2' : 'text-gray-500 dark:text-gray-400'}>
                             {selectedOption ? (
                                <>
                                    {selectedOption.type === 'Customer' ? <UserIcon size={14} className="text-gray-500" /> : <Briefcase size={14} className="text-gray-500" />}
                                    {selectedOption.label} <span className="text-xs text-gray-400">({selectedOption.type})</span>
                                </>
                             ) : '-- Select a Client or Lead --'}
                        </span>
                        <ChevronDown size={16} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-72 flex flex-col">
                            <div className="p-2 flex-shrink-0">
                                <Input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <ul className="flex-1 overflow-y-auto">
                                {filteredOptions.map(option => (
                                    <li key={option.value} onClick={() => handleSelect(option.value)}
                                        className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${selectedClientId === option.value ? 'bg-blue-100 dark:bg-blue-900/50 font-semibold' : ''}`}>
                                        {option.type === 'Customer' ? <UserIcon size={14} className="text-gray-500" /> : <Briefcase size={14} className="text-gray-500" />}
                                        {option.label} <span className="text-xs text-gray-400">({option.type})</span>
                                    </li>
                                ))}
                                {filteredOptions.length === 0 && <li className="px-4 py-2 text-sm text-gray-500">No matches found.</li>}
                            </ul>
                        </div>
                    )}
                </div>
                {assigneeName && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
                        Assigned to: <span className="font-semibold text-gray-700 dark:text-gray-300">{assigneeName}</span>
                    </div>
                )}
            </div>
        );
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Client Notes Hub</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Record, summarize, search, and manage all client voice notes in one place.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                 <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                    <Brain size={20} className="text-brand-primary"/>
                    Create New Note
                </h2>

                <div className="mb-4">
                    <ClientSearchableSelect />
                </div>
                
                {selectedClientId && !canCreateNote && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-md text-sm mb-4">
                        Note creation is restricted. You need 'Create' or 'Modify' permission for this client's module.
                    </div>
                )}
                
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
                   <button onClick={() => setCreatorMode('voice')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${creatorMode === 'voice' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/60'}`}><Mic size={16}/> Voice Note</button>
                   <button onClick={() => setCreatorMode('manual')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${creatorMode === 'manual' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/60'}`}><PencilLine size={16}/> Manual Note</button>
                </div>

                {creatorMode === 'voice' && (
                    <div className="p-4 border-2 border-dashed dark:border-gray-700 rounded-lg animate-fade-in">
                        <div className="flex items-center gap-4">
                            <Button onClick={scribeStatus === 'recording' ? stopRecording : startRecording} variant={scribeStatus === 'recording' ? 'danger' : 'primary'} disabled={!canCreateNote || !selectedClientId || scribeStatus === 'transcribing' || scribeStatus === 'summarizing'}>
                                {scribeStatus === 'recording' ? <StopCircle size={18} /> : <Mic size={18} />} {scribeStatus === 'recording' ? 'Stop' : 'Record'}
                            </Button>
                            {scribeStatus === 'error' && <Button variant="secondary" onClick={resetCreatorState}><RefreshCw size={16}/> Try Again</Button>}
                        </div>
                        {scribeStatus === 'recording' && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{liveTranscript || <span className="text-gray-400">Listening...</span>}</p>}
                    </div>
                )}
                {creatorMode === 'manual' && (
                    <div className="p-4 border-2 border-dashed dark:border-gray-700 rounded-lg animate-fade-in">
                        <textarea value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="Type your note here..." className="w-full h-32 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600" disabled={!canCreateNote || isSummarizingManual}></textarea>
                        <div className="flex justify-end gap-2 mt-2">
                           <Button onClick={() => handleSaveManualNote(false)} variant="secondary" disabled={!canCreateNote || !selectedClientId || !manualNote || isSummarizingManual}>Save Note</Button>
                           <Button onClick={() => handleSaveManualNote(true)} variant="primary" disabled={!canCreateNote || !selectedClientId || !manualNote || isSummarizingManual}>
                               {isSummarizingManual ? <Loader2 className="animate-spin" /> : <Brain size={16}/>} Save & Summarize
                           </Button>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                       <button onClick={() => setSearchMode('ai')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchMode === 'ai' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}><BrainCircuit size={14}/> AI Search</button>
                       <button onClick={() => setSearchMode('advanced')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchMode === 'advanced' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}><Settings2 size={14}/> Advanced</button>
                   
                    </div>
                    
                     
                     {(() => {
                        const userRole = roles.find(r => r.id === currentUser?.roleId);
                        return (permissions?.customers === 'create' || permissions?.customers === 'modify') && !userRole?.isAdvisor;
                     })() && (
                        <div className="my-4 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label htmlFor="advisor-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Employee:</label>
                                {/* --- MODIFICATION BEGINS --- */}
                                <select id="advisor-filter" value={advisorFilter} onChange={(e) => setAdvisorFilter(e.target.value)} className="block w-full md:w-auto px-3 py-1 border border-gray-300 rounded-lg shadow-sm text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="all">All Employees</option>
                                    {noteTakers.map(user => <option key={user.id} value={user.id}>{user.name} {user.profile?.status === 'Inactive' ? '🔴' : ''}</option>)}
                                </select>
                                {/* --- MODIFICATION ENDS --- */}
                            </div>
                            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-md">
                                <button onClick={() => setAdminViewMode('date')} className={`p-1.5 rounded-md ${adminViewMode === 'date' ? 'bg-white dark:bg-gray-700' : ''}`}><List size={16}/></button>
                                <button onClick={() => setAdminViewMode('client')} className={`p-1.5 rounded-md ${adminViewMode === 'client' ? 'bg-white dark:bg-gray-700' : ''}`}><GripVertical size={16}/></button>
                            </div>
                        </div>
                    )}

                    {searchMode === 'ai' ? (
                        <div className="animate-fade-in flex flex-col md:flex-row items-stretch md:items-center gap-3">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BrainCircuit className="h-5 w-5 text-gray-400" /></div>
                                <input
                                    type="text"
                                    placeholder="Search summaries with AI (e.g., 'notes from last week')"
                                    className="block w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    value={aiSearchQuery}
                                    onChange={(e) => setAiSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSearching}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={isSearching}>{isSearching ? <><Loader2 className="animate-spin" size={16}/> Searching...</> : <><Search size={16}/> Search Notes</>}</Button>
                        </div>
                    ) : (
                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-2 border-dashed dark:border-gray-700 rounded-lg">
                            <Input label="Keyword" placeholder="Search in summary/transcript" value={advSearchFilters.keyword} onChange={(e) => setAdvSearchFilters(f => ({...f, keyword: e.target.value}))}/>
                            <Input label="Start Date" type="date" value={advSearchFilters.startDate} onChange={(e) => setAdvSearchFilters(f => ({...f, startDate: e.target.value}))}/>
                            <Input label="End Date" type="date" value={advSearchFilters.endDate} onChange={(e) => setAdvSearchFilters(f => ({...f, endDate: e.target.value}))}/>
                        </div>
                    )}

                    {(searchPerformed || (searchMode === 'advanced' && (advSearchFilters.keyword || advSearchFilters.startDate || advSearchFilters.endDate))) && (
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                                Found {displayedNotes.length} result{displayedNotes.length !== 1 ? 's' : ''}.
                            </p>
                            <Button onClick={handleClearSearch} variant="secondary"><ArrowLeft size={16} /> Clear Search</Button>
                        </div>
                    )}
                </div>

                {isSearching ? (
                    <div className="flex flex-col items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /><span className="mt-4 text-lg text-gray-600 dark:text-gray-300">Searching with Gemini...</span></div>
                ) : (notesGroupedByClient ? Object.keys(notesGroupedByClient).length : displayedNotes.length) > 0 ? (
                    (() => {
                        const userRole = roles.find(r => r.id === currentUser?.roleId);
                        return (permissions?.customers === 'create' || permissions?.customers === 'modify') && !userRole?.isAdvisor;
                    })() && notesGroupedByClient ? (
                        <div className="space-y-8 mt-6">
                            {currentNotes.map(([memberId, group]: [string, any]) => (
                                <div key={memberId}>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white pb-2 mb-4 border-b-2 border-brand-primary">{group.memberName}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {group.notes.map(({ note, highlights, memberId, creator }: any) => (
                                            <NoteCard key={note.id} note={note} memberName={group.memberName} memberId={memberId} highlights={highlights} onCreateTaskFromActionItem={handleCreateTaskFromActionItem} onDismissActionItem={handleDismissActionItem} creator={creator} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            {(currentNotes as any[]).map(({ note, memberName, memberId, highlights, creator }) => (
                                <NoteCard key={note.id} note={note} memberName={memberName} memberId={memberId} highlights={highlights} onCreateTaskFromActionItem={handleCreateTaskFromActionItem} onDismissActionItem={handleDismissActionItem} creator={creator} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        <NotebookText size={48} className="mx-auto text-gray-300 dark:text-gray-600"/>
                        <p className="mt-4 text-lg font-semibold">{searchPerformed ? 'No Matching Notes Found' : 'No Notes Yet'}</p>
                        <p className="mt-1 text-sm">{searchPerformed ? 'Try a different search term or filter.' : 'Add a note to a customer to see it here.'}</p>
                    </div>
                )}

                 {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={notesGroupedByClient ? Object.keys(notesGroupedByClient).length : displayedNotes.length}
                    />
                )}
            </div>
        </div>
    );
};

export default NotesPage;