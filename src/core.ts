import type { Placement } from './compute-position';
import computePosition from './compute-position';
import { escUrl, escHtml } from './sanitizer';

export type Account = Record< 'url' | 'shortname' | 'iconUrl' | 'name', string >;

export interface ProfileData {
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

export type Attach = ( target: HTMLElement, options?: { dataAttributeName?: string; ignoreSelector?: string } ) => void;

export type Detach = () => void;

export type OnQueryHovercardRef = ( ref: HTMLElement ) => HTMLElement;

export type OnFetchProfileStart = ( hash: string ) => void;

export type OnFetchProfileSuccess = ( hash: string, profileData: ProfileData ) => void;

export type OnFetchProfileFailure = ( hash: string, error: Error ) => void;

export type OnHovercardShown = ( hash: string, hovercard: HTMLDivElement ) => void;

export type OnHovercardHidden = ( hash: string, hovercard: HTMLDivElement ) => void;

export type Options = Partial< {
	placement: Placement;
	offset: number;
	autoFlip: boolean;
	delayToShow: number;
	delayToHide: number;
	additionalClass: string;
	myHash: string;
	onQueryHovercardRef: OnQueryHovercardRef;
	onFetchProfileStart: OnFetchProfileStart;
	onFetchProfileSuccess: OnFetchProfileSuccess;
	onFetchProfileFailure: OnFetchProfileFailure;
	onHovercardShown: OnHovercardShown;
	onHovercardHidden: OnHovercardHidden;
} >;

interface HovercardRef {
	id: string;
	hash: string;
	params: string;
	ref: HTMLElement;
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
	#onQueryHovercardRef: OnQueryHovercardRef;
	#onFetchProfileStart: OnFetchProfileStart;
	#onFetchProfileSuccess: OnFetchProfileSuccess;
	#onFetchProfileFailure: OnFetchProfileFailure;
	#onHovercardShown: OnHovercardShown;
	#onHovercardHidden: OnHovercardHidden;

	// Variables
	#hovercardRefs: HovercardRef[] = [];
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
		onQueryHovercardRef = ( ref ) => ref,
		onFetchProfileStart = () => {},
		onFetchProfileSuccess = () => {},
		onFetchProfileFailure = () => {},
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
		this.#onQueryHovercardRef = onQueryHovercardRef;
		this.#onFetchProfileStart = onFetchProfileStart;
		this.#onFetchProfileSuccess = onFetchProfileSuccess;
		this.#onFetchProfileFailure = onFetchProfileFailure;
		this.#onHovercardShown = onHovercardShown;
		this.#onHovercardHidden = onHovercardHidden;
	}

	/**
	 * Queries hovercard refs on or within the target element
	 *
	 * @param {HTMLElement} target            - The element to query.
	 * @param {string}      dataAttributeName - Data attribute name associated with Gravatar hashes.
	 * @param {string}      [ignoreSelector]  - The selector to ignore certain elements.
	 * @return {HTMLElement[]} - The queried hovercard refs.
	 * @private
	 */
	#queryHovercardRefs( target: HTMLElement, dataAttributeName: string, ignoreSelector?: string ) {
		let refs: HTMLElement[] = [];
		const camelAttrName = dataAttributeName.replace( /-([a-z])/g, ( g ) => g[ 1 ].toUpperCase() );
		const ignoreRefs = ignoreSelector ? Array.from( document.querySelectorAll( ignoreSelector ) ) : [];

		if (
			target.dataset[ camelAttrName ] ||
			( target.tagName === 'IMG' && ( target as HTMLImageElement ).src.includes( 'gravatar.com/' ) )
		) {
			refs = [ target ];
		} else {
			refs = Array.from( target.querySelectorAll( 'img[src*="gravatar.com/"]' ) );

			if ( dataAttributeName ) {
				refs = [
					// Filter out images that already have the data attribute
					...refs.filter( ( img ) => ! img.hasAttribute( `data-${ dataAttributeName }` ) ),
					...Array.from< HTMLElement >( target.querySelectorAll( `[data-${ dataAttributeName }]` ) ),
				];
			}
		}

		this.#hovercardRefs = refs
			.map( ( ref, idx ) => {
				if ( ignoreRefs.includes( ref ) ) {
					return null;
				}

				let hash;
				let params;
				const dataAttrValue = ref.dataset[ camelAttrName ];

				if ( dataAttrValue ) {
					hash = dataAttrValue.split( '?' )[ 0 ];
					params = dataAttrValue;
				} else if ( ref.tagName === 'IMG' ) {
					hash = ( ref as HTMLImageElement ).src.split( '/' ).pop().split( '?' )[ 0 ];
					params = ( ref as HTMLImageElement ).src;
				}

				if ( ! hash ) {
					return null;
				}

				const p = new URLSearchParams( params );
				const d = p.get( 'd' ) || p.get( 'default' );
				const f = p.get( 'f' ) || p.get( 'forcedefault' );
				const r = p.get( 'r' ) || p.get( 'rating' );
				params = [ d && `d=${ d }`, f && `f=${ f }`, r && `r=${ r }` ].filter( Boolean ).join( '&' );

				return {
					id: `gravatar-hovercard-${ hash }-${ idx }`,
					hash,
					params: params ? `?${ params }` : '',
					ref: this.#onQueryHovercardRef( ref ) || ref,
				};
			} )
			.filter( Boolean );

		return this.#hovercardRefs;
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
	 * @param {string}      [options.myHash]          - The hash of the current user.
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
		const isEditProfile = ! aboutMe && myHash === hash;
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
					<a
						class="gravatar-hovercard__profile-link${ isEditProfile ? ' gravatar-hovercard__profile-link--edit' : '' }"
						href="${ isEditProfile ? 'https://gravatar.com/profiles/edit' : profileUrl }"
						target="_blank"
					>
						<span>${ isEditProfile ? 'Edit your profile' : 'View profile' }</span>
						<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
							<path d="M12.6667 8.33338L9.16666 12.1667M12.6667 8.33338L2.66666 8.33338M12.6667 8.33338L9.16666 4.83338" stroke-width="1.5"/>
						</svg>
					</a>
				</div>
			</div>
    `;

		return hovercard;
	};

	/**
	 * Waits for a specified delay and fetches the user's profile data,
	 * then shows the hovercard relative to the ref element.
	 *
	 * @param {HovercardRef} hovercardRef - The hovercard ref object.
	 * @return {void}
	 * @private
	 */
	#showHovercard( { id, hash, params, ref }: HovercardRef ) {
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
							accounts: accounts?.map( ( { url, shortname, iconUrl, name }: Account ) => ( {
								url,
								shortname,
								iconUrl,
								name,
							} ) ),
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
						hovercard.firstElementChild.innerHTML = `<i class="gravatar-hovercard__error-message">${
							error.message === 'User not found'
								? "Sorry, we weren't able to load this Gravatar profile card."
								: "Sorry, we weren't able to load this Gravatar profile card. Please check your internet connection."
						}</i>`;

						this.#onFetchProfileFailure( hash, error as Error );
					} );
			}

			// Set the hovercard ID here to avoid the show / hide side effect
			hovercard.id = id;
			// Don't hide the hovercard when the mouse is over the hovercard from the ref
			hovercard.addEventListener( 'mouseenter', () => clearInterval( this.#hideHovercardTimeoutIds.get( id ) ) );
			hovercard.addEventListener( 'mouseleave', () => this.#hideHovercard( id ) );

			// Placing the hovercard at the top-level of the document to avoid being clipped by overflow
			document.body.appendChild( hovercard );

			const { x, y, padding, paddingValue } = computePosition( ref, hovercard, {
				placement: this.#placement,
				offset: this.#offset,
				autoFlip: this.#autoFlip,
			} );

			hovercard.style.position = 'absolute';
			hovercard.style.left = `${ x }px`;
			hovercard.style.top = `${ y }px`;
			// To bridge the gap between the ref and the hovercard,
			// ensuring that the hovercard remains visible when the mouse hovers over the gap
			hovercard.style[ padding ] = `${ paddingValue }px`;

			this.#onHovercardShown( hash, hovercard );
		}, this.#delayToShow );

		this.#showHovercardTimeoutIds.set( id, timeoutId );
	}

	/**
	 * Waits for a specified delay and hides the hovercard.
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
	 * Handles the mouseenter event for hovercard refs.
	 *
	 * @param {MouseEvent} e            - The mouseenter event object.
	 * @param              hovercardRef - The hovercard ref object.
	 * @return {void}
	 * @private
	 */
	#handleMouseEnter( e: MouseEvent, hovercardRef: HovercardRef ) {
		e.stopImmediatePropagation();

		// Don't hide the hovercard when the mouse is over the ref from the hovercard
		clearInterval( this.#hideHovercardTimeoutIds.get( hovercardRef.id ) );
		this.#showHovercard( hovercardRef );
	}

	/**
	 * Handles the mouseleave event for hovercard refs.
	 *
	 * @param {MouseEvent} e               - The mouseleave event object.
	 * @param              hovercardRef    - The hovercard ref object.
	 * @param              hovercardRef.id - The ID associated with the hovercard.
	 * @return {void}
	 * @private
	 */
	#handleMouseLeave( e: MouseEvent, { id }: HovercardRef ) {
		e.stopImmediatePropagation();

		clearInterval( this.#showHovercardTimeoutIds.get( id ) );
		this.#hideHovercard( id );
	}

	/**
	 * Attaches event listeners on or within the target element.
	 *
	 * @param {HTMLElement} target                    - The target element to set.
	 * @param {Object}      [options={}]              - The optional parameters.
	 * @param               options.dataAttributeName - Data attribute name associated with Gravatar hashes.
	 * @param               options.ignoreSelector    - The selector to ignore certain elements.
	 * @return {void}
	 */
	attach: Attach = ( target, { dataAttributeName = 'gravatar-hash', ignoreSelector } = {} ) => {
		if ( ! target ) {
			return;
		}

		this.detach();

		this.#queryHovercardRefs( target, dataAttributeName, ignoreSelector ).forEach( ( hovercardRef ) => {
			hovercardRef.ref.addEventListener( 'mouseenter', ( e ) => this.#handleMouseEnter( e, hovercardRef ) );
			hovercardRef.ref.addEventListener( 'mouseleave', ( e ) => this.#handleMouseLeave( e, hovercardRef ) );
		} );
	};

	/**
	 * Removes event listeners from hovercard refs and resets the stored list of these refs.
	 *
	 * @return {void}
	 */
	detach: Detach = () => {
		if ( ! this.#hovercardRefs.length ) {
			return;
		}

		this.#hovercardRefs.forEach( ( { ref } ) => {
			ref.removeEventListener( 'mouseenter', () => this.#handleMouseEnter );
			ref.removeEventListener( 'mouseleave', () => this.#handleMouseLeave );
		} );

		this.#hovercardRefs = [];
	};
}
