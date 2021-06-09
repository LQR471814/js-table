<svelte:options tag="js-table"></svelte:options>

<script lang="ts">
    import Headers from './Headers.svelte'
    import Row from './Row.svelte'

    import {
        CONTEXT_MSG_TYPE,
        EVENT_REQUEST_ROWS,
        EVENT_SORT,
        EVENT_SEARCH,
    } from '../types'

    import { onMount } from 'svelte';

    export let headers: string[]
    export let data: RowData[]

    console.log(headers, data)

    let backend: Worker
    let root: HTMLTableElement

    onMount(() => {
        backend = new Worker('./build/backend.js')
        backend.onmessage = (e) => {
            const msg = e.data

            switch (msg.type) {
                case EVENT_SORT:
                    console.log(msg)
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
    <Headers onSort={
        (index) => {
            console.log("Sort", headers[index])
        }
    } {headers} />
</table>

<style>
    :global(:root) {
        --even-lighter: rgb(188, 188, 188);
        --lighter: rgb(153, 153, 153);
        --light: rgb(110, 110, 110);
        --neutral: rgb(85, 85, 85);
        --neutral-dark: rgb(50, 50, 50);
        --dark: rgb(33, 33, 33);
        --darker: rgb(23, 23, 23);
    }

    :global(th, td) {
        color: var(--lighter);

        padding: 10px;
    }

    :global(th:hover, td:hover) {
        color: var(--even-lighter);

        cursor: default;
    }

    table {
        width: 100%;
        border-spacing: 0;

        background-color: var(--neutral);
    }
</style>
