import { initialsOf } from "@/lib/profile";

export interface AvatarPerson {
  id: string;
  name: string;
  /// Null means no photo. Also the cache key — see the ?v= below.
  avatarUpdatedAt?: Date | null;
}

/**
 * Somebody's face, or their initials.
 *
 * A server component with a plain <img>: the photo is a few dozen kilobytes
 * served from our own origin, so next/image's resizing pipeline would add a
 * round trip and a build-time config to save nothing.
 *
 * The ?v= is the point of avatarUpdatedAt. The route caches hard, so without
 * a changing URL somebody uploads a new photo, sees the old one, and uploads
 * it again.
 */
export function Avatar({
  person,
  size = 40,
  className = "",
}: {
  person: AvatarPerson;
  size?: number;
  className?: string;
}) {
  const box = { width: size, height: size };
  const shared = `shrink-0 rounded-full object-cover ${className}`;

  if (person.avatarUpdatedAt) {
    const v = person.avatarUpdatedAt.getTime();
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatar/${person.id}?v=${v}`}
        alt={person.name}
        width={size}
        height={size}
        style={box}
        className={`${shared} border border-ink-200 bg-ink-100`}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className={`${shared} flex items-center justify-center bg-brand-200 font-semibold tracking-tight text-brand-900`}
    >
      {initialsOf(person.name)}
    </span>
  );
}
