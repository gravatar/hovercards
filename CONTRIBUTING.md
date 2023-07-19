# Contributing to Gravatar Hovercards

🤗 Welcome, and thank you for your interest in Gravatar Hovercards! Whether you're here to report an issue, suggest a new feature, or submit code changes, we greatly appreciate your help.

## Questions, Issue Reporting, and Feature Suggestions

Please [submit an issue](https://github.com/Automattic/gravatar-hovercards/issues/new/choose) with all pertinent details and context to help us fully understand your report or suggestion. To avoid duplication, kindly check for existing issues or feature requests similar to yours before filing a new one.

## Code Contributions

We welcome Pull Requests, particularly for bug fixes related to any open issues you wish to address! If you're new to creating Pull Requests, we suggest you check out [this free video series](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github).

Gravatar Hovercards is developed using [TypeScript](https://www.typescriptlang.org/), [Sass](https://sass-lang.com/) (following [BEM naming conventions](https://getbem.com/)), and is bundled using [Webpack](https://webpack.js.org/). For package management and script running, we use [Yarn](https://yarnpkg.com/).

### Development Workflow

The general development workflow is as follows:

1. Fork and clone the repository.
2. Install the dependencies by running `yarn install`. Make sure your Node version matches the minimum requirement specified in the `package.json` file.
3. Build the library in development mode using `yarn build:dev`. This command compiles the code and watches for changes.
4. **In a new terminal**, start a local server with `yarn start`. Now you can modify the code in the `src` folder and test it (or the output formats) in the `playground` directory.
5. Update or add the related types if necessary.
6. If needed, update the relevant documentation such as [README.md](https://github.com/Automattic/gravatar-hovercards/blob/trunk/README.md) or [CONTRIBUTING.md](https://github.com/Automattic/gravatar-hovercards/blob/trunk/CONTRIBUTING.md).
7. Create a Pull Request with your changes.

### Scripts

Below is a list of available scripts. You can run them using `yarn <script>`:

- `start`: Starts a local server to test the library in development mode.
- `build`: Builds the library in production mode, creating the `dist` folder with bundled files.
- `build:dev`: Builds the library in development mode, creating the `dist` folder with bundled files and watching for changes.
- `build:types`: Builds the library types.
- `format`: Formats the code using the [`format`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#format) script of `@wordpress/scripts`.
- `type-check`: Checks the types using [TypeScript](https://www.typescriptlang.org/).
- `lint:js`: Lints the JavaScript / TypeScript code using the [`lint:js`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#lint-js) script of `@wordpress/scripts`.
- `lint:style`: Lints the Sass / CSS code using the [`lint:style`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#lint-style) script of `@wordpress/scripts`.
- `lint:md:docs`: Lints the Markdown files using the [`lint:md:docs`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#lint-md-docs) script of `@wordpress/scripts`.
- `lint`: Runs all the linters.
- `clean`: Removes the `dist` folder.

### PR Merge Policy

- Pull Requests (PRs) must receive approval from at least one reviewer before they can be merged into the `trunk` branch.
- Who is responsible for merging the approved PRs?
    - For PRs authored by external individuals who do not have push permissions, the reviewer who approved the PR will handle the merging process.
    - For PRs authored by contributors who have push permissions, the author of the PR will merge their own PR.
