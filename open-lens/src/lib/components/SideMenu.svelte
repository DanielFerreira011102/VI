<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { dataStore } from '$lib/stores/dataStore';
	import MdSearch from 'svelte-icons/md/MdSearch.svelte';
	import MdTrendingUp from 'svelte-icons/md/MdTrendingUp.svelte';
	import MdAccountBalance from 'svelte-icons/md/MdAccountBalance.svelte';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import MdFeedback from 'svelte-icons/md/MdFeedback.svelte';
	import Logo from '$lib/assets/logo.png';

	let { open = $bindable() } = $props();
	const onClose = () => (open = false);

	const icons = [MdSearch, MdTrendingUp, MdAccountBalance, MdHelpOutline, MdFeedback];
</script>

<div class="flex items-center justify-center">
	{#if open}
		<!-- Sidebar Overlay -->
		<div class="fixed inset-0 z-50 overflow-hidden">
			<!-- Use fade transition for overlay -->
			<div
				role="button"
				tabindex="0"
				aria-label="Close overlay"
				class="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
				in:fade={{ duration: 300 }}
				out:fade={{ duration: 300 }}
				onkeydown={onClose}
				onclick={onClose}
			></div>

			<!-- Sidebar Content -->
			<section class="absolute inset-y-0 left-0 flex max-w-full">
				<div
					class="w-screen max-w-xs"
					in:fly={{ x: -200, duration: 300 }}
					out:fly={{ x: -200, duration: 300 }}
				>
					<div class="flex h-full flex-col bg-white shadow-xl">
						<!-- Sidebar Header -->
						<div class="flex items-center justify-between px-4 py-4">
							<!-- Logo -->
							<a href="/"><img class="h-8" src={Logo} alt="Open Lens Logo" /></a>
						</div>

						<!-- Divider -->
						<div class="h-px bg-neutral-200"></div>

						<!-- Sidebar Body -->
						<div class="overflow-auto px-1 py-3">
							<ul class="space-y-2">
								{#each $dataStore.NAVLIST as item, i}
									{#if item.isContent}
										{@const Icon = icons[i]}
										<li
											class="mx-2 flex h-14 cursor-pointer items-center rounded-3xl transition-all duration-100 ease-in-out hover:bg-gray-400 hover:bg-opacity-10"
											class:active={$page.url.pathname == item.href}
										>
											<a
												onclick={onClose}
												href={item.href}
												class="flex h-full w-full items-center px-6 text-base text-gray-500"
											>
												{#if i < icons.length}
													<div class="h-6 w-6">
														<Icon />
													</div>
												{/if}
												<span class="pl-4">{item.title}</span>
											</a>
										</li>
									{/if}
								{/each}
							</ul>
						</div>

						<!-- Divider -->
						<div class="mx-6 h-px bg-neutral-300"></div>

						<!-- Sidebar Notes -->
						<div class="overflow-auto px-1 py-3">
							<ul class="space-y-2">
								{#each $dataStore.NAVLIST as item, i}
									{#if !item.isContent}
										{@const Icon = icons[i]}
										<li
											class="mx-2 flex h-14 cursor-pointer items-center rounded-3xl transition-all duration-100 ease-in-out hover:bg-gray-400 hover:bg-opacity-10"
											class:active={$page.url.pathname == item.href}
										>
											<a
												onclick={onClose}
												href={item.href}
												class="flex h-full w-full items-center px-6 text-base text-gray-500"
											>
												{#if i < icons.length}
													<div class="h-6 w-6">
														<Icon />
													</div>
												{/if}
												<span class="pl-4">{item.title}</span>
											</a>
										</li>
									{/if}
								{/each}
							</ul>
						</div>

						<!-- Sidebar Footer -->
						<div class="flex flex-grow items-end px-4 py-6">
							<p class="text-sm text-gray-500">
								&copy; {$dataStore.META.creation_year}
								{$dataStore.META.title}. All rights reserved.
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	{/if}
</div>

<style>
	/* Sidebar */
	li.active {
		background-color: rgba(59, 130, 246, 0.1); /* sky-100 */
	}
</style>
