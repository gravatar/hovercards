import Hovercards from "./core";

declare global {
	interface Window {
		Gravatar: {
			Hovercards: typeof Hovercards;
			profile_cb: ( hash: string, id: string ) => void;
			init: ( container?: string, ignore?: string ) => void;
		};
	}
}

export {};