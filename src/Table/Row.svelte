<svelte:options tag="js-table-row"></svelte:options>

<script lang="ts">
    export let row: RowData
</script>

<tr>
    {#each row as cell}
        <td>{cell}</td>
    {/each}
</tr>
