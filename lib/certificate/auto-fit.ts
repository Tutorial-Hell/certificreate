// Never returns more than 1 - this only ever shrinks text, never grows it
// past its base size.
export function computeFitScale(availableWidth: number, naturalWidth: number): number {
  if (availableWidth <= 0 || naturalWidth <= 0) return 1;
  if (naturalWidth <= availableWidth) return 1;
  return availableWidth / naturalWidth;
}
