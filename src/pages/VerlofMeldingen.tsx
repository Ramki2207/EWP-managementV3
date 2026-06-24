import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, X, Users, Umbrella, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function VerlofMeldingen() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [vacationRequests, setVacationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'verlof' | 'vakantie'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser !== null) {
      loadData();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();
      setCurrentUser(data);
    } else {
      setCurrentUser({});
    }
  };

  const hasLocationOverlap = (userLocations: string[] | null) => {
    if (!currentUser) return true;
    const myLocations = currentUser.assigned_locations || [];
    if (myLocations.length === 0) return true;
    if (!userLocations || userLocations.length === 0) return true;
    return myLocations.some((loc: string) => userLocations.includes(loc));
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadLeaveRequests(), loadVacationRequests()]);
    setLoading(false);
  };

  const loadLeaveRequests = async () => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:users!leave_requests_user_id_fkey(id, username, email, assigned_locations)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading leave requests:', error);
      return;
    }
    const filtered = (data || []).filter(r => hasLocationOverlap(r.user?.assigned_locations));
    setLeaveRequests(filtered);
  };

  const loadVacationRequests = async () => {
    const { data, error } = await supabase
      .from('vacation_requests')
      .select(`
        *,
        user:users!vacation_requests_user_id_fkey(id, username, email, assigned_locations)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading vacation requests:', error);
      return;
    }
    const filtered = (data || []).filter(r => hasLocationOverlap(r.user?.assigned_locations));
    setVacationRequests(filtered);
  };

  const approveLeaveRequest = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij goedkeuren');
      return;
    }
    toast.success('Verlofaanvraag goedgekeurd');
    loadLeaveRequests();
  };

  const declineLeaveRequest = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'declined',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij afkeuren');
      return;
    }
    toast.success('Verlofaanvraag afgekeurd');
    loadLeaveRequests();
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const approveVacationRequest = async (id: string) => {
    const { error } = await supabase
      .from('vacation_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij goedkeuren');
      return;
    }
    toast.success('Vakantieaanvraag goedgekeurd');
    loadVacationRequests();
  };

  const declineVacationRequest = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('vacation_requests')
      .update({
        status: 'declined',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij afkeuren');
      return;
    }
    toast.success('Vakantieaanvraag afgekeurd');
    loadVacationRequests();
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'declined': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'In afwachting';
      case 'approved': return 'Goedgekeurd';
      case 'declined': return 'Afgekeurd';
      default: return status;
    }
  };

  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');
  const pendingVacation = vacationRequests.filter(r => r.status === 'pending');
  const totalPending = pendingLeave.length + pendingVacation.length;

  const filteredLeave = activeFilter === 'vakantie' ? [] : leaveRequests;
  const filteredVacation = activeFilter === 'verlof' ? [] : vacationRequests;

  if (loading) {
    return (
      <div className="page-container">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center space-x-3">
              <Bell className="w-7 h-7 text-blue-400" />
              <span>Meldingen</span>
              {totalPending > 0 && (
                <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {totalPending}
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">Verlof- en vakantieaanvragen</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#2A303C] text-gray-400 hover:text-white'
              }`}
            >
              Alles
            </button>
            <button
              onClick={() => setActiveFilter('verlof')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeFilter === 'verlof'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#2A303C] text-gray-400 hover:text-white'
              }`}
            >
              <Umbrella className="w-4 h-4" />
              <span>Verlof</span>
              {pendingLeave.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingLeave.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('vakantie')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeFilter === 'vakantie'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#2A303C] text-gray-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Vakantie</span>
              {pendingVacation.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingVacation.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {totalPending > 0 && (
        <div className="card p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>Te Beoordelen ({totalPending})</span>
          </h2>
          <div className="space-y-3">
            {/* Pending Leave */}
            {(activeFilter === 'all' || activeFilter === 'verlof') && pendingLeave.map(request => (
              <div key={request.id} className="p-4 rounded-lg bg-[#2A303C]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Umbrella className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">{request.user?.username}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Verlof</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRequest({ ...request, type: 'leave', action: 'decline' })}
                      className="btn-secondary text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Afkeuren</span>
                    </button>
                    <button
                      onClick={() => approveLeaveRequest(request.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Goedkeuren</span>
                    </button>
                  </div>
                </div>
                <div className="ml-8 space-y-1">
                  <p className="text-sm text-gray-300">
                    {request.is_partial_day ? (
                      <>
                        {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                        <span className="ml-2 text-gray-400">({request.hours_count} uur)</span>
                      </>
                    ) : (
                      <>
                        {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                        <span className="ml-2 text-gray-400">({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})</span>
                      </>
                    )}
                  </p>
                  {request.description && (
                    <p className="text-sm text-gray-400">{request.description}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Pending Vacation */}
            {(activeFilter === 'all' || activeFilter === 'vakantie') && pendingVacation.map(request => (
              <div key={request.id} className="p-4 rounded-lg bg-[#2A303C]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Sun className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">{request.user?.username}</span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Vakantie</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedRequest({ ...request, type: 'vacation', action: 'decline' })}
                      className="btn-secondary text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Afkeuren</span>
                    </button>
                    <button
                      onClick={() => approveVacationRequest(request.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Goedkeuren</span>
                    </button>
                  </div>
                </div>
                <div className="ml-8 space-y-1">
                  <p className="text-sm text-gray-300">
                    {request.is_partial_day ? (
                      <>
                        {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                        <span className="ml-2 text-gray-400">({request.hours_count} uur)</span>
                      </>
                    ) : (
                      <>
                        {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                        <span className="ml-2 text-gray-400">({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})</span>
                      </>
                    )}
                  </p>
                  {request.description && (
                    <p className="text-sm text-gray-400">{request.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Requests History */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Alle Aanvragen</h2>
        <div className="space-y-3">
          {filteredLeave.map(request => (
            <div key={`leave-${request.id}`} className="p-4 rounded-lg bg-[#2A303C]">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
                <Umbrella className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white">{request.user?.username}</span>
                <span className="text-xs text-gray-500">Verlof</span>
              </div>
              <p className="text-sm text-gray-400 ml-3">
                {request.is_partial_day ? (
                  <>
                    {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                    ({request.hours_count} uur)
                  </>
                ) : (
                  <>
                    {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                    ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                  </>
                )}
              </p>
              {request.description && (
                <p className="text-sm text-gray-500 ml-3 mt-1">{request.description}</p>
              )}
              {request.status === 'declined' && request.rejection_reason && (
                <p className="text-sm text-red-400 ml-3 mt-2">
                  Reden afwijzing: {request.rejection_reason}
                </p>
              )}
            </div>
          ))}

          {filteredVacation.map(request => (
            <div key={`vac-${request.id}`} className="p-4 rounded-lg bg-[#2A303C]">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-white">{request.user?.username}</span>
                <span className="text-xs text-gray-500">Vakantie</span>
              </div>
              <p className="text-sm text-gray-400 ml-3">
                {request.is_partial_day ? (
                  <>
                    {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                    ({request.hours_count} uur)
                  </>
                ) : (
                  <>
                    {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                    ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                  </>
                )}
              </p>
              {request.description && (
                <p className="text-sm text-gray-500 ml-3 mt-1">{request.description}</p>
              )}
              {request.status === 'declined' && request.rejection_reason && (
                <p className="text-sm text-red-400 ml-3 mt-2">
                  Reden afwijzing: {request.rejection_reason}
                </p>
              )}
            </div>
          ))}

          {filteredLeave.length === 0 && filteredVacation.length === 0 && (
            <p className="text-center text-gray-400 py-8">Geen aanvragen gevonden</p>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedRequest && selectedRequest.action === 'decline' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reden voor Afwijzing</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field mb-4"
              rows={4}
              placeholder="Geef een reden voor de afwijzing..."
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Geef een reden op');
                    return;
                  }
                  if (selectedRequest.type === 'leave') {
                    declineLeaveRequest(selectedRequest.id, rejectionReason);
                  } else {
                    declineVacationRequest(selectedRequest.id, rejectionReason);
                  }
                }}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Afkeuren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
