import Hovercards from './core';

window.Gravatar = {
	// Expose the class for the hovercard preview and many other cases
	Hovercards,
	// It's called by the WPGroHo.js of Jetpack
	profile_cb: () => {},
	init( container = 'body', ignore ) {
		const hovercards = new Hovercards( {
			// Some themes/plugins/widgets are customizing Gravatar images based on these classes, so keep them for compatibility
			processGravatarImg: ( img ) => {
				img.classList.add( 'grav-hashed' );

				if ( img.parentElement?.tagName !== 'A' ) {
					img.classList.add( 'grav-hijack' );
				}

				return img;
			},
			onHovercardShown: ( { hash }, hovercard ) => {
				this.profile_cb( hash, `${ Hovercards.hovercardIdPrefix }${ hash }` );

				sendStat( 'show' );
				( hovercard.querySelector( '.gravatar-hovercard__user-link' ) as HTMLAnchorElement ).onclick = ( e ) => redirectAfterStatSent( 'to_profile', e );
				( hovercard.querySelector( '.gravatar-hovercard__view-profile-link' ) as HTMLAnchorElement ).onclick = ( e ) => redirectAfterStatSent( 'click_view_profile', e );
				( hovercard.querySelectorAll( '.gravatar-hovercard__social-link' ) as NodeListOf< HTMLAnchorElement > ).forEach( ( link ) => {
					link.onclick = ( e ) => redirectAfterStatSent( `click_${ link.dataset.serviceName }`, e );
				} );
			},
			onFetchProfileSuccess: () => sendStat( 'fetch' ),
			onFetchProfilFailure: () => sendStat( 'profile_404' ),
		} );

		hovercards.setTarget( document.querySelector( container ) as HTMLElement, {
			ignoreSelector: `${ ignore } img[src*="gravatar.com/"]`,
			onGravatarImagesQueried: ( images ) => images.forEach( ( img ) => {
				img.onmouseover = () => sendStat( 'hover' );
			} ),
		} );

		// Loading hovercards CSS
		const hovercardsScript = document.querySelector( 'script[src*="/js/gprofiles."]' );
		const bust = hovercardsScript ? hovercardsScript.getAttribute( 'src' )?.split( '?' )[ 1 ] : '';
		document.head.insertAdjacentHTML( 'beforeend', `<link rel="stylesheet" id="gravatar-card-css" href="https://0.gravatar.com/dist/css/hovercard.min.css?${ bust }" />` );
	},
};

function sendStat( name: string, cb = () => {} ) {
	const img = new Image( 1, 1 );
	img.src = `https://pixel.wp.com/g.gif?v=wpcom2&x_grav-hover=${ name }&rand=${ Math.random() }-${ new Date().getTime() }`;
	img.onload = () => cb();
	img.onerror = () => cb();
};

function redirectAfterStatSent( name: string, e: MouseEvent ) {
	e.preventDefault();
	const anchor = e.currentTarget as HTMLAnchorElement;
	sendStat( name, () => window.open( anchor.href, anchor.target || '_self' ) );
}
