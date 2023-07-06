import type { Placement } from '@floating-ui/dom';
import { computePosition, offset, flip } from '@floating-ui/dom';

// TODO: Refine the type
type ProfileData = Record< string, any >;

type ProcessGravatarImg = ( img: HTMLImageElement ) => HTMLImageElement;

type OnFetchProfileStart = () => void;

type OnFetchProfileSuccess = ( profileData: ProfileData ) => void;

type OnFetchProfilFailure = ( error: Error ) => void;

type OnHovercardShown = ( profileData: ProfileData, hovercard: HTMLDivElement  ) => void;

type OnHovercardHidden = ( profileData: ProfileData, hovercard: HTMLDivElement ) => void;

type Options = Partial< {
	placement: Placement;
	autoPlacement: boolean;
	offset: number;
	additionalClass: string;
	processGravatarImg: ProcessGravatarImg;
	onFetchProfileStart: OnFetchProfileStart;
	onFetchProfileSuccess: OnFetchProfileSuccess;
	onFetchProfilFailure: OnFetchProfilFailure;
	onHovercardShown: OnHovercardShown;
	onHovercardHidden: OnHovercardHidden;
} >;

const BASE_API_URL = 'https://secure.gravatar.com';

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
	#processGravatarImg: ProcessGravatarImg;
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
	#cachedProfiles = new Map< string, ProfileData >();

	constructor( {
		placement = 'right',
		autoPlacement = true,
		offset = 10,
		additionalClass = '',
		processGravatarImg = ( img ) => img,
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
		this.#processGravatarImg = processGravatarImg;
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

	getGravatarImages() {
		return this.#gravatarImages;
	}

	#queryGravatarImages( target: HTMLElement, ignoreSelector: string ) {
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

				return this.#processGravatarImg( img );
			} )
			.filter( Boolean ) as HTMLImageElement[];

		return this.#gravatarImages;
	}

	// It can also be used to render an independent hovercard
	static createHovercard( profileData: ProfileData, additionalClass?: string ) {
		const {
			hash,
			thumbnailUrl,
			preferredUsername,
			displayName,
			currentLocation,
			aboutMe,
			accounts = [],
		} = profileData;

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
              <a class="gravatar-hovercard__social-link" href="${ url }" data-service-name="${ shortname }" data-service-name=${ shortname }">
                <img class="gravatar-hovercard__social-icon" src="${ socialLink.imgUrl }" width="32px" height="32px" alt="${ socialLink.title }" />
              </a>
            `
						: '';
				}
			)
			.join( '' );

		hovercard.innerHTML = `
			<a class="gravatar-hovercard__user-link" href="${ profileUrl }" target="_blank">
				<img class="gravatar-hovercard__avatar" src="${ thumbnailUrl }" width="56px" height="56px" alt="${ displayName }" />
				<div class="gravatar-hovercard__name-location-wrapper">
					<h4 class="gravatar-hovercard__name">${ displayName }</h4>
					${ currentLocation ? `<p class="gravatar-hovercard__location">${ currentLocation }</p>` : '' }
				</div>
			</a>
      ${ aboutMe ? `<p class="gravatar-hovercard__about">${ aboutMe }</p>` : '' }
      <div class="gravatar-hovercard__social-view-profile-wrapper">
        <div class="gravatar-hovercard__social-links">${ renderSocialLinks }</div>
        <a class="gravatar-hovercard__view-profile-link" href="${ profileUrl }" target="_blank">View profile</a>
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

			let profileData = this.#cachedProfiles.get( hash );

			if ( ! profileData ) {
				try {
					this.#onFetchProfileStart();
	
					const res = await fetch( `${ BASE_API_URL }/${ hash }.json` );
					const data = await res.json();
	
					// API error handling
					if ( ! data?.entry ) {
						// The data will be an error message
						throw new Error( data );
					}
	
					profileData = data.entry[ 0 ] as ProfileData;
					this.#cachedProfiles.set( hash, profileData );

					this.#onFetchProfileSuccess( profileData );
				} catch ( error ) {
					this.#onFetchProfilFailure( error as Error );
					return;
				}
			}

			const hovercard = Hovercards.createHovercard( profileData, this.#additionalClass );
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

			this.#onHovercardShown( profileData, hovercard );
		}, 500 );
	}

	#hideHovercard( hash: string ) {
		this.#hideHovercardTimeoutId = setTimeout( () => {
			const hovercard = document.getElementById( `${ Hovercards.hovercardIdPrefix }${ hash }` );

			if ( hovercard ) {
				hovercard.remove();
				this.#onHovercardHidden( this.#cachedProfiles.get( hash )!, hovercard as HTMLDivElement );
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

		const images = this.#queryGravatarImages( target, ignoreSelector );

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
