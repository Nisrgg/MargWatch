import React from 'react';
import type { WorkOrder } from '@margwatch/shared-types';
import { SectionCard } from './SectionCard';
import { WorkOrderMetaRow } from './WorkOrderMetaRow';

interface WorkOrderMetaSectionProps {
  workOrder: WorkOrder;
}

export function WorkOrderMetaSection({ workOrder }: WorkOrderMetaSectionProps) {
  return (
    <SectionCard>
      {workOrder.location ? (
        <WorkOrderMetaRow label="Location" value={workOrder.location} />
      ) : null}
      {workOrder.complaintId ? (
        <WorkOrderMetaRow label="Complaint ID" value={workOrder.complaintId} />
      ) : null}
      {workOrder.createdAt ? (
        <WorkOrderMetaRow
          label="Created"
          value={new Date(workOrder.createdAt).toLocaleString()}
        />
      ) : null}
      {workOrder.updatedAt ? (
        <WorkOrderMetaRow
          label="Updated"
          value={new Date(workOrder.updatedAt).toLocaleString()}
        />
      ) : null}
    </SectionCard>
  );
}

