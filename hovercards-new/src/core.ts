import type { Placement } from '@floating-ui/dom';
import { computePosition, offset, flip } from '@floating-ui/dom';

import type { ProfileData } from './profile-fetcher';
import fetchProfileWithCache from './profile-fetcher';

type OnHandleGravatarImg = ( img: HTMLImageElement ) => HTMLImageElement;

type OnHovercardShown = ( hash: string ) => void;

type OnHovercardHidden = ( hash: string ) => void;

// TODO: More events for stats
type Options = Partial< {
	placement: Placement;
	offset: number;
	additionalClass: string;
	autoPlacement: boolean;
	onHandleGravatarImg: OnHandleGravatarImg;
	onHovercardShown: OnHovercardShown;
	onHovercardHidden: OnHovercardHidden;
} >;

// TODO: Move it to the user profile API?!
// TODO: Add Gravatar icon and update icons
const socialLinksMap: Record< string, { imgUrl: string; title: string } > = {
	gravatar: {
		imgUrl: 'https://secure.gravatar.com/icons/gravatar.svg',
		title: 'Gravatar',
	},
	wordpress: {
		imgUrl: 'https://secure.gravatar.com/icons/wordpress.svg',
		title: 'WordPress',
	},
	mastodon: {
		imgUrl: 'https://secure.gravatar.com/icons/mastodon-black.svg',
		title: 'Mastodon',
	},
	tumblr: {
		imgUrl: 'https://secure.gravatar.com/icons/tumblr.svg',
		title: 'Tumblr',
	},
	github: {
		imgUrl: 'https://secure.gravatar.com/icons/github.svg',
		title: 'GitHub',
	},
	twitter: {
		imgUrl: 'https://secure.gravatar.com/icons/twitter-alt.svg',
		title: 'Twitter',
	},
};

export default class Hovercards {
	// Options
	#placement: Placement;
	#offset: number;
	#additionalClass: string;
	#autoPlacement: boolean;
	#onHandleGravatarImg: OnHandleGravatarImg;
	#onHovercardShown: OnHovercardShown;
	#onHovercardHidden: OnHovercardHidden;

	// Variables
	static readonly hovercardIdPrefix = 'gravatar-hovercard-';
	#gravatarImages: HTMLImageElement[] = [];
	#showHovercardTimeoutId: ReturnType< typeof setTimeout > | undefined;
	#hideHovercardTimeoutId: ReturnType< typeof setTimeout > | undefined;

	constructor( {
		placement = 'right',
		offset = 10,
		additionalClass = '',
		autoPlacement = true,
		onHandleGravatarImg = ( img ) => img,
		onHovercardShown = () => {},
		onHovercardHidden = () => {},
	}: Options = {} ) {
		this.#placement = placement;
		this.#offset = offset;
		this.#additionalClass = additionalClass;
		this.#autoPlacement = autoPlacement;
		this.#onHandleGravatarImg = onHandleGravatarImg;
		this.#onHovercardShown = onHovercardShown;
		this.#onHovercardHidden = onHovercardHidden;
	}

	#getHash( url: string ) {
		const { hostname, pathname } = new URL( url );
		return hostname.endsWith( 'gravatar.com' ) ? pathname.split( '/' )[ 2 ] : '';
	}

	#getGravatarImages( target: HTMLElement, ignoreSelector: string ) {
		let images: HTMLImageElement[] = [];
		const ignoreImages: HTMLImageElement[] = Array.from( document.querySelectorAll( ignoreSelector ) );

		if ( target.tagName === 'IMG' ) {
			images = [ target as HTMLImageElement ];
		} else {
			images = Array.from( target.querySelectorAll( 'img[src*="gravatar.com/"]' ) );
		}

		this.#gravatarImages = images
			.map( ( img ) => {
				const hash = this.#getHash( img.src );

				if ( ! hash || ignoreImages.includes( img ) ) {
					return null;
				}

				img.setAttribute( 'data-gravatar-hash', hash );

				return this.#onHandleGravatarImg( img );
			} )
			.filter( Boolean ) as HTMLImageElement[];

		return this.#gravatarImages;
	}

	// It can also be used to render an independent hovercard
	static renderHovercard( data: ProfileData, additionalClass?: string ) {
		const {
			hash,
			thumbnailUrl,
			preferredUsername,
			displayName,
			currentLocation,
			aboutMe,
			accounts = [],
		} = data;

		const hovercard = document.createElement( 'div' );
		hovercard.id = `${ Hovercards.hovercardIdPrefix }${ hash }`;
		hovercard.className = `gravatar-hovercard${ additionalClass ? ` ${ additionalClass }` : '' }`;

		const profileUrl = `https://gravatar.com/${ preferredUsername }`;
		const socialLinks = [ { url: profileUrl, shortname: 'gravatar' }, ...accounts ];
		const renderSocialLinks = socialLinks
			.map(
				( { url, shortname }: { url: string; shortname: string } ) => {
					const socialLink = socialLinksMap[ shortname ];

					return socialLink
						? `
              <a class="gravatar-hovercard__social-link" href="${ url }">
                <img class="gravatar-hovercard__social-icon" src="${ socialLink.imgUrl }" width="32px" height="32px" alt="${ socialLink.title }" />
              </a>
            `
						: '';
				}
			)
			.join( '' );

		hovercard.innerHTML = `
      <div class="gravatar-hovercard__header">
        <a class="gravatar-hovercard__avatar-link" href="${ profileUrl }" target="_blank">
          <img class="gravatar-hovercard__avatar" src="${ thumbnailUrl }" width="56px" height="56px" alt="${ displayName }" />
        </a>
        <a class="gravatar-hovercard__info-link" href="${ profileUrl }" target="_blank">
          <h4 class="gravatar-hovercard__name">${ displayName }</h4>
          ${ currentLocation ? `<p class="gravatar-hovercard__location">${ currentLocation }</p>` : '' }
        </a>
      </div>
      ${ aboutMe ? `<p class="gravatar-hovercard__body">${ aboutMe }</p>` : '' }
      <div class="gravatar-hovercard__footer">
        <div class="gravatar-hovercard__social-links">${ renderSocialLinks }</div>
        <a class="gravatar-hovercard__profile-link" href="${ profileUrl }" target="_blank">View profile</a>
      </div>
    `;

		return hovercard;
	}

	#showHovercard( img: HTMLImageElement ) {
		this.#showHovercardTimeoutId = setTimeout( async () => {
			const hash = img.dataset.gravatarHash || '';

			if ( document.getElementById( `${ Hovercards.hovercardIdPrefix }${ hash }` ) ) {
				return;
			}

			let profileData: ProfileData;

			try {
				profileData = await fetchProfileWithCache( hash );

				if ( profileData instanceof Error ) {
					throw profileData;
				}
			} catch ( error ) {
				// TODO: Log the error
				return;
			} finally {
				// TODO: Event and log
			}

			const hovercard = Hovercards.renderHovercard( profileData, this.#additionalClass );
			// To ensure the hovercard is on top of other elements
			document.body.appendChild( hovercard );

			// Don't hide hovercard when mouse is over it
			hovercard.addEventListener( 'mouseenter', () => clearInterval( this.#hideHovercardTimeoutId ) );
			hovercard.addEventListener( 'mouseleave', () => this.#hideHovercard( hash ) );

			const { x, y } = await computePosition( img, hovercard, {
				placement: this.#placement,
				middleware: [
					offset( this.#offset ),
					this.#autoPlacement && flip(),
				],
			} );

			hovercard.style.left = `${ x }px`;
			hovercard.style.top = `${ y }px`;

			this.#onHovercardShown( hash );
		}, 500 );
	}

	#hideHovercard( hash: string ) {
		this.#hideHovercardTimeoutId = setTimeout( () => {
			document.getElementById( `${ Hovercards.hovercardIdPrefix }${ hash }` )?.remove();

			this.#onHovercardHidden( hash );
		}, 300 );
	}

	#handleMouseEnter( e: MouseEvent ) {
		e.stopImmediatePropagation();

		// To avoid multiple hovercards are shown at the same time
		clearInterval( this.#showHovercardTimeoutId );
		this.#showHovercard( e.target as HTMLImageElement );
	}

	#handleMouseLeave( e: MouseEvent ) {
		e.stopImmediatePropagation();

		this.#hideHovercard( ( e.target as HTMLImageElement ).dataset.gravatarHash || '' );
	}

	setTarget( target: HTMLElement, ignoreSelector = '' ) {
		if ( ! target ) {
			return;
		}

		this.unsetTarget();

		const images = this.#getGravatarImages( target, ignoreSelector );

		images.forEach( ( img ) => {
			img.addEventListener( 'mouseenter', this.#handleMouseEnter.bind( this ) );
			img.addEventListener( 'mouseleave', this.#handleMouseLeave.bind( this ) );
		} );
	}

	// To remove all event listeners when React component is unmounted
	unsetTarget() {
		if ( ! this.#gravatarImages.length ) {
			return;
		}

		this.#gravatarImages.forEach( ( img ) => {
			img.removeEventListener( 'mouseenter', this.#handleMouseEnter );
			img.removeEventListener( 'mouseleave', this.#handleMouseLeave );
		} );

		this.#gravatarImages = [];
	}
}
