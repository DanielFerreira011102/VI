<script lang="ts">
	import type { Topic } from '$lib/types/topic';
	import { topicStore } from '$lib/stores/topicStore';
	import TermIndicator from '$lib/components/explore/TermIndicator.svelte';
	import Select from '$lib/components/Select.svelte';

	let selectedTopic = $state<Topic>({ id: 'allTopics', display_name: 'All Topics' });

	topicStore.subscribe((value) => {
		selectedTopic = value;
	});
</script>

<div class="grid space-y-4 bg-blue-500 bg-opacity-10 py-6 lg:space-y-3">
	<div class="container mx-auto flex items-center justify-between px-2">
		<TermIndicator
			autocomplete={{
				enabled: true,
				fetchSuggestions: async (query) => {
					const response = await fetch(
						`https://api.openalex.org/autocomplete/institutions?q=${encodeURIComponent(query)}`
					);
					const data = await response.json();
					return data.results || [];
				},
				debounceMs: 300,
				minChars: 2,
				processResult: (result) => ({
					value: result.display_name,
					label: result.display_name
				})
			}}
		/>
	</div>
	<div class="container mx-auto flex items-center justify-between px-2">
		<div class="w-full rounded-2xl bg-white p-4">
			<Select
				options={[{ value: 'allTopics', label: 'All Topics' }]}
				defaultOption={{ value: selectedTopic.id, label: selectedTopic.display_name }}
				autocomplete={{
					enabled: true,
					fetchSuggestions: async (query) => {
						const response = await fetch(
							`https://api.openalex.org/autocomplete/topics?q=${encodeURIComponent(query)}`
						);
						const data = await response.json();
						return data.results || [];
					},
					debounceMs: 300,
					minChars: 0,
					processResult: (result) => ({
						value: result.id.replace('https://openalex.org/', ''),
						label: result.display_name
					})
				}}
				onChange={(option) =>
					topicStore.updateTopic({ id: option.value, display_name: option.label })}
				autoFocusDropdown={true}
				buttonClassName="w-96 h-12 p-4 rounded-lg leading-6"
				dropdownClassName="max-h-72"
				dropdownWidth="32rem"
				dropdownPadding="1rem"
				dropdownOptionHeight="3.5rem"
				dropdownTop="-0.5rem"
			/>
		</div>
	</div>
</div>
