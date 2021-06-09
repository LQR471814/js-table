import FlexSearch from "flexsearch"

export class TableData {
    headers: string[]
    rows: RowData[]
    columnIndices: FlexSearch[]
    numberRowsIndex: number

    constructor(headers: string[], data?: RowData[]) {
        this.headers = headers

        this.columnIndices = []
        for (const _ of headers) {
            //@ts-ignore
            this.columnIndices.push(new FlexSearch("speed"))
        }

        this.rows = []
        this.numberRowsIndex = this.rows.length

        if (data) {
            for (const row of data) {
                this.addRow(row)
            }
        }
    }

    addRow(row: RowData) {
        if (row.length !== this.headers.length) {
            console.error('Inconsistent number of columns between row and header')
            return
        }

        for (let i = 0; i < this.headers.length; i++) {
            //@ts-ignore
            this.columnIndices[i].add(this.numberRowsIndex, {
                data: row[i],
                index: this.numberRowsIndex
            })
        }

        this.rows.push(row)
        this.numberRowsIndex += 1
    }

    fetchRows(start: number, end: number) {
        return this.rows.slice(start, end)
    }

    fetchColumn(index: number, rows?: number) {
        if (!rows) {
            rows = this.numberRowsIndex
        }

        const column = []
        for (let i = 0; i < rows; i++)  {
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

export const EVENT_SORT = "sort"
interface FRONTEND_SORT_MSG {
    type: string
    col: number
    rows: number
    direction: number
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
