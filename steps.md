# User Creation Implementation Plan for GTFS Editor

## Overview

This document outlines the detailed steps to implement user creation functionality for stops and routes in the GTFS Editor, including a right panel overlay, map offset handling, and database schema updates.

## 1. Database Schema Updates

### 1.1 Update Prisma Schema

Add `created_by` and `creation_type` ('upload' or 'manual') fields to relevant models in `prisma/schema.prisma`:

```prisma
model Stop {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at         DateTime @default(now())
    updated_at         DateTime @updatedAt

    @@index([created_by_user_id])
    @@index([uploaded_by])
}

model Route {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at         DateTime @default(now())
    updated_at         DateTime @updatedAt

    @@index([created_by_user_id])
    @@index([uploaded_by])
}

model Trip {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at         DateTime @default(now())
    updated_at         DateTime @updatedAt

    @@index([created_by_user_id])
    @@index([uploaded_by])
}

model Agency {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at         DateTime @default(now())
    updated_at         DateTime @updatedAt

    @@index([created_by_user_id])
    @@index([uploaded_by])
}

model Calendar {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}

model CalendarDate {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}

model StopTime {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}

model FareAttribute {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}

model FareRule {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}

model Shape {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}

model Transfer {
    // ... existing fields
    created_by         String
    creation_type      String
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt

    @@index([uploaded_by])
}
```

### 1.2 Constants for Default User

Create a constants file `lib/constants.js`:

```javascript
// Default user ID for user-created content (before user system implementation)
export const DEFAULT_USER_ID = 'default-editor-user'

// Helper functions
export const isUserCreated = (item) => item.creation_type === 'manual'
export const isImportedData = (item) => itemitem.creation_type === 'upload'
```

### 1.3 Database Migration

- Run `npx prisma migrate dev --name add_user_tracking_fields`
- Existing records will have both `created_by_user_id = null` and `uploaded_by = null`
- GTFS import process will need to be updated to set `uploaded_by` field
- New user-created records will use `DEFAULT_USER_ID` for `created_by_user_id` and `uploaded_by = null`

## 2. Right Panel Component Architecture

### 2.1 Create Base Components

#### 2.1.1 RightPanel Component (`components/right-panel/right-panel.jsx`)

- Base overlay panel with slide-in animation
- Props: `isOpen`, `onClose`, `title`, `width`, `children`
- z-index management to appear above map
- Backdrop with click-to-close functionality
- Responsive design considerations

#### 2.1.2 Stop Creation Form (`components/right-panel/stop-creation-form.jsx`)

- Form fields:
  - Stop ID (auto-generated with prefix)
  - Stop Name (required)
  - Stop Code (optional)
  - Stop Description (optional)
  - Coordinates (lat/lon - populated from map click or manual input)
  - Zone ID (dropdown from existing zones)
  - Location Type (dropdown: 0=Stop, 1=Station, 2=Entrance/Exit)
  - Wheelchair Boarding (dropdown: 0=No info, 1=Accessible, 2=Not accessible)
- Validation logic
- Preview mode showing stop on map
- Save/Cancel actions

#### 2.1.3 Route Creation Form (`components/right-panel/route-creation-form.jsx`)

- Form fields:
  - Route ID (auto-generated with prefix)
  - Agency ID (dropdown from existing agencies)
  - Route Short Name (required)
  - Route Long Name (optional)
  - Route Description (optional)
  - Route Type (dropdown with GTFS route types)
  - Route Color (color picker)
  - Route Text Color (color picker with contrast validation)
  - Route URL (optional)
- Multi-step form:
  1. Basic route information
  2. Stop sequence selection (drag & drop interface)
  3. Schedule/timing setup
- Stop selection from map or list
- Route path visualization
- Save/Cancel actions

### 2.2 Form State Management

- Use React Hook Form for form validation and state
- Create custom hooks for form logic:
  - `useStopCreation()`
  - `useRouteCreation()`
- Form data persistence in case of accidental close

## 3. Map Integration and Offset Handling

### 3.1 Map Container Modifications (`app/editor/layout.js`)

#### 3.1.1 State Management

Add new state variables:

```javascript
const [rightPanelOpen, setRightPanelOpen] = useState(false)
const [rightPanelType, setRightPanelType] = useState(null) // 'stop' | 'route'
const [rightPanelWidth, setRightPanelWidth] = useState(400) // default 400px
const [mapClickEnabled, setMapClickEnabled] = useState(false)
```

#### 3.1.2 Dynamic Map Container Width

Modify map container class:

```javascript
// Current: "w-3/4 flex flex-col"
// New: Dynamic width based on panel state
const mapContainerClass = rightPanelOpen
  ? `flex flex-col transition-all duration-300 ease-in-out`
  : "w-3/4 flex flex-col transition-all duration-300 ease-in-out"

const mapContainerStyle = rightPanelOpen
  ? { width: `calc(75% - ${rightPanelWidth}px)` }
  : {}
```

### 3.2 Leaflet Map Updates (`components/leaflet.jsx`)

#### 3.2.1 Map Click Handler

Add click event handler for stop creation:

```javascript
const MapClickHandler = ({ onMapClick, clickEnabled }) => {
  const map = useMap()

  useEffect(() => {
    if (!clickEnabled) return

    const handleClick = (e) => {
      onMapClick(e.latlng)
    }

    map.on('click', handleClick)
    map.getContainer().style.cursor = 'crosshair'

    return () => {
      map.off('click', handleClick)
      map.getContainer().style.cursor = ''
    }
  }, [map, onMapClick, clickEnabled])

  return null
}
```

#### 3.2.2 Map Resize Handler

Add effect to handle map resize when panel opens/closes:

```javascript
useEffect(() => {
  if (map) {
    // Delay to allow CSS transition to complete
    setTimeout(() => {
      map.invalidateSize()
    }, 350)
  }
}, [rightPanelOpen, map])
```

### 3.3 Context Updates

Update EditorContext to include:

- Right panel state management
- Map click handling
- User creation functions

## 4. UI/UX Enhancements

### 4.1 Button Integration

#### 4.1.1 Stops Page (`app/editor/stops/page.js`)

Modify existing "Add Stop" button:

- Change `onClick={handleAddStop}` to open right panel
- Add dropdown for "Add from Map" vs "Add Manually"
- Show creation indicator in table for user-created stops

#### 4.1.2 Routes Page (`app/editor/routes/page.js`)

Modify existing "Add Route" button:

- Change `onClick={handleAddRoute}` to open right panel
- Add quick action for "Create Route from Selected Stops"
- Show creation indicator in route list for user-created routes

### 4.2 Visual Indicators

#### 4.2.1 Data Table Updates (`components/gtfs-table/columns.js`)

Add user-created and upload source indicator columns:

- Icon or badge to show data origin (imported vs user-created vs mixed)
- Filter options: "Show All", "User Created Only", "Imported Only", "By Uploader"
- Different styling for different data origins
- Helper functions from constants to check data origin
- Tooltips showing creator/uploader information

#### 4.2.2 Map Markers (`components/leaflet.jsx`)

Different marker styles for different data origins:

- Different color/shape for user-created stops vs imported stops
- Border or badge indicator showing data origin
- Custom popup content showing:
  - Creation status (user-created vs imported)
  - Creator ID (if user-created)
  - Uploader ID (if imported)
  - Creation/upload timestamp

## 5. API Endpoints

### 5.1 Stop Creation API (`app/api/gtfs/stops/route.js`)

Add POST endpoint:

```javascript
// POST /api/gtfs/stops
{
  "stop_name": "New Stop",
  "stop_lat": -6.175389,
  "stop_lon": 106.827139,
  "created_by_user_id": "default-editor-user", // Use DEFAULT_USER_ID constant
  "uploaded_by": null, // Always null for user-created content
  // ... other fields
}
```

### 5.2 Route Creation API (`app/api/gtfs/routes/route.js`)

Add POST endpoint:

```javascript
// POST /api/gtfs/routes
{
  "route_short_name": "New Route",
  "route_type": 3,
  "created_by_user_id": "default-editor-user", // Use DEFAULT_USER_ID constant
  "uploaded_by": null, // Always null for user-created content
  // ... other fields
}
```

### 5.3 GTFS Upload API (Update Existing)

Update the GTFS file upload process to include `uploaded_by` field:

```javascript
// When processing uploaded GTFS files, add to all records:
{
  "created_by_user_id": null, // Always null for imported data
  "uploaded_by": "user-id-who-uploaded", // Set to actual user ID (no default)
  // ... other fields from GTFS file
}
```

### 5.4 Batch Operations API

- Endpoint to create route with stops in single transaction
- Endpoint to duplicate existing route/stops as user-created variants
- All user-created operations set `created_by_user_id` and leave `uploaded_by` as null
- Validation endpoints for ID uniqueness

## 6. Data Validation and ID Generation

### 6.1 ID Generation Strategy

- User-created stops: `USER_STOP_001`, `USER_STOP_002`, etc.
- User-created routes: `USER_ROUTE_001`, `USER_ROUTE_002`, etc.
- Check for conflicts with existing imported data
- Allow custom ID override with validation

### 6.2 Validation Rules

- Required fields validation
- Coordinate bounds checking (reasonable lat/lng values)
- Route color contrast validation
- Stop name uniqueness within area
- Route type compatibility with agency

## 7. Error Handling and User Feedback

### 7.1 Form Validation

- Real-time validation feedback
- Server-side validation errors display
- Unsaved changes warning

### 7.2 Success/Error States

- Toast notifications for successful creation
- Error messages for validation failures
- Loading states during API calls
- Optimistic updates where appropriate

## 8. Testing Strategy

### 8.1 Unit Tests

- Form validation logic
- ID generation functions
- Map coordinate handling
- API endpoint validation

### 8.2 Integration Tests

- Right panel open/close functionality
- Map offset behavior
- Form submission and data persistence
- User-created data filtering

### 8.3 E2E Tests

- Complete stop creation workflow
- Complete route creation workflow
- Map interaction testing
- Data persistence verification

## 9. Performance Considerations

### 9.1 Code Splitting

- Lazy load right panel components
- Dynamic imports for form components
- Separate bundles for creation vs viewing modes

### 9.2 Map Performance

- Debounced map resize events
- Efficient marker clustering for large datasets
- Smooth transition animations

### 9.3 Data Management

- Pagination for user-created items
- Efficient filtering queries
- Caching strategies for form data

## 10. Accessibility Considerations

### 10.1 Keyboard Navigation

- Tab order through form fields
- Escape key to close panels
- Enter key for form submission
- Arrow keys for map navigation

### 10.2 Screen Reader Support

- Proper ARIA labels
- Form field descriptions
- Status announcements for creation success/failure
- Map interaction alternatives

## 11. Future Enhancements

### 11.1 Advanced Features

- Bulk import from CSV
- Route optimization suggestions
- Stop clustering analysis
- User collaboration features

### 11.3 User System Integration (Future)

- Replace `DEFAULT_USER_ID` with actual user authentication
- User-specific data filtering and permissions
- Collaborative editing features
- User profile management
- Data ownership and sharing controls

## Implementation Notes for User ID System

### Current Implementation

- Use `created_by_user_id: 'default-editor-user'` for all user-created content
- Import process leaves `created_by_user_id` as `null` for GTFS file data
- Helper functions in constants distinguish between user-created and imported data

### Future Migration Strategy

When implementing user authentication:

1. Keep existing `DEFAULT_USER_ID` records as "legacy" user-created data
2. Option to assign legacy data to first authenticated user
3. Or create a "system" user to own legacy data
4. Update API endpoints to use actual user session/token
5. Add user-specific queries and permissions

### Query Examples

```javascript
// Get all user-created stops
const userCreatedStops = await prisma.stop.findMany({
  where: {
    created_by_user_id: { not: null },
    uploaded_by: null
  }
})

// Get imported GTFS data only
const importedStops = await prisma.stop.findMany({
  where: {
    uploaded_by: { not: null },
    created_by_user_id: null
  }
})

// Get stops created by specific user (future)
const userStops = await prisma.stop.findMany({
  where: { created_by_user_id: actualUserId }
})

// Get all data uploaded by specific user
const uploadedByUserStops = await prisma.stop.findMany({
  where: { uploaded_by: actualUserId }
})

// Get data by origin type
const getStopsByOrigin = async (origin) => {
  switch(origin) {
    case DATA_ORIGINS.USER_CREATED:
      return await prisma.stop.findMany({
        where: {
          created_by_user_id: { not: null },
          uploaded_by: null
        }
      })
    case DATA_ORIGINS.IMPORTED:
      return await prisma.stop.findMany({
        where: {
          uploaded_by: { not: null },
          created_by_user_id: null
        }
      })
    default:
      return await prisma.stop.findMany()
  }
}
```

### GTFS Import Process Updates

When importing GTFS files, the upload process needs to be updated:

```javascript
// In your GTFS upload handler
const uploaderId = getCurrentUserId() // Get from session/auth (no default)

// When inserting imported data:
await prisma.stop.createMany({
  data: gtfsStops.map(stop => ({
    ...stop,
    uploaded_by: uploaderId,        // Required: who uploaded this file
    created_by_user_id: null,       // Always null for imported data
    created_at: new Date(),
    updated_at: new Date()
  }))
})
```

## Implementation Priority

### Phase 1 (Core Functionality)

1. Database schema updates
2. Basic right panel component
3. Stop creation form
4. Map offset handling
5. API endpoints

### Phase 2 (Enhanced UX)

1. Route creation form
2. Visual indicators
3. Form validation
4. Map click integration

### Phase 3 (Polish & Testing)

1. Error handling
2. Performance optimizations
3. Testing coverage
4. Accessibility improvements

This plan provides a comprehensive roadmap for implementing user creation functionality while maintaining the existing GTFS Editor architecture and ensuring a smooth user experience.
