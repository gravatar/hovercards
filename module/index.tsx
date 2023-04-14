// @ts-nocheck
import hex_md5 from './md5';

// NOTE: This file intentionally does not make use of any polyfills or libraries,
// including jQuery. Please keep all code as vanilla ES5, and namespace everything
// under the `Gravatar` and `GProfile` globals below.
// Code follows WordPress browser support guidelines. For an up to date list, see
// https://make.wordpress.org/core/handbook/best-practices/browser-support/

const Gravatar = {
	/* All loaded profiles, keyed off ghash */
	profile_stack: {},

	// Mapping of ghash to the "currently waiting" dom_id of where to render it
	profile_map: {},

	/* Timeouts for hovering over and off Gravatar images */
	overTimeout: false,
	outTimeout: false,

	/* If true, show_card will bail */
	stopOver: false,

	/* The img element, hash and ID of the Gravatar that is being hovered over */
	active_grav: false,
	active_hash: false,
	active_id: false,

	/* The clone of the Gravatar img element that is being hovered over. */
	active_grav_clone: false,

	/* Callback function for once a profile is loaded */
	profile_cb: null,

	/* Queue of stats objects to send */
	stats_queue: [],

	/* Waiting throbber */
	throbber: null,

	/* Has a custom background image been added to the card? */
	has_bg: false,
	disabled: false,

	/* The base of Gravatar URLs, taking into account secure connections */
	url_prefix: 'http://en',

	/* Whether the current browser supports passive event listeners */
	supportsPassiveEvents: false,

	// From https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
	testSupportsPassiveEvents: function () {
		try {
			var opts = Object.defineProperty( {}, 'passive', {
				get: function () {
					Gravatar.supportsPassiveEvents = true;
				},
			} );
			addEventListener( 'testPassive', null, opts );
			removeEventListener( 'testPassive', null, opts );
		} catch ( e ) {}
	},

	disable: function () {
		Gravatar.disabled = true;
		Gravatar.hide_card();
		var d = new Date( 2100, 1, 1, 1, 1, 1 );
		Gravatar.stat( 'disable' );
		if ( -1 == window.location.host.search( /wordpress.com/i ) ) {
			document.cookie = 'nohovercard=1; expires=' + d.toUTCString() + ';';
		} else {
			document.cookie = 'nohovercard=1; expires=' + d.toUTCString() + '; domain=.wordpress.com; path=/';
		}
	},

	mouseOut: function ( e ) {
		e.stopImmediatePropagation();
		Gravatar.stopOver = true;

		// console.debug( ':set out' );
		Gravatar.outTimeout = setTimeout( function () {
			// console.debug( ':do out' );
			Gravatar.hide_card();
		}, 300 );
	},

	init: function ( container, noGrav ) {
		Gravatar.testSupportsPassiveEvents();

		var ca = document.cookie.split( ';' ),
			i,
			c;
		for ( i = 0; i < ca.length; i++ ) {
			c = ca[ i ];
			while ( ' ' == c.charAt( 0 ) ) {
				c = c.substring( 1, c.length );
			}
			if ( 0 == c.indexOf( 'nohovercard=1' ) ) {
				return;
			}
		}

		if ( 'https:' == window.location.protocol ) this.url_prefix = 'https://secure';

		/* Locate all Gravatar images and attach profile links to them. */
		this.attach_profiles( container, noGrav );

		/* Add CSS */
		this.add_card_css();

		/* Find and show a hovercard when hovering over a Gravatar. */
		var hoverHandler = function ( e ) {
			if ( Gravatar.disabled ) {
				return;
			}

			var target = e && e.target;

			if ( ! target || ! Gravatar.closest( target, 'img.grav-hashed' ) ) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			if ( 'mouseleave' == e.type || 'mouseout' == e.type ) {
				// console.debug( 'grav out' );
				return Gravatar.mouseOut.call( this, e );
			}

			Gravatar.stopOver = false;

			// console.debug( 'grav enter' );
			/* Get and store the hash and ID for the active Gravatar */
			Gravatar.active_id = target.getAttribute( 'id' );
			Gravatar.active_hash = Gravatar.active_id.split( '-' )[ 1 ];

			Gravatar.untilt_gravatar();

			// console.debug( ':clear over1' );
			clearTimeout( Gravatar.overTimeout );

			// No profile data - see fetch_profile_error
			if ( false === Gravatar.profile_map[ 'g' + Gravatar.active_hash ] ) {
				return;
			}

			Gravatar.stat( 'hover' );

			// console.debug( ':clear out' );
			clearTimeout( Gravatar.outTimeout );

			Gravatar.tilt_gravatar();
			Gravatar.fetch_profile_by_hash( Gravatar.active_hash, Gravatar.active_id );
			// console.debug( ':set over' );
			Gravatar.overTimeout = setTimeout( function () {
				Gravatar.show_card();
			}, 600 );
		};

		document.body.addEventListener( 'mouseover', hoverHandler );
		document.body.addEventListener( 'mouseout', hoverHandler );

		/* Maintain hovercard state when rolling over a hovercard or cloned image */
		var maintainHoverHandler = function ( e ) {
			if ( Gravatar.disabled ) {
				return;
			}

			var target = e && e.target;

			if ( ! target ) {
				return;
			}

			if ( ! Gravatar.closest( target, 'div.gcard, img.grav-clone' ) ) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			if ( e.type == 'mouseenter' || e.type == 'mouseover' ) {
				Gravatar.stopOver = false;

				// console.debug( 'clone enter' );
				// console.debug( ':clear out2' );
				clearTimeout( Gravatar.outTimeout );
			} else {
				// console.debug( 'clone out' );
				Gravatar.mouseOut.call( this, e );
			}
		};

		document.body.addEventListener( 'mouseover', maintainHoverHandler );
		document.body.addEventListener( 'mouseout', maintainHoverHandler );

		/* Cancel a hovercard when scrolling. */
		addEventListener(
			'scroll',
			function () {
				if ( ! Gravatar.active_hash.length ) {
					return;
				}

				Gravatar.hide_card();
			},
			Gravatar.supportsPassiveEvents ? { passive: true } : false
		);
	},

	attach_profiles: function ( container, noGrav ) {
		setInterval( Gravatar.send_stats, 3000 );

		/* Locate all Gravatar images and add profiles to them */
		container = 'undefined' == typeof container ? 'body' : container;

		if ( noGrav && 'string' == typeof noGrav ) {
			var items = document.querySelectorAll( noGrav );
			for ( var i = 0; i < items.length; i++ ) {
				items[ i ].classList.add( 'no-grav' );
			}
		}

		var gravatars = document.querySelectorAll( container + ' img[src*="gravatar.com/avatar"]' );
		for ( var i = 0; i < gravatars.length; i++ ) {
			var g = gravatars[ i ];
			var hash = Gravatar.extract_hash( g );

			/* Add unique ID to image so we can reference it directly */
			var uniq = 0;
			if ( document.querySelector( '#grav-' + hash + '-' + uniq ) ) {
				while ( document.querySelector( '#grav-' + hash + '-' + uniq ) ) {
					uniq++;
				}
			}

			/* Remove the hover titles for sanity */
			g.setAttribute( 'id', 'grav-' + hash + '-' + uniq );
			g.setAttribute( 'title', '' );
			g.removeAttribute && g.removeAttribute( 'title' );
			if ( g.parentNode && g.parentNode.tagName === 'A' ) {
				g.parentNode.setAttribute( 'title', '' );
				g.parentNode.removeAttribute && g.parentNode.removeAttribute( 'title' );
			}

			g.classList.add( 'grav-hashed' );
			if (
				Gravatar.closest( g, '#comments, .comments, #commentlist, .commentlist, .grav-hijack' ) ||
				! Gravatar.closest( g, 'a' )
			) {
				g.classList.add( 'grav-hijack' );
			}
		}
	},

	show_card: function () {
		if ( Gravatar.stopOver ) {
			return;
		}

		dom_id = this.profile_map[ 'g' + Gravatar.active_hash ];

		// Close any existing cards
		var cards = document.querySelectorAll( '.gcard' );
		for ( var i = 0; i < cards.length; i++ ) {
			cards[ i ].classList.add( 'hidden' );
		}

		// Bail if we're waiting on a fetch
		if ( 'fetching' == this.profile_stack[ 'g' + Gravatar.active_hash ] ) {
			Gravatar.show_throbber();
			this.listen( Gravatar.active_hash, 'show_card' );
			Gravatar.stat( 'wait' );
			// console.log( 'still fetching ' + hash );
			return;
		}

		// If we haven't fetched this profile yet, do it now and do this later
		if ( 'undefined' == typeof this.profile_stack[ 'g' + Gravatar.active_hash ] ) {
			Gravatar.show_throbber();
			this.listen( Gravatar.active_hash, 'show_card' );
			// console.log( 'need to start fetching ' + hash + '@' + dom_id );
			this.fetch_profile_by_hash( Gravatar.active_hash, dom_id );
			return;
		}

		Gravatar.stat( 'show' );

		Gravatar.hide_throbber();

		// console.log( 'show_card: hash: ' + hash + ', DOM ID: ' + dom_id );

		// No HTML? build it
		if ( ! document.querySelector( '#profile-' + this.active_hash ) ) {
			this.build_card( this.active_hash, this.profile_stack[ 'g' + this.active_hash ] );
		}

		this.render_card( this.active_grav, 'profile-' + this.active_hash );
	},

	hide_card: function () {
		// console.debug( ':clear over3' );
		clearTimeout( Gravatar.overTimeout );

		/* Untilt the Gravatar image */
		this.untilt_gravatar();
		var card = document.querySelector( '#profile-' + this.active_hash + '.gcard' );
		if ( card ) {
			Gravatar.fadeOut( card );
		}
	},

	render_card: function ( grav, card_id ) {
		var card_el = document.querySelector( '#' + card_id );

		// console.log( 'render_card for ' + grav_id + ', ' + card_id );
		// Change CSS positioning based on where grav_id is in the page
		var grav_pos = Gravatar.getOffsets( grav );
		var grav_rect = grav && grav.getBoundingClientRect();
		var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;

		if ( null != grav_pos ) {
			var grav_width = grav_rect.width;
			var grav_height = grav_rect.height;
			var grav_space = 5 + grav_width * 0.4;

			var card_rect = card_el.getBoundingClientRect();
			var card_width = card_rect.width;
			var card_height = card_rect.height;
			if ( card_width === window.innerWidth ) {
				card_width = 400;
				card_height = 200;
			}

			/*
			console.log( grav_pos );
			console.log( 'grav_width = ' + grav_width + "\n" +
			 	'grav_height = ' + grav_height + "\n" +
			 	'grav_space = ' + grav_space + "\n" +
			 	'card_width = ' + card_width + "\n" +
				'card_height = ' + card_height + "\n" );
			*/

			/* Position to the right of the element */
			//var left = grav_pos.left + grav_width + grav_space;
			/* New: Position OVER the eleent */
			var left = grav_pos.left - 17;
			var top = grav_pos.top - 7;
			var grav_pos_class = 'pos-right';

			/* Position to the left of the element if space on the right is not enough. */
			if ( grav_pos.left + grav_width + grav_space + card_width > window.innerWidth + scrollLeft ) {
				//left = grav_pos.left - ( card_width + grav_space );
				left = grav_pos.left - card_width + grav_width + 17;
				grav_pos_class = 'pos-left';
			}

			/* Reposition the card itself */
			var top_offset = grav_height * 0.25;
			card_el.classList.remove( 'pos-right', 'pos-left', 'hidden' );
			card_el.classList.add( grav_pos_class );
			card_el.style.top = top - top_offset + 'px';
			card_el.style.left = left + 'px';

			/* Position of the small arrow in relation to the Gravatar */
			var arrow_offset = grav_height / 2;
			arrow_offset = Math.min( arrow_offset, card_height / 2 - 6, 53 ); // Max
			if ( this.has_bg ) {
				arrow_offset = arrow_offset - 8;
			}
			arrow_offset = Math.max( arrow_offset, 0 ); // Min

			var arrow = document.querySelector( '#' + card_id + ' .grav-cardarrow' );
			arrow.style.height = 2 * grav_height + top_offset + 'px';
			arrow.style.backgroundPosition = '0px ' + arrow_offset + 'px';
			if ( 'pos-right' == grav_pos_class ) {
				arrow.style.right = 'auto';
				arrow.style.left = '-7px';
			} else {
				arrow.style.right = '-10px';
				arrow.style.left = 'auto';
			}
		}

		Gravatar.fadeIn( card_el );
	},

	build_card: function ( hash, profile ) {
		function getSize( obj ) {
			var size = 0,
				key;
			for ( key in obj ) {
				if ( obj.hasOwnProperty( key ) ) {
					size++;
				}
			}
			return size;
		}

		// console.log( 'Build profile card for: ' + hash );
		// console.log( profile );
		GProfile.init( profile );

		var urls = GProfile.get( 'urls' );
		var photos = GProfile.get( 'photos' );
		var services = GProfile.get( 'accounts' );

		var limit = 100;
		if ( getSize( urls ) > 3 ) {
			limit += 90;
		} else {
			limit += 10 + 20 * getSize( urls );
		}

		if ( getSize( services ) > 0 ) {
			limit += 30;
		}

		var description = GProfile.get( 'aboutMe' );
		description = description.replace( /<[^>]+>/gi, '' );
		description = description.toString().substr( 0, limit );
		if ( limit == description.length ) {
			description += '<a href="' + GProfile.get( 'profileUrl' ) + '" target="_blank">&#8230;</a>';
		}

		var card_class = [ 'grav-inner' ];

		// console.log( Gravatar.my_hash, hash );
		if ( Gravatar.my_hash && hash == Gravatar.my_hash ) {
			card_class.push( 'grav-is-user' );
			if ( ! description.length ) {
				description =
					"<p>Want a better profile? <a class='grav-edit-profile' href='http://gravatar.com/profiles/edit/?noclose' target='_blank'>Click here</a>.</p>";
			}
		}

		if ( description.length ) {
			card_class.push( 'gcard-about' );
		}

		name = GProfile.get( 'displayName' );
		if ( ! name.length ) {
			name = GProfile.get( 'preferredUsername' );
		}
		var card =
			'<div id="profile-' +
			hash +
			'" class="gcard grofile"> \
						<div class="grav-inner"> \
							<div class="grav-grav"> \
								<a href="' +
			GProfile.get( 'profileUrl' ) +
			'" target="_blank"> \
									<img src="' +
			GProfile.get( 'thumbnailUrl' ) +
			'?s=100&r=pg&d=mm" width="100" height="100" /> \
								</a> \
							</div> \
							<div class="grav-info"> \
								<h4><a href="' +
			GProfile.get( 'profileUrl' ) +
			'" target="_blank">' +
			name +
			'</a></h4> \
								<p class="grav-loc">' +
			GProfile.get( 'currentLocation' ) +
			'</p> \
								<p class="grav-about">' +
			description +
			'</p> \
								<div class="grav-view-complete-button"> \
									<a href="' +
			GProfile.get( 'profileUrl' ) +
			'" target="_blank" class="grav-view-complete">View Complete Profile</a> \
								</div> \
								<p class="grav-disable"><a href="#" onclick="Gravatar.disable(); return false">Turn off hovercards</a></p> \
							</div> \
							<div style="clear:both"></div> \
						</div> \
						<div class="grav-cardarrow"></div> \
						<div class="grav-tag"><a href="http://gravatar.com/" title="Powered by Gravatar.com" target="_blank">&nbsp;</a></div> \
					</div>'; // .grav-inner, .gcard

		// console.log( 'Finished building card for ' + dom_id );
		document.body.insertAdjacentHTML( 'beforeend', card );
		var inner = document.querySelector( '#profile-' + hash + ' .grav-inner' );
		for ( var i = 0; i < card_class.length; i++ ) {
			inner.classList.add( card_class[ i ] );
		}

		// Custom Background
		this.has_bg = false;
		var bg = GProfile.get( 'profileBackground' );
		if ( getSize( bg ) ) {
			this.has_bg = true;
			var profile = document.querySelector( '#profile-' + hash );
			profile.style.padding = '8px 0';
			if ( bg.color ) {
				profile.style.backgroundColor = bg.color;
			}
			if ( bg.url ) {
				profile.style.backgroundImage = 'url(' + bg.url + ')';
			}
			if ( bg.position ) {
				profile.style.backgroundPosition = bg.position;
			}
			if ( bg.repeat ) {
				profile.style.backgroundRepeat = bg.repeat;
			}
			document.querySelector( '#profile-' + hash + ' .grav-tag' ).style.top = '8px';
		}

		// Resize card based on what's visible
		if (
			! document.querySelector( '#profile-' + hash + ' .gcard-links' ) &&
			! document.querySelector( '#profile-' + hash + ' .gcard-services' )
		) {
			var rightcol = document.querySelector( '#profile-' + hash + ' .grav-rightcol' );
			if ( rightcol ) {
				rightcol.style.width = 'auto';
			}
		}
		if ( ! document.querySelector( '#profile-' + hash + ' .gcard-about' ) ) {
			var leftcol = document.querySelector( '#profile-' + hash + ' .grav-leftcol' );
			if ( leftcol ) {
				leftcol.style.width = 'auto';
			}
		}

		// Trigger callback if defined
		if ( typeof Gravatar.profile_cb === 'function' ) {
			Gravatar.loaded_js( hash, 'profile-' + hash );
		}

		function addListeners( sel, type, fn ) {
			var els = document.querySelectorAll( sel );
			for ( var i = 0; i < els.length; i++ ) {
				els[ i ].addEventListener( type, fn );
			}
		}

		// Stats handlers
		addListeners( '#profile-' + hash + ' a.grav-extra-comments', 'click', function ( e ) {
			return Gravatar.stat( 'click_comment', e );
		} );
		addListeners( '#profile-' + hash + ' a.grav-extra-likes', 'click', function ( e ) {
			return Gravatar.stat( 'click_like', e );
		} );
		addListeners( '#profile-' + hash + ' .grav-links a', 'click', function ( e ) {
			return Gravatar.stat( 'click_link', e );
		} );
		addListeners( '#profile-' + hash + ' .grav-services a', 'click', function ( e ) {
			return Gravatar.stat( 'click_service', e );
		} );
		addListeners(
			'#profile-' + hash + ' h4 a, #profile-' + hash + ' .grav-view-complete, #profile-' + hash + ' .grav-grav a',
			'click',
			function ( e ) {
				return Gravatar.stat( 'to_profile', e );
			}
		);
		addListeners( '#profile-' + hash + ' .grav-tag a', 'click', function ( e ) {
			if ( 3 == e.which || 2 == e.button || e.altKey || e.metaKey || e.ctrlKey ) {
				e.preventDefault();
				e.stopImmediatePropagation();
				Gravatar.stat( 'egg' );
				return Gravatar.whee();
			}
			return Gravatar.stat( 'to_gravatar', e );
		} );
		addListeners( '#profile-' + hash + ' .grav-tag a', 'contextmenu', function ( e ) {
			e.preventDefault();
			e.stopImmediatePropagation();
			Gravatar.stat( 'egg' );
			return Gravatar.whee();
		} );

		addListeners( '#profile-' + hash + ' a.grav-edit-profile', 'click', function ( e ) {
			return Gravatar.stat( 'click_edit_profile', e );
		} );
	},

	tilt_gravatar: function () {
		/* Set the active gravatar */
		this.active_grav = document.querySelector( 'img#' + this.active_id );

		if ( document.querySelector( 'img#grav-clone-' + this.active_hash ) ) {
			return;
		}

		/* Clone the image */
		this.active_grav_clone = this.active_grav.cloneNode();
		this.active_grav_clone.setAttribute( 'id', 'grav-clone-' + this.active_hash );
		this.active_grav_clone.classList.add( 'grav-clone' );

		var offsets = Gravatar.getOffsets( this.active_grav ) || { left: 0, top: 0 };
		var styles = getComputedStyle( this.active_grav );

		var top = offsets.top + parseInt( styles.paddingTop, 10 );
		var left = offsets.left + parseInt( styles.paddingLeft, 10 );

		var tempContainer = document.createElement( 'div' );

		if ( this.active_grav.classList.contains( 'grav-hijack' ) ) {
			tempContainer.innerHTML =
				'<a href="http://gravatar.com/' + this.active_hash + '" class="grav-clone-a" target="_blank"></a>';
		} else {
			var ancestor = Gravatar.closest( this.active_grav, 'a' );
			tempContainer.appendChild( ancestor.cloneNode( false ) );
		}
		this.active_grav_clone.classList.add( 'grav-tilt' );
		this.active_grav_clone.style.borderBottomWidth = this.active_grav.getBoundingClientRect().height / 5 + 'px';

		var appendix = tempContainer.firstChild;
		appendix.appendChild( this.active_grav_clone );
		appendix.classList.add( 'grav-tilt-parent' );
		appendix.style.top = top + 'px';
		appendix.style.left = left + 'px';

		/* Append the clone on top of the original */
		document.body.appendChild( appendix );
		this.active_grav_clone.classList.remove( 'grav-hashed' );
	},

	untilt_gravatar: function () {
		var clones = document.querySelectorAll( '.grav-tilt-parent' );
		for ( var i = 0; i < clones.length; i++ ) {
			var clone = clones[ i ];
			if ( clone.remove ) {
				clone.remove();
			} else {
				clone.parentNode && clone.parentNode.removeChild( clone );
			}
		}
		Gravatar.hide_throbber();
	},

	show_throbber: function () {
		// console.log( 'throbbing...' );
		if ( ! Gravatar.throbber ) {
			var tempContainer = document.createElement( 'div' );
			tempContainer.innerHTML =
				'<div id="grav-throbber" class="grav-throbber"><img src="' +
				this.url_prefix +
				'.gravatar.com/images/throbber.gif" alt="." width="15" height="15" /></div>';
			Gravatar.throbber = tempContainer.firstChild;
		}

		document.body.appendChild( Gravatar.throbber );

		var offset = Gravatar.getOffsets( document.querySelector( '#' + Gravatar.active_id ) ) || { left: 0, top: 0 };

		Gravatar.throbber.style.top = offset.top + 2 + 'px';
		Gravatar.throbber.style.left = offset.left + 1 + 'px';
	},

	hide_throbber: function () {
		// Remove the throbber if it exists.
		if ( ! Gravatar.throbber ) {
			return;
		}
		// console.log( 'stopped throbbing.' );
		if ( Gravatar.throbber.remove ) {
			Gravatar.throbber.remove();
		} else {
			Gravatar.throbber.parentNode && Gravatar.throbber.parentNode.removeChild( Gravatar.throbber );
		}
	},

	/***
	 * Helper Methods
	 */

	// Helper function (not a polyfill) based on
	// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
	closest: function ( el, sel ) {
		if ( el.closest ) {
			return el.closest( sel );
		}

		var matcher =
			Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
		var current = el;

		do {
			var matches = matcher.bind( current );
			if ( matches( sel ) ) {
				return current;
			}
			current = current.parentElement || current.parentNode;
		} while ( current !== null && current.nodeType === 1 );

		return null;
	},

	getOffsets: function ( el ) {
		if ( ! el ) {
			return null;
		}

		var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
		var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;

		var rect = el.getBoundingClientRect();
		return {
			left: rect.left + scrollLeft,
			top: rect.top + scrollTop,
		};
	},

	afterAnimation: function ( el, property, fn ) {
		if ( el && fn ) {
			var didRun = false;
			var handler = function ( ev ) {
				if ( ev && ev.type === 'transitionend' && ev.propertyName !== property ) {
					return;
				}
				if ( ! didRun ) {
					didRun = true;
					fn();
				}
				if ( el ) {
					el.removeEventListener( 'transitionend', handler );
				}
			};

			el.addEventListener( 'transitionend', handler );

			// Hardcoded timeout alternative, in case the browser doesn't emit transitionend.
			setTimeout( handler, 200 );
		}
	},

	fadeIn: function ( el, afterFade ) {
		el.classList.remove( 'hidden' );
		el.classList.add( 'fadeout' );
		// Double rAF, because we're toggling CSS classes.
		requestAnimationFrame( function () {
			requestAnimationFrame( function () {
				el.classList.remove( 'fadeout' );
				el.classList.add( 'fading', 'fadein' );
				Gravatar.afterAnimation( el, 'opacity', function () {
					el.classList.remove( 'fading', 'fadein' );
					if ( afterFade ) {
						afterFade();
					}
				} );
			} );
		} );
	},

	fadeOut: function ( el, afterFade ) {
		el.classList.add( 'fadein' );
		// Double rAF, because we're toggling CSS classes.
		requestAnimationFrame( function () {
			requestAnimationFrame( function () {
				el.classList.remove( 'fadein' );
				el.classList.add( 'fading', 'fadeout' );
				Gravatar.afterAnimation( el, 'opacity', function () {
					el.classList.remove( 'fading', 'fadeout' );
					el.classList.add( 'hidden' );
					if ( afterFade ) {
						afterFade();
					}
				} );
			} );
		} );
	},

	fetch_profile_by_email: function ( email ) {
		// console.debug( 'fetch_profile_by_email' );
		return this.fetch_profile_by_hash( this.md5( email.toString().toLowerCase() ) );
	},

	fetch_profile_by_hash: function ( hash, dom_id ) {
		// This is so that we know which specific Grav is waiting on us
		this.profile_map[ 'g' + hash ] = dom_id;
		// console.log( this.profile_map );

		// If we already have it, no point getting it again, so just return it and notify any listeners
		if ( this.profile_stack[ 'g' + hash ] && 'object' == typeof this.profile_stack[ 'g' + hash ] ) {
			return this.profile_stack[ 'g' + hash ];
		}

		// console.log( 'fetch_profile_by_hash: ' + hash, dom_id );
		this.profile_stack[ 'g' + hash ] = 'fetching';
		// Not using $.getJSON because it won't call an error handler for remote URLs
		Gravatar.stat( 'fetch' );
		this.load_js(
			this.url_prefix + '.gravatar.com/' + hash + '.json?callback=Gravatar.fetch_profile_callback',
			function () {
				Gravatar.fetch_profile_error( hash, dom_id );
			}
		);
	},

	fetch_profile_callback: function ( profile ) {
		if ( ! profile || 'object' != typeof profile ) {
			return;
		}
		// console.log( 'Received profile via callback:' );
		// console.log( profile );
		this.profile_stack[ 'g' + profile.entry[ 0 ].requestHash ] = profile;
		this.notify( profile.entry[ 0 ].requestHash );
	},

	fetch_profile_error: function ( hash, dom_id ) {
		Gravatar.stat( 'profile_404' );
		Gravatar.profile_map[ 'g' + hash ] = false;
		var grav = document.querySelector( '#' + dom_id );
		var parent = grav.parentNode;
		var grandParent = parent && parent.parentNode;
		if ( grandParent && grandParent.querySelector( 'a[href="http://gravatar.com/' + hash + '"]' ) === parent ) {
			grandParent.replaceChild( grav, parent );
		}
		// console.debug( dom_id, Gravatar.active_id );
		if ( dom_id == Gravatar.active_id ) {
			Gravatar.hide_card();
		}
	},

	listen: function ( key, callback ) {
		if ( ! this.notify_stack ) {
			this.notify_stack = {};
		}

		key = 'g' + key; // Force valid first char
		// console.log( 'listening for: ' + key );
		if ( ! this.notify_stack[ key ] ) {
			this.notify_stack[ key ] = [];
		}

		// Make sure it's not already queued
		for ( a = 0; a < this.notify_stack[ key ].length; a++ ) {
			if ( callback == this.notify_stack[ key ][ a ] ) {
				// console.log( 'already' );
				return;
			}
		}

		this.notify_stack[ key ][ this.notify_stack[ key ].length ] = callback;
		// console.log( 'added listener: ' + key + ' => ' + callback );
		// console.log( this.notify_stack );
	},

	notify: function ( key ) {
		// console.log( 'trigger notification: ' + key );
		if ( ! this.notify_stack ) {
			this.notify_stack = {};
		}

		key = 'g' + key; // Force valid first char
		if ( ! this.notify_stack[ key ] ) {
			this.notify_stack[ key ] = [];
		}

		// Reverse it so that notifications are sent in the order they were queued
		// console.log( 'notifying key: ' + key + ' (with ' + this.notify_stack[ key ].length + ' listeners)' );
		for ( a = 0; a < this.notify_stack[ key ].length; a++ ) {
			if ( false == this.notify_stack[ key ][ a ] || 'undefined' == typeof this.notify_stack[ key ][ a ] ) {
				continue;
			}

			// console.log( 'send notification to: ' + this.notify_stack[ key ][ a ] );
			Gravatar[ this.notify_stack[ key ][ a ] ]( key.substr( 1 ) );
			this.notify_stack[ key ][ a ] = false;
		}
	},

	extract_hash: function ( el ) {
		var src = ( el && el.getAttribute( 'src' ) ) || '';

		// Get hash from img src
		hash = /gravatar.com\/avatar\/([0-9a-f]{32})/.exec( src );
		if ( null != hash && 'object' == typeof hash && 2 == hash.length ) {
			hash = hash[ 1 ];
		} else {
			hash = /gravatar_id\=([0-9a-f]{32})/.exec( src );
			if ( null !== hash && 'object' == typeof hash && 2 == hash.length ) {
				hash = hash[ 1 ];
			} else {
				return false;
			}
		}
		return hash;
	},

	load_js: function ( src, error_handler ) {
		if ( ! this.loaded_scripts ) {
			this.loaded_scripts = [];
		}

		if ( this.loaded_scripts[ src ] ) {
			return;
		}

		this.loaded_scripts[ src ] = true;

		var new_script = document.createElement( 'script' );
		new_script.src = src;
		new_script.type = 'text/javascript';
		if ( typeof error_handler === 'function' ) {
			new_script.onerror = error_handler;
		}

		// console.log( src );
		document.head.appendChild( new_script );
	},

	loaded_js: function ( hash, dom_id ) {
		Gravatar.profile_cb( hash, dom_id );
	},

	add_card_css: function () {
		if ( document.querySelector( '#gravatar-card-css' ) ) {
			return;
		}

		var script = document.querySelector( 'script[src*="/js/gprofiles."]' );
		var src = script && ( script.getAttribute( 'src' ) || false );
		var url,
			bust = false;

		if ( src ) {
			url = src.replace( /\/js\/gprofiles(?:\.dev)?\.js.*$/, '' );
			bust = src.split( '?' )[ 1 ] || false;
		} else {
			url = '//s.gravatar.com';
		}

		if ( ! bust ) {
			var now = new Date(),
				janOne = new Date( now.getFullYear(), 0, 1 ),
				bust = Math.ceil( ( ( now - janOne ) / 86400000 + janOne.getDay() + 1 ) / 7 ),
				bust = 'ver=' + now.getFullYear().toString() + bust.toString();
		}

		url = url.replace( /^(https?\:)?\/\//, '' ); // strip out the protocol and/or relative slashes
		url = window.location.protocol + '//' + url; // hardcode the protocol for IE, which doesn't like relative protocol urls for stylesheets
		new_css =
			"<link rel='stylesheet' type='text/css' id='gravatar-card-css' href='" +
			url +
			'/dist/css/hovercard.min.css?' +
			bust +
			"' />";

		if ( ! document.querySelector( '#gravatar-card-services-css' ) ) {
			new_css +=
				"<link rel='stylesheet' type='text/css' id='gravatar-card-services-css' href='" +
				url +
				'/dist/css/services.min.css?' +
				bust +
				"' />";
		}

		document.head.insertAdjacentHTML( 'beforeend', new_css );
		// console.log( 'Added CSS for profile cards to DOM' );
	},

	md5: function ( str ) {
		return hex_md5( str );
	},

	autofill: function ( email, map ) {
		// console.log('autofill');
		if ( ! email.length || -1 == email.indexOf( '@' ) ) {
			return;
		}

		this.autofill_map = map;
		hash = this.md5( email.toString().toLowerCase() );
		// console.log( this.profile_stack[ 'g' + hash ] );
		if ( 'undefined' == typeof this.profile_stack[ 'g' + hash ] ) {
			this.listen( hash, 'autofill_data' );
			this.fetch_profile_by_hash( hash );
		} else {
			// console.log( 'stack: ' + this.profile_stack[ 'g' + hash ] );
			this.autofill_data( hash );
		}
	},

	autofill_data: function ( hash ) {
		// console.log( this.autofill_map );
		// console.log( this.profile_stack[ 'g' + hash ] );
		GProfile.init( this.profile_stack[ 'g' + hash ] );
		for ( var m in this.autofill_map ) {
			// console.log( m );
			// console.log( this.autofill_map[ m ] );
			var item = document.querySelector( '#' + this.autofill_map[ m ] );
			switch ( m ) {
				case 'url':
					link = GProfile.get( 'urls' );
					// console.log( link );
					url = 'undefined' != typeof link[ 0 ] ? link[ 0 ][ 'value' ] : GProfile.get( 'profileUrl' );
					if ( item ) {
						item.value = url;
					}
					break;
				case 'urls':
					links = GProfile.get( 'urls' );
					links_str = '';
					// console.log( links );
					for ( l = 0; l < links.length; l++ ) {
						links_str += links[ l ][ 'value' ] + '\n';
					}
					if ( item ) {
						item.value = links_str;
					}
					break;
				default:
					parts = m.split( /\./ );
					if ( parts[ 1 ] ) {
						val = GProfile.get( m );
						switch ( parts[ 0 ] ) {
							case 'ims':
							case 'phoneNumbers':
								val = val.value;
								break;
							case 'emails':
								val = val[ 0 ].value;
							case 'accounts':
								val = val.url;
								break;
						}
						if ( item ) {
							item.value = val;
						}
					} else {
						if ( item ) {
							item.value = GProfile.get( m );
						}
					}
			}
		}
	},

	whee: function () {
		if ( Gravatar.whee.didWhee ) {
			return;
		}
		Gravatar.whee.didWhee = true;
		if ( document.styleSheets && document.styleSheets[ 0 ] ) {
			document.styleSheets[ 0 ].insertRule( '.grav-tag a { background-position: 22px 100% !important }', 0 );
		} else {
			var links = document.querySelectorAll( '.grav-tag a' );
			for ( var i = 0; i < links.length; i++ ) {
				links[ i ].style.backgroundPosition = '22px 100%';
			}
		}
		var gravs = document.querySelectorAll( 'img[src*="gravatar.com/"]' );
		for ( var i = 0; i < gravs.length; i++ ) {
			gravs[ i ].classList.add( 'grav-whee' );
		}
		return false;
	},

	stat: function ( stat, e ) {
		Gravatar.stats_queue.push( stat );

		if ( e ) {
			var diffWindow = e.metaKey || '_blank' === ( e.currentTarget && e.currentTarget.getAttribute( 'target' ) );
			Gravatar.send_stats( function () {
				if ( diffWindow ) {
					return;
				}
				document.location = e.currentTarget.href;
			} );
			return diffWindow;
		}

		if ( Gravatar.stats_queue.length > 10 ) {
			Gravatar.send_stats();
		}
	},

	send_stats: function ( cb ) {
		if ( ! document.images ) {
			return;
		}
		var stats = Gravatar.stats_queue;
		if ( ! stats.length ) {
			return;
		}
		var date = new Date();
		Gravatar.stats_queue = [];
		var url =
			'https://pixel.wp.com/g.gif?v=wpcom2&x_grav-hover=' +
			stats.join( ',' ) +
			'&rand=' +
			Math.random().toString() +
			'-' +
			date.getTime();
		var img = new Image( 1, 1 );
		if ( typeof cb === 'function' ) {
			img.onload = cb;
		}
		img.src = url;
	},
};

/**
 * Provides an interface for accessing profile data returned from Gravatar.com.
 * Use GProfile.init() to set up data, based on the JSON returned from Gravatar,
 * then GProfile.get() to access data more easily.
 */
var GProfile = {
	data: {},

	init: function ( data ) {
		if ( 'fetching' == data ) {
			return false;
		}
		if ( 'undefined' == typeof data.entry[ 0 ] ) {
			return false;
		}
		GProfile.data = data.entry[ 0 ];
	},

	/**
	 * Returns a value from the profile data.
	 * @param string attr The name of the attribute you want
	 * @param int num (Optional) 0-based array index of the value from this attribute. Use 0 if you're not sure
	 * @return Mixed value of the attribute, or empty string.
	 */
	get: function ( attr ) {
		// Handle x.y references
		if ( -1 != attr.indexOf( '.' ) ) {
			parts = attr.split( /\./ );
			// console.log(parts);
			if ( GProfile.data[ parts[ 0 ] ] ) {
				if ( GProfile.data[ parts[ 0 ] ][ parts[ 1 ] ] ) {
					return GProfile.data[ parts[ 0 ] ][ parts[ 1 ] ];
				}

				for ( i = 0, s = GProfile.data[ parts[ 0 ] ].length; i < s; i++ ) {
					if (
						( GProfile.data[ parts[ 0 ] ][ i ].type &&
							parts[ 1 ] == GProfile.data[ parts[ 0 ] ][ i ].type ) || // phoneNumbers | ims
						( GProfile.data[ parts[ 0 ] ][ i ].shortname &&
							parts[ 1 ] == GProfile.data[ parts[ 0 ] ][ i ].shortname ) || // accounts
						( GProfile.data[ parts[ 0 ] ][ i ].primary && parts[ 1 ] == 'primary' )
					) {
						// emails

						return GProfile.data[ parts[ 0 ] ][ i ];
					}
				}
			}

			return '';
		}

		// Handle "top-level" elements
		if ( GProfile.data[ attr ] ) {
			return GProfile.data[ attr ];
		}

		// And some "aliases"
		if ( 'url' == attr ) {
			if ( GProfile.data.urls.length ) {
				return GProfile.data.urls[ 0 ].value;
			}
		}

		return '';
	},
};

export default Gravatar;
