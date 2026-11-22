/**
 * HiDPI backing scale for raster world maps (2400x1350 -> 3600x2025).
 * Stays safely below the 4096px GPU texture limit on iOS/Android while
 * eliminating bilinear upscaling blur on Retina/HiDPI displays.
 */
export const MAP_HIDPI_SCALE = 1.5;

/**
 * Luminance-preserving, halo-clamped Contrast Adaptive Sharpening (CAS)
 * for upscaled raster world maps.
 *
 * - Samples both r=1 and r=2 cardinal neighbors (matching ~1px in 1672x941 source art)
 * - Skips low-contrast smooth gradients (sky/water) so zero noise is amplified
 * - Clamps overshoot strictly within local luminance bounds to prevent ringing/halos
 * - Applies identical delta to R/G/B so original hue and saturation stay untouched
 */
export function applyContrastAdaptiveSharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength = 1.08
): void {
  if (width < 8 || height < 8) return;

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const dst = imgData.data;
    const src = new Uint8ClampedArray(dst);
    const stride = width * 4;
    const stride2 = stride * 2;

    for (let y = 2; y < height - 2; y++) {
      const rowOffset = y * stride;
      for (let x = 2; x < width - 2; x++) {
        const i = rowOffset + x * 4;

        const rC = src[i];
        const gC = src[i + 1];
        const bC = src[i + 2];
        const lC = (rC * 77 + gC * 150 + bC * 29) >> 8;

        // 1-pixel cardinal neighbors
        const iN1 = i - stride;
        const iS1 = i + stride;
        const iW1 = i - 4;
        const iE1 = i + 4;

        const lN1 = (src[iN1] * 77 + src[iN1 + 1] * 150 + src[iN1 + 2] * 29) >> 8;
        const lS1 = (src[iS1] * 77 + src[iS1 + 1] * 150 + src[iS1 + 2] * 29) >> 8;
        const lW1 = (src[iW1] * 77 + src[iW1 + 1] * 150 + src[iW1 + 2] * 29) >> 8;
        const lE1 = (src[iE1] * 77 + src[iE1 + 1] * 150 + src[iE1 + 2] * 29) >> 8;

        // 2-pixel cardinal neighbors (~1 source pixel away in 1672x941 artwork)
        const iN2 = i - stride2;
        const iS2 = i + stride2;
        const iW2 = i - 8;
        const iE2 = i + 8;

        const lN2 = (src[iN2] * 77 + src[iN2 + 1] * 150 + src[iN2 + 2] * 29) >> 8;
        const lS2 = (src[iS2] * 77 + src[iS2 + 1] * 150 + src[iS2 + 2] * 29) >> 8;
        const lW2 = (src[iW2] * 77 + src[iW2 + 1] * 150 + src[iW2 + 2] * 29) >> 8;
        const lE2 = (src[iE2] * 77 + src[iE2 + 1] * 150 + src[iE2 + 2] * 29) >> 8;

        const minL = Math.min(lC, lN1, lS1, lW1, lE1, lN2, lS2, lW2, lE2);
        const maxL = Math.max(lC, lN1, lS1, lW1, lE1, lN2, lS2, lW2, lE2);
        const range = maxL - minL;

        // Leave smooth sky/water gradients untouched
        if (range < 6) continue;

        const avg1 = (lN1 + lS1 + lW1 + lE1) * 0.25;
        const avg2 = (lN2 + lS2 + lW2 + lE2) * 0.25;
        const blur = avg2 * 0.65 + avg1 * 0.35;

        const rawDelta = (lC - blur) * strength;
        const overshoot = Math.min(18, Math.round(range * 0.28));
        const minAllowed = minL - overshoot;
        const maxAllowed = maxL + overshoot;

        let targetL = Math.round(lC + rawDelta);
        if (targetL < minAllowed) targetL = minAllowed;
        if (targetL > maxAllowed) targetL = maxAllowed;

        const delta = targetL - lC;
        if (delta === 0) continue;

        const nr = rC + delta;
        const ng = gC + delta;
        const nb = bC + delta;

        dst[i] = nr < 0 ? 0 : nr > 255 ? 255 : nr;
        dst[i + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng;
        dst[i + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Gracefully skip sharpening if canvas pixel access is unavailable
  }
}
