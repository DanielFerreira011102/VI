import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const queryParam = url.searchParams.get('q');

	if (!queryParam) {
		return {}; // Return empty object without nesting
	}

	const searchTerms = queryParam.split(',').filter((term) => term.trim());

	const fetchPromises = searchTerms.map((term) => {
		const apiUrl = `https://api.openalex.org/institutions?filter=display_name.search:${encodeURIComponent(term.trim())}`;
		return fetch(apiUrl)
			.then((res) => {
				if (!res.ok) {
					throw new Error(`API request failed for term: ${term}`);
				}
				return res.json().then((data) => data.results[0]);
			})
			.catch((error) => {
				console.error(`Error fetching data for ${term}:`, error);
				return null;
			});
	});

	try {
		const results = await Promise.all(fetchPromises);

		// Return the object directly without nesting under 'data'
		return Object.fromEntries(searchTerms.map((term, index) => [term.trim(), results[index]]));
	} catch (error) {
		console.error('Error processing requests:', error);
		return {
			error: 'Failed to fetch data'
		};
	}
};
