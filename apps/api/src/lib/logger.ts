import type { ApiEnv } from '../config/env.js';
// Deliberately closed fields: never serialize requests, bodies, headers or raw errors.
export interface LogEvent {
  event: string;
  requestId?: string;
  method?: string;
  status?: number;
  durationMs?: number;
}
export function createLogger(level: ApiEnv['LOG_LEVEL']) {
  const priorities = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
  return {
    write(severity: 'info' | 'error', fields: LogEvent) {
      if (priorities[severity] >= priorities[level])
        process.stdout.write(
          JSON.stringify({ time: new Date().toISOString(), level: severity, ...fields }) + '\n',
        );
    },
  };
}
export type Logger = ReturnType<typeof createLogger>;
