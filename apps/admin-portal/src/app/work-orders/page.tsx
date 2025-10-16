'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import apiClient from '@/lib/api';
import { WorkOrder, WorkOrderFilters, Pagination, Complaint, User } from '@/types';
import { useNotificationService } from '@/hooks/useNotificationService';
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
  PlusIcon,
  EyeIcon,
  UserPlusIcon,
  RefreshCw,
  Download,
  Filter,
} from '@heroicons/react/24/outline';
import {
  Search,
  Filter as FilterIcon,
  Plus,
  Eye,
  UserPlus,
  RefreshCw as RefreshIcon,
  Download as DownloadIcon,
  Calendar,
  User as UserIcon,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Image as ImageIcon,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, formatNumber, getStatusColor, getPriorityColor, formatWorkOrderStatus, formatPriority, truncateText } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkOrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { notifySuccess, notifyError, notifyWorkOrderAssigned } = useNotificationService();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<WorkOrderFilters>({
    page: 1,
    limit: 10,
  });
  const [availableComplaints, setAvailableComplaints] = useState<Complaint[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [createForm, setCreateForm] = useState({
    complaintId: '',
    workerId: '',
    priority: 1,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchWorkOrders();
      fetchAvailableComplaints();
      fetchAvailableWorkers();
    }
  }, [isAuthenticated, authLoading, router, filters]);

  const fetchWorkOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAllWorkOrders(filters);
      if (response.success && response.data) {
        setWorkOrders(response.data.workOrders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
      toast.error('Failed to load work orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableComplaints = async () => {
    try {
      const response = await apiClient.getAllComplaints({ status: 'APPROVED', limit: 100 });
      if (response.success && response.data) {
        setAvailableComplaints(response.data.complaints);
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      const response = await apiClient.getAllUsers({ role: 'WORKER', limit: 100 });
      if (response.success && response.data) {
        setAvailableWorkers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!createForm.complaintId || !createForm.workerId) {
      notifyError('Validation Error', 'Please select both complaint and worker');
      return;
    }

    try {
      const response = await apiClient.createWorkOrder(createForm);
      if (response.success) {
        const worker = availableWorkers.find(w => w.id === createForm.workerId);
        const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown Worker';
        
        notifyWorkOrderAssigned(response.data.workOrder.id, workerName);
        setIsCreateModalOpen(false);
        setCreateForm({ complaintId: '', workerId: '', priority: 1 });
        fetchWorkOrders();
      }
    } catch (error) {
      console.error('Failed to create work order:', error);
      notifyError(
        'Creation Failed',
        'Failed to create work order. Please try again.'
      );
    }
  };

  const handleFilterChange = (key: keyof WorkOrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
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
            <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
            <p className="text-muted-foreground">
              Manage work orders and track progress
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchWorkOrders}>
              <RefreshIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </div>
        </div>

        {/* Work Order Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(workOrders.length)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time work orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(workOrders.filter(wo => wo.status === 'PROCESSING').length)}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(workOrders.filter(wo => wo.status === 'COMPLETED').length)}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2 days</div>
              <p className="text-xs text-muted-foreground">
                Average completion time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilterIcon className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter work orders by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search work orders..."
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
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
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

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
            <CardDescription>
              {formatNumber(pagination?.total || 0)} total work orders found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((workOrder) => (
                    <TableRow key={workOrder.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            {workOrder.complaint.imageUrls && workOrder.complaint.imageUrls.length > 0 ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={workOrder.complaint.imageUrls[0]}
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
                              {truncateText(workOrder.complaint.title, 50)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {workOrder.complaint.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {workOrder.worker.firstName} {workOrder.worker.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{workOrder.worker.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getStatusColor(workOrder.status))}>
                          {formatWorkOrderStatus(workOrder.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getPriorityColor(workOrder.priority))}>
                          {formatPriority(workOrder.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{formatDate(workOrder.assignedAt)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatRelativeTime(workOrder.assignedAt)}
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
                              setSelectedWorkOrder(workOrder);
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

        {/* Work Order Details Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Work Order Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected work order
              </DialogDescription>
            </DialogHeader>
            {selectedWorkOrder && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Complaint</label>
                    <p className="text-sm">{selectedWorkOrder.complaint.title}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Worker</label>
                    <p className="text-sm">
                      {selectedWorkOrder.worker.firstName} {selectedWorkOrder.worker.lastName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Badge variant="outline" className={cn(getStatusColor(selectedWorkOrder.status))}>
                      {formatWorkOrderStatus(selectedWorkOrder.status)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Badge variant="outline" className={cn(getPriorityColor(selectedWorkOrder.priority))}>
                      {formatPriority(selectedWorkOrder.priority)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assigned At</label>
                    <p className="text-sm">{formatDate(selectedWorkOrder.assignedAt)}</p>
                  </div>
                  {selectedWorkOrder.startedAt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Started At</label>
                      <p className="text-sm">{formatDate(selectedWorkOrder.startedAt)}</p>
                    </div>
                  )}
                  {selectedWorkOrder.completedAt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Completed At</label>
                      <p className="text-sm">{formatDate(selectedWorkOrder.completedAt)}</p>
                    </div>
                  )}
                </div>

                {/* Complaint Details */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complaint Description</label>
                  <p className="text-sm">{selectedWorkOrder.complaint.description}</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {selectedWorkOrder.complaint.address || `${selectedWorkOrder.complaint.latitude}, ${selectedWorkOrder.complaint.longitude}`}
                    </p>
                  </div>
                </div>

                {/* Work Description */}
                {selectedWorkOrder.workDescription && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Description</label>
                    <p className="text-sm">{selectedWorkOrder.workDescription}</p>
                  </div>
                )}

                {/* Cost */}
                {selectedWorkOrder.cost && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cost</label>
                    <p className="text-sm font-medium">${selectedWorkOrder.cost}</p>
                  </div>
                )}

                {/* Progress Updates */}
                {selectedWorkOrder.updates && selectedWorkOrder.updates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Progress Updates</label>
                    <div className="space-y-3">
                      {selectedWorkOrder.updates.map((update) => (
                        <div key={update.id} className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className={cn(getStatusColor(update.status))}>
                              {formatWorkOrderStatus(update.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(update.createdAt)}
                            </span>
                          </div>
                          {update.description && (
                            <p className="text-sm">{update.description}</p>
                          )}
                          {update.progress && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{update.progress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${update.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Work Order Dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>
                Assign a complaint to a worker for resolution
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Complaint</label>
                <Select
                  value={createForm.complaintId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, complaintId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a complaint" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComplaints.map((complaint) => (
                      <SelectItem key={complaint.id} value={complaint.id}>
                        {complaint.title} - {complaint.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Worker</label>
                <Select
                  value={createForm.workerId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, workerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.firstName} {worker.lastName} - {worker.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={createForm.priority.toString()}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateForm({ complaintId: '', workerId: '', priority: 1 });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateWorkOrder}>
                <Plus className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
