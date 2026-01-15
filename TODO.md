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

### 1. WiFi Password Authorization ✅

**File:** `app/api/wifi/reveal/route.ts`

The WiFi reveal endpoint only checks if the user is authenticated but doesn't verify if they have access to the specific property.

**Tasks:**

- [x] Add property access verification before revealing WiFi password
- [x] Check user membership/ownership of the property
- [x] Return 403 Forbidden for unauthorized access attempts

---

### 2. Role-Based Access Control ✅

**Files:** `convex/profiles.ts`, `convex/schema.ts`, `convex/permissions.ts`

Implement granular permissions beyond simple admin/user roles.

**Tasks:**

- [x] Define permission levels: owner, member, guest (simplified from owner/admin/member/guest)
- [x] Create permission checking utilities
- [x] Implement approval workflow for new users (admin approval via `/admin` page)
- [x] Add middleware/guards for protected operations
- [x] Update UI to reflect user permissions (pending approval page, admin-only features)

---

### 3. Property Sharing & Membership ✅

**Files:** `convex/schema.ts`, `convex/propertyMembers.ts`

Add explicit property membership management.

**Tasks:**

- [x] Create `propertyMembers` table in schema:
  ```typescript
  propertyMembers: defineTable({
    propertyId: v.id("properties"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("member"),
      v.literal("guest")
    ),
    invitedBy: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
  })
    .index("by_property", ["propertyId"])
    .index("by_user", ["userId"])
    .index("by_property_user", ["propertyId", "userId"]);
  ```
- [x] Create CRUD operations for property members
- [x] Build member management UI for system admins (`/admin` page)
- [x] Filter property list based on user membership

---

## 🟡 Medium Priority - Performance

### 4. Fix N+1 Query Problem in Grocery Items ✅

**Files:** `convex/groceryItems.ts`, `convex/propertyItems.ts`, `convex/propertyNotes.ts`

Each grocery item currently fetches its adder/completer profile individually.

**Tasks:**

- [x] Collect unique `clerkId`s from all items
- [x] Batch fetch all profiles in a single query
- [x] Map profiles back to items
- [x] Apply same optimization to `propertyItems.ts` and `propertyNotes.ts`

---

### 5. Optimize Map Component Re-renders ✅

**File:** `components/japan-map.tsx`

The JapanMap component recalculates on every render.

**Tasks:**

- [x] Memoize marker rendering with `useMemo`
- [x] Use `React.memo` for marker sub-components
- [x] Debounce zoom/pan state updates (RAF-based batching)
- [x] Canvas-based rendering: N/A - not needed for family-scale usage

---

### 6. Replace QR Code Implementation with Lighter Library ✅

**File:** `components/wifi-qrcode.tsx`

The current inline QR implementation is ~700 lines.

**Tasks:**

- [x] Research lightweight QR libraries (qrcode-generator, qr.js)
- [x] Replace inline implementation with library (`qrcode-generator`)
- [x] Ensure WiFi QR format compatibility (WIFI:T:WPA;S:ssid;P:password;;)
- [x] Dynamic import the QR modal for code splitting (`wifi-qrcode-lazy.tsx`)
- [x] Verify bundle size reduction (~820 lines → ~140 lines)

---

## 🟡 Medium Priority - User Experience

### 7. Grocery List Enhancements

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

### 8. Better Loading States

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

### 9. Audit Trail - Completed Items & Note History

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
  }).index("by_property", ["propertyId"]);
  ```
- [ ] Create `propertyNoteHistory` table:
  ```typescript
  propertyNoteHistory: defineTable({
    noteId: v.id("propertyNotes"),
    previousContent: v.string(),
    editedBy: v.string(),
    editedAt: v.number(),
  }).index("by_note", ["noteId"]);
  ```
- [ ] Save to history before clearing completed items
- [ ] Save to history before updating notes
- [ ] Build history view UI with timeline
- [ ] Add "restore" functionality for notes

---

### 10. Calendar Integration

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

### 11. Guest Access

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

## 🟢 Lower Priority - Code Quality

### 12. Improve Type Safety

**Files:** Throughout codebase

Eliminate unsafe type assertions.

**Tasks:**

- [ ] Create typed wrapper hooks for Convex IDs
- [ ] Add runtime ID validation utilities
- [ ] Replace `as Id<"table">` patterns with safe parsers
- [ ] Enable stricter TypeScript settings
- [ ] Add type guards for API responses

---

### 13. Form Validation

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

### 14. Error Boundaries

**Files:** New error boundary components, `app/layout.tsx`

Prevent full-page crashes from component errors.

**Tasks:**

- [ ] Create reusable ErrorBoundary component
- [ ] Add error boundaries around key features (map, property detail)
- [ ] Implement fallback UI for each section
- [ ] Add error reporting/logging
- [ ] Create "retry" functionality where appropriate

---

### 15. Structured API Error Handling

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

### 16. Keyboard Navigation

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

### 17. Update Color Scheme ✅

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

- [x] Update CSS variables for light theme
- [x] Update CSS variables for dark theme
- [ ] Verify WCAG 2.1 AA contrast ratios (4.5:1 for text)
- [ ] Test color combinations for color blindness
- [x] Update chart colors
- [x] Ensure consistent usage across components

---

## 🟢 Lower Priority - Reliability

### 18. Rate Limiting

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

| #   | Task                          | Status         | Notes                                            |
| --- | ----------------------------- | -------------- | ------------------------------------------------ |
| 1   | WiFi Password Authorization   | ✅ Done        | Membership verification, guests blocked          |
| 2   | Role-Based Access Control     | ✅ Done        | Approval workflow + admin UI at `/admin`         |
| 3   | Property Sharing & Membership | ✅ Done        | Member mgmt UI, property filtering by membership |
| 4   | Fix N+1 Query Problem         | ✅ Done        | Batch profile fetching in all 3 files            |
| 5   | Optimize Map Re-renders       | ✅ Done        | React.memo, useMemo, RAF batching                |
| 6   | Lighter QR Library            | ✅ Done        | `qrcode-generator` + dynamic import              |
| 7   | Grocery List Enhancements     | ⬜ Not Started |                                                  |
| 8   | Better Loading States         | ⬜ Not Started |                                                  |
| 9   | Audit Trail                   | ⬜ Not Started |                                                  |
| 10  | Calendar Integration          | ⬜ Not Started |                                                  |
| 11  | Guest Access                  | ⬜ Not Started |                                                  |
| 12  | Type Safety                   | ⬜ Not Started |                                                  |
| 13  | Form Validation               | ⬜ Not Started |                                                  |
| 14  | Error Boundaries              | ⬜ Not Started |                                                  |
| 15  | API Error Handling            | ⬜ Not Started |                                                  |
| 16  | Keyboard Navigation           | ⬜ Not Started |                                                  |
| 17  | Update Color Scheme           | ✅ Done        | New Verdigris/Charcoal Blue palette              |
| 18  | Rate Limiting                 | ⬜ Not Started |                                                  |
