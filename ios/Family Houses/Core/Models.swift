import Foundation

struct HomePayload: Codable {
    let properties: [PropertySummary]
}

struct PropertySummary: Codable, Identifiable, Hashable {
    let id: String
    let slug: String?
    let name: String
    let cityWardTown: String?
    let prefecture: String?

    var locationLabel: String {
        let parts = [prefecture, cityWardTown].compactMap { $0 }
        return parts.isEmpty ? "Unknown location" : parts.joined(separator: " ")
    }
}

struct PropertyDetail: Codable, Identifiable {
    let id: String
    let slug: String?
    let name: String
    let postalCode: String?
    let prefecture: String?
    let cityWardTown: String?
    let area: String?
    let chome: String?
    let block: String?
    let building: String?
    let room: String?
    let appleMapsURL: String?
    let wifiSSID: String?
    let guestWifiSSID: String?
    let groceries: [GroceryItem]
    let propertyItems: [HouseItem]
    let propertyNotes: [HouseNote]

    var addressLines: [String] {
        [postalCode, prefecture, cityWardTown, area, chome, block, building, room]
            .compactMap { value in
                guard let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
                    return nil
                }
                return trimmed
            }
    }
}

struct GroceryItem: Codable, Identifiable {
    let id: String
    let propertyId: String
    let itemName: String
    let checked: Bool
    let quantity: String?
    let addedByName: String?
    let completedByName: String?
}

struct HouseItem: Codable, Identifiable {
    let id: String
    let propertyId: String
    let title: String
    let boughtDate: String?
    let category: String?
    let note: String?
    let createdByName: String?
}

struct HouseNote: Codable, Identifiable {
    let id: String
    let propertyId: String
    let content: String
    let createdAtISO: String?
    let createdByName: String?
}

struct CreateGroceryRequest: Codable {
    let propertyId: String
    let itemName: String
    let quantity: String?
}

struct UpdateGroceryRequest: Codable {
    let checked: Bool
}

struct CreateHouseItemRequest: Codable {
    let propertyId: String
    let title: String
    let boughtDate: String?
    let category: String?
    let note: String?
}

struct CreateHouseNoteRequest: Codable {
    let propertyId: String
    let content: String
}

struct LocksPayload: Codable {
    let devices: [LockDevice]
    let activity: [LockActivityEntry]
}

struct LockDevice: Codable, Identifiable, Hashable {
    let id: String
    let label: String
    let deviceRole: String
    let lockState: String?
    let doorState: String?
    let battery: Int?
    let stateUpdatedAt: Int?
    let canControl: Bool

    var isUnlocked: Bool {
        lockState?.lowercased() == "unlock" || lockState?.lowercased() == "unlocked"
    }

    var isLocked: Bool {
        switch lockState?.lowercased() {
        case "lock", "locked", "latchboltlocked":
            true
        default:
            false
        }
    }

    var isJammed: Bool {
        lockState?.lowercased() == "jammed"
    }
}

struct LockActivityEntry: Codable, Identifiable, Hashable {
    let action: String
    let actorName: String?
    let source: String
    let at: Int

    var id: String {
        "\(action)-\(source)-\(at)-\(actorName ?? "")"
    }
}

struct LockCommandRequest: Codable {
    let deviceId: String
    let command: String
}

struct LockCommandResponse: Codable {
    let lockState: String?
    let doorState: String?
    let battery: Int?
}
