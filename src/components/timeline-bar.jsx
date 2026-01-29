"use client"

import { useState, useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Timeline({
  isPlaying = false,
  onPlayPause = () => {},
  onReset = () => {},
}) {
  const getInitialTime = () => {
    const now = new Date()
    return now.getHours() + now.getMinutes() / 60
  }

  const [currentTime, setCurrentTime] = useState(getInitialTime) // User's current time in hours
  const [speed, setSpeed] = useState(1) // Speed multiplier

  // Auto-advance timeline
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + (10 / 60 / 20) * speed // 10 minutes per second divided by 20 intervals per second
        return next >= 24 ? 0 : next
      })
    }, 50) // 50ms intervals for smooth animation

    return () => clearInterval(interval)
  }, [isPlaying, speed])

  const formatTime = (hours) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => (currentTime / 24) * 100

  const reset = () => {
    setCurrentTime(getInitialTime)
    onReset()
  }

  const cycleSpeed = () => {
    const speeds = [1, 2, 4]
    const currentIndex = speeds.indexOf(speed)
    const nextIndex = (currentIndex + 1) % speeds.length
    setSpeed(speeds[nextIndex])
  }

  const handlePlayPause = () => {
    onPlayPause()
  }

  return (
    <div className="w-full max-w-4xl">
      <Card className="bg-black/10 backdrop-blur-sm border-white/10 shadow-2xl">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center justify-between text-white">
            <span className="text-xl font-mono font-normal">
              Bus Route Timeline
            </span>
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="h-8 w-8 bg-white/10 hover:bg-white/20 border-white/20 text-white">
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Current Time */}
              <div
                onClick={reset}
                className="w-32 text-3xl font-mono font-normal text-white tracking-wider text-center cursor-pointer select-none hover:bg-white/10 rounded px-2 py-1 transition-colors">
                {formatTime(currentTime)}
              </div>

              {/* Speed Control */}
              <Button
                variant="ghost"
                onClick={cycleSpeed}
                className="h-8 w-8 bg-white/10 hover:bg-white/20 border-white/20 text-white font-normal px-3 py-1 text-sm">
                {speed}x
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Timeline Container */}
          <div className="relative overflow-clip">
            {/* 10-minute tick marks with padding */}
            <div className="relative h-6 mb-2 mx-4">
              {/* Yesterday's continuation ticks */}
              {Array.from({ length: 6 }, (_, i) => {
                const minutes = 23 * 60 + (50 + i * 10) // 23:50, 24:00 (0:00), etc.
                const adjustedMinutes =
                  minutes >= 24 * 60 ? minutes - 24 * 60 : minutes
                const position = -((6 - i) * (10 / 60 / 24) * 100) // Negative positions for yesterday
                const isHourMark = adjustedMinutes % 60 === 0

                return (
                  <div
                    key={`yesterday-${i}`}
                    className={`absolute w-0.5 bg-white/5 ${
                      isHourMark ? "h-4" : "h-2"
                    } rounded-full`}
                    style={{
                      left: `${position}%`,
                      transform: "translateX(-50%)",
                      bottom: "0px",
                    }}
                  />
                )
              })}

              {/* Main day tick marks */}
              {Array.from({ length: 144 }, (_, i) => {
                const minutes = i * 10
                const hours = minutes / 60
                const position = (hours / 24) * 100
                const isHourMark = minutes % 60 === 0
                const isNightTime = minutes < 360 || minutes > 1080

                return (
                  <div
                    key={i}
                    className={`absolute ${
                      isHourMark
                        ? isNightTime
                          ? "w-0.5 h-4 bg-white/50" // Darker shade for night time hour marks
                          : "w-0.5 h-4 bg-white/80" // Lighter shade for daytime hour marks
                        : isNightTime
                        ? "w-0.5 h-2 bg-white/20" // Darker shade for night time 10 minutes marks
                        : "w-0.5 h-2 bg-white/50" // Lighter shade for daytime 10 minutes marks
                    } rounded-full`}
                    style={{
                      left: `${position}%`,
                      transform: "translateX(-50%)",
                      bottom: "0px",
                    }}
                  />
                )
              })}

              {/* Tomorrow's continuation ticks */}
              {Array.from({ length: 6 }, (_, i) => {
                const minutes = i * 10 // 00:00, 00:10, 00:20, etc.
                const position = 100 + i * (10 / 60 / 24) * 100 // Positive positions beyond 100% for tomorrow
                const isHourMark = minutes % 60 === 0

                return (
                  <div
                    key={`tomorrow-${i}`}
                    className={`absolute w-0.5 bg-white/5 ${
                      isHourMark ? "h-4" : "h-2"
                    } rounded-full`}
                    style={{
                      left: `${position}%`,
                      transform: "translateX(-50%)",
                      bottom: "0px",
                    }}
                  />
                )
              })}

              {/* Current Time Indicator on Hour Markers */}
              <div
                className="absolute bottom-0 w-1 h-6 bg-red-600 shadow-lg transition-all duration-100 ease-linear z-20 rounded-full"
                style={{
                  left: `${getProgressPercentage()}%`,
                  transform: "translateX(-50%)",
                }}
              />
            </div>
          </div>
          {/* Hour Markers - Every 2 Hours with padding */}
          <div className="relative mx-4 mb-6">
            {Array.from({ length: 13 }, (_, i) => {
              const hour = i * 2
              const position = (hour / 24) * 100
              return (
                <div
                  key={hour}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}>
                  <div
                    className={`text-xs font-mono font-normal text-center ${
                      hour >= 6 && hour <= 18
                        ? "text-white/80"
                        : "text-white/40"
                    }`}>
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
