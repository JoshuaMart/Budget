// Main app entry — Budget app

const { useState, useEffect, useMemo, useRef } = React;

const fmtEUR = (n, opts = {}) => {
	const { sign = false, compact = false } = opts;
	const abs = Math.abs(n);
	const formatted =
		compact && abs >= 1000
			? new Intl.NumberFormat('en-US', {
					minimumFractionDigits: 0,
					maximumFractionDigits: abs >= 10000 ? 0 : 1
				}).format(abs)
			: new Intl.NumberFormat('en-US', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}).format(abs);
	const s = (sign && n > 0 ? '+' : n < 0 ? '−' : '') + '€' + formatted;
	return s;
};

const monthLabel = (date) => {
	const months = [
		'Janvier',
		'Février',
		'Mars',
		'Avril',
		'Mai',
		'Juin',
		'Juillet',
		'Août',
		'Septembre',
		'Octobre',
		'Novembre',
		'Décembre'
	];
	return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const dayLabel = (dStr) => {
	const d = new Date(dStr);
	const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
	const months = [
		'Jan',
		'Fév',
		'Mar',
		'Avr',
		'Mai',
		'Juin',
		'Juil',
		'Août',
		'Sep',
		'Oct',
		'Nov',
		'Déc'
	];
	return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
};

// Default tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
	ratioNec: 50,
	ratioWant: 30,
	ratioInv: 20,
	monthlyIncome: 3200,
	density: 'comfortable',
	envelopeViz: 'bars'
}; /*EDITMODE-END*/

function App() {
	const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
	const [view, setView] = useState('dashboard');
	const [envelopes, setEnvelopes] = useState(ENVELOPES);
	const [accounts, setAccounts] = useState(ACCOUNTS_INIT);
	const [transactions, setTransactions] = useState(TRANSACTIONS_INIT);
	const [recurring, setRecurring] = useState(RECURRING_INIT);
	const [activeEnvTab, setActiveEnvTab] = useState('necessities');
	const [showAddTx, setShowAddTx] = useState(false);
	const [showAccounts, setShowAccounts] = useState(false);
	const [filterEnv, setFilterEnv] = useState(null);
	const [search, setSearch] = useState('');
	const [addingCat, setAddingCat] = useState(null);

	const monthlyIncome = tweaks.monthlyIncome;
	const ratios = {
		necessities: tweaks.ratioNec,
		wants: tweaks.ratioWant,
		investments: tweaks.ratioInv
	};

	const monthExpenses = useMemo(() => {
		const totals = { necessities: 0, wants: 0, investments: 0 };
		const byCat = {};
		transactions.forEach((t) => {
			if (t.income) return;
			const d = new Date(t.date);
			if (d.getMonth() !== 4 || d.getFullYear() !== 2026) return;
			if (t.envelope && totals[t.envelope] !== undefined) {
				totals[t.envelope] += Math.abs(t.amount);
				const k = `${t.envelope}:${t.category}`;
				byCat[k] = (byCat[k] || 0) + Math.abs(t.amount);
			}
		});
		return { totals, byCat };
	}, [transactions]);

	const totalSpent =
		monthExpenses.totals.necessities +
		monthExpenses.totals.wants +
		monthExpenses.totals.investments;
	const saved = monthlyIncome - totalSpent;

	const addCategory = (envId, name) => {
		setEnvelopes((prev) => ({
			...prev,
			[envId]: {
				...prev[envId],
				categories: [...prev[envId].categories, { id: 'c' + Date.now(), label: name, icon: '◧' }]
			}
		}));
	};
	const removeCategory = (envId, catId) => {
		setEnvelopes((prev) => ({
			...prev,
			[envId]: { ...prev[envId], categories: prev[envId].categories.filter((c) => c.id !== catId) }
		}));
	};
	const addTransaction = (tx) => {
		setTransactions((prev) => [{ ...tx, id: 't' + Date.now() }, ...prev]);
	};
	const addRecurring = (r) => {
		setRecurring((prev) => [...prev, { ...r, id: 'r' + Date.now() }]);
	};
	const toggleRecurring = (id) => {
		setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
	};

	return (
		<div className="app">
			<Sidebar
				view={view}
				setView={setView}
				accounts={accounts}
				onEditAccounts={() => setShowAccounts(true)}
			/>
			<main className="main">
				{view === 'dashboard' && (
					<Dashboard
						envelopes={envelopes}
						ratios={ratios}
						monthlyIncome={monthlyIncome}
						monthExpenses={monthExpenses}
						totalSpent={totalSpent}
						saved={saved}
						activeEnvTab={activeEnvTab}
						setActiveEnvTab={setActiveEnvTab}
						onAddTx={() => setShowAddTx(true)}
						onRemoveCat={removeCategory}
						onAddCat={addCategory}
						addingCat={addingCat}
						setAddingCat={setAddingCat}
					/>
				)}
				{view === 'transactions' && (
					<Transactions
						transactions={transactions}
						envelopes={envelopes}
						accounts={accounts}
						recurring={recurring}
						filterEnv={filterEnv}
						setFilterEnv={setFilterEnv}
						search={search}
						setSearch={setSearch}
						onAddTx={() => setShowAddTx(true)}
					/>
				)}
				{view === 'recurring' && (
					<Recurring
						recurring={recurring}
						envelopes={envelopes}
						accounts={accounts}
						onToggle={toggleRecurring}
						onAdd={() => setShowAddTx(true)}
					/>
				)}
				{view === 'stats' && (
					<Stats
						envelopes={envelopes}
						ratios={ratios}
						monthlyIncome={monthlyIncome}
						monthExpenses={monthExpenses}
						transactions={transactions}
					/>
				)}
			</main>

			{showAddTx && (
				<AddTxModal
					envelopes={envelopes}
					accounts={accounts}
					onClose={() => setShowAddTx(false)}
					onAdd={(tx) => {
						addTransaction(tx);
						setShowAddTx(false);
					}}
					onAddRecurring={(r) => {
						addRecurring(r);
					}}
				/>
			)}

			{showAccounts && (
				<AccountsModal
					accounts={accounts}
					setAccounts={setAccounts}
					onClose={() => setShowAccounts(false)}
				/>
			)}

			<BudgetTweaks tweaks={tweaks} setTweak={setTweak} />
		</div>
	);
}

// AddTxModal closes after submit but we need to close it from App-level
// Wrap onAdd to close after submit
// (Override: pass onAdd that calls addTransaction THEN closes)

window.App = App;
window.fmtEUR = fmtEUR;
window.monthLabel = monthLabel;
window.dayLabel = dayLabel;
