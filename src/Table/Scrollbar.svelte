<script>
	import { afterUpdate, createEventDispatcher, onMount } from "svelte";

	function clamp(n, min, max) {
		if (n < min) {
			return min
		} else if (n > max) {
			return max
		} else {
			return n
		}
	}

	//? Variables
	let container
	let nub

	let containerBox
	let containerHeight //? Content height (Bounding Client Height minus padding)

	const dispatch = createEventDispatcher()

	const dragging = { current: false } //? { current } to make sure values update throughout all the callbacks
	const yPosition = { current: 0 } //? This is the position of the center of the scroll nub

	//? Replaces each attribute in an obj specified by the
	//? "keys" array with the value passed to the function
	//? This is not a pure function
	function replaceObjKeysWith(obj, keys, val) {
		for (const attr of keys) {
			obj[attr] = val
		}
	}

	//? Since I couldn't find a built-in for this I made one myself
	//? This goes through all the keys in the defaults object and checks
	//? if they exist in the target obj, if they don't or if their value is
	//? undefined, then it will create / replace that attribute's value with
	//? the one in the default object
	function setDefaultsByUndefined(obj, defaults) {
		const result = {...obj}

		for (const attr of Object.keys(defaults)) {
			if (result[attr] === undefined) {
				result[attr] = defaults[attr]
			}
		}

		return result
	}

	//? Styling Options

	//* General Styling
	export let styling = {}
	const defaultStyling = {
		width: '12px',
		height: '100%',
		padding: '4px',
		cssPosition: 'relative',
		top: 'unset',
		right: 'unset',
		left: 'unset',
		bottom: 'unset',
		hoverTransition: 'unset',
		borderRadius: '10px'
	}

	let renderedStyling
	$: {
		renderedStyling = setDefaultsByUndefined(styling, defaultStyling)
	}

	//* Color Scheme
	export let colorScheme = {}
	const defaultColors = {
		nubClicked: "#787878",
		nubHovered: "#A8A8A8",
		nub: "#C1C1C1",
		background: "#FFF",
	}

	let renderedColors
	$: {
		renderedColors = setDefaultsByUndefined(colorScheme, defaultColors)
	}

	//* Directly pass CSS rules for advanced users
	export let containerStyle = ""
	export let containerHoveredStyle = {}
	export let nubStyle = ""
	export let nubHoveredStyle = {}

	//? Props
	export let position
	let prevPosition

	$: {
		if (position !== prevPosition && containerBox) {
			yPosition.current = (position / total) * containerBox.height
			prevPosition = position
		}
	}

	export let total
	export let viewable

	onMount(() => {
		containerBox = container.getBoundingClientRect()

		containerHeight = containerBox.height -
							parseFloat(window.getComputedStyle(container).paddingTop) -
							parseFloat(window.getComputedStyle(container).paddingBottom)

		const moveNub = (y) => {
			//? Nub's dimensions
			const nubBox = nub.getBoundingClientRect()

			//? Center of the nub
			const centerY = Math.round(nubBox.height / 2) + nubBox.top

			//? How far to move to align the center of the nub to the cursor
			//? Because it makes most sense for the center of the nub to be
			//? aligned to your cursor instead of the top
			const deltaY = y - centerY

			//? yPosition represents how far the nub moved measured
			//? (from it's top to the top of the containertop)
			yPosition.current += deltaY

			//? Limit yPosition between 0 and the bottom of the container minus
			//? the nub's height because yPosition represents the position
			//? at the top of the nub (otherwise the nub will only be stopped when
			//? its top touches the bottom)
			yPosition.current = clamp(
				yPosition.current, 0,
				containerHeight - nubBox.height
			)

			dispatch('scroll', {
				//? Calculate the percentage scrolled but subtract the nub's height
				//? this is because we clamped the yPosition, which is the position
				//? of the top of the nub to the total height minus the nub's height

				//? Without subtracting it here as well the percentage will end up
				//? being innacurate because it does not match up with the clamped range
				truePosition: yPosition.current / (containerHeight - nubBox.height),

				//? Here "false" position is still included because the someone using
				//? will probably want to keep a state of the scrollbar that is updated
				//? via event
				position: yPosition.current / (containerHeight),
			})
		}

		const onmousedown = (e) => {
			if (!(e.x < containerBox.right && e.x > containerBox.left)) {
				return
			}

			moveNub(e.y)
			dragging.current = true
		}

		const onmouseup = () => {
			//? Reset Styles
			replaceObjKeysWith(container.style, Object.keys(containerHoveredStyle), "")
			replaceObjKeysWith(nub.style, Object.keys(nubHoveredStyle), "")
			nub.style.backgroundColor = ""

			dragging.current = false
		}

		const onmousemove = (e) => {
			if (dragging.current) {
				moveNub(e.y)
			}
		}

		const ondrag = (e) => e.preventDefault()

		window.addEventListener('mousedown', onmousedown)
		window.addEventListener('mouseup', onmouseup)
		window.addEventListener('mousemove', onmousemove)

		//? To prevent dragging and totally breaking the scrollbar
		window.addEventListener('dragstart', ondrag)

		return () => {
			window.removeEventListener('mousedown', onmousedown)
			window.removeEventListener('mouseup', onmouseup)
			window.removeEventListener('mousemove', onmousemove)
			window.removeEventListener('dragstart', ondrag)
		}
	})

	afterUpdate(() => {
		if (dragging.current) {
			nub.style.backgroundColor = renderedColors.nubClicked

			Object.assign(container.style, containerHoveredStyle)
			Object.assign(nub.style, nubHoveredStyle)
		}
	})
</script>

<div
	class="container" bind:this={container}
	draggable="false"
	style="
		--nubColor: {renderedColors.nub};
		--nubHovered: {renderedColors.nubHovered};
		--backgroundColor: {renderedColors.background};

		--width: {renderedStyling.width};
		--height: {renderedStyling.height};
		--padding: {renderedStyling.padding};

		position: {renderedStyling.cssPosition};
		top: {renderedStyling.top};
		right: {renderedStyling.right};
		left: {renderedStyling.left};
		bottom: {renderedStyling.bottom};

		--hoverTransition: {renderedStyling.hoverTransition};
		--nubBorderRadius: {renderedStyling.borderRadius};

		--nubHeight: {viewable / total * 100}%;
		{containerStyle}
	"
	on:mouseover={ () => Object.assign(container.style, containerHoveredStyle) }
	on:mouseout={ () => replaceObjKeysWith(container.style, Object.keys(containerHoveredStyle), "") }
>
	<div
		class="nub"
		style="
			top: {position / total * 100}%;
			{nubStyle}
		"
		draggable="false"
		on:mouseover={ () => Object.assign(nub.style, nubHoveredStyle) }
		on:mouseout={ () => replaceObjKeysWith(nub.style, Object.keys(nubHoveredStyle), "") }
		bind:this={nub}
	></div>
</div>

<style>
	.container {
		position: var(--position);

		height: calc(var(--height) - 2 * var(--padding));
		width: var(--width);
		padding: var(--padding);

		background-color: var(--backgroundColor);
	}

	.nub {
		width: 100%;
		border-radius: var(--nubBorderRadius);

		height: var(--nubHeight);

		position: relative;
		top: 0;

		background-color: var(--nubColor);
		transition: var(--hoverTransition);
	}

	.nub:hover {
		background-color: var(--nubHovered);
	}
</style>
