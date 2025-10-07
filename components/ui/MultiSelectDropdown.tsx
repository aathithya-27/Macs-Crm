import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  label: string;
  className?: string;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, label, className, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useMemo(() => `multiselect-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() =>
    options.filter(opt => opt.label.toLowerCase().includes(filter.toLowerCase())),
    [options, filter]
  );

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };
  
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredOptions.map(opt => opt.value);
    const newSelected = [...new Set([...selectedValues, ...filteredIds])];
    onChange(newSelected);
  };
  
  const handleClearSelection = () => {
    onChange([]);
  };

  const displayLabel = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    
    const selectedLabels = selectedValues
      .map(val => options.find(opt => opt.value === val)?.label)
      .filter(Boolean);
      
    if (selectedLabels.length === 0) return placeholder;

    return selectedLabels.join(', ');

  }, [selectedValues, options, placeholder]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 py-2 text-left border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center"
      >
        <span className={`truncate ${selectedValues.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            {displayLabel}
        </span>
        <ChevronDown size={16} className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
            className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-72 flex flex-col"
            style={{ width: buttonRef.current?.offsetWidth }}
        >
          <div className="p-2 flex-shrink-0 space-y-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="block w-full h-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
            </div>
            <div className="flex justify-between items-center px-1">
                 <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                    Select All
                </button>
                 <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70"
                >
                    Clear
                </button>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mx-2"></div>
          <ul className="py-1 flex-1 overflow-y-auto">
            {filteredOptions.map(option => (
              <li
                key={option.value}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                onClick={() => handleToggleOption(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  readOnly
                  className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>{option.label}</span>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;