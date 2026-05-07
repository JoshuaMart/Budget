// Login page

function Login({ onLogin }) {
  const [email, setEmail] = useState('camille@example.com');
  const [password, setPassword] = useState('••••••••');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [remember, setRemember] = useState(true);

  const submit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-mark">B</div>
          <span className="brand-name">Budget</span>
        </div>

        <div className="login-card">
          <h1 className="login-h1">{mode === 'signin' ? 'Bon retour' : 'Créer un compte'}</h1>
          <p className="login-sub">
            {mode === 'signin'
              ? 'Connecte-toi pour suivre tes dépenses selon la méthode 50/30/20.'
              : 'Quelques secondes pour démarrer.'}
          </p>

          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="toi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label>
                Mot de passe
                {mode === 'signin' && (
                  <button type="button" className="login-link" style={{ float: 'right', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
                    Mot de passe oublié ?
                  </button>
                )}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'signin' && (
              <label className="login-remember">
                <span className={`login-check ${remember ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); setRemember(v => !v); }}>
                  {remember && <Icon name="x" size={10} />}
                </span>
                <span>Rester connecté sur cet appareil</span>
              </label>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, marginTop: 6 }}>
              {mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          <div className="login-divider"><span>ou</span></div>

          <button className="btn btn-ghost login-sso" onClick={onLogin}>
            <span style={{ fontWeight: 600, fontFamily: 'serif' }}>G</span> Continuer avec Google
          </button>
          <button className="btn btn-ghost login-sso" onClick={onLogin}>
            <span></span> Continuer avec Apple
          </button>

          <p className="login-switch">
            {mode === 'signin' ? "Pas encore de compte ?" : "Déjà inscrit ?"}{' '}
            <button type="button" className="login-link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>

        <div className="login-foot">
          © 2026 Budget · <button className="login-link">Confidentialité</button> · <button className="login-link">Conditions</button>
        </div>
      </div>

      <div className="login-right">
        <div className="login-hero">
          <div className="login-hero-tag">Méthode 50 / 30 / 20</div>
          <div className="login-hero-title">
            Trois enveloppes.<br />
            Une vie financière<br />
            sereine.
          </div>

          <div className="login-hero-cards">
            <div className="login-hero-card env-necessities">
              <div className="login-hero-card-pct">50<span>%</span></div>
              <div className="login-hero-card-label">Nécessités</div>
              <div className="login-hero-card-bar"><span style={{ width: '64%' }}></span></div>
              <div className="login-hero-card-meta">€1 162 / €1 600</div>
            </div>
            <div className="login-hero-card env-wants">
              <div className="login-hero-card-pct">30<span>%</span></div>
              <div className="login-hero-card-label">Envies</div>
              <div className="login-hero-card-bar"><span style={{ width: '23%' }}></span></div>
              <div className="login-hero-card-meta">€220 / €960</div>
            </div>
            <div className="login-hero-card env-investments">
              <div className="login-hero-card-pct">20<span>%</span></div>
              <div className="login-hero-card-label">Investissements</div>
              <div className="login-hero-card-bar"><span style={{ width: '100%' }}></span></div>
              <div className="login-hero-card-meta">€650 / €640</div>
            </div>
          </div>

          <div className="login-hero-quote">
            « Mon loyer, mes courses, mon livret A — tout est rangé tout seul. »
            <div className="login-hero-quote-author">Camille, utilisatrice depuis 8 mois</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Login = Login;
