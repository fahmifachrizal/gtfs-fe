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
      return <div className="w-[60px] font-semibold">{row.getValue("stop_id")}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_name",
    header: () => <div className="w-1/2">Stop Name</div>,
    cell: ({ row }) => {
      return <div className="w-[180px] truncate">{row.getValue("stop_name")}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_lat",
    header: "Latitude",
    cell: ({ row }) => {
      return <div className="w-[50px]">{Number(row.getValue("stop_lat")).toFixed(4)}</div>
    },
    visible: true,
    required: true,
  },
  {
    accessorKey: "stop_lon",
    header: "Longitude",
    cell: ({ row }) => {
      return <div className="w-[50px]">{Number(row.getValue("stop_lon")).toFixed(4)}</div>
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
  { accessorKey: "route_id", header: "Route ID", required: true },
  { accessorKey: "service_id", header: "Service ID", required: true },
  { accessorKey: "trip_id", header: "Trip ID", required: true },
  { accessorKey: "trip_headsign", header: "Trip Headsign", required: false },
  {
    accessorKey: "trip_short_name",
    header: "Trip Short Name",
    required: false,
  },
  { accessorKey: "direction_id", header: "Direction ID", required: false },
  { accessorKey: "block_id", header: "Block ID", required: false },
  { accessorKey: "shape_id", header: "Shape ID", required: false },
  {
    accessorKey: "wheelchair_accessible",
    header: "Wheelchair Accessible",
    required: false,
  },
  { accessorKey: "bikes_allowed", header: "Bikes Allowed", required: false },
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
  { accessorKey: "service_id", header: "Service ID", required: true },
  { accessorKey: "monday", header: "Monday", required: true },
  { accessorKey: "tuesday", header: "Tuesday", required: true },
  { accessorKey: "wednesday", header: "Wednesday", required: true },
  { accessorKey: "thursday", header: "Thursday", required: true },
  { accessorKey: "friday", header: "Friday", required: true },
  { accessorKey: "saturday", header: "Saturday", required: true },
  { accessorKey: "sunday", header: "Sunday", required: true },
  { accessorKey: "start_date", header: "Start Date", required: true },
  { accessorKey: "end_date", header: "End Date", required: true },
]

const columns = { agency, stops, routes, trips, stopTimes, calendar }
export { columns }
