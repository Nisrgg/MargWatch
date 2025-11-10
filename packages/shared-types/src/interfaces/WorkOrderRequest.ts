/**
 * Work order request interface
 * Used for creating new work orders
 */
export interface WorkOrderRequest {
  complaintId: string;
  workerId: string;
  priority?: number;
}
