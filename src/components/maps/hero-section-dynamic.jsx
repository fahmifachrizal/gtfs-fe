import React, { Suspense } from "react"

// Use React.lazy for dynamic import
const HeroSection = React.lazy(() => import("./hero-section"))

export default function HeroDynamic(props) {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full bg-background" />
      }
    >
      <HeroSection {...props} />
    </Suspense>
  )
}
