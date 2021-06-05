<script lang="ts">
	import Table from './Table/Table.svelte'
    import { TableData } from './types'

	function generateTableData(rows: number, columns: number) {
		const headers = []
		for (let i = 0; i < columns; i++) {
			headers.push(`Header ${i}`)
		}

		const table = new TableData(headers)

		for (let y = 0; y < rows; y++) {
			const row = []
			for (let x = 0; x < columns; x++) {
				row.push(x)
			}
			table.addRow(row)
		}

		return table
	}
</script>

<main>
	<Table table={generateTableData(100, 20)} />
</main>
