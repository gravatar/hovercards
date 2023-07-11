import type { Placement } from './compute-position';
import computePosition from './compute-position';

type Account = Record<
	'domain' | 'display' | 'url' | 'iconUrl' | 'username' | 'verified' | 'name' | 'shortname',
	string
>;

interface ProfileData {
	hash: string;
	requestHash: string;
	profileUrl: string;
	preferredUsername: string;
	thumbnailUrl: string;
	status?: string;
	name?: Record< 'givenName' | 'familyName' | 'formatted', string >;
	pronouns?: string;
	displayName: string;
	currentLocation?: string;
	aboutMe?: string;
	photos: Record< 'value' | 'type', string >[];
	urls: Record< 'value' | 'title', string >[];
	profileBackground?: Partial< Record< 'color' | 'url', string > >;
	phoneNumbers?: Record< 'type' | 'value', string >[];
	emails?: Record< 'primary' | 'value', string >[];
	ims?: Record< 'type' | 'value', string >[];
	accounts?: Account[];
	payments?: Partial< Record< 'paypalme' | 'patreon' | 'venmo', string > >;
	currency?: Record< 'type' | 'value', string >[];
}

type OnQueryGravatarImg = ( img: HTMLImageElement ) => HTMLImageElement;

type OnFetchProfileStart = ( hash: string ) => void;

type OnFetchProfileSuccess = ( profileData: ProfileData ) => void;

type OnFetchProfilFailure = ( hash: string, error: Error ) => void;

type OnHovercardShown = ( profileData: ProfileData, hovercard: HTMLDivElement ) => void;

type OnHovercardHidden = ( profileData: ProfileData, hovercard: HTMLDivElement ) => void;

type Options = Partial< {
	placement: Placement;
	autoFlip: boolean;
	offset: number;
	additionalClass: string;
	onQueryGravatarImg: OnQueryGravatarImg;
	onFetchProfileStart: OnFetchProfileStart;
	onFetchProfileSuccess: OnFetchProfileSuccess;
	onFetchProfilFailure: OnFetchProfilFailure;
	onHovercardShown: OnHovercardShown;
	onHovercardHidden: OnHovercardHidden;
} >;

const BASE_API_URL = 'https://secure.gravatar.com';

// Ordering matters
const allowedSocialServices = [ 'gravatar', 'wordpress', 'mastodon', 'tumblr', 'github', 'twitter' ];

export default class Hovercards {
	// Options
	#placement: Placement;
	#autoFlip: boolean;
	#offset: number;
	#additionalClass: string;
	#onQueryGravatarImg: OnQueryGravatarImg;
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
		autoFlip = true,
		offset = 10,
		additionalClass = '',
		onQueryGravatarImg = ( img ) => img,
		onFetchProfileStart = () => {},
		onFetchProfileSuccess = () => {},
		onFetchProfilFailure = () => {},
		onHovercardShown = () => {},
		onHovercardHidden = () => {},
	}: Options = {} ) {
		this.#placement = placement;
		this.#autoFlip = autoFlip;
		this.#offset = offset;
		this.#additionalClass = additionalClass;
		this.#onQueryGravatarImg = onQueryGravatarImg;
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

				return this.#onQueryGravatarImg( img );
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
		const socialLinks: Partial< Account >[] = [
			{
				url: profileUrl,
				iconUrl: 'https://secure.gravatar.com/icons/gravatar.svg',
				name: 'Gravatar',
				shortname: 'gravatar',
			},
			...accounts,
		];
		const renderSocialLinks = socialLinks
			.reduce( ( links, { url, shortname, iconUrl, name } ) => {
				const idx = allowedSocialServices.indexOf( shortname );

				if ( idx !== -1 ) {
					links[ idx ] = `
						<a class="gravatar-hovercard__social-link" href="${ url }" data-service-name="${ shortname }" data-service-name=${ shortname }">
							<img class="gravatar-hovercard__social-icon" src="${ iconUrl }" width="32px" height="32px" alt="${ name }" />
						</a>
					`;
				}

				return links;
			}, [] )
			.join( '' );

		hovercard.innerHTML = `
			<div class="gravatar-hovercard__header">
				<a class="gravatar-hovercard__avatar-link" href="${ profileUrl }" target="_blank">
					<img class="gravatar-hovercard__avatar" src="${ thumbnailUrl }" width="56px" height="56px" alt="${ displayName }" />
				</a>
				<a class="gravatar-hovercard__name-location-link" href="${ profileUrl }" target="_blank">
					<h4 class="gravatar-hovercard__name">${ displayName }</h4>
					${ currentLocation ? `<p class="gravatar-hovercard__location">${ currentLocation }</p>` : '' }
				</a>
			</div>
			<div class="gravatar-hovercard__body">
				${ aboutMe ? `<p class="gravatar-hovercard__about">${ aboutMe }</p>` : '' }
			</div>
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

			let profileData = this.#cachedProfiles.get( hash );

			if ( ! profileData ) {
				try {
					this.#onFetchProfileStart( hash );

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
					this.#onFetchProfilFailure( hash, error as Error );
					return;
				}
			}

			const hovercard = Hovercards.createHovercard( profileData, this.#additionalClass );
			// Placing the hovercard at the top-level of the document to avoid being clipped by overflow
			document.body.appendChild( hovercard );

			// Don't hide the hovercard when mouse is over it
			hovercard.addEventListener( 'mouseenter', () => clearInterval( this.#hideHovercardTimeoutId ) );
			hovercard.addEventListener( 'mouseleave', () => this.#hideHovercard( hash ) );

			const { x, y } = computePosition( img, hovercard, {
				placement: this.#placement,
				offset: this.#offset,
				autoFlip: this.#autoFlip,
			} );

			hovercard.style.position = 'absolute';
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
