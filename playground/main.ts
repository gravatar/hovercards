import type { Options, SetTarget } from '../dist';
import { HovercardsCore } from '../dist';
import '../dist/style.min.css';

addEventListener( 'DOMContentLoaded', () => {
	// To test types
	const options: Options = {
		placement: 'right',
		// To test the empty about me case
		myHash: '767fc9c115a1b989744c755db47feb60',
	};
	const hovercards = new HovercardsCore( options );

	// To test type
	const setTarget: SetTarget = ( target, ignore ) => {
		hovercards.setTarget( target, ignore );
	};
	setTarget( document.body );

	// To test sanitization
	document.getElementById( 'inline-hovercard' )?.appendChild(
		HovercardsCore.createHovercard( {
			hash: '767fc9c115a1b989744c755db47feb60',
			thumbnailUrl: 'https://secure.gravatar.com/avatar/767fc9c115a1b989744c755db47feb60?s=60&d=retro&r=g&esc=^^',
			preferredUsername: 'matt',
			displayName: '<i>Matt</i>',
			currentLocation: '<i>San Francisco, CA</i>',
			aboutMe: '<i>Test</i>',
			accounts: [
				{
					url: 'http://twitter.com/photomatt?esc=^^',
					iconUrl: 'https://secure.gravatar.com/icons/twitter-alt.svg?esc=^^',
					name: '<i>Twitter</i>',
					shortname: 'twitter',
				},
			],
		} )
	);
} );
