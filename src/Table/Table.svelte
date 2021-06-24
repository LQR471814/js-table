<!-- Source Sans Pro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=true>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@600&display=swap" rel="stylesheet">

<!-- Robot Mono -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=true>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet">

<script lang="ts">
	import Scrollbar from './Scrollbar.svelte'
	import { range } from "../utils"

	import {
		CONTEXT_MSG_TYPE,
		EVENT_REQUEST_ROWS,
		EVENT_SORT,
		EVENT_SEARCH,
	} from './types'

	import type { RowData } from './types'

	import { onMount } from 'svelte';
	import BackendWorker from 'web-worker:./backend.js'

	//? Props

	export let headers: string[] = []
	export let data: string[][] = []
	export let dimensions: { x: string, y: string } = { x: "100%", y: "100%" }

	//? Settings

	export let scrollbarStyling = {
		width: '13px',
		padding: '4.5px',
		cssPosition: 'absolute',
		top: '0',
		right: '0',
		hoverTransition: '0.1s ease-in-out background-color',
	}

	export let scrollBehaivior: {
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
	let tableFrame: HTMLDivElement

	let scrollbarView: number

	let scrollTotal = 0
	let scrollPosition = 0

	let appendRowBuffer = 0 //? This is in 'units'

	const heldKeys = {
		shift: false
	}

	const displayRowsRange = {
		start: 0,
		end: 0,
	}

	const lastSorted = {
		value: -1,
		direction: 0
	}

	let calculatedDimensions = {
		rowHeight: 0,
		viewportHeight: 0,
		tableRowCapacity: 0,

		update: function() {
			this.viewportHeight = this.getFrameHeight()
			this.rowHeight = this.getRowHeight()

			this.tableRowCapacity = this.getTableRowCapacity()

			calculatedDimensions = calculatedDimensions
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
			return tableFrame.getBoundingClientRect().height
		},

		getTableRowCapacity: () => {
			return Math.round(
				(
					calculatedDimensions.viewportHeight /
					calculatedDimensions.rowHeight
				) * scrollBehaivior.delMargin
			)
		}
	}

	function appendRows(rows: RowData[], top?: boolean) {
		for (const row of rows) {
			appendRow(row, top)
		}
	}

	function appendRow(rowData: RowData, top?: boolean, customAttributes?: Map<string, string>) {
		const row = document.createElement('tr')

		if (customAttributes) {
			customAttributes.forEach((val, key) => {
				row.setAttribute(key, val)
			})
		}

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
		for (const child of table.querySelectorAll('tr:not(.header)')) {
			child.remove()
		}
	}

	backend = new BackendWorker()
	backend.onmessage = (e) => {
		const msg = e.data

		switch (msg.type) {
			case EVENT_SORT:
				clear()
				appendRows(msg.rows)
				break

			case EVENT_REQUEST_ROWS:
				if (msg.rerender) {
					clear()
					appendRows(msg.rows, false)
					return
				}

				const scrollingUpwards = msg.scrolling < 0 ? true : false

				const tableRowCapacity = calculatedDimensions.tableRowCapacity
				if (table.children.length - 1 > tableRowCapacity) { //? Check row number overflow
					const moreBy = Math.round(
						(table.children.length) - tableRowCapacity
					)

					if (scrollingUpwards) {
						displayRowsRange.end -= moreBy //? Remove from end count
						removeRows(-moreBy) //? Remove num of elements from end
					} else {
						displayRowsRange.start += moreBy //? Add start count
						removeRows(1, moreBy + 1)
					}
				}

				appendRows(
					msg.rows,
					scrollingUpwards,
				)

				if (scrollingUpwards) {
					displayRowsRange.start -= msg.rows.length //? Remove from start count
				} else {
					displayRowsRange.end += msg.rows.length //? Add to end count
				}

				scrollPosition = displayRowsRange.start * calculatedDimensions.rowHeight

				break

		}
	}

	onMount(() => {
		const frameDimensions = tableFrame.getBoundingClientRect()

		// scrollbarAuxilaryStyling = `
		// position: fixed;
		// left: ${frameDimensions.right}px;
		// top: ${frameDimensions.top}px;
		// height: calc(${frameDimensions.height}px - 2 * ${scrollbarStyling.padding});
		// `

		calculatedDimensions.update()

		scrollbarView = frameDimensions.height
		scrollTotal = data.length * calculatedDimensions.rowHeight

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
			end: calculatedDimensions.tableRowCapacity,
			scrolling: 1
		})

		const onkeydown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Shift":
					heldKeys.shift = true
					break
			}
		}

		const onkeyup = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Shift":
					heldKeys.shift = false
					break
			}
		}

		const onresize = () => calculatedDimensions.update()

		window.addEventListener('resize', onresize)
		window.addEventListener('keydown', onkeydown)
		window.addEventListener('keyup', onkeyup)

		return () => {
			backend.terminate()
			window.removeEventListener('resize', onresize)
		}
	})
</script>

<div
	style="--width: {dimensions.x}; --height: {dimensions.y}; --scrollPadding: calc({scrollbarStyling.padding} * 2 + {scrollbarStyling.width})"
	class="container">
	<div
		class="tableFrame"
		bind:this={tableFrame}
		on:wheel={(e) => {
			if (heldKeys.shift === true) {
				return
			}

			//? Positive is downwards; Negative is upwards
			const scrollOffset = e.deltaY / scrollBehaivior.wheelUnit
			appendRowBuffer += scrollOffset

			if (Math.abs(appendRowBuffer) >= scrollBehaivior.rowUnitRatio) {
				const appendNumber = Math.round(appendRowBuffer / scrollBehaivior.rowUnitRatio)

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

				appendRowBuffer -= appendNumber * scrollBehaivior.rowUnitRatio
			}
		}}
	>
		<table class="table" bind:this={table}>
			<tr class="header">
				{#each range(0, headers.length) as i}
					<th>
						<div>
							<span on:click={
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
										start: displayRowsRange.start,
										end: displayRowsRange.end,
										col: i,
										direction: lastSorted.direction,
									})

								}
							}>
								{headers[i]}
							</span>
						</div>
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

				<td style="display: none"></td> <!-- To preserve td styles -->
			</tr>
		</table>

	</div>

	<!-- containerStyle={scrollbarAuxilaryStyling} -->

	<Scrollbar
		position={scrollPosition}
		viewable={scrollbarView}
		total={scrollTotal}
		styling={scrollbarStyling}

		colorScheme={{
			nubClicked: "#8E8E8E",
			nubHovered: "#7E7E7E",
			nub: "#6E6E6E",
			background: "#555555",
		}}

		on:scroll={
			(e) => { //? On Scrollbar Scroll
				scrollPosition = scrollTotal * e.detail.position

				const newStart = Math.round(scrollPosition / calculatedDimensions.rowHeight)

				displayRowsRange.end = newStart + (displayRowsRange.end - displayRowsRange.start)
				displayRowsRange.start = newStart

				backend.postMessage({
					type: EVENT_REQUEST_ROWS,
					start: displayRowsRange.start,
					end: displayRowsRange.end,
					scrolling: 1,
					rerender: true
				})
			}
		}
	/>
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

	:global(th), :global(td) {
		padding: 10px;

		color: var(--lighter);
		white-space: nowrap;

		user-select: none; /* Deprecated on MDN for some reason, not quite sure why */
	}

	:global(td) {
		font-family: 'Roboto Mono', monospace;
		font-size: 15px;
	}

	span:hover {
		color: var(--even-lighter);

		cursor: default;
	}

	/* Frame */
	.container {
		font-family: 'Source Sans Pro', sans-serif;
		font-size: 17px;

		height: var(--height);
		width: var(--width);

		position: relative;
	}

	.tableFrame {
		height: 100%;
		width: 100%;

		overflow: auto;
		scrollbar-width: none; /* Remove scrollbar from firefox */

		background-color: var(--neutral);
	}

	::-webkit-scrollbar { /* Remove scrollbar from chrome and other webkit browsers */
		width: 0;
	}

	/* Table */
	table {
		width: 100%;
		padding-right: var(--scrollPadding);

		border-spacing: 0;

		background-color: var(--neutral);
	}

	th > div {
		min-width: min-content;
		resize: horizontal;
		overflow: auto;
		padding: 0px 8px 0px 8px;
	}

	/* Headers */
	.header {
		background-color: var(--light);

		position: sticky;
		top: 0;
	}

	svg {
		fill: var(--lighter);

		width: auto;
		height: 12px;

		margin-left: 12px;
	}
</style>
