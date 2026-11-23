import { useState } from 'react';
import { resolveAvatarPresetImage } from '../../data/avatar-portraits.assets.ts';
import type { AvatarPresetSpec } from '../../data/honors.catalog.ts';

/**
 * [L7] EXW.L7.PROFILE_AVATAR_FRAME | v5.1.0 | SADT A5.1
 * Resilient profile portrait renderer: prioritizes custom uploaded data URL,
 * then high-resolution Solarpunk 2050 Vite portrait asset, with instant CSS monogram fallback on error.
 */
interface ProfileAvatarFrameProps {
  readonly preset: AvatarPresetSpec;
  readonly customDataUrl?: string | null;
  readonly alt: string;
  readonly className?: string;
  readonly monogramClassName?: string;
}

export function ProfileAvatarFrame({
  preset,
  customDataUrl = null,
  alt,
  className = 'h-12 w-12 rounded-xl',
  monogramClassName = 'text-sm',
}: ProfileAvatarFrameProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = customDataUrl ?? resolveAvatarPresetImage(preset.id);
  const showImage = Boolean(resolvedSrc) && failedSrc !== resolvedSrc;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})`,
      }}
    >
      {showImage && resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(resolvedSrc)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span className={`font-display font-black text-white select-none ${monogramClassName}`}>
          {preset.monogram}
        </span>
      )}
    </span>
  );
}
