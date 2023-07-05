import Hovercards from './core';

window.Gravatar = {
	profile_cb: () => {},
	init( container = 'body', ignore ) {
		const hovercards = new Hovercards( {
			// Some themes/plugins/widgets are customizing Gravatar images based on these classes, so keep them for compatibility
			onHandleGravatarImg: ( img ) => {
				img.classList.add( 'grav-hashed' );

				if ( img.parentElement?.tagName !== 'A' ) {
					img.classList.add( 'grav-hijack' );
				}

				return img;
			},
			onHovercardShown: ( hash ) => {
				// To compatible with the WPGroHo.js of Jetpack
				this.profile_cb( hash, `${ Hovercards.hovercardIdPrefix }${ hash }` );
			},
			// TODO: Stats
		} );
		hovercards.setTarget( document.querySelector( container ) as HTMLElement, `${ ignore } img[src*="gravatar.com/"]` );

		const hovercardsScript = document.querySelector( 'script[src*="/js/gprofiles."]' );
		const bust = hovercardsScript ? hovercardsScript.getAttribute( 'src' )?.split( '?' )[ 1 ] : '';
		document.head.insertAdjacentHTML( 'beforeend', `<link rel="stylesheet" id="gravatar-card-css" href="https://0.gravatar.com/dist/css/hovercard.min.css?${ bust }" />` );
	},
};
