import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2, Edit2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FolderNote {
  id: string;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

interface FolderNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  distributorId: string | null;
  folderName: string;
  currentUserId: string;
}

export default function FolderNotesModal({
  isOpen,
  onClose,
  projectId,
  distributorId,
  folderName,
  currentUserId
}: FolderNotesModalProps) {
  const [notes, setNotes] = useState<FolderNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, projectId, distributorId, folderName]);

  const loadNotes = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('folder_notes')
        .select('*')
        .eq('project_id', projectId)
        .eq('folder_name', folderName)
        .order('created_at', { ascending: false });

      if (distributorId) {
        query = query.eq('distributor_id', distributorId);
      } else {
        query = query.is('distributor_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const userIds = [...new Set(data?.map(n => n.created_by) || [])];
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      const userMap = users?.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
      }, {} as Record<string, string>) || {};

      const notesWithNames = data?.map(note => ({
        ...note,
        creator_name: userMap[note.created_by] || 'Onbekend'
      })) || [];

      setNotes(notesWithNames);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Fout bij laden van notities');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Notitie mag niet leeg zijn');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('folder_notes')
        .insert({
          project_id: projectId,
          distributor_id: distributorId,
          folder_name: folderName,
          note: newNote.trim(),
          created_by: currentUserId
        });

      if (error) throw error;

      toast.success('Notitie toegevoegd');
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Fout bij toevoegen van notitie');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingText.trim()) {
      toast.error('Notitie mag niet leeg zijn');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('folder_notes')
        .update({ note: editingText.trim() })
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Notitie bijgewerkt');
      setEditingNoteId(null);
      setEditingText('');
      await loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Fout bij bijwerken van notitie');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Weet je zeker dat je deze notitie wilt verwijderen?')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('folder_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Notitie verwijderd');
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Fout bij verwijderen van notitie');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note: FolderNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.note);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1E2530] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageSquare size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Map Notities</h2>
              <p className="text-sm text-gray-400">{folderName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && notes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Nog geen notities toegevoegd</p>
              <p className="text-gray-500 text-sm mt-1">Voeg hieronder een notitie toe</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-[#2A303C] rounded-lg p-4 space-y-3">
                {editingNoteId === note.id ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="input-field w-full min-h-[100px] resize-none"
                      placeholder="Notitie tekst..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditing}
                        className="btn-secondary px-3 py-1 text-sm"
                        disabled={loading}
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        className="btn-primary px-3 py-1 text-sm"
                        disabled={loading || !editingText.trim()}
                      >
                        <Save size={14} />
                        <span>Opslaan</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white whitespace-pre-wrap">{note.note}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-2">
                      <div>
                        <span className="font-medium">{note.creator_name}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {new Date(note.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {note.updated_at !== note.created_at && (
                          <span className="ml-2 text-gray-500">(bewerkt)</span>
                        )}
                      </div>
                      {note.created_by === currentUserId && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(note)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Bewerken"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Note Form */}
        <div className="border-t border-gray-700 p-6 bg-[#1a1f2a]">
          <div className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="input-field w-full min-h-[80px] resize-none"
              placeholder="Voeg een notitie toe..."
              disabled={loading}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                className="btn-primary"
                disabled={loading || !newNote.trim()}
              >
                <MessageSquare size={16} />
                <span>Notitie toevoegen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
