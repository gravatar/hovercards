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

interface ReturnValues {
	x: number;
	y: number;
	padding: 'paddingBottom' | 'paddingTop' | 'paddingRight' | 'paddingLeft';
	paddingValue: number;
}

const paddingMap: Record< string, ReturnValues[ 'padding' ] > = {
	top: 'paddingBottom',
	bottom: 'paddingTop',
	left: 'paddingRight',
	right: 'paddingLeft',
};

/**
 * Calculates the position and padding of a card relative to an image element.
 *
 * @param {HTMLImageElement} img       - The image element.
 * @param {HTMLDivElement}   card      - The card element.
 * @param {Options}          [options] - Options for computing the position.
 * @return {ReturnValues}              - Computed position values.
 */
export default function computingPosition(
	img: HTMLImageElement,
	card: HTMLDivElement,
	{ placement = 'right', offset = 0, autoFlip = true }: Options = {}
): ReturnValues {
	const imgRect = img.getBoundingClientRect();
	const cardRect = card.getBoundingClientRect();
	const imgScrollT = imgRect.top + scrollY;
	const imgScrollB = imgRect.bottom + scrollY;
	const imgScrollR = imgRect.right + scrollX;
	const imgScrollL = imgRect.left + scrollX;
	let x = 0;
	let y = 0;
	let [ dir, align ] = placement.split( '-' );
	offset = Math.max( 0, offset );

	if ( autoFlip ) {
		const topSpace = imgRect.top;
		const bottomSpace = innerHeight - imgRect.bottom;
		const leftSpace = imgRect.left;
		const rightSpace = innerWidth - imgRect.right;
		const floatingSpaceV = cardRect.height + offset;
		const floatingSpaceH = cardRect.width + offset;

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
		x = imgScrollL + imgRect.width / 2 - cardRect.width / 2;
		y = dir === 'top' ? imgScrollT - cardRect.height - offset : imgScrollB;

		if ( align === 'start' ) {
			x = imgScrollL;
		}

		if ( align === 'end' ) {
			x = imgScrollR - cardRect.width;
		}
	} else {
		x = dir === 'right' ? imgScrollR : imgScrollL - cardRect.width - offset;
		y = imgScrollT + imgRect.height / 2 - cardRect.height / 2;

		if ( align === 'start' ) {
			y = imgScrollT;
		}

		if ( align === 'end' ) {
			y = imgScrollB - cardRect.height;
		}
	}

	return { x, y, padding: paddingMap[ dir ], paddingValue: offset };
}
