'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import apiClient from '@/lib/api';
import { Complaint, ComplaintFilters, Pagination } from '@/types';
import { useNotificationService } from '@/hooks/useNotificationService';
import { updateMockComplaintStatus } from '@/data/mockComplaints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  Search,
  Filter as FilterIcon,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw as RefreshIcon,
  Download as DownloadIcon,
  Calendar,
  MapPin,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, formatNumber, truncateText, parseImageUrls } from '@/lib/utils';
import { useConfig } from '@/hooks/useConfig';
import toast from 'react-hot-toast';

export default function ComplaintsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotificationService();
  const { formatCategory, getCategoryColor, formatComplaintStatus, getStatusColor, categories } = useConfig();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<ComplaintFilters>({
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchComplaints();
    }
  }, [isAuthenticated, authLoading, router, filters]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAllComplaints(filters);
      if (response.success && response.data) {
        setComplaints(response.data.complaints);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (complaintId: string, status: 'Pending' | 'In Progress' | 'Resolved') => {
    const updated = updateMockComplaintStatus(complaintId, status);
    if (!updated) {
      notifyError(
        'Update Failed',
        `Failed to update complaint #${complaintId} status in demo mode.`,
      );
      return;
    }

    notifySuccess(
      'Complaint Status Updated',
      `Complaint #${complaintId} status has been updated to ${status}.`,
      {
        label: 'View Details',
        onClick: () => {
          setSelectedComplaint(
            complaints.find((c) => c.id === complaintId) || null,
          );
          setIsModalOpen(true);
        },
      },
    );

    // Refresh local table data from mock dataset
    fetchComplaints();

    if (selectedComplaint?.id === complaintId) {
      setSelectedComplaint({
        ...selectedComplaint,
        status,
      });
    }
  };

  const handleFilterChange = (key: keyof ComplaintFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
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
            <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
            <p className="text-muted-foreground">
              Manage and track all road issue complaints
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchComplaints}>
              <RefreshIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilterIcon className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter complaints by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search complaints..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="REGISTERED">Registered</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Per Page</label>
                <Select
                  value={filters.limit?.toString() || '10'}
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints</CardTitle>
            <CardDescription>
              {formatNumber(pagination?.total || 0)} total complaints found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            {parseImageUrls(complaint.imageUrl).length > 0 ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={parseImageUrls(complaint.imageUrl)[0]}
                                alt="Complaint"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {truncateText(complaint.title, 50)}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {truncateText(complaint.description, 60)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {complaint.user.firstName} {complaint.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{complaint.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getCategoryColor(complaint.category))}>
                          {formatCategory(complaint.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getStatusColor(complaint.status))}>
                          {formatComplaintStatus(complaint.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{formatDate(complaint.createdAt)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatRelativeTime(complaint.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {complaint.status === 'Pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(complaint.id, 'In Progress')
                              }
                              className="text-success-600 hover:text-success-700"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          {complaint.status === 'In Progress' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(complaint.id, 'Resolved')
                              }
                              className="text-success-600 hover:text-success-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint Details Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Complaint Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected complaint
              </DialogDescription>
            </DialogHeader>
            {selectedComplaint && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <p className="text-sm">{selectedComplaint.title}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Badge variant="outline" className={cn(getCategoryColor(selectedComplaint.category))}>
                      {formatCategory(selectedComplaint.category)}
                    </Badge>
                  </div>
                  {(selectedComplaint.mlCategory != null ||
                    (selectedComplaint.mlConfidence != null && selectedComplaint.mlConfidence > 0) ||
                    selectedComplaint.mlModelVersion != null) && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">ML prediction</label>
                      <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                        {selectedComplaint.mlCategory != null && (
                          <span>Category: {formatCategory(selectedComplaint.mlCategory)}</span>
                        )}
                        {selectedComplaint.mlConfidence != null && selectedComplaint.mlConfidence > 0 && (
                          <span>Confidence: {(selectedComplaint.mlConfidence * 100).toFixed(0)}%</span>
                        )}
                        {selectedComplaint.mlModelVersion != null && (
                          <span>Model: {selectedComplaint.mlModelVersion}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Badge variant="outline" className={cn(getStatusColor(selectedComplaint.status))}>
                      {formatComplaintStatus(selectedComplaint.status)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Submitted</label>
                    <p className="text-sm">{formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm">{selectedComplaint.description}</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {selectedComplaint.address || `${selectedComplaint.latitude}, ${selectedComplaint.longitude}`}
                    </p>
                  </div>
                </div>

                {/* Images */}
                {parseImageUrls(selectedComplaint.imageUrl).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Images</label>
                    <div className="grid grid-cols-2 gap-4">
                      {parseImageUrls(selectedComplaint.imageUrl).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Complaint image ${index + 1}`}
                          className="rounded-lg object-cover w-full h-32"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reported By</label>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {selectedComplaint.user.firstName} {selectedComplaint.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedComplaint.user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions (demo mode status transitions) */}
                {selectedComplaint.status === 'Pending' && (
                  <DialogFooter>
                    <Button
                      onClick={() =>
                        handleStatusUpdate(selectedComplaint.id, 'In Progress')
                      }
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark In Progress
                    </Button>
                  </DialogFooter>
                )}
                {selectedComplaint.status === 'In Progress' && (
                  <DialogFooter>
                    <Button
                      onClick={() =>
                        handleStatusUpdate(selectedComplaint.id, 'Resolved')
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
