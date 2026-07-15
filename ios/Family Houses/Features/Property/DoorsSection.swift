import SwiftUI
import UIKit

struct DoorsSection: View {
    let devices: [LockDevice]
    let activity: [LockActivityEntry]
    let inFlightDeviceId: String?
    let command: (String, String) -> Void

    var body: some View {
        Section("Doors") {
            if devices.isEmpty {
                Text("No smart locks")
                    .foregroundStyle(.secondary)
            }

            ForEach(devices) { device in
                DoorLockCard(
                    device: device,
                    isInFlight: inFlightDeviceId == device.id,
                    command: { command(device.id, $0) }
                )
            }

            if !activity.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Recent activity")
                        .font(.headline)
                    ForEach(activity) { entry in
                        HStack(alignment: .firstTextBaseline) {
                            Text(activityDescription(entry))
                            Spacer()
                            Text(relativeDate(entry.at))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }

    private func activityDescription(_ entry: LockActivityEntry) -> String {
        let action = entry.action.lowercased() == "unlock" ? "Unlocked" : "Locked"
        if let actorName = entry.actorName, !actorName.isEmpty {
            return "\(action) by \(actorName)"
        }
        return entry.source.lowercased() == "webhook" ? "\(action) via SwitchBot" : action
    }

    private func relativeDate(_ milliseconds: Int) -> String {
        RelativeDateTimeFormatter().localizedString(
            for: Date(timeIntervalSince1970: TimeInterval(milliseconds) / 1_000),
            relativeTo: .now
        )
    }
}

private struct DoorLockCard: View {
    let device: LockDevice
    let isInFlight: Bool
    let command: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                Image(systemName: stateIcon)
                    .font(.title2)
                    .foregroundStyle(stateColor)
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 3) {
                    Text(device.label)
                        .font(.headline)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if let battery = device.battery, battery <= 25 {
                    Label("\(battery)%", systemImage: "battery.25percent")
                        .font(.caption)
                        .foregroundStyle(battery <= 10 ? .red : .orange)
                }
            }

            if device.isJammed {
                Label("Lock jammed", systemImage: "exclamationmark.triangle.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.red)
            }

            lockControl
        }
        .padding(.vertical, 6)
    }

    @ViewBuilder
    private var lockControl: some View {
        if !device.canControl {
            Text("View only")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        } else if isInFlight {
            HStack(spacing: 8) {
                ProgressView()
                Text(device.isUnlocked ? "Locking…" : "Unlocking…")
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
        } else if device.isUnlocked {
            Button {
                command("lock")
            } label: {
                Label("Lock", systemImage: "lock.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.teal)
        } else if device.isJammed {
            Button {
                command("lock")
            } label: {
                Label("Retry lock", systemImage: "arrow.clockwise")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .tint(.red)
        } else if device.isLocked {
            HoldToUnlockButton {
                command("unlock")
            }
        } else {
            Text("Lock state unavailable")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private var stateIcon: String {
        if device.isJammed { return "exclamationmark.lock.fill" }
        return device.isUnlocked ? "lock.open.fill" : device.isLocked ? "lock.fill" : "lock.slash"
    }

    private var stateColor: Color {
        device.isJammed ? .red : device.isUnlocked ? .orange : device.isLocked ? .teal : .secondary
    }

    private var subtitle: String {
        let state = device.isJammed ? "Jammed" : device.isUnlocked ? "Unlocked" : device.isLocked ? "Locked" : "State unavailable"
        let door = device.doorState?.lowercased() == "open" ? "Door open" : device.doorState?.lowercased() == "close" ? "Door closed" : nil
        return [state, door, device.deviceRole.capitalized].compactMap { $0 }.joined(separator: " · ")
    }
}

private struct HoldToUnlockButton: View {
    @State private var isPressing = false
    @State private var progress = 0.0

    let unlock: () -> Void

    var body: some View {
        ZStack {
            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.orange, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .opacity(isPressing ? 1 : 0)

            Label(isPressing ? "Keep holding…" : "Hold to unlock", systemImage: "lock.open")
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
        }
        .contentShape(Rectangle())
        .foregroundStyle(.orange)
        .background(.orange.opacity(0.12), in: Capsule())
        .onLongPressGesture(
            minimumDuration: 0.8,
            maximumDistance: 30,
            pressing: { pressing in
                isPressing = pressing
                withAnimation(.linear(duration: pressing ? 0.8 : 0.15)) {
                    progress = pressing ? 1 : 0
                }
            },
            perform: {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                isPressing = false
                progress = 0
                unlock()
            }
        )
        .accessibilityLabel("Hold to unlock")
        .accessibilityHint("Press and hold for one second to unlock this door")
    }
}
