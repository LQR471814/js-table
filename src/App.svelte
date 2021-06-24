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
				// row.push(Math.round(Math.random() * 100).toString())
				row.push(y.toString())
			}
			data.push(row)
		}

		return data
	}
</script>

<main>
	<Table
		headers={generateTableHeaders(20)}
		data={generateTableData(1000, 20)}
		dimensions={{
			x: "100vw",
			y: "100vh"
		}}
	/>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
