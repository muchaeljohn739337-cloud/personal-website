'use client';

// eslint-disable-next-line import/no-unresolved
import { cn } from '@/lib/utils/cn';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  group?: string;
}

interface EnhancedDropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  multiSelect?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  maxHeight?: string;
  position?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  showIcons?: boolean;
  groupBy?: boolean;
  emptyMessage?: string;
  onSearch?: (query: string) => void;
}

export function EnhancedDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchable = false,
  multiSelect = false,
  clearable = false,
  disabled = false,
  loading = false,
  className,
  triggerClassName,
  contentClassName,
  maxHeight = 'max-h-96',
  position = 'bottom',
  align = 'start',
  showIcons = true,
  groupBy = false,
  emptyMessage = 'No options found',
  onSearch,
}: EnhancedDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Group options if needed
  const groupedOptions = React.useMemo(() => {
    if (!groupBy) return { '': filteredOptions };
    const groups: Record<string, DropdownOption[]> = {};
    filteredOptions.forEach((option) => {
      const group = option.group || '';
      if (!groups[group]) groups[group] = [];
      groups[group].push(option);
    });
    return groups;
  }, [filteredOptions, groupBy]);

  // Get selected labels
  const selectedLabels = React.useMemo(() => {
    if (!value) return [];
    const values = Array.isArray(value) ? value : [value];
    return values
      .map((val) => options.find((opt) => opt.value === val)?.label)
      .filter(Boolean) as string[];
  }, [value, options]);

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiSelect ? [] : '');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          const flatOptions = Object.values(groupedOptions).flat();
          if (flatOptions[focusedIndex]) {
            handleSelect(flatOptions[focusedIndex].value);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const flatOptions = Object.values(groupedOptions).flat();
          setFocusedIndex((prev) => Math.min(prev + 1, flatOptions.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => Math.max(prev - 1, -1));
        }
        break;
      case 'Home':
        e.preventDefault();
        if (isOpen) setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (isOpen) {
          const flatOptions = Object.values(groupedOptions).flat();
          setFocusedIndex(flatOptions.length - 1);
        }
        break;
    }
  };

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Reset focus when closed
  React.useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFocusedIndex(-1);
    onSearch?.(query);
  };

  const flatOptions = Object.values(groupedOptions).flat();
  const hasSelection = multiSelect ? Array.isArray(value) && value.length > 0 : Boolean(value);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus:ring-slate-300',
          'hover:bg-slate-50 dark:hover:bg-slate-900',
          'min-h-[44px] sm:min-h-[40px]', // Mobile-friendly touch target
          triggerClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : hasSelection ? (
            <div className="flex flex-1 items-center gap-1 overflow-hidden">
              {multiSelect ? (
                <div className="flex flex-wrap gap-1 overflow-hidden">
                  {selectedLabels.slice(0, 2).map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                    >
                      {label}
                      {clearable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentValues = Array.isArray(value) ? value : [];
                            const option = options.find((opt) => opt.label === label);
                            if (option) {
                              onChange(currentValues.filter((v) => v !== option.value));
                            }
                          }}
                          className="ml-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {selectedLabels.length > 2 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      +{selectedLabels.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="truncate text-slate-900 dark:text-slate-50">
                  {selectedLabels[0] || placeholder}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {clearable && hasSelection && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
          <ChevronDown
            className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            'absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-lg',
            'dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
            position === 'top' && 'bottom-full mb-1',
            position === 'bottom' && 'top-full',
            position === 'left' && 'right-full mr-1',
            position === 'right' && 'left-full ml-1',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'end' && 'right-0',
            'animate-in fade-in-0 zoom-in-95',
            contentClassName
          )}
          role="listbox"
        >
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-slate-200 p-2 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search options..."
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      handleKeyDown(e as unknown as React.KeyboardEvent<HTMLButtonElement>);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            className={cn(
              'overflow-y-auto overscroll-contain',
              maxHeight,
              'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-700 dark:scrollbar-track-slate-900'
            )}
          >
            {flatOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                <div key={groupName || 'default'}>
                  {groupBy && groupName && (
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {groupName}
                    </div>
                  )}
                  {groupOptions.map((option) => {
                    const globalIndex = flatOptions.indexOf(option);
                    const isSelected = multiSelect
                      ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value;
                    const isFocused = globalIndex === focusedIndex;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={option.disabled}
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        onMouseEnter={() => setFocusedIndex(globalIndex)}
                        className={cn(
                          'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2.5 text-sm outline-none transition-colors',
                          'focus:bg-slate-100 focus:text-slate-900',
                          'dark:focus:bg-slate-800 dark:focus:text-slate-50',
                          isFocused && 'bg-slate-100 dark:bg-slate-800',
                          isSelected &&
                            'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50',
                          option.disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
                          'min-h-[44px] sm:min-h-[36px]' // Mobile-friendly touch target
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {showIcons && option.icon && (
                          <span className="flex-shrink-0 text-slate-500 dark:text-slate-400">
                            {option.icon}
                          </span>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0 text-slate-900 dark:text-slate-50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
