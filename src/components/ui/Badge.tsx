import React from 'react'

interface BadgeProps {
  status: TestCaseStatus
  className?: string
}

export function Badge({ status, className = '' }: BadgeProps) {
  const styles = {
    PASS: 'bg-accent-green/10 text-accent-green border border-accent-green/20',
    FAIL: 'bg-accent-red/10 text-accent-red border border-accent-red/20',
    UNTESTED: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    BLOCK: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider ${styles[status]} ${className}`}>
      {status}
    </span>
  )
}
