<script lang="ts">
	import type { AutocompleteConfig } from '$lib/types/autocomplete';
	import type { Option } from '$lib/types/option';
	import { debounce } from '$lib/utils/debounce';
	import MdArrowDropDown from 'svelte-icons/md/MdArrowDropDown.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';

	let {
		options = [],
		defaultOption,
		autocomplete,
		onChange,
		// Button styling
		buttonMinWidth = '',
		buttonHeight = '',
		buttonPadding = '',
		buttonBorderRadius = '',
		// Dropdown styling
		dropdownWidth = '',
		dropdownMinWidth = '',
		dropdownMaxWidth = '',
		dropdownPadding = '',
		dropdownOptionHeight = '3.5rem',
		dropdownBorderRadius = '',
		// Dropdown positioning
		dropdownLeft = '',
		dropdownTop = '',
		dropdownRight = '',
		dropdownBottom = '',
		// Optional class names
		buttonClassName = '',
		dropdownClassName = '',
		optionClassName = '',
		// Optional props
		enableKeyboardHighlight = true,
		autoFocusDropdown = false
	} = $props<{
		options?: Option[];
		defaultOption?: Option;
		autocomplete?: AutocompleteConfig;
		onChange: (option: Option) => void;
		buttonMinWidth?: string;
		buttonHeight?: string;
		buttonPadding?: string;
		buttonBorderRadius?: string;
		dropdownWidth?: string;
		dropdownMinWidth?: string;
		dropdownMaxWidth?: string;
		dropdownPadding?: string;
		dropdownOptionHeight?: string;
		dropdownBorderRadius?: string;
		dropdownLeft?: string;
		dropdownTop?: string;
		dropdownRight?: string;
		dropdownBottom?: string;
		buttonClassName?: string;
		dropdownClassName?: string;
		optionClassName?: string;
		enableKeyboardHighlight?: boolean;
		autoFocusDropdown?: boolean;
	}>();

	let selectedOption = $state<Option>(
		defaultOption ?? options[0] ?? { value: '', label: 'Select...' }
	);
	let isOpen = $state(false);
	let buttonEl = $state<HTMLButtonElement | null>(null);
	let searchValue = $state('');
	let suggestions = $state<Option[]>([]);
	let isFetching = $state(false);

	const debouncedFetch = autocomplete?.enabled
		? debounce(fetchSuggestions, autocomplete.debounceMs || 300)
		: null;

	function filterPredefinedOptions(query: string): Option[] {
		if (!query) return options;
		const lowerQuery = query.toLowerCase();
		return options.filter(
			(option: Option) =>
				option.label.toLowerCase().includes(lowerQuery) ||
				option.value.toLowerCase().includes(lowerQuery)
		);
	}

	async function fetchSuggestions(query: string) {
		if (!autocomplete?.enabled) {
			suggestions = options;
			return;
		}

		if (query.length < (autocomplete.minChars || 0) && autocomplete.minChars !== 0) {
			suggestions = filterPredefinedOptions(query);
			return;
		}

		isFetching = true;
		try {
			const results = await autocomplete.fetchSuggestions(query);
			const apiSuggestions = results.map((result: any) => autocomplete.processResult(result));

			// Combine and deduplicate API results with filtered predefined options
			const filteredPredefined = filterPredefinedOptions(query);
			const combined = [...filteredPredefined, ...apiSuggestions];

			// Remove duplicates based on value
			suggestions = Array.from(new Map(combined.map((item) => [item.value, item])).values());
		} catch (error) {
			console.error('Error fetching suggestions:', error);
			suggestions = filterPredefinedOptions(query);
		} finally {
			isFetching = false;
		}
	}

	function selectOption(option: Option) {
		selectedOption = option;
		onChange(option);
		handleClose();
	}

	function handleClose() {
		isOpen = false;
		searchValue = '';
		suggestions = options;
	}

	function handleSearchInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		searchValue = value;

		if (debouncedFetch) {
			debouncedFetch(value);
		} else {
			suggestions = filterPredefinedOptions(value);
		}
	}

	// Add effect to fetch initial suggestions when dropdown opens
	$effect(() => {
		if (isOpen && autocomplete?.enabled && autocomplete.minChars === 0) {
			fetchSuggestions('');
		} else if (isOpen) {
			suggestions = options;
		}
	});

	$effect(() => {
		selectedOption = defaultOption ?? options[0] ?? { value: '', label: 'Select...' };
	});
</script>

<div class="relative inline-block">
	<button
		bind:this={buttonEl}
		onclick={() => (isOpen = !isOpen)}
		onkeydown={(e) => {
			if (!isOpen && ['Enter', 'ArrowDown'].includes(e.key)) {
				e.preventDefault();
				isOpen = true;
			}
		}}
		class="relative flex items-center justify-between border border-neutral-200 bg-white text-gray-900 outline-none {buttonClassName}"
		style="
			min-width: {buttonMinWidth};
			height: {buttonHeight};
			padding-left: {buttonPadding};
			padding-right: {buttonPadding};
			border-radius: {buttonBorderRadius};
		"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="truncate whitespace-nowrap">{selectedOption.label}</span>
		<span
			class="ml-2 flex h-6 w-6 items-center justify-center transition-transform duration-200"
			style:transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
		>
			<MdArrowDropDown />
		</span>
	</button>

	<Dropdown
		{isOpen}
		{enableKeyboardHighlight}
		autoFocus={autoFocusDropdown}
		{autocomplete}
		anchor={buttonEl}
		width={dropdownWidth}
		minWidth={dropdownMinWidth}
		maxWidth={dropdownMaxWidth}
		padding={dropdownPadding}
		optionHeight={dropdownOptionHeight}
		borderRadius={dropdownBorderRadius}
		left={dropdownLeft}
		top={dropdownTop}
		right={dropdownRight}
		bottom={dropdownBottom}
		className={dropdownClassName}
		{optionClassName}
		options={suggestions}
		{selectedOption}
		onSelect={selectOption}
		onClose={handleClose}
		{searchValue}
		onSearchInput={handleSearchInput}
		{isFetching}
	/>
</div>
