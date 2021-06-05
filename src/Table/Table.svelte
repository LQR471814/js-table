<script lang="ts">
    import type { TableData } from '../types'

    export let table: TableData
</script>

<div style="--columns: {table.headers.length}">
    <div class="grid headers">
        {#each table.headers as header}
            <span>{header}</span>
        {/each}
    </div>

    <div class="grid content">
        {#each table.headers as header}
            <span class="none">{header}</span>
        {/each}

        {#each table.fetchRange(0, -1) as row}
            {#each row as cell}
                <span>{cell}</span>
            {/each}
        {/each}
    </div>
</div>

<style>
    :global(:root) {
        --even-lighter: rgb(183, 183, 183);
        --lighter: rgb(143, 143, 143);
        --light: rgb(123, 123, 123);
        --neutral: rgb(85, 85, 85);
        --neutral-dark: rgb(50, 50, 50);
        --dark: rgb(33, 33, 33);
        --darker: rgb(23, 23, 23);
    }

    span {
        color: var(--lighter);
        padding: 10px;

        flex-grow: 1;
    }

    span:hover {
        cursor: default;
    }

    div.grid.headers span:hover {
        color: var(--even-lighter);
        background-color: var(--light)
    }

    div.grid.content span:hover {
        color: var(--even-lighter);
    }

    .none {
        color: transparent !important;

        height: 0;
        margin: 0;
        padding: 0;

        -webkit-user-drag: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        cursor: default;
    }

    .grid {
        display: grid;

        grid-template-columns: repeat(var(--columns), 1fr);
    }

    .headers {
        grid-column: 1 / -1;

        position: sticky;
        top: 0;

        background-color: var(--neutral);
        box-shadow: 0px 5px 10px var(--darker);
    }

    .content {
        background-color: var(--dark);
    }
</style>
