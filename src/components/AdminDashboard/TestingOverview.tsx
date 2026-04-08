import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Clock, Eye, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../../lib/supabase';

interface PreTestingApproval {
  project: any;
  distributor: any;
  status: string;
  submittedBy: string;
  submittedAt: string;
}

interface TestReviewNotification {
  id: string;
  project_id: string;
  distributor_id: string;
  test_type: string;
  status: string;
  submitted_by: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  test_data?: any;
  projects?: { id: string; project_number: string; location: string };
  distributors?: { id: string; distributor_id: string; kast_naam: string };
}

interface TestingOverviewProps {
  projects: any[];
}

const TestingOverview: React.FC<TestingOverviewProps> = ({ projects }) => {
  const navigate = useNavigate();
  const [preTestingApprovals, setPreTestingApprovals] = useState<PreTestingApproval[]>([]);
  const [testReviewNotifications, setTestReviewNotifications] = useState<TestReviewNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPreTestingApprovals = useCallback(async () => {
    const approvals: PreTestingApproval[] = [];

    for (const project of projects) {
      if (!project.distributors?.length) continue;

      for (const distributor of project.distributors) {
        if (distributor.status?.toLowerCase() !== 'testen') continue;

        try {
          const testData = await dataService.getTestData(distributor.id);
          const approvalRecord = testData?.find(
            (data: any) => data.test_type === 'verdeler_pre_testing_approval'
          );

          if (
            approvalRecord?.data?.approvalData?.status === 'submitted' &&
            !approvalRecord.data.approvalData.reviewedAt
          ) {
            approvals.push({
              project,
              distributor,
              status: 'submitted',
              submittedBy: approvalRecord.data.approvalData.submittedBy,
              submittedAt: approvalRecord.data.approvalData.submittedAt,
            });
          }
        } catch (err) {
          console.error('Error checking pre-testing approval:', err);
        }
      }
    }

    setPreTestingApprovals(approvals);
  }, [projects]);

  const loadTestReviewNotifications = useCallback(async () => {
    try {
      const data = await dataService.getTestReviewNotifications('pending_review');
      setTestReviewNotifications(data || []);
    } catch (err) {
      console.error('Error loading test review notifications:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadPreTestingApprovals(), loadTestReviewNotifications()]);
      setLoading(false);
    };
    load();

    const interval = setInterval(loadTestReviewNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadPreTestingApprovals, loadTestReviewNotifications]);

  const getTestTypeLabel = (testType: string) => {
    switch (testType) {
      case 'verdeler_testing_tot_630': return 'Verdeler Tot 630A';
      case 'verdeler_test_simpel': return 'Verdeler Test Simpel';
      case 'verdeler_vanaf_630': return 'Verdeler Vanaf 630A';
      default: return testType;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} min geleden`;
    }
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? 'uur' : 'uren'} geleden`;
    }
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleViewTest = (notification: TestReviewNotification) => {
    navigate(`/project/${notification.project_id}?verdeler=${notification.distributor_id}&openTest=true`);
  };

  const handleApproveTest = async (notification: TestReviewNotification) => {
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUserId);
      const userName = user?.name || 'Admin';

      toast.loading('Test wordt goedgekeurd en PDF wordt gegenereerd...');

      let testData = notification.test_data;
      if (!testData) {
        const testDataRecords = await dataService.getTestData(notification.distributor_id);
        let dbTestType = notification.test_type;
        if (notification.test_type === 'verdeler_testing_tot_630') dbTestType = 'workshop_checklist';
        const testRecord = testDataRecords?.find((t: any) => t.test_type === dbTestType);
        if (!testRecord?.data) throw new Error('Test data niet gevonden');
        testData = testRecord.data;
      }

      let dbTestType = notification.test_type;
      if (notification.test_type === 'verdeler_testing_tot_630') dbTestType = 'workshop_checklist';

      if (notification.test_type === 'verdeler_testing_tot_630') {
        if (testData.workshopChecklist) {
          testData.workshopChecklist.date = new Date().toISOString().split('T')[0];
          testData.workshopChecklist.testedBy = userName;
          testData.workshopChecklist.completed = true;
          if (testData.workshopChecklist.items) {
            testData.workshopChecklist.items = testData.workshopChecklist.items.map((item: any) => ({ ...item, passed: 'akkoord' }));
          }
        }
        if (testData.inspectionReport) {
          testData.inspectionReport.date = new Date().toISOString().split('T')[0];
          testData.inspectionReport.inspectedBy = userName;
          testData.inspectionReport.approvedBy = userName;
          testData.inspectionReport.result = 'approved';
          testData.inspectionReport.completed = true;
          if (testData.inspectionReport.items) {
            testData.inspectionReport.items = testData.inspectionReport.items.map((item: any) => ({ ...item, passed: true }));
          }
        }
        await dataService.createTestData({ distributorId: notification.distributor_id, testType: dbTestType, data: testData });
        const { generateVerdelerTestingPDF } = await import('../VerdelerTestingPDF');
        const distributors = await dataService.getDistributorsByProject(notification.project_id);
        const verdeler = distributors?.find((d: any) => d.id === notification.distributor_id);
        if (verdeler) await generateVerdelerTestingPDF(testData, verdeler, notification.projects?.project_number || '', notification.project_id, notification.distributor_id);
      } else if (notification.test_type === 'verdeler_vanaf_630') {
        if (testData.verdelerVanaf630Test) {
          testData.verdelerVanaf630Test.date = new Date().toISOString().split('T')[0];
          testData.verdelerVanaf630Test.testedBy = userName;
          testData.verdelerVanaf630Test.approvedBy = userName;
          testData.verdelerVanaf630Test.result = 'approved';
          testData.verdelerVanaf630Test.completed = true;
          if (testData.verdelerVanaf630Test.checklist) {
            Object.keys(testData.verdelerVanaf630Test.checklist).forEach(key => {
              if (typeof testData.verdelerVanaf630Test.checklist[key] === 'boolean') testData.verdelerVanaf630Test.checklist[key] = true;
            });
          }
        }
        await dataService.createTestData({ distributorId: notification.distributor_id, testType: dbTestType, data: testData });
        const { generateVerdelerVanaf630PDF } = await import('../VerdelerVanaf630PDF');
        const distributors = await dataService.getDistributorsByProject(notification.project_id);
        const verdeler = distributors?.find((d: any) => d.id === notification.distributor_id);
        if (verdeler) await generateVerdelerVanaf630PDF(testData, verdeler, notification.projects?.project_number || '');
      } else if (notification.test_type === 'verdeler_test_simpel') {
        if (testData.verdelerTestSimpel) {
          testData.verdelerTestSimpel.date = new Date().toISOString().split('T')[0];
          testData.verdelerTestSimpel.testedBy = userName;
          testData.verdelerTestSimpel.approvedBy = userName;
          testData.verdelerTestSimpel.result = 'approved';
          testData.verdelerTestSimpel.completed = true;
          if (testData.verdelerTestSimpel.checklist) {
            Object.keys(testData.verdelerTestSimpel.checklist).forEach(key => {
              if (typeof testData.verdelerTestSimpel.checklist[key] === 'boolean') testData.verdelerTestSimpel.checklist[key] = true;
            });
          }
        }
        await dataService.createTestData({ distributorId: notification.distributor_id, testType: dbTestType, data: testData });
        const { generateVerdelerTestSimpelPDF } = await import('../VerdelerTestSimpelPDF');
        const distributors = await dataService.getDistributorsByProject(notification.project_id);
        const verdeler = distributors?.find((d: any) => d.id === notification.distributor_id);
        if (verdeler) await generateVerdelerTestSimpelPDF(testData, verdeler, notification.projects?.project_number || '');
      }

      await dataService.updateTestReviewNotification(notification.id, { status: 'approved', reviewedBy: userName });
      toast.dismiss();
      toast.success('Test goedgekeurd en PDF gegenereerd!');
      loadTestReviewNotifications();
    } catch (error) {
      console.error('Error approving test:', error);
      toast.dismiss();
      toast.error('Fout bij goedkeuren van test');
    }
  };

  const handleRejectTest = async (notification: TestReviewNotification) => {
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUserId);
      const notes = prompt('Reden voor afkeuring (optioneel):');
      await dataService.updateTestReviewNotification(notification.id, {
        status: 'rejected',
        reviewedBy: user?.name || 'Admin',
        reviewNotes: notes || undefined,
      });
      toast.success('Test afgekeurd');
      loadTestReviewNotifications();
    } catch (error) {
      console.error('Error rejecting test:', error);
      toast.error('Fout bij afkeuren van test');
    }
  };

  const totalItems = preTestingApprovals.length + testReviewNotifications.length;

  if (loading) {
    return (
      <div className="card border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <FlaskConical size={20} className="text-cyan-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Testen - openstaande punten</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="card border border-green-500/30 bg-green-500/5">
        <div className="flex items-center gap-3 p-1">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <FlaskConical size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-green-400">Testen - openstaande punten</h2>
            <p className="text-sm text-gray-400">Geen openstaande test items.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-cyan-500/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <FlaskConical size={20} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Testen - openstaande punten</h2>
          <p className="text-sm text-gray-400">
            {totalItems} item{totalItems !== 1 ? 's' : ''} wacht{totalItems === 1 ? '' : 'en'} op actie
          </p>
        </div>
      </div>

      {preTestingApprovals.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-2">
            <ShieldCheck size={14} />
            Pre-Testing Goedkeuringen ({preTestingApprovals.length})
          </h3>
          <div className="space-y-2">
            {preTestingApprovals.map((approval, index) => (
              <div
                key={`pre-${index}`}
                onClick={() => navigate(`/project/${approval.project.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5 cursor-pointer transition-all hover:border-orange-500/40 hover:scale-[1.01]"
              >
                <span className="text-xl flex-shrink-0">&#9203;</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    Project {approval.project.project_number} - {approval.distributor?.distributor_id || 'Verdeler'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {approval.distributor?.kast_naam && `${approval.distributor.kast_naam} \u2022 `}
                    Ingediend door {approval.submittedBy}
                    {approval.submittedAt && ` \u2022 ${new Date(approval.submittedAt).toLocaleDateString('nl-NL')}`}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                  Wacht op beoordeling
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {testReviewNotifications.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3 flex items-center gap-2">
            <Clock size={14} />
            Tests Ter Controle ({testReviewNotifications.length})
          </h3>
          <div className="space-y-2">
            {testReviewNotifications.map(notification => (
              <div
                key={notification.id}
                className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 transition-all hover:border-yellow-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        Project {notification.projects?.project_number} - {notification.distributors?.kast_naam || notification.distributors?.distributor_id}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span>{notification.projects?.location}</span>
                      <span className="text-blue-400">{getTestTypeLabel(notification.test_type)}</span>
                      <span>door {notification.submitted_by}</span>
                      <span>{formatDate(notification.submitted_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleViewTest(notification)}
                      className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors"
                      title="Bekijken"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleApproveTest(notification)}
                      className="p-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors"
                      title="Goedkeuren"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handleRejectTest(notification)}
                      className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
                      title="Afkeuren"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingOverview;
