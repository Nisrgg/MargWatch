import React from 'react';
import { MWScroll } from '../lists/MWScroll';

interface ScreenBodyProps {
  children: React.ReactNode;
}

export function ScreenBody({ children }: ScreenBodyProps) {
  return <MWScroll>{children}</MWScroll>;
}

