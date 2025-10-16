'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import apiClient from '@/lib/api';
import { DashboardStats, Complaint } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardDocumentListIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import {
  FileText,
  Users,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, formatNumber, getStatusColor, formatComplaintStatus } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Complaints',
      value: formatNumber(stats?.complaints.total || 0),
      description: 'All time complaints',
      icon: FileText,
      trend: stats?.complaints.total ? {
        value: 12,
        label: 'from last month'
      } : undefined,
    },
    {
      title: 'Pending Complaints',
      value: formatNumber(stats?.complaints.pending || 0),
      description: 'Awaiting review',
      icon: Clock,
      trend: stats?.complaints.pending ? {
        value: -5,
        label: 'from last week'
      } : undefined,
    },
    {
      title: 'Active Work Orders',
      value: formatNumber(stats?.workOrders.active || 0),
      description: 'In progress',
      icon: Wrench,
      trend: stats?.workOrders.active ? {
        value: 8,
        label: 'from last week'
      } : undefined,
    },
    {
      title: 'Completed Issues',
      value: formatNumber(stats?.complaints.completed || 0),
      description: 'Successfully resolved',
      icon: CheckCircle,
      trend: stats?.complaints.completed ? {
        value: 15,
        label: 'from last month'
      } : undefined,
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">
              Welcome back! Here's what's happening with your road issue reporting system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDashboardStats}
              className="btn-outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <div
              key={card.title}
              className="transform transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <StatsCard
                title={card.title}
                value={card.value}
                description={card.description}
                icon={card.icon}
                trend={card.trend}
                className="stats-card hover:shadow-glow"
              />
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Users Overview */}
          <Card className="col-span-4 card hover:shadow-glow-green">
            <CardHeader className="card-header">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Users Overview</span>
              </CardTitle>
              <CardDescription>
                Current user statistics and worker distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="card-body">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Total Users</span>
                  </div>
                  <span className="text-3xl font-bold gradient-text">
                    {formatNumber(stats?.users.total || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Active Workers</span>
                  </div>
                  <span className="text-3xl font-bold gradient-text">
                    {formatNumber(stats?.users.workers || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Administrators</span>
                  </div>
                  <span className="text-3xl font-bold gradient-text">
                    {formatNumber(stats?.users.total || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-3 card hover:shadow-glow-purple">
            <CardHeader className="card-header">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest complaints and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="card-body">
              <div className="space-y-4">
                {stats?.recentComplaints && stats.recentComplaints.length > 0 ? (
                  stats.recentComplaints.slice(0, 5).map((complaint, index) => (
                    <div 
                      key={complaint.id} 
                      className="flex items-center justify-between space-x-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-800">
                          {complaint.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          by {complaint.user.firstName} {complaint.user.lastName}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={cn(getStatusColor(complaint.status), "font-semibold")}>
                          {formatComplaintStatus(complaint.status)}
                        </Badge>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatRelativeTime(complaint.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No recent complaints</p>
                    <p className="text-xs text-gray-400 mt-1">Activity will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card hover:shadow-glow">
          <CardHeader className="card-header">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common administrative tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="card-body">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-3 btn-outline hover:shadow-glow-green transform transition-all duration-300 hover:scale-105"
                onClick={() => router.push('/complaints')}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">View Complaints</p>
                  <p className="text-xs text-gray-500">Manage all complaints</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-3 btn-outline hover:shadow-glow-purple transform transition-all duration-300 hover:scale-105"
                onClick={() => router.push('/work-orders')}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Work Orders</p>
                  <p className="text-xs text-gray-500">Manage work orders</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-3 btn-outline hover:shadow-glow-green transform transition-all duration-300 hover:scale-105"
                onClick={() => router.push('/users')}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Manage Users</p>
                  <p className="text-xs text-gray-500">User management</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-3 btn-outline hover:shadow-glow-purple transform transition-all duration-300 hover:scale-105"
                onClick={() => router.push('/analytics')}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Analytics</p>
                  <p className="text-xs text-gray-500">View reports</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
