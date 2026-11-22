import type { WallpaperId } from '../contracts/ui-theme.schema.ts';
import { ART_MANIFEST, getEraBanner } from './art-manifest.data.ts';

/**
 * [L1] EXW.L1.UI_WALLPAPERS_ASSETS | v4.1.0 | SADT A5.1
 * Browser/Vite image resolver for UI Theme Studio wallpapers (keeps ui-themes.catalog.ts Node-pure).
 */
export function resolveWallpaperImageSrc(wallpaperId: WallpaperId): string | null {
  switch (wallpaperId) {
    case 'KEYART_2050':
      return ART_MANIFEST.menuBackground;
    case 'ERA_1':
      return getEraBanner(1);
    case 'ERA_2':
      return getEraBanner(2);
    case 'ERA_3':
      return getEraBanner(3);
    case 'ERA_4':
      return getEraBanner(4);
    case 'ERA_5':
      return getEraBanner(5);
    case 'ERA_6':
      return getEraBanner(6);
    default:
      return null;
  }
}
