// Stats view — donut, monthly bars, top categories

function Stats({ envelopes, ratios, monthlyIncome, monthExpenses, transactions }) {
	const totalSpent =
		monthExpenses.totals.necessities +
		monthExpenses.totals.wants +
		monthExpenses.totals.investments;

	// Donut
	const donutData = Object.values(envelopes).map((env) => ({
		id: env.id,
		label: env.label,
		color: env.color,
		spent: monthExpenses.totals[env.id],
		budget: (monthlyIncome * ratios[env.id]) / 100
	}));

	// Monthly bars
	const monthlyData = MONTHLY_TREND;
	const maxMonthlyTotal = Math.max(
		...monthlyData.map((m) => m.necessities + m.wants + m.investments)
	);

	// Top categories (current month)
	const allCats = [];
	Object.values(envelopes).forEach((env) => {
		env.categories.forEach((c) => {
			const amount = monthExpenses.byCat[`${env.id}:${c.id}`] || 0;
			if (amount > 0) {
				allCats.push({ ...c, envelope: env, amount });
			}
		});
	});
	allCats.sort((a, b) => b.amount - a.amount);
	const top = allCats.slice(0, 6);
	const maxCat = top[0]?.amount || 1;

	return (
		<React.Fragment>
			<div className="topbar">
				<div>
					<h1>Statistiques</h1>
					<div className="topbar-sub">Vue d'ensemble sur 6 mois</div>
				</div>
			</div>

			{/* Hero summary */}
			<div className="hero-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
				<div className="hero-card">
					<div className="label">Dépensé en mai</div>
					<div className="value num">{fmtEUR(totalSpent)}</div>
					<div className="delta down">↓ {fmtEUR(330, { compact: true })} vs avril</div>
				</div>
				<div className="hero-card">
					<div className="label">Moyenne mensuelle</div>
					<div className="value num">{fmtEUR(2820, { compact: true })}</div>
					<div className="delta">sur 6 mois</div>
				</div>
				<div className="hero-card">
					<div className="label">Épargné cumulé</div>
					<div className="value num">{fmtEUR(3640, { compact: true })}</div>
					<div className="delta up">↑ trajectoire saine</div>
				</div>
				<div className="hero-card">
					<div className="label">Conformité 50/30/20</div>
					<div className="value num">82%</div>
					<div className="delta">Envies sous le quota</div>
				</div>
			</div>

			<div className="stats-grid" style={{ marginTop: 12 }}>
				<div className="card">
					<div className="card-h">
						<div className="card-title">Évolution mensuelle</div>
						<div className="card-title num" style={{ color: 'var(--text-subtle)' }}>
							Déc → Mai
						</div>
					</div>
					<div className="bars-chart">
						{monthlyData.map((m) => {
							const total = m.necessities + m.wants + m.investments;
							const necW = (m.necessities / maxMonthlyTotal) * 100;
							const wantW = (m.wants / maxMonthlyTotal) * 100;
							const invW = (m.investments / maxMonthlyTotal) * 100;
							return (
								<div className="bars-row" key={m.month}>
									<span className="bars-month">{m.month}</span>
									<div className="bars-stack">
										<span
											style={{ width: necW + '%', background: 'var(--nec)' }}
											title={`Nécessités: ${fmtEUR(m.necessities)}`}
										></span>
										<span
											style={{ width: wantW + '%', background: 'var(--want)' }}
											title={`Envies: ${fmtEUR(m.wants)}`}
										></span>
										<span
											style={{ width: invW + '%', background: 'var(--inv)' }}
											title={`Investissements: ${fmtEUR(m.investments)}`}
										></span>
									</div>
									<span className="bars-total">{fmtEUR(total, { compact: true })}</span>
								</div>
							);
						})}
					</div>
					<div
						style={{
							display: 'flex',
							gap: 16,
							marginTop: 14,
							fontSize: 12,
							color: 'var(--text-muted)'
						}}
					>
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
							<span
								style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--nec)' }}
							></span>
							Nécessités
						</span>
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
							<span
								style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--want)' }}
							></span>
							Envies
						</span>
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
							<span
								style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--inv)' }}
							></span>
							Investissements
						</span>
					</div>
				</div>

				<div className="card">
					<div className="card-h">
						<div className="card-title">Répartition de mai</div>
					</div>
					<Donut data={donutData} totalSpent={totalSpent} />
				</div>
			</div>

			<div className="card" style={{ marginTop: 12 }}>
				<div className="card-h">
					<div className="card-title">Top catégories ce mois-ci</div>
					<div className="card-title num" style={{ color: 'var(--text-subtle)' }}>
						{top.length} sur {allCats.length}
					</div>
				</div>
				<div className="top-cats">
					{top.map((c) => {
						const pct = (c.amount / maxCat) * 100;
						return (
							<div className={`top-cat env-${c.envelope.id}`} key={c.id}>
								<div
									className="top-cat-icon"
									style={{ background: 'var(--env-soft)', color: 'var(--env)' }}
								>
									{c.label.charAt(0)}
								</div>
								<div className="top-cat-info">
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<span className="top-cat-name">{c.label}</span>
										<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
											{c.envelope.label}
										</span>
									</div>
									<div className="top-cat-bar">
										<div
											className="top-cat-bar-fill"
											style={{ width: pct + '%', background: 'var(--env)' }}
										></div>
									</div>
								</div>
								<div className="top-cat-amount num">{fmtEUR(c.amount)}</div>
							</div>
						);
					})}
				</div>
			</div>
		</React.Fragment>
	);
}

function Donut({ data, totalSpent }) {
	const size = 180;
	const stroke = 28;
	const r = (size - stroke) / 2;
	const c = 2 * Math.PI * r;
	const total = data.reduce((s, d) => s + d.spent, 0);

	let offset = 0;
	const segments = data.map((d) => {
		const portion = total > 0 ? d.spent / total : 0;
		const len = portion * c;
		const seg = {
			...d,
			dasharray: `${len} ${c - len}`,
			dashoffset: -offset
		};
		offset += len;
		return seg;
	});

	return (
		<div className="donut-wrap">
			<svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="var(--bg-sunk)"
					strokeWidth={stroke}
				/>
				{segments.map((s, i) => (
					<circle
						key={s.id}
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill="none"
						stroke={s.color}
						strokeWidth={stroke}
						strokeDasharray={s.dasharray}
						strokeDashoffset={s.dashoffset}
						transform={`rotate(-90 ${size / 2} ${size / 2})`}
						style={{ transition: 'stroke-dasharray 0.4s' }}
					/>
				))}
				<text
					x="50%"
					y="48%"
					textAnchor="middle"
					fontSize="11"
					fill="var(--text-muted)"
					fontWeight="500"
				>
					Dépensé
				</text>
				<text
					x="50%"
					y="58%"
					textAnchor="middle"
					fontSize="20"
					fontFamily="var(--font-mono)"
					fontWeight="500"
					fill="var(--text)"
				>
					{fmtEUR(totalSpent, { compact: true })}
				</text>
			</svg>
			<div className="donut-legend">
				{data.map((d) => {
					const pct = total > 0 ? (d.spent / total) * 100 : 0;
					return (
						<div className="donut-legend-row" key={d.id}>
							<div className="donut-legend-top">
								<span className="donut-legend-label">
									<span className="donut-legend-dot" style={{ background: d.color }}></span>
									{d.label}
								</span>
								<span className="donut-legend-amount num">
									{fmtEUR(d.spent, { compact: true })}
								</span>
							</div>
							<div className="donut-legend-bar">
								<div
									className="donut-legend-bar-fill"
									style={{ width: pct + '%', background: d.color }}
								></div>
							</div>
							<div className="donut-legend-meta">
								{pct.toFixed(0)}% des dépenses · budget {fmtEUR(d.budget, { compact: true })}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

window.Stats = Stats;
