import React, { Suspense } from "react"

// Use React.lazy for dynamic import
const HeroSection = React.lazy(() => import("./hero-section"))

export default function HeroDynamic(props) {
  return (
    <Suspense 
      fallback={
        <div className="h-full w-full flex items-center justify-center bg-background">
          <div className="animate-pulse">Loading Map...</div>
        </div>
      }
    >
      <HeroSection {...props} />
    </Suspense>
  )
}
