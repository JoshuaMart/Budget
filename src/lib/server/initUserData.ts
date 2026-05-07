import { db } from './db/client';
import { account, category, envelope } from './db/schema';

const ENVELOPE_DEFAULTS = [
	{
		key: 'necessities' as const,
		label: 'Nécessités',
		ratio: 50,
		color: 'oklch(0.55 0.08 155)',
		position: 0,
		categories: [
			'Logement',
			'Transports',
			'Alimentation et boissons',
			'Emprunts',
			'Dépenses professionnelles',
			'Frais',
			'Impôts',
			'Scolarité'
		]
	},
	{
		key: 'wants' as const,
		label: 'Envies',
		ratio: 30,
		color: 'oklch(0.65 0.12 60)',
		position: 1,
		categories: ['Abonnements', 'Sorties et Restaurants', 'Shopping']
	},
	{
		key: 'investments' as const,
		label: 'Investissements',
		ratio: 20,
		color: 'oklch(0.50 0.10 260)',
		position: 2,
		categories: ['Actions', 'Obligations', 'Immobilier', 'Matelas de sécurité', 'Crypto']
	}
];

const ACCOUNT_DEFAULTS = [
	{ label: 'Compte courant', type: 'checking' as const },
	{ label: 'Épargne', type: 'savings' as const }
];

// Virtual "Non catégorisé" category — receives transactions whose real
// category was deleted. Pinned at position 9999 so it sorts last.
export const UNCATEGORIZED_LABEL = 'Non catégorisé';
const UNCATEGORIZED_POSITION = 9999;

/**
 * Provision a fresh user with default envelopes, categories and accounts.
 * Idempotent: callers (signup flow) should ensure it runs once per user.
 */
export function initUserData(userId: string): void {
	db.transaction((tx) => {
		for (const envDef of ENVELOPE_DEFAULTS) {
			const [env] = tx
				.insert(envelope)
				.values({
					userId,
					key: envDef.key,
					label: envDef.label,
					ratio: envDef.ratio,
					color: envDef.color,
					position: envDef.position
				})
				.returning()
				.all();
			if (!env) throw new Error(`failed to insert envelope ${envDef.key}`);

			envDef.categories.forEach((label, index) => {
				tx.insert(category).values({ userId, envelopeId: env.id, label, position: index }).run();
			});

			tx.insert(category)
				.values({
					userId,
					envelopeId: env.id,
					label: UNCATEGORIZED_LABEL,
					position: UNCATEGORIZED_POSITION,
					isVirtual: true
				})
				.run();
		}

		for (const acc of ACCOUNT_DEFAULTS) {
			tx.insert(account).values({ userId, label: acc.label, type: acc.type }).run();
		}
	});
}
