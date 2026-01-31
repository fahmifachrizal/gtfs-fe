import React, { Suspense } from 'react';

// Use React.lazy for dynamic import
const LeafletMap = React.lazy(() => import('./leaflet'));

export default function LeafletDynamic({ rightPadding, ...props }) {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full animate-pulse flex items-center justify-center">
          <span className="text-gray-500">Loading map...</span>
        </div>
      }
    >
      <LeafletMap rightPadding={rightPadding} {...props} />
    </Suspense>
  );
}