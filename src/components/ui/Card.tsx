import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-card-bg border border-border-color rounded-2xl p-5 shadow-xl transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
