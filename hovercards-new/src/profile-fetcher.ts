// TODO: Refine the type
export type ProfileData = Record< string, any >;

const BASE_API_URL = 'https://secure.gravatar.com';

async function fetchProfile( hash: string ): Promise< ProfileData | Error > {
	if ( ! hash ) {
		throw new Error( 'hash is required' );
	}

	try {
		const res = await fetch( `${ BASE_API_URL }/${ hash }.json` );
		const data = await res.json();

		// API error handling
		if ( ! data?.entry ) {
			// The data will be an error message
			throw new Error( data );
		}

		return data.entry[ 0 ];
	} catch ( error ) {
		return error as Error;
	}
}

export const cachedProfiles = new Map< string, ProfileData >();

export default async function fetchProfileWithCache( hash: string ): Promise< ProfileData | Error > {
	if ( cachedProfiles.has( hash ) ) {
		return cachedProfiles.get( hash )!;
	}

	try {
		const data = await fetchProfile( hash );

		if ( data instanceof Error ) {
			throw data;
		}

		cachedProfiles.set( hash, data );

		return data;
	} catch ( error ) {
		return error as Error;
	}
}
