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
	const referenceScrollT = referenceRect.top + scrollY;
	const referenceScrollB = referenceRect.bottom + scrollY;
	const referenceScrollR = referenceRect.right + scrollX;
	const referenceScrollL = referenceRect.left + scrollX;
	let x = 0;
	let y = 0;
	let [ dir, align ] = placement.split( '-' );
	offset = Math.max( 0, offset );

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
		x = referenceScrollL + referenceRect.width / 2 - floatingRect.width / 2;
		y = dir === 'top' ? referenceScrollT - floatingRect.height - offset : referenceScrollB + offset;

		if ( align === 'start' ) {
			x = referenceScrollL;
		}

		if ( align === 'end' ) {
			x = referenceScrollR - floatingRect.width;
		}
	} else {
		x = dir === 'right' ? referenceScrollR + offset : referenceScrollL - floatingRect.width - offset;
		y = referenceScrollT + referenceRect.height / 2 - floatingRect.height / 2;

		if ( align === 'start' ) {
			y = referenceScrollT;
		}

		if ( align === 'end' ) {
			y = referenceScrollB - floatingRect.height;
		}
	}

	return { x, y };
}
