// Transactions list view

function Transactions({ transactions, envelopes, accounts, filterEnv, setFilterEnv, search, setSearch, onAddTx }) {
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterEnv && t.envelope !== filterEnv) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.merchant.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filterEnv, search]);

  // Group by day
  const byDay = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const getEnv = (id) => envelopes[id];
  const getCat = (envId, catId) => {
    if (!envId) return null;
    return envelopes[envId]?.categories.find(c => c.id === catId);
  };
  const getAccount = (id) => accounts.find(a => a.id === id);

  return (
    <React.Fragment>
      <div className="topbar">
        <div>
          <h1>Transactions</h1>
          <div className="topbar-sub">{filtered.length} mouvement{filtered.length > 1 ? 's' : ''} · classés automatiquement</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={onAddTx}>
            <Icon name="plus" size={14} /> Ajouter
          </button>
        </div>
      </div>

      <div className="tx-toolbar">
        <input className="tx-search" placeholder="Rechercher un commerçant…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className={`tx-filter-pill ${!filterEnv ? 'active' : ''}`} onClick={() => setFilterEnv(null)}>
          Tout
        </button>
        {Object.values(envelopes).map(env => (
          <button
            key={env.id}
            className={`tx-filter-pill env-${env.id} ${filterEnv === env.id ? 'active' : ''}`}
            onClick={() => setFilterEnv(env.id === filterEnv ? null : env.id)}
            style={filterEnv === env.id ? {} : { color: 'var(--env)' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: filterEnv === env.id ? 'currentColor' : 'var(--env)' }}></span>
            {env.label}
          </button>
        ))}
      </div>

      <div className="tx-list">
        {byDay.map(([day, txs]) => {
          const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
          return (
            <React.Fragment key={day}>
              <div className="tx-day-h">
                <span>{dayLabel(day)}</span>
                <span className="day-total">{fmtEUR(dayTotal, { sign: true })}</span>
              </div>
              {txs.map(t => {
                const env = getEnv(t.envelope);
                const cat = getCat(t.envelope, t.category);
                const acc = getAccount(t.account);
                const toAcc = t.toAccount ? getAccount(t.toAccount) : null;
                const isTransfer = t.kind === 'transfer';
                const isRecurring = !!t.recurringId;
                const initial = t.merchant.charAt(0).toUpperCase();
                return (
                  <div key={t.id} className={`tx-row env-${t.envelope || 'necessities'}`}>
                    <div className="tx-icon">{isTransfer ? '↗' : initial}</div>
                    <div>
                      <div className="tx-merchant">
                        {t.merchant}
                        {isRecurring && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, padding: '2px 6px', background: 'var(--bg-sunk)', color: 'var(--text-muted)', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Récurrent
                          </span>
                        )}
                      </div>
                      <div className="tx-cat">
                        {isTransfer && toAcc ? (
                          <span className="tx-transfer-arrow">{acc?.label} → {toAcc.label}</span>
                        ) : (
                          cat ? cat.label : (t.income ? 'Revenu' : '—')
                        )}
                      </div>
                    </div>
                    <div>
                      {env ? (
                        <span className="tx-envelope-tag">
                          <span className="tx-envelope-tag-dot"></span>
                          {env.label}
                        </span>
                      ) : (
                        <span className="tx-envelope-tag" style={{ background: 'oklch(0.95 0.04 155)', color: 'oklch(0.45 0.10 155)' }}>
                          <span className="tx-envelope-tag-dot" style={{ background: 'oklch(0.45 0.10 155)' }}></span>
                          Revenu
                        </span>
                      )}
                    </div>
                    <div className="tx-account">{isTransfer && toAcc ? `${acc?.label} → ${toAcc.label}` : acc?.label}</div>
                    <div className={`tx-amount ${t.income ? 'income' : ''}`}>
                      {fmtEUR(t.amount, { sign: true })}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </React.Fragment>
  );
}

window.Transactions = Transactions;
