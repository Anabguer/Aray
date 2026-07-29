import { IconUser } from '@/components/Icons'

export function AvatarPlaceholder() {
  return (
    <div className="avatar-placeholder" aria-label="Avatar provisional de Aray">
      <span className="avatar-placeholder__glow" aria-hidden="true" />
      <IconUser className="avatar-placeholder__icon" />
    </div>
  )
}
