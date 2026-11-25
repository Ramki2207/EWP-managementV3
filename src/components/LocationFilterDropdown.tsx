import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { LOCATION_GROUP_OPTIONS, LocationGroup, useLocationFilter } from '../contexts/LocationFilterContext';

interface LocationFilterDropdownProps {
  allowedGroups?: LocationGroup[];
}

const LocationFilterDropdown: React.FC<LocationFilterDropdownProps> = ({ allowedGroups }) => {
  const { selectedGroups, setSelectedGroups } = useLocationFilter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocationGroup[]>(selectedGroups);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleOpen = () => {
    if (!open) setDraft(selectedGroups);
    setOpen(o => !o);
  };

  const toggleGroup = (group: LocationGroup) => {
    setDraft(prev => (prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]));
  };

  const handleSave = () => {
    setSelectedGroups(draft);
    setOpen(false);
  };

  const options = allowedGroups
    ? LOCATION_GROUP_OPTIONS.filter(o => allowedGroups.includes(o.value))
    : LOCATION_GROUP_OPTIONS;

  const hasChanges =
    (!allowedGroups || draft.length > 0) &&
    draft.length !== selectedGroups.length || draft.some(g => !selectedGroups.includes(g));

  const summary = selectedGroups.length === 0
    ? 'Alles'
    : LOCATION_GROUP_OPTIONS.filter(o => selectedGroups.includes(o.value)).map(o => o.label).join(', ');

  const optionClass = (active: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[#374151] ${active ? 'text-white' : 'text-gray-300'}`;

  const checkbox = (active: boolean) => (
    <span className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${active ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
      {active && <Check size={12} className="text-white" />}
    </span>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-2 bg-[#2A303C] text-white border border-gray-700 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[220px]"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-52 bg-[#1e2530] border border-gray-700 rounded-lg shadow-xl py-1">
          {!allowedGroups && (
            <>
              <button type="button" onClick={() => setDraft([])} className={optionClass(draft.length === 0)}>
                {checkbox(draft.length === 0)}
                Alles
              </button>
              <div className="border-t border-gray-700 my-1" />
            </>
          )}
          {options.map(option => {
            const active = draft.includes(option.value);
            return (
              <button key={option.value} type="button" onClick={() => toggleGroup(option.value)} className={optionClass(active)}>
                {checkbox(active)}
                {option.label}
              </button>
            );
          })}
          <div className="flex gap-2 border-t border-gray-700 mt-1 px-3 pt-2 pb-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-2 py-1.5 text-sm rounded-md text-gray-300 hover:bg-[#374151] transition-colors"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 px-2 py-1.5 text-sm rounded-md bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilterDropdown;
