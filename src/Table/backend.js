import {
	CONTEXT_MSG_TYPE,
	EVENT_REQUEST_ROWS,
	EVENT_SORT,
	EVENT_SEARCH,
	TableData,
} from '../types'

import { createNewSortInstance } from 'fast-sort'

let table
const frontendState = {
	sortDirection: 0
}

const sort = createNewSortInstance({
	comparer: new Intl.Collator(undefined, {
		numeric: true,
		sensitivity: 'base',
	}).compare
})

let currentCachedRows

onmessage = (e) => {
	const msg = e.data

	switch (msg.type) {
		case CONTEXT_MSG_TYPE:
			table = new TableData(msg.headers, msg.data)
			break
		case EVENT_REQUEST_ROWS:
			let returnRows

			console.log(msg.end)

			if (currentCachedRows && msg.scrolling) {
				returnRows = currentCachedRows.splice(msg.start, msg.end)
			} else {
				returnRows = table.fetchRows(msg.start, msg.end)
			}

			postMessage({
				type: EVENT_REQUEST_ROWS,
				rows: returnRows,
				scrolling: msg.scrolling
			}) //? Return all rows if start is equal to end

			break
		case EVENT_SORT:
			const column = table.fetchColumn(msg.col)
			let sorted = sort(column)

			if (msg.direction === 1) { //? 1: Ascending
				sorted = sorted.asc(cell => cell.data)
			} else if (msg.direction === 2) { //? 2: Descending
				sorted = sorted.desc(cell => cell.data)
			} else { //? 0: Default
				sorted = column
			}

			frontendState.sortDirection = msg.direction

			const resultRows = []
			for (const sortedEntry of sorted) {
				resultRows.push(table.rows[sortedEntry.rowIndex])
			}

			currentCachedRows = resultRows

			postMessage({
				type: EVENT_SORT,
				rows: resultRows.slice(0, msg.rows)
			})

			break
		case EVENT_SEARCH:
			const rowIndices = new Map()
			const beginningFilter = msg.filters[0]

			let pool = []
			for (const filter of msg.filters) {
				for (const result of table.columnIndices[filter.column].search(filter.keyword)) {

				}
			}

			break
	}
}

function pixelHeightToRowIndex(height) {
	return Math.round(height / frontendState.rowsize)
}