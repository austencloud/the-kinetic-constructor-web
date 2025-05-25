import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	return {
		platform: params.platform,
		code: url.searchParams.get('code')
	};
};
