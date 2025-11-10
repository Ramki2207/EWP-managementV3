import React, { useState, useEffect } from 'react';
import { CheckSquare, X, AlertTriangle, User, Calendar, MessageSquare, Save, Eye, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import { openChecklistInNewWindow } from './VerdelerChecklistPopup';

interface VerdelerPreTestingApprovalProps {
  distributor: any;
  onClose: () => void;
  currentUser: any;
  onApprove?: () => void;
  onDecline?: () => void;
}

interface ChecklistItem {
  id: string;
  question: string;
  checked: boolean | 'n.v.t';
  comments: string;
  approved?: boolean | null | 'n.v.t';
  testerComments?: string;
}

const VerdelerPreTestingApproval: React.FC<VerdelerPreTestingApprovalProps> = ({
  distributor,
  onClose,
  currentUser,
  onApprove,
  onDecline
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', question: 'Zijn de Kamrailen correct gemonteerd?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '2', question: 'Zijn de eindkappen van de Kamrailen correct geplaatst?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '3', question: 'Is het deurslot correct gemonteerd en functioneel?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '4', question: 'Zijn de wartels en/of invoerplaten correct gemonteerd?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '5', question: 'Zijn de rijgklemmen en eindsteunen voorzien van correcte nummering?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '6', question: 'Zijn de pootjes van Hager correct gemonteerd?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '7', question: 'Zijn de Recepals en de codeer- of markeerstroken correct aangebracht?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '8', question: 'Is de werkruimte en kast stofvrij en gereinigd?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '9', question: 'Dient het schema aangepast of bijgewerkt te worden?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '10', question: 'Zijn alle bevestigingen en verbindingen met het juiste moment vastgedraaid?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '11', question: 'Is al het benodigde materiaal voor de kast aanwezig, inclusief deksels?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '12', question: 'Is de Juiste kabel dikte gebruikt?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '13', question: 'Zijn de aders correct aangesloten in de componenten?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '14', question: 'Zijn er aanvullende opmerkingen of bijzonderheden te vermelden?', checked: false, comments: '', approved: null, testerComments: '' },
    { id: '15', question: 'Is het OSB-contact correct aangesloten en getest?', checked: false, comments: '', approved: null, testerComments: '' }
  ]);

  const [approvalData, setApprovalData] = useState({
    submittedBy: '',
    submittedAt: '',
    reviewedBy: '',
    reviewedAt: '',
    overallApproval: null as boolean | null,
    generalComments: '',
    status: 'draft' as 'draft' | 'submitted' | 'reviewed'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'review'>('form');

  useEffect(() => {
    loadExistingApproval();
  }, [distributor.id]);

  useEffect(() => {
    if (currentUser?.role === 'tester' || currentUser?.role === 'admin') {
      if (approvalData.status === 'submitted' && !approvalData.reviewedAt) {
        setViewMode('review');
      } else if (approvalData.reviewedAt) {
        setViewMode('review');
      } else {
        setViewMode('form');
      }
    } else {
      if (approvalData.reviewedAt) {
        setViewMode('review');
      } else if (approvalData.status === 'submitted') {
        setViewMode('review');
      } else {
        setViewMode('form');
      }
    }
  }, [currentUser, approvalData]);

  const loadExistingApproval = async () => {
    try {
      const testData = await dataService.getTestData(distributor.id);
      const approvalRecord = testData?.find((data: any) => data.test_type === 'verdeler_pre_testing_approval');

      if (approvalRecord) {
        const data = approvalRecord.data;
        setChecklist(data.checklist || checklist);
        setApprovalData(data.approvalData || approvalData);
      }
    } catch (error) {
      console.error('Error loading existing approval data:', error);
    }
  };

  const handleChecklistChange = (id: string, field: 'checked' | 'comments', value: boolean | 'n.v.t' | string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleTesterReview = (id: string, approved: boolean | 'n.v.t', testerComments: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, approved, testerComments } : item
    ));
  };

  const isFormComplete = () => {
    return checklist.every(item => item.checked === true || item.checked === 'n.v.t') && approvalData.submittedBy.trim() !== '';
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
          submittedAt: new Date().toISOString(),
          status: 'submitted'
        }
      };

      await dataService.createTestData({
        distributorId: distributor.id,
        testType: 'verdeler_pre_testing_approval',
        data: submissionData
      });

      toast.success('Checklist ingediend voor beoordeling door tester!');
      setApprovalData(submissionData.approvalData);

      if (currentUser?.role === 'montage') {
        setTimeout(() => {
          onClose();
        }, 2000);
      } else if (currentUser?.role === 'tester' || currentUser?.role === 'admin') {
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

    const allApprovedOrNvt = checklist.every(item => item.approved === true || item.approved === 'n.v.t');

    if (!allApprovedOrNvt && approvalData.overallApproval === true) {
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
          overallApproval: approvalData.overallApproval,
          status: 'reviewed'
        }
      };

      await dataService.createTestData({
        distributorId: distributor.id,
        testType: 'verdeler_pre_testing_approval',
        data: reviewData
      });

      if (approvalData.overallApproval) {
        toast.success('Verdeler goedgekeurd voor testfase!');
        if (onApprove) onApprove();
      } else {
        toast.success('Verdeler afgekeurd - terug naar productie');
        if (onDecline) onDecline();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving tester review:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de beoordeling');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmitApproval = () => {
    setApprovalData(prev => ({
      ...prev,
      status: 'draft',
      reviewedBy: '',
      reviewedAt: '',
      overallApproval: null
    }));

    setChecklist(prev => prev.map(item => ({
      ...item,
      approved: null,
      testerComments: ''
    })));

    setViewMode('form');
    toast.success('Je kunt de checklist nu aanpassen en opnieuw indienen');
  };

  return (
    <div className="fixed inset-0 bg-[#0f1419] z-50 overflow-y-auto">
      <div className="min-h-screen max-w-6xl mx-auto">
        <div className="sticky top-0 bg-[#1a1f2e] border-b border-gray-700 z-10 shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Pre-Testing Checklist - {distributor.distributor_id}
                </h2>
                <p className="text-gray-400 text-lg">{distributor.kast_naam || 'Naamloos'}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openChecklistInNewWindow(distributor, checklist, approvalData, currentUser, viewMode, (updatedChecklist, updatedApprovalData) => {
                    setChecklist(updatedChecklist);
                    setApprovalData(updatedApprovalData);
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink size={20} />
                  <span>Open in nieuw venster</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {approvalData.status === 'reviewed' && (
              <div className={`p-4 rounded-lg ${approvalData.overallApproval ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {approvalData.overallApproval ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
                  <h3 className="font-semibold text-white">
                    {approvalData.overallApproval ? 'Goedgekeurd voor testen' : 'Afgekeurd - aanpassingen nodig'}
                  </h3>
                </div>
                <p className="text-sm text-gray-300">Beoordeeld door: {approvalData.reviewedBy} op {new Date(approvalData.reviewedAt).toLocaleString('nl-NL')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 pb-32">
          {viewMode === 'form' && (
            <div className="space-y-5">
              {checklist.map((item, index) => (
                <div key={item.id} className="bg-[#252d3d] p-6 rounded-lg shadow-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 font-mono">{index + 1}.</span>
                    <div className="flex-1 space-y-3">
                      <p className="text-white">{item.question}</p>

                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={item.checked === true}
                            onChange={() => handleChecklistChange(item.id, 'checked', true)}
                            disabled={approvalData.status === 'submitted'}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">Ja</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={item.checked === false}
                            onChange={() => handleChecklistChange(item.id, 'checked', false)}
                            disabled={approvalData.status === 'submitted'}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">Nee</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={item.checked === 'n.v.t'}
                            onChange={() => handleChecklistChange(item.id, 'checked', 'n.v.t')}
                            disabled={approvalData.status === 'submitted'}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">N.V.T.</span>
                        </label>
                      </div>

                      <textarea
                        value={item.comments}
                        onChange={(e) => handleChecklistChange(item.id, 'comments', e.target.value)}
                        placeholder="Optionele opmerkingen..."
                        disabled={approvalData.status === 'submitted'}
                        className="w-full bg-[#1a1f2e] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 text-sm disabled:opacity-50"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-[#252d3d] p-4 rounded-lg">
                <label className="block text-sm text-gray-400 mb-2">Ingediend door:</label>
                <input
                  type="text"
                  value={approvalData.submittedBy || currentUser?.username || ''}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, submittedBy: e.target.value }))}
                  className="w-full bg-[#1a1f2e] border border-gray-600 rounded px-3 py-2 text-white"
                  disabled={approvalData.status === 'submitted'}
                />
              </div>
            </div>
          )}

          {viewMode === 'review' && (
            <div className="space-y-6">
              {checklist.map((item, index) => (
                <div key={item.id} className="bg-[#252d3d] p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-400 font-mono">{index + 1}.</span>
                    <div className="flex-1 space-y-3">
                      <p className="text-white">{item.question}</p>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Montage antwoord:</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.checked === true ? 'bg-green-500/20 text-green-400' :
                          item.checked === false ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.checked === true ? 'Ja' : item.checked === false ? 'Nee' : 'N.V.T.'}
                        </span>
                      </div>

                      {item.comments && (
                        <div className="bg-[#1a1f2e] p-3 rounded">
                          <p className="text-sm text-gray-400 mb-1">Opmerkingen montage:</p>
                          <p className="text-sm text-gray-300">{item.comments}</p>
                        </div>
                      )}

                      {(currentUser?.role === 'tester' || currentUser?.role === 'admin') && !approvalData.reviewedAt && (
                        <div className="space-y-2 pt-2 border-t border-gray-700">
                          <label className="block text-sm text-gray-400">Beoordeling tester:</label>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.approved === true}
                                onChange={() => handleTesterReview(item.id, true, item.testerComments || '')}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-green-400">Goedkeuren</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.approved === false}
                                onChange={() => handleTesterReview(item.id, false, item.testerComments || '')}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-red-400">Afkeuren</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={item.approved === 'n.v.t'}
                                onChange={() => handleTesterReview(item.id, 'n.v.t', item.testerComments || '')}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-400">N.V.T.</span>
                            </label>
                          </div>
                          <textarea
                            value={item.testerComments || ''}
                            onChange={(e) => handleTesterReview(item.id, item.approved || false, e.target.value)}
                            placeholder="Optionele opmerkingen van tester..."
                            className="w-full bg-[#1a1f2e] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 text-sm"
                            rows={2}
                          />
                        </div>
                      )}

                      {approvalData.reviewedAt && (
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-400">Tester beoordeling:</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              item.approved === true ? 'bg-green-500/20 text-green-400' :
                              item.approved === false ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {item.approved === true ? 'Goedgekeurd' : item.approved === false ? 'Afgekeurd' : 'N.V.T.'}
                            </span>
                          </div>
                          {item.testerComments && (
                            <div className="bg-[#1a1f2e] p-3 rounded">
                              <p className="text-sm text-gray-400 mb-1">Opmerkingen tester:</p>
                              <p className="text-sm text-gray-300">{item.testerComments}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(currentUser?.role === 'tester' || currentUser?.role === 'admin') && !approvalData.reviewedAt && (
                <div className="bg-[#252d3d] p-4 rounded-lg space-y-4">
                  <label className="block text-sm text-gray-400">Eindoordeel:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={approvalData.overallApproval === true}
                        onChange={() => setApprovalData(prev => ({ ...prev, overallApproval: true }))}
                        className="w-4 h-4"
                      />
                      <span className="text-green-400">Verdeler goedkeuren voor testfase</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={approvalData.overallApproval === false}
                        onChange={() => setApprovalData(prev => ({ ...prev, overallApproval: false }))}
                        className="w-4 h-4"
                      />
                      <span className="text-red-400">Verdeler afkeuren</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={approvalData.reviewedBy || currentUser?.username || ''}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, reviewedBy: e.target.value }))}
                    placeholder="Naam tester"
                    className="w-full bg-[#1a1f2e] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-gray-700 p-6 shadow-2xl">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Sluiten
            </button>

            <div className="flex gap-3">
              {viewMode === 'form' && approvalData.status !== 'submitted' && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={!isFormComplete() || isSubmitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Indienen...' : 'Indienen voor Beoordeling'}
                </button>
              )}

              {viewMode === 'review' && !approvalData.reviewedAt && (currentUser?.role === 'tester' || currentUser?.role === 'admin') && (
                <button
                  onClick={handleTesterApproval}
                  disabled={!isTesterReviewComplete() || isSubmitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Bezig...' : 'Beoordeling Opslaan'}
                </button>
              )}

              {approvalData.reviewedAt && approvalData.overallApproval === false && (currentUser?.role === 'montage' || currentUser?.role === 'admin') && (
                <button
                  onClick={handleResubmitApproval}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                >
                  Opnieuw Indienen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerdelerPreTestingApproval;
