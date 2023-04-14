# Gravatar Hovercards

Standalone version of Gravatar hovercards, packaged up ready for NPM.

## Installation

`yarn install`

## Building

`yarn build`

This will build ESM and CJS modules that export a `Gravatar` object. These are not added to `window` as globals.

It also produces `build/index.js`. This matches the existing `gprofiles.js` file, imports the `Gravatar` object and then exports it on `window` as a global.
