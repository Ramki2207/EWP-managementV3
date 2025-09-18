import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Server, X } from 'lucide-react';

interface Verdeler {
  id: string;
  distributor_id: string;
  kast_naam?: string;
  projects?: {
    project_number: string;
    client?: string;
  };
}

interface VerdelerSearchSelectProps {
  verdelers: Verdeler[];
  selectedVerdelerId: string;
  onSelect: (verdelerId: string) => void;
  placeholder?: string;
  required?: boolean;
}

const VerdelerSearchSelect: React.FC<VerdelerSearchSelectProps> = ({
  verdelers,
  selectedVerdelerId,
  onSelect,
  placeholder = "Zoek en selecteer een verdeler...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedVerdeler = verdelers.find(v => v.id === selectedVerdelerId);

  // Filter verdelers based on search term
  const filteredVerdelers = verdelers.filter(verdeler => {
    const searchLower = searchTerm.toLowerCase();
    return (
      verdeler.distributor_id.toLowerCase().includes(searchLower) ||
      verdeler.kast_naam?.toLowerCase().includes(searchLower) ||
      verdeler.projects?.project_number?.toLowerCase().includes(searchLower) ||
      verdeler.projects?.client?.toLowerCase().includes(searchLower)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredVerdelers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredVerdelers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredVerdelers[highlightedIndex]) {
          handleSelect(filteredVerdelers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (verdeler: Verdeler) => {
    onSelect(verdeler.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const formatVerdelerDisplay = (verdeler: Verdeler) => {
    const parts = [verdeler.distributor_id];
    if (verdeler.kast_naam) {
      parts.push(verdeler.kast_naam);
    }
    return parts.join(' - ');
  };

  const formatVerdelerSubtext = (verdeler: Verdeler) => {
    const parts = [];
    if (verdeler.projects?.project_number) {
      parts.push(`Project: ${verdeler.projects.project_number}`);
    }
    if (verdeler.projects?.client) {
      parts.push(`Klant: ${verdeler.projects.client}`);
    }
    return parts.join(' • ');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div
          className={`input-field cursor-pointer flex items-center justify-between ${
            isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''
          }`}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
        >
          {selectedVerdeler ? (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Server size={16} className="text-green-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {formatVerdelerDisplay(selectedVerdeler)}
                </div>
                {formatVerdelerSubtext(selectedVerdeler) && (
                  <div className="text-xs text-gray-400 truncate">
                    {formatVerdelerSubtext(selectedVerdeler)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <span className="text-gray-400 flex-1">{placeholder}</span>
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </div>
        {required && !selectedVerdelerId && (
          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
            <span className="text-red-400 text-sm">*</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1E2530] border border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Zoek op verdeler ID, kastnaam, project of klant..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {filteredVerdelers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <Server size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Geen verdelers gevonden</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Probeer een andere zoekterm</p>
                )}
              </div>
            ) : (
              filteredVerdelers.map((verdeler, index) => (
                <div
                  key={verdeler.id}
                  className={`p-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                    index === highlightedIndex
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'hover:bg-[#2A303C] text-white'
                  }`}
                  onClick={() => handleSelect(verdeler)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-start space-x-3">
                    <Server 
                      size={16} 
                      className={`mt-0.5 flex-shrink-0 ${
                        index === highlightedIndex ? 'text-blue-400' : 'text-green-400'
                      }`} 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {formatVerdelerDisplay(verdeler)}
                      </div>
                      {formatVerdelerSubtext(verdeler) && (
                        <div className={`text-xs mt-1 truncate ${
                          index === highlightedIndex ? 'text-blue-300' : 'text-gray-400'
                        }`}>
                          {formatVerdelerSubtext(verdeler)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with count */}
          {filteredVerdelers.length > 0 && (
            <div className="p-2 border-t border-gray-700 bg-[#2A303C]">
              <p className="text-xs text-gray-400 text-center">
                {filteredVerdelers.length} van {verdelers.length} verdelers
                {searchTerm && ` gevonden voor "${searchTerm}"`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerdelerSearchSelect;