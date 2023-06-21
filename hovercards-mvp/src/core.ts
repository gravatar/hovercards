import type { Placement } from '@floating-ui/dom';
import { computePosition } from '@floating-ui/dom';

import type { ProfileData } from './profileFetcher';
import fetchProfileWithCache from './profileFetcher';

type Options = Partial< {
  placement: Placement;
  onFetchProfileFinish: ( profileData: ProfileData ) => void;
} >;

const accountMap: Record< string, { url: string; title: string; } > = {
  'wordpress': {
    url: 'https://secure.gravatar.com/icons/wordpress.svg',
    title: 'WordPress',
  },
  'tumblr': {
    url: 'https://secure.gravatar.com/icons/tumblr.svg',
    title: 'Tumblr',
  },
  'twitter': {
    url: 'https://secure.gravatar.com/icons/twitter-alt.svg',
    title: 'Twitter',
  },
  // TODO: More accounts...
};

class Hovercards {
  #hovercardIdPrefix = 'gravatar-hovercard-';
  #imageElements: HTMLImageElement[] = [];
  #placement: Placement;

  constructor( target: HTMLElement, { placement }: Options = {} ) {
    this.#placement = placement || 'right';
    this.#addEventListeners( this.#getImageElements( target ) );
  }

  #getHash( url: string ) {
    const { hostname, pathname } = new URL( url );
    return hostname.endsWith( 'gravatar.com' ) ? pathname.split( '/' )[2] : '';
  }  

  // Getting valid img elements only
  #getImageElements( target: HTMLElement ) {
    if ( this.#imageElements.length ) {
      return this.#imageElements;
    }

    if ( target.tagName === 'IMG' ) {
      const img = target as HTMLImageElement;
      const hash = this.#getHash( img.src );

      if ( ! hash ) {
        return this.#imageElements;
      }

      img.setAttribute( 'data-gravatar', hash );
      this.#imageElements.push( img );

      return this.#imageElements;
    }

    const images = document.querySelectorAll( `${ target } img[src*="gravatar.com/"]` ) as unknown as HTMLImageElement[];

    if ( ! images.length ) {
      return this.#imageElements;
    }

    this.#imageElements = Array.from( images ).map( ( img ) => {
      const hash = this.#getHash( img.src );

      if ( ! hash ) {
        return null;
      }

      img.setAttribute( 'data-gravatar', hash );
      return img;
    } ).filter( Boolean ) as HTMLImageElement[];

    return this.#imageElements;
  }

  #addEventListeners( images: HTMLImageElement[] ) {
    images.forEach( ( img ) => {
      img.addEventListener( 'mouseenter', this.#handleMouseEnter.bind( this ) );
      // TODO: This is not an optimal solution for 3rd party library
      img.parentElement?.addEventListener( 'mouseleave', this.#handleMouseLeave.bind( this ) );
    } );
  }

  // It's used by React to remove the event listeners
  removeEventListeners() {
    this.#imageElements.forEach( ( img ) => {
      img.removeEventListener( 'mouseenter', this.#handleMouseEnter );
      img.parentElement?.removeEventListener( 'mouseleave', this.#handleMouseLeave );
    } );
  }

  async #handleMouseEnter( e: MouseEvent ) {
    e.stopImmediatePropagation();

    const img = e.target as HTMLImageElement;
    const hash = img.dataset.gravatar || '';

    if ( document.getElementById( `gravatar-${ hash }` ) ) {
      return;
    }

    let profileData: ProfileData | undefined;

    try {
      profileData = await fetchProfileWithCache( hash );
    } catch ( error ) {
      // TODO: Log the error
    } finally {
      // TODO: Implement onFetchProfileFinish callback
    }

    if ( ! profileData ) {
      return;
    }

    const hovercard = this.#createCard( profileData );
    img.after( hovercard );
    // TODO: Re-position the hovercard if it's out of the viewport, see: https://floating-ui.com/docs/tutorial#middleware
    const { x, y } = await computePosition( img, hovercard, { placement: this.#placement } );

    hovercard.style.left = `${ x }px`;
    hovercard.style.top = `${ y }px`;
  }

  #handleMouseLeave( e: MouseEvent ) {
    e.stopImmediatePropagation();

    document.querySelectorAll( `[id^="${ this.#hovercardIdPrefix }"]` ).forEach( ( el ) => {
      el.remove();
    } );
  }

  #createCard( data: ProfileData ) {
    const {
      hash,
      preferredUsername,
      displayName,
      thumbnailUrl,
      aboutMe,
      accounts = []
    } = data;

    const container = document.createElement( 'div' );
    container.id = `${ this.#hovercardIdPrefix }${ hash }`;
    container.classList.add( 'gravatar-hovercard' );
    const renderAccounts = accounts.map( ( { url, shortname }: { url: string; shortname: string; } ) => {
      const account = accountMap[ shortname ];

      if ( ! account ) {
        return '';
      }

      return `
        <a class="gravatar-hovercard__account" href="${ url }">
          <img class="gravatar-hovercard__account-img" src="${ account.url }" width="20px" height="20px" alt="${ account.title }" />
        </a>
      `;
    } ).join( '' );
    container.innerHTML = `
      <div class="gravatar-hovercard__inner">
        <div class="gravatar-hovercard__header">
          <a class="gravatar-hovercard__avatar-link" href="https://gravatar.com/${ preferredUsername }" target="_blank">
            <img class="gravatar-hovercard__avatar" src="${ thumbnailUrl }" width="56px" height="56px" alt="${ displayName }" />
          </a>
          <a class="gravatar-hovercard__name-link" href="https://gravatar.com/${ preferredUsername }" target="_blank">
            <h4 class="gravatar-hovercard__name">${ displayName }</h4>
          </a>
        </div>
        ${ aboutMe ? `<p class="gravatar-hovercard__about">${ aboutMe }</p>` : '' }
        ${ accounts.length ? `<div class="gravatar-hovercard__accounts">${ renderAccounts }</div>` : '' } 
      </div>
    `;

    return container;
  }
}

export default Hovercards;