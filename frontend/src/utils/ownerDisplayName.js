function pickStoredDisplayName(entity) {
  if (!entity) return '';
  const raw =
    entity.ownerDisplayName ??
    entity.owner_display_name ??
    entity.ownerDisplayname ??
    '';
  const normalized = String(raw).trim();
  if (!normalized) return '';

  const genericLabels = new Set(['membre', 'utilisateur', 'user']);
  return genericLabels.has(normalized.toLowerCase()) ? '' : normalized;
}

/**
 * @param {{ ownerDisplayName?: string | null, ownerId?: number | null }} entity
 * @param {{ id?: number, prenom?: string, nom?: string, firstName?: string, lastName?: string } | null | undefined} currentUser
 */
export function formatOwnerDisplayName(entity, currentUser) {
  const stored = pickStoredDisplayName(entity);
  if (stored) return stored;

  const uid = currentUser?.id ?? currentUser?.userId;
  if (currentUser && entity?.ownerId != null && uid != null && String(entity.ownerId) === String(uid)) {
    const fromFr = [currentUser.prenom, currentUser.nom].filter(Boolean).join(' ').trim();
    const fromEn = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ').trim();
    const fromProfile = fromFr || fromEn;
    if (fromProfile) return fromProfile;
  }

  return 'Membre';
}
