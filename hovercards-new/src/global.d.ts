import Hovercards from "./core";

declare global {
	interface Window {
		Gravatar: {
			Hovercards: typeof Hovercards;
			my_hash: string;
			profile_cb: ( hash: string, id: string ) => void;
			init: ( container?: string, ignore?: string ) => void;
		};
	}
}

export {};