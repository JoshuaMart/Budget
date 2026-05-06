// Mock data for the budget app
const ENVELOPES = {
	necessities: {
		id: 'necessities',
		label: 'Nécessités',
		pct: 50,
		color: 'oklch(0.55 0.08 155)',
		colorSoft: 'oklch(0.94 0.03 155)',
		colorMid: 'oklch(0.85 0.05 155)',
		categories: [
			{ id: 'logement', label: 'Logement', icon: '◧' },
			{ id: 'transports', label: 'Transports', icon: '◐' },
			{ id: 'alim', label: 'Alimentation et boissons', icon: '◑' },
			{ id: 'emprunts', label: 'Emprunts', icon: '◒' },
			{ id: 'pro', label: 'Dépenses professionnelles', icon: '◓' },
			{ id: 'frais', label: 'Frais', icon: '◔' },
			{ id: 'impots', label: 'Impôts', icon: '◕' },
			{ id: 'scolarite', label: 'Scolarité', icon: '◖' }
		]
	},
	wants: {
		id: 'wants',
		label: 'Envies',
		pct: 30,
		color: 'oklch(0.65 0.12 60)',
		colorSoft: 'oklch(0.95 0.04 60)',
		colorMid: 'oklch(0.87 0.07 60)',
		categories: [
			{ id: 'abos', label: 'Abonnements', icon: '◧' },
			{ id: 'sorties', label: 'Sorties et Restaurants', icon: '◐' },
			{ id: 'shopping', label: 'Shopping', icon: '◑' }
		]
	},
	investments: {
		id: 'investments',
		label: 'Investissements',
		pct: 20,
		color: 'oklch(0.50 0.10 260)',
		colorSoft: 'oklch(0.95 0.03 260)',
		colorMid: 'oklch(0.86 0.05 260)',
		categories: [
			{ id: 'actions', label: 'Actions', icon: '◧' },
			{ id: 'oblig', label: 'Obligations', icon: '◐' },
			{ id: 'immo', label: 'Immobilier', icon: '◑' },
			{ id: 'matelas', label: 'Matelas de sécurité', icon: '◒' },
			{ id: 'crypto', label: 'Crypto', icon: '◓' }
		]
	}
};

const ACCOUNTS_INIT = [
	{ id: 'courant', label: 'Compte courant', balance: 4280.55, initial: 3500.0, type: 'checking' },
	{ id: 'epargne', label: 'Épargne', balance: 12640.0, initial: 12000.0, type: 'savings' }
];

// Realistic transactions for current month (May 2026)
const TRANSACTIONS_INIT = [
	{
		id: 't1',
		date: '2026-05-05',
		merchant: 'Carrefour Market',
		amount: -68.4,
		account: 'courant',
		envelope: 'necessities',
		category: 'alim'
	},
	{
		id: 't2',
		date: '2026-05-05',
		merchant: 'Netflix',
		amount: -13.49,
		account: 'courant',
		envelope: 'wants',
		category: 'abos',
		recurringId: 'r4'
	},
	{
		id: 't3',
		date: '2026-05-04',
		merchant: 'Uber',
		amount: -14.2,
		account: 'courant',
		envelope: 'necessities',
		category: 'transports'
	},
	{
		id: 't4',
		date: '2026-05-04',
		merchant: 'Le Petit Bistro',
		amount: -42.0,
		account: 'courant',
		envelope: 'wants',
		category: 'sorties'
	},
	{
		id: 't5',
		date: '2026-05-03',
		merchant: 'Virement DCA Trade Republic',
		amount: -300.0,
		account: 'courant',
		envelope: 'investments',
		category: 'actions',
		recurringId: 'r7'
	},
	{
		id: 't6',
		date: '2026-05-03',
		merchant: 'Boulangerie Marie',
		amount: -8.5,
		account: 'courant',
		envelope: 'necessities',
		category: 'alim'
	},
	{
		id: 't7',
		date: '2026-05-02',
		merchant: 'Spotify Family',
		amount: -17.99,
		account: 'courant',
		envelope: 'wants',
		category: 'abos',
		recurringId: 'r5'
	},
	{
		id: 't8',
		date: '2026-05-02',
		merchant: 'EDF',
		amount: -89.0,
		account: 'courant',
		envelope: 'necessities',
		category: 'logement',
		recurringId: 'r2'
	},
	{
		id: 't9',
		date: '2026-05-02',
		merchant: 'SALAIRE — ACME Corp',
		amount: 3200.0,
		account: 'courant',
		envelope: null,
		category: null,
		income: true,
		recurringId: 'r9'
	},
	{
		id: 't10',
		date: '2026-05-01',
		merchant: 'Loyer Mai',
		amount: -980.0,
		account: 'courant',
		envelope: 'necessities',
		category: 'logement',
		recurringId: 'r1'
	},
	{
		id: 't11',
		date: '2026-05-01',
		merchant: 'Virement Livret A',
		amount: -200.0,
		account: 'courant',
		envelope: 'investments',
		category: 'matelas',
		recurringId: 'r8',
		kind: 'transfer',
		toAccount: 'epargne'
	},
	{
		id: 't12',
		date: '2026-04-30',
		merchant: 'Zara',
		amount: -75.9,
		account: 'courant',
		envelope: 'wants',
		category: 'shopping'
	},
	{
		id: 't13',
		date: '2026-04-29',
		merchant: 'Monoprix',
		amount: -54.2,
		account: 'courant',
		envelope: 'necessities',
		category: 'alim'
	},
	{
		id: 't14',
		date: '2026-04-28',
		merchant: 'SNCF Voyageurs',
		amount: -78.0,
		account: 'courant',
		envelope: 'necessities',
		category: 'transports'
	},
	{
		id: 't15',
		date: '2026-04-28',
		merchant: 'iCloud+',
		amount: -2.99,
		account: 'courant',
		envelope: 'wants',
		category: 'abos'
	},
	{
		id: 't16',
		date: '2026-04-27',
		merchant: 'Coinbase — BTC',
		amount: -150.0,
		account: 'courant',
		envelope: 'investments',
		category: 'crypto'
	},
	{
		id: 't17',
		date: '2026-04-26',
		merchant: 'Restaurant Comptoir',
		amount: -64.0,
		account: 'courant',
		envelope: 'wants',
		category: 'sorties'
	},
	{
		id: 't18',
		date: '2026-04-25',
		merchant: 'Pharmacie du Centre',
		amount: -23.4,
		account: 'courant',
		envelope: 'necessities',
		category: 'frais'
	},
	{
		id: 't19',
		date: '2026-04-24',
		merchant: 'Amazon',
		amount: -41.2,
		account: 'courant',
		envelope: 'wants',
		category: 'shopping'
	},
	{
		id: 't20',
		date: '2026-04-23',
		merchant: 'Total Energies',
		amount: -62.3,
		account: 'courant',
		envelope: 'necessities',
		category: 'transports'
	},
	{
		id: 't21',
		date: '2026-04-22',
		merchant: 'Decathlon',
		amount: -89.99,
		account: 'courant',
		envelope: 'wants',
		category: 'shopping'
	},
	{
		id: 't22',
		date: '2026-04-21',
		merchant: 'Picard',
		amount: -34.1,
		account: 'courant',
		envelope: 'necessities',
		category: 'alim'
	},
	{
		id: 't23',
		date: '2026-04-20',
		merchant: 'Cinéma UGC',
		amount: -22.0,
		account: 'courant',
		envelope: 'wants',
		category: 'sorties'
	},
	{
		id: 't24',
		date: '2026-04-19',
		merchant: 'Orange Mobile',
		amount: -29.99,
		account: 'courant',
		envelope: 'necessities',
		category: 'logement'
	},
	{
		id: 't25',
		date: '2026-04-18',
		merchant: 'Café Oberkampf',
		amount: -6.8,
		account: 'courant',
		envelope: 'wants',
		category: 'sorties'
	}
];

// Monthly trend data (last 6 months)
const MONTHLY_TREND = [
	{ month: 'Déc', necessities: 1480, wants: 890, investments: 450 },
	{ month: 'Jan', necessities: 1520, wants: 720, investments: 600 },
	{ month: 'Fév', necessities: 1390, wants: 810, investments: 650 },
	{ month: 'Mar', necessities: 1610, wants: 940, investments: 600 },
	{ month: 'Avr', necessities: 1540, wants: 870, investments: 650 },
	{ month: 'Mai', necessities: 1162, wants: 220, investments: 650 }
];

// Recurring payments — define once, used to flag matching tx + show on Recurring screen
const RECURRING_INIT = [
	{
		id: 'r1',
		merchant: 'Loyer Mai',
		amount: 980.0,
		frequency: 'monthly',
		dayOfMonth: 1,
		envelope: 'necessities',
		category: 'logement',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-01',
		active: true
	},
	{
		id: 'r2',
		merchant: 'EDF',
		amount: 89.0,
		frequency: 'monthly',
		dayOfMonth: 2,
		envelope: 'necessities',
		category: 'logement',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-02',
		active: true
	},
	{
		id: 'r3',
		merchant: 'Orange Mobile',
		amount: 29.99,
		frequency: 'monthly',
		dayOfMonth: 19,
		envelope: 'necessities',
		category: 'logement',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-05-19',
		active: true
	},
	{
		id: 'r4',
		merchant: 'Netflix',
		amount: 13.49,
		frequency: 'monthly',
		dayOfMonth: 5,
		envelope: 'wants',
		category: 'abos',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-05',
		active: true
	},
	{
		id: 'r5',
		merchant: 'Spotify Family',
		amount: 17.99,
		frequency: 'monthly',
		dayOfMonth: 2,
		envelope: 'wants',
		category: 'abos',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-02',
		active: true
	},
	{
		id: 'r6',
		merchant: 'iCloud+',
		amount: 2.99,
		frequency: 'monthly',
		dayOfMonth: 28,
		envelope: 'wants',
		category: 'abos',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-05-28',
		active: true
	},
	{
		id: 'r7',
		merchant: 'DCA Trade Republic',
		amount: 300.0,
		frequency: 'monthly',
		dayOfMonth: 3,
		envelope: 'investments',
		category: 'actions',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-03',
		active: true
	},
	{
		id: 'r8',
		merchant: 'Virement Livret A',
		amount: 200.0,
		frequency: 'monthly',
		dayOfMonth: 1,
		envelope: 'investments',
		category: 'matelas',
		account: 'courant',
		kind: 'transfer',
		toAccount: 'epargne',
		nextDate: '2026-06-01',
		active: true
	},
	{
		id: 'r9',
		merchant: 'SALAIRE — ACME Corp',
		amount: 3200.0,
		frequency: 'monthly',
		dayOfMonth: 2,
		account: 'courant',
		kind: 'income',
		nextDate: '2026-06-02',
		active: true
	}
];

window.ENVELOPES = ENVELOPES;
window.ACCOUNTS_INIT = ACCOUNTS_INIT;
window.TRANSACTIONS_INIT = TRANSACTIONS_INIT;
window.MONTHLY_TREND = MONTHLY_TREND;
window.RECURRING_INIT = RECURRING_INIT;
