export type Placement =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'left'
	| 'left-start'
	| 'left-end'
	| 'right'
	| 'right-start'
	| 'right-end';

type Options = Partial< {
	placement: Placement;
	offset: number;
	autoFlip: boolean;
} >;

export default function computingPosition(
	reference: HTMLElement,
	floating: HTMLElement,
	{ placement = 'right', offset = 0, autoFlip = true }: Options = {}
) {
	const referenceRect = reference.getBoundingClientRect();
	const floatingRect = floating.getBoundingClientRect();
	const referenceRectT = referenceRect.top + scrollY;
	const referenceRectB = referenceRect.bottom + scrollY;
	const referenceRectR = referenceRect.right + scrollX;
	const referenceRectL = referenceRect.left + scrollX;
	let x = referenceRectR + offset;
	let y = referenceRectT - floatingRect.height / 2 + referenceRect.height / 2;
	let [ dir, align = 'middle' ] = placement.split( '-' );

	if ( autoFlip ) {
		const topSpace = referenceRect.top;
		const bottomSpace = innerHeight - referenceRect.bottom;
		const leftSpace = referenceRect.left;
		const rightSpace = innerWidth - referenceRect.right;
		const floatingSpaceV = floatingRect.height + offset;
		const floatingSpaceH = floatingRect.width + offset;

		if ( dir === 'top' && topSpace < floatingSpaceV && bottomSpace > topSpace ) {
			dir = 'bottom';
		}

		if ( dir === 'bottom' && bottomSpace < floatingSpaceV && topSpace > bottomSpace ) {
			dir = 'top';
		}

		if ( dir === 'left' && leftSpace < floatingSpaceH && rightSpace > leftSpace ) {
			dir = 'right';
		}

		if ( dir === 'right' && rightSpace < floatingSpaceH && leftSpace > rightSpace ) {
			dir = 'left';
		}
	}

	if ( dir === 'top' || dir === 'bottom' ) {
		x = referenceRectL + referenceRect.width / 2 - floatingRect.width / 2;
		y = dir === 'top' ? referenceRectT - floatingRect.height - offset : referenceRectB + offset;

		if ( align === 'start' ) {
			x = referenceRectL;
		}

		if ( align === 'end' ) {
			x = referenceRectR - floatingRect.width;
		}
	}

  if ( dir === 'left' || dir === 'right' ) {
		if ( dir === 'left' ) {
			x = referenceRectL - floatingRect.width - offset;
		}

		if ( align === 'start' ) {
			y = referenceRectT;
		}

		if ( align === 'end' ) {
			y = referenceRectB - floatingRect.height;
		}
	}

	return { x, y };
}
