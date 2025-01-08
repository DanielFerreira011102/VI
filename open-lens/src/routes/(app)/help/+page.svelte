<script lang="ts">
	import {
		MdHelp,
		MdSchool,
		MdSearch,
		MdCompareArrows,
		MdTimeline,
		MdPeople
	} from 'svelte-icons/md';
</script>

<div class="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-900">OpenLens Help Center</h1>
			<p class="text-xl text-gray-600">
				Learn how to make the most of OpenLens for exploring academic research
			</p>
		</div>

		<!-- Main content -->
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			<!-- Getting Started -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 h-12 w-12 text-blue-600">
					<MdHelp />
				</div>
				<h2 class="mb-4 text-2xl font-semibold">Getting Started</h2>
				<p class="mb-4 text-gray-600">
					OpenLens is a visualization tool that helps you explore research trends and compare
					universities using data from OpenAlex.
				</p>
				<ul class="list-inside list-disc space-y-2 text-gray-600">
					<li>Compare research output between institutions</li>
					<li>Explore publication trends over time</li>
					<li>Analyze research topics and collaborations</li>
				</ul>
			</div>

			<!-- University Search -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 h-12 w-12 text-blue-600">
					<MdSearch />
				</div>
				<h2 class="mb-4 text-2xl font-semibold">Finding Universities</h2>
				<p class="mb-4 text-gray-600">
					Use the search functionality to find universities and research institutions:
				</p>
				<ul class="list-inside list-disc space-y-2 text-gray-600">
					<li>Type university name in the search bar</li>
					<li>Filter by country or region</li>
					<li>View detailed institution profiles</li>
				</ul>
			</div>

			<!-- Comparisons -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 h-12 w-12 text-blue-600">
					<MdCompareArrows />
				</div>
				<h2 class="mb-4 text-2xl font-semibold">Making Comparisons</h2>
				<p class="mb-4 text-gray-600">Compare multiple institutions side by side:</p>
				<ul class="list-inside list-disc space-y-2 text-gray-600">
					<li>Select universities to compare</li>
					<li>View normalized publication metrics</li>
					<li>Compare research focus areas</li>
				</ul>
			</div>

			<!-- Research Trends -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 h-12 w-12 text-blue-600">
					<MdTimeline />
				</div>
				<h2 class="mb-4 text-2xl font-semibold">Analyzing Trends</h2>
				<p class="mb-4 text-gray-600">Explore research trends and patterns:</p>
				<ul class="list-inside list-disc space-y-2 text-gray-600">
					<li>View publication trends over time</li>
					<li>Analyze citation metrics</li>
					<li>Identify emerging research areas</li>
				</ul>
			</div>

			<!-- University Profiles -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 h-12 w-12 text-blue-600">
					<MdSchool />
				</div>
				<h2 class="mb-4 text-2xl font-semibold">University Profiles</h2>
				<p class="mb-4 text-gray-600">Access detailed information about institutions:</p>
				<ul class="list-inside list-disc space-y-2 text-gray-600">
					<li>View research output statistics</li>
					<li>Explore faculty expertise</li>
					<li>See collaboration networks</li>
				</ul>
			</div>

			<!-- About -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 h-12 w-12 text-blue-600">
					<MdPeople />
				</div>
				<h2 class="mb-4 text-2xl font-semibold">About OpenLens</h2>
				<p class="mb-4 text-gray-600">
					OpenLens is an open-source project developed to help the academic community make informed
					decisions.
				</p>
				<div class="space-y-2">
					<p class="text-gray-600">
						Visit our <a
							href="https://github.com/DanielFerreira011102/VI/tree/main/open-lens"
							class="text-blue-600 underline hover:text-blue-800">GitHub repository</a
						> to:
					</p>
					<ul class="list-inside list-disc text-gray-600">
						<li>View the source code</li>
						<li>Report issues</li>
						<li>Contribute to development</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-12 text-center text-gray-600">
			<p>
				Still have questions? Contact us at <a
					aria-label="Email"
					href="mailto:djbf@ua.pt"
					class="text-blue-600 underline hover:text-blue-800"
				>
					djbf@ua.pt
				</a>
			</p>
		</div>
	</div>
</div>
