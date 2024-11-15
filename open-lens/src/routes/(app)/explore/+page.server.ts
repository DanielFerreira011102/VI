// routes/explore/+page.server.ts
import type { PageServerLoad } from './$types';
import { ITEM_GROUPS } from '$lib/types/term';

export const load: PageServerLoad = async ({ url }) => {
    const queryParam = url.searchParams.get('q');
    if (!queryParam) {
        return {};
    }

    const encodedTerms = queryParam.split(',').filter(Boolean);
    const fetchPromises = encodedTerms.map(async (term) => {
        const decoded = decodeURIComponent(term);
        let apiUrl: string;

		console.log('decoded', decoded);

        if (decoded.startsWith('/i/')) {
            // Institution ID lookup
            const institutionId = decoded.slice(3); // Remove '/i/' prefix
            apiUrl = `https://api.openalex.org/institutions/${institutionId}`;
			console.log('apiUrl', apiUrl);
        } else {
            // Search term lookup
            apiUrl = `https://api.openalex.org/institutions?filter=display_name.search:${encodeURIComponent(decoded)}`;
        }

        try {
            const res = await fetch(apiUrl);
            if (!res.ok) {
                throw new Error(`API request failed for term: ${decoded}`);
            }
            const data = await res.json();
            
            // Return first result for search, or the full response for direct ID lookup
            return decoded.startsWith('/i/') ? data : data.results[0];
        } catch (error) {
            console.error(`Error fetching data for ${decoded}:`, error);
            return null;
        }
    });

    try {
        const results = await Promise.all(fetchPromises);
        return Object.fromEntries(encodedTerms.map((term, index) => [term.trim(), results[index]]));
    } catch (error) {
        console.error('Error processing requests:', error);
        return {
            error: 'Failed to fetch data'
        };
    }
};