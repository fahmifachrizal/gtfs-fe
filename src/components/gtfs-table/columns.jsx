import React from "react"

const agency = [
  { accessorKey: "agency_id", header: "Agency ID", required: false },
  { accessorKey: "agency_name", header: "Agency Name", required: true },
  { accessorKey: "agency_url", header: "Agency URL", required: true },
  { accessorKey: "agency_timezone", header: "Agency Timezone", required: true },
  { accessorKey: "agency_lang", header: "Agency Language", required: false },
  { accessorKey: "agency_phone", header: "Agency Phone", required: false },
  {
    accessorKey: "agency_fare_url",
    header: "Agency Fare URL",
    required: false,
  },
  { accessorKey: "agency_email", header: "Agency Email", required: false },
]

const stops = [
  {
    accessorKey: "stop_id",
    header: "Stop ID",
    cell: ({ row }) => {
      return <div className="w-15 font-semibold">{row.getValue("stop_id")}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_name",
    header: () => <div className="w-1/2">Stop Name</div>,
    cell: ({ row }) => {
      return <div className="w-45 truncate">{row.getValue("stop_name")}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_lat",
    header: "Latitude",
    cell: ({ row }) => {
      return <div className="w-12.5">{Number(row.getValue("stop_lat")).toFixed(4)}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_lon",
    header: "Longitude",
    cell: ({ row }) => {
      return <div className="w-12.5">{Number(row.getValue("stop_lon")).toFixed(4)}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_code",
    header: "Stop Code",
    visible: false,
    required: false,
  },
  {
    accessorKey: "stop_desc",
    header: "Stop Description",
    visible: false,
    required: false,
  },
  {
    accessorKey: "zone_id",
    header: "Zone ID",
    visible: false,
    required: false,
  },
  {
    accessorKey: "stop_url",
    header: "Stop URL",
    visible: false,
    required: false,
  },
  {
    accessorKey: "location_type",
    header: "Location Type",
    visible: false,
    required: false,
  },
  {
    accessorKey: "parent_station",
    header: "Parent Station",
    visible: false,
    required: false,
  },
  {
    accessorKey: "stop_timezone",
    header: "Stop Timezone",
    visible: false,
    required: false,
  },
  {
    accessorKey: "wheelchair_boarding",
    header: "Wheelchair Boarding",
    visible: false,
    required: false,
  },
]

const routes = [
  { accessorKey: "route_id", header: "Route ID", required: true },
  { accessorKey: "agency_id", header: "Agency ID", required: false },
  {
    accessorKey: "route_short_name",
    header: "Route Short Name",
    required: true,
  },
  { accessorKey: "route_long_name", header: "Route Long Name", required: true },
  { accessorKey: "route_desc", header: "Route Description", required: false },
  { accessorKey: "route_type", header: "Route Type", required: true },
  { accessorKey: "route_url", header: "Route URL", required: false },
  { accessorKey: "route_color", header: "Route Color", required: false },
  {
    accessorKey: "route_text_color",
    header: "Route Text Color",
    required: false,
  },
  {
    accessorKey: "continuous_pickup",
    header: "Continuous Pickup",
    required: false,
  },
  {
    accessorKey: "continuous_drop_off",
    header: "Continuous Drop Off",
    required: false,
  },
]

const trips = [
  {
    accessorKey: "trip_id",
    header: "Trip ID",
    cell: ({ row }) => <div className="w-20 font-mono text-xs">{row.getValue("trip_id")}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "route_id",
    header: "Route ID",
    cell: ({ row }) => <div className="w-16 font-semibold">{row.getValue("route_id")}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "service_id",
    header: "Service ID",
    cell: ({ row }) => <div className="w-16">{row.getValue("service_id")}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "trip_headsign",
    header: "Headsign",
    cell: ({ row }) => <div className="w-32 truncate">{row.getValue("trip_headsign") || "-"}</div>,
    visible: true,
    required: false,
  },
  {
    accessorKey: "direction_id",
    header: "Dir",
    cell: ({ row }) => <div className="w-8 text-center">{row.getValue("direction_id")}</div>,
    visible: true,
    required: false,
  },
  {
    accessorKey: "trip_short_name",
    header: "Short Name",
    visible: false,
    required: false,
  },
  {
    accessorKey: "block_id",
    header: "Block ID",
    visible: false,
    required: false,
  },
  {
    accessorKey: "shape_id",
    header: "Shape ID",
    visible: false,
    required: false,
  },
  {
    accessorKey: "wheelchair_accessible",
    header: "Wheelchair",
    visible: false,
    required: false,
  },
  {
    accessorKey: "bikes_allowed",
    header: "Bikes",
    visible: false,
    required: false,
  },
]

const stopTimes = [
  { accessorKey: "trip_id", header: "Trip ID", required: true },
  { accessorKey: "arrival_time", header: "Arrival Time", required: true },
  { accessorKey: "departure_time", header: "Departure Time", required: true },
  { accessorKey: "stop_id", header: "Stop ID", required: true },
  { accessorKey: "stop_sequence", header: "Stop Sequence", required: true },
  { accessorKey: "stop_headsign", header: "Stop Headsign", required: false },
  { accessorKey: "pickup_type", header: "Pickup Type", required: false },
  { accessorKey: "drop_off_type", header: "Drop Off Type", required: false },
  {
    accessorKey: "continuous_pickup",
    header: "Continuous Pickup",
    required: false,
  },
  {
    accessorKey: "continuous_drop_off",
    header: "Continuous Drop Off",
    required: false,
  },
  {
    accessorKey: "shape_dist_traveled",
    header: "Shape Distance Traveled",
    required: false,
  },
  { accessorKey: "timepoint", header: "Timepoint", required: false },
]

const calendar = [
  {
    accessorKey: "service_id",
    header: "Service ID",
    cell: ({ row }) => <div className="w-24 font-semibold">{row.getValue("service_id")}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "monday",
    header: "M",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("monday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "tuesday",
    header: "T",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("tuesday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "wednesday",
    header: "W",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("wednesday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "thursday",
    header: "T",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("thursday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "friday",
    header: "F",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("friday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "saturday",
    header: "S",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("saturday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "sunday",
    header: "S",
    cell: ({ row }) => <div className="w-6 text-center">{row.getValue("sunday") ? "✓" : "-"}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "start_date",
    header: "Start",
    cell: ({ row }) => <div className="w-20 font-mono text-xs">{row.getValue("start_date")}</div>,
    visible: true,
    required: true,
  },
  {
    accessorKey: "end_date",
    header: "End",
    cell: ({ row }) => <div className="w-20 font-mono text-xs">{row.getValue("end_date")}</div>,
    visible: true,
    required: true,
  },
]

const columns = { agency, stops, routes, trips, stopTimes, calendar }
export { columns }
