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

    function appendRow(rowData: RowData) {
        const row = document.createElement('tr')

        for (const cellData of rowData) {
            const cell = document.createElement('td')
            cell.innerText = cellData

            row.append(cell)
        }

        root.append(row)
    }

    onMount(() => {
        backend = new BackendWorker()
        backend.onmessage = (e) => {
            const msg = e.data

            switch (msg.type) {
                case EVENT_SORT:
                    console.log(msg)
                    break
                case EVENT_REQUEST_ROWS:
                    for (const row of msg.rows) {
                        appendRow(row)
                    }
                    break

            }
        }

        backend.postMessage({
            type: CONTEXT_MSG_TYPE,
            headers: headers,
            data: data
        })

        backend.postMessage({
            type: EVENT_REQUEST_ROWS,
            start: 0,
            end: -1
        })
    })
</script>

<table bind:this={root}>
    <tr class="header">
        {#each range(0, headers.length) as i}
            <th on:click={
                () => backend.postMessage({
                    type: EVENT_SORT,
                    col: i,
                    direction: 1,
                })
            }>
                {headers[i]}
            </th>
        {/each}
        <td style="display: none">To keep encapsulated tableData styles</td>
    </tr>

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
