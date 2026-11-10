import { describe, expect, it } from 'vitest';
import { validateUuid } from '../validate-uuid';

describe('validateUuid', () => {
	it('accepts a valid lowercase UUID', () => {
		expect(validateUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
	});

	it('accepts a valid uppercase UUID', () => {
		expect(validateUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
	});

	it('rejects an empty string', () => {
		expect(validateUuid('')).toBe(false);
	});

	it('rejects a UUID without hyphens', () => {
		expect(validateUuid('550e8400e29b41d4a716446655440000')).toBe(false);
	});

	it('rejects a UUID with a short final segment', () => {
		expect(validateUuid('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
	});

	it('rejects a string with invalid hex characters', () => {
		expect(validateUuid('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
	});
});
