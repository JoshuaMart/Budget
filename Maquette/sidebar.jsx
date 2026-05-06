// Sidebar — navigation + accounts

function Sidebar({ view, setView, accounts, onEditAccounts }) {
	const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
	return (
		<aside className="sidebar">
			<div className="brand">
				<div className="brand-mark">B</div>
				<div className="brand-name">Budget</div>
			</div>

			<nav className="nav">
				<button
					className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
					onClick={() => setView('dashboard')}
				>
					<Icon name="home" /> Tableau de bord
				</button>
				<button
					className={`nav-item ${view === 'transactions' ? 'active' : ''}`}
					onClick={() => setView('transactions')}
				>
					<Icon name="list" /> Transactions
				</button>
				<button
					className={`nav-item ${view === 'recurring' ? 'active' : ''}`}
					onClick={() => setView('recurring')}
				>
					<Icon name="wallet" /> Récurrents
				</button>
				<button
					className={`nav-item ${view === 'stats' ? 'active' : ''}`}
					onClick={() => setView('stats')}
				>
					<Icon name="chart" /> Statistiques
				</button>
			</nav>

			<div>
				<div className="sidebar-section-label">
					<span>Comptes</span>
					<button className="sidebar-add-btn" onClick={onEditAccounts} title="Modifier">
						<Icon name="edit" size={12} />
					</button>
				</div>
				{accounts.map((a) => (
					<div key={a.id} className={`account-card ${a.type === 'savings' ? 'savings' : ''}`}>
						<span className="account-card-label">
							<span className="account-dot"></span>
							{a.label}
						</span>
						<span className="account-card-balance num">
							€
							{a.balance.toLocaleString('en-US', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2
							})}
						</span>
					</div>
				))}
				<div
					className="account-card"
					style={{ background: 'var(--bg-sunk)', boxShadow: 'none', cursor: 'pointer' }}
					onClick={onEditAccounts}
				>
					<span className="account-card-label" style={{ color: 'var(--text-subtle)' }}>
						Total tous comptes
					</span>
					<span className="account-card-balance num" style={{ fontSize: 15 }}>
						€
						{totalBalance.toLocaleString('en-US', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}
					</span>
				</div>
			</div>

			<div
				style={{
					marginTop: 'auto',
					padding: '12px',
					fontSize: 11,
					color: 'var(--text-subtle)',
					lineHeight: 1.5
				}}
			>
				Méthode 50/30/20 — modifiable dans les Tweaks.
			</div>
		</aside>
	);
}

window.Sidebar = Sidebar;
