export function parseEnv(envString: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!envString) return env;

  const lines = envString.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Remove optional quotes
      const cleanValue = value.replace(/^["']|["']$/g, '');
      env[key.trim()] = cleanValue;
    }
  }

  return env;
}
