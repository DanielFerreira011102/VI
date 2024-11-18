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
	topic_data?: any;
}
