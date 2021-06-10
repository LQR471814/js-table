<svelte:options tag="js-table" />

<script lang="ts">
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
		// I have to put this code here cause for some
		// reason props aren't available until mount

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
			<th on:click={
				() => { //? OnSort

					//? Sort the other direction if repeating sort on same column
					//? Reset sorting if direction is descending

					if (lastSorted.value === i) {
						lastSorted.direction += 1

						if (lastSorted.direction > 2) {
							lastSorted.direction = 0
						}
					} else { //? So ascending sort is still default
						lastSorted.direction = 1
					}

					lastSorted.value = i

					backend.postMessage({
						type: EVENT_SORT,
						col: i,
						rows: 26,
						direction: lastSorted.direction,
					})
				}
			}>
				<span>{headers[i]}</span>
				{#if lastSorted.value === i}
					<svg
						style={ (lastSorted.direction === 1) ? 'transform: rotate(-90deg)'
								: (lastSorted.direction === 2) ? 'transform: rotate(90deg)'
								: 'display: none' }
						xmlns="http://www.w3.org/2000/svg"
						viewBox="6 0 12 24"
					>
						<path d="M6 0l12 12-12 12z"></path>
					</svg>
				{/if}
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
		white-space: nowrap;
	}

	th:hover, td:hover {
		color: var(--even-lighter);

		cursor: default;
	}

	td {
		padding: 10px;
	}

	th {
		padding: 10px;
		user-select: none; /* Deprecated for some reason, not quite sure why */
	}

	th > span {
		display: block;
	}

	table {
		width: 100%;
		border-spacing: 0;

		background-color: var(--neutral);
	}

	svg {
		fill: var(--lighter);

		width: auto;
		height: 12px;
	}

	.header {
		background-color: var(--light);

		position: sticky;
		top: 0;
	}
</style>
