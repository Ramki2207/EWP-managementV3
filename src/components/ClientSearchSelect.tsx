import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, User, X } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ClientSearchSelectProps {
  clients: Client[];
  selectedClientName: string;
  onSelect: (clientName: string) => void;
  placeholder?: string;
  required?: boolean;
}

const ClientSearchSelect: React.FC<ClientSearchSelectProps> = ({
  clients,
  selectedClientName,
  onSelect,
  placeholder = "Zoek en selecteer een klant...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedClient = clients.find(c => c.name === selectedClientName);

  const sortedClients = [...clients].sort((a, b) =>
    a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' })
  );

  const filteredClients = sortedClients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
  });

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
          prev < filteredClients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredClients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredClients[highlightedIndex]) {
          handleSelect(filteredClients[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (client: Client) => {
    onSelect(client.name);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div
        className={`input-field pl-10 pr-10 cursor-pointer flex items-center justify-between ${
          isOpen ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={handleToggle}
      >
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <span className={selectedClient ? 'text-white' : 'text-gray-400'}>
          {selectedClient ? selectedClient.name : placeholder}
        </span>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {selectedClient && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Zoek klant..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredClients.length > 0 ? (
              <div className="py-1">
                {filteredClients.map((client, index) => (
                  <button
                    key={client.id}
                    type="button"
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                      highlightedIndex === index ? 'bg-gray-700' : ''
                    } ${
                      selectedClient?.id === client.id ? 'bg-blue-900/20 text-blue-400' : 'text-white'
                    }`}
                    onClick={() => handleSelect(client)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <User size={18} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{client.name}</div>
                        {(client.email || client.phone) && (
                          <div className="text-xs text-gray-400 truncate mt-1">
                            {client.email && <span>{client.email}</span>}
                            {client.email && client.phone && <span className="mx-2">•</span>}
                            {client.phone && <span>{client.phone}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-400">
                <User size={48} className="mx-auto mb-2 opacity-50" />
                <p>Geen klanten gevonden</p>
                {searchTerm && (
                  <p className="text-sm mt-1">voor "{searchTerm}"</p>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-700 bg-gray-900/50">
            <div className="text-xs text-gray-400 text-center">
              {filteredClients.length} van {clients.length} klanten
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSearchSelect;
