import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

import { createAccount, deleteAccount, updateAccount } from '$lib/server/services/accounts.service';

import type { RequestHandler } from './$types';

const accountFields = z.object({
	label: z.string().min(1).max(60),
	initialBalanceCents: z.number().int(),
	type: z.enum(['checking', 'savings'])
});

const payloadSchema = z.object({
	create: z.array(accountFields).default([]),
	update: z.array(accountFields.extend({ id: z.string() })).default([]),
	delete: z.array(z.string()).default([])
});

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const userId = locals.user.id;
	const body = await request.json();
	const parsed = payloadSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.issues[0]?.message ?? 'Invalid payload');

	for (const a of parsed.data.create) createAccount(userId, a);
	for (const a of parsed.data.update)
		updateAccount(userId, a.id, {
			label: a.label,
			type: a.type,
			initialBalanceCents: a.initialBalanceCents
		});
	for (const id of parsed.data.delete) deleteAccount(userId, id);

	return json({ ok: true });
};
