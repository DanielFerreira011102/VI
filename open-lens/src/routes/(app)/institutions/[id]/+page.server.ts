import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	if (!params.id) return null;

	const institutionData = {
		info: {},
		yearlyWorkOutput: {},
		topicsPerWorkType: {},
		openAccessDivision: {},
		mostDiscussedTopics: {},
		mostRecentWorks: {}
	};

	try {
		// Parallel API calls using Promise.all
		const [infoResponse, openAccessResponse, mostRecentWorksResponse] = await Promise.all([
			fetch(`https://api.openalex.org/institutions/${params.id}`),
			fetch(
				`https://api.openalex.org/works?group_by=open_access.is_oa&per_page=200&filter=authorships.institutions.lineage:${params.id}`
			),
			fetch(
				`https://api.openalex.org/works?page=1&filter=authorships.institutions.lineage:${params.id}&sort=publication_year:desc`
			)
		]);

		// Parallel JSON parsing
		const [info, openAccess, mostRecentWorks] = await Promise.all([
			infoResponse.ok
				? infoResponse.json()
				: Promise.reject(`Info API failed: ${infoResponse.status}`),
			openAccessResponse.ok
				? openAccessResponse.json()
				: Promise.reject(`OpenAccess API failed: ${openAccessResponse.status}`),
			mostRecentWorksResponse.ok
				? mostRecentWorksResponse.json()
				: Promise.reject(`Recent works API failed: ${mostRecentWorksResponse.status}`)
		]);

		// Assign results and process yearlyWorkOutput
		institutionData.info = info;
		institutionData.yearlyWorkOutput = info.counts_by_year.sort((a, b) => a.year - b.year);
		institutionData.mostDiscussedTopics = info.topics;
		institutionData.openAccessDivision = openAccess;
		institutionData.mostRecentWorks = mostRecentWorks;

		return institutionData;
	} catch (error) {
		console.error(`Error fetching data for institution ${params.id}:`, error);
		throw error;
	}
};
