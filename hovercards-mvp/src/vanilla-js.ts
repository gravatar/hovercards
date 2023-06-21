import Hovercards from "./core";

// TODO: Fix the type error
// @ts-ignore
window.Gravatar = {
  init( container: HTMLElement ) {
    new Hovercards( container || document.body );

    const version = 17;

    // This is how the current hovercards work with JP, but for an OSS, I'd like to move this to the developer's side
    document.head.insertAdjacentHTML(
      'beforeend',
      `<link rel="stylesheet" id="gravatar-card-css" href="https://0.gravatar.com/dist/css/hovercard.min.css?ver=${ version }" />`
    );
  }
}

