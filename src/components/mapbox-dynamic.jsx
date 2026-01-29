import React, { Suspense } from 'react';

// Use React.lazy for dynamic import
const MapboxMap = React.lazy(() => import('./mapbox'));

export default function MapboxDynamic(props) {
  return (
    <Suspense 
      fallback={
        <div className="h-full w-full bg-[#090909] animate-pulse flex items-center justify-center">
          <span className="text-gray-500">Loading map...</span>
        </div>
      }
    >
      <MapboxMap {...props} />
    </Suspense>
  );
}