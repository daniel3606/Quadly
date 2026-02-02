'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';

interface Report {
  id: string;
  reporter_user_id: string;
  target_type: 'POST' | 'COMMENT' | 'REVIEW' | 'USER';
  target_id: string;
  reason_code: string;
  description?: string;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  created_at: string;
  reporter?: {
    id: string;
    nickname: string;
  };
  post?: {
    id: string;
    title: string;
  };
  comment?: {
    id: string;
    body: string;
  };
  review?: {
    id: string;
    text_body: string;
  };
}

interface User {
  id: string;
  email: string;
  nickname: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.setToken(token);

    // Check user role
    apiClient
      .get<User>('/auth/me')
      .then((userData) => {
        if (userData.role !== 'ADMIN' && userData.role !== 'MODERATOR') {
          setError('Access denied. Admin or Moderator role required.');
          setLoading(false);
          return;
        }
        setUser(userData);
        loadReports();
      })
      .catch((err) => {
        console.error('Failed to fetch user:', err);
        setError('Failed to authenticate');
        setLoading(false);
      });
  }, [router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{
        data: Report[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>(`/reports?status=${statusFilter}&page=${page}&pageSize=20`);
      setReports(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [statusFilter, page, user]);

  const handleStatusUpdate = async (reportId: string, newStatus: 'RESOLVED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/reports/${reportId}/status`, { status: newStatus });
      loadReports();
    } catch (err) {
      console.error('Failed to update report status:', err);
      alert('Failed to update report status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonLabel = (code: string) => {
    const labels: Record<string, string> = {
      SPAM: 'Spam',
      HARASSMENT: 'Harassment',
      HATE: 'Hate Speech',
      SEXUAL: 'Sexual Content',
      PRIVACY: 'Privacy Violation',
      ILLEGAL: 'Illegal Content',
      OTHER: 'Other',
    };
    return labels[code] || code;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Header />
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
              Access Denied
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        {/* Page Header */}
        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Console - Report Queue
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage reported content
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => {
              setStatusFilter('OPEN');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'OPEN'
                ? 'bg-yellow-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Open ({reports.filter((r) => r.status === 'OPEN').length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('RESOLVED');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'RESOLVED'
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => {
              setStatusFilter('REJECTED');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'REJECTED'
                ? 'bg-gray-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            All
          </button>
        </div>

        {/* Reports List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No reports found with the selected filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            report.status,
                          )}`}
                        >
                          {report.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {getReasonLabel(report.reason_code)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {report.target_type}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(report.created_at)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Reporter: {report.reporter?.nickname || 'Unknown'}
                        </p>
                        {report.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            {report.description}
                          </p>
                        )}
                      </div>

                      {report.post && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Post: {report.post.title}
                          </p>
                          <a
                            href={`/boards/free/posts/${report.post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Post →
                          </a>
                        </div>
                      )}

                      {report.comment && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Comment:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {report.comment.body.substring(0, 200)}
                            {report.comment.body.length > 200 ? '...' : ''}
                          </p>
                        </div>
                      )}

                      {report.review && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Review:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {report.review.text_body.substring(0, 200)}
                            {report.review.text_body.length > 200 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {report.status === 'OPEN' && (
                      <div className="ml-6 flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(report.id, 'RESOLVED')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(report.id, 'REJECTED')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
