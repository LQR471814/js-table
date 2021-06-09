<svelte:options tag="js-table-demo"></svelte:options>

<script lang="ts">
	import Table from './Table/Table.svelte'

	function generateTableHeaders(columns: number) {
		const headers = []
		for (let i = 0; i < columns; i++) {
			headers.push(`Header ${i}`)
		}

		return headers
	}

	function generateTableData(rows: number, columns: number) {
		const data = []

		for (let y = 0; y < rows; y++) {
			const row = []
			for (let x = 0; x < columns; x++) {
				row.push(Math.round(Math.random() * 100))
			}
			data.push(row)
		}

		return data
	}

	const headers = generateTableHeaders(20)
	const data = generateTableData(100, 20)
</script>

<main>
	<Table {headers} {data} />
</main>
