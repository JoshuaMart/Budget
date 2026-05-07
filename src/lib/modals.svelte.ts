// Centralised modal state. Modals are rendered once in +layout.svelte and
// any page (or sidebar button) can open them via these helpers.

type AddTxMode = 'expense' | 'transfer' | 'income';

class ModalState {
	addTx = $state<{ open: boolean; defaultMode: AddTxMode }>({
		open: false,
		defaultMode: 'expense'
	});
	accounts = $state<{ open: boolean }>({ open: false });
	ratios = $state<{ open: boolean }>({ open: false });

	openAddTx(defaultMode: AddTxMode = 'expense') {
		this.addTx = { open: true, defaultMode };
	}

	closeAddTx() {
		this.addTx = { open: false, defaultMode: 'expense' };
	}

	openAccounts() {
		this.accounts = { open: true };
	}

	closeAccounts() {
		this.accounts = { open: false };
	}

	openRatios() {
		this.ratios = { open: true };
	}

	closeRatios() {
		this.ratios = { open: false };
	}
}

export const modals = new ModalState();
