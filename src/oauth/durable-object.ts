import { DurableObject } from 'cloudflare:workers';
import type { NodeSavedSession } from '@atproto/oauth-client-node';
import { decrypt, encrypt, parseKeyRing } from '../crypto';
import { createDoLogger, type Logger } from '../logger';
import type { OAuthTokenEnv } from './types';

export class AtpOAuthDurableObject extends DurableObject {
	private tokenData: NodeSavedSession | undefined = undefined;
	private locked = false;
	private lockQueue: Array<() => void> = [];
	private lockAcquiredAtTimestamp: number | undefined = undefined;
	private logger: Logger = createDoLogger(
		{
			doClassName: 'AtpOAuthDurableObject',
		},
		true,
	);

	constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
		super(ctx, env);
		this.logger = this.logger.child({
			doId: this.ctx.id.toString(),
			doName: this.ctx.id.name || 'n/a',
		});
	}

	private get typedEnv(): OAuthTokenEnv {
		return this.env as unknown as OAuthTokenEnv;
	}

	async getToken(): Promise<NodeSavedSession | undefined> {
		if (!this.tokenData) {
			const rawTokenData = await this.ctx.storage.get<string>('tokenData');
			if (!rawTokenData) return undefined;

			const keys = parseKeyRing(this.typedEnv.OAUTH_TOKEN_KV_ENCRYPTION_KEYS);
			let plaintext: string | undefined;
			let needsReencryption = false;

			for (let i = 0; i < keys.length; i++) {
				try {
					plaintext = await decrypt(rawTokenData, keys[i]);
					needsReencryption = i > 0;
					break;
				} catch {
					if (i === keys.length - 1) throw new Error(`Token decryption failed, no more keys to try`);
				}
			}

			if (!plaintext) {
				throw new Error(`Token decryption failed, no decrypted value determined`);
			}

			this.tokenData = JSON.parse(plaintext) as NodeSavedSession;

			// Re-encrypt with current key so this entry migrates off the old key.
			if (needsReencryption) {
				const encrypted = await encrypt(JSON.stringify(this.tokenData), keys[0]);
				await this.ctx.storage.put<string>('tokenData', encrypted);
			}
		} else {
			this.logger.info(`Token pulled from live state`);
		}
		return this.tokenData;
	}

	async setToken(tokenData: NodeSavedSession): Promise<void> {
		this.tokenData = tokenData;
		const keys = parseKeyRing(this.typedEnv.OAUTH_TOKEN_KV_ENCRYPTION_KEYS);
		const encrypted = await encrypt(JSON.stringify(tokenData), keys[0]);
		await this.ctx.storage.put<string>('tokenData', encrypted);
		this.logger.info(`Set token`);
	}

	async deleteToken(): Promise<void> {
		this.tokenData = undefined;
		await this.ctx.storage.delete('tokenData');
		this.logger.info(`Delete token`);
	}

	async getPasswordToken(): Promise<Record<string, unknown> | undefined> {
		const raw = await this.ctx.storage.get<string>('passwordTokenData');
		if (!raw) return undefined;

		const keys = parseKeyRing(this.typedEnv.OAUTH_TOKEN_KV_ENCRYPTION_KEYS);
		for (let i = 0; i < keys.length; i++) {
			try {
				const plaintext = await decrypt(raw, keys[i]);
				const data = JSON.parse(plaintext) as Record<string, unknown>;
				if (i > 0) {
					const encrypted = await encrypt(plaintext, keys[0]);
					await this.ctx.storage.put<string>('passwordTokenData', encrypted);
				}
				return data;
			} catch {
				if (i === keys.length - 1) throw new Error(`Password token decryption failed, no more keys to try`);
			}
		}
	}

	async setPasswordToken(data: Record<string, unknown>): Promise<void> {
		const keys = parseKeyRing(this.typedEnv.OAUTH_TOKEN_KV_ENCRYPTION_KEYS);
		const encrypted = await encrypt(JSON.stringify(data), keys[0]);
		await this.ctx.storage.put<string>('passwordTokenData', encrypted);
		this.logger.info(`Set password token`);
	}

	async deletePasswordToken(): Promise<void> {
		await this.ctx.storage.delete('passwordTokenData');
		this.logger.info(`Delete password token`);
	}

	async acquireLock(): Promise<void> {
		// if it has been locked for more than 30 seconds force-release it
		if (this.lockAcquiredAtTimestamp && Date.now() - this.lockAcquiredAtTimestamp > 30_000) {
			this.locked = false;
			this.lockAcquiredAtTimestamp = undefined;
		}
		if (this.locked) {
			await new Promise<void>(resolve => this.lockQueue.push(resolve));
			return;
		}
		this.locked = true;
		this.lockAcquiredAtTimestamp = Date.now();
		this.logger.info(`Lock aquired`);
	}

	async releaseLock(): Promise<void> {
		try {
			const next = this.lockQueue.shift();
			if (next) {
				this.lockAcquiredAtTimestamp = Date.now();
				next(); // transfer ownership, don't flip locked to false
			} else {
				this.locked = false;
				this.lockAcquiredAtTimestamp = undefined;
			}
		} catch (err) {
			this.locked = false;
			this.lockAcquiredAtTimestamp = undefined;
			this.logger.error(`Error releasing lock: ${err}`);
		}
	}
}
