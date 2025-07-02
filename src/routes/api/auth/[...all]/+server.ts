import { createAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, request }) => {
	const auth = createAuth(platform!.env.DB);
	return auth.handler(request);
};

export const POST: RequestHandler = async ({ platform, request }) => {
	const auth = createAuth(platform!.env.DB);
	return auth.handler(request);
};
