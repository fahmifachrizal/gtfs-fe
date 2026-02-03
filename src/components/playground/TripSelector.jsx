import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Loader2, ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── sort helpers ────────────────────────────────────────────────────────────
// Priority:  0 = leading digits   1 = leading letter (not JAK.)
//            2 = JAK. prefix      3 = everything else
function categorise(id) {
  const s = String(id)
  const numMatch = s.match(/^(\d+)/)
  if (numMatch) return { cat: 0, num: parseInt(numMatch[1], 10), raw: s }
  if (s.startsWith("JAK."))  return { cat: 2, num: 0, raw: s }
  if (/^[A-Za-z]/.test(s))   return { cat: 1, num: 0, raw: s }
  return { cat: 3, num: 0, raw: s }
}

function sortIds(ids) {
  return ids.map(categorise).sort((a, b) => {
    if (a.cat !== b.cat) return a.cat - b.cat
    if (a.cat === 0)     return a.num - b.num          // numeric within numbers
    return a.raw.localeCompare(b.raw)                  // alpha within every other group
  }).map(item => item.raw)
}

// ── generic Combobox ────────────────────────────────────────────────────────
function Combobox({ items, value, placeholder, onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm"
          disabled={disabled}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {items.find(i => i.value === value)?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-9999" align="start">
        <Command>
          <CommandInput
            placeholder="Search…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {filtered.map(item => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={() => {
                  onSelect(item.value)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <Check className={cn("h-4 w-4 shrink-0", value === item.value ? "opacity-100" : "opacity-0")} />
                {item.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * routeGroups  –  { [route_id]: { [direction_id]: [trip, …] } }
 * selectedTrip –  the full trip object that is currently active
 * onTripChange –  (tripId: string) => void
 * isLoading    –  disables comboboxes while the map data is being fetched
 */
export function TripSelector({ routeGroups = {}, selectedTrip, onTripChange, isLoading }) {
  // Route list – sorted
  const routeItems = sortIds(Object.keys(routeGroups)).map(id => ({ value: id, label: id }))

  const selectedRoute     = selectedTrip ? String(selectedTrip.route_id)            : ""
  const selectedDirection = selectedTrip ? String(selectedTrip.direction_id || 0)   : ""

  // Directions for current route – sorted
  const directionItems = selectedRoute && routeGroups[selectedRoute]
    ? sortIds(Object.keys(routeGroups[selectedRoute])).map(d => ({
        value: d,
        label: d === "0" ? "Outbound (0)" : d === "1" ? "Inbound (1)" : `Direction ${d}`,
      }))
    : []

  // Trips for current route + direction – sorted by trip_id
  const tripItems = selectedRoute && routeGroups[selectedRoute]?.[selectedDirection]
    ? sortIds(
        routeGroups[selectedRoute][selectedDirection].map(t => String(t.trip_id))
      ).map(tid => {
        const trip = routeGroups[selectedRoute][selectedDirection].find(t => String(t.trip_id) === tid)
        return { value: tid, label: trip.trip_headsign || trip.trip_short_name || tid }
      })
    : []

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleRouteChange = (routeId) => {
    const firstDir  = Object.keys(routeGroups[routeId])[0]
    const firstTrip = routeGroups[routeId][firstDir][0]
    if (firstTrip) onTripChange(String(firstTrip.trip_id))
  }

  const handleDirectionChange = (direction) => {
    const firstTrip = routeGroups[selectedRoute]?.[direction]?.[0]
    if (firstTrip) onTripChange(String(firstTrip.trip_id))
  }

  // ── empty state ───────────────────────────────────────────────────────────
  if (routeItems.length === 0) {
    return (
      <Card className="absolute top-4 right-4 z-1000 w-80 backdrop-blur-md bg-background/95 shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Trip Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No trips available in this project
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── main panel ────────────────────────────────────────────────────────────
  return (
    <Card className="absolute top-4 right-4 z-1000 w-80 backdrop-blur-md bg-background/95 shadow-xl border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Trip Viewer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Route combobox */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Route</label>
          <Combobox
            items={routeItems}
            value={selectedRoute}
            placeholder="Select a route…"
            onSelect={handleRouteChange}
            disabled={isLoading}
          />
        </div>

        {/* Direction combobox */}
        {selectedRoute && directionItems.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Direction</label>
            <Combobox
              items={directionItems}
              value={selectedDirection}
              placeholder="Select direction…"
              onSelect={handleDirectionChange}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Trip combobox */}
        {selectedRoute && selectedDirection && tripItems.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Trip</label>
            <Combobox
              items={tripItems}
              value={selectedTrip?.trip_id ? String(selectedTrip.trip_id) : ""}
              placeholder="Select a trip…"
              onSelect={onTripChange}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading route data…</span>
          </div>
        )}

        {/* Metadata */}
        {selectedTrip && !isLoading && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Trip ID</span>
              <div className="text-sm font-mono">{selectedTrip.trip_id}</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Route</span>
              <div className="text-sm">{selectedTrip.route_id || 'N/A'}</div>
            </div>

            {selectedTrip.trip_headsign && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Headsign</span>
                <div className="text-sm">{selectedTrip.trip_headsign}</div>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Direction</span>
              <div className="text-sm">
                {selectedTrip.direction_id === 0 ? 'Outbound (0)' :
                 selectedTrip.direction_id === 1 ? 'Inbound (1)' :
                 `Direction ${selectedTrip.direction_id ?? 'N/A'}`}
              </div>
            </div>

            {selectedTrip.service_id && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Service</span>
                <div className="text-sm font-mono">{selectedTrip.service_id}</div>
              </div>
            )}

            {selectedTrip.shape_id && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Shape</span>
                <div className="text-sm font-mono">{selectedTrip.shape_id}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
