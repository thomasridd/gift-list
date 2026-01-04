import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  const hoverClass = hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';

  return (
    <div className={`bg-surface rounded-lg shadow p-6 border border-border ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
