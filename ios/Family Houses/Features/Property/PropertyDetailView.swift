import SwiftUI

struct PropertyDetailView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel: PropertyDetailViewModel
    @State private var showingAddGrocery = false
    @State private var showingAddItem = false
    @State private var noteDraft = ""

    private let property: PropertySummary

    init(property: PropertySummary) {
        self.property = property
        _viewModel = State(initialValue: PropertyDetailViewModel(propertyIdOrSlug: property.id, service: MockPropertyService()))
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.detail == nil {
                ProgressView("Loading details...")
            } else if let errorMessage = viewModel.errorMessage, viewModel.detail == nil {
                ContentUnavailableView("Could not load property", systemImage: "wifi.exclamationmark", description: Text(errorMessage))
            } else if let detail = viewModel.detail {
                List {
                    infoSection(detail)
                    DoorsSection(
                        devices: viewModel.locks,
                        activity: viewModel.lockActivity,
                        inFlightDeviceId: viewModel.commandInFlightDeviceId,
                        command: { deviceId, command in
                            Task { await viewModel.sendLockCommand(deviceId: deviceId, command: command) }
                        }
                    )
                    groceriesSection(detail)
                    itemsSection(detail)
                    notesSection(detail)
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle(property.name)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    showingAddGrocery = true
                } label: {
                    Label("Add Grocery", systemImage: "cart.badge.plus")
                }

                Button {
                    showingAddItem = true
                } label: {
                    Label("Add Item", systemImage: "plus.square")
                }
            }
        }
        .sheet(isPresented: $showingAddGrocery) {
            AddGrocerySheet { name, quantity in
                Task { await viewModel.addGrocery(name: name, quantity: quantity) }
            }
        }
        .sheet(isPresented: $showingAddItem) {
            AddHouseItemSheet { title, date, category, note in
                Task { await viewModel.addHouseItem(title: title, date: date, category: category, note: note) }
            }
        }
        .task(id: appState.configurationVersion) {
            let identifier = property.slug ?? property.id
            viewModel = PropertyDetailViewModel(propertyIdOrSlug: identifier, service: appState.service)
            await viewModel.load()
        }
        .refreshable {
            await viewModel.load()
        }
        .alert("Error", isPresented: errorPresented, actions: {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        }, message: {
            Text(viewModel.errorMessage ?? "")
        })
    }

    private var errorPresented: Binding<Bool> {
        Binding(
            get: { viewModel.errorMessage != nil },
            set: { isPresented in
                if !isPresented {
                    viewModel.errorMessage = nil
                }
            }
        )
    }

    private func infoSection(_ detail: PropertyDetail) -> some View {
        Section("Property Info") {
            if !detail.addressLines.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(detail.addressLines, id: \.self) { line in
                        Text(line)
                    }
                }
            }

            if let wifi = detail.wifiSSID, !wifi.isEmpty {
                LabeledContent("Main Wi-Fi", value: wifi)
            }
            if let guest = detail.guestWifiSSID, !guest.isEmpty {
                LabeledContent("Guest Wi-Fi", value: guest)
            }
            if let mapsURL = detail.appleMapsURL, let url = URL(string: mapsURL) {
                Link("Open in Apple Maps", destination: url)
            }
        }
    }

    private func groceriesSection(_ detail: PropertyDetail) -> some View {
        Section("Groceries") {
            if detail.groceries.isEmpty {
                Text("No groceries")
                    .foregroundStyle(.secondary)
            }

            ForEach(detail.groceries) { grocery in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(grocery.itemName)
                            .strikethrough(grocery.checked)
                        if let quantity = grocery.quantity, !quantity.isEmpty {
                            Text("Qty: \(quantity)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    Button {
                        Task {
                            await viewModel.toggleGrocery(id: grocery.id, checked: !grocery.checked)
                        }
                    } label: {
                        Image(systemName: grocery.checked ? "checkmark.circle.fill" : "circle")
                    }
                    .buttonStyle(.plain)
                }
                .swipeActions {
                    Button(role: .destructive) {
                        Task { await viewModel.deleteGrocery(id: grocery.id) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
    }

    private func itemsSection(_ detail: PropertyDetail) -> some View {
        Section("Property Items") {
            if detail.propertyItems.isEmpty {
                Text("No items")
                    .foregroundStyle(.secondary)
            }

            ForEach(detail.propertyItems) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.headline)
                    if let category = item.category, !category.isEmpty {
                        Text(category)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    if let date = item.boughtDate, !date.isEmpty {
                        Text("Bought: \(date)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let note = item.note, !note.isEmpty {
                        Text(note)
                            .font(.caption)
                    }
                }
                .swipeActions {
                    Button(role: .destructive) {
                        Task { await viewModel.deleteHouseItem(id: item.id) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
    }

    private func notesSection(_ detail: PropertyDetail) -> some View {
        Section("Notes") {
            HStack {
                TextField("Add a note...", text: $noteDraft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)

                Button("Add") {
                    let content = noteDraft.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !content.isEmpty else { return }
                    noteDraft = ""
                    Task { await viewModel.addHouseNote(content: content) }
                }
            }

            if detail.propertyNotes.isEmpty {
                Text("No notes")
                    .foregroundStyle(.secondary)
            }

            ForEach(detail.propertyNotes) { note in
                VStack(alignment: .leading, spacing: 4) {
                    Text(note.content)
                    if let author = note.createdByName, !author.isEmpty {
                        Text(author)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .swipeActions {
                    Button(role: .destructive) {
                        Task { await viewModel.deleteHouseNote(id: note.id) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
    }
}

private struct AddGrocerySheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var quantity = ""

    let onSubmit: (String, String?) -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Item name", text: $name)
                TextField("Quantity", text: $quantity)
            }
            .navigationTitle("Add Grocery")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        onSubmit(name, quantity)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

private struct AddHouseItemSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var date = ""
    @State private var category = ""
    @State private var note = ""

    let onSubmit: (String, String?, String?, String?) -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Title", text: $title)
                TextField("Bought date (YYYY-MM-DD)", text: $date)
                TextField("Category", text: $category)
                TextField("Note", text: $note, axis: .vertical)
            }
            .navigationTitle("Add Property Item")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        onSubmit(title, date, category, note)
                        dismiss()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PropertyDetailView(
            property: PropertySummary(
                id: "p_tokyo",
                slug: "tokyo-house",
                name: "Tokyo House",
                cityWardTown: "Shibuya",
                prefecture: "Tokyo"
            )
        )
    }
    .environment(AppState())
}
