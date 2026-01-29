// hooks/useRouteScheduler.js
import { useState, useEffect, useCallback, useRef } from "react"
import {
  calculateDepartures,
  getNextDeparture,
  isWithinOperatingHours,
  isOperatingDay,
  getTimeUntilDeparture,
  getScheduleStats,
} from "@/utils/time-utils"
import { createInstanceId } from "@/types/route-types"

/**
 * Custom hook for managing route schedules and instance creation
 * @param {Array} routesData - Array of route configurations
 * @param {Function} onInstanceCreate - Callback when instance should be created
 * @returns {Object} Scheduler state and controls
 */
export const useRouteScheduler = (routesData = [], onInstanceCreate = null) => {
  // Schedule states for each route
  const [scheduleStates, setScheduleStates] = useState(new Map())

  // Track active instances per route
  const [activeInstances, setActiveInstances] = useState(new Map())

  // Clock tick for updates
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Refs to avoid stale closures
  const routesDataRef = useRef(routesData)
  const onInstanceCreateRef = useRef(onInstanceCreate)
  const schedulerTimerRef = useRef(null)
  const nextCheckTimeRef = useRef(null)

  // Update refs when props change
  useEffect(() => {
    routesDataRef.current = routesData
  }, [routesData])

  useEffect(() => {
    onInstanceCreateRef.current = onInstanceCreate
  }, [onInstanceCreate])

  /**
   * Initialize schedule state for a route
   */
  const initializeSchedule = useCallback((route) => {
    if (!route.schedule || !route.schedule.enabled) return null

    const departures = calculateDepartures(route.schedule)
    const nextDeparture = getNextDeparture(departures)
    const stats = getScheduleStats(route.schedule)

    return {
      routeId: route.id,
      enabled: route.schedule.enabled,
      schedule: route.schedule,
      departures,
      nextDepartureTime: nextDeparture,
      lastDepartureTime: null,
      totalDepartures: 0,
      stats,
      initialized: Date.now(),
    }
  }, [])

  /**
   * Initialize all schedules
   */
  useEffect(() => {
    const newStates = new Map()
    const newActiveInstances = new Map()

    routesData.forEach((route) => {
      const state = initializeSchedule(route)
      if (state) {
        newStates.set(route.id, state)
        newActiveInstances.set(route.id, 0)

        console.log(`[Scheduler] Initialized schedule for ${route.id}:`, {
          departures: state.departures.length,
          nextDeparture: state.nextDepartureTime,
          stats: state.stats,
        })
      }
    })

    setScheduleStates(newStates)
    setActiveInstances(newActiveInstances)
  }, [routesData, initializeSchedule])

  /**
   * Create a scheduled instance
   */
  const createScheduledInstance = useCallback((routeId, scheduledTime) => {
    const route = routesDataRef.current.find((r) => r.id === routeId)
    if (!route) {
      console.warn(`[Scheduler] Route ${routeId} not found`)
      return null
    }

    const instanceId = createInstanceId(routeId)
    const now = Date.now()

    console.log(`[Scheduler] Creating instance ${instanceId} for ${routeId}`)

    // Update schedule state
    setScheduleStates((prev) => {
      const next = new Map(prev)
      const state = next.get(routeId)

      if (state) {
        const nextDeparture = getNextDeparture(state.departures, now)
        next.set(routeId, {
          ...state,
          lastDepartureTime: now,
          totalDepartures: state.totalDepartures + 1,
          nextDepartureTime: nextDeparture,
        })
      }

      return next
    })

    // Increment active instances
    setActiveInstances((prev) => {
      const next = new Map(prev)
      next.set(routeId, (prev.get(routeId) || 0) + 1)
      return next
    })

    // Call the instance creation callback
    if (onInstanceCreateRef.current) {
      onInstanceCreateRef.current(instanceId, routeId, {
        scheduledTime,
        actualTime: now,
        schedule: route.schedule,
      })
    }

    return instanceId
  }, [])

  /**
   * Check schedules and create instances if needed
   */
  const checkSchedules = useCallback(() => {
    const now = Date.now()
    setCurrentTime(now)

    scheduleStates.forEach((state, routeId) => {
      if (!state.enabled) return

      const route = routesDataRef.current.find((r) => r.id === routeId)
      if (!route) return

      // Check if we should operate today
      if (!isOperatingDay(state.schedule, new Date(now))) {
        return
      }

      // Check if within operating hours
      if (!isWithinOperatingHours(state.schedule, new Date(now))) {
        return
      }

      // Check max instances limit
      const currentActive = activeInstances.get(routeId) || 0
      if (
        state.schedule.maxInstances &&
        currentActive >= state.schedule.maxInstances
      ) {
        return
      }

      // Check if it's time for next departure
      if (state.nextDepartureTime && now >= state.nextDepartureTime) {
        // Allow small grace period (500ms) to avoid double-triggering
        const timeSinceScheduled = now - state.nextDepartureTime
        if (timeSinceScheduled < 500) {
          createScheduledInstance(routeId, state.nextDepartureTime)
        }
      }
    })
  }, [scheduleStates, activeInstances, createScheduledInstance])

  /**
   * Smart scheduler that checks at the right times
   */
  useEffect(() => {
    if (scheduleStates.size === 0) return

    const scheduleNextCheck = () => {
      const now = Date.now()
      let minWaitTime = 1000 // Default: check every second

      // Find the soonest next departure
      scheduleStates.forEach((state) => {
        if (state.enabled && state.nextDepartureTime) {
          const timeUntil = getTimeUntilDeparture(state.nextDepartureTime, now)
          if (timeUntil > 0 && timeUntil < minWaitTime) {
            minWaitTime = timeUntil
          }
        }
      })

      // Cap maximum wait time at 5 seconds for responsiveness
      minWaitTime = Math.min(minWaitTime, 5000)

      // Schedule next check
      nextCheckTimeRef.current = now + minWaitTime
      schedulerTimerRef.current = setTimeout(() => {
        checkSchedules()
        scheduleNextCheck()
      }, minWaitTime)
    }

    // Initial check and scheduling
    checkSchedules()
    scheduleNextCheck()

    // Cleanup
    return () => {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current)
      }
    }
  }, [scheduleStates, checkSchedules])

  /**
   * Notify when an instance completes
   */
  const notifyInstanceComplete = useCallback((instanceId, routeId) => {
    console.log(`[Scheduler] Instance ${instanceId} completed`)

    setActiveInstances((prev) => {
      const next = new Map(prev)
      const current = prev.get(routeId) || 0
      next.set(routeId, Math.max(0, current - 1))
      return next
    })
  }, [])

  /**
   * Enable/disable schedule for a route
   */
  const toggleSchedule = useCallback((routeId, enabled) => {
    setScheduleStates((prev) => {
      const next = new Map(prev)
      const state = next.get(routeId)

      if (state) {
        next.set(routeId, { ...state, enabled })
        console.log(
          `[Scheduler] ${
            enabled ? "Enabled" : "Disabled"
          } schedule for ${routeId}`
        )
      }

      return next
    })
  }, [])

  /**
   * Update schedule configuration
   */
  const updateSchedule = useCallback(
    (routeId, newSchedule) => {
      const route = routesDataRef.current.find((r) => r.id === routeId)
      if (!route) return

      // Update route data
      route.schedule = { ...route.schedule, ...newSchedule }

      // Re-initialize schedule state
      const state = initializeSchedule(route)
      if (state) {
        setScheduleStates((prev) => {
          const next = new Map(prev)
          next.set(routeId, state)
          return next
        })

        console.log(`[Scheduler] Updated schedule for ${routeId}`)
      }
    },
    [initializeSchedule]
  )

  /**
   * Get schedule info for a specific route
   */
  const getScheduleInfo = useCallback(
    (routeId) => {
      return scheduleStates.get(routeId) || null
    },
    [scheduleStates]
  )

  /**
   * Get all schedule info
   */
  const getAllScheduleInfo = useCallback(() => {
    const info = {}
    scheduleStates.forEach((state, routeId) => {
      info[routeId] = {
        ...state,
        activeInstances: activeInstances.get(routeId) || 0,
      }
    })
    return info
  }, [scheduleStates, activeInstances])

  return {
    // State
    scheduleStates,
    activeInstances,
    currentTime,

    // Methods
    notifyInstanceComplete,
    toggleSchedule,
    updateSchedule,
    getScheduleInfo,
    getAllScheduleInfo,
    createScheduledInstance,
  }
}

export default useRouteScheduler
