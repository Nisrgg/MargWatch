'use client';

import { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  side?: 'top' | 'bottom';
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showChevron?: boolean;
}

export default function Dropdown({ 
  trigger, 
  children, 
  align = 'right',
  side = 'bottom',
  variant = 'default',
  size = 'md',
  className,
  showChevron = true
}: DropdownProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    default: 'bg-background border border-border shadow-sm hover:bg-muted',
    ghost: 'hover:bg-muted',
    outline: 'border border-border bg-transparent hover:bg-muted',
  };

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2',
  };

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <div>
        <Menu.Button className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          sizeClasses[size],
          variantClasses[variant]
        )}>
          {trigger}
          {showChevron && (
            <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={cn(
          'absolute z-50 w-56 origin-top rounded-md border bg-popover p-1 text-popover-foreground shadow-md focus:outline-none',
          alignClasses[align],
          sideClasses[side]
        )}>
          <div className="py-1">
            {children}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
}

export function DropdownItem({ 
  children, 
  onClick, 
  href, 
  className = '',
  disabled = false,
  icon,
  variant = 'default'
}: DropdownItemProps) {
  const baseClasses = cn(
    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
    'focus:bg-accent focus:text-accent-foreground',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    {
      'text-destructive focus:text-destructive': variant === 'destructive',
    }
  );

  const content = (
    <>
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <Menu.Item disabled={disabled}>
        {({ active }) => (
          <a
            href={href}
            className={cn(baseClasses, active ? 'bg-accent text-accent-foreground' : '', className)}
          >
            {content}
          </a>
        )}
      </Menu.Item>
    );
  }

  return (
    <Menu.Item disabled={disabled}>
      {({ active }) => (
        <button
          onClick={onClick}
          className={cn(baseClasses, active ? 'bg-accent text-accent-foreground' : '', className)}
        >
          {content}
        </button>
      )}
    </Menu.Item>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return <div className={cn('my-1 h-px bg-border', className)} />;
}
