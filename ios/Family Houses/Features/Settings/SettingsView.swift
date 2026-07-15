import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var draftURL = ""
    @State private var draftToken = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Data Source") {
                    TextField("https://your-web-app.example.com", text: $draftURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    Button("Apply API URL") {
                        appState.applyBaseURL(draftURL)
                    }

                    Button("Use Built-in Mock Data") {
                        draftURL = ""
                        appState.applyBaseURL("")
                    }
                    .tint(.orange)

                    LabeledContent("Current", value: appState.usingMockData ? "Mock Data" : "Remote API")
                }

                Section("Auth") {
                    SecureField("Convex token", text: $draftToken)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    Button("Apply Auth Token") {
                        appState.applyAuthToken(draftToken)
                    }
                }

                Section("Notes") {
                    Text("Set `MOBILE_API_BASE_URL` in your Xcode scheme environment variables for automatic remote mode.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Text("Set `MOBILE_AUTH_TOKEN` (or apply it here) to authenticate requests as the current user.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Text("Get a token from your signed-in web app at `/api/mobile/auth/token`.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .onAppear {
                draftURL = appState.baseURLText
                draftToken = appState.authTokenText
            }
        }
    }
}

#Preview {
    SettingsView()
        .environment(AppState())
}
