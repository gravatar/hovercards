// TODO: Turn this into TypeScript

import { useRef } from 'react';

import useHovercards from "./useHovercards";

export default function Hovercards( { children, container, loadingMask, placement, onFetchProfileFinish } ) {
  const containerRef = useRef();
  const { isLoading } = useHovercards( container || containerRef.current, { placement, onFetchProfileFinish } );

  if ( container ) {
    return null;
  }

  return (
    <div ref={ containerRef }>
      { isLoading && loadingMask }
      { children }
    </div>
  );
}