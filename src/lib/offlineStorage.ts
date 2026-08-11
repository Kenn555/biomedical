import { Equipment, IncidentTicket, KnowledgeArticle, AuditLog } from '../types';

const STORAGE_KEYS = {
  EQUIPMENT: 'biomed_cache_equipment_v1',
  TICKETS: 'biomed_cache_tickets_v1',
  KNOWLEDGE: 'biomed_cache_knowledge_v1',
  AUDIT: 'biomed_cache_audit_v1',
  PENDING_SYNC: 'biomed_pending_sync_v1',
  LAST_CACHE_TIME: 'biomed_last_cache_timestamp_v1',
};

export interface PendingSyncAction {
  id: string;
  type: 'CREATE_INCIDENT' | 'UPDATE_STATUS' | 'ASSIGN_TICKET' | 'ADD_REPORT';
  payload: any;
  timestamp: string;
}

// Load cached data or return default fallback
export function getCachedData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage:`, err);
  }
  return fallback;
}

// Save data to localStorage cache
export function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_CACHE_TIME, new Date().toISOString());
  } catch (err) {
    console.warn(`Failed to write ${key} to localStorage:`, err);
  }
}

// Queue an action performed while offline
export function queueOfflineAction(action: Omit<PendingSyncAction, 'id' | 'timestamp'>): PendingSyncAction {
  const pendingActions: PendingSyncAction[] = getCachedData(STORAGE_KEYS.PENDING_SYNC, []);
  const newAction: PendingSyncAction = {
    ...action,
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updatedQueue = [...pendingActions, newAction];
  localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedQueue));
  return newAction;
}

// Get pending offline queue
export function getPendingOfflineActions(): PendingSyncAction[] {
  return getCachedData(STORAGE_KEYS.PENDING_SYNC, []);
}

// Clear pending queue after sync
export function clearPendingOfflineActions(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  } catch (err) {
    console.warn('Failed to clear pending sync actions:', err);
  }
}

// Get last cache timestamp formatted
export function getLastCacheTimestamp(): string | null {
  try {
    const ts = localStorage.getItem(STORAGE_KEYS.LAST_CACHE_TIME);
    if (!ts) return null;
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return null;
  }
}

export { STORAGE_KEYS };
