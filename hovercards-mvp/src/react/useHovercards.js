// TODO: Turn this into TypeScript

import { useEffect, useState } from 'react';

import Hovercards from '../core';

export default function useHovercards( target, { placement, onFetchProfileFinish } = {} ) {
  const [ isLoading, setIsLoading ] = useState( true );

  useEffect( () => {
    const hovercards = new Hovercards( target, {
      placement,
      onFetchProfileFinish: ( profileData ) => {
        setIsLoading( false );
        if ( onFetchProfileFinish ) onFetchProfileFinish( profileData );
      }
    } );

    () => hovercards.removeEventListeners();
  }, [] );

  return { isLoading };
}