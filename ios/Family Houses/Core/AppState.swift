import Foundation

@Observable
final class AppState {
    var service: PropertyService
    var baseURLText: String
    var authTokenText: String
    var usingMockData: Bool
    var configurationVersion: Int

    init() {
        let envURL = ProcessInfo.processInfo.environment["MOBILE_API_BASE_URL"]?.trimmingCharacters(in: .whitespacesAndNewlines)
        let envToken = ProcessInfo.processInfo.environment["MOBILE_AUTH_TOKEN"]?.trimmingCharacters(in: .whitespacesAndNewlines)
        baseURLText = envURL ?? ""
        authTokenText = envToken ?? ""
        service = MockPropertyService()
        usingMockData = true
        configurationVersion = 0

        if let envURL, let remoteURL = URL(string: envURL), !envURL.isEmpty {
            service = RemotePropertyService(
                baseURL: remoteURL,
                authTokenProvider: { [weak self] in self?.authTokenText }
            )
            usingMockData = false
        }
    }

    func applyBaseURL(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        baseURLText = trimmed

        if let url = URL(string: trimmed), !trimmed.isEmpty {
            service = RemotePropertyService(
                baseURL: url,
                authTokenProvider: { [weak self] in self?.authTokenText }
            )
            usingMockData = false
        } else {
            service = MockPropertyService()
            usingMockData = true
        }
        configurationVersion += 1
    }

    func applyAuthToken(_ value: String) {
        authTokenText = value.trimmingCharacters(in: .whitespacesAndNewlines)
        configurationVersion += 1
    }
}
