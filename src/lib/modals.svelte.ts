// Centralised modal state. Modals are rendered once in +layout.svelte and
// any page (or sidebar button) can open them via these helpers.

type AddTxMode = 'expense' | 'transfer' | 'income';

// Subset of a transaction needed to prefill the modal in edit mode.
export type EditableTx = {
	id: string;
	kind: AddTxMode;
	amountCents: number; // signed as stored in the DB
	merchant: string;
	date: string;
	accountId: string;
	toAccountId: string | null;
	envelopeId: string | null;
	categoryId: string | null;
	incomeCategory: string | null;
};

class ModalState {
	addTx = $state<{ open: boolean; defaultMode: AddTxMode; editTx: EditableTx | null }>({
		open: false,
		defaultMode: 'expense',
		editTx: null
	});
	accounts = $state<{ open: boolean }>({ open: false });
	ratios = $state<{ open: boolean }>({ open: false });

	openAddTx(defaultMode: AddTxMode = 'expense') {
		this.addTx = { open: true, defaultMode, editTx: null };
	}

	openEditTx(tx: EditableTx) {
		this.addTx = { open: true, defaultMode: tx.kind, editTx: tx };
	}

	closeAddTx() {
		this.addTx = { open: false, defaultMode: 'expense', editTx: null };
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
