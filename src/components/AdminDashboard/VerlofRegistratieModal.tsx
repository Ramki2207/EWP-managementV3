import React, { useState, useMemo } from 'react';
import { X, UserX, ThermometerSun, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  role: string;
  assigned_locations: string[];
}

interface VerlofRegistratieModalProps {
  onClose: () => void;
  onSaved: () => void;
  users: User[];
  currentUsername: string;
  currentUserId: string;
}

const LEERDAM_LOCATIONS = ['Leerdam', 'Leerdam (PM)'];
const NAALDWIJK_LOCATIONS = ['Naaldwijk', 'Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam'];
const LOCATION_FILTERED_USERS = ['Patrick Herman', 'Stefano de Weger', 'Lysander Koenraadt'];

const VerlofRegistratieModal: React.FC<VerlofRegistratieModalProps> = ({
  onClose,
  onSaved,
  users,
  currentUsername,
  currentUserId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [absenceType, setAbsenceType] = useState<'ziek' | 'afwezig' | null>(null);
  const [dateMode, setDateMode] = useState<'range' | 'open' | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredUsers = useMemo(() => {
    const isLocationFiltered = LOCATION_FILTERED_USERS.includes(currentUsername);
    if (!isLocationFiltered) return users.filter(u => u.role === 'montage' || u.role === 'tester');

    const isLeerdam = currentUsername === 'Patrick Herman' || currentUsername === 'Stefano de Weger';
    const allowedLocations = isLeerdam ? LEERDAM_LOCATIONS : NAALDWIJK_LOCATIONS;

    return users
      .filter(u => u.role === 'montage' || u.role === 'tester')
      .filter(u => {
        if (!u.assigned_locations || u.assigned_locations.length === 0) return false;
        return u.assigned_locations.some(loc => allowedLocations.includes(loc));
      });
  }, [users, currentUsername]);

  const selectedUser = filteredUsers.find(u => u.id === selectedUserId);

  const canSave = selectedUserId && absenceType && dateMode && startDate && (dateMode === 'open' || endDate);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('employee_absences').insert({
        user_id: selectedUserId,
        absence_type: absenceType,
        start_date: startDate,
        end_date: dateMode === 'open' ? null : endDate,
        is_open_ended: dateMode === 'open',
        registered_by: currentUserId,
      });

      if (error) throw error;
      toast.success(`${selectedUser?.username} is geregistreerd als ${absenceType === 'ziek' ? 'ziek' : 'afwezig'}`);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving absence:', err);
      toast.error('Kon de registratie niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1F2C] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/40">
          <div>
            <h2 className="text-lg font-semibold text-white">Verlof registratie</h2>
            <p className="text-sm text-gray-400 mt-0.5">Registreer ziekte of afwezigheid van een medewerker</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex h-[500px]">
          {/* Left: Employee list */}
          <div className="w-64 border-r border-gray-700/40 overflow-y-auto custom-scrollbar">
            <div className="p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2 px-2">
                Medewerkers ({filteredUsers.length})
              </p>
              <div className="space-y-0.5">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setAbsenceType(null);
                      setDateMode(null);
                      setEndDate('');
                      setNotes('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                      selectedUserId === user.id
                        ? 'bg-blue-500/15 border border-blue-500/30 text-white'
                        : 'hover:bg-gray-700/30 text-gray-300 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      selectedUserId === user.id ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-700/60 text-gray-400'
                    }`}>
                      {user.username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user.username}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Configuration */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <UserX size={40} className="mb-3 text-gray-600" />
                <p className="text-sm">Selecteer een medewerker om te beginnen</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/30">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-semibold text-blue-300">
                    {selectedUser.username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedUser.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{selectedUser.role}</p>
                  </div>
                </div>

                {/* Step 1: Absence type */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    1. Reden van afwezigheid
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAbsenceType('ziek')}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        absenceType === 'ziek'
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-gray-700/40 hover:border-gray-600/60 bg-gray-800/30'
                      }`}
                    >
                      <ThermometerSun size={20} className={absenceType === 'ziek' ? 'text-red-400' : 'text-gray-500'} />
                      <p className={`text-sm font-semibold mt-2 ${absenceType === 'ziek' ? 'text-red-300' : 'text-gray-300'}`}>
                        Ziek
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Ziekmelding</p>
                    </button>
                    <button
                      onClick={() => setAbsenceType('afwezig')}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        absenceType === 'afwezig'
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-gray-700/40 hover:border-gray-600/60 bg-gray-800/30'
                      }`}
                    >
                      <UserX size={20} className={absenceType === 'afwezig' ? 'text-amber-400' : 'text-gray-500'} />
                      <p className={`text-sm font-semibold mt-2 ${absenceType === 'afwezig' ? 'text-amber-300' : 'text-gray-300'}`}>
                        Afwezig
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Overige afwezigheid</p>
                    </button>
                  </div>
                </div>

                {/* Step 2: Date selection */}
                {absenceType && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      2. Duur van afwezigheid
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => setDateMode('range')}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          dateMode === 'range'
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-gray-700/40 hover:border-gray-600/60 bg-gray-800/30'
                        }`}
                      >
                        <Calendar size={20} className={dateMode === 'range' ? 'text-blue-400' : 'text-gray-500'} />
                        <p className={`text-sm font-semibold mt-2 ${dateMode === 'range' ? 'text-blue-300' : 'text-gray-300'}`}>
                          Datum bereik
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Begin- en einddatum kiezen</p>
                      </button>
                      <button
                        onClick={() => { setDateMode('open'); setEndDate(''); }}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          dateMode === 'open'
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-gray-700/40 hover:border-gray-600/60 bg-gray-800/30'
                        }`}
                      >
                        <Clock size={20} className={dateMode === 'open' ? 'text-blue-400' : 'text-gray-500'} />
                        <p className={`text-sm font-semibold mt-2 ${dateMode === 'open' ? 'text-blue-300' : 'text-gray-300'}`}>
                          Tot nader order
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Tot betermelding</p>
                      </button>
                    </div>

                    {dateMode && (
                      <div className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Begindatum</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-[#161b24] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          />
                        </div>
                        {dateMode === 'range' && (
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Einddatum</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={e => setEndDate(e.target.value)}
                              min={startDate}
                              className="w-full bg-[#161b24] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                          </div>
                        )}
                        {dateMode === 'open' && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-300">
                              Het systeem houdt de afwezigheid bij totdat je aangeeft dat de medewerker weer beschikbaar is.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Notes (optional) */}
                {absenceType && dateMode && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      3. Notities <span className="text-gray-600 normal-case">(optioneel)</span>
                    </p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Eventuele opmerkingen..."
                      rows={2}
                      className="w-full bg-[#161b24] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/40 transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              canSave && !saving
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerlofRegistratieModal;
