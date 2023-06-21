// TODO: refine the type
export interface ProfileData {
  [ key: string ]: any;
}

const BASE_API_URL = 'https://secure.gravatar.com';

export async function fetchProfile( hash: string ): Promise< ProfileData | Error > {
  if ( ! hash ) {
    throw new Error( 'hash is required' );
  }

  try {
    const res = await fetch( `${ BASE_API_URL }/${ hash }.json` );
    let data = await res.json();

    // API error handling
    if ( ! data?.entry ) {
      // The data will be an error message
      throw new Error( data );
    }

    return data.entry[0];
  } catch ( error ) {
    return error as Error;
  }
}

const cachedProfiles = new Map< string, ProfileData >();

export default async function fetchProfileWithCache( hash: string ): ReturnType< typeof fetchProfile > {
  if ( cachedProfiles.has( hash ) ) {
    return cachedProfiles.get( hash )!;
  } 

  try {
    const data = await fetchProfile( hash );
    cachedProfiles.set( hash, data );

    return data;
  } catch ( error ) {
    return error as Error;
  }
}