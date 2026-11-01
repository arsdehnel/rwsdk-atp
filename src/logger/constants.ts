import type { LogLevel } from './types';

export const CENSOR = '[Redacted]';
export const REDACTED_PATTERN = /password|secret|token|key/i;
export const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
