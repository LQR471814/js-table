<svelte:options tag="js-table-scrollbar" />

<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";

	//? Variables
	let container: HTMLDivElement
	let nub: HTMLDivElement

	let containerBox: DOMRect
	let containerPaddingTop: number
	let containerPaddingBottom: number

	const dispatch = createEventDispatcher()

	const dragging = { current: false } //? { current } to make sure values update throughout all the callbacks
	const yPosition = { current: 0 } //? This is the position of the center of the scroll nub

	//? Styling Options
	export let styling = {
		width: '12px',
		padding: '4px',
		position: 'fixed'
	}

	export let position: number
	let prevPosition: number

	$: {
		if (position !== prevPosition && containerBox) {
			yPosition.current = (position / total) * containerBox.height
			prevPosition = position
		}
	}

	export let total: number = 1
	export let viewed: number = 1

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

			dispatch('scroll', {
				position: yPosition.current
			})

			nub.style.top = `${yPosition.current / containerBox.height * 100}%`
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

		//? To prevent dragging and totally breaking the scrollbar
		window.addEventListener('dragstart', (e) => e.preventDefault())
	})
</script>

<div
	class="container" bind:this={container}
	draggable="false"
	style="
		--width: {styling.width};
		--padding: {styling.padding};
		--position: {styling.position};
		--nubHeight: {viewed / total * 100}%;
	"
>
	<div
		class="nub"
		style="top: {position / total * 100}%"
		draggable="false"
		bind:this={nub}
	></div>
</div>

<style>
	.container {
		position: var(--position);

		top: 0;
		right: 0;

		height: calc(100vh - var(--padding) * 2);

		width: var(--width);
		padding: var(--padding);

		background-color: var(--neutral);
	}

	.nub {
		width: 100%;
		height: var(--nubHeight);

		position: relative;
		top: 0;

		background-color: var(--light);

		border-radius: 10px;
	}

	.nub:hover {
		background-color: var(--lighter);
	}
</style>
