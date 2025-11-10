'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Users,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn, formatDate, formatNumber, formatComplaintStatus } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useDashboardData } from '@/hooks/useDashboardQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardWebSocket } from '@/hooks/useWebSocket';
import authUtils from '@/utils/auth';

// Status color mapping for badges
const statusColors = {
  REGISTERED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
  PENDING_REVIEW: 'bg-orange-100 text-orange-800 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

// Chart colors for status distribution
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Loading skeleton components
function StatsCardSkeleton() {
  return (
    <Card className="transform transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-80 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// Error component
function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Error loading data</p>
            <p className="text-xs text-red-600 mt-1">{message}</p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const {
    stats,
    recentComplaints,
    analytics,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useDashboardData();

  // WebSocket connection for real-time updates - only connect when authenticated
  const token = isAuthenticated && user ? authUtils.getToken() : undefined;
  
  // Debug logging for WebSocket connection
  console.log('📊 Dashboard WebSocket state:', {
    isAuthenticated,
    authLoading,
    hasUser: !!user,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
    autoConnect: !authLoading
  });
  
  const { isConnected: isWebSocketConnected } = useDashboardWebSocket(
    queryClient, 
    token
  );

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Dashboard data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-6 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <TableSkeleton />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <ChartSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Prepare chart data for complaint status distribution
  const chartData = analytics?.complaintsByStatus?.map((item: { status: string; count: number }, index: number) => ({
    name: item.status,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // Statistics cards data
  const statCards = [
    {
      title: 'Total Complaints',
      value: formatNumber(stats?.complaints.total || 0),
      description: 'All time complaints',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Approval',
      value: formatNumber(stats?.complaints.pending || 0),
      description: 'Awaiting review',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Work In Progress',
      value: formatNumber(stats?.complaints.processing || 0),
      description: 'Currently being worked on',
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Completed This Month',
      value: formatNumber(stats?.complaints.completed || 0),
      description: 'Successfully resolved',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
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
              Welcome back! Here&apos;s what&apos;s happening with your road issue reporting system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* WebSocket Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50">
              {isWebSocketConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Offline</span>
                </>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefetching}
              className="btn-outline"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <Card 
              key={card.title}
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </div>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Complaints Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Recent Complaints</span>
              </CardTitle>
              <CardDescription>
                Latest 5 complaints submitted to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isError ? (
                <ErrorCard 
                  message="Failed to load recent complaints" 
                  onRetry={refetch}
                />
              ) : recentComplaints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-mono text-sm">
                          {complaint.id.slice(-8)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {complaint.title}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "font-semibold",
                              statusColors[complaint.status as keyof typeof statusColors] || 
                              "bg-gray-100 text-gray-800 border-gray-200"
                            )}
                          >
                            {formatComplaintStatus(complaint.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {complaint.user.firstName} {complaint.user.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(complaint.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No recent complaints</p>
                  <p className="text-xs text-gray-400 mt-1">Complaints will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complaint Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Complaint Status</span>
              </CardTitle>
              <CardDescription>
                Distribution of complaints by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isError ? (
                <ErrorCard 
                  message="Failed to load analytics data" 
                  onRetry={refetch}
                />
              ) : chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry: { color: string }, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Complaints']}
                        labelFormatter={(label: string) => `Status: ${label}`}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-sm font-medium">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No data available</p>
                  <p className="text-xs text-gray-400 mt-1">Chart will appear when data is available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Users Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Users Overview</span>
              </CardTitle>
              <CardDescription>
                Current user statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Total Users</span>
                  </div>
                  <span className="text-2xl font-bold gradient-text">
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
                  <span className="text-2xl font-bold gradient-text">
                    {formatNumber(stats?.users.workers || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                <span>Work Orders</span>
              </CardTitle>
              <CardDescription>
                Current work order statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Active Orders</span>
                  </div>
                  <span className="text-2xl font-bold gradient-text">
                    {formatNumber(stats?.workOrders.active || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-emerald-600" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start btn-outline hover:shadow-glow-green"
                  onClick={() => router.push('/complaints')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Complaints
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start btn-outline hover:shadow-glow-purple"
                  onClick={() => router.push('/work-orders')}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Manage Work Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start btn-outline hover:shadow-glow-green"
                  onClick={() => router.push('/users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}