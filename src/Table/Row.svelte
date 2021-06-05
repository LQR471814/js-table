<script lang="ts">
    export let rowData: RowData
    export let columnGap
    export let heightGap
</script>

<div style="margin-bottom: {heightGap}; margin-top: {heightGap}">
    {#each rowData as col}
        <span style="margin-left: {columnGap}; margin-right: {columnGap}">{col}</span>
    {/each}
</div>

<style>
    div {
        display: flex
    }
</style>
