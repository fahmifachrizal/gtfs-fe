import dynamic from "next/dynamic"

// Dynamically import the Map component with SSR disabled
const HeroDynamic = dynamic(() => import("./hero-section"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-background"></div>
  ),
})

export default HeroDynamic
