import { refreshPrices } from './services/holdings.service';

const INTERVAL_MS = 6 * 60 * 60 * 1000;

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

async function tick(): Promise<void> {
	try {
		const n = await refreshPrices();
		if (n > 0) console.log(`[prices] refreshed ${n} holding price(s)`);
	} catch (e) {
		console.warn('[prices] refresh failed:', e instanceof Error ? e.message : e);
	}
}

/**
 * Refresh market prices on startup, then every 6h. Each run also writes the
 * day's net worth snapshot, so the history chart fills itself even when the
 * patrimoine page isn't opened. Same HMR-safe `started` guard as the
 * recurring scheduler.
 */
export function startPriceScheduler(): void {
	if (started) return;
	started = true;

	void tick();
	timer = setInterval(() => void tick(), INTERVAL_MS);
	if (typeof timer.unref === 'function') timer.unref();
}
