import dynamic from 'next/dynamic';

// Dynamically import the Map component with SSR disabled
const MapboxDynamic = dynamic(() => import('./mapbox'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#090909] animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

export default MapboxDynamic;