'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import apiClient from '@/lib/api';
import { WorkOrder, WorkOrderApprovalForm } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, getStatusColor, formatComplaintStatus } from '@/lib/utils';
import { useNotificationService } from '@/hooks/useNotificationService';

export default function ApprovalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotificationService();
  
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchPendingApprovals();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPendingApprovals();
      if (response.success && response.data) {
        setWorkOrders(response.data.workOrders);
      }
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
      notifyError('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedWorkOrder || !approvalAction) return;

    try {
      setIsApproving(true);
      
      const approvalData: WorkOrderApprovalForm = {
        workOrderId: selectedWorkOrder.id,
        approvalStatus: approvalAction,
        rejectionReason: approvalAction === 'REJECTED' ? rejectionReason : undefined
      };

      const response = await apiClient.approveWorkOrder(approvalData);
      
      if (response.success) {
        notifySuccess(`Work order ${approvalAction.toLowerCase()}ed successfully`);
        setIsDialogOpen(false);
        setSelectedWorkOrder(null);
        setApprovalAction(null);
        setRejectionReason('');
        fetchPendingApprovals(); // Refresh the list
      } else {
        notifyError(response.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Failed to approve work order:', error);
      notifyError('Failed to process approval');
    } finally {
      setIsApproving(false);
    }
  };

  const openApprovalDialog = (workOrder: WorkOrder, action: 'APPROVED' | 'REJECTED') => {
    setSelectedWorkOrder(workOrder);
    setApprovalAction(action);
    setRejectionReason('');
    setIsDialogOpen(true);
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Work Order Approvals</h1>
            <p className="text-lg text-gray-600">
              Review and approve completed work orders
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPendingApprovals}
              className="btn-outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold gradient-text">{workOrders.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card-success">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Ready for Review</p>
                  <p className="text-3xl font-bold gradient-text">{workOrders.filter(wo => wo.status === 'COMPLETED').length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card-warning">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Awaiting Action</p>
                  <p className="text-3xl font-bold gradient-text">{workOrders.filter(wo => wo.adminApprovalStatus === 'PENDING').length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Orders List */}
        {workOrders.length === 0 ? (
          <Card className="card">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Pending Approvals</h3>
              <p className="text-gray-500">All work orders have been reviewed. Check back later for new submissions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {workOrders.map((workOrder) => (
              <Card key={workOrder.id} className="card hover:shadow-glow">
                <CardHeader className="card-header">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2 mb-2">
                        <span>{workOrder.complaint.title}</span>
                        <Badge variant="outline" className={cn(getStatusColor(workOrder.status), "font-semibold")}>
                          {formatComplaintStatus(workOrder.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Work completed by {workOrder.worker.firstName} {workOrder.worker.lastName}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openApprovalDialog(workOrder, 'APPROVED')}
                        className="btn-success"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openApprovalDialog(workOrder, 'REJECTED')}
                        className="btn-danger"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="card-body">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Complainant:</span>
                        <span className="text-sm text-gray-600">
                          {workOrder.complaint.user.firstName} {workOrder.complaint.user.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Worker:</span>
                        <span className="text-sm text-gray-600">
                          {workOrder.worker.firstName} {workOrder.worker.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Location:</span>
                        <span className="text-sm text-gray-600">
                          {workOrder.complaint.address || 'Location not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Assigned:</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(workOrder.assignedAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Completed:</span>
                        <span className="text-sm text-gray-600">
                          {workOrder.completedAt ? formatDate(workOrder.completedAt) : 'Not completed'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Priority:</span>
                        <Badge variant="outline" className="text-xs">
                          {workOrder.priority === 1 ? 'Low' : workOrder.priority === 2 ? 'Medium' : 'High'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {workOrder.workDescription && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Work Description:</p>
                      <p className="text-sm text-gray-600">{workOrder.workDescription}</p>
                    </div>
                  )}

                  {workOrder.updates && workOrder.updates.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recent Updates:</p>
                      <div className="space-y-2">
                        {workOrder.updates.slice(0, 3).map((update) => (
                          <div key={update.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-xs font-medium text-gray-600">{update.description}</p>
                              <p className="text-xs text-gray-500">{formatRelativeTime(update.createdAt)}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {update.progress}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Approval Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {approvalAction === 'APPROVED' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                <span>
                  {approvalAction === 'APPROVED' ? 'Approve' : 'Reject'} Work Order
                </span>
              </DialogTitle>
              <DialogDescription>
                {approvalAction === 'APPROVED' 
                  ? 'Are you sure you want to approve this work order? This will mark the complaint as completed.'
                  : 'Are you sure you want to reject this work order? Please provide a reason for rejection.'
                }
              </DialogDescription>
            </DialogHeader>
            
            {selectedWorkOrder && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Work Order Details:</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedWorkOrder.complaint.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Worker: {selectedWorkOrder.worker.firstName} {selectedWorkOrder.worker.lastName}
                  </p>
                </div>

                {approvalAction === 'REJECTED' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason</Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="Please provide a reason for rejecting this work order..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isApproving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproval}
                disabled={isApproving || (approvalAction === 'REJECTED' && !rejectionReason.trim())}
                className={approvalAction === 'APPROVED' ? 'btn-success' : 'btn-danger'}
              >
                {isApproving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    {approvalAction === 'APPROVED' ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    {approvalAction === 'APPROVED' ? 'Approve' : 'Reject'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
