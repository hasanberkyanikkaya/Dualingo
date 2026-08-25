export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type SyncEntityType =
  | 'activity_day'
  | 'badge_unlock'
  | 'learning_attempt'
  | 'progress_state'
  | 'prayer_log'
  | 'quran_goal'
  | 'quran_read_event'
  | 'quran_reading_position';

export type SyncOperation = 'upsert' | 'delete';

export type SyncMutation = {
  mutationId: string;
  entityType: SyncEntityType;
  entityKey: string;
  operation: SyncOperation;
  payload: JsonObject;
  clientUpdatedAt: number;
};

export type RemoteSyncChange = {
  entity_type: SyncEntityType;
  entity_key: string;
  payload: JsonObject;
  deleted_at: number | null;
  server_version: number;
};

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'offline' | 'error';

