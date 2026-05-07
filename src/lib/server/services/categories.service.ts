import { and, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { category, recurring, transaction } from '../db/schema';
import type { CategoryInput } from '../schemas';

export function listCategories(userId: string) {
	return db.select().from(category).where(eq(category.userId, userId)).all();
}

export function createCategory(userId: string, input: CategoryInput) {
	const [created] = db
		.insert(category)
		.values({
			userId,
			envelopeId: input.envelopeId,
			label: input.label,
			icon: input.icon ?? null,
			isVirtual: false
		})
		.returning()
		.all();
	if (!created) throw new Error('failed to create category');
	return created;
}

export function updateCategory(
	userId: string,
	categoryId: string,
	input: Pick<CategoryInput, 'label' | 'icon'>
) {
	db.update(category)
		.set({ label: input.label, icon: input.icon ?? null })
		.where(and(eq(category.userId, userId), eq(category.id, categoryId)))
		.run();
}

/**
 * Delete a real category. Transactions and recurrings that pointed at it are
 * reassigned to the virtual "Non catégorisé" category of the same envelope.
 * The virtual category itself can never be deleted.
 */
export function deleteCategory(userId: string, categoryId: string) {
	db.transaction((tx) => {
		const cat = tx
			.select()
			.from(category)
			.where(and(eq(category.userId, userId), eq(category.id, categoryId)))
			.get();
		if (!cat) throw new Error('Catégorie introuvable');
		if (cat.isVirtual)
			throw new Error('La catégorie « Non catégorisé » ne peut pas être supprimée');

		const virtual = tx
			.select()
			.from(category)
			.where(
				and(
					eq(category.userId, userId),
					eq(category.envelopeId, cat.envelopeId),
					eq(category.isVirtual, true)
				)
			)
			.get();
		if (!virtual) throw new Error('Catégorie virtuelle manquante (provisioning incohérent)');

		tx.update(transaction)
			.set({ categoryId: virtual.id })
			.where(eq(transaction.categoryId, categoryId))
			.run();

		tx.update(recurring)
			.set({ categoryId: virtual.id })
			.where(eq(recurring.categoryId, categoryId))
			.run();

		tx.delete(category).where(eq(category.id, categoryId)).run();
	});
}
