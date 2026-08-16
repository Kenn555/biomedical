/** Les consultations horodatées ({ id, at }[]) peuvent contenir de vieilles
 *  valeurs sous forme de simples ids (string) — on normalise partout. */
export function viewedIds(viewedBy?: { id: string; at?: string }[] | string[]): string[] {
  if (!Array.isArray(viewedBy)) return [];
  return viewedBy.map((v) => (typeof v === 'string' ? v : v.id));
}

export function isViewed(viewedBy: { id: string; at?: string }[] | string[] | undefined, userId: string): boolean {
  return viewedIds(viewedBy).includes(userId);
}
