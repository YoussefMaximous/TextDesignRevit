import type { ReactNode } from 'react'

/** Revit-inspired ribbon icons — simple SVG, muted palette, not decorative. */
const C = {
  wall: '#4a6fa5',
  door: '#8b6914',
  window: '#5a8fc4',
  column: '#6b6b6b',
  floor: '#9a8b7a',
  grid: '#3d7ab8',
  level: '#5c8f3c',
  ref: '#3d8b3d',
  stair: '#7a6b55',
  room: '#4a90c4',
  section: '#5eb8ff',
  modify: '#2c2c2c',
  muted: '#6a6a6a',
  accent: '#0078d4',
}

type IconProps = { size?: number; className?: string }

function Svg({
  size = 32,
  className,
  children,
  viewBox = '0 0 32 32',
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

export function IconModify({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <path
        d="M6 5 L22 18 L14 18 L14 27 L10 27 L10 18 Z"
        fill={C.modify}
        stroke="#fff"
        strokeWidth="0.5"
      />
    </Svg>
  )
}

export function IconWall({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <path
        d="M8 22 Q16 6 24 22"
        stroke={C.wall}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="8" y1="22" x2="24" y2="22" stroke={C.wall} strokeWidth="2" />
    </Svg>
  )
}

export function IconDoor({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="6" y="8" width="20" height="16" fill="#e8e4dc" stroke={C.door} strokeWidth="1" />
      <path d="M14 24 L14 12 A8 8 0 0 1 22 12" stroke={C.door} strokeWidth="1.5" fill="none" />
      <line x1="6" y1="8" x2="6" y2="24" stroke={C.wall} strokeWidth="2" />
    </Svg>
  )
}

export function IconWindow({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="6" y="10" width="20" height="14" fill="#d4e8f7" stroke={C.window} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="6" y2="24" stroke={C.wall} strokeWidth="2" />
      <line x1="16" y1="10" x2="16" y2="24" stroke={C.window} strokeWidth="1" />
      <line x1="6" y1="17" x2="26" y2="17" stroke={C.window} strokeWidth="1" />
    </Svg>
  )
}

export function IconComponent({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <rect x="3" y="8" width="8" height="6" fill="#c4b8a8" stroke={C.muted} />
      <circle cx="14" cy="11" r="3" fill="#8ab4d4" stroke={C.muted} />
    </Svg>
  )
}

export function IconColumn({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="11" y="6" width="10" height="20" fill="#b0b0b0" stroke={C.column} strokeWidth="1.5" />
      <line x1="11" y1="6" x2="21" y2="26" stroke="#888" strokeWidth="0.75" />
      <line x1="21" y1="6" x2="11" y2="26" stroke="#888" strokeWidth="0.75" />
    </Svg>
  )
}

export function IconRoof({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <path d="M2 14 L10 4 L18 14 Z" fill="#a08060" stroke={C.muted} strokeWidth="1" />
    </Svg>
  )
}

export function IconCeiling({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <rect x="3" y="5" width="14" height="10" fill="#e0e0e0" stroke={C.muted} />
      <line x1="5" y1="8" x2="15" y2="8" stroke="#aaa" strokeWidth="0.5" />
      <line x1="5" y1="11" x2="15" y2="11" stroke="#aaa" strokeWidth="0.5" />
    </Svg>
  )
}

export function IconFloor({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="6" y="10" width="20" height="14" fill="#d8d0c4" stroke={C.floor} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="26" y2="10" stroke={C.wall} strokeWidth="1" />
    </Svg>
  )
}

export function IconStair({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <path
        d="M8 24 L8 18 L12 18 L12 14 L16 14 L16 10 L20 10 L20 6"
        stroke={C.stair}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="miter"
      />
      <line x1="6" y1="24" x2="26" y2="24" stroke={C.wall} strokeWidth="1.5" />
    </Svg>
  )
}

export function IconRamp({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <path d="M3 16 L17 6" stroke={C.stair} strokeWidth="1.5" />
      <line x1="3" y1="16" x2="17" y2="16" stroke={C.muted} />
    </Svg>
  )
}

export function IconRailing({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <line x1="4" y1="14" x2="16" y2="6" stroke={C.muted} strokeWidth="1.5" />
      <line x1="4" y1="10" x2="16" y2="2" stroke={C.muted} strokeWidth="1" />
    </Svg>
  )
}

export function IconRoom({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="8" y="8" width="16" height="16" fill="rgba(74,144,196,0.2)" stroke={C.room} strokeWidth="1.5" />
      <text x="16" y="20" textAnchor="middle" fontSize="10" fill={C.room} fontFamily="Segoe UI,sans-serif">
        ?
      </text>
    </Svg>
  )
}

export function IconGrid({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <line x1="10" y1="2" x2="10" y2="18" stroke={C.grid} strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="10" cy="4" r="2.5" fill="#fff" stroke={C.grid} strokeWidth="1" />
      <text x="10" y="5" textAnchor="middle" fontSize="4" fill={C.grid} fontFamily="Segoe UI,sans-serif">
        1
      </text>
    </Svg>
  )
}

export function IconLevel({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <line x1="2" y1="10" x2="18" y2="10" stroke={C.level} strokeWidth="1.5" />
      <circle cx="4" cy="10" r="2" fill="#fff" stroke={C.level} />
      <text x="4" y="11" textAnchor="middle" fontSize="3" fill={C.level}>
        1
      </text>
    </Svg>
  )
}

export function IconRefPlane({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <line x1="2" y1="10" x2="18" y2="10" stroke={C.ref} strokeWidth="1" strokeDasharray="4 3" />
      <line x1="10" y1="2" x2="10" y2="18" stroke={C.ref} strokeWidth="1" strokeDasharray="4 3" />
    </Svg>
  )
}

export function IconSection({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <line x1="2" y1="10" x2="18" y2="10" stroke={C.section} strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="3" cy="10" r="2" fill={C.section} opacity="0.5" />
      <circle cx="17" cy="10" r="2" fill={C.section} opacity="0.5" />
    </Svg>
  )
}

export function IconGridLarge({ size = 32 }: IconProps) {
  return <IconGrid size={size} />
}

export function IconLevelLarge({ size = 32 }: IconProps) {
  return <IconLevel size={size} />
}

export function IconRefPlaneLarge({ size = 32 }: IconProps) {
  return (
    <Svg size={size}>
      <line x1="4" y1="16" x2="28" y2="16" stroke={C.ref} strokeWidth="1.5" strokeDasharray="6 4" />
      <line x1="16" y1="4" x2="16" y2="28" stroke={C.ref} strokeWidth="1.5" strokeDasharray="6 4" />
    </Svg>
  )
}

export function IconMove({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <path d="M10 3 L10 17 M10 3 L7 6 M10 3 L13 6" stroke={C.accent} strokeWidth="1.2" />
      <path d="M3 10 L17 10 M17 10 L14 7 M17 10 L14 13" stroke={C.accent} strokeWidth="1.2" />
    </Svg>
  )
}

export function IconCopy({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <rect x="7" y="5" width="10" height="10" fill="#f0f0f0" stroke={C.muted} />
      <rect x="3" y="9" width="10" height="10" fill="#fff" stroke={C.accent} />
    </Svg>
  )
}

export function IconDelete({ size = 20 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 20 20">
      <rect x="5" y="7" width="10" height="10" stroke={C.muted} />
      <line x1="7" y1="5" x2="13" y2="5" stroke="#c44" strokeWidth="1.5" />
      <line x1="8" y1="10" x2="12" y2="14" stroke="#c44" />
      <line x1="12" y1="10" x2="8" y2="14" stroke="#c44" />
    </Svg>
  )
}

export function IconFileNew({ size = 16 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 16 16">
      <rect x="2" y="1" width="10" height="13" fill="#fff" stroke={C.muted} />
      <line x1="4" y1="5" x2="10" y2="5" stroke={C.accent} strokeWidth="1" />
      <line x1="4" y1="8" x2="8" y2="8" stroke="#ccc" />
    </Svg>
  )
}

export function IconFileOpen({ size = 16 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 16 16">
      <path d="M1 4 L6 4 L7 2 L15 2 L15 14 L1 14 Z" fill="#f5c542" stroke={C.muted} />
    </Svg>
  )
}

export function IconFileSave({ size = 16 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 16 16">
      <rect x="2" y="1" width="12" height="14" fill="#4a90c4" stroke={C.muted} />
      <rect x="4" y="1" width="8" height="4" fill="#6ab0e0" />
    </Svg>
  )
}

export function IconUndo({ size = 16 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 16 16">
      <path d="M3 8 A5 5 0 1 1 8 4 L8 2 L12 6 L8 10 L8 8 A3 3 0 1 0 5 8" fill={C.accent} />
    </Svg>
  )
}

export function IconRedo({ size = 16 }: IconProps) {
  return (
    <Svg size={size} viewBox="0 0 16 16">
      <path d="M13 8 A5 5 0 1 0 8 4 L8 2 L4 6 L8 10 L8 8 A3 3 0 1 1 11 8" fill={C.accent} />
    </Svg>
  )
}
