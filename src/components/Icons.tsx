import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function BaseIcon({ title, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function IconFlag(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.5 3.5L16 11H5" />
    </BaseIcon>
  )
}

export function IconSpark(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </BaseIcon>
  )
}

export function IconCoin(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2.5 1.5c.4.8-.1 1.5-1 2-.9.5-1.9.8-1.9 1.5 0 .7.8 1.2 2 1.2s1.9-.4 2.4-1" />
    </BaseIcon>
  )
}

export function IconBolt(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M13 2L4 14h6l-1 8 10-14h-6l1-6z" />
    </BaseIcon>
  )
}

export function IconBook(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z" />
    </BaseIcon>
  )
}

export function IconImage(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M3 16l5-4 4 3 3-2 6 4" />
    </BaseIcon>
  )
}

export function IconGem(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 9l6-5 6 5-6 11L6 9z" />
      <path d="M6 9h12M12 4v16" />
    </BaseIcon>
  )
}

export function IconCalc(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0" />
    </BaseIcon>
  )
}

export function IconSpeech(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4 3v-3.2A2.5 2.5 0 0 1 4 13.5v-7z" />
    </BaseIcon>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16" />
    </BaseIcon>
  )
}

export function IconLeaf(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 19c8 0 12-6 14-14-8 2-14 6-14 14z" />
      <path d="M5 19c2-4 6-7 11-9" />
    </BaseIcon>
  )
}

export function IconHome(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M7 10.5V20h10v-9.5" />
    </BaseIcon>
  )
}

export function IconGamepad(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7.5 9.5h9a4 4 0 0 1 3.85 5.1l-.55 2.1A2.75 2.75 0 0 1 17.15 19H6.85a2.75 2.75 0 0 1-2.65-2.3l-.55-2.1A4 4 0 0 1 7.5 9.5z" />
      <path d="M9 13v3M7.5 14.5h3" />
      <circle cx="15.2" cy="13.2" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="17.1" cy="15.1" r="0.85" fill="currentColor" stroke="none" />
    </BaseIcon>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M15 6l-6 6 6 6" />
    </BaseIcon>
  )
}

export function IconReview(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6" />
      <path d="M18 3.5v4.2h-4.2" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.5 6" />
      <path d="M6 20.5v-4.2h4.2" />
    </BaseIcon>
  )
}

export function IconUser(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3.2 4.2-4.8 7-4.8S17.2 15.8 19 19" />
    </BaseIcon>
  )
}
