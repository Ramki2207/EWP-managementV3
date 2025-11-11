import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckSquare, X, AlertTriangle, User, Calendar, MessageSquare, Save, Eye, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import VerdelerChecklistWindow from './VerdelerChecklistWindow';

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

  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');

    if (!newWindow) {
      toast.error('Pop-up geblokkeerd. Sta pop-ups toe voor deze site.');
      return;
    }

    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pre-Testing Checklist - ${distributor.distributor_id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
      </html>
    `);
    newWindow.document.close();

    const rootElement = newWindow.document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <>
          <Toaster position="top-right" />
          <VerdelerChecklistWindow
            distributor={distributor}
            initialChecklist={checklist}
            initialApprovalData={approvalData}
            currentUser={currentUser}
            viewMode={viewMode}
            onClose={() => newWindow.close()}
          />
        </>
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2e] rounded-xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Pre-Testing Checklist - {distributor.distributor_id}
              </h2>
              <p className="text-gray-400">{distributor.kast_naam || 'Naamloos'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <ExternalLink className="mx-auto mb-4 text-blue-400" size={64} />
            <h3 className="text-xl font-semibold text-white mb-3">Open Checklist in Nieuw Venster</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              De pre-testing checklist wordt geopend in een nieuw venster voor een betere weergave en meer ruimte.
            </p>
            <button
              onClick={handleOpenInNewWindow}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-lg"
            >
              <ExternalLink size={24} />
              <span>Open in nieuw venster</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 bg-[#1a1f2e] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerdelerPreTestingApproval;
