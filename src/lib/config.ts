/** Config key-value access using Supabase. Only for server-side use. */

import { supabase } from "./db";

const CONFIG_TABLE = "config";

type ConfigValue = Record<string, unknown>;

/**
 * Get a config value by key. Returns null if key doesn't exist.
 */
export async function getConfig(key: string): Promise<ConfigValue | null> {
  const { data, error } = await supabase
    .from(CONFIG_TABLE)
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) return null;
  return data.value as ConfigValue;
}

/**
 * Upsert a config value by key.
 */
export async function setConfig(key: string, value: ConfigValue): Promise<void> {
  await supabase.from(CONFIG_TABLE).upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

/**
 * Check if maintenance mode is enabled.
 * Uses a short-lived cache for repeated calls within the same request.
 */
let _maintenanceCache: boolean | null = null;

export async function isMaintenanceMode(): Promise<boolean> {
  if (_maintenanceCache !== null) return _maintenanceCache;

  try {
    const config = await getConfig("maintenance");
    _maintenanceCache = config?.enabled === true;
  } catch {
    _maintenanceCache = false;
  }
  return _maintenanceCache;
}

export function clearMaintenanceCache(): void {
  _maintenanceCache = null;
}

/**
 * Enable or disable maintenance mode.
 */
export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await setConfig("maintenance", { enabled });
  clearMaintenanceCache();
}
