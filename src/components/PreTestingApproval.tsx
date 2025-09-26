import React, { useState, useEffect } from 'react';
import { CheckSquare, X, AlertTriangle, User, Calendar, MessageSquare, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';

interface PreTestingApprovalProps {
  project: any;
  onApprove: () => void;
  onDecline: () => void;
  onCancel: () => void;
  currentUser: any;
}

interface ChecklistItem {
  id: string;
  question: string;
  checked: boolean;
  comments: string;
  approved?: boolean | null; // For tester review: true = approved, false = declined, null = not reviewed
  testerComments?: string;
}

const PreTestingApproval: React.FC<PreTestingApprovalProps> = ({
  project,
  onApprove,
  onDecline,
  onCancel,
  currentUser
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', question: 'Zit de aarde erin? Rail/deur/paneel?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '2', question: 'Kamrailen in?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '3', question: 'eindkapjes kamrailen?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '4', question: 'Slot gemonteerd in deur?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '5', question: 'Wartels / invoerbak gemonteerd?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '6', question: 'Nummertjes rijgklemmen/eindsteun?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '7', question: 'Pootje afdekappen gemonteerd?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '8', question: 'Codeerstroken gemaakt?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '9', question: 'Stofzuigen?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '10', question: 'Moet de tekening aangepast worden?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '11', question: 'Alles vast gedraaid?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '12', question: 'Materiaal t.b.v. Kast, deksels erbij zetten.', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '13', question: 'Juiste kabel dikte?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '14', question: 'Draad goed in componenten gezet?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '15', question: 'Overige opmerkingen?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '16', question: 'OSB Contact aangesloten', checked: false, comments: '', approved: null, testerComments: '' }
  ]);

  const [approvalData, setApprovalData] = useState({
    submittedBy: '',
    submittedAt: '',
    reviewedBy: '',
    reviewedAt: '',
    overallApproval: null as boolean | null,
    generalComments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'review'>('form');

  // Load existing approval data if it exists
  useEffect(() => {
    loadExistingApproval();
  }, [project.id]);

  // Determine view mode based on user role and existing data
  useEffect(() => {
    if (currentUser?.role === 'tester' || currentUser?.role === 'admin') {
      // Check if there's submitted data to review
      if (approvalData.submittedAt && !approvalData.reviewedAt) {
        setViewMode('review');
      } else if (approvalData.reviewedAt) {
        setViewMode('review'); // Show completed review
      } else {
        setViewMode('form'); // No submission yet, show form
      }
    } else {
      setViewMode('form'); // Non-testers always see form
    }
  }, [currentUser, approvalData]);

  const loadExistingApproval = async () => {
    try {
      // Try to load from test_data table
      const testData = await dataService.getTestData(project.id);
      const approvalRecord = testData?.find((data: any) => data.test_type === 'pre_testing_approval');
      
      if (approvalRecord) {
        const data = approvalRecord.data;
        setChecklist(data.checklist || checklist);
        setApprovalData(data.approvalData || approvalData);
      }
    } catch (error) {
      console.error('Error loading existing approval data:', error);
    }
  };

  const handleChecklistChange = (id: string, field: 'checked' | 'comments', value: boolean | string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleTesterReview = (id: string, approved: boolean, testerComments: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, approved, testerComments } : item
    ));
  };

  const isFormComplete = () => {
    return checklist.every(item => item.checked) && approvalData.submittedBy.trim() !== '';
  };

  const isTesterReviewComplete = () => {
    return checklist.every(item => item.approved !== null) && 
           approvalData.overallApproval !== null &&
           approvalData.reviewedBy.trim() !== '';
  };

  const handleSubmitForReview = async () => {
    if (!isFormComplete()) {
      toast.error('Vul alle velden in en vink alle items aan voordat je indient!');
      return;
    }

    try {
      setIsSubmitting(true);

      const submissionData = {
        checklist,
        approvalData: {
          ...approvalData,
          submittedBy: currentUser?.username || 'Unknown',
          submittedAt: new Date().toISOString()
        }
      };

      // Save to test_data table
      await dataService.createTestData({
        distributorId: project.id, // Using project ID as distributor ID for project-level data
        testType: 'pre_testing_approval',
        data: submissionData
      });

      toast.success('Formulier ingediend voor beoordeling door tester!');
      setApprovalData(submissionData.approvalData);
      
      // Don't close modal - wait for tester review
      if (currentUser?.role === 'tester' || currentUser?.role === 'admin') {
        setViewMode('review');
      }
    } catch (error) {
      console.error('Error submitting approval form:', error);
      toast.error('Er is een fout opgetreden bij het indienen van het formulier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTesterApproval = async () => {
    if (!isTesterReviewComplete()) {
      toast.error('Beoordeel alle items en geef een eindoordeel voordat je goedkeurt!');
      return;
    }

    const allApproved = checklist.every(item => item.approved === true);
    
    if (!allApproved && approvalData.overallApproval === true) {
      toast.error('Je kunt niet goedkeuren als er afgekeurde items zijn!');
      return;
    }

    try {
      setIsSubmitting(true);

      const reviewData = {
        checklist,
        approvalData: {
          ...approvalData,
          reviewedBy: currentUser?.username || 'Unknown',
          reviewedAt: new Date().toISOString(),
          overallApproval: approvalData.overallApproval
        }
      };

      // Update test_data with review
      await dataService.createTestData({
        distributorId: project.id,
        testType: 'pre_testing_approval',
        data: reviewData
      });

      if (approvalData.overallApproval) {
        toast.success('Project goedgekeurd voor testfase!');
        onApprove();
      } else {
        toast.success('Project afgekeurd - terug naar productie voor aanpassingen');
        onDecline();
      }
    } catch (error) {
      console.error('Error submitting tester approval:', error);
      toast.error('Er is een fout opgetreden bij het indienen van de beoordeling');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApprovalIcon = (approved: boolean | null) => {
    if (approved === true) return <span className="text-green-400 text-lg">✓</span>;
    if (approved === false) return <span className="text-red-400 text-lg">✗</span>;
    return <span className="text-gray-400 text-lg">?</span>;
  };

  const getApprovalColor = (approved: boolean | null) => {
    if (approved === true) return 'bg-green-500/20 text-green-400';
    if (approved === false) return 'bg-red-500/20 text-red-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <CheckSquare size={20} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-orange-400">
                {viewMode === 'review' ? 'Tester Beoordeling' : 'Pre-Testing Goedkeuring'}
              </h2>
              <p className="text-gray-400">
                Project {project.project_number} - {project.client}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Information */}
        <div className="bg-[#2A303C] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Huidige Status</label>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                Productie
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Gewenste Status</label>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                Testen
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Aantal Verdelers</label>
              <span className="text-white font-medium">{project.distributors?.length || 0}</span>
            </div>
          </div>
        </div>

        {viewMode === 'form' ? (
          /* Form Mode - For submitting checklist */
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <h3 className="font-medium text-yellow-400">Productie Gereedheidscontrole</h3>
              </div>
              <p className="text-yellow-300 text-sm">
                Controleer alle onderstaande punten voordat het project naar de testfase gaat. 
                Alle items moeten worden aangevinkt en voorzien van opmerkingen.
              </p>
            </div>

            {/* Submitter Information */}
            <div className="bg-[#2A303C] rounded-lg p-4">
              <h3 className="font-medium text-gray-300 mb-3">Ingediend door</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Naam monteur <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={approvalData.submittedBy}
                    onChange={(e) => setApprovalData({ ...approvalData, submittedBy: e.target.value })}
                    placeholder="Naam van de monteur"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Datum</label>
                  <input
                    type="date"
                    className="input-field"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-[#2A303C] rounded-lg p-4">
              <h3 className="font-medium text-gray-300 mb-4">Productie Checklist</h3>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="bg-[#1E2530] p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <label className="flex items-center space-x-2 mt-1">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => handleChecklistChange(item.id, 'checked', e.target.checked)}
                          className="form-checkbox text-green-500"
                        />
                        <span className="text-sm font-medium text-white">
                          {item.question}
                        </span>
                      </label>
                    </div>
                    <div className="mt-3 ml-6">
                      <label className="block text-xs text-gray-400 mb-1">Opmerkingen</label>
                      <textarea
                        className="input-field h-20 text-sm"
                        value={item.comments}
                        onChange={(e) => handleChecklistChange(item.id, 'comments', e.target.value)}
                        placeholder="Beschrijf de status van dit item..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Comments */}
            <div className="bg-[#2A303C] rounded-lg p-4">
              <h3 className="font-medium text-gray-300 mb-3">Algemene Opmerkingen</h3>
              <textarea
                className="input-field h-24"
                value={approvalData.generalComments}
                onChange={(e) => setApprovalData({ ...approvalData, generalComments: e.target.value })}
                placeholder="Algemene opmerkingen over de productie status..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={onCancel}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Annuleren
              </button>
              <button
                onClick={handleSubmitForReview}
                className={`btn-primary flex items-center space-x-2 ${
                  !isFormComplete() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isFormComplete() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Indienen...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Indienen voor beoordeling</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          approvalData.reviewedAt ? (
            /* Review Mode - Show completed review */
            <div className="space-y-6">
              <div className={`rounded-lg p-4 ${
                approvalData.overallApproval 
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {approvalData.overallApproval ? (
                    <CheckSquare size={16} className="text-green-400" />
                  ) : (
                    <X size={16} className="text-red-400" />
                  )}
                  <h3 className={`font-medium ${
                    approvalData.overallApproval ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {approvalData.overallApproval ? 'Project Goedgekeurd' : 'Project Afgekeurd'}
                  </h3>
                </div>
                <p className={`text-sm ${
                  approvalData.overallApproval ? 'text-green-300' : 'text-red-300'
                }`}>
                  {approvalData.overallApproval 
                    ? 'Het project is goedgekeurd en kan naar de testfase'
                    : 'Het project is afgekeurd en moet terug naar productie voor aanpassingen'
                  }
                </p>
              </div>

              {/* Review Summary */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3">Beoordeling Overzicht</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {checklist.filter(item => item.approved === true).length}
                    </div>
                    <div className="text-sm text-gray-400">Goedgekeurd</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {checklist.filter(item => item.approved === false).length}
                    </div>
                    <div className="text-sm text-gray-400">Afgekeurd</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">
                      {checklist.filter(item => item.approved === null).length}
                    </div>
                    <div className="text-sm text-gray-400">Niet beoordeeld</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Beoordeeld door</label>
                    <p className="text-white">{approvalData.reviewedBy || 'Nog niet beoordeeld'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Beoordeeld op</label>
                    <p className="text-white">
                      {approvalData.reviewedAt ? new Date(approvalData.reviewedAt).toLocaleString('nl-NL') : 'Nog niet beoordeeld'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Review */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-4">Gedetailleerde Beoordeling</h3>
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="bg-[#1E2530] p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-white">{item.question}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getApprovalColor(item.approved)}`}>
                              {getApprovalIcon(item.approved)}
                            </span>
                          </div>
                          {item.comments && (
                            <p className="text-xs text-gray-400 mb-2">Montage: {item.comments}</p>
                          )}
                          {item.testerComments && (
                            <p className="text-xs text-blue-300">Tester: {item.testerComments}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onCancel}
                  className="btn-secondary"
                >
                  Sluiten
                </button>
              </div>
            </div>
          ) : (
            /* Review Mode - For tester approval */
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye size={16} className="text-blue-400" />
                  <h3 className="font-medium text-blue-400">Tester Beoordeling</h3>
                </div>
                <p className="text-blue-300 text-sm">
                  Beoordeel elk item fysiek en geef aan of het goedgekeurd of afgekeurd wordt. 
                  Voeg opmerkingen toe voor verbeteringen.
                </p>
              </div>

              {/* Submission Information */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3">Ingediend door Montage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Monteur</label>
                    <p className="text-white">{approvalData.submittedBy || 'Onbekend'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ingediend op</label>
                    <p className="text-white">
                      {approvalData.submittedAt ? new Date(approvalData.submittedAt).toLocaleString('nl-NL') : '-'}
                    </p>
                  </div>
                </div>
                {approvalData.generalComments && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-400 mb-1">Algemene opmerkingen montage</label>
                    <p className="text-gray-300 bg-[#1E2530] p-3 rounded-lg text-sm">
                      {approvalData.generalComments}
                    </p>
                  </div>
                )}
              </div>

              {/* Tester Information */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3">Tester Beoordeling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Beoordeeld door <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={approvalData.reviewedBy}
                      onChange={(e) => setApprovalData({ ...approvalData, reviewedBy: e.target.value })}
                      placeholder="Naam van de tester"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Beoordelingsdatum</label>
                    <input
                      type="date"
                      className="input-field"
                      value={new Date().toISOString().split('T')[0]}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Review Checklist */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-4">Item Beoordeling</h3>
                <div className="space-y-4">
                  {checklist.map((item) => (
                    <div key={item.id} className="bg-[#1E2530] p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckSquare size={16} className={item.checked ? 'text-green-400' : 'text-gray-400'} />
                            <span className="text-sm font-medium text-white">
                              {item.question}
                            </span>
                          </div>
                          {item.comments && (
                            <div className="ml-6">
                              <label className="block text-xs text-gray-400 mb-1">Montage opmerkingen</label>
                              <p className="text-gray-300 bg-[#2A303C] p-2 rounded text-sm">
                                {item.comments}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getApprovalColor(item.approved)}`}>
                            {getApprovalIcon(item.approved)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Tester Review Section */}
                      <div className="ml-6 border-t border-gray-700 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Tester beoordeling</label>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleTesterReview(item.id, true, item.testerComments || '')}
                                className={`px-3 py-2 rounded-lg text-sm transition ${
                                  item.approved === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-700 hover:bg-green-500/20 text-gray-300'
                                }`}
                              >
                                ✓ Goedkeuren
                              </button>
                              <button
                                onClick={() => handleTesterReview(item.id, false, item.testerComments || '')}
                                className={`px-3 py-2 rounded-lg text-sm transition ${
                                  item.approved === false
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-700 hover:bg-red-500/20 text-gray-300'
                                }`}
                              >
                                ✗ Afkeuren
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Tester opmerkingen</label>
                            <textarea
                              className="input-field h-16 text-sm"
                              value={item.testerComments || ''}
                              onChange={(e) => handleTesterReview(item.id, item.approved || false, e.target.value)}
                              placeholder="Opmerkingen van tester..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Approval */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3">Eindoordeel</h3>
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setApprovalData({ ...approvalData, overallApproval: true })}
                    className={`px-6 py-3 rounded-lg transition ${
                      approvalData.overallApproval === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 hover:bg-green-500/20 text-gray-300'
                    }`}
                  >
                    ✓ Project goedkeuren voor testfase
                  </button>
                  <button
                    onClick={() => setApprovalData({ ...approvalData, overallApproval: false })}
                    className={`px-6 py-3 rounded-lg transition ${
                      approvalData.overallApproval === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 hover:bg-red-500/20 text-gray-300'
                    }`}
                  >
                    ✗ Project afkeuren - terug naar productie
                  </button>
                </div>
                
                {approvalData.overallApproval === false && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-300 text-sm">
                      ⚠️ Bij afkeuring wordt het project teruggezet naar "Productie" status. 
                      De montage afdeling kan dan de opmerkingen bekijken en verbeteringen doorvoeren.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onCancel}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleTesterApproval}
                  className={`btn-primary flex items-center space-x-2 ${
                    !isTesterReviewComplete() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!isTesterReviewComplete() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Verwerken...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare size={20} />
                      <span>
                        {approvalData.overallApproval ? 'Goedkeuren voor testfase' : 'Afkeuren - terug naar productie'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PreTestingApproval;