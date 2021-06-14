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

	//? Props
	export let headers: string[] = []
	export let data: RowData[] = []
	export let dimensions: { x: string, y: string } = { x: "100%", y: "100%" }

	//? Settings

	export const settings: {
		delMargin: number,
		wheelUnit: number,
		rowUnitRatio: number
	} = {
		/** delMargin specifies how many times the tableRowCapacity can the table have
		 * when going over this margin, rows from either the front or back
		 * depending on scroll direciton will be removed until it satisfies this
		 * limit **/
			delMargin: 1.5,

		/** wheelUnit is the amount of deltaY in the WheelEvent interface that would be
		 * counted as one 'unit' down **/
			wheelUnit: 100,

		/** rowUnitRatio is the ratio of 'units' inferred from the WheelEvent interface
		 * to a single row **/
			rowUnitRatio: 1,
	}

	//? Variables

	let backend: Worker
	let table: HTMLTableElement
	let frame: HTMLDivElement

	let currentRows: RowData[] = []

	let appendRowBuffer = 0 //? This is in 'units'

	const displayRowsRange = {
		start: 0,
		end: 0,
	}

	const calculatedDimensions = {
		rowHeight: 0,
		viewportHeight: 0,
		tableRowCapacity: 0,

		update: function() {
			this.viewportHeight = this.getFrameHeight()
			this.rowHeight = this.getRowHeight()

			this.tableRowCapacity = this.getTableRowCapacity()
		},

		getRowHeight: () => {
			const measureRow = document.createElement('tr')
			const rowElement = document.createElement('td')
			rowElement.innerText = "a"

			measureRow.append(rowElement)

			table.append(measureRow)
			const height = measureRow.getBoundingClientRect().height

			measureRow.remove()

			return height
		},

		getFrameHeight: () => {
			return frame.getBoundingClientRect().height
		},

		getTableRowCapacity: () => {
			return Math.round(
				(
					calculatedDimensions.viewportHeight /
					calculatedDimensions.rowHeight
				) * settings.delMargin
			)
		}
	}

	const lastSorted = {
		value: -1,
		direction: 0
	}

	function appendRows(rows: RowData[], top?: boolean) {
		for (const row of rows) {
			appendRow(row, top)
		}
	}

	function appendRow(rowData: RowData, top?: boolean) {
		const row = document.createElement('tr')

		for (const cellData of rowData) {
			const cell = document.createElement('td')
			cell.innerText = cellData.data

			row.append(cell)
		}

		if (!top) {
			table.append(row)
		} else { //? Append before first row that isn't the headers
			table.insertBefore(row, table.children[1])
		}
	}

	function removeRows(start: number, end?: number) {
		for (const child of Array.from(table.children).slice(start, end)) {
			child.remove()
		}
	}

	function clear() {
		//? Copy children to avoid array weirdness because this value updates when you remove a child
		const rootChildren = [...table.children]

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
				currentRows = msg.rows
				break

			case EVENT_REQUEST_ROWS:
				if (!msg.scrolling) {
					currentRows = msg.rows
					return
				}

				const scrollingUpwards = msg.scrolling < 0 ? true : false

				const tableRowCapacity = calculatedDimensions.tableRowCapacity
				if (table.children.length - 1 > tableRowCapacity) { //? Check row number overflow
					const moreBy = Math.round(
						(table.children.length) - tableRowCapacity
					)

					if (msg.scrolling > 0) {
						displayRowsRange.start += moreBy
						removeRows(1, moreBy + 1)
					} else {
						displayRowsRange.end -= moreBy
						removeRows(-moreBy) //? Slice num of elements from end
					}
				}

				appendRows(
					msg.rows,
					scrollingUpwards,
				)

				if (scrollingUpwards) {
					displayRowsRange.start -= msg.rows.length
				} else {
					displayRowsRange.end += msg.rows.length
				}

				break

		}
	}

	onMount(() => {
		calculatedDimensions.update()

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
			end: calculatedDimensions.tableRowCapacity
		})

		displayRowsRange.end = calculatedDimensions.tableRowCapacity

		return () => {
			backend.terminate()
		}
	})
</script>

<div
	style="--width: {dimensions.x}; --height: {dimensions.y}"
	bind:this={frame}
	on:wheel={(e) => {
		//? Positive is downwards; Negative is upwards
		const scrollOffset = e.deltaY / settings.wheelUnit
		appendRowBuffer += scrollOffset

		if (Math.abs(appendRowBuffer) >= settings.rowUnitRatio) {
			const appendNumber = Math.round(appendRowBuffer / settings.rowUnitRatio)

			let start
			let end

			if (appendNumber > 0) {
				start = displayRowsRange.end,
				end = displayRowsRange.end + appendNumber
			} else {
				start = displayRowsRange.start + appendNumber
				end = displayRowsRange.start
			}

			backend.postMessage({
				type: EVENT_REQUEST_ROWS,
				start: start,
				end: end,
				scrolling: appendNumber > 0 ? 1 : -1
			})

			appendRowBuffer -= appendNumber * settings.rowUnitRatio
		}
	}}
>
	<table bind:this={table}>
		<!-- <div style="height: 200px;"></div> -->

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
							rows: calculatedDimensions.tableRowCapacity,
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
</div>

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
		padding: 10px;

		color: var(--lighter);
		white-space: nowrap;
	}

	th:hover, td:hover {
		color: var(--even-lighter);

		cursor: default;
	}

	th {
		user-select: none; /* Deprecated for some reason, not quite sure why */
	}

	div {
		height: var(--height);
		width: var(--width);

		overflow: auto;
		scrollbar-width: none; /* Remove scrollbar from firefox */
	}

	::-webkit-scrollbar { /* Remove scrollbar from chrome and other webkit browsers */
		width: 0;
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

		margin-left: 12px;
	}

	.header {
		background-color: var(--light);

		position: sticky;
		top: 0;
	}
</style>
