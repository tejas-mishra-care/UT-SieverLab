import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#86efac', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#0284c7" />
      <path
        d="M10,50 C10,30 30,20 50,20 C70,20 90,30 90,50"
        fill="none"
        stroke="url(#grad2)"
        strokeWidth="4"
      />
      <path
        d="M10,50 C10,70 30,80 50,80 C70,80 90,70 90,50"
        fill="none"
        stroke="url(#grad2)"
        strokeWidth="4"
      />
      <path d="M10 50 H 90" stroke="url(#grad2)" strokeWidth="4" />

      {/* Sieve mesh */}
      <path
        d="M20,78 C30,70 70,70 80,78"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
       <path
        d="M23,75 C33,68 67,68 77,75"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M26,72 C36,66 64,66 74,72"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
       <path
        d="M29,69 C39,64 61,64 71,69"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
       <path
        d="M32,66 C42,62 58,62 68,66"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
       <path
        d="M35,63 C45,60 55,60 65,63"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
       <path
        d="M38,60 C48,58 52,58 62,60"
        stroke="#0c4a6e"
        strokeWidth="1"
        fill="none"
      />
      
       <path d="M50 79.5 L 50 58" stroke="#0c4a6e" strokeWidth="1" />
       <path d="M40 78 L 40 59" stroke="#0c4a6e" strokeWidth="1" />
       <path d="M60 78 L 60 59" stroke="#0c4a6e" strokeWidth="1" />
       <path d="M30 74 L 30 63" stroke="#0c4a6e" strokeWidth="1" />
       <path d="M70 74 L 70 63" stroke="#0c4a6e" strokeWidth="1" />
      
      {/* Bars */}
      <rect x="30" y="45" width="10" height="20" fill="url(#grad1)" rx="1" />
      <rect x="45" y="35" width="10" height="30" fill="url(#grad1)" rx="1" />
      <rect x="60" y="25" width="10" height="40" fill="url(#grad1)" rx="1" />
      
      {/* Sparkles */}
      <path d="M40 25 l 2 2 l -2 2 l -2 -2 z" fill="#86efac" />
      <path d="M35 30 l 1.5 1.5 l -1.5 1.5 l -1.5 -1.5 z" fill="#86efac" />
      <path d="M60 22 l 1.5 1.5 l -1.5 1.5 l -1.5 -1.5 z" fill="#86efac" />
      <path d="M68 28 l 2 2 l -2 2 l -2 -2 z" fill="#86efac" />

    </svg>
  );
}
