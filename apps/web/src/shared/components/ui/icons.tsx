import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/* ═══════════════════════════════════════════════
   Shared SVG filter for soft clay drop-shadow
   ═══════════════════════════════════════════════ */
const IconFilter = () => (
  <defs>
    <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1.5" dy="1.5" stdDeviation="1.5" floodColor="#c7d2fe" floodOpacity="0.4" />
    </filter>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#6366F1" />
      <stop offset="100%" stopColor="#4F46E5" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F59E0B" />
      <stop offset="100%" stopColor="#D97706" />
    </linearGradient>
    <linearGradient id="destructiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F43F5E" />
      <stop offset="100%" stopColor="#E11D48" />
    </linearGradient>
    <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#f8fafc" />
    </linearGradient>
    <linearGradient id="grayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#e2e8f0" />
      <stop offset="100%" stopColor="#cbd5e1" />
    </linearGradient>
  </defs>
);

/* ─── Wallet Icon ─── */
export function WalletIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      {/* Body */}
      <rect x="4" y="12" width="34" height="26" rx="6" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      {/* Flap */}
      <path d="M4 18C4 14.6863 6.68629 12 10 12H32C35.3137 12 38 14.6863 38 18V18H4V18Z" fill="#4F46E5" opacity="0.5" />
      {/* Card slot */}
      <rect x="26" y="22" width="16" height="10" rx="5" fill="url(#whiteGrad)" filter="url(#iconShadow)" />
      {/* Coin */}
      <circle cx="34" cy="27" r="3" fill="url(#accentGrad)" />
      {/* Shine */}
      <ellipse cx="14" cy="16" rx="6" ry="2" fill="white" opacity="0.3" />
    </svg>
  );
}

/* ─── Group / People Icon ─── */
export function GroupIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      {/* Person 1 (center) */}
      <circle cx="24" cy="16" r="7" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <ellipse cx="24" cy="37" rx="11" ry="7" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      {/* Person 2 (left) */}
      <circle cx="12" cy="20" r="5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      <ellipse cx="12" cy="37" rx="8" ry="5.5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      {/* Person 3 (right) */}
      <circle cx="36" cy="20" r="5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      <ellipse cx="36" cy="37" rx="8" ry="5.5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      {/* Shine */}
      <circle cx="22" cy="14" r="2" fill="white" opacity="0.35" />
    </svg>
  );
}

/* ─── Receipt Icon ─── */
export function ReceiptIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      {/* Paper */}
      <path d="M10 6C10 4.89543 10.8954 4 12 4H36C37.1046 4 38 4.89543 38 6V42L34 39L30 42L26 39L22 42L18 39L14 42L10 39V6Z" fill="url(#whiteGrad)" filter="url(#iconShadow)" />
      {/* Lines */}
      <rect x="15" y="12" width="18" height="3" rx="1.5" fill="url(#primaryGrad)" opacity="0.7" />
      <rect x="15" y="19" width="14" height="2.5" rx="1.25" fill="url(#grayGrad)" />
      <rect x="15" y="25" width="16" height="2.5" rx="1.25" fill="url(#grayGrad)" />
      <rect x="15" y="31" width="10" height="2.5" rx="1.25" fill="url(#grayGrad)" />
      {/* Checkmark */}
      <circle cx="35" cy="31" r="4" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <path d="M33 31L34.5 32.5L37 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Chart / Analytics Icon ─── */
export function ChartIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      {/* Base plate */}
      <rect x="4" y="38" width="40" height="4" rx="2" fill="url(#grayGrad)" filter="url(#iconShadow)" />
      {/* Bars */}
      <rect x="8" y="24" width="7" height="14" rx="3.5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      <rect x="20" y="14" width="7" height="24" rx="3.5" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <rect x="32" y="8" width="7" height="30" rx="3.5" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      {/* Shine on tallest bar */}
      <rect x="34" y="10" width="3" height="8" rx="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

/* ─── Plus / Add Icon ─── */
export function PlusIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      <circle cx="24" cy="24" r="18" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <rect x="21" y="14" width="6" height="20" rx="3" fill="white" />
      <rect x="14" y="21" width="20" height="6" rx="3" fill="white" />
      {/* Shine */}
      <ellipse cx="18" cy="17" rx="4" ry="3" fill="white" opacity="0.25" />
    </svg>
  );
}

/* ─── Link / Chain Icon ─── */
export function LinkIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      {/* Left link */}
      <rect x="6" y="16" width="20" height="16" rx="8" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <rect x="10" y="20" width="12" height="8" rx="4" fill="url(#whiteGrad)" />
      {/* Right link */}
      <rect x="22" y="16" width="20" height="16" rx="8" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      <rect x="26" y="20" width="12" height="8" rx="4" fill="url(#whiteGrad)" />
      {/* Overlap connector */}
      <rect x="22" y="18" width="6" height="12" rx="3" fill="url(#primaryGrad)" opacity="0.7" />
    </svg>
  );
}

/* ─── Google Icon ─── */
export function GoogleIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Shield / Auth Icon ─── */
export function ShieldIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      <path d="M24 4L6 12V24C6 35 14 42 24 44C34 42 42 35 42 24V12L24 4Z" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <path d="M24 8L10 14V24C10 33 16 38.5 24 40.5C32 38.5 38 33 38 24V14L24 8Z" fill="url(#whiteGrad)" opacity="0.35" />
      {/* Checkmark */}
      <path d="M17 24L22 29L31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Money / Debt Icon ─── */
export function MoneyIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      {/* Coin stack */}
      <ellipse cx="24" cy="36" rx="16" ry="5" fill="url(#grayGrad)" filter="url(#iconShadow)" />
      <ellipse cx="24" cy="30" rx="14" ry="4.5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      <ellipse cx="24" cy="24" rx="14" ry="4.5" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <ellipse cx="24" cy="18" rx="12" ry="4" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      {/* Rupee symbol */}
      <text x="24" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Geist Variable, sans-serif">₹</text>
      {/* Shine */}
      <ellipse cx="19" cy="16" rx="4" ry="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

/* ─── Checkmark / Settled Icon ─── */
export function CheckIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      <circle cx="24" cy="24" r="18" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <path d="M15 24L21 30L33 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shine */}
      <ellipse cx="18" cy="16" rx="5" ry="3" fill="white" opacity="0.25" />
    </svg>
  );
}

/* ─── Bell / Notification Icon ─── */
export function BellIcon({ size = 48, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <IconFilter />
      <path d="M24 4C24 4 16 4 14 14C12 24 8 28 8 28H40C40 28 36 24 34 14C32 4 24 4 24 4Z" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      <rect x="8" y="28" width="32" height="5" rx="2.5" fill="url(#accentGrad)" filter="url(#iconShadow)" />
      <ellipse cx="24" cy="38" rx="4" ry="3" fill="url(#primaryGrad)" filter="url(#iconShadow)" />
      {/* Shine */}
      <ellipse cx="20" cy="14" rx="3" ry="4" fill="white" opacity="0.25" />
    </svg>
  );
}

/* ─── Arrow Right ─── */
export function ArrowRightIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MicrosoftIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF"/>
      <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900"/>
      <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
      <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00"/>
    </svg>
  );
}

export function YahooIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle cx="12" cy="12" r="12" fill="#6001D2"/>
      <path d="M12.98 12.39L17.7 5h-2.58l-3.21 5.37L8.69 5H6.11l4.72 7.39v5.61h2.15v-5.61z" fill="#fff"/>
      <path d="M17.7 15.8h-2.15v2.2h2.15v-2.2z" fill="#fff"/>
    </svg>
  );
}

export function AppleIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="currentColor"/>
    </svg>
  );
}

export function ZohoIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M 5 14 L 5 19 A 1 1 0 0 0 6 20 L 18 20 A 1 1 0 0 0 19 19 L 19 9 L 12 3 L 5 9 L 12 15 L 19 9" fill="none" stroke="#1663b6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 8.5 11.5 L 8.5 9 A 1 1 0 0 1 9.5 8 L 14.5 8 A 1 1 0 0 1 15.5 9 L 15.5 11.5" fill="none" stroke="#f6a925" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
