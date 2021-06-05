export class TableData {
    headers: string[]
    rows: RowData[]

    constructor(headers: string[]) {
        this.headers = headers
        this.rows = []
    }

    addRow(row: RowData) {
        if (row.length !== this.headers.length) {
            console.error('Inconsistent number of columns between row and header')
            return
        }

        this.rows.push(row)
    }

    fetchRange(start: number, end: number) {
        return this.rows.slice(start, end)
    }
}

