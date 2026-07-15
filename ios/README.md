# iOS App (SwiftUI)

A native iOS app now lives in `ios/Family Houses`.

## What was added

- SwiftUI tab app with:
  - Home list of houses
  - Property detail screen
  - Groceries section (add / toggle / delete)
  - Property items section (add / delete)
  - Notes section (add / delete)
  - Settings screen to switch between mock data and a remote API URL
- Service architecture:
  - `PropertyService` protocol
  - `MockPropertyService` (default, works without backend)
  - `RemotePropertyService` via `URLSession`

## Files

- `ios/Family Houses/Family_HousesApp.swift`
- `ios/Family Houses/ContentView.swift`
- `ios/Family Houses/Core/*`
- `ios/Family Houses/Features/Home/*`
- `ios/Family Houses/Features/Property/*`
- `ios/Family Houses/Features/Settings/*`

## Run

1. Open `ios/Family Houses.xcodeproj` in Xcode.
2. Select an iOS Simulator.
3. Build and Run.

By default, the app uses built-in mock data.

## Connect to your web backend

Set `MOBILE_API_BASE_URL` in your Xcode scheme environment variables (or in-app Settings).

For authentication, set `MOBILE_AUTH_TOKEN` (or use in-app Settings):
- Visit `/api/mobile/auth/token` in your signed-in web app session.
- Copy the returned `token` value.
- Paste it into the iOS app Auth settings.

The iOS app sends `Authorization: Bearer <token>`.

Backend endpoints:

- `GET /api/mobile/home` -> `{ "properties": PropertySummary[] }`
- `GET /api/mobile/properties/:idOrSlug` -> `PropertyDetail`
- `POST /api/mobile/groceries`
- `PATCH /api/mobile/groceries/:id`
- `DELETE /api/mobile/groceries/:id`
- `POST /api/mobile/property-items`
- `DELETE /api/mobile/property-items/:id`
- `POST /api/mobile/property-notes`
- `DELETE /api/mobile/property-notes/:id`

Payload shapes are defined in `ios/Family Houses/Core/Models.swift`.
