import Foundation

@MainActor
@Observable
final class PropertyDetailViewModel {
    private let propertyIdOrSlug: String
    private let service: PropertyService

    private(set) var detail: PropertyDetail?
    private(set) var locks: [LockDevice] = []
    private(set) var lockActivity: [LockActivityEntry] = []
    private(set) var isLoading = false
    private(set) var isRefreshingLocks = false
    private(set) var commandInFlightDeviceId: String?
    var errorMessage: String?

    init(propertyIdOrSlug: String, service: PropertyService) {
        self.propertyIdOrSlug = propertyIdOrSlug
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            detail = try await service.fetchPropertyDetail(idOrSlug: propertyIdOrSlug)
            await loadLocks()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadLocks() async {
        isRefreshingLocks = true
        defer { isRefreshingLocks = false }

        do {
            let payload = try await service.fetchLocks(propertyIdOrSlug: propertyIdOrSlug)
            locks = payload.devices
            lockActivity = payload.activity
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func sendLockCommand(deviceId: String, command: String) async {
        commandInFlightDeviceId = deviceId
        defer { commandInFlightDeviceId = nil }

        do {
            let response = try await service.sendLockCommand(deviceId: deviceId, command: command)
            if let index = locks.firstIndex(where: { $0.id == deviceId }) {
                let device = locks[index]
                locks[index] = LockDevice(
                    id: device.id,
                    label: device.label,
                    deviceRole: device.deviceRole,
                    lockState: response.lockState,
                    doorState: response.doorState,
                    battery: response.battery,
                    stateUpdatedAt: Int(Date().timeIntervalSince1970 * 1_000),
                    canControl: device.canControl
                )
            }
            await loadLocks()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addGrocery(name: String, quantity: String?) async {
        guard let detail else { return }
        let itemName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !itemName.isEmpty else { return }

        do {
            try await service.addGrocery(
                CreateGroceryRequest(
                    propertyId: detail.id,
                    itemName: itemName,
                    quantity: quantity?.nilIfEmpty
                )
            )
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleGrocery(id: String, checked: Bool) async {
        do {
            try await service.toggleGrocery(id: id, checked: checked)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteGrocery(id: String) async {
        do {
            try await service.deleteGrocery(id: id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addHouseItem(title: String, date: String?, category: String?, note: String?) async {
        guard let detail else { return }
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return }

        do {
            try await service.addHouseItem(
                CreateHouseItemRequest(
                    propertyId: detail.id,
                    title: trimmedTitle,
                    boughtDate: date?.nilIfEmpty,
                    category: category?.nilIfEmpty,
                    note: note?.nilIfEmpty
                )
            )
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteHouseItem(id: String) async {
        do {
            try await service.deleteHouseItem(id: id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addHouseNote(content: String) async {
        guard let detail else { return }
        do {
            try await service.addHouseNote(
                CreateHouseNoteRequest(propertyId: detail.id, content: content)
            )
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteHouseNote(id: String) async {
        do {
            try await service.deleteHouseNote(id: id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
