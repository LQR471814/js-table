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
    height: 0,
    width: 0,
    rowsize: 0,
    scrolled: 0, //? In pixels
}

const sort = createNewSortInstance({
    comparer: new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
    }).compare
})

onmessage = (e) => {
    const msg = e.data

    switch (msg.type) {
        case CONTEXT_MSG_TYPE:
            table = new TableData(msg.headers, msg.data)
            break
        case EVENT_REQUEST_ROWS:
            postMessage({
                type: EVENT_REQUEST_ROWS,
                rows: (msg.start === msg.end) ? table.rows : table.fetchRows(msg.start, msg.end)
            }) //? Return all rows if start is equal to end

            break
        case EVENT_SORT:
            let sorted = sort(table.fetchColumn(msg.col, msg.rows))

            if (msg.direction > 0) { //? 1: Ascending
                sorted = sorted.asc(cell => cell.data)
            } else { //? -1: Descending
                sorted = sorted.desc(cell => cell.data)
            }

            const resultRows = []
            for (const sortedEntry of sorted) {
                resultRows.push(table.rows[sortedEntry.rowIndex])
            }

            console.log(resultRows)

            postMessage({
                type: EVENT_SORT,
                rows: resultRows
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