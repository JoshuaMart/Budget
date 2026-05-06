// Tweaks panel for Budget app

function BudgetTweaks({ tweaks, setTweak }) {
  const total = tweaks.ratioNec + tweaks.ratioWant + tweaks.ratioInv;
  const off = total !== 100;

  const setRatio = (key, value) => {
    setTweak(key, value);
  };

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Méthode 50/30/20">
        <TweakSlider
          label="Nécessités"
          value={tweaks.ratioNec}
          min={20} max={80} step={5}
          onChange={(v) => setRatio('ratioNec', v)}
          format={(v) => v + '%'}
        />
        <TweakSlider
          label="Envies"
          value={tweaks.ratioWant}
          min={5} max={60} step={5}
          onChange={(v) => setRatio('ratioWant', v)}
          format={(v) => v + '%'}
        />
        <TweakSlider
          label="Investissements"
          value={tweaks.ratioInv}
          min={5} max={60} step={5}
          onChange={(v) => setRatio('ratioInv', v)}
          format={(v) => v + '%'}
        />
        <div style={{ fontSize: 11, color: off ? 'oklch(0.55 0.18 30)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
          Total: {total}%{off ? ' — doit être 100%' : ' ✓'}
        </div>
      </TweakSection>

      <TweakSection title="Revenu mensuel">
        <TweakNumber
          label="Revenu (€)"
          value={tweaks.monthlyIncome}
          step={100}
          onChange={(v) => setTweak('monthlyIncome', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

window.BudgetTweaks = BudgetTweaks;
