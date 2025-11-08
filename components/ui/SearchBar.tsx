import React from 'react';
import { Search } from 'lucide-react';
import Input from './Input';

interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    placeholder?: string;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    onSearchChange,
    placeholder = "Search...",
    className = "w-full md:w-1/2"
}) => {
    return (
        <form onSubmit={(e) => e.preventDefault()} className={`relative flex-grow ${className}`}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
                label=""
                type="search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
        </form>
    );
};

export default SearchBar;