import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await dataService.getTestReviewNotifications('pending_review');
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading test review notifications:', error);
      toast.error('Kon test review meldingen niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Reload notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
    // Navigate to the verdeler details page
    navigate(`/verdelers/${notification.distributor_id}`);
  };

  const handleApprove = async (notification: TestReviewNotification) => {
    try {
      const currentUser = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUser);

      await dataService.updateTestReviewNotification(notification.id, {
        status: 'approved',
        reviewedBy: user?.name || 'Admin'
      });

      toast.success('Test goedgekeurd!');
      loadNotifications();
    } catch (error) {
      console.error('Error approving test:', error);
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
