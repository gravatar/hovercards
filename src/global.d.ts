import type { CreateHovercard } from './core';

declare global {
	interface Window {
		Gravatar: {
			my_hash: string;
			profile_cb: ( hash: string, id: string ) => void;
			createHovercard: CreateHovercard;
			init: ( container?: string, ignore?: string ) => void;
		};
	}
}

export {};
