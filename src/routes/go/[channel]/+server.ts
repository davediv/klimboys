import { error, redirect } from '@sveltejs/kit';
import { resolvePublicDestination } from '$lib/server/public-business';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, platform, url }) => {
	const environment = platform?.env as unknown as Record<string, unknown> | undefined;
	const destination = resolvePublicDestination(environment, params.channel, {
		product: url.searchParams.get('product'),
		size: url.searchParams.get('size')
	});

	if (!destination) {
		error(404, 'This Klimboys destination is not currently available.');
	}

	redirect(302, destination);
};
