<svelte:options tag="js-table" />

<script lang="ts">
	import './Arrow.svelte'
	import { range } from "../utils"

	import {
		CONTEXT_MSG_TYPE,
		EVENT_REQUEST_ROWS,
		EVENT_SORT,
		EVENT_SEARCH,
	} from '../types'

	import { onMount } from 'svelte';
	import BackendWorker from 'web-worker:./backend.js'

	export let headers: string[] = []
	export let data: RowData[] = []

	let backend: Worker
	let root: HTMLTableElement

	let currentRows: RowData[] = []

	const lastSorted = { value: -1, direction: 0 }

	function appendRows(rows: RowData[]) {
		for (const row of rows) {
			appendRow(row)
		}
	}

	function appendRow(rowData: RowData) {
		const row = document.createElement('tr')

		for (const cellData of rowData) {
			const cell = document.createElement('td')
			cell.innerText = cellData.data

			row.append(cell)
		}

		root.append(row)
	}

	function clear() {
		//? Copy children to avoid array weirdness because this value updates when you remove a child
		const rootChildren = [...root.children]

		for (const child of rootChildren) {
			if (child.className !== "header") {
				child.remove()
			}
		}
	}

	backend = new BackendWorker()
	backend.onmessage = (e) => {
		const msg = e.data

		switch (msg.type) {
			case EVENT_SORT:
				// clear()
				currentRows = msg.rows
				break

			case EVENT_REQUEST_ROWS:
				currentRows = msg.rows
				break

		}
	}

	onMount(() => {
		backend.postMessage({
			type: CONTEXT_MSG_TYPE,
			headers: headers,
			data: data
		})

		backend.postMessage({
			type: EVENT_REQUEST_ROWS,
			start: 0,
			end: 26
		})

		return () => {
			backend.terminate()
		}
	})
</script>

<table bind:this={root}>
	<tr class="header">
		{#each range(0, headers.length) as i}
			<th on:click={ //? OnSort
				() => {
					//? Sort the other direction if repeating sort on same column

					let direction = 1 //? Ascending is default

					if (lastSorted.value === i) {
						lastSorted.direction += 1
						switch (lastSorted.direction) {
							case 0: //? Ascending
								direction = 1
								break
							case 1: //? Descending
								direction = -1
								break
							case 2: //? None
								direction = 0
								break
							default:
								lastSorted.direction = 0
								break
						}
					}

					lastSorted.value = i

					backend.postMessage({
						type: EVENT_SORT,
						col: i,
						rows: 26,
						direction: direction,
					})
				}
			}>
				{headers[i]}
			</th>
		{/each}
	</tr>

	{#each currentRows as row}
		<tr>
			{#each row as cell}
				<td>{cell.data}</td>
			{/each}
		</tr>
	{/each}
</table>

<style>
	:root {
		--even-lighter: rgb(188, 188, 188);
		--lighter: rgb(153, 153, 153);
		--light: rgb(110, 110, 110);
		--neutral: rgb(85, 85, 85);
		--neutral-dark: rgb(50, 50, 50);
		--dark: rgb(33, 33, 33);
		--darker: rgb(23, 23, 23);
	}

	th, td {
		color: var(--lighter);

		padding: 10px;

		white-space: nowrap;
	}

	th:hover, td:hover {
		color: var(--even-lighter);

		cursor: default;
	}

	table {
		width: 100%;
		border-spacing: 0;

		background-color: var(--neutral);
	}

	.header {
		background-color: var(--light);

		position: sticky;
		top: 0;
	}
</style>
