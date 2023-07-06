declare global {
	// TODO: 
	type ProfileData = Record< string, any >;
	interface Window {
		Gravatar: {
			init: ( container?: string, ignore?: string ) => void;
			profile_cb: ( hash: string, id: string ) => void;
		};
	}
}

export {};