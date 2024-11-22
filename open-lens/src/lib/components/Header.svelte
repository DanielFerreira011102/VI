<script lang="ts">
	import { page } from '$app/stores';
	import { dataStore } from '$lib/stores/dataStore';
	import { termStore } from '$lib/stores/termStore';
	import { goto } from '$app/navigation';
	import SideMenu from './SideMenu.svelte';
	import MdMenu from 'svelte-icons/md/MdMenu.svelte';
	import Logo from '$lib/assets/logo.png';

	let open = $state(false);
	const openSideMenu = () => (open = true);

	async function handleNavClick(e: MouseEvent, href: string) {
		if (href === '/explore') {
			e.preventDefault();
			termStore.resetToInitial();
			await goto('/explore', { replaceState: true });
		}
	}
</script>

<header
	class="fixed left-0 top-0 z-50 flex h-16 w-full flex-row items-center border-b border-neutral-200 bg-white px-3 py-2 font-sans"
>
	<!-- Left Section -->
	<div class="flex items-center">
		<!-- Hamburger -->
		<button
			onclick={openSideMenu}
			type="button"
			class="flex h-12 min-h-6 w-12 min-w-6 cursor-pointer items-center justify-center rounded-full outline-none transition-all duration-300 ease-in-out hover:bg-black hover:bg-opacity-10"
		>
			<div class="h-6 w-6 text-gray-500">
				<MdMenu />
			</div>
		</button>
		<!-- Side Menu -->
		<SideMenu bind:open />

		<div class="hidden items-center px-4 md:flex">
			<!-- Logo -->
			<a href="/">
				<img class="h-8" src={Logo} alt="Open Lens Logo" />
			</a>

			<!-- Header Tabs -->
			<div class="ml-10 flex h-16 items-center justify-center">
				{#each $dataStore.NAVLIST.filter((item) => item.showInHeader) as item}
					<a
						class="relative mx-4 text-lg leading-16 text-gray-500"
						href={item.href}
						class:active={$page.url.pathname === item.href}
						onclick={(e) => handleNavClick(e, item.href)}
					>
						{item.title}
					</a>
				{/each}
			</div>
		</div>
		<div class="flex items-center px-4 md:hidden">
			{#each $dataStore.NAVLIST.filter((item) => item.showInHeader) as item}
				{#if $page.url.pathname === item.href}
					<a
						class="relative text-xl leading-16 text-gray-900"
						href={item.href}
						onclick={(e) => handleNavClick(e, item.href)}
					>
						{item.title}
					</a>
				{/if}
			{/each}
		</div>
	</div>
</header>

<style>
	a.active {
		color: rgb(17, 24, 39) /* gray-900 */;
	}
	a.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		height: 0.25rem; /* 1px */
		width: 100%;
		border-radius: 4px 4px 0 0;
		background-color: rgb(59, 130, 246); /* blue-500 */
	}
</style>
