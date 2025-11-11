import React, { useState, useEffect } from 'react';
import { CheckSquare, X, AlertTriangle, User, Calendar, MessageSquare, Save, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';

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

  const getApprovalIcon = (approved: boolean | null | 'n.v.t') => {
    if (approved === true) return <span className="text-green-400 text-lg">✓</span>;
    if (approved === false) return <span className="text-red-400 text-lg">✗</span>;
    if (approved === 'n.v.t') return <span className="text-blue-400 text-lg">—</span>;
    return <span className="text-gray-400 text-lg">?</span>;
  };

  const getApprovalColor = (approved: boolean | null | 'n.v.t') => {
    if (approved === true) return 'bg-green-500/20 text-green-400';
    if (approved === false) return 'bg-red-500/20 text-red-400';
    if (approved === 'n.v.t') return 'bg-blue-500/20 text-blue-400';
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
                {distributor.distributor_id} - {distributor.kast_naam || 'KLK'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {viewMode === 'form' ? (
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

            <div className="bg-[#2A303C] rounded-lg p-4">
              <h3 className="font-medium text-gray-300 mb-4">Productie Checklist</h3>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="bg-[#1E2530] p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-white">
                        {item.question}
                      </span>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleChecklistChange(item.id, 'checked', true)}
                          className={`px-3 py-1 rounded text-xs transition ${
                            item.checked === true
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-700 hover:bg-green-500/20 text-gray-300'
                          }`}
                        >
                          ✓ Ja
                        </button>
                        <button
                          onClick={() => handleChecklistChange(item.id, 'checked', false)}
                          className={`px-3 py-1 rounded text-xs transition ${
                            item.checked === false
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-700 hover:bg-red-500/20 text-gray-300'
                          }`}
                        >
                          ✗ Nee
                        </button>
                        <button
                          onClick={() => handleChecklistChange(item.id, 'checked', 'n.v.t')}
                          className={`px-3 py-1 rounded text-xs transition ${
                            item.checked === 'n.v.t'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-700 hover:bg-blue-500/20 text-gray-300'
                          }`}
                        >
                          — N.v.t
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-400 mb-1">Opmerkingen</label>
                      <textarea
                        className="input-field text-sm"
                        rows={2}
                        value={item.comments}
                        onChange={(e) => handleChecklistChange(item.id, 'comments', e.target.value)}
                        placeholder="Beschrijf de status van dit item..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Annuleren
              </button>
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting || !isFormComplete()}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{isSubmitting ? 'Indienen...' : 'Indienen voor beoordeling'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {approvalData.status === 'reviewed' && (
              <div className={`p-4 rounded-lg ${approvalData.overallApproval ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {approvalData.overallApproval ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
                  <h3 className="font-semibold text-white">
                    {approvalData.overallApproval ? 'Goedgekeurd voor testen' : 'Afgekeurd - aanpassingen nodig'}
                  </h3>
                </div>
                <p className="text-sm text-gray-300">Beoordeeld door: {approvalData.reviewedBy} op {new Date(approvalData.reviewedAt).toLocaleString('nl-NL')}</p>
                {currentUser?.role === 'montage' && !approvalData.overallApproval && (
                  <button
                    onClick={handleResubmitApproval}
                    className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
                  >
                    Opnieuw indienen
                  </button>
                )}
              </div>
            )}

            {approvalData.status === 'submitted' && !approvalData.reviewedAt && (currentUser?.role === 'tester' || currentUser?.role === 'admin') && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock size={16} className="text-blue-400" />
                  <h3 className="font-medium text-blue-400">Wacht op tester beoordeling</h3>
                </div>
                <p className="text-blue-300 text-sm">
                  Deze checklist is ingediend door {approvalData.submittedBy} op {new Date(approvalData.submittedAt).toLocaleString('nl-NL')}.
                  Beoordeel alle items hieronder.
                </p>
              </div>
            )}

            <div className="bg-[#2A303C] rounded-lg p-4">
              <h3 className="font-medium text-gray-300 mb-4">Ingediende Checklist</h3>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="bg-[#1E2530] p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-white flex-1">
                        {item.question}
                      </span>
                      <span className={`px-3 py-1 rounded text-xs ml-4 ${
                        item.checked === true ? 'bg-green-500/20 text-green-400' :
                        item.checked === 'n.v.t' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.checked === true ? '✓ Ja' : item.checked === 'n.v.t' ? '— N.v.t' : '✗ Nee'}
                      </span>
                    </div>
                    {item.comments && (
                      <div className="mb-3">
                        <label className="block text-xs text-gray-400 mb-1">Monteur opmerkingen:</label>
                        <p className="text-sm text-gray-300 bg-[#0F1419] p-2 rounded">{item.comments}</p>
                      </div>
                    )}

                    {(currentUser?.role === 'tester' || currentUser?.role === 'admin') && !approvalData.reviewedAt && (
                      <div className="mt-3 border-t border-gray-700 pt-3">
                        <label className="block text-xs text-gray-400 mb-2">Tester beoordeling:</label>
                        <div className="flex space-x-2 mb-2">
                          <button
                            onClick={() => handleTesterReview(item.id, true, item.testerComments || '')}
                            className={`px-3 py-1 rounded text-xs transition ${
                              item.approved === true ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-green-500/20 text-gray-300'
                            }`}
                          >
                            ✓ Goedkeuren
                          </button>
                          <button
                            onClick={() => handleTesterReview(item.id, false, item.testerComments || '')}
                            className={`px-3 py-1 rounded text-xs transition ${
                              item.approved === false ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-red-500/20 text-gray-300'
                            }`}
                          >
                            ✗ Afkeuren
                          </button>
                          <button
                            onClick={() => handleTesterReview(item.id, 'n.v.t', item.testerComments || '')}
                            className={`px-3 py-1 rounded text-xs transition ${
                              item.approved === 'n.v.t' ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-blue-500/20 text-gray-300'
                            }`}
                          >
                            — N.v.t
                          </button>
                        </div>
                        <textarea
                          className="input-field text-sm"
                          rows={2}
                          value={item.testerComments}
                          onChange={(e) => handleTesterReview(item.id, item.approved || null, e.target.value)}
                          placeholder="Tester opmerkingen (optioneel)..."
                        />
                      </div>
                    )}

                    {item.approved !== null && item.approved !== undefined && approvalData.reviewedAt && (
                      <div className="mt-3 border-t border-gray-700 pt-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs ${getApprovalColor(item.approved)}`}>
                            {getApprovalIcon(item.approved)}
                            {item.approved === true ? ' Goedgekeurd' : item.approved === 'n.v.t' ? ' N.v.t' : ' Afgekeurd'}
                          </span>
                        </div>
                        {item.testerComments && (
                          <p className="text-sm text-gray-300 bg-[#0F1419] p-2 rounded mt-2">{item.testerComments}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {(currentUser?.role === 'tester' || currentUser?.role === 'admin') && !approvalData.reviewedAt && (
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3">Eindoordeel</h3>
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setApprovalData({ ...approvalData, overallApproval: true })}
                      className={`flex-1 px-4 py-3 rounded-lg transition ${
                        approvalData.overallApproval === true
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 hover:bg-green-500/20 text-gray-300'
                      }`}
                    >
                      ✓ Goedkeuren voor testen
                    </button>
                    <button
                      onClick={() => setApprovalData({ ...approvalData, overallApproval: false })}
                      className={`flex-1 px-4 py-3 rounded-lg transition ${
                        approvalData.overallApproval === false
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-700 hover:bg-red-500/20 text-gray-300'
                      }`}
                    >
                      ✗ Afkeuren (terug naar productie)
                    </button>
                  </div>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={approvalData.generalComments}
                    onChange={(e) => setApprovalData({ ...approvalData, generalComments: e.target.value })}
                    placeholder="Algemene opmerkingen (optioneel)..."
                  />
                  <input
                    type="text"
                    className="input-field"
                    value={approvalData.reviewedBy}
                    onChange={(e) => setApprovalData({ ...approvalData, reviewedBy: e.target.value })}
                    placeholder="Naam tester *"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Sluiten
              </button>
              {(currentUser?.role === 'tester' || currentUser?.role === 'admin') && !approvalData.reviewedAt && (
                <button
                  onClick={handleTesterApproval}
                  disabled={isSubmitting || !isTesterReviewComplete()}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? 'Opslaan...' : 'Beoordeling opslaan'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerdelerPreTestingApproval;
