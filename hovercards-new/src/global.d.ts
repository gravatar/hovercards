declare global {
	interface Window {
		Gravatar: {
			profile_cb: ( hash: string, id: string ) => void;
			init: ( container?: string, ignore?: string ) => void;
		};
	}
}

export {};