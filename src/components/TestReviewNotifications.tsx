import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';

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
  projects?: {
    id: string;
    project_number: string;
    location: string;
  };
  distributors?: {
    id: string;
    distributor_id: string;
    kast_naam: string;
  };
}

const TestReviewNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<TestReviewNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();

  const loadNotifications = async () => {
    try {
      console.log('🔔 TEST REVIEW: Loading notifications...');
      setLoading(true);
      const data = await dataService.getTestReviewNotifications('pending_review');
      console.log('🔔 TEST REVIEW: Loaded notifications:', data);

      // Filter notifications by user's assigned locations (admins see all)
      let filteredData = data || [];

      if (currentUser && currentUser.role !== 'admin' && currentUser.assignedLocations && currentUser.assignedLocations.length > 0) {
        const hasAllLocations =
          currentUser.assignedLocations.length >= AVAILABLE_LOCATIONS.length ||
          AVAILABLE_LOCATIONS.every(loc => currentUser.assignedLocations.includes(loc));

        if (!hasAllLocations) {
          filteredData = filteredData.filter((notification: TestReviewNotification) => {
            const projectLocation = notification.projects?.location;
            const hasAccess = projectLocation ? currentUser.assignedLocations.includes(projectLocation) : true;

            if (!hasAccess) {
              console.log(`🌍 TEST REVIEW FILTER: Hiding notification for project ${notification.projects?.project_number} (location: ${projectLocation}) from user ${currentUser.username}`);
            }

            return hasAccess;
          });
          console.log(`🌍 TEST REVIEW FILTER: Filtered ${data.length} notifications down to ${filteredData.length} for user ${currentUser.username}`);
        }
      }

      setNotifications(filteredData);
    } catch (error) {
      console.error('❌ TEST REVIEW: Error loading test review notifications:', error);
      toast.error('Kon test review meldingen niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔔 TEST REVIEW: Component mounted');
    if (currentUser) {
      loadNotifications();
    }

    // Reload notifications every 30 seconds
    const interval = setInterval(() => {
      if (currentUser) {
        loadNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const getTestTypeLabel = (testType: string) => {
    switch (testType) {
      case 'verdeler_testing_tot_630':
        return 'Verdeler Tot 630A';
      case 'verdeler_test_simpel':
        return 'Verdeler Test Simpel';
      case 'verdeler_vanaf_630':
        return 'Verdeler Vanaf 630A';
      default:
        return testType;
    }
  };

  const handleViewTest = (notification: TestReviewNotification) => {
    // Navigate to the project page with verdeler ID to auto-open the test
    navigate(`/project/${notification.project_id}?verdeler=${notification.distributor_id}&openTest=true`);
  };

  const handleApprove = async (notification: TestReviewNotification) => {
    try {
      const currentUser = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUser);
      const userName = user?.name || 'Admin';

      toast.loading('Test wordt goedgekeurd en PDF wordt gegenereerd...');

      // Try to get test data from notification first, then from database
      let testData = notification.test_data;

      if (!testData) {
        // Get the test data from database
        const testDataRecords = await dataService.getTestData(notification.distributor_id);

        // Map notification test type to database test type
        let dbTestType = notification.test_type;
        if (notification.test_type === 'verdeler_testing_tot_630') {
          dbTestType = 'workshop_checklist';
        }
        // Note: 'verdeler_vanaf_630' and 'verdeler_test_simpel' match the database test types

        const testRecord = testDataRecords?.find((t: any) => t.test_type === dbTestType);

        if (!testRecord || !testRecord.data) {
          throw new Error('Test data niet gevonden');
        }

        testData = testRecord.data;
      }

      // Map notification test type to database test type for saving
      let dbTestType = notification.test_type;
      if (notification.test_type === 'verdeler_testing_tot_630') {
        dbTestType = 'workshop_checklist';
      }

      // Auto-fill and approve all fields based on test type
      if (notification.test_type === 'verdeler_testing_tot_630') {
        // Update workshopChecklist
        if (testData.workshopChecklist) {
          testData.workshopChecklist.date = new Date().toISOString().split('T')[0];
          testData.workshopChecklist.testedBy = userName;
          testData.workshopChecklist.completed = true;

          // Set all items to "akkoord"
          if (testData.workshopChecklist.items) {
            testData.workshopChecklist.items = testData.workshopChecklist.items.map((item: any) => ({
              ...item,
              passed: item.options?.includes('text') ? 'akkoord' : 'akkoord'
            }));
          }
        }

        // Update inspectionReport
        if (testData.inspectionReport) {
          testData.inspectionReport.date = new Date().toISOString().split('T')[0];
          testData.inspectionReport.inspectedBy = userName;
          testData.inspectionReport.approvedBy = userName;
          testData.inspectionReport.result = 'approved';
          testData.inspectionReport.completed = true;

          // Set all items to true (approved)
          if (testData.inspectionReport.items) {
            testData.inspectionReport.items = testData.inspectionReport.items.map((item: any) => ({
              ...item,
              passed: true
            }));
          }
        }

        // Save the updated test data
        await dataService.createTestData({
          distributorId: notification.distributor_id,
          testType: dbTestType,
          data: testData
        });

        // Generate the PDF
        const { generateVerdelerTestingPDF } = await import('./VerdelerTestingPDF');

        // Get project and verdeler info
        const distributors = await dataService.getDistributorsByProject(notification.project_id);
        const verdeler = distributors?.find((d: any) => d.id === notification.distributor_id);

        if (verdeler) {
          await generateVerdelerTestingPDF(
            testData,
            verdeler,
            notification.projects?.project_number || '',
            notification.project_id,
            notification.distributor_id
          );
        }
      } else if (notification.test_type === 'verdeler_vanaf_630') {
        // Handle vanaf 630 test type
        if (testData.verdelerVanaf630Test) {
          testData.verdelerVanaf630Test.date = new Date().toISOString().split('T')[0];
          testData.verdelerVanaf630Test.testedBy = userName;
          testData.verdelerVanaf630Test.approvedBy = userName;
          testData.verdelerVanaf630Test.result = 'approved';
          testData.verdelerVanaf630Test.completed = true;

          // Set all checklist items to true
          if (testData.verdelerVanaf630Test.checklist) {
            Object.keys(testData.verdelerVanaf630Test.checklist).forEach(key => {
              if (typeof testData.verdelerVanaf630Test.checklist[key] === 'boolean') {
                testData.verdelerVanaf630Test.checklist[key] = true;
              }
            });
          }
        }

        await dataService.createTestData({
          distributorId: notification.distributor_id,
          testType: dbTestType,
          data: testData
        });

        const { generateVerdelerVanaf630PDF } = await import('./VerdelerVanaf630PDF');
        const distributors = await dataService.getDistributorsByProject(notification.project_id);
        const verdeler = distributors?.find((d: any) => d.id === notification.distributor_id);

        if (verdeler) {
          await generateVerdelerVanaf630PDF(
            testData,
            verdeler,
            notification.projects?.project_number || ''
          );
        }
      } else if (notification.test_type === 'verdeler_test_simpel') {
        // Handle simpel test type
        if (testData.verdelerTestSimpel) {
          testData.verdelerTestSimpel.date = new Date().toISOString().split('T')[0];
          testData.verdelerTestSimpel.testedBy = userName;
          testData.verdelerTestSimpel.approvedBy = userName;
          testData.verdelerTestSimpel.result = 'approved';
          testData.verdelerTestSimpel.completed = true;

          // Set all checklist items to true
          if (testData.verdelerTestSimpel.checklist) {
            Object.keys(testData.verdelerTestSimpel.checklist).forEach(key => {
              if (typeof testData.verdelerTestSimpel.checklist[key] === 'boolean') {
                testData.verdelerTestSimpel.checklist[key] = true;
              }
            });
          }
        }

        await dataService.createTestData({
          distributorId: notification.distributor_id,
          testType: dbTestType,
          data: testData
        });

        const { generateVerdelerTestSimpelPDF } = await import('./VerdelerTestSimpelPDF');
        const distributors = await dataService.getDistributorsByProject(notification.project_id);
        const verdeler = distributors?.find((d: any) => d.id === notification.distributor_id);

        if (verdeler) {
          await generateVerdelerTestSimpelPDF(
            testData,
            verdeler,
            notification.projects?.project_number || ''
          );
        }
      }

      // Update the notification status
      await dataService.updateTestReviewNotification(notification.id, {
        status: 'approved',
        reviewedBy: userName
      });

      toast.dismiss();
      toast.success('Test goedgekeurd en PDF gegenereerd!');
      loadNotifications();
    } catch (error) {
      console.error('Error approving test:', error);
      toast.dismiss();
      toast.error('Fout bij goedkeuren van test');
    }
  };

  const handleReject = async (notification: TestReviewNotification) => {
    try {
      const currentUser = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUser);

      const notes = prompt('Reden voor afkeuring (optioneel):');

      await dataService.updateTestReviewNotification(notification.id, {
        status: 'rejected',
        reviewedBy: user?.name || 'Admin',
        reviewNotes: notes || undefined
      });

      toast.success('Test afgekeurd');
      loadNotifications();
    } catch (error) {
      console.error('Error rejecting test:', error);
      toast.error('Fout bij afkeuren van test');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minuten geleden`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? 'uur' : 'uren'} geleden`;
    } else {
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="text-yellow-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Tests Ter Controle</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="text-green-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Tests Ter Controle</h2>
        </div>
        <p className="text-gray-400 text-center py-4">Geen tests wachten op controle</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="text-yellow-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Tests Ter Controle</h2>
          <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
            {notifications.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-gray-800 border border-yellow-400/30 rounded-lg p-4 hover:border-yellow-400/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="text-yellow-400" size={16} />
                  <span className="text-xs text-gray-400">
                    {formatDate(notification.submitted_at)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">
                      Project {notification.projects?.project_number}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">
                      {notification.distributors?.kast_naam || notification.distributors?.distributor_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">Locatie:</span>
                    <span className="text-gray-300">{notification.projects?.location}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">Test:</span>
                    <span className="text-blue-400">{getTestTypeLabel(notification.test_type)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">Ingediend door:</span>
                    <span className="text-gray-300">{notification.submitted_by}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleViewTest(notification)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  title="Bekijk test"
                >
                  <Eye size={16} />
                  <span>Bekijken</span>
                </button>

                <button
                  onClick={() => handleApprove(notification)}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  title="Goedkeuren"
                >
                  <CheckCircle size={16} />
                  <span>Goedkeuren</span>
                </button>

                <button
                  onClick={() => handleReject(notification)}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  title="Afkeuren"
                >
                  <XCircle size={16} />
                  <span>Afkeuren</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestReviewNotifications;
