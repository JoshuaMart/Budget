// Modals — Add transaction (with transfer + recurring), Manage accounts, Add recurring

function AddTxModal({
	envelopes,
	accounts,
	onClose,
	onAdd,
	onAddRecurring,
	defaultMode = 'expense'
}) {
	const [mode, setMode] = useState(defaultMode); // 'expense' | 'transfer' | 'income'
	const [merchant, setMerchant] = useState('');
	const [amount, setAmount] = useState('');
	const [envelope, setEnvelope] = useState('necessities');
	const [category, setCategory] = useState(envelopes.necessities.categories[0].id);
	const [account, setAccount] = useState(accounts[0].id);
	const [toAccount, setToAccount] = useState(accounts[1]?.id || accounts[0].id);
	const [date, setDate] = useState('2026-05-06');
	const [isRecurring, setIsRecurring] = useState(false);
	const [frequency, setFrequency] = useState('monthly');

	useEffect(() => {
		setCategory(envelopes[envelope].categories[0]?.id);
	}, [envelope]);

	const submit = (e) => {
		e.preventDefault();
		const num = parseFloat(amount);
		if (!merchant || !num) return;

		const tx = {
			date,
			merchant,
			account
		};

		if (mode === 'income') {
			tx.amount = Math.abs(num);
			tx.income = true;
			tx.envelope = null;
			tx.category = null;
		} else if (mode === 'transfer') {
			tx.amount = -Math.abs(num);
			tx.envelope = envelope;
			tx.category = category;
			tx.kind = 'transfer';
			tx.toAccount = toAccount;
		} else {
			tx.amount = -Math.abs(num);
			tx.envelope = envelope;
			tx.category = category;
		}

		onAdd(tx);

		if (isRecurring) {
			const dayOfMonth = parseInt(date.split('-')[2], 10);
			const rec = {
				merchant,
				amount: Math.abs(num),
				frequency,
				dayOfMonth,
				account,
				kind: mode,
				active: true,
				nextDate: date
			};
			if (mode !== 'income') {
				rec.envelope = envelope;
				rec.category = category;
			}
			if (mode === 'transfer') rec.toAccount = toAccount;
			onAddRecurring(rec);
		}
	};

	const accLabel = (id) => accounts.find((a) => a.id === id)?.label || id;

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<form
				className="modal"
				onClick={(e) => e.stopPropagation()}
				onSubmit={submit}
				style={{ position: 'relative' }}
			>
				<button type="button" className="modal-close" onClick={onClose}>
					<Icon name="x" size={16} />
				</button>
				<h2>Ajouter</h2>
				<p className="sub">Dépense, transfert entre comptes ou revenu.</p>

				<div className="modal-tabs">
					<button
						type="button"
						className={`modal-tab ${mode === 'expense' ? 'active' : ''}`}
						onClick={() => setMode('expense')}
					>
						Dépense
					</button>
					<button
						type="button"
						className={`modal-tab ${mode === 'transfer' ? 'active' : ''}`}
						onClick={() => setMode('transfer')}
					>
						Transfert
					</button>
					<button
						type="button"
						className={`modal-tab ${mode === 'income' ? 'active' : ''}`}
						onClick={() => setMode('income')}
					>
						Revenu
					</button>
				</div>

				<div className="field">
					<label>Montant</label>
					<div className="field-amount">
						<span className="currency">€</span>
						<input
							type="text"
							inputMode="decimal"
							placeholder="0.00"
							value={amount}
							onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
							autoFocus
						/>
					</div>
				</div>

				<div className="field">
					<label>{mode === 'transfer' ? 'Libellé' : 'Commerçant / Description'}</label>
					<input
						type="text"
						placeholder={
							mode === 'transfer'
								? 'Ex. Virement Livret A'
								: mode === 'income'
									? 'Ex. Salaire'
									: 'Ex. Carrefour Market'
						}
						value={merchant}
						onChange={(e) => setMerchant(e.target.value)}
					/>
				</div>

				{mode === 'transfer' && (
					<div className="transfer-row">
						<div className="field" style={{ marginBottom: 0 }}>
							<label>Depuis</label>
							<select value={account} onChange={(e) => setAccount(e.target.value)}>
								{accounts.map((a) => (
									<option key={a.id} value={a.id}>
										{a.label}
									</option>
								))}
							</select>
						</div>
						<div className="transfer-arrow-icon">
							<Icon name="chevron-right" size={16} />
						</div>
						<div className="field" style={{ marginBottom: 0 }}>
							<label>Vers</label>
							<select value={toAccount} onChange={(e) => setToAccount(e.target.value)}>
								{accounts
									.filter((a) => a.id !== account)
									.map((a) => (
										<option key={a.id} value={a.id}>
											{a.label}
										</option>
									))}
							</select>
						</div>
					</div>
				)}

				{mode !== 'income' && (
					<React.Fragment>
						<div className="field" style={{ marginTop: mode === 'transfer' ? 14 : 0 }}>
							<label>
								Enveloppe{' '}
								{mode === 'transfer' && (
									<span
										style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-subtle)' }}
									>
										— pour la classification budgétaire
									</span>
								)}
							</label>
							<div className="envelope-radio">
								{Object.values(envelopes).map((env) => (
									<button
										key={env.id}
										type="button"
										className={`envelope-radio-tile env-${env.id} ${envelope === env.id ? 'selected' : ''}`}
										onClick={() => setEnvelope(env.id)}
									>
										<span className="envelope-radio-name">
											<span
												style={{
													width: 8,
													height: 8,
													borderRadius: '50%',
													background: 'var(--env)'
												}}
											></span>
											{env.label}
										</span>
										<span className="envelope-radio-meta">{env.categories.length} catégories</span>
									</button>
								))}
							</div>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: mode === 'transfer' ? '1fr' : '1fr 1fr',
								gap: 10
							}}
						>
							<div className="field">
								<label>Catégorie</label>
								<select value={category} onChange={(e) => setCategory(e.target.value)}>
									{envelopes[envelope].categories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.label}
										</option>
									))}
								</select>
							</div>
							{mode !== 'transfer' && (
								<div className="field">
									<label>Compte</label>
									<select value={account} onChange={(e) => setAccount(e.target.value)}>
										{accounts.map((a) => (
											<option key={a.id} value={a.id}>
												{a.label}
											</option>
										))}
									</select>
								</div>
							)}
						</div>
					</React.Fragment>
				)}

				{mode === 'income' && (
					<div className="field">
						<label>Compte crédité</label>
						<select value={account} onChange={(e) => setAccount(e.target.value)}>
							{accounts.map((a) => (
								<option key={a.id} value={a.id}>
									{a.label}
								</option>
							))}
						</select>
					</div>
				)}

				<div className="field">
					<label>Date</label>
					<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
				</div>

				<div className="recurring-toggle" onClick={() => setIsRecurring((v) => !v)}>
					<div className="info">
						<div className="title">Paiement récurrent</div>
						<div className="desc">Automatise ce paiement chaque mois à la même date.</div>
					</div>
					<div className={`switch ${isRecurring ? 'on' : ''}`}></div>
				</div>

				{isRecurring && (
					<div className="field">
						<label>Fréquence</label>
						<select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
							<option value="weekly">Hebdomadaire</option>
							<option value="monthly">Mensuel</option>
							<option value="yearly">Annuel</option>
						</select>
					</div>
				)}

				<div className="modal-actions">
					<button type="button" className="btn btn-ghost" onClick={onClose}>
						Annuler
					</button>
					<button type="submit" className="btn btn-primary">
						{mode === 'transfer' ? 'Effectuer le transfert' : 'Ajouter'}
					</button>
				</div>
			</form>
		</div>
	);
}

function AccountsModal({ accounts, setAccounts, onClose }) {
	const [local, setLocal] = useState(accounts);

	const update = (id, key, value) => {
		setLocal((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
	};
	const remove = (id) => setLocal((prev) => prev.filter((a) => a.id !== id));
	const add = () =>
		setLocal((prev) => [
			...prev,
			{
				id: 'acc' + Date.now(),
				label: 'Nouveau compte',
				balance: 0,
				initial: 0,
				type: 'checking'
			}
		]);

	const save = () => {
		setAccounts(local);
		onClose();
	};

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className="modal"
				onClick={(e) => e.stopPropagation()}
				style={{ position: 'relative', width: 520 }}
			>
				<button type="button" className="modal-close" onClick={onClose}>
					<Icon name="x" size={16} />
				</button>
				<h2>Comptes</h2>
				<p className="sub">Renomme un compte ou modifie son solde initial.</p>

				<div style={{ marginBottom: 14 }}>
					{local.map((a) => (
						<div key={a.id} className="acct-edit-row">
							<input
								className="name"
								value={a.label}
								onChange={(e) => update(a.id, 'label', e.target.value)}
							/>
							<input
								className="bal"
								type="number"
								step="0.01"
								value={a.balance}
								onChange={(e) => update(a.id, 'balance', parseFloat(e.target.value) || 0)}
							/>
							<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>€</span>
							<button className="del-btn" onClick={() => remove(a.id)} title="Supprimer">
								<Icon name="trash" size={14} />
							</button>
						</div>
					))}
				</div>

				<button
					type="button"
					className="btn btn-ghost"
					onClick={add}
					style={{ width: '100%', justifyContent: 'center' }}
				>
					<Icon name="plus" size={14} /> Ajouter un compte
				</button>

				<div className="modal-actions">
					<button type="button" className="btn btn-ghost" onClick={onClose}>
						Annuler
					</button>
					<button type="button" className="btn btn-primary" onClick={save}>
						Enregistrer
					</button>
				</div>
			</div>
		</div>
	);
}

window.AddTxModal = AddTxModal;
window.AccountsModal = AccountsModal;
