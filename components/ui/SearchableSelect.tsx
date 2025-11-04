import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, PlusCircle, X } from 'lucide-react';
import Input from './Input.tsx'; // Placeholder, adjust import path if necessary

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  onCreate?: (newValue: string) => void;
  placeholder?: string;
  filterPlaceholder?: string;
  disabled?: boolean;
  isMulti?: boolean;
  maxHeight?: string;
}

const DropdownMenu = ({
  options,
  filter,
  setFilter,
  filterPlaceholder,
  onSelect,
  onCreate,
  showCreateOption,
  selectedValue,
  onClose,
  triggerRef,
  maxHeight,
}: {
  options: Option[];
  filter: string;
  setFilter: (value: string) => void;
  filterPlaceholder?: string;
  onSelect: (value: string) => void;
  onCreate: () => void;
  showCreateOption: boolean;
  selectedValue: string | string[];
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  maxHeight?: string;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown); 
    };
  }, [onClose, triggerRef]); // Dependency array ensures effect re-runs if onClose/triggerRef changes



  return (
    <div 
      ref={dropdownRef}
      style={{maxHeight: maxHeight || '18rem'}}
      className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 flex flex-col mt-1"
    >
      <div className="p-2 flex-shrink-0">
        <Input
          type="text"
          placeholder={filterPlaceholder || 'Filter...'}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {showCreateOption && (
            <li
              onClick={onCreate}
              className="px-4 py-2 text-sm text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/50 cursor-pointer flex items-center gap-2"
            >
              <PlusCircle size={14}/> Create "{filter.trim()}"
            </li>
          )}
          {options.map((option, index) => (
            <li
              key={`${option.value}-${index}`}
              onClick={() => onSelect(option.value)}
              className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                (Array.isArray(selectedValue) ? selectedValue.includes(option.value) : selectedValue === option.value) 
                ? 'bg-blue-100 dark:bg-blue-900/50 font-semibold' 
                : ''
              }`}
            >
              {option.label}
            </li>
          ))}
          {options.length === 0 && !showCreateOption && <li className="px-4 py-2 text-sm text-gray-500">No options found.</li>}
        </ul>
      </div>
    </div>
  );
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, options, value, onChange, onCreate, placeholder, filterPlaceholder, disabled = false, isMulti = false, maxHeight,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedValues = useMemo(() => Array.isArray(value) ? value : (value ? [value] : []), [value]);


  
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(filter.toLowerCase()) &&
    !(isMulti && selectedValues.includes(opt.value))
  );

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      onChange([...selectedValues, optionValue]);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
    setFilter('');
  };

  const handleRemove = (valueToRemove: string) => {
    if (isMulti) {
        onChange(selectedValues.filter(v => v !== valueToRemove));
    }
  };
  
  const handleCreate = () => {
    if (onCreate && filter.trim()) {
      onCreate(filter.trim());
      setIsOpen(false);
      setFilter('');
    }
  };

  const showCreateOption = onCreate && filter.trim() && !options.some(opt => opt.label.toLowerCase() === filter.trim().toLowerCase());

  const getDisplayValue = () => {
    if (isMulti) {
      if (selectedValues.length === 0) return <span className="text-gray-500">{placeholder || 'Select...'}</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.map(val => {
            const option = options.find(o => o.value === val);
            return (
              <span key={val} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5">
                {option?.label || val}
                {!disabled && <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(val); }} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"><X size={12} /></button>}
              </span>
            );
          })}
        </div>
      );
    }
    const selectedOption = options.find(o => o.value === value);
    return selectedOption ? <span className="text-gray-900 dark:text-white">{selectedOption.label}</span> : <span className="text-gray-500">{placeholder || 'Select...'}</span>;
  };

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className="w-full min-h-[40px] px-3 py-2 text-left border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-700/50"
      >
        <span className="flex-1">{getDisplayValue()}</span>
        <ChevronDown size={16} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <DropdownMenu
          options={filteredOptions}
          filter={filter}
          setFilter={setFilter}
          filterPlaceholder={filterPlaceholder}
          onSelect={handleSelect}
          onCreate={handleCreate}
          showCreateOption={!!showCreateOption}
          selectedValue={value}
          onClose={() => setIsOpen(false)}
          triggerRef={buttonRef}
          maxHeight={maxHeight}
        />
      )}
    </div>
  );
};

export default SearchableSelect;
