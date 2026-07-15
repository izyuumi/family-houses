import Foundation

@MainActor
@Observable
final class HomeViewModel {
    private let service: PropertyService

    private(set) var properties: [PropertySummary] = []
    private(set) var isLoading = false
    var errorMessage: String?

    init(service: PropertyService) {
        self.service = service
    }

    func reload() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            properties = try await service.fetchHome()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
