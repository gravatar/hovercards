// @ts-nocheck

import Hovercards from './core';
import './style.scss';

window.Gravatar = {
	// It'll be assigned by WPCOM
	my_hash: '',
	// It's called by the Jetpack > WPGroHo.js
	profile_cb: () => {},
	// It's used by the Gravatar > preview hovercards
	createHovercard: Hovercards.createHovercard,
	init( container = 'body', ignore ) {
		const hovercards = new Hovercards( {
			myHash: this.my_hash,
			onQueryGravatarImg: ( img ) => {
				// Some themes/plugins/widgets are customizing Gravatar images based on these classes, so keep them for compatibility
				img.classList.add( 'grav-hashed' );
				if ( img.parentElement?.tagName !== 'A' ) {
					img.classList.add( 'grav-hijack' );
				}

				img.onmouseover = () => sendStat( 'hover' );

				return img;
			},
			onHovercardShown: ( hash, hovercard ) => {
				this.profile_cb( hash, hovercard.id );

				const viewProfileLink = hovercard.querySelector(
					'.gravatar-hovercard__profile-link'
				) as HTMLAnchorElement | null;
				if ( viewProfileLink ) {
					viewProfileLink.onclick = () => sendStat( 'click_view_profile' );
				}

				const editProfileLink = hovercard.querySelector(
					'.gravatar-hovercard__profile-link--edit'
				) as HTMLAnchorElement | null;
				if ( editProfileLink ) {
					editProfileLink.onclick = () => sendStat( 'click_edit_profile' );
				}

				const avatarLink = hovercard.querySelector(
					'.gravatar-hovercard__avatar-link'
				) as HTMLAnchorElement | null;
				if ( avatarLink ) {
					avatarLink.onclick = () => sendStat( 'to_profile' );
				}

				const nameLocationLink = hovercard.querySelector(
					'.gravatar-hovercard__name-location-link'
				) as HTMLAnchorElement | null;
				if ( nameLocationLink ) {
					nameLocationLink.onclick = () => sendStat( 'to_profile' );
				}

				const socialLinks = hovercard.querySelectorAll( '.gravatar-hovercard__social-link' ) as
					| NodeListOf< HTMLAnchorElement >
					| [];
				socialLinks.forEach( ( link ) => {
					link.onclick = () => sendStat( `click_${ link.dataset.serviceName }` );
				} );

				sendStat( 'show' );
			},
			onFetchProfileSuccess: () => sendStat( 'fetch' ),
			onFetchProfilFailure: () => sendStat( 'profile_404' ),
		} );

		hovercards.setTarget(
			document.querySelector( container ) as HTMLElement,
			ignore ? `${ ignore } img[src*="gravatar.com/"]` : ''
		);

		// Don't load the CSS if it's already loaded (e.g. dev mode)
		if ( ! document.querySelector( 'link[href*="hovercards.min.css"]' ) ) {
			// Loading hovercards CSS
			const hovercardsScript = document.querySelector( 'script[src*="/js/hovercards/hovercards"]' );
			const bust = hovercardsScript ? hovercardsScript.getAttribute( 'src' )?.split( '?' )[ 1 ] : '';
			document.head.insertAdjacentHTML(
				'beforeend',
				`<link rel="stylesheet" id="gravatar-card-css" href="https://0.gravatar.com/js/hovercards/hovercards.min.css${
					bust && '?' + bust
				}" />`
			);
		}
	},
};

/**
 * Sends an event log to WPCOM stats.
 *
 * @param {string} name - The name of the event to send.
 * @return {void}
 */
function sendStat( name: string ) {
	const img = new Image( 1, 1 );
	img.src = `https://pixel.wp.com/g.gif?v=wpcom2&x_grav-hover=${ name }&rand=${ Math.random() }-${ new Date().getTime() }`;
}
