'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import apiClient from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RotateCcw,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { cn, formatDate, formatNumber, getStatusColor, formatComplaintStatus } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AnalyticsData {
  complaintsOverTime: Array<{
    date: string;
    count: number;
  }>;
  complaintsByCategory: Array<{
    category: string;
    count: number;
  }>;
  complaintsByStatus: Array<{
    status: string;
    count: number;
  }>;
  workerPerformance: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    avgCompletionTime: number;
    totalCost: number;
  }>;
  heatMapData: Array<{
    lat: number;
    lng: number;
    category: string;
    status: string;
  }>;
  avgResolutionTime: number;
  period: number;
  totalComplaints: number;
  completedComplaints: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, authLoading, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getComplaintAnalytics(parseInt(timeRange));
      if (response.success && response.data) {
        // Transform the data for charts
        const data = response.data.analytics;
        const safeHeatMapData = (data.heatMapData || []).map((point: any) => ({
          ...point,
          lat: point?.lat != null ? Number(point.lat) : NaN,
          lng: point?.lng != null ? Number(point.lng) : NaN,
        }));
        setAnalyticsData({
          complaintsOverTime: data.complaintsOverTime || [],
          complaintsByCategory: data.complaintsByCategory || [],
          complaintsByStatus: data.complaintsByStatus || [],
          workerPerformance: data.workerPerformance || [],
          heatMapData: safeHeatMapData,
          avgResolutionTime: data.avgResolutionTime || 0,
          period: data.period || 30,
          totalComplaints: data.totalComplaints || 0,
          completedComplaints: data.completedComplaints || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and reports for your road issue management system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(analyticsData?.complaintsOverTime.reduce((sum, item) => sum + item.count, 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(analyticsData?.complaintsByStatus.find(s => s.status === 'COMPLETED')?.count || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +8% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.avgResolutionTime ? `${analyticsData.avgResolutionTime} days` : '0 days'}
              </div>
              <p className="text-xs text-muted-foreground">
                -15% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(analyticsData?.workerPerformance.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +2 from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Complaints Over Time */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Complaints Over Time</CardTitle>
              <CardDescription>
                Track complaint volume and resolution trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.complaintsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Complaints"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Complaints by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
              <CardDescription>
                Distribution of complaint types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData?.complaintsByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(analyticsData?.complaintsByCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Complaints by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Status</CardTitle>
              <CardDescription>
                Current status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.complaintsByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Worker Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Performance</CardTitle>
            <CardDescription>
              Individual worker statistics and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.workerPerformance.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {worker.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{worker.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg. resolution: {worker.avgCompletionTime} days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success-600">{worker.completedOrders}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning-600">{worker.totalOrders - worker.completedOrders}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Heat Map Data */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution Map</CardTitle>
            <CardDescription>
              Geographic distribution of reported issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {analyticsData?.heatMapData.slice(0, 6).map((location, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {typeof location.lat === 'number' &&
                        typeof location.lng === 'number' &&
                        !Number.isNaN(location.lat) &&
                        !Number.isNaN(location.lng)
                          ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                          : 'Unknown location'}
                      </span>
                    </div>
                    <Badge
                      variant={
                        location.status === 'COMPLETED' ? 'default' :
                        location.status === 'PROCESSING' ? 'warning' : 'destructive'
                      }
                    >
                      {location.status}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{location.category}</p>
                  <p className="text-xs text-muted-foreground">reported issues</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}