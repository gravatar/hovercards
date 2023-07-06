import type { Placement } from '@floating-ui/dom';
import { computePosition, offset, flip } from '@floating-ui/dom';

import type { ProfileData } from './profile-fetcher';
import fetchProfileWithCache, { cachedProfiles } from './profile-fetcher';

type OnHandleGravatarImg = ( img: HTMLImageElement ) => HTMLImageElement;

type OnFetchProfileStart = () => void;

type OnFetchProfileSuccess = ( data: ProfileData ) => void;

type OnFetchProfilFailure = ( error: Error ) => void;

type OnHovercardShown = ( data: ProfileData ) => void;

type OnHovercardHidden = ( data: ProfileData ) => void;

type Options = Partial< {
	placement: Placement;
	autoPlacement: boolean;
	offset: number;
	additionalClass: string;
	onHandleGravatarImg: OnHandleGravatarImg;
	onFetchProfileStart: OnFetchProfileStart;
	onFetchProfileSuccess: OnFetchProfileSuccess;
	onFetchProfilFailure: OnFetchProfilFailure;
	onHovercardShown: OnHovercardShown;
	onHovercardHidden: OnHovercardHidden;
} >;

// TODO: Move it to the user profile API?!
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
	#autoPlacement: boolean;
	#offset: number;
	#additionalClass: string;
	#onHandleGravatarImg: OnHandleGravatarImg;
	#onFetchProfileStart: OnFetchProfileStart;
	#onFetchProfileSuccess: OnFetchProfileSuccess;
	#onFetchProfilFailure: OnFetchProfilFailure;
	#onHovercardShown: OnHovercardShown;
	#onHovercardHidden: OnHovercardHidden;

	// Variables
	static readonly hovercardIdPrefix = 'gravatar-hovercard-';
	#gravatarImages: HTMLImageElement[] = [];
	#showHovercardTimeoutId: ReturnType< typeof setTimeout > | undefined;
	#hideHovercardTimeoutId: ReturnType< typeof setTimeout > | undefined;

	constructor( {
		placement = 'right',
		autoPlacement = true,
		offset = 10,
		additionalClass = '',
		onHandleGravatarImg = ( img ) => img,
		onFetchProfileStart = () => {},
		onFetchProfileSuccess = () => {},
		onFetchProfilFailure = () => {},
		onHovercardShown = () => {},
		onHovercardHidden = () => {},
	}: Options = {} ) {
		this.#placement = placement;
		this.#autoPlacement = autoPlacement;
		this.#offset = offset;
		this.#additionalClass = additionalClass;
		this.#onHandleGravatarImg = onHandleGravatarImg;
		this.#onFetchProfileStart = onFetchProfileStart;
		this.#onFetchProfileSuccess = onFetchProfileSuccess;
		this.#onFetchProfilFailure = onFetchProfilFailure;
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
	static createHovercard( data: ProfileData, additionalClass?: string ) {
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

			let data: ProfileData;

			try {
				this.#onFetchProfileStart();

				data = await fetchProfileWithCache( hash );

				if ( data instanceof Error ) {
					throw data;
				}

				this.#onFetchProfileSuccess( data );
			} catch ( error ) {
				this.#onFetchProfilFailure( error as Error );
				return;
			}

			const hovercard = Hovercards.createHovercard( data, this.#additionalClass );
			// Placing the hovercard at the top-level of the document to avoid being clipped by overflow
			document.body.appendChild( hovercard );

			// Don't hide the hovercard when mouse is over it
			hovercard.addEventListener( 'mouseenter', () => clearInterval( this.#hideHovercardTimeoutId ) );
			hovercard.addEventListener( 'mouseleave', () => this.#hideHovercard( hash ) );

			const { x, y } = await computePosition( img, hovercard, {
				placement: this.#placement,
				middleware: [ offset( this.#offset ), this.#autoPlacement && flip() ],
			} );

			hovercard.style.left = `${ x }px`;
			hovercard.style.top = `${ y }px`;

			this.#onHovercardShown( data );
		}, 500 );
	}

	#hideHovercard( hash: string ) {
		this.#hideHovercardTimeoutId = setTimeout( () => {
			const hovercard = document.getElementById( `${ Hovercards.hovercardIdPrefix }${ hash }` );

			if ( hovercard ) {
				hovercard.remove();
				this.#onHovercardHidden( cachedProfiles.get( hash )! );
			}			
		}, 300 );
	}

	#handleMouseEnter( e: MouseEvent ) {
		e.stopImmediatePropagation();

		this.#showHovercard( e.target as HTMLImageElement );
	}

	#handleMouseLeave( e: MouseEvent ) {
		e.stopImmediatePropagation();

		clearInterval( this.#showHovercardTimeoutId );
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
