<svelte:options tag="js-table-scrollbar" />

<script lang="ts">
	import { onMount } from "svelte";

	//? Variables
	let container: HTMLDivElement
	let nub: HTMLDivElement

	let containerBox: DOMRect
	let containerPaddingTop: number
	let containerPaddingBottom: number

	const dragging = { current: false }
	const yPosition = { current: 0 }

	//? Styling Options
	export let styling = {
		width: '10px',
		padding: '5px',
		position: 'fixed'
	}

	onMount(() => {
		containerBox = container.getBoundingClientRect()

		containerPaddingTop = parseFloat(window.getComputedStyle(container).paddingTop)
		containerPaddingBottom = parseFloat(window.getComputedStyle(container).paddingBottom)

		const clamp = (n: number, min: number, max: number) => {
			if (n < min) {
				return min
			} else if (n > max) {
				return max
			} else {
				return n
			}
		}

		const moveNub = (y: number) => {
			const rect = nub.getBoundingClientRect()
			const centerY = Math.round(rect.height / 2) + rect.top

			const deltaY = y - centerY
			yPosition.current += deltaY

			yPosition.current = clamp(
				yPosition.current,
				0,

				containerBox.bottom -
				containerBox.top -

				rect.height -

				containerPaddingTop -
				containerPaddingBottom
			)

			nub.style.transform = `translate(0, ${yPosition.current}px)`
		}

		const onmousedown = (e: MouseEvent) => {
			if (!(e.x < containerBox.right && e.x > containerBox.left)) {
				return
			}

			moveNub(e.y)
			dragging.current = true
		}

		const onmouseup = () => {
			dragging.current = false
		}

		const onmousemove = (e: MouseEvent) => {
			if (dragging.current) {
				moveNub(e.y)
			}
		}

		window.addEventListener('mousedown', onmousedown)
		window.addEventListener('mouseup', onmouseup)
		window.addEventListener('mousemove', onmousemove)

		const containerStyle = window.getComputedStyle(container)
		console.log(`calc(${containerStyle.paddingLeft} + ${containerStyle.paddingRight} + ${containerStyle.width})`)
	})
</script>

<div
	class="container"
	bind:this={container}
	style="--width: {styling.width}; --padding: {styling.padding}; --position: {styling.position}"
>
	<div class="nub" bind:this={nub}></div>
</div>

<style>
	.container {
		position: var(--position);

		top: 0;
		right: 0;

		height: 100vh;

		width: var(--width);
		padding: var(--padding);

		background-color: var(--neutral);
	}

	.nub {
		width: 100%;
		height: 10%;

		position: relative;
		top: 0;

		background-color: var(--light);

		border-radius: 10px;
	}
</style>
