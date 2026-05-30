import fs from 'fs';
import path from 'path';

// Helper to ensure .env is parsed when running outside Next.js process (e.g. in CLI seed/import scripts)
function loadEnvOnce() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return;
  }
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          process.env[key] = value;
        }
      }
    } catch (e) {
      console.warn("Failed to parse .env file inside redis helper:", e);
    }
  }
}

loadEnvOnce();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("WARNING: Upstash Redis credentials (UPSTASH_REDIS_REST_URL/TOKEN) are missing in environment.");
}

export async function redisGet<T>(key: string): Promise<T | null> {
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${key}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.error(`Upstash Redis GET failed for key "${key}":`, res.statusText);
      return null;
    }
    const data = await res.json();
    if (data.result) {
      return JSON.parse(data.result) as T;
    }
    return null;
  } catch (error) {
    console.error(`Upstash Redis GET error for key "${key}":`, error);
    return null;
  }
}

export async function redisSet<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
  if (!url || !token) return false;
  try {
    const endpoint = ttlSeconds 
      ? `${url}/set/${key}?ex=${ttlSeconds}` 
      : `${url}/set/${key}`;
      
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(value)
    });
    if (!res.ok) {
      console.error(`Upstash Redis SET failed for key "${key}":`, res.statusText);
      return false;
    }
    const data = await res.json();
    return data.result === "OK";
  } catch (error) {
    console.error(`Upstash Redis SET error for key "${key}":`, error);
    return false;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  if (!url || !token) return false;
  try {
    const res = await fetch(`${url}/del/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.error(`Upstash Redis DEL failed for key "${key}":`, res.statusText);
      return false;
    }
    const data = await res.json();
    return data.result > 0;
  } catch (error) {
    console.error(`Upstash Redis DEL error for key "${key}":`, error);
    return false;
  }
}
