import * as React from 'react';

import { cn } from '../../lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'default' | 'wide' | 'full';
}

export function Container({ size = 'default', className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        {
          'max-w-4xl': size === 'narrow',
          'max-w-6xl': size === 'default',
          'max-w-7xl': size === 'wide',
          'max-w-full': size === 'full',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
