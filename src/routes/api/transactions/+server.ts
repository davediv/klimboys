import { json } from '@sveltejs/kit';
import { hasCapability } from '$lib/permissions';
import {
	createTransaction,
	parseTransactionRequest,
	TransactionError
} from '$lib/server/transactions';
import type { CreateTransactionResponse } from '$lib/transaction';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized.' } satisfies CreateTransactionResponse, {
			status: 401
		});
	}

	if (!locals.user.emailVerified || !hasCapability(locals.user.role, 'sale:create')) {
		return json(
			{
				success: false,
				error: 'Permission to create sales is required.'
			} satisfies CreateTransactionResponse,
			{ status: 403 }
		);
	}

	try {
		const input = parseTransactionRequest(await request.json());
		const { receipt } = await createTransaction(input, locals.user.id);
		return json({ success: true, data: receipt } satisfies CreateTransactionResponse, {
			status: receipt.alreadyProcessed ? 200 : 201
		});
	} catch (error) {
		if (error instanceof TransactionError) {
			return json({ success: false, error: error.message } satisfies CreateTransactionResponse, {
				status: error.status
			});
		}

		if (error instanceof SyntaxError) {
			return json(
				{ success: false, error: 'Invalid JSON request.' } satisfies CreateTransactionResponse,
				{ status: 400 }
			);
		}

		console.error('Failed to process transaction:', error);
		return json(
			{
				success: false,
				error: 'The transaction could not be processed.'
			} satisfies CreateTransactionResponse,
			{ status: 500 }
		);
	}
};
