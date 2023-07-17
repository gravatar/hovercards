import type { Placement } from './compute-position';
import computePosition from './compute-position';
import { escUrl, escHtml } from './sanitizer';

type Account = Record<
	'domain' | 'display' | 'url' | 'iconUrl' | 'username' | 'verified' | 'name' | 'shortname',
	string
>;

interface ProfileData {
	hash: string;
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

type OnFetchProfileSuccess = ( hash: string, profileData: ProfileData ) => void;

type OnFetchProfilFailure = ( hash: string, error: Error ) => void;

type OnHovercardShown = ( hash: string, hovercard: HTMLDivElement ) => void;

type OnHovercardHidden = ( hash: string, hovercard: HTMLDivElement ) => void;

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

interface GravatarImg {
	id: string;
	hash: string;
	params: string;
	img: HTMLImageElement;
}

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
	#gravatarImages: GravatarImg[] = [];
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
			.map( ( img, idx ) => {
				if ( ignoreImages.includes( img ) ) {
					return null;
				}

				const { hostname, pathname, searchParams: p } = new URL( img.src );

				if ( ! hostname.endsWith( 'gravatar.com' ) ) {
					return null;
				}

				const hash = pathname.split( '/' )[ 2 ];

				if ( ! hash ) {
					return null;
				}

				const d = p.get( 'd' ) || p.get( 'default' );
				const r = p.get( 'r' ) || p.get( 'rating' );
				const params = [ d && `d=${ d }`, r && `r=${ r }` ].filter( Boolean ).join( '&' );

				return {
					id: `gravatar-hovercard-${ hash }-${ idx }`,
					hash,
					params: params ? `?${ params }` : '',
					img: this.#onQueryGravatarImg( img ) || img,
				};
			} )
			.filter( Boolean );

		return this.#gravatarImages;
	}

	/**
	 * Creates a skeleton hovercard element.
	 *
	 * @return {HTMLDivElement} The created skeleton hovercard element.
	 */
	#createHovercardSkeleton() {
		const hovercard = document.createElement( 'div' );
		hovercard.className = `gravatar-hovercard gravatar-hovercard--skeleton${
			this.#additionalClass ? ` ${ this.#additionalClass }` : ''
		}`;

		hovercard.innerHTML = `
			<div class="gravatar-hovercard__inner">
				<div class="gravatar-hovercard__header">
					<div class="gravatar-hovercard__avatar-link"></div>
					<div class="gravatar-hovercard__name-location-link"></div>
				</div>
				<div class="gravatar-hovercard__footer">
					<div class="gravatar-hovercard__social-link"></div>
					<div class="gravatar-hovercard__profile-link""></div>
				</div>
			</div>
    `;

		return hovercard;
	}

	/**
	 * Creates a hovercard element with the provided profile data.
	 *
	 * @param {ProfileData} profileData               - The profile data to populate the hovercard.
	 * @param {Object}      [options]                 - Optional parameters for the hovercard.
	 * @param {string}      [options.additionalClass] - Additional CSS class for the hovercard.
	 * @param {string}      [options.myHash]          - The hash associated with the user's Gravatar image.
	 * @return {HTMLDivElement}               - The created hovercard element.
	 */
	static createHovercard: CreateHovercard = ( profileData, { additionalClass, myHash } = {} ) => {
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
		hovercard.className = `gravatar-hovercard${ additionalClass ? ` ${ additionalClass }` : '' }`;

		const profileUrl = escUrl( `https://gravatar.com/${ preferredUsername }` );
		const username = escHtml( displayName );
		const renderSocialLinks = accounts
			.reduce( ( links, { url, shortname, iconUrl, name } ) => {
				const idx = socialLinksOrder.indexOf( shortname );

				if ( idx !== -1 ) {
					links[ idx ] = `
						<a class="gravatar-hovercard__social-link" href="${ escUrl( url ) }" target="_blank" data-service-name="${ shortname }">
							<img class="gravatar-hovercard__social-icon" src="${ escUrl( iconUrl ) }" width="32px" height="32px" alt="${ escHtml(
						name
					) }" />
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
						<img class="gravatar-hovercard__avatar" src="${ escUrl(
							thumbnailUrl
						) }" width="56px" height="56px" alt="${ username }" />
					</a>
					<a class="gravatar-hovercard__name-location-link" href="${ profileUrl }" target="_blank">
						<h4 class="gravatar-hovercard__name">${ username }</h4>
						${ currentLocation ? `<p class="gravatar-hovercard__location">${ escHtml( currentLocation ) }</p>` : '' }
					</a>
				</div>
				<div class="gravatar-hovercard__body">
					${ aboutMe ? `<p class="gravatar-hovercard__about">${ escHtml( aboutMe ) }</p>` : '' }
				</div>
				<div class="gravatar-hovercard__footer">
					<div class="gravatar-hovercard__social-links">
						<a class="gravatar-hovercard__social-link" href="${ profileUrl }" target="_blank" data-service-name="gravatar">
							<img class="gravatar-hovercard__social-icon" src="https://secure.gravatar.com/icons/gravatar.svg" width="32px" height="32px" alt="Gravatar" />
						</a>
						${ renderSocialLinks }
					</div>
					${
						! aboutMe && myHash === hash
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
	 * @param {GravatarImg} gravatarImg - The Gravatar image object.
	 * @return {void}
	 * @private
	 */
	#showHovercard( { id, hash, params, img }: GravatarImg ) {
		const timeoutId = setTimeout( () => {
			if ( document.getElementById( id ) ) {
				return;
			}

			let hovercard: HTMLDivElement;

			if ( this.#cachedProfiles.has( hash ) ) {
				const profile = this.#cachedProfiles.get( hash );

				hovercard = Hovercards.createHovercard(
					{ ...profile, thumbnailUrl: profile.thumbnailUrl + params },
					{
						additionalClass: this.#additionalClass,
						myHash: this.#myHash,
					}
				);
			} else {
				hovercard = this.#createHovercardSkeleton();

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
							hash: fetchedHash,
							thumbnailUrl,
							preferredUsername,
							displayName,
							currentLocation,
							aboutMe,
							accounts,
						} = data.entry[ 0 ];

						this.#cachedProfiles.set( hash, {
							hash: fetchedHash,
							thumbnailUrl,
							preferredUsername,
							displayName,
							currentLocation,
							aboutMe,
							accounts,
						} );

						const profile = this.#cachedProfiles.get( hash );
						const hovercardInner = Hovercards.createHovercard(
							{ ...profile, thumbnailUrl: profile.thumbnailUrl + params },
							{
								additionalClass: this.#additionalClass,
								myHash: this.#myHash,
							}
						).firstElementChild;

						hovercard.classList.remove( 'gravatar-hovercard--skeleton' );
						hovercard.replaceChildren( hovercardInner );

						this.#onFetchProfileSuccess( hash, this.#cachedProfiles.get( hash ) );
					} )
					.catch( ( error ) => {
						hovercard.firstElementChild.innerHTML =
							'<i class="gravatar-hovercard__error-message">Sorry, we weren’t able to load this Gravatar profile card. Please check your internet connection.</i>';

						this.#onFetchProfilFailure( hash, error as Error );
					} );
			}

			// Set the hovercard ID here to avoid the show / hide side effect
			hovercard.id = id;
			// Don't hide the hovercard when the mouse is over the hovercard from the image
			hovercard.addEventListener( 'mouseenter', () => clearInterval( this.#hideHovercardTimeoutIds.get( id ) ) );
			hovercard.addEventListener( 'mouseleave', () => this.#hideHovercard( id ) );

			// Placing the hovercard at the top-level of the document to avoid being clipped by overflow
			document.body.appendChild( hovercard );

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

			this.#onHovercardShown( hash, hovercard );
		}, this.#delayToShow );

		this.#showHovercardTimeoutIds.set( id, timeoutId );
	}

	/**
	 * Waits for a specified delay and hides the hovercard for the specified hash.
	 *
	 * @param {string} id - The ID associated with the hovercard.
	 * @return {void}
	 * @private
	 */
	#hideHovercard( id: string ) {
		const timeoutId = setTimeout( () => {
			const hovercard = document.getElementById( id );

			if ( hovercard ) {
				hovercard.remove();
				this.#onHovercardHidden( id, hovercard as HTMLDivElement );
			}
		}, this.#delayToHide );

		this.#hideHovercardTimeoutIds.set( id, timeoutId );
	}

	/**
	 * Handles the mouseenter event for Gravatar images.
	 *
	 * @param {MouseEvent} e           - The mouseenter event object.
	 * @param              gravatarImg
	 * @return {void}
	 * @private
	 */
	#handleMouseEnter( e: MouseEvent, gravatarImg: GravatarImg ) {
		e.stopImmediatePropagation();

		// Don't hide the hovercard when the mouse is over the image from the hovercard
		clearInterval( this.#hideHovercardTimeoutIds.get( gravatarImg.id ) );
		this.#showHovercard( gravatarImg );
	}

	/**
	 * Handles the mouseleave event for Gravatar images.
	 *
	 * @param {MouseEvent} e              - The mouseleave event object.
	 * @param              gravatarImg
	 * @param              gravatarImg.id
	 * @return {void}
	 * @private
	 */
	#handleMouseLeave( e: MouseEvent, { id }: GravatarImg ) {
		e.stopImmediatePropagation();

		clearInterval( this.#showHovercardTimeoutIds.get( id ) );
		this.#hideHovercard( id );
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

		this.#queryGravatarImages( target, ignoreSelector ).forEach( ( gravatarImg ) => {
			gravatarImg.img.addEventListener( 'mouseenter', ( e ) => this.#handleMouseEnter( e, gravatarImg ) );
			gravatarImg.img.addEventListener( 'mouseleave', ( e ) => this.#handleMouseLeave( e, gravatarImg ) );
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

		this.#gravatarImages.forEach( ( { img } ) => {
			img.removeEventListener( 'mouseenter', () => this.#handleMouseEnter );
			img.removeEventListener( 'mouseleave', () => this.#handleMouseLeave );
		} );

		this.#gravatarImages = [];
	}
}
