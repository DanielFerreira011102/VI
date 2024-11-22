<script lang="ts">
	import type { AutocompleteConfig } from '$lib/types/autocomplete';
	import type { Option } from '$lib/types/option';
	import { debounce } from '$lib/utils/debounce';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import MdArrowDropDown from 'svelte-icons/md/MdArrowDropDown.svelte';

	let {
		options = [],
		defaultOption,
		defaultSelected = [],
		isMulti = false,
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
		wrapperClassName = '',
		buttonClassName = '',
		dropdownClassName = '',
		optionClassName = '',
		// Optional props
		enableKeyboardHighlight = true,
		autoFocusDropdown = false,
		placeholder = 'Select...'
	} = $props<{
		options?: Option[];
		defaultOption?: Option;
		defaultSelected?: Option[];
		isMulti?: boolean;
		autocomplete?: AutocompleteConfig;
		onChange: (value: Option | Option[]) => void;
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
		wrapperClassName?: string;
		buttonClassName?: string;
		dropdownClassName?: string;
		optionClassName?: string;
		enableKeyboardHighlight?: boolean;
		autoFocusDropdown?: boolean;
		placeholder?: string;
	}>();

	let selectedOption = $state<Option>(
		defaultOption ?? options[0] ?? { value: '', label: placeholder }
	);
	let selectedOptions = $state<Option[]>(defaultSelected ?? []);
	let isOpen = $state(false);
	let buttonEl = $state<HTMLButtonElement | null>(null);
	let searchValue = $state('');
	let suggestions = $state<Option[]>([]);
	let isFetching = $state(false);

	const debouncedFetch = autocomplete?.enabled
		? debounce(fetchSuggestions, autocomplete.debounceMs || 300)
		: null;

	function buildStyleString() {
		const styles = [];

		if (buttonMinWidth) styles.push(`min-width: ${buttonMinWidth}`);
		if (buttonHeight) styles.push(`height: ${buttonHeight}`);
		if (buttonPadding) {
			styles.push(`padding-left: ${buttonPadding}`);
			styles.push(`padding-right: ${buttonPadding}`);
		}
		if (buttonBorderRadius) styles.push(`border-radius: ${buttonBorderRadius}`);

		return styles.join(';');
	}

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
			const filteredPredefined = filterPredefinedOptions(query);
			const combined = [...filteredPredefined, ...apiSuggestions];
			suggestions = Array.from(new Map(combined.map((item) => [item.value, item])).values());
		} catch (error) {
			console.error('Error fetching suggestions:', error);
			suggestions = filterPredefinedOptions(query);
		} finally {
			isFetching = false;
		}
	}

	function handleSelect(option: Option) {
		if (isMulti) {
			const isSelected = selectedOptions.some((selected) => selected.value === option.value);
			if (isSelected) {
				selectedOptions = selectedOptions.filter((selected) => selected.value !== option.value);
			} else {
				selectedOptions = [...selectedOptions, option];
			}
			onChange(selectedOptions);
		} else {
			selectedOption = option;
			onChange(option);
			handleClose();
		}
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

	function getDisplayText() {
		if (isMulti) {
			if (selectedOptions.length === 0) return placeholder;
			return selectedOptions.map((option) => option.label).join(', ');
		}
		return selectedOption.label;
	}

	// Add effect to fetch initial suggestions when dropdown opens
	$effect(() => {
		if (isOpen && autocomplete?.enabled && autocomplete.minChars === 0) {
			fetchSuggestions('');
		} else if (isOpen) {
			suggestions = options;
		}
	});

	// Update selected option/options when default values change
	$effect(() => {
		if (isMulti) {
			selectedOptions = defaultSelected ?? [];
		} else {
			selectedOption = defaultOption ?? options[0] ?? { value: '', label: placeholder };
		}
	});
</script>

<div class="relative inline-block {wrapperClassName}">
	<button
		bind:this={buttonEl}
		onclick={() => (isOpen = !isOpen)}
		onkeydown={(e) => {
			if (!isOpen && ['Enter', 'ArrowDown'].includes(e.key)) {
				e.preventDefault();
				isOpen = true;
			}
		}}
		class="relative flex w-full items-center justify-between border border-neutral-200 bg-white text-gray-900 outline-none {buttonClassName}"
		style={buildStyleString()}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="truncate whitespace-nowrap">{getDisplayText()}</span>
		<span
			class="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center transition-transform duration-200"
			style:transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
		>
			<MdArrowDropDown />
		</span>
	</button>

	<Dropdown
		{isOpen}
		{isMulti}
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
		selectedOption={isMulti ? null : selectedOption}
		selectedOptions={isMulti ? selectedOptions : []}
		onSelect={handleSelect}
		onClose={handleClose}
		{searchValue}
		onSearchInput={handleSearchInput}
		{isFetching}
	/>
</div>
