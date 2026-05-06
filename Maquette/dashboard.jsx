// Dashboard view

function Dashboard({
	envelopes,
	ratios,
	monthlyIncome,
	monthExpenses,
	totalSpent,
	saved,
	activeEnvTab,
	setActiveEnvTab,
	onAddTx,
	onRemoveCat,
	onAddCat,
	addingCat,
	setAddingCat
}) {
	const [monthOffset, setMonthOffset] = useState(0);
	const currentMonth = new Date(2026, 4 + monthOffset, 1);

	const necBudget = (monthlyIncome * ratios.necessities) / 100;
	const wantBudget = (monthlyIncome * ratios.wants) / 100;
	const invBudget = (monthlyIncome * ratios.investments) / 100;
	const budgets = { necessities: necBudget, wants: wantBudget, investments: invBudget };

	const incomeDelta = 0; // for demo

	return (
		<React.Fragment>
			<div className="topbar">
				<div>
					<h1>Bonjour Camille</h1>
					<div className="topbar-sub">Aperçu de tes finances pour {monthLabel(currentMonth)}</div>
				</div>
				<div className="topbar-actions">
					<div className="month-switcher">
						<button onClick={() => setMonthOffset((o) => o - 1)}>
							<Icon name="chevron-left" size={14} />
						</button>
						<span className="month-label">{monthLabel(currentMonth)}</span>
						<button onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}>
							<Icon name="chevron-right" size={14} />
						</button>
					</div>
					<button className="btn btn-primary" onClick={onAddTx}>
						<Icon name="plus" size={14} /> Ajouter une transaction
					</button>
				</div>
			</div>

			{/* Hero metrics */}
			<div className="hero-grid">
				<div className="hero-card primary">
					<div className="label">Reste à allouer ce mois-ci</div>
					<div className="value num">{fmtEUR(saved)}</div>
					<div className="delta" style={{ color: 'oklch(0.75 0.01 80)' }}>
						sur {fmtEUR(monthlyIncome)} de revenus
					</div>
				</div>
				<div className="hero-card">
					<div className="label">Revenus</div>
					<div className="value num">{fmtEUR(monthlyIncome)}</div>
					<div className="delta">SALAIRE — ACME Corp</div>
				</div>
				<div className="hero-card">
					<div className="label">Dépensé</div>
					<div className="value num">{fmtEUR(totalSpent)}</div>
					<div className="delta">
						{((totalSpent / monthlyIncome) * 100).toFixed(0)}% des revenus
					</div>
				</div>
				<div className="hero-card">
					<div className="label">Jours restants</div>
					<div className="value num">26</div>
					<div className="delta">{fmtEUR(saved / 26, { compact: true })}/jour disponible</div>
				</div>
			</div>

			{/* Envelopes */}
			<div className="section-title" style={{ marginTop: 8 }}>
				Enveloppes{' '}
				<span className="section-title-meta">
					— Méthode {ratios.necessities}/{ratios.wants}/{ratios.investments}
				</span>
			</div>
			<div className="envelopes-row">
				{Object.values(envelopes).map((env) => {
					const spent = monthExpenses.totals[env.id];
					const budget = budgets[env.id];
					const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
					const remaining = budget - spent;
					const over = remaining < 0;
					return (
						<div
							key={env.id}
							className={`envelope env-${env.id}`}
							onClick={() => setActiveEnvTab(env.id)}
						>
							<div className="envelope-corner"></div>
							<div className="envelope-head">
								<span className="envelope-tag">
									<span className="envelope-tag-dot"></span>
									{env.label}
								</span>
								<span className="envelope-pct">{ratios[env.id]}%</span>
							</div>
							<div className="envelope-name">
								{env.label === 'Nécessités'
									? 'Vie courante'
									: env.label === 'Envies'
										? 'Plaisirs'
										: 'Avenir'}
							</div>
							<div className="envelope-spent-row">
								<span className="envelope-spent num">{fmtEUR(spent)}</span>
								<span className="envelope-budget num">/ {fmtEUR(budget)}</span>
							</div>
							<div className={`envelope-bar ${over ? 'over' : ''}`}>
								<div className="envelope-bar-fill" style={{ width: pct + '%' }}></div>
							</div>
							<div className="envelope-foot">
								<span>{over ? 'Dépassement' : 'Reste'}</span>
								<span className={`envelope-remaining num ${over ? 'over' : ''}`}>
									{fmtEUR(Math.abs(remaining))}
								</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* Categories detail */}
			<div className="categories-detail">
				<div className="card-h" style={{ marginBottom: 18 }}>
					<div className="categories-tabs">
						{Object.values(envelopes).map((env) => (
							<button
								key={env.id}
								className={`categories-tab ${activeEnvTab === env.id ? 'active' : ''} env-${env.id}`}
								onClick={() => setActiveEnvTab(env.id)}
							>
								<span className="categories-tab-dot" style={{ background: 'var(--env)' }}></span>
								{env.label}
								<span style={{ color: 'var(--text-subtle)', fontWeight: 400, marginLeft: 4 }}>
									{env.categories.length}
								</span>
							</button>
						))}
					</div>
				</div>

				<CategoriesGrid
					envelope={envelopes[activeEnvTab]}
					spent={monthExpenses.byCat}
					budget={budgets[activeEnvTab]}
					onRemove={onRemoveCat}
					onAdd={onAddCat}
					adding={addingCat === activeEnvTab}
					setAdding={(v) => setAddingCat(v ? activeEnvTab : null)}
				/>
			</div>
		</React.Fragment>
	);
}

function CategoriesGrid({ envelope, spent, budget, onRemove, onAdd, adding, setAdding }) {
	const [name, setName] = useState('');
	const inputRef = useRef(null);
	useEffect(() => {
		if (adding && inputRef.current) inputRef.current.focus();
	}, [adding]);

	const submit = () => {
		if (name.trim()) onAdd(envelope.id, name.trim());
		setName('');
		setAdding(false);
	};

	// Compute max per-cat to scale bars
	const catTotals = envelope.categories.map((c) => spent[`${envelope.id}:${c.id}`] || 0);
	const max = Math.max(...catTotals, budget * 0.4);

	return (
		<div className={`cat-grid env-${envelope.id}`}>
			{envelope.categories.map((c) => {
				const amount = spent[`${envelope.id}:${c.id}`] || 0;
				const pct = max > 0 ? (amount / max) * 100 : 0;
				return (
					<div key={c.id} className="cat-tile">
						<button
							className="cat-tile-delete"
							onClick={(e) => {
								e.stopPropagation();
								onRemove(envelope.id, c.id);
							}}
							title="Supprimer"
						>
							<Icon name="x" size={12} />
						</button>
						<div className="cat-tile-head">
							<span className="cat-tile-name">{c.label}</span>
						</div>
						<div className="cat-tile-amount num">{fmtEUR(amount)}</div>
						<div className="cat-tile-bar">
							<div className="cat-tile-bar-fill" style={{ width: pct + '%' }}></div>
						</div>
						<div className="cat-tile-meta">
							{budget > 0 ? ((amount / budget) * 100).toFixed(0) : 0}% de l'enveloppe
						</div>
					</div>
				);
			})}
			{adding ? (
				<div className="cat-tile">
					<input
						ref={inputRef}
						className="cat-add-input"
						placeholder="Nom de la catégorie"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') submit();
							if (e.key === 'Escape') {
								setName('');
								setAdding(false);
							}
						}}
						onBlur={submit}
					/>
				</div>
			) : (
				<button className="cat-tile add" onClick={() => setAdding(true)}>
					<Icon name="plus" size={14} /> Ajouter une catégorie
				</button>
			)}
		</div>
	);
}

window.Dashboard = Dashboard;
