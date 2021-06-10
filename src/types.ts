import FlexSearch from "flexsearch"

//? Note: Restart dev server every time a change is made to this file (otherwise source won't update)

export class TableData {
	headers: string[]
	rows: RowData[]
	columnIndices: FlexSearch[]
	numberRowsIndex: number

	constructor(headers: string[], data?: string[][]) { //? 'data' is list of rows
		this.headers = headers

		this.columnIndices = []
		for (const _ of headers) {
			//@ts-ignore
			this.columnIndices.push(new FlexSearch("speed"))
		}

		this.rows = []
		this.numberRowsIndex = 0

		if (data) {
			for (let y = 0; y < data.length; y++) {
				const indexedRow = []
				for (const cell of data[y]) {
					/* Add index to row because sort & search
						needs to know sorted indices rather than
						searched & sorted column */
					indexedRow.push({
						rowIndex: y,
						data: cell,
					})
				}

				this.addRow(indexedRow)
			}
		}
	}

	addRow(row: RowData) {
		if (row.length !== this.headers.length) {
			console.error('Inconsistent number of columns between row and header')
			return
		}

		for (let i = 0; i < row.length; i++) {
			//@ts-ignore
			this.columnIndices[i].add(i, row[i])
		}

		this.rows.push(row)
		this.numberRowsIndex += 1
	}

	fetchRows(start: number, end: number) {
		return this.rows.slice(start, end)
	}

	fetchColumn(index: number, countRows?: number) {
		if (!countRows) {
			countRows = this.numberRowsIndex //? Actually represents length, not index of last row
		}

		const column = []
		for (let i = 0; i < countRows; i++)  {
			column.push(this.rows[i][index])
		}

		return column
	}
}

export const CONTEXT_MSG_TYPE = "context"
interface FRONTEND_CONTEXT_MSG {
	type: string
	headers: string[]
	data: RowData[]
}

export const EVENT_REQUEST_ROWS = "request_rows"
interface FRONTEND_REQUEST_ROWS_MSG {
	type: string
	start: number
	end: number
}
interface BACKEND_REQUEST_ROWS_MSG {
	type: string
	rows: RowData[]
}

export const EVENT_SORT = "sort"
interface FRONTEND_SORT_MSG {
	type: string
	col: number
	rows: number
}
interface BACKEND_SORT_MSG {
	type: string
	rows: RowData[]
}

export const EVENT_SEARCH = "search"
interface FRONTEND_SEARCH_MSG {
	type: string
	filters: SearchFilter
	max: number
}

interface SearchFilter {
	keyword: string
	column: number,
}

interface BACKEND_SEARCH_MSG {
	type: string,
	rows: RowData[]
}
