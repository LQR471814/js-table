import {
    CONTEXT_MSG_TYPE,
    EVENT_REQUEST_ROWS,
    EVENT_SORT,
    EVENT_SEARCH,
} from '../types'

import { sort } from 'fast-sort'

const table
const frontendState = {
    height: 0,
    width: 0,
    rowsize: 0,
    scrolled: 0, //? In pixels
}

onmessage = (e) => {
    const msg = e.data

    switch (msg.type) {
        case CONTEXT_MSG_TYPE:
            table = msg.table
            break
        case EVENT_REQUEST_ROWS:
            postMessage({
                type: EVENT_REQUEST_ROWS,
                rows: table.fetchRows(msg.start, msg.end)
            })

            break
        case EVENT_SORT:
            let sorted = sort(table.fetchColumn(msg.col, msg.rows))

            if (msg.direction > 0) { //? 1: Ascending
                sorted = sorted.asc()
            } else { //? -1: Descending
                sorted = sorted.desc()
            }

            postMessage({
                type: EVENT_SORT,
                rows: sorted
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