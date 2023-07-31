/* eslint-disable import/no-unresolved */

import { createRoot } from 'react-dom/client';
import React, { useRef, useEffect } from 'react';

import type { HovercardsProps } from '../dist/index.react.d';
import { useHovercards, Hovercards } from '../dist/index.react';

// Test types
const props: HovercardsProps = {
	// attach: document.body,
	// placement: 'top',
	// ignoreSelector: '#grav-img-1',
};

function App() {
	// eslint-disable-next-line no-console
	const { attach } = useHovercards( { onFetchProfileSuccess: ( hash ) => console.log( hash ) } );
	const containerRef = useRef( null );

	useEffect( () => {
		if ( containerRef.current ) {
			attach( containerRef.current );
		}
	}, [ attach ] );

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '5rem' } }>
			<div>
				<div ref={ containerRef } style={ { display: 'flex', flexDirection: 'column', gap: '5rem' } }>
					<img
						src="https://www.gravatar.com/avatar/767fc9c115a1b989744c755db47feb60?s=60&d=retro&r=g"
						width="60"
						height="60"
						alt="Gravatar"
					/>
					<img
						src="https://www.gravatar.com/avatar/99c3338797c95c418d9996bd39931506"
						width="60"
						height="60"
						alt="Gravatar"
					/>
				</div>
			</div>
			<Hovercards style={ { display: 'flex', flexDirection: 'column', gap: '5rem' } } { ...props }>
				<img
					src="https://www.gravatar.com/avatar/f3023a1c05b9a37f8a0ac2bf132e68e0ee030610364e36611c08b391b9532e77?s=60&d=retro&r=g"
					width="60"
					height="60"
					alt="Gravatar"
				/>
				<img
					id="img"
					src="https://www.gravatar.com/avatar/d538859cbc5da94681f81bd1380cac96?s=60&d=retro&r=g"
					width="60"
					height="60"
					alt="Gravatar"
				/>
				<div id="attr" data-gravatar-hash="d538859cbc5da94681f81bd1380cac96?s=60&d=retro&r=g">
					@WellyTest
				</div>
			</Hovercards>
		</div>
	);
}

const root = createRoot( document.getElementById( 'react-app' )! );
root.render( <App /> );
