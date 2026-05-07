import { runDueRecurrings } from './services/recurring.service';

const DAY_MS = 24 * 60 * 60 * 1000;

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Materialise every due recurring on startup, then re-check daily. Idempotent
 * across server restarts thanks to the `(recurringId, date)` uniqueness
 * guard inside `runDueRecurrings`. Safe to call multiple times — the
 * `started` flag prevents stacking timers (handy in dev with HMR).
 */
export function startRecurringScheduler(): void {
	if (started) return;
	started = true;

	const initial = runDueRecurrings();
	if (initial > 0) {
		console.log(`[scheduler] materialised ${initial} due recurring transaction(s) on startup`);
	}

	timer = setInterval(() => {
		const n = runDueRecurrings();
		if (n > 0) console.log(`[scheduler] materialised ${n} due recurring transaction(s)`);
	}, DAY_MS);
	// Don't keep the process alive just for this timer.
	if (typeof timer.unref === 'function') timer.unref();
}
