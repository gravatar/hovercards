# Gravatar Hovercards

Standalone version of Gravatar hovercards, packaged up ready for NPM.

## Installation

`yarn install`

## Development

To run a local server:

`yarn start`

It can be accessed from:

http://localhost:9000/

## Building

`yarn build`

This will build ESM and CJS modules that export a `Gravatar` object. These are not added to `window` as globals.

It also produces `dist/gprofiles.dev.js` and `dist/gprofiles.js`. This matches the existing `gprofiles.js` file, imports the `Gravatar` object and then exports it on `window` as a global.

## Syncing

To build and sync changes to a Gravatar sandbox:

`yarn build:sync`

Your sandbox will need to be available via SSH as `gravatar`.
