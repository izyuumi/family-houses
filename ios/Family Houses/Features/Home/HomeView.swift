import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel: HomeViewModel

    init() {
        _viewModel = State(initialValue: HomeViewModel(service: MockPropertyService()))
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.properties.isEmpty {
                    ProgressView("Loading houses...")
                } else if let errorMessage = viewModel.errorMessage, viewModel.properties.isEmpty {
                    ContentUnavailableView("Could not load houses", systemImage: "wifi.exclamationmark", description: Text(errorMessage))
                } else if viewModel.properties.isEmpty {
                    ContentUnavailableView("No houses yet", systemImage: "house")
                } else {
                    List(viewModel.properties) { property in
                        NavigationLink(value: property) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(property.name)
                                    .font(.headline)
                                Text(property.locationLabel)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Family Houses")
            .navigationDestination(for: PropertySummary.self) { property in
                PropertyDetailView(property: property)
            }
            .refreshable {
                await viewModel.reload()
            }
            .task(id: appState.configurationVersion) {
                viewModel = HomeViewModel(service: appState.service)
                await viewModel.reload()
            }
        }
    }
}

#Preview {
    HomeView()
        .environment(AppState())
}
