# Gravatar Hovercards

[![npm](https://img.shields.io/npm/v/@gravatar/hovercards)](https://npm.im/@gravatar/hovercards)
[![build](https://img.shields.io/github/actions/workflow/status/gravatar/hovercards/build-test.yml)](https://github.com/gravatar/hovercards/actions/workflows/build-test.yml)
[![package size](https://img.shields.io/bundlephobia/minzip/@gravatar/hovercards?label=minzipped%20size)](https://bundlephobia.com/package/@gravatar/hovercards)
[![downloads](https://img.shields.io/npm/dm/@gravatar/hovercards)](https://npmtrends.com/@gravatar/hovercards)
[![downloads](https://img.shields.io/npm/dt/@gravatar/hovercards)](https://npmtrends.com/@gravatar/hovercards)

Gravatar Hovercards is an easy-to-use library that brings [Gravatar](https://gravatar.com/) profiles to your website. It converts static [Gravatar images](#1-gravatar-images), or any element with the [`data-gravatar-hash` attribute](#2-elements-with-data-gravatar-hash-attribute) into interactive hovercards.

<img src="https://github.com/gravatar/hovercards/assets/21308003/40ed5dc3-31e3-4572-9ccf-4baa627f5f1a" width="600" height="297" />

## Table of Contents

- [Installation](#installation)
- [Vanilla JavaScript](#vanilla-javascript)
  - [Usage](#usage)
  - [API](#api)
- [React](#react)
  - [React Component](#react-component)
  - [React Hook](#react-hook)
- [TypeScript](#typescript)
- [Translations](#translations)
- [Contribute to Gravatar Hovercards](#contribute-to-gravatar-hovercards)

## Installation

This Gravatar Hovercards library supports both Vanilla JavaScript (including [TypeScript](https://www.typescriptlang.org/)) and [React](https://react.dev/). Install it via [Yarn](https://yarnpkg.com/), [NPM](https://www.npmjs.com/), or directly include it via [UNPKG](https://unpkg.com/) CDN.

### Install with Yarn or NPM

Add the package to your project:

```bash
yarn add @gravatar/hovercards
```

or

```bash
npm install @gravatar/hovercards
```

For React, also add `react` and `react-dom` (`v16.8.0` or above):

```bash
yarn add react react-dom @gravatar/hovercards
```

### Install with UNPKG

For Vanilla JavaScript, import the library as shown below:

```html
<!-- Import the hovercard styles -->
<link rel="stylesheet" href="https://unpkg.com/@gravatar/hovercards/dist/style.css">

<!-- Import the hovercards library -->
<script src="https://unpkg.com/@gravatar/hovercards" defer></script>

<script>
  // The library is accessible as a global variable
  console.log( Gravatar );
</script>
```

For React, import the library as shown below:

```html
<link rel="stylesheet" href="https://unpkg.com/@gravatar/hovercards/dist/style.css">

<!-- Ensure React and ReactDOM are imported before the library -->
<script src="https://unpkg.com/react" defer></script>
<script src="https://unpkg.com/react-dom" defer></script>
<!-- Import the React hovercards library -->
<script src="https://unpkg.com/@gravatar/hovercards/dist/index.react.umd.js" defer></script>

<script>
  console.log( Gravatar );
</script>
```

## Vanilla JavaScript

### Usage

You can add hovercards to your page by either using existing Gravatar images, or by adding a data attribute to any element.

#### 1. Gravatar Images

Ensure your page includes Gravatar images. The URLs of these images should contain hashed email addresses. For more information, refer to the [gravatar images implementation guide](http://gravatar.com/site/implement/images/).

For example:

```html
<div id="container">
    <img id="avatar-1" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">
    <img id="avatar-2" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image">

    <!-- Image URL with specified parameters -->
    <img id="avatar-3" src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>?s=250&d=retro&r=pg" alt="Gravatar Image">
</div>
```

These can be turned into hovercards:

```js
import { Hovercards } from '@gravatar/hovercards';
// Import the hovercard styles
import '@gravatar/hovercards/dist/style.css';

document.addEventListener( 'DOMContentLoaded', () => {
    // Start the hovercards feature with your preferred settings
    const hovercards = new Hovercards( { /* Options */ } );

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

#### 2. Elements with `data-gravatar-hash` Attribute

Alternatively, use the `data-gravatar-hash` attribute to specify the Gravatar hash for any element. This will automatically be converted into an interactive hovercard.

> Note: The data attributes takes priority over the image URL.

For example:

```html
<div id="container">
    <div id="ref-1" data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Meow</div>
    <div id="ref-2" data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Woof</div>

    <!-- A hash with specified parameters -->
    <div id="ref-3" data-gravatar-hash="<HASHED_EMAIL_ADDRESS>?s=250&d=retro&r=pg">@Haha</div>
</div>
```

To convert these elements into interactive hovercards:

```js
import { Hovercards } from '@gravatar/hovercards';
import '@gravatar/hovercards/dist/styles.css';

document.addEventListener( 'DOMContentLoaded', () => {
    // Start the hovercards feature with your preferred settings
    const hovercards = new Hovercards( { /* Options */ } );

    // Attach hovercards on a specific image
    hovercards.attach( document.getElementById( 'ref-1' ) );

    // Attach to all images within a container
    hovercards.attach( document.getElementById( 'container' ) );

    // Attach to all images on the page
    hovercards.attach( document.body );
} );
```

### API

#### Options

You can pass an object of options to the `Hovercards` constructor to customize the behavior of your hovercards. The following options are available:

##### `placement: string = 'right'`

The placement of the hovercard relative to the target element. Possible values are `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end`, `right-start`, and `right-end`.

##### `autoFlip: boolean = true`

Determines whether the hovercard's placement should automatically flip when there is not enough display space.

##### `offset: number = 10`

The offset of the hovercard relative to the target element, in pixels.

##### `delayToShow: number = 500`

The delay in milliseconds before the hovercard is shown.

##### `delayToHide: number = 300`

The delay in milliseconds before the hovercard is hidden.

##### `i18n: Record< string, string >`

Translated text strings to use instead of the default English.

##### `additionalClass: string = ''`

Additional class names to be added to the outermost element of the hovercard. This is useful for customizing the styling of the hovercard.

##### `myHash: string = ''`

It enables personalized hovercard features for **the current user**. It allows displaying customized options like "Edit your profile" when the user's "about me" field is empty on their [Gravatar editing page](https://gravatar.com/profiles/edit).

##### `onQueryHovercardRef: ( ref: HTMLElement ) => HTMLElement`

This callback function is triggered when the library queries a hovercard ref (or a Gravatar image), allowing you to customize the ref element. The function receives the ref element as an argument and should return the modified version of the element.

##### `onFetchProfileStart: ( hash: string ) => void`

This callback function is triggered when the library starts fetching a Gravatar profile. It takes the Gravatar hash as a parameter. Note that this function is executed only once per Gravatar hash due to the caching mechanism.

##### `onFetchProfileSuccess: ( hash: string, profileData: ProfileData ) => void`

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

##### `onFetchProfileFailure: ( hash: string, error: Error ) => void`

This callback function is triggered when the library fails to fetch a Gravatar profile. It takes the Gravatar hash and the error as parameters. Note this function is executed only once per Gravatar hash due to the caching mechanism.

##### `onHovercardShown: ( hash: string, hovercard: HTMLDivElement ) => void`

This callback function is triggered when the hovercard is shown. It takes the Gravatar hash and the hovercard element as parameters.

##### `onHovercardHidden: ( hash: string, hovercard: HTMLDivElement ) => void`

This callback function is triggered when the hovercard is hidden. It takes the Gravatar hash and the hovercard element as parameters.

#### Methods

The `Hovercards` class provides the following methods:

##### `(static) createHovercard( profileData: ProfileData, options?: { additionalClass?: string; myHash?: string, i18n?: Record< string, string > } ): HTMLDivElement`

This method generates a hovercard element using the provided profile data. It accepts the `profileData` parameter, which represents the data needed to populate the hovercard, and an optional options object that can include properties such as [`additionalClass`](#additionalclass-string) and [`myHash`](#myhash-string). It's useful when you want to display static hovercards on your website.

```js
import { Hovercards } from '@gravatar/hovercards';

const hovercard = Hovercards.createHovercard( {
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

##### `attach( target: HTMLElement, options?: { dataAttributeName?: string; ignoreSelector?: string } ): void`

This method attaches the hovercards to the specified target element, thereby enabling the hovercard functionality. It accepts the `target` parameter, which represents the target element to which the hovercards will be attached, and an optional options object that can include properties such as `dataAttributeName` and `ignoreSelector`.

- `dataAttributeName` (default: `'gravatar-hash'`) - The name of the `data-*` attribute that contains the Gravatar hash. This option is useful when you want to use a custom attribute name instead of `data-gravatar-hash`. If you want to disable the [`data-*` attribute feature](#2-elements-with-data-gravatar-hash-attribute), you can set this option to an empty string.
- `ignoreSelector` (default: `''`) - A query selector that specifies elements to be excluded from displaying hovercards. This option is useful when you want to prevent certain elements from triggering hovercards.

> Note: Each `attach()` call automatically detaches hovercards from their current target before attaching them to the new target.

##### `detach(): void`

This method detaches the hovercards from their current target element, thereby disabling the hovercard functionality.

## React

This library offers a React component and a hook, their operation is similar to the [Vanilla JavaScript](#vanilla-javascript) version.

### React Component

#### Usage

Here is a basic example:

```jsx
// Import the React component
import { Hovercards } from '@gravatar/hovercards/react';
// Import the hovercard styles
import '@gravatar/hovercards/dist/style.css';

function App() {
    // ...

    return (
        <Hovercards>
            { /* Work with Gravatar images */ }
            <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />
            <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />

            { /* Work with elements having `data-gravatar-hash` attribute */ }
            <div data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Meow</div>
            <div data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Woof</div>
        </Hovercards>
    );
}
```

> Note: The component will create a `div` container element to wrap all the children. You can customize the container element by using the [`className`](#classname-string) or [`style`](#style-reactcssproperties) props.

To attach hovercards to the whole page or a specific element, use the [`attach`](#attach-htmlelement) prop:

```jsx
import { Hovercards } from '@gravatar/hovercards/react';
import '@gravatar/hovercards/dist/style.css';

function App() {
    // ...

    return (
        <>
            <div>
                <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />
                <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />
                <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />
            </div>
            { /* Attach hovercards to the entire page */ }
            <Hovercards attach={ document.body } />
        </>
    );
}
```

#### Props

The `Hovercards` component accepts the following props:

##### `attach?: HTMLElement`

This prop specifies the target element to which the hovercards will be attached. It's useful when you want to attach hovercards to an entire page.

##### `dataAttributeName?: string = 'gravatar-hash'`

This prop specifies the name of the `data-*` attribute that contains the Gravatar hash. It's useful when you want to use a custom attribute name instead of `data-gravatar-hash`. If you want to disable the [`data-*` attribute feature](#2-elements-with-data-gravatar-hash-attribute), you can set this prop to an empty string.

##### `ignoreSelector?: string = ''`

This prop specifies a query selector that specifies elements to be excluded from displaying hovercards. It's useful when you want to prevent certain elements from triggering hovercards.

##### `className?: string`

This prop allows you to specify class names to be added to the container element, which is created by the component to wrap all the children.

##### `style?: React.CSSProperties`

This prop allows you to specify styles to be added to the container element, which is created by the component to wrap all the children.

*For the remaining props, please refer to the [Options](#options) section.*

### React Hook

#### Usage

Here are some basic examples of how to use the React hook:

```jsx
import { useEffect, useRef } from 'react';
// Import the React hook
import { useHovercards } from '@gravatar/hovercards/react';
// Import the hovercard styles
import '@gravatar/hovercards/dist/style.css';

function App() {
    const { attach } = useHovercards( { /* Options */ } );
    const containerRef = useRef();

    useEffect( () => {
        if ( containerRef.current ) {
            attach( containerRef.current );   
        }
    }, [ attach ] );

    return (
        <div ref={ containerRef }>
            { /* Work with Gravatar images */ }
            <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />
            <img src="https://www.gravatar.com/avatar/<HASHED_EMAIL_ADDRESS>" alt="Gravatar Image" />

            { /* Work with elements having `data-gravatar-hash` attribute */ }
            <div data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Meow</div>
            <div data-gravatar-hash="<HASHED_EMAIL_ADDRESS>">@Woof</div>
        </div>
    );
}
```

>  Note: When the component is unmounted, the hook will automatically detach the hovercards from the target element.

You can also use the hook to create a custom component:

```jsx
import sha256 from 'js-sha256';
import { useEffect, useRef } from 'react';
import { useHovercards } from '@gravatar/hovercards/react';
import '@gravatar/hovercards/dist/style.css';

// A custom Avatar component for convenience
function Avatar( { email } ) {
    const { attach } = useHovercards();
    const imgRef = useRef();

    useEffect( () => {
        if ( imgRef.current ) {
            attach( imgRef.current ); 
        }
    }, [ attach ] );

    return (
        <img ref={ imgRef } src={ `https://www.gravatar.com/avatar/${ sha256( email ) }` } alt="Gravatar Image" />
    );
}
```

#### Options and Methods

The hook accepts the same options and methods as the `Hovercards` class. Please refer to the [API](#api) section for further details.

## TypeScript

This library is written in TypeScript and comes with type definitions. You can check the following files for the available types:

- [For Vanilla JavaScript](https://github.com/gravatar/hovercards/blob/trunk/src/index.ts)
- [For React](https://github.com/gravatar/hovercards/blob/trunk/src/index.react.ts)

## Translations

A few items of text are used when displaying a hovercard. The library contains English by default, but you can supply your own translations through the use of the [`i18n`](#i18n-record-string-string) option.

The following phrases are used:

- `Edit your profile`
- `View profile`
- `Sorry, we are unable to load this Gravatar profile.`
- `Sorry, we are unable to load this Gravatar profile. Please check your internet connection.`

The `i18n` option is an object that maps from the English text to the language of your choice (even another English phrase, if you wish to change the text).

```js
{
  'Edit your profile': 'Modifier votre profil'
}
```

## Contribute to Gravatar Hovercards

We welcome contributions to this project. Please follow the guidelines outlined in the [CONTRIBUTING.md](https://github.com/gravatar/hovercards/blob/trunk/CONTRIBUTING.md) file.

## License

Gravatar Hovercards is licensed under [GNU General Public License v2 (or later)](https://github.com/gravatar/hovercards/blob/trunk/LICENSE.md).
