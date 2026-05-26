import fs from 'fs';
import path from 'path';

// Direct parser for .env.local to ensure values are propagated in Vitest test threads
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const value = trimmed.substring(firstEquals + 1).trim();
    const cleanValue = value.replace(/^['"]|['"]$/g, '');
    process.env[key] = cleanValue;
  });
}
