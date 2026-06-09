import React from 'react'

export function NextIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 180 180" fill="currentColor">
      <mask id="mask0_180_180" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
        <circle cx="90" cy="90" r="90" fill="black" />
      </mask>
      <g mask="url(#mask0_180_180)">
        <circle cx="90" cy="90" r="90" fill="black" />
        <path d="M149.508 157.52L86.137 76.5H74.5v51.18h9.82V89.44l54.34 69.46c3.97-3.9 7.6-8.2 10.848-12.86z" fill="url(#paint0_linear_180_180)" />
        <path d="M115.25 50.25h9.82v79.62h-9.82V50.25z" fill="url(#paint1_linear_180_180)" />
      </g>
      <defs>
        <linearGradient id="paint0_linear_180_180" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="paint1_linear_180_180" x1="121" y1="54" x2="120.7" y2="106.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function TailwindIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
    </svg>
  )
}

export function TsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 0H2a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM8.36 18.23c-1.36 0-2.5-.78-3.18-1.93l1.83-1.07c.32.53.76.88 1.35.88.5 0 .8-.23.8-.57 0-.39-.32-.53-1.07-.86-1.55-.67-2.6-1.44-2.6-3.1 0-1.74 1.4-2.95 3.32-2.95 1.4 0 2.37.58 2.94 1.57l-1.68 1.07c-.32-.51-.67-.77-1.26-.77-.42 0-.67.2-.67.48 0 .33.27.46.96.76 1.76.76 2.73 1.48 2.73 3.19 0 1.95-1.5 3.19-3.4 3.19zm10.7-.28h-2.5v-7.8h-2.6v-2.05h7.7v2.05h-2.6v7.8z" />
    </svg>
  )
}

export function DbIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export function AlertIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

export function TerminalIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}
