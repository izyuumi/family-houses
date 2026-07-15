import Foundation

protocol PropertyService {
    func fetchHome() async throws -> [PropertySummary]
    func fetchPropertyDetail(idOrSlug: String) async throws -> PropertyDetail
    func fetchLocks(propertyIdOrSlug: String) async throws -> LocksPayload
    func sendLockCommand(deviceId: String, command: String) async throws -> LockCommandResponse

    func addGrocery(_ request: CreateGroceryRequest) async throws
    func toggleGrocery(id: String, checked: Bool) async throws
    func deleteGrocery(id: String) async throws

    func addHouseItem(_ request: CreateHouseItemRequest) async throws
    func deleteHouseItem(id: String) async throws

    func addHouseNote(_ request: CreateHouseNoteRequest) async throws
    func deleteHouseNote(id: String) async throws
}

enum ServiceError: LocalizedError {
    case invalidURL
    case invalidResponse
    case server(String)
    case decoding

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL."
        case .invalidResponse:
            return "Unexpected response from server."
        case .server(let message):
            return message
        case .decoding:
            return "Failed to decode server response."
        }
    }
}

struct RemotePropertyService: PropertyService {
    private let client: APIClient

    init(baseURL: URL, authTokenProvider: @escaping () -> String?) {
        client = APIClient(baseURL: baseURL, authTokenProvider: authTokenProvider)
    }

    func fetchHome() async throws -> [PropertySummary] {
        let payload: HomePayload = try await client.request(path: "/api/mobile/home", method: "GET")
        return payload.properties
    }

    func fetchPropertyDetail(idOrSlug: String) async throws -> PropertyDetail {
        try await client.request(path: "/api/mobile/properties/\(pathComponent(idOrSlug))", method: "GET")
    }

    func fetchLocks(propertyIdOrSlug: String) async throws -> LocksPayload {
        try await client.request(path: "/api/mobile/properties/\(pathComponent(propertyIdOrSlug))/locks", method: "GET")
    }

    func sendLockCommand(deviceId: String, command: String) async throws -> LockCommandResponse {
        try await client.request(
            path: "/api/mobile/locks/command",
            method: "POST",
            body: LockCommandRequest(deviceId: deviceId, command: command)
        )
    }

    func addGrocery(_ request: CreateGroceryRequest) async throws {
        let _: EmptyResponse = try await client.request(path: "/api/mobile/groceries", method: "POST", body: request)
    }

    func toggleGrocery(id: String, checked: Bool) async throws {
        let body = UpdateGroceryRequest(checked: checked)
        let _: EmptyResponse = try await client.request(path: "/api/mobile/groceries/\(pathComponent(id))", method: "PATCH", body: body)
    }

    func deleteGrocery(id: String) async throws {
        let _: EmptyResponse = try await client.request(path: "/api/mobile/groceries/\(pathComponent(id))", method: "DELETE")
    }

    func addHouseItem(_ request: CreateHouseItemRequest) async throws {
        let _: EmptyResponse = try await client.request(path: "/api/mobile/property-items", method: "POST", body: request)
    }

    func deleteHouseItem(id: String) async throws {
        let _: EmptyResponse = try await client.request(path: "/api/mobile/property-items/\(pathComponent(id))", method: "DELETE")
    }

    func addHouseNote(_ request: CreateHouseNoteRequest) async throws {
        let _: EmptyResponse = try await client.request(path: "/api/mobile/property-notes", method: "POST", body: request)
    }

    func deleteHouseNote(id: String) async throws {
        let _: EmptyResponse = try await client.request(path: "/api/mobile/property-notes/\(pathComponent(id))", method: "DELETE")
    }

    private func pathComponent(_ value: String) throws -> String {
        let allowed = CharacterSet.urlPathAllowed.subtracting(CharacterSet(charactersIn: "/?#[]@!$&'()*+,;="))
        guard let encoded = value.addingPercentEncoding(withAllowedCharacters: allowed) else {
            throw ServiceError.invalidURL
        }
        return encoded
    }
}

actor MockPropertyService: PropertyService {
    private var properties: [PropertySummary] = [
        PropertySummary(id: "p_tokyo", slug: "tokyo-house", name: "Tokyo House", cityWardTown: "Shibuya", prefecture: "Tokyo"),
        PropertySummary(id: "p_kyoto", slug: "kyoto-house", name: "Kyoto House", cityWardTown: "Sakyo", prefecture: "Kyoto")
    ]

    private var details: [String: PropertyDetail] = [:]
    private var locksByProperty: [String: [LockDevice]] = [
        "p_tokyo": [
            LockDevice(
                id: "lock_tokyo_entrance",
                label: "Front door",
                deviceRole: "entrance",
                lockState: "lock",
                doorState: "close",
                battery: 76,
                stateUpdatedAt: 1_783_900_000_000,
                canControl: true
            ),
            LockDevice(
                id: "lock_tokyo_unit",
                label: "Unit door",
                deviceRole: "unit",
                lockState: "unlock",
                doorState: "close",
                battery: 19,
                stateUpdatedAt: 1_783_900_000_000,
                canControl: true
            )
        ]
    ]

    init() {
        let tokyo = PropertyDetail(
            id: "p_tokyo",
            slug: "tokyo-house",
            name: "Tokyo House",
            postalCode: "150-0001",
            prefecture: "Tokyo",
            cityWardTown: "Shibuya",
            area: "Jingumae",
            chome: "1",
            block: "2",
            building: "Family Heights",
            room: "301",
            appleMapsURL: "https://maps.apple.com/?q=Shibuya",
            wifiSSID: "FamilyMainWifi",
            guestWifiSSID: "FamilyGuestWifi",
            groceries: [
                GroceryItem(id: "g1", propertyId: "p_tokyo", itemName: "Toilet paper", checked: false, quantity: "12 pack", addedByName: "Yumi", completedByName: nil),
                GroceryItem(id: "g2", propertyId: "p_tokyo", itemName: "Dish soap", checked: true, quantity: "2", addedByName: "Ken", completedByName: "Yumi")
            ],
            propertyItems: [
                HouseItem(id: "i1", propertyId: "p_tokyo", title: "Air purifier", boughtDate: "2025-07-14", category: "Appliance", note: "Filter size A", createdByName: "Yumi")
            ],
            propertyNotes: [
                HouseNote(id: "n1", propertyId: "p_tokyo", content: "Mailbox code changes every quarter.", createdAtISO: "2026-02-08T11:10:00Z", createdByName: "Yumi")
            ]
        )

        let kyoto = PropertyDetail(
            id: "p_kyoto",
            slug: "kyoto-house",
            name: "Kyoto House",
            postalCode: "606-8304",
            prefecture: "Kyoto",
            cityWardTown: "Sakyo",
            area: "Okazaki",
            chome: nil,
            block: nil,
            building: nil,
            room: nil,
            appleMapsURL: nil,
            wifiSSID: "KyotoMainWifi",
            guestWifiSSID: nil,
            groceries: [],
            propertyItems: [],
            propertyNotes: []
        )

        details[tokyo.id] = tokyo
        details[kyoto.id] = kyoto
    }

    func fetchHome() async throws -> [PropertySummary] {
        properties
    }

    func fetchPropertyDetail(idOrSlug: String) async throws -> PropertyDetail {
        if let byId = details[idOrSlug] {
            return byId
        }

        if let property = properties.first(where: { $0.slug == idOrSlug }), let detail = details[property.id] {
            return detail
        }

        throw ServiceError.server("Property not found")
    }

    func fetchLocks(propertyIdOrSlug: String) async throws -> LocksPayload {
        let propertyId: String
        if details[propertyIdOrSlug] != nil {
            propertyId = propertyIdOrSlug
        } else if let property = properties.first(where: { $0.slug == propertyIdOrSlug }) {
            propertyId = property.id
        } else {
            throw ServiceError.server("Property not found")
        }

        let activity: [LockActivityEntry] = propertyId == "p_tokyo" ? [
            LockActivityEntry(action: "unlock", actorName: "Yumi", source: "app", at: 1_783_899_400_000),
            LockActivityEntry(action: "lock", actorName: nil, source: "webhook", at: 1_783_896_400_000)
        ] : []
        return LocksPayload(devices: locksByProperty[propertyId] ?? [], activity: activity)
    }

    func sendLockCommand(deviceId: String, command: String) async throws -> LockCommandResponse {
        for (propertyId, devices) in locksByProperty {
            guard let index = devices.firstIndex(where: { $0.id == deviceId }) else { continue }

            let updated = LockDevice(
                id: devices[index].id,
                label: devices[index].label,
                deviceRole: devices[index].deviceRole,
                lockState: command == "unlock" ? "unlock" : "lock",
                doorState: devices[index].doorState,
                battery: devices[index].battery,
                stateUpdatedAt: Int(Date().timeIntervalSince1970 * 1_000),
                canControl: devices[index].canControl
            )
            var updatedDevices = devices
            updatedDevices[index] = updated
            locksByProperty[propertyId] = updatedDevices
            return LockCommandResponse(lockState: updated.lockState, doorState: updated.doorState, battery: updated.battery)
        }

        throw ServiceError.server("Lock not found")
    }

    func addGrocery(_ request: CreateGroceryRequest) async throws {
        guard var detail = details[request.propertyId] else { return }

        let item = GroceryItem(
            id: UUID().uuidString,
            propertyId: request.propertyId,
            itemName: request.itemName,
            checked: false,
            quantity: request.quantity,
            addedByName: "You",
            completedByName: nil
        )

        detail = PropertyDetail(
            id: detail.id,
            slug: detail.slug,
            name: detail.name,
            postalCode: detail.postalCode,
            prefecture: detail.prefecture,
            cityWardTown: detail.cityWardTown,
            area: detail.area,
            chome: detail.chome,
            block: detail.block,
            building: detail.building,
            room: detail.room,
            appleMapsURL: detail.appleMapsURL,
            wifiSSID: detail.wifiSSID,
            guestWifiSSID: detail.guestWifiSSID,
            groceries: [item] + detail.groceries,
            propertyItems: detail.propertyItems,
            propertyNotes: detail.propertyNotes
        )

        details[request.propertyId] = detail
    }

    func toggleGrocery(id: String, checked: Bool) async throws {
        for (propertyId, detail) in details {
            if detail.groceries.contains(where: { $0.id == id }) {
                let updated = detail.groceries.map { item in
                    guard item.id == id else { return item }
                    return GroceryItem(
                        id: item.id,
                        propertyId: item.propertyId,
                        itemName: item.itemName,
                        checked: checked,
                        quantity: item.quantity,
                        addedByName: item.addedByName,
                        completedByName: checked ? "You" : nil
                    )
                }

                details[propertyId] = PropertyDetail(
                    id: detail.id,
                    slug: detail.slug,
                    name: detail.name,
                    postalCode: detail.postalCode,
                    prefecture: detail.prefecture,
                    cityWardTown: detail.cityWardTown,
                    area: detail.area,
                    chome: detail.chome,
                    block: detail.block,
                    building: detail.building,
                    room: detail.room,
                    appleMapsURL: detail.appleMapsURL,
                    wifiSSID: detail.wifiSSID,
                    guestWifiSSID: detail.guestWifiSSID,
                    groceries: updated,
                    propertyItems: detail.propertyItems,
                    propertyNotes: detail.propertyNotes
                )
                break
            }
        }
    }

    func deleteGrocery(id: String) async throws {
        for (propertyId, detail) in details {
            let filtered = detail.groceries.filter { $0.id != id }
            if filtered.count != detail.groceries.count {
                details[propertyId] = PropertyDetail(
                    id: detail.id,
                    slug: detail.slug,
                    name: detail.name,
                    postalCode: detail.postalCode,
                    prefecture: detail.prefecture,
                    cityWardTown: detail.cityWardTown,
                    area: detail.area,
                    chome: detail.chome,
                    block: detail.block,
                    building: detail.building,
                    room: detail.room,
                    appleMapsURL: detail.appleMapsURL,
                    wifiSSID: detail.wifiSSID,
                    guestWifiSSID: detail.guestWifiSSID,
                    groceries: filtered,
                    propertyItems: detail.propertyItems,
                    propertyNotes: detail.propertyNotes
                )
                break
            }
        }
    }

    func addHouseItem(_ request: CreateHouseItemRequest) async throws {
        guard var detail = details[request.propertyId] else { return }
        let item = HouseItem(
            id: UUID().uuidString,
            propertyId: request.propertyId,
            title: request.title,
            boughtDate: request.boughtDate,
            category: request.category,
            note: request.note,
            createdByName: "You"
        )

        detail = PropertyDetail(
            id: detail.id,
            slug: detail.slug,
            name: detail.name,
            postalCode: detail.postalCode,
            prefecture: detail.prefecture,
            cityWardTown: detail.cityWardTown,
            area: detail.area,
            chome: detail.chome,
            block: detail.block,
            building: detail.building,
            room: detail.room,
            appleMapsURL: detail.appleMapsURL,
            wifiSSID: detail.wifiSSID,
            guestWifiSSID: detail.guestWifiSSID,
            groceries: detail.groceries,
            propertyItems: [item] + detail.propertyItems,
            propertyNotes: detail.propertyNotes
        )

        details[request.propertyId] = detail
    }

    func deleteHouseItem(id: String) async throws {
        for (propertyId, detail) in details {
            let filtered = detail.propertyItems.filter { $0.id != id }
            if filtered.count != detail.propertyItems.count {
                details[propertyId] = PropertyDetail(
                    id: detail.id,
                    slug: detail.slug,
                    name: detail.name,
                    postalCode: detail.postalCode,
                    prefecture: detail.prefecture,
                    cityWardTown: detail.cityWardTown,
                    area: detail.area,
                    chome: detail.chome,
                    block: detail.block,
                    building: detail.building,
                    room: detail.room,
                    appleMapsURL: detail.appleMapsURL,
                    wifiSSID: detail.wifiSSID,
                    guestWifiSSID: detail.guestWifiSSID,
                    groceries: detail.groceries,
                    propertyItems: filtered,
                    propertyNotes: detail.propertyNotes
                )
                break
            }
        }
    }

    func addHouseNote(_ request: CreateHouseNoteRequest) async throws {
        guard var detail = details[request.propertyId] else { return }
        let note = HouseNote(
            id: UUID().uuidString,
            propertyId: request.propertyId,
            content: request.content,
            createdAtISO: ISO8601DateFormatter().string(from: .now),
            createdByName: "You"
        )

        detail = PropertyDetail(
            id: detail.id,
            slug: detail.slug,
            name: detail.name,
            postalCode: detail.postalCode,
            prefecture: detail.prefecture,
            cityWardTown: detail.cityWardTown,
            area: detail.area,
            chome: detail.chome,
            block: detail.block,
            building: detail.building,
            room: detail.room,
            appleMapsURL: detail.appleMapsURL,
            wifiSSID: detail.wifiSSID,
            guestWifiSSID: detail.guestWifiSSID,
            groceries: detail.groceries,
            propertyItems: detail.propertyItems,
            propertyNotes: [note] + detail.propertyNotes
        )

        details[request.propertyId] = detail
    }

    func deleteHouseNote(id: String) async throws {
        for (propertyId, detail) in details {
            let filtered = detail.propertyNotes.filter { $0.id != id }
            if filtered.count != detail.propertyNotes.count {
                details[propertyId] = PropertyDetail(
                    id: detail.id,
                    slug: detail.slug,
                    name: detail.name,
                    postalCode: detail.postalCode,
                    prefecture: detail.prefecture,
                    cityWardTown: detail.cityWardTown,
                    area: detail.area,
                    chome: detail.chome,
                    block: detail.block,
                    building: detail.building,
                    room: detail.room,
                    appleMapsURL: detail.appleMapsURL,
                    wifiSSID: detail.wifiSSID,
                    guestWifiSSID: detail.guestWifiSSID,
                    groceries: detail.groceries,
                    propertyItems: detail.propertyItems,
                    propertyNotes: filtered
                )
                break
            }
        }
    }
}
