# Gravatar Hovercards

Gravatar Hovercards is a stylish, easy-to-use library that brings [Gravatar](https://gravatar.com/) profiles to life on your website. It seamlessly converts [Gravatar images](http://gravatar.com/site/implement/images/) into interactive hovercards, providing immediate profile previews. As an ideal tool for any web platform, Gravatar Hovercards greatly enhances user engagement and interaction. Moreover, this library provides support for [TypeScript](https://www.typescriptlang.org/) to enhance developer experience (DX).

## Installation

You can install this package with [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/).

```bash
$ yarn add @gravatar/hovercards
# or
$ npm install @gravatar/hovercards
```

It also supports [UNPKG](https://unpkg.com/) CDN.

```html
<script src="https://unpkg.com/@gravatar/hovercards" defer></script>
<script>
  // Gravatar hovercards is available as a global variable
  console.log( Gravatar.HovercardsCore );
</script>
```

## Usage

Ensure that your website includes Gravatar images. The URLs of these images should contain hashed email addresses. For more information, please refer to the [Gravatar Images Implementation Guide](http://gravatar.com/site/implement/images/).

In the HTML of your webpage, the Gravatar images should look like this:

```html
<div id="container">
  <img id="avatar-1" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">
  <img id="avatar-2" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">
  <img id="avatar-3" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">
</div>
```

> For improved security, we strongly recommend using the [SHA-256 algorithm](https://www.simplilearn.com/tutorials/cyber-security-tutorial/sha-256-algorithm) to hash your email address.

Now you can use the library to convert your Gravatar images into interactive hovercards:

```js
import { HovercardsCore } from '@gravatar/hovercards';
// Import the hovercard styles
import '@gravatar/hovercards/dist/styles.min.css';

document.addEventListener( 'DOMContentLoaded', () => {
  // Initialize the hovercards library with the desired options
  const hovercards = new HovercardsCore( { /* Options */ } );

  // Set a specific Gravatar image as the target for the hovercard
  hovercards.setTarget( document.getElementById( 'avatar-1' ) );
  // Alternatively, set a container as the target and create hovercards for images inside it
  hovercards.setTarget( document.getElementById( 'container' ) );
  // If you want hovercards for images throughout the entire page, set the body as the target
  hovercards.setTarget( document.body );
} );
```

## API

This library provides a simple API that allows you to enhance Gravatar profiles on your website effortlessly ✨.

### Options

You can pass an object of options to the `HovercardsCore` constructor to customize the behavior of your hovercards. The following options are available:

#### `placement: string = 'right'`

The placement of the hovercard relative to the target element. Possible values are `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end`, `right-start`, and `right-end`.

#### `autoFlip: boolean = true`

Determines whether the hovercard's placement should automatically flip when there is not enough display space.

#### `offset: number = 10`

The offset of the hovercard relative to the target element.

#### `delayToShow: number = 500`

The delay in milliseconds before the hovercard is shown.

#### `delayToHide: number = 300`

The delay in milliseconds before the hovercard is hidden.

#### `additionalClass: string = ''`

Additional class names to be added to the outermost element of the hovercard. This is useful for customizing the styling of the hovercard.

#### `myHash: string = ''`

It enables personalized hovercard features for **the current user**. It allows displaying customized options like "Edit your profile" when the user's "about me" field is empty on their [Gravatar editing page](https://gravatar.com/profiles/edit). 

#### `onQueryGravatarImg: ( img: HTMLImageElement ) => HTMLImageElement`

This callback function is triggered when the library queries a Gravatar image. It allows you to customize the Gravatar image. The function receives the Gravatar image as an argument and should return the modified Gravatar image.

#### `onFetchProfileStart: ( hash: string ) => void`

This callback function is triggered when the library starts fetching a Gravatar profile. It takes the Gravatar hash as a parameter. Note that this function is executed only once per Gravatar hash due to the caching mechanism.

#### `onFetchProfileSuccess: ( hash: string, profileData: ProfileData ) => void`

This callback function is triggered when the library successfully fetches a Gravatar profile. It takes the Gravatar hash and the profile data as parameters. Note that this function is executed only once per Gravatar hash due to the caching mechanism.

The `profileData` parameter is an object that contains the following properties:

```ts
interface ProfileData {
	hash: string;
	preferredUsername: string;
	thumbnailUrl: string;
	displayName: string;
	currentLocation?: string;
	aboutMe?: string;
	accounts?: Record< 'url' | 'shortname' | 'iconUrl' | 'name', string >[];
}
```

#### `OnFetchProfilFailure: ( hash: string, error: Error ) => void`

This callback function is triggered when the library fails to fetch a Gravatar profile. It takes the Gravatar hash and the error as parameters. Note that this function is executed only once per Gravatar hash due to the caching mechanism.

#### `OnHovercardShown: ( hash: string, hovercard: HTMLDivElement ) => void`

This callback function is triggered when the hovercard is shown. It takes the Gravatar hash and the hovercard element as parameters.

#### `OnHovercardHidden: ( hash: string, hovercard: HTMLDivElement ) => void`

This callback function is triggered when the hovercard is hidden. It takes the Gravatar hash and the hovercard element as parameters.

### Methods

The `HovercardsCore` class provides the following methods:

#### `(static) createHovercard( profileData: ProfileData, options?: { additionalClass?: string; myHash?: string } ): HTMLDivElement`

This method generates a hovercard element using the provided profile data. It accepts the `profileData` parameter, which represents the data needed to populate the hovercard, and an optional options object that can include properties such as [`additionalClass`](#additionalclass-string) and [`myHash`](#myhash-string). It's useful when you want to display static hovercards on your website.

```js
import { HovercardsCore } from '@gravatar/hovercards';

const hovercard = HovercardsCore.createHovercard( {
  hash: '...',
  preferredUsername: '...',
  thumbnailUrl: '...',
  displayName: '...',
  currentLocation: '...',
  aboutMe: '...',
  accounts: [ {
    url: '...',
    shortname: '...',
    iconUrl: '...',
    name: '...',
  } ],
} );

document.getElementById( 'container' ).appendChild( hovercard );
```

#### `setTarget( target: HTMLElement, ignoreSelector?: string ): void`

This method sets the target element for the hovercards. The target parameter specifies the element that will trigger the hovercard, and the optional `ignoreSelector` parameter allows you to specify Gravatar images that should be ignored.

Example usage:

```js
import { HovercardsCore } from '@gravatar/hovercards';

const hovercards = new HovercardsCore();

// Set a specific Gravatar image as the target for the hovercard
hovercards.setTarget( document.getElementById( 'avatar-1' ) );
// Alternatively, set a container as the target and create hovercards for images inside it
hovercards.setTarget( document.getElementById( 'container' ) );
// If you want hovercards for images throughout the entire page, set the body as the target
hovercards.setTarget( document.body );

// Ignore Gravatar images that match the specified `ignoreSelector`
hovercards.setTarget( document.body, '.ignore img[src*="gravatar.com/"]' );
```

#### `unsetTarget(): void`

This method removes the target element for the hovercards, disabling the hovercard functionality.

## Upcoming Features

We're constantly working to improve Gravatar Hovercards. Upcoming features include:

- [ ] A dedicated React component
- [ ] A specific React hook

👀 Keep an eye out for these additions that will broaden the usability of our library!

### Contribute to Gravatar Hovercards

We welcome everyone to contribute to this open-source project. To contribute, please follow the guidelines outlined in the [CONTRIBUTING.md](https://github.com/Automattic/gravatar-hovercards/blob/trunk/CONTRIBUTING.md) file. Your contributions are greatly appreciated 💙.

## License

Gravatar Hovercards is licensed under [GNU General Public License v2 (or later)](https://github.com/Automattic/gravatar-hovercards/blob/trunk/LICENSE.md).

<!-- markdownlint-disable-next-line -->
<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
