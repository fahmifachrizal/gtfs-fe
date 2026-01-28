import dynamic from 'next/dynamic';

// Dynamically import the Map component with SSR disabled
const LeafletDynamic = dynamic(() => import('./leaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

export default LeafletDynamic;