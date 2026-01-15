# Family Houses - Improvement Roadmap

## Color Scheme

```css
--charcoal-blue: #264653ff;
--verdigris: #2a9d8fff;
--tuscan-sun: #e9c46aff;
--sandy-brown: #f4a261ff;
--burnt-peach: #e76f51ff;
```

---

## 🔴 High Priority - Security & Core

### 1. WiFi Password Authorization
**File:** `app/api/wifi/reveal/route.ts`

The WiFi reveal endpoint only checks if the user is authenticated but doesn't verify if they have access to the specific property.

**Tasks:**
- [ ] Add property access verification before revealing WiFi password
- [ ] Check user membership/ownership of the property
- [ ] Return 403 Forbidden for unauthorized access attempts
- [ ] Add audit logging for WiFi password reveals

---

### 2. Role-Based Access Control
**Files:** `convex/profiles.ts`, `convex/schema.ts`

Implement granular permissions beyond simple admin/user roles.

**Tasks:**
- [ ] Define permission levels: owner, admin, member, guest
- [ ] Create permission checking utilities
- [ ] Implement approval workflow for new users (currently `approved: false` is unused)
- [ ] Add middleware/guards for protected operations
- [ ] Update UI to reflect user permissions

---

### 3. Property Sharing & Membership
**Files:** `convex/schema.ts`, new `convex/propertyMembers.ts`

Add explicit property membership management.

**Tasks:**
- [ ] Create `propertyMembers` table in schema:
  ```typescript
  propertyMembers: defineTable({
    propertyId: v.id("properties"),
    userId: v.string(),
    role: v.string(),
    invitedBy: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
  }).index("by_property", ["propertyId"])
    .index("by_user", ["userId"])
  ```
- [ ] Create CRUD operations for property members
- [ ] Add invite functionality with email notifications
- [ ] Build member management UI for property admins
- [ ] Filter property list based on user membership

---

## 🟡 Medium Priority - Performance

### 4. Fix N+1 Query Problem in Grocery Items
**File:** `convex/groceryItems.ts`

Each grocery item currently fetches its adder/completer profile individually.

**Tasks:**
- [ ] Collect unique `clerkId`s from all items
- [ ] Batch fetch all profiles in a single query
- [ ] Map profiles back to items
- [ ] Apply same optimization to `propertyItems.ts` and `propertyNotes.ts`

---

### 5. Optimize Map Component Re-renders
**File:** `components/japan-map.tsx`

The JapanMap component recalculates on every render.

**Tasks:**
- [ ] Memoize marker rendering with `useMemo`
- [ ] Use `React.memo` for marker sub-components
- [ ] Debounce zoom/pan state updates
- [ ] Consider canvas-based rendering for large marker sets

---

### 6. Replace QR Code Implementation with Lighter Library
**File:** `components/wifi-qrcode.tsx`

The current inline QR implementation is ~700 lines.

**Tasks:**
- [ ] Research lightweight QR libraries (qrcode-generator, qr.js)
- [ ] Replace inline implementation with library
- [ ] Ensure WiFi QR format compatibility (WIFI:T:WPA;S:ssid;P:password;;)
- [ ] Dynamic import the QR modal for code splitting
- [ ] Verify bundle size reduction

---

## 🟡 Medium Priority - User Experience

### 7. Search & Filtering
**Files:** New search components, Convex queries

Add comprehensive search functionality.

**Tasks:**
- [ ] Property search by name and location
- [ ] Inventory items search by title and category
- [ ] Notes full-text search
- [ ] Add search UI component with debounced input
- [ ] Implement Convex search queries with indexes
- [ ] Add filter chips for categories/tags

---

### 8. Grocery List Enhancements
**Files:** `components/groceries.tsx`, `convex/groceryItems.ts`, `convex/schema.ts`

Improve the to-do/grocery list functionality.

**Tasks:**
- [ ] Add quantity input field (schema field exists, UI missing)
- [ ] Implement categories/tags for items (food, cleaning, etc.)
- [ ] Add recurring items feature (auto-add weekly/monthly)
- [ ] Implement drag-to-reorder with priority
- [ ] Add due dates for time-sensitive items
- [ ] Batch operations (select multiple, delete/complete)

---

### 9. Better Loading States
**Files:** All page components, new skeleton components

Replace minimal loading indicators with proper skeletons.

**Tasks:**
- [ ] Create skeleton components matching actual content shapes
- [ ] Property list skeleton
- [ ] Property detail skeleton (info card, groceries, notes)
- [ ] Map loading state with placeholder
- [ ] Use Suspense boundaries effectively
- [ ] Add loading states to mutation buttons

---

## 🟡 Medium Priority - Data & Features

### 10. Audit Trail - Completed Items & Note History
**Files:** `convex/schema.ts`, `convex/groceryItems.ts`, `convex/propertyNotes.ts`

Track history of completed items and note edits.

**Tasks:**
- [ ] Create `groceryItemHistory` table:
  ```typescript
  groceryItemHistory: defineTable({
    propertyId: v.id("properties"),
    itemName: v.string(),
    completedBy: v.string(),
    completedAt: v.number(),
  }).index("by_property", ["propertyId"])
  ```
- [ ] Create `propertyNoteHistory` table:
  ```typescript
  propertyNoteHistory: defineTable({
    noteId: v.id("propertyNotes"),
    previousContent: v.string(),
    editedBy: v.string(),
    editedAt: v.number(),
  }).index("by_note", ["noteId"])
  ```
- [ ] Save to history before clearing completed items
- [ ] Save to history before updating notes
- [ ] Build history view UI with timeline
- [ ] Add "restore" functionality for notes

---

### 11. Calendar Integration
**Files:** New calendar components, `convex/schema.ts`

Add scheduling and reminders for properties.

**Tasks:**
- [ ] Create `propertyEvents` table
- [ ] Add event types: visit, maintenance, reminder
- [ ] Build calendar view component
- [ ] Implement recurring events
- [ ] Add push notification support for reminders
- [ ] Export to iCal format

---

### 12. Guest Access
**Files:** New guest access system

Create temporary access links for visitors.

**Tasks:**
- [ ] Create `guestLinks` table with expiration
- [ ] Generate secure, shareable URLs
- [ ] Build guest view with limited data (WiFi, address, basic notes)
- [ ] Add link management UI for property owners
- [ ] Implement access revocation
- [ ] Track guest link usage

---

### 13. Apple Maps Integration
**Files:** `components/address-display.tsx`, `components/info-card.tsx`

Improve map integration with Apple Maps.

**Tasks:**
- [ ] Generate Apple Maps URLs from address components
- [ ] Add "Open in Apple Maps" button to property info
- [ ] Support deep linking with directions
- [ ] Fallback to Google Maps for non-Apple devices
- [ ] Cache geocoded coordinates

---

## 🟢 Lower Priority - Code Quality

### 14. Improve Type Safety
**Files:** Throughout codebase

Eliminate unsafe type assertions.

**Tasks:**
- [ ] Create typed wrapper hooks for Convex IDs
- [ ] Add runtime ID validation utilities
- [ ] Replace `as Id<"table">` patterns with safe parsers
- [ ] Enable stricter TypeScript settings
- [ ] Add type guards for API responses

---

### 15. Form Validation
**Files:** `components/admin-form.tsx`, `components/groceries.tsx`

Implement proper form validation.

**Tasks:**
- [ ] Add `zod` for schema validation
- [ ] Integrate with `react-hook-form`
- [ ] Validate slug format (lowercase, numbers, hyphens)
- [ ] Add required field indicators and error messages
- [ ] Validate postal code format
- [ ] Client-side validation before submission

---

### 16. Error Boundaries
**Files:** New error boundary components, `app/layout.tsx`

Prevent full-page crashes from component errors.

**Tasks:**
- [ ] Create reusable ErrorBoundary component
- [ ] Add error boundaries around key features (map, property detail)
- [ ] Implement fallback UI for each section
- [ ] Add error reporting/logging
- [ ] Create "retry" functionality where appropriate

---

### 17. Structured API Error Handling
**Files:** `app/api/**/*.ts`, client components

Improve error responses and handling.

**Tasks:**
- [ ] Define error code constants
- [ ] Create structured error response format
- [ ] Implement error response helper
- [ ] Update client-side error handling
- [ ] Show user-friendly error messages
- [ ] Add error recovery suggestions

---

## 🟢 Lower Priority - Accessibility

### 18. Keyboard Navigation
**Files:** `components/japan-map.tsx`, interactive components

Add full keyboard support.

**Tasks:**
- [ ] Tab through map markers
- [ ] Arrow key navigation when map is focused
- [ ] Enter/Space to select markers
- [ ] Escape to close modals
- [ ] Add visible focus indicators
- [ ] Skip navigation links

---

### 19. Screen Reader Support
**Files:** Throughout UI components

Improve assistive technology support.

**Tasks:**
- [ ] Add ARIA labels to map markers
- [ ] Label action buttons with descriptive text
- [ ] Add live regions for dynamic updates (toast, real-time changes)
- [ ] Implement proper heading hierarchy
- [ ] Add alt text for decorative elements
- [ ] Test with VoiceOver/NVDA

---

### 20. Update Color Scheme
**File:** `app/globals.css`

Replace current warm orange theme with new color scheme.

**New Colors:**
| Name | Hex | Usage |
|------|-----|-------|
| Charcoal Blue | `#264653` | Primary dark, backgrounds |
| Verdigris | `#2a9d8f` | Primary accent, interactive |
| Tuscan Sun | `#e9c46a` | Highlights, warnings |
| Sandy Brown | `#f4a261` | Secondary accent |
| Burnt Peach | `#e76f51` | Destructive, alerts |

**Tasks:**
- [ ] Update CSS variables for light theme
- [ ] Update CSS variables for dark theme
- [ ] Verify WCAG 2.1 AA contrast ratios (4.5:1 for text)
- [ ] Test color combinations for color blindness
- [ ] Update chart colors
- [ ] Ensure consistent usage across components

---

## 🟢 Lower Priority - Reliability

### 21. Rate Limiting
**Files:** `app/api/**/*.ts`, middleware

Protect API endpoints from abuse.

**Tasks:**
- [ ] Implement rate limiting middleware
- [ ] Configure limits per endpoint:
  - WiFi reveal: 10 requests/minute
  - General API: 100 requests/minute
- [ ] Add rate limit headers to responses
- [ ] Implement exponential backoff suggestions
- [ ] Add IP-based and user-based limiting
- [ ] Log rate limit violations

---

## Progress Tracking

| # | Task | Status | Assignee | Notes |
|---|------|--------|----------|-------|
| 1 | WiFi Password Authorization | ⬜ Not Started | | |
| 2 | Role-Based Access Control | ⬜ Not Started | | |
| 3 | Property Sharing & Membership | ⬜ Not Started | | |
| 4 | Fix N+1 Query Problem | ⬜ Not Started | | |
| 5 | Optimize Map Re-renders | ⬜ Not Started | | |
| 6 | Lighter QR Library | ⬜ Not Started | | |
| 7 | Search & Filtering | ⬜ Not Started | | |
| 8 | Grocery List Enhancements | ⬜ Not Started | | |
| 9 | Better Loading States | ⬜ Not Started | | |
| 10 | Audit Trail | ⬜ Not Started | | |
| 11 | Calendar Integration | ⬜ Not Started | | |
| 12 | Guest Access | ⬜ Not Started | | |
| 13 | Apple Maps Integration | ⬜ Not Started | | |
| 14 | Type Safety | ⬜ Not Started | | |
| 15 | Form Validation | ⬜ Not Started | | |
| 16 | Error Boundaries | ⬜ Not Started | | |
| 17 | API Error Handling | ⬜ Not Started | | |
| 18 | Keyboard Navigation | ⬜ Not Started | | |
| 19 | Screen Reader Support | ⬜ Not Started | | |
| 20 | Update Color Scheme | ⬜ Not Started | | |
| 21 | Rate Limiting | ⬜ Not Started | | |
