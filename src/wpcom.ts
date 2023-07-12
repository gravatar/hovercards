import Hovercards from './core';

window.Gravatar = {
	// Expose the class for the hovercard preview and many other cases
	Hovercards,
	// It will be assigned by WPCOM
	my_hash: '',
	// It will be called by the Jetpack > WPGroHo.js
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

				const profileLink = hovercard.querySelector(
					'.gravatar-hovercard__profile-link'
				) as HTMLAnchorElement | null;
				let profileLinkEventName = 'click_view_profile';

				if ( this.my_hash === hash && ! aboutMe && profileLink ) {
					profileLink.classList.add( 'gravatar-hovercard__profile-link--edit' );
					profileLink.href = 'https://en.gravatar.com/profiles/edit';
					profileLink.textContent = 'Edit your profile';
					profileLinkEventName = 'click_edit_profile';
				}

				if ( profileLink ) {
					profileLink.onclick = () => sendStat( profileLinkEventName );
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

function sendStat( name: string ) {
	const img = new Image( 1, 1 );
	img.src = `https://pixel.wp.com/g.gif?v=wpcom2&x_grav-hover=${ name }&rand=${ Math.random() }-${ new Date().getTime() }`;
}
