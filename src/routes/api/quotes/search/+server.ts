import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

import { searchSymbols } from '#lib/server/services/quotes.service.ts';

import type { RequestHandler } from './$types';

const querySchema = z.object({
	q: z.string().trim().min(1).max(60),
	class: z.enum(['etf', 'stock', 'crypto'])
});

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const parsed = querySchema.safeParse({
		q: url.searchParams.get('q'),
		class: url.searchParams.get('class')
	});
	if (!parsed.success) error(400, 'Invalid query');
	try {
		return json(await searchSymbols(parsed.data.q, parsed.data.class));
	} catch {
		error(502, 'Recherche indisponible');
	}
};
