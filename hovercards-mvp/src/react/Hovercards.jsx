// TODO: Turn this into TypeScript

import { useRef } from 'react';

import useHovercards from "./useHovercards";

export default function Hovercards( { children, container, loadingComponent, placement, onFetchProfileFinish } ) {
  const containerRef = useRef();
  const { isLoading } = useHovercards( container || containerRef.current, { placement, onFetchProfileFinish } );

  if ( container ) {
    return null;
  }

  return isLoading ? loadingComponent : ( <div ref={ containerRef }>{ children }</div> );
}