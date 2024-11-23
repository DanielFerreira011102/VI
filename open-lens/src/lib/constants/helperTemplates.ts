// helperTemplates.ts
export const helpTexts = {
	overTime: {
		title: 'Metrics Over Time',
		description: 'Track and compare academic metrics across selected institutions over time.',
		metrics: [
			{ name: 'Works', description: 'Total published research works' },
			{ name: 'Citations', description: 'Total received citations' },
			{ name: 'Average Citations', description: 'Citations per work' }
		],
		features: [
			'Left bar shows overall averages',
			'Line chart displays detailed yearly trends',
			'Dynamic scale adapts to data range',
			'Hover for detailed statistics'
		]
	},
	apc: {
		title: 'Article Processing Charges',
		description: 'Compare publication costs and actual expenditure across institutions.',
		metrics: [
			{ name: 'List Price', description: 'Published article processing charge' },
			{ name: 'Paid Amount', description: 'Actual amount paid after discounts' }
		],
		features: [
			'Side-by-side comparison of list vs paid prices',
			'Institution-level cost analysis',
			'Total expenditure overview',
			'Transparent cost breakdown'
		]
	},
	stats: {
		title: 'Summary Statistics',
		description: 'Comprehensive comparison of key academic performance indicators.',
		metrics: [
			{ name: 'Works Count', description: 'Total number of published works' },
			{ name: 'Citations', description: 'Total citations received' },
			{ name: 'Impact Factor', description: '2-year mean citation rate' },
			{ name: 'H-Index', description: 'Papers with h citations each' },
			{ name: 'i10-Index', description: 'Papers with 10+ citations' }
		],
		features: [
			'Radar chart visualization',
			'Normalized comparison scales',
			'Multiple metric comparison',
			'Interactive data points'
		]
	},
	topics: {
		title: 'Topics Distribution',
		description:
			'Visual representation of top 25 research topics organized by domain, field, and subfield.',
		metrics: [
			{ name: 'Publication Volume', description: 'Works count at each level' },
			{ name: 'Hierarchy Level', description: 'Domain, field, subfield, or topic' }
		],
		features: [
			'Complete research taxonomy tree',
			'Size-based volume indicators',
			'Color-coded institution groups',
			'Interactive level exploration'
		]
	}
};

export const helpTemplates = {
	default: (content: any) => `
	<div class="relative bg-white text-gray-900">
		<div class="pb-3 font-semibold text-lg border-b border-gray-100">
			${content.title}
		</div>
		
		<div class="py-2">
			<p class="text-sm text-gray-600">
				${content.description}
			</p>
		</div>
		
		${
			content.metrics
				? `
			<div class="py-2">
				<div class="font-medium text-sm mb-1">Metrics:</div>
				<div class="grid grid-cols-[150px_1fr] gap-y-1">
					${content.metrics
						.map(
							(metric: any) => `
						<div class="font-medium text-sm">${metric.name}:</div>
						<div class="text-sm text-gray-600">${metric.description}</div>
					`
						)
						.join('')}
				</div>
			</div>
		`
				: ''
		}
		
		<div class="pt-2 border-t border-gray-100">
			<div class="font-medium text-sm mb-1">Features:</div>
			<div class="space-y-1">
				${content.features
					.map(
						(feature: string) => `
					<div class="flex items-center text-sm text-gray-600">
						<span class="mr-2">•</span>
						${feature}
					</div>
				`
					)
					.join('')}
			</div>
		</div>
	</div>
`,

	compact: (content: any) => `
        <div class="relative bg-white text-gray-900">
            <div class="pb-2 font-semibold">
                ${content.title}
            </div>
            <p class="text-sm text-gray-600">
                ${content.description}
            </p>
        </div>
    `,

	minimal: (content: string) => `
        <div class="text-sm text-gray-600">
            ${content}
        </div>
    `
};
