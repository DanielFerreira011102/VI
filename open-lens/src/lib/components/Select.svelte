<script lang="ts">
	import type { AutocompleteConfig } from '$lib/types/autocomplete';
	import MdArrowDropDown from 'svelte-icons/md/MdArrowDropDown.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';	
	import type { Option } from '$lib/types/option';

	let {
		options,
		autocomplete,
		onChange,
		// Button styling
		buttonMinWidth,
		buttonHeight,
		buttonPadding,
		buttonBorderRadius,

		// Dropdown styling
		dropdownWidth,
		dropdownMinWidth,
		dropdownMaxWidth,
		dropdownPadding,
		dropdownOptionHeight,
		dropdownBorderRadius,

		// Dropdown positioning
		dropdownLeft,
		dropdownTop,
		dropdownRight,
		dropdownBottom,

		// Optional class names
		buttonClassName = '',
		dropdownClassName = '',
		optionClassName = '',

		// Optional props
		enableKeyboardHighlight = true,
		autoFocusDropdown = false
	} = $props<{
		options: Option[];
		autocomplete?: AutocompleteConfig;
		onChange: (option: string) => void;
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

	let selectedOption = $state<{ value: string; label: string }>(options[0]);
	let isOpen = $state(false);
	let buttonEl = $state<HTMLButtonElement | null>(null);

	function selectOption(option: { value: string; label: string }) {
		selectedOption = option;
		onChange(option.value);
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function handleClose() {
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
			event.preventDefault();
			isOpen = true;
		}
	}
</script>

<div class="relative inline-block">
	<button
		bind:this={buttonEl}
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
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
		{options}
		{selectedOption}
		onSelect={selectOption}
		onClose={handleClose}
	/>
</div>
