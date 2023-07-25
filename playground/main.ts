import type { Options, Attach } from '../dist';
import { HovercardsCore } from '../dist';
import '../dist/style.min.css';

addEventListener( 'DOMContentLoaded', () => {
	// To test types
	const options: Options = {
		placement: 'right',
		// To test the empty about me case
		myHash: '99c3338797c95c418d9996bd39931506',
	};
	const hovercards = new HovercardsCore( options );

	// To test type
	const attach: Attach = ( target, opts ) => {
		hovercards.attach( target, opts );
	};
	attach( document.body, { ignoreSelector: '' } );

	// To test sanitization
	document.getElementById( 'inline-hovercard' )?.appendChild(
		HovercardsCore.createHovercard( {
			hash: 'd538859cbc5da94681f81bd1380cac96',
			thumbnailUrl: 'https://www.gravatar.com/avatar/d538859cbc5da94681f81bd1380cac96?s=60&d=retro&r=g&esc=^^',
			preferredUsername: 'wellycybertech',
			displayName: '<i>gyp</i>',
			currentLocation: '<i>Earth</i>',
			aboutMe: '<i>Test</i>, &amp;, &lt;, &gt;, &quot;, &#39;, &#x60;',
		} )
	);
} );
