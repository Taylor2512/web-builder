import type { SVGProps } from 'react'

export type EditorShellIconProps = {
  size?: number
  className?: string
  title?: string
}

function ShellIconBase({
  size = 18,
  className,
  title,
  children,
  ...rest
}: EditorShellIconProps & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function AddElementsIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <rect x='4' y='4' width='7' height='7' rx='1.2' />
      <rect x='13' y='4' width='7' height='7' rx='1.2' />
      <rect x='4' y='13' width='7' height='7' rx='1.2' />
      <path d='M16.5 14.25V18.75' />
      <path d='M14.25 16.5H18.75' />
    </ShellIconBase>
  )
}

export function AddSectionIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <rect x='4' y='5' width='16' height='14' rx='2' />
      <path d='M4 10.5H20' />
      <path d='M12 13V17' />
      <path d='M10 15H14' />
    </ShellIconBase>
  )
}

export function PagesIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <path d='M9 6.5H6.5A2.5 2.5 0 0 0 4 9v8.5A2.5 2.5 0 0 0 6.5 20H15a2.5 2.5 0 0 0 2.5-2.5V15' />
      <path d='M9 4h8.5A2.5 2.5 0 0 1 20 6.5V15a2.5 2.5 0 0 1-2.5 2.5H9A2.5 2.5 0 0 1 6.5 15V6.5A2.5 2.5 0 0 1 9 4Z' />
    </ShellIconBase>
  )
}

export function DesignIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <path d='M6 18L18 6' />
      <path d='M14 5.5L18.5 10' />
      <path d='M5.5 14L10 18.5' />
      <circle cx='7.25' cy='7.25' r='1.25' />
      <circle cx='16.75' cy='16.75' r='1.25' />
    </ShellIconBase>
  )
}

export function AppsIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <rect x='4' y='4' width='6' height='6' rx='1.4' />
      <rect x='14' y='4' width='6' height='6' rx='1.4' />
      <rect x='4' y='14' width='6' height='6' rx='1.4' />
      <rect x='14' y='14' width='6' height='6' rx='1.4' />
    </ShellIconBase>
  )
}

export function BusinessIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <path d='M4 20V8.5A1.5 1.5 0 0 1 5.5 7H11v13' />
      <path d='M13 20V5.5A1.5 1.5 0 0 1 14.5 4H18.5A1.5 1.5 0 0 1 20 5.5V20' />
      <path d='M3 20H21' />
      <path d='M7 10H8' />
      <path d='M7 13H8' />
      <path d='M15.5 8H17.5' />
      <path d='M15.5 11H17.5' />
    </ShellIconBase>
  )
}

export function MediaIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <rect x='4' y='5' width='16' height='14' rx='2' />
      <circle cx='9' cy='10' r='1.5' />
      <path d='M6.5 17L11 12.5L13.5 15L16 12.5L19 15.5' />
    </ShellIconBase>
  )
}

export function CmsIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <rect x='4' y='5' width='16' height='14' rx='2' />
      <path d='M8 9H16' />
      <path d='M8 12H16' />
      <path d='M8 15H12' />
      <circle cx='16.5' cy='15.5' r='1.5' />
    </ShellIconBase>
  )
}

export function SearchActionIcon(props: EditorShellIconProps) {
  return (
    <ShellIconBase {...props}>
      <circle cx='10.5' cy='10.5' r='5.5' />
      <path d='M15 15L20 20' />
      <path d='M10.5 8.25V12.75' />
      <path d='M8.25 10.5H12.75' />
    </ShellIconBase>
  )
}
