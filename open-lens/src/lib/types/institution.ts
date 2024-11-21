export interface Institution {
	id: string;
	display_name: string;
	relevance_score: number;
	works_count: number;
	cited_by_count: number;
	summary_stats: {
		'2yr_mean_citedness': number;
		h_index: number;
		i10_index: number;
	};
	counts_by_year: {
		year: number;
		works_count: number;
		cited_by_count: number;
	}[];
	topics?: {
		count: number;
		display_name: string;
		id: string;
	};
	geo?: {
		city: string,
		geonames_city_id: string,
		region: string | null; 
		country_code: string;
		country: string;
		latitude: number;
		longitude: number;
	},
	works?: {
		apc_list_sum_usd: number;
		apc_paid_sum_usd: number;
		cited_by_count_sum: number;
		count: number;
	};
}

export interface InstitutionsResponse {
	meta: {
		count: number;
		page: number;
		per_page: number;
	};
	results: Institution[];
}

export type SortField =
	| 'works_count'
	| 'cited_by_count'
	| 'summary_stats.h_index'
	| 'summary_stats.i10_index'
	| 'summary_stats.2yr_mean_citedness';

export type SortDirection = 'asc' | 'desc';
