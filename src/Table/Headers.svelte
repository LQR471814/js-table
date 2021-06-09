<svelte:options tag="js-table-headers"></svelte:options>

<script lang="ts">
    import { range } from "../utils"

    export let headers: string[]
    export let onSort: (index: number) => void
</script>

<tr>
    <!-- {#each range(0, headers.length) as i}
        <th on:click={() => onSort(i)}>{headers[i]}</th>
    {/each} -->
</tr>

<style>
    tr {
        background-color: var(--light);

        position: sticky;
        top: 0;
    }
</style>
