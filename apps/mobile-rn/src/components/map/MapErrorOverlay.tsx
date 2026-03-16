import React from 'react';
import { ErrorCard } from '../cards/ErrorCard';

interface MapErrorOverlayProps {
  message?: string;
}

export function MapErrorOverlay({ message }: MapErrorOverlayProps) {
  return <ErrorCard message={message ?? 'Failed to load map data.'} />;
}

