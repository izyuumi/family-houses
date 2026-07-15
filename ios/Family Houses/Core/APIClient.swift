import Foundation

struct EmptyResponse: Codable {}

private struct ErrorResponse: Decodable {
    let error: String
}

struct APIClient {
    let baseURL: URL
    let authTokenProvider: () -> String?

    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }()

    private let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        return encoder
    }()

    func request<T: Decodable>(path: String, method: String) async throws -> T {
        try await request(path: path, method: method, body: Optional<String>.none)
    }

    func request<T: Decodable, Body: Encodable>(path: String, method: String, body: Body?) async throws -> T {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw ServiceError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = authTokenProvider(), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ServiceError.invalidResponse
        }

        guard (200 ... 299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
                throw ServiceError.server(errorResponse.error)
            }
            if let message = String(data: data, encoding: .utf8), !message.isEmpty {
                throw ServiceError.server(message)
            }
            throw ServiceError.server("Request failed with status \(httpResponse.statusCode)")
        }

        if T.self == EmptyResponse.self, data.isEmpty, let emptyResponse = EmptyResponse() as? T {
            return emptyResponse
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw ServiceError.decoding
        }
    }
}
