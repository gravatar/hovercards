import type { Placement } from './compute-position';
import computePosition from './compute-position';

type Account = Record<
	'domain' | 'display' | 'url' | 'iconUrl' | 'username' | 'verified' | 'name' | 'shortname',
	string
>;

interface ProfileData {
	requestHash: string;
	preferredUsername: string;
	thumbnailUrl: string;
	displayName: string;
	currentLocation?: string;
	aboutMe?: string;
	accounts?: Account[];
}

export type CreateHovercard = (
	profileData: ProfileData,
	options?: { additionalClass?: string; myHash?: string }
) => HTMLDivElement;

type OnQueryGravatarImg = ( img: HTMLImageElement ) => HTMLImageElement;

type OnFetchProfileStart = ( hash: string ) => void;

type OnFetchProfileSuccess = ( profileData: ProfileData ) => void;

type OnFetchProfilFailure = ( hash: string, error: Error ) => void;

type OnHovercardShown = ( profileData: ProfileData | undefined, hovercard: HTMLDivElement ) => void;

type OnHovercardHidden = ( profileData: ProfileData, hovercard: HTMLDivElement ) => void;

type Options = Partial< {
	placement: Placement;
	offset: number;
	autoFlip: boolean;
	delayToShow: number;
	delayToHide: number;
	additionalClass: string;
	myHash: string;
	onQueryGravatarImg: OnQueryGravatarImg;
	onFetchProfileStart: OnFetchProfileStart;
	onFetchProfileSuccess: OnFetchProfileSuccess;
	onFetchProfilFailure: OnFetchProfilFailure;
	onHovercardShown: OnHovercardShown;
	onHovercardHidden: OnHovercardHidden;
} >;

const BASE_API_URL = 'https://secure.gravatar.com';

const socialLinksOrder = [ 'wordpress', 'mastodon', 'tumblr', 'github', 'twitter' ];

export default class Hovercards {
	// Options
	#placement: Placement;
	#offset: number;
	#autoFlip: boolean;
	#delayToShow: number;
	#delayToHide: number;
	#additionalClass: string;
	#myHash: string;
	#onQueryGravatarImg: OnQueryGravatarImg;
	#onFetchProfileStart: OnFetchProfileStart;
	#onFetchProfileSuccess: OnFetchProfileSuccess;
	#onFetchProfilFailure: OnFetchProfilFailure;
	#onHovercardShown: OnHovercardShown;
	#onHovercardHidden: OnHovercardHidden;

	// Variables
	static readonly hovercardIdPrefix = 'gravatar-hovercard-';
	#gravatarImages: HTMLImageElement[] = [];
	#showHovercardTimeoutIds = new Map< string, ReturnType< typeof setTimeout > >();
	#hideHovercardTimeoutIds = new Map< string, ReturnType< typeof setTimeout > >();
	#cachedProfiles = new Map< string, ProfileData >();

	constructor( {
		placement = 'right',
		autoFlip = true,
		offset = 10,
		delayToShow = 500,
		delayToHide = 300,
		additionalClass = '',
		myHash = '',
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
		this.#delayToShow = delayToShow;
		this.#delayToHide = delayToHide;
		this.#additionalClass = additionalClass;
		this.#myHash = myHash;
		this.#onQueryGravatarImg = onQueryGravatarImg;
		this.#onFetchProfileStart = onFetchProfileStart;
		this.#onFetchProfileSuccess = onFetchProfileSuccess;
		this.#onFetchProfilFailure = onFetchProfilFailure;
		this.#onHovercardShown = onHovercardShown;
		this.#onHovercardHidden = onHovercardHidden;
	}

	/**
	 * Queries Gravatar images within the target element.
	 *
	 * @param {HTMLElement} target           - The target element to query.
	 * @param {string}      [ignoreSelector] - The selector to ignore specific images.
	 * @return {HTMLImageElement[]}          - The queried Gravatar images.
	 * @private
	 */
	#queryGravatarImages( target: HTMLElement, ignoreSelector?: string ) {
		let images: HTMLImageElement[] = [];
		const ignoreImages: HTMLImageElement[] = ignoreSelector
			? Array.from( document.querySelectorAll( ignoreSelector ) )
			: [];

		if ( target.tagName === 'IMG' ) {
			images = [ target as HTMLImageElement ];
		} else {
			images = Array.from( target.querySelectorAll( 'img[src*="gravatar.com/"]' ) );
		}

		this.#gravatarImages = images
			.map( ( img ) => {
				if ( ignoreImages.includes( img ) ) {
					return null;
				}

				const { hostname, pathname } = new URL( img.src );

				if ( ! hostname.endsWith( 'gravatar.com' ) ) {
					return null;
				}

				const hash = pathname.split( '/' )[ 2 ];

				if ( ! hash ) {
					return null;
				}

				img.setAttribute( 'data-gravatar-hash', hash );

				return this.#onQueryGravatarImg( img );
			} )
			.filter( Boolean ) as HTMLImageElement[];

		return this.#gravatarImages;
	}

	/**
	 * Creates a skeleton hovercard element.
	 *
	 * @param {string} hash - The hash associated with the hovercard.
	 * @return {HTMLDivElement} - The created skeleton hovercard element.
	 */
	#createHovercardSkeleton( hash: string ) {
		const hovercard = document.createElement( 'div' );
		hovercard.id = `${ Hovercards.hovercardIdPrefix }${ hash }`;
		hovercard.className = `gravatar-hovercard gravatar-hovercard--skeleton${
			this.#additionalClass ? ` ${ this.#additionalClass }` : ''
		}`;

		hovercard.innerHTML = `
			<div class="gravatar-hovercard__inner">
				<div class="gravatar-hovercard__header">
					<a class="gravatar-hovercard__avatar-link"></a>
					<a class="gravatar-hovercard__name-location-link"></a>
				</div>
				<div class="gravatar-hovercard__footer">
					<div class="gravatar-hovercard__social-links">
						<a class="gravatar-hovercard__social-link"></a>
					</div>
					<a class="gravatar-hovercard__profile-link""></a>
				</div>
			</div>
    `;

		return hovercard;
	}

	/**
	 * Creates a hovercard element with the provided profile data.
	 * Note: Ensure that the profile data is sanitized to prevent potential security vulnerabilities.
	 *
	 * @param {ProfileData} profileData               - The profile data to populate the hovercard.
	 * @param {Object}      [options]                 - Optional parameters for the hovercard.
	 * @param {string}      [options.additionalClass] - Additional CSS class for the hovercard.
	 * @param {string}      [options.myHash]          - The hash associated with the user's Gravatar image.
	 * @return {HTMLDivElement}               - The created hovercard element.
	 */
	static createHovercard: CreateHovercard = ( profileData, { additionalClass, myHash } = {} ) => {
		const {
			requestHash,
			thumbnailUrl,
			preferredUsername,
			displayName,
			currentLocation,
			aboutMe,
			accounts = [],
		} = profileData;

		const hovercard = document.createElement( 'div' );
		hovercard.id = `${ Hovercards.hovercardIdPrefix }${ requestHash }`;
		hovercard.className = `gravatar-hovercard${ additionalClass ? ` ${ additionalClass }` : '' }`;

		const profileUrl = `https://gravatar.com/${ preferredUsername }`;
		const renderSocialLinks = accounts
			.reduce( ( links, { url, shortname, iconUrl, name } ) => {
				const idx = socialLinksOrder.indexOf( shortname );

				if ( idx !== -1 ) {
					links[ idx ] = `
						<a class="gravatar-hovercard__social-link" href="${ url }" data-service-name="${ shortname }">
							<img class="gravatar-hovercard__social-icon" src="${ iconUrl }" width="32px" height="32px" alt="${ name }" />
						</a>
					`;
				}

				return links;
			}, [] )
			.join( '' );

		hovercard.innerHTML = `
			<div class="gravatar-hovercard__inner">
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
					<div class="gravatar-hovercard__social-links">
						<a class="gravatar-hovercard__social-link" href="${ profileUrl }" data-service-name="gravatar">
							<img class="gravatar-hovercard__social-icon" src="https://secure.gravatar.com/icons/gravatar.svg" width="32px" height="32px" alt="Gravatar" />
						</a>
						${ renderSocialLinks }
					</div>
					${
						! aboutMe && myHash === requestHash
							? '<a class="gravatar-hovercard__profile-link gravatar-hovercard__profile-link--edit" href="https://en.gravatar.com/profiles/edit" target="_blank">Edit your profile</a>'
							: `<a class="gravatar-hovercard__profile-link" href="${ profileUrl }" target="_blank">View profile</a>`
					}
				</div>
			</div>
    `;

		return hovercard;
	};

	/**
	 * Waits for a specified delay and fetches the user's profile data,
	 * then shows the hovercard for the specified hash and image element.
	 *
	 * @param {string}           hash - The hash associated with the hovercard.
	 * @param {HTMLImageElement} img  - The image element triggering the hovercard.
	 * @return {void}
	 * @private
	 */
	#showHovercard( hash: string, img: HTMLImageElement ) {
		const id = setTimeout( () => {
			if ( document.getElementById( `${ Hovercards.hovercardIdPrefix }${ hash }` ) ) {
				return;
			}

			let hovercard: HTMLDivElement;

			if ( this.#cachedProfiles.has( hash ) ) {
				hovercard = Hovercards.createHovercard( this.#cachedProfiles.get( hash ), {
					additionalClass: this.#additionalClass,
					myHash: this.#myHash,
				} );
			} else {
				hovercard = this.#createHovercardSkeleton( hash );

				this.#onFetchProfileStart( hash );

				fetch( `${ BASE_API_URL }/${ hash }.json` )
					.then( ( res ) => res.json() )
					.then( ( data ) => {
						// API error handling
						if ( ! data?.entry ) {
							// The data will be an error message
							throw new Error( data );
						}

						const {
							requestHash,
							thumbnailUrl,
							preferredUsername,
							displayName,
							currentLocation,
							aboutMe,
							accounts,
						} = data.entry[ 0 ];

						this.#cachedProfiles.set( hash, {
							requestHash,
							thumbnailUrl,
							preferredUsername,
							displayName,
							currentLocation,
							aboutMe,
							accounts,
						} );

						const hovercardChildren = Hovercards.createHovercard( this.#cachedProfiles.get( hash ), {
							additionalClass: this.#additionalClass,
							myHash: this.#myHash,
						} ).firstElementChild;

						hovercard.classList.remove( 'gravatar-hovercard--skeleton' );
						hovercard.replaceChildren( hovercardChildren );

						this.#onFetchProfileSuccess( this.#cachedProfiles.get( hash ) );
					} )
					.catch( ( error ) => {
						hovercard.firstElementChild.innerHTML =
							'<i class="gravatar-hovercard__error-message">Sorry, we weren’t able to load this Gravatar profile card. Please check your internet connection.</i>';

						this.#onFetchProfilFailure( hash, error as Error );
					} );
			}

			// Placing the hovercard at the top-level of the document to avoid being clipped by overflow
			document.body.appendChild( hovercard );

			// Don't hide the hovercard when the mouse is over the hovercard from the image
			hovercard.addEventListener( 'mouseenter', () =>
				clearInterval( this.#hideHovercardTimeoutIds.get( hash ) )
			);
			hovercard.addEventListener( 'mouseleave', () => this.#hideHovercard( hash ) );

			const { x, y, padding, paddingValue } = computePosition( img, hovercard, {
				placement: this.#placement,
				offset: this.#offset,
				autoFlip: this.#autoFlip,
			} );

			hovercard.style.position = 'absolute';
			hovercard.style.left = `${ x }px`;
			hovercard.style.top = `${ y }px`;
			// To bridge the gap between the image and the hovercard,
			// ensuring that the hovercard remains visible when the mouse hovers over the gap
			hovercard.style[ padding ] = `${ paddingValue }px`;

			this.#onHovercardShown( this.#cachedProfiles.get( hash ), hovercard );
		}, this.#delayToShow );

		this.#showHovercardTimeoutIds.set( hash, id );
	}

	/**
	 * Waits for a specified delay and hides the hovercard for the specified hash.
	 *
	 * @param {string} hash - The hash associated with the hovercard.
	 * @return {void}
	 * @private
	 */
	#hideHovercard( hash: string ) {
		const id = setTimeout( () => {
			const hovercard = document.getElementById( `${ Hovercards.hovercardIdPrefix }${ hash }` );

			if ( hovercard ) {
				hovercard.remove();
				this.#onHovercardHidden( this.#cachedProfiles.get( hash )!, hovercard as HTMLDivElement );
			}
		}, this.#delayToHide );

		this.#hideHovercardTimeoutIds.set( hash, id );
	}

	/**
	 * Handles the mouseenter event for Gravatar images.
	 *
	 * @param {MouseEvent} e - The mouseenter event object.
	 * @return {void}
	 * @private
	 */
	#handleMouseEnter( e: MouseEvent ) {
		e.stopImmediatePropagation();

		const img = e.target as HTMLImageElement;
		const hash = img.dataset.gravatarHash || '';

		// Don't hide the hovercard when the mouse is over the image from the hovercard
		clearInterval( this.#hideHovercardTimeoutIds.get( hash ) );
		this.#showHovercard( hash, img );
	}

	/**
	 * Handles the mouseleave event for Gravatar images.
	 *
	 * @param {MouseEvent} e - The mouseleave event object.
	 * @return {void}
	 * @private
	 */
	#handleMouseLeave( e: MouseEvent ) {
		e.stopImmediatePropagation();

		const hash = ( e.target as HTMLImageElement ).dataset.gravatarHash || '';

		clearInterval( this.#showHovercardTimeoutIds.get( hash ) );
		this.#hideHovercard( hash );
	}

	/**
	 * Sets the target element and attaches event listeners to Gravatar images within the target element.
	 *
	 * @param {HTMLElement} target           - The target element to set.
	 * @param {string}      [ignoreSelector] - The selector to ignore specific images.
	 * @return {void}
	 */
	setTarget( target: HTMLElement, ignoreSelector?: string ) {
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

	/**
	 * Unsets the target element and removes event listeners from Gravatar images.
	 *
	 * @return {void}
	 */
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
