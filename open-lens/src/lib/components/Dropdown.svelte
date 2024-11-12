<script lang="ts">
	import { ripple } from '$lib/actions/ripple';
	import { clickOutside } from '$lib/actions/outside';
	import { scale } from 'svelte/transition';
	import type { Option } from '$lib/types/option';

	let {
		isOpen = false,
		anchor,
		minWidth,
		width,
		maxWidth,
		padding,
		optionHeight,
		borderRadius,
		left,
		top,
		right,
		bottom,
		className = '',
		optionClassName = '',
		options = [],
		selectedOption,
		onSelect,
		onClose,
		enableKeyboardHighlight = true,
		autoFocus = false,
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
		selectedOption: Option;
		onSelect: (option: Option) => void;
		onClose: () => void;
		enableKeyboardHighlight?: boolean;
		autoFocus?: boolean;
	}>();

	let highlightedIndex = $state(
		options.findIndex((option: Option) => option.value === selectedOption.value)
	);
	let dropdownEl: HTMLDivElement;

	function getCurrentIndex() {
		return options.findIndex((option: Option) => option.value === selectedOption.value);
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
				highlightedIndex = highlightedIndex < options.length - 1 ? highlightedIndex + 1 : 0;
				scrollOptionIntoView();
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : options.length - 1;
				scrollOptionIntoView();
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

	function scrollOptionIntoView() {
		if (!dropdownEl) return;
		const optionElements = dropdownEl.getElementsByTagName('button');
		if (optionElements[highlightedIndex]) {
			optionElements[highlightedIndex].scrollIntoView({
				block: 'nearest',
				behavior: 'smooth'
			});
		}
	}

	$effect(() => {
		if (isOpen) {
			highlightedIndex = getCurrentIndex();
			if (autoFocus) {
				dropdownEl?.focus();
			}
		}
	});
</script>

{#if isOpen}
	<div
		bind:this={dropdownEl}
		use:clickOutside={onClose}
		transition:scale={{ duration: 200, start: 0.95 }}
		class="absolute z-50 overflow-y-auto border border-neutral-200 bg-white shadow-md outline-none {className}"
		style="
			min-width: {minWidth};
			width: {width};
			max-width: {maxWidth};
			border-radius: {borderRadius};
			{left ? `left: ${left};` : ''}
			{top ? `top: ${top};` : ''}
			{right ? `right: ${right};` : ''}
			{bottom ? `bottom: ${bottom};` : ''}
		"
		role="listbox"
		tabindex="0"
		onkeydown={handleKeydown}
	>
		{#each options as option, index}
			<button
				use:ripple={{ duration: 0.8 }}
				class="flex w-full cursor-pointer items-center outline-none {enableKeyboardHighlight &&
				index === highlightedIndex
					? 'bg-neutral-100'
					: ''} hover:bg-neutral-100 {optionClassName}"
				style="
					height: {optionHeight};
					padding-left: {padding};
					padding-right: {padding};
					-webkit-tap-highlight-color: transparent;
				"
				role="option"
				aria-selected={selectedOption === option}
				onclick={() => onSelect(option)}
				tabindex="-1"
			>
				<span class="w-full truncate whitespace-nowrap text-left">{option.label}</span>
			</button>
		{/each}
	</div>
{/if}
