# Gravatar Hovercards

Gravatar Hovercards is a library that allows you to add interactive hovercards to Gravatar profile images with ease.

## How to Contribute

### For WPCOM

To contribute to the WPCOM Gravatar Hovercards library, ensure you have a Gravatar sandbox that's accessible via SSH using the `gravatar` handle.

#### Installation

Install the project dependencies by running the following command:

```bash
yarn install
```

#### Development

Kickstart library development by running the following command:

```bash
# This launches a development server, enabling you to start developing the hovercards via the `src` folder
yarn start:wpcom

# This creates a development build of the library and synchronizes it with your Gravatar sandbox
yarn start:sync-wpcom
```

### Build

Create a production-ready build of the library by running the following command:

```bash
# This creates a build directory that houses the built files
yarn build:wpcom

# This command both creates a build directory with the built files and synchronizes them with your Gravatar sandbox
yarn build:sync-wpcom
```


