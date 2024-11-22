<script lang="ts">
	import { ripple } from '$lib/actions/ripple';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { scale } from 'svelte/transition';
	import type { Option } from '$lib/types/option';
	import type { AutocompleteConfig } from '$lib/types/autocomplete';
	import MdClose from 'svelte-icons/md/MdClose.svelte';
	import MdCheckBox from 'svelte-icons/md/MdCheckBox.svelte';
	import MdCheckBoxOutlineBlank from 'svelte-icons/md/MdCheckBoxOutlineBlank.svelte';

	let {
		isOpen = false,
		anchor,
		minWidth = '',
		width = '',
		maxWidth = '',
		padding = '',
		optionHeight = '3.5rem',
		borderRadius = '',
		left = '',
		top = '',
		right = '',
		bottom = '',
		className = '',
		optionClassName = '',
		options = [],
		selectedOption = null,
		selectedOptions = [],
		isMulti = false,
		onSelect,
		onClose,
		enableKeyboardHighlight = true,
		autoFocus = false,
		autocomplete,
		searchValue = '',
		onSearchInput,
		isFetching = false
	} = $props<{
		isOpen: boolean;
		anchor: HTMLElement;
		minWidth?: string;
		width?: string;
		maxWidth?: string;
		padding?: string;
		optionHeight?: string;
		borderRadius?: string;
		left?: string;
		top?: string;
		right?: string;
		bottom?: string;
		className?: string;
		optionClassName?: string;
		options: Option[];
		selectedOption?: Option | null;
		selectedOptions?: Option[];
		isMulti?: boolean;
		onSelect: (option: Option) => void;
		onClose: () => void;
		enableKeyboardHighlight?: boolean;
		autoFocus?: boolean;
		autocomplete?: AutocompleteConfig;
		searchValue?: string;
		onSearchInput?: (event: Event) => void;
		isFetching?: boolean;
	}>();

	let highlightedIndex = $state(-1);
	let dropdownEl = $state<HTMLDivElement | null>(null);
	let optionsContainer = $state<HTMLDivElement | null>(null);
	let optionElements = $state<HTMLButtonElement[]>([]);
	let inputElement = $state<HTMLInputElement | null>(null);

	function buildDropdownStyle() {
		const styles = [];

		if (minWidth) styles.push(`min-width: ${minWidth}`);
		if (width) styles.push(`width: ${width}`);
		if (maxWidth) styles.push(`max-width: ${maxWidth}`);
		if (borderRadius) styles.push(`border-radius: ${borderRadius}`);
		if (left) styles.push(`left: ${left}`);
		if (top) styles.push(`top: ${top}`);
		if (right) styles.push(`right: ${right}`);
		if (bottom) styles.push(`bottom: ${bottom}`);

		return styles.join(';');
	}

	function buildOptionStyle() {
		const styles = [];

		if (optionHeight) styles.push(`height: ${optionHeight}`);
		if (padding) {
			styles.push(`padding-left: ${padding}`);
			styles.push(`padding-right: ${padding}`);
		}

		return styles.join(';');
	}

	function isOptionSelected(option: Option): boolean {
		if (isMulti) {
			return selectedOptions.some((selected) => selected.value === option.value);
		}
		return selectedOption?.value === option.value;
	}

	function getCurrentIndex() {
		if (isMulti) {
			return -1;
		}
		return options.findIndex((opt: Option) => opt.value === selectedOption?.value);
	}

	export function focusOption(index: number) {
		highlightedIndex = index;
		requestAnimationFrame(() => {
			optionElements = Array.from(dropdownEl?.querySelectorAll('[role="option"]') || []);
			optionElements[index]?.focus();
			scrollOptionIntoView(index);
		});
	}

	function scrollOptionIntoView(index: number) {
		if (!optionsContainer || index < 0 || !optionElements[index]) return;

		const container = optionsContainer;
		const optionHeight = optionElements[0]?.offsetHeight ?? 56;
		const containerHeight = container.clientHeight;
		const optionTop = index * optionHeight;

		if (index === 0) {
			container.scrollTop = 0;
		} else if (index === options.length - 1) {
			container.scrollTop = optionTop;
		} else {
			container.scrollTop = optionTop - containerHeight + optionHeight;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				onClose();
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (document.activeElement === inputElement) {
					focusOption(0);
				} else {
					focusOption(highlightedIndex < options.length - 1 ? highlightedIndex + 1 : 0);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (document.activeElement === inputElement) {
					focusOption(options.length - 1);
				} else if (highlightedIndex === 0 && autocomplete?.enabled) {
					inputElement?.focus();
					highlightedIndex = -1;
				} else {
					focusOption(highlightedIndex > 0 ? highlightedIndex - 1 : options.length - 1);
				}
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (highlightedIndex >= 0) {
					onSelect(options[highlightedIndex]);
				}
				break;
		}
	}

	function handleInputFocus() {
		highlightedIndex = -1;
		optionsContainer && (optionsContainer.scrollTop = 0);
	}

	$effect(() => {
		if (!isOpen) {
			highlightedIndex = -1;
			return;
		}

		if (autoFocus) {
			requestAnimationFrame(() => {
				if (autocomplete?.enabled) {
					inputElement?.focus();
				} else {
					const currentIndex = getCurrentIndex();
					if (currentIndex >= 0) {
						focusOption(currentIndex);
					} else {
						dropdownEl?.focus();
					}
				}
			});
		}
	});
</script>

{#if isOpen}
	<div
		bind:this={dropdownEl}
		use:clickOutside={onClose}
		transition:scale={{ duration: 200, start: 0.95 }}
		class="absolute z-50 flex flex-col border border-neutral-200 bg-white shadow-md outline-none {className}"
		style={buildDropdownStyle()}
		role="listbox"
		aria-multiselectable={isMulti}
		tabindex="0"
		onkeydown={handleKeydown}
	>
		{#if autocomplete?.enabled}
			<div class="relative flex-none border-b border-neutral-200 bg-white">
				<input
					bind:this={inputElement}
					type="text"
					value={searchValue}
					onfocus={handleInputFocus}
					oninput={onSearchInput}
					class="h-16 w-full px-12 py-6 pl-4 text-gray-900 outline-none"
					placeholder="Search..."
				/>
				{#if searchValue}
					<button
						onclick={() => onSearchInput?.({ target: { value: '' } } as any)}
						class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
					>
						<div class="h-5 w-5">
							<MdClose />
						</div>
					</button>
				{/if}
			</div>
		{/if}

		<div bind:this={optionsContainer} class="flex-1 overflow-y-auto scroll-smooth">
			{#if isFetching}
				<div class="flex items-center justify-center p-4 text-gray-500">Loading...</div>
			{:else if options.length === 0}
				<div class="flex items-center justify-center p-4 text-gray-500">No results found</div>
			{:else}
				{#each options as option, index}
					<button
						use:ripple={{ duration: 0.8 }}
						class="flex w-full cursor-pointer items-center text-gray-900 outline-none {enableKeyboardHighlight &&
						index === highlightedIndex
							? 'bg-neutral-100'
							: ''} hover:bg-neutral-100 {optionClassName}"
						style={buildOptionStyle()}
						role="option"
						aria-selected={isOptionSelected(option)}
						onclick={() => onSelect(option)}
						tabindex="0"
					>
						{#if isMulti}
							<div class="mr-3 h-5 w-5 flex-shrink-0 text-blue-600">
								{#if isOptionSelected(option)}
									<MdCheckBox />
								{:else}
									<MdCheckBoxOutlineBlank />
								{/if}
							</div>
						{/if}
						<span class="w-full truncate text-left">{option.label}</span>
					</button>
				{/each}
			{/if}
		</div>
	</div>
{/if}
