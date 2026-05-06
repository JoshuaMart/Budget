// Recurring payments view

function Recurring({ recurring, envelopes, accounts, onToggle, onRemove, onAdd, onEdit }) {
	const active = recurring.filter((r) => r.active);
	const totalExpenses = active.filter((r) => r.kind !== 'income').reduce((s, r) => s + r.amount, 0);
	const totalIncome = active.filter((r) => r.kind === 'income').reduce((s, r) => s + r.amount, 0);

	const byEnv = { necessities: 0, wants: 0, investments: 0 };
	active
		.filter((r) => r.kind !== 'income' && r.envelope)
		.forEach((r) => {
			byEnv[r.envelope] += r.amount;
		});

	const sorted = [...recurring].sort((a, b) => b.amount - a.amount);

	const freqLabel = (r) => {
		if (r.frequency === 'monthly') return `Mensuel · le ${r.dayOfMonth}`;
		if (r.frequency === 'weekly') return 'Hebdomadaire';
		if (r.frequency === 'yearly') return 'Annuel';
		return r.frequency;
	};

	const accLabel = (id) => accounts.find((a) => a.id === id)?.label || id;

	return (
		<React.Fragment>
			<div className="topbar">
				<div>
					<h1>Paiements récurrents</h1>
					<div className="topbar-sub">
						{active.length} actif{active.length > 1 ? 's' : ''} · charges fixes mensuelles{' '}
						{fmtEUR(totalExpenses)}
					</div>
				</div>
				<div className="topbar-actions">
					<button className="btn btn-primary" onClick={onAdd}>
						<Icon name="plus" size={14} /> Nouveau récurrent
					</button>
				</div>
			</div>

			<div className="recurring-grid">
				<div className="rec-summary">
					<div className="label">Engagements mensuels par enveloppe</div>
					{Object.values(envelopes).map((env) => (
						<div key={env.id} className={`rec-summary-row env-${env.id}`}>
							<span className="name">
								<span className="dot" style={{ background: 'var(--env)' }}></span>
								{env.label}
							</span>
							<span className="amount">{fmtEUR(byEnv[env.id])}</span>
						</div>
					))}
					<div
						className="rec-summary-row"
						style={{ borderTop: '2px solid var(--border)', marginTop: 6, paddingTop: 12 }}
					>
						<span className="name" style={{ fontWeight: 600 }}>
							Total dépenses fixes
						</span>
						<span className="amount" style={{ fontSize: 16 }}>
							{fmtEUR(totalExpenses)}
						</span>
					</div>
				</div>

				<div className="rec-summary">
					<div className="label">Solde net mensuel</div>
					<div
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 32,
							fontWeight: 500,
							letterSpacing: '-0.025em',
							marginTop: 4
						}}
					>
						{fmtEUR(totalIncome - totalExpenses, { sign: true })}
					</div>
					<div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
						après revenus récurrents et charges fixes
					</div>
					<div style={{ marginTop: 18, display: 'flex', gap: 14 }}>
						<div
							style={{ flex: 1, padding: 12, background: 'oklch(0.95 0.04 155)', borderRadius: 10 }}
						>
							<div
								style={{
									fontSize: 11,
									color: 'oklch(0.40 0.10 155)',
									textTransform: 'uppercase',
									letterSpacing: '0.04em',
									fontWeight: 600
								}}
							>
								Revenus
							</div>
							<div
								className="num"
								style={{
									fontSize: 16,
									fontWeight: 500,
									marginTop: 4,
									color: 'oklch(0.40 0.10 155)'
								}}
							>
								{fmtEUR(totalIncome)}
							</div>
						</div>
						<div
							style={{ flex: 1, padding: 12, background: 'oklch(0.95 0.03 30)', borderRadius: 10 }}
						>
							<div
								style={{
									fontSize: 11,
									color: 'oklch(0.40 0.10 30)',
									textTransform: 'uppercase',
									letterSpacing: '0.04em',
									fontWeight: 600
								}}
							>
								Charges
							</div>
							<div
								className="num"
								style={{
									fontSize: 16,
									fontWeight: 500,
									marginTop: 4,
									color: 'oklch(0.40 0.10 30)'
								}}
							>
								{fmtEUR(totalExpenses)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="rec-list">
				{sorted.map((r) => {
					const env = r.envelope ? envelopes[r.envelope] : null;
					const isIncome = r.kind === 'income';
					const isTransfer = r.kind === 'transfer';
					return (
						<div
							key={r.id}
							className={`rec-row ${env ? 'env-' + env.id : ''} ${!r.active ? 'inactive' : ''}`}
						>
							<div className={`rec-icon ${isIncome ? 'income' : ''}`}>{r.merchant.charAt(0)}</div>
							<div>
								<div className="rec-merchant">{r.merchant}</div>
								<div className="rec-meta">
									{isIncome
										? 'Revenu'
										: isTransfer
											? `Transfert → ${accLabel(r.toAccount)}`
											: env
												? `${env.label} · ${env.categories.find((c) => c.id === r.category)?.label || ''}`
												: '—'}
								</div>
							</div>
							<div className="rec-frequency">
								<div className="rec-frequency-icon">
									<Icon name="chart" size={12} />
								</div>
								{freqLabel(r)}
							</div>
							<div className="rec-next">Prochaine : {dayLabel(r.nextDate)}</div>
							<div className="rec-meta">{accLabel(r.account)}</div>
							<div className={`rec-amount ${isIncome ? 'income' : ''}`}>
								{isIncome ? '+' : '−'}€
								{r.amount.toLocaleString('en-US', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})}
							</div>
							<div
								style={{
									display: 'flex',
									gap: 4,
									alignItems: 'center',
									justifyContent: 'flex-end'
								}}
							>
								<div
									className={`rec-toggle ${r.active ? 'on' : ''}`}
									onClick={() => onToggle(r.id)}
									title={r.active ? 'Désactiver' : 'Activer'}
								></div>
							</div>
						</div>
					);
				})}
				{sorted.length === 0 && (
					<div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
						Aucun paiement récurrent. Ajoute-en un pour automatiser ton suivi.
					</div>
				)}
			</div>
		</React.Fragment>
	);
}

window.Recurring = Recurring;
