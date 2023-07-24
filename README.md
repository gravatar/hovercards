# Gravatar Hovercards

Gravatar Hovercards is an easy-to-use library that brings [Gravatar](https://gravatar.com/) profiles to your website. It converts static [Gravatar images](#1-static-gravatar-images) or [elements `data-gravatar-hash` attribute](#2-elements-with-data-gravatar-hash-attribute) into interactive hovercards, increasing user engagement.

## Installation

You can install this package with [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/).

```bash
yarn add @automattic/gravatar-hovercards
```

or

```bash
npm install @automattic/gravatar-hovercards
```

It also supports [UNPKG](https://unpkg.com/) CDN.

```html
<!-- Import the hovercard styles -->
<link rel="stylesheet" href="https://unpkg.com/@automattic/gravatar-hovercards/dist/style.min.css">
<!-- Import the hovercards library -->
<script src="https://unpkg.com/@automattic/gravatar-hovercards" defer></script>
<script>
  // Gravatar hovercards is available as a global variable
  console.log( Gravatar.HovercardsCore );
</script>
```

## Usage

You can integrate Gravatar profiles into your website in two ways.

### 1. Static Gravatar Images

Ensure that your website includes Gravatar images. The URLs of these images should contain hashed email addresses. For more information, please refer to the [Gravatar Images Implementation Guide](http://gravatar.com/site/implement/images/).

In the HTML of your webpage, the Gravatar images should look like this:

```html
<div id="container">
  <img id="avatar-1" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">
  <img id="avatar-2" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">
  <!-- Image URL with specified parameters -->
  <img id="avatar-3" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>?s=250&d=retro&r=pg" alt="Gravatar Image">
</div>
```

Now you can use the library to convert your Gravatar images into interactive hovercards:

```js
import { HovercardsCore } from '@automattic/gravatar-hovercards';
// Import the hovercard styles
import '@automattic/gravatar-hovercards/dist/style.min.css';

document.addEventListener( 'DOMContentLoaded', () => {
  // Start the hovercards feature with your preferred settings
  const hovercards = new HovercardsCore( { /* Options */ } );

  // Make hovercards work on a specific Gravatar image
  hovercards.attach( document.getElementById( 'avatar-1' ) );
  // Alternatively, make hovercards work on all Gravatar images within a specific container
  hovercards.attach( document.getElementById( 'container' ) );
  // If you want hovercards on all Gravatar images across the entire page, use `document.body` as the target
  hovercards.attach( document.body );

  // You can exclude certain Gravatar images from hovercards by using `ignoreSelector`
  hovercards.attach( document.body, { ignoreSelector: '.ignore img[src*="gravatar.com/"]' } );
} );
```

### 2. Elements with `data-gravatar-hash` Attribute

Alternatively, you can use the `data-gravatar-hash` attribute to specify the Gravatar hash for an element. The Gravatar Hovercards library will automatically convert the element into an interactive hovercard.

> Note: When using the data attribute with a Gravatar image, the data takes priority.

In the HTML of your webpage, the elements should look like this:

```html
<div id="container">
  <div id="ref-1" data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Meow</div>
  <div id="ref-2" data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Woof</div>
  <!-- A hash with specified parameters -->
  <div id="ref-3" data-gravatar-hash="<HASHED_EMAIL_ADDRESS>?s=250&d=retro&r=pg">@Haha</div>
</div>
```

Now, to convert these elements into interactive hovercards, use the Gravatar Hovercards library as follows:

```js
import { HovercardsCore } from '@automattic/gravatar-hovercards';
// Import the hovercard styles
import '@automattic/gravatar-hovercards/dist/styles.min.css';

document.addEventListener( 'DOMContentLoaded', () => {
  // Start the hovercards feature with your preferred settings
  const hovercards = new HovercardsCore( { /* Options */ } );

  // Make hovercards work on a specific ref element
  hovercards.attach( document.getElementById( 'ref-1' ) );
  // Alternatively, make hovercards work on all ref elements within a specific container
  hovercards.attach( document.getElementById( 'container' ) );
  // If you want hovercards on all ref elements across the entire page, use `document.body` as the target
  hovercards.attach( document.body );

  // You can change the `data-gravatar-hash` attribute name by using `dataAttributeName`
  // For example, if you want to use `data-my-custom-name` instead of `data-gravatar-hash`
  hovercards.attach( document.body, { dataAttributeName: 'my-custom-name' } );
  // For some reason you want to disable this feature, you can set `dataAttributeName` to an empty string
  hovercards.attach( document.body, { dataAttributeName: '' } );
} );
```

## API

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

#### `onQueryHovercardRef: ( ref: HTMLElement ) => HTMLElement`

This callback function is triggered when the library queries a hovercard ref (or a Gravatar image), allowing you to customize the ref element. The function receives the ref element as an argument and should return the modified version of the element.

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

#### `OnFetchProfileFailure: ( hash: string, error: Error ) => void`

This callback function is triggered when the library fails to fetch a Gravatar profile. It takes the Gravatar hash and the error as parameters. Note this function is executed only once per Gravatar hash due to the caching mechanism.

#### `OnHovercardShown: ( hash: string, hovercard: HTMLDivElement ) => void`

This callback function is triggered when the hovercard is shown. It takes the Gravatar hash and the hovercard element as parameters.

#### `OnHovercardHidden: ( hash: string, hovercard: HTMLDivElement ) => void`

This callback function is triggered when the hovercard is hidden. It takes the Gravatar hash and the hovercard element as parameters.

### Methods

The `HovercardsCore` class provides the following methods:

#### `(static) createHovercard( profileData: ProfileData, options?: { additionalClass?: string; myHash?: string } ): HTMLDivElement`

This method generates a hovercard element using the provided profile data. It accepts the `profileData` parameter, which represents the data needed to populate the hovercard, and an optional options object that can include properties such as [`additionalClass`](#additionalclass-string) and [`myHash`](#myhash-string). It's useful when you want to display static hovercards on your website.

```js
import { HovercardsCore } from '@automattic/gravatar-hovercards';

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

#### `attach( target: HTMLElement, options?: { dataAttributeName?: string; ignoreSelector?: string } ): void`

This method attaches the hovercards to the specified target element, thereby enabling the hovercard functionality. It accepts the `target` parameter, which represents the target element to which the hovercards will be attached, and an optional options object that can include properties such as `dataAttributeName` and `ignoreSelector`.

- `dataAttributeName` (default: `'gravatar-hash'`) - The name of the `data-*` attribute that contains the Gravatar hash. This option is useful when you want to use a custom attribute name instead of `data-gravatar-hash`. If you want to disable the [`data-*` attribute feature](#2-elements-with-data-gravatar-hash-attribute), you can set this option to an empty string.
- `ignoreSelector` (default: `''`) - A query selector that specifies elements to be excluded from displaying hovercards. This option is useful when you want to prevent certain elements from triggering hovercards.

> Note: Each `attach()` call automatically detaches hovercards from their current target before attaching them to the new target.

#### `detach(): void`

This method detaches the hovercards from their current target element, thereby disabling the hovercard functionality.

### Contribute to Gravatar Hovercards

We welcome contributions to this project. Please follow the guidelines outlined in the [CONTRIBUTING.md](https://github.com/Automattic/gravatar-hovercards/blob/trunk/CONTRIBUTING.md) file.

## License

Gravatar Hovercards is licensed under [GNU General Public License v2 (or later)](https://github.com/Automattic/gravatar-hovercards/blob/trunk/LICENSE.md).
