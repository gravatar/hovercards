import Hovercards from './core';

window.Gravatar = {
	// Expose the class for the hovercard preview and many other cases
	Hovercards,
	// It's assigned by the Jetpack > WPGroHo.js
	my_hash: '',
	// It's called by the Jetpack > WPGroHo.js
	profile_cb: () => {},
	init( container = 'body', ignore ) {
		const hovercards = new Hovercards( {
			onQueryGravatarImg: ( img ) => {
				// Some themes/plugins/widgets are customizing Gravatar images based on these classes, so keep them for compatibility
				img.classList.add( 'grav-hashed' );
				if ( img.parentElement?.tagName !== 'A' ) {
					img.classList.add( 'grav-hijack' );
				}

				img.onmouseover = () => sendStat( 'hover' );

				return img;
			},
			onHovercardShown: ( { hash, aboutMe }, hovercard ) => {
				this.profile_cb( hash, `${ Hovercards.hovercardIdPrefix }${ hash }` );

				const body = hovercard.querySelector( '.gravatar-hovercard__body' ) as HTMLDivElement | null;
				if ( this.my_hash === hash && ! aboutMe && body ) {
					body.innerHTML =
						'<p>Want a better profile? <a class="gravatar-hovercard__edit-profile" href="https://gravatar.com/profiles/edit/?noclose" target="_blank">Click here</a>.</p>';
					( body.querySelector( '.gravatar-hovercard__edit-profile' ) as HTMLAnchorElement ).onclick = (
						e
					) => sendLinkStat( 'click_edit_profile', e );
				}

				const avatarLink = hovercard.querySelector(
					'.gravatar-hovercard__avatar-link'
				) as HTMLAnchorElement | null;
				if ( avatarLink ) {
					avatarLink.onclick = ( e ) => sendLinkStat( 'to_profile', e );
				}

				const nameLocationLink = hovercard.querySelector(
					'.gravatar-hovercard__name-location-link'
				) as HTMLAnchorElement | null;
				if ( nameLocationLink ) {
					nameLocationLink.onclick = ( e ) => sendLinkStat( 'to_profile', e );
				}

				const profileLink = hovercard.querySelector(
					'.gravatar-hovercard__profile-link'
				) as HTMLAnchorElement | null;
				if ( profileLink ) {
					profileLink.onclick = ( e ) => sendLinkStat( 'click_view_profile', e );
				}

				const socialLinks = hovercard.querySelectorAll( '.gravatar-hovercard__social-link' ) as
					| NodeListOf< HTMLAnchorElement >
					| [];
				socialLinks.forEach( ( link ) => {
					link.onclick = ( e ) => sendLinkStat( `click_${ link.dataset.serviceName }`, e );
				} );

				sendStat( 'show' );
			},
			onFetchProfileSuccess: () => sendStat( 'fetch' ),
			onFetchProfilFailure: () => sendStat( 'profile_404' ),
		} );

		hovercards.setTarget(
			document.querySelector( container ) as HTMLElement,
			`${ ignore } img[src*="gravatar.com/"]`
		);

		// Don't load the CSS if it's already loaded (e.g. dev mode)
		if ( ! document.querySelector( 'link[href*="hovercard.min.css"]' ) ) {
			// Loading hovercards CSS
			const hovercardsScript = document.querySelector( 'script[src*="/js/gprofiles."]' );
			const bust = hovercardsScript ? hovercardsScript.getAttribute( 'src' )?.split( '?' )[ 1 ] : '';
			document.head.insertAdjacentHTML(
				'beforeend',
				`<link rel="stylesheet" id="gravatar-card-css" href="https://0.gravatar.com/dist/css/hovercard.min.css?${ bust }" />`
			);
		}
	},
};

function sendStat( name: string, cb = () => {} ) {
	const img = new Image( 1, 1 );
	img.src = `https://pixel.wp.com/g.gif?v=wpcom2&x_grav-hover=${ name }&rand=${ Math.random() }-${ new Date().getTime() }`;
	img.onload = () => cb();
	img.onerror = () => cb();
}

// To send stat and then redirect to the link
function sendLinkStat( name: string, e: MouseEvent ) {
	e.preventDefault();
	const anchor = e.currentTarget as HTMLAnchorElement;
	sendStat( name, () => window.open( anchor.href, anchor.target || '_self' ) );
}
