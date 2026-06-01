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

// Subset of a recurring needed to prefill the modal in edit mode.
export type EditableRec = {
	id: string;
	kind: AddTxMode;
	amountCents: number; // stored positive
	merchant: string;
	accountId: string;
	toAccountId: string | null;
	envelopeId: string | null;
	categoryId: string | null;
	incomeCategory: string | null;
	frequency: 'weekly' | 'monthly' | 'yearly';
	nextDate: string;
};

type AddTxState = {
	open: boolean;
	defaultMode: AddTxMode;
	editTx: EditableTx | null;
	editRec: EditableRec | null;
	recurringDefault: boolean;
};

const CLOSED: AddTxState = {
	open: false,
	defaultMode: 'expense',
	editTx: null,
	editRec: null,
	recurringDefault: false
};

class ModalState {
	addTx = $state<AddTxState>({ ...CLOSED });
	accounts = $state<{ open: boolean }>({ open: false });
	ratios = $state<{ open: boolean }>({ open: false });

	openAddTx(defaultMode: AddTxMode = 'expense') {
		this.addTx = { ...CLOSED, open: true, defaultMode };
	}

	// Opens the same modal but pre-armed as a recurring payment (frequency
	// selector visible), used by the "Nouveau récurrent" button.
	openAddRecurring(defaultMode: AddTxMode = 'expense') {
		this.addTx = { ...CLOSED, open: true, defaultMode, recurringDefault: true };
	}

	openEditTx(tx: EditableTx) {
		this.addTx = { ...CLOSED, open: true, defaultMode: tx.kind, editTx: tx };
	}

	openEditRec(rec: EditableRec) {
		this.addTx = { ...CLOSED, open: true, defaultMode: rec.kind, editRec: rec };
	}

	closeAddTx() {
		this.addTx = { ...CLOSED };
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
