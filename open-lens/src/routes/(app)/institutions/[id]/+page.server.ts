import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	if (!params.id) {
		return null;
	}

	const institutionData = {
		info: {}, // Done
		yearlyWorkOutput: {}, // Done
		topicsPerWorkType: {},
		openAccessDivision: {}, // Done
		mostDiscussedTopics: {}, // Done
		mostRecentWorks: {}
	};

	try {
		// Info
		let apiUrl = `https://api.openalex.org/institutions/${params.id}`;
		const infoResponse = await fetch(apiUrl);
		if (!infoResponse.ok) {
			throw new Error(`API request failed for ${params.id}: ${infoResponse.status}`);
		}
		institutionData.info = await infoResponse.json();
		institutionData.yearlyWorkOutput = institutionData.info.counts_by_year.sort(
			(a, b) => a.year - b.year
		);
		institutionData.mostDiscussedTopics = institutionData.info.topics;

		// Open access division
		apiUrl = `https://api.openalex.org/works?group_by=open_access.is_oa&per_page=200&filter=authorships.institutions.lineage:${params.id}`;
		const openAccessResponse = await fetch(apiUrl);
		if (!openAccessResponse.ok) {
			throw new Error(`API request failed for ${params.id}: ${openAccessResponse.status}`);
		}
		institutionData.openAccessDivision = await openAccessResponse.json();

		// Most recent works
		apiUrl = `https://api.openalex.org/works?page=1&filter=authorships.institutions.lineage:${params.id}&sort=publication_year:desc`;
		const mostRecentWorksResponse = await fetch(apiUrl);
		if (!mostRecentWorksResponse.ok) {
			throw new Error(`API request failed for ${params.id}: ${mostRecentWorksResponse.status}`);
		}
		institutionData.mostRecentWorks = await mostRecentWorksResponse.json();

		return institutionData;
	} catch (error) {
		console.error(`Error fetching data for institution ${params.id}:`, error);
		// You might want to throw the error here to trigger SvelteKit's error handling
		throw error;
	}
};
