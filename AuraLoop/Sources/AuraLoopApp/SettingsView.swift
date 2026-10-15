import SwiftUI
import ServiceManagement
import AuraLoopKit

struct SettingsView: View {
    @EnvironmentObject var store: AppStore

    @AppStorage("showMenuBarIcon") private var showMenuBarIcon = true
    @AppStorage("showDockIcon") private var showDockIcon = true
    @AppStorage("defaultMode") private var defaultMode = "smooth"
    @AppStorage(MenuBarIconStyle.defaultsKey) private var menuBarIcon = MenuBarIconStyle.standard.rawValue

    @State private var launchAtLogin = SMAppService.mainApp.status == .enabled
    @State private var confirmClear = false
    @State private var customPauseAfter = false
    /// macOS's own screen saver delay, not a AuraLoop setting, so it is read from
    /// Apple's preference rather than stored here and re-read whenever this
    /// window comes forward: System Settings can change it behind our back.
    @State private var screenSaverDelay = ScreenSaverDelay.current()
    /// Set the moment the delay is changed, cleared when the window is next
    /// brought forward. It is the only place the user is told that macOS does
    /// not pick a new delay up straight away.
    @State private var screenSaverDelayJustChanged = false
    /// The window keeps this view alive across close/reopen, which used to
    /// preserve the scroll position — reopening must always show the header.
    @State private var scrollToTopOnNextOpen = false

    var body: some View {
        ZStack(alignment: .top) {
            // Full-bleed glass layer: fills the ENTIRE window including under
            // the transparent, separator-less titlebar (so the top bar is the
            // same glass, no seam). Content scrolls on top.
            // The light look takes the light kind of glass (6.0).
            VisualEffectBackground(material: Appearance.shared.isLight ? .popover : .hudWindow)
                .overlay(Color.AuraLoopShade.opacity(0.22))
                .ignoresSafeArea()

            ScrollViewReader { proxy in
            ScrollView(.vertical, showsIndicators: true) {
            VStack(alignment: .leading, spacing: 0) {
                header
                    .frame(maxWidth: .infinity)
                    .padding(.top, 56)
                    .id("settings-top")

                section("GENERAL") {
                    row(icon: .launchAtLogin, title: "Launch at Login",
                        subtitle: "Starts quietly in the background") {
                        Toggle("", isOn: $launchAtLogin)
                            .toggleStyle(.switch)
                            .tint(Color.AuraLoopSwitch)
                            .labelsHidden()
                            .onChange(of: launchAtLogin) { _, enabled in
                                setLaunchAtLogin(enabled)
                            }
                    }
                    divider
                    row(icon: .menuBar, title: "Show Menu Bar Icon",
                        subtitle: menuBarSubtitle) {
                        Toggle("", isOn: $showMenuBarIcon)
                            .toggleStyle(.switch)
                            .tint(Color.AuraLoopSwitch)
                            .labelsHidden()
                    }
                    divider
                    row(icon: .dockIcon, title: "Show Dock Icon",
                        subtitle: "Off keeps AuraLoop in the menu bar only") {
                        Toggle("", isOn: $showDockIcon)
                            .toggleStyle(.switch)
                            .tint(Color.AuraLoopSwitch)
                            .labelsHidden()
                            .onChange(of: showDockIcon) { _, on in
                                NSApp.setActivationPolicy(on ? .regular : .accessory)
                                NSApp.activate(ignoringOtherApps: true)
                            }
                    }
                    divider
                    // Default is AuraLoop as it has always looked; Dark is the
                    // same glass in black and white; Light is white with dark
                    // buttons (owner, 2026-10-02). It changes at once, in
                    // every window and the menu bar.
                    row(icon: .appearance, title: "Appearance",
                        subtitle: "Default, Light or Dark") {
                        CapsuleSegments(
                            options: [AppearanceMode.standard, .light, .dark].map { ($0.title, $0.rawValue) },
                            selection: Binding(
                                get: { Appearance.shared.mode.rawValue },
                                set: { Appearance.shared.set(AppearanceMode(rawValue: $0) ?? .standard) }
                            )
                        )
                    }
                    divider
                    // The icon in the menu bar (6.0): the default and the five
                    // the owner picked from ten drawn in Figma. The menu shows
                    // each glyph beside its name, and the menu bar changes the
                    // moment one is chosen (StatusBarController).
                    row(icon: .menuBarIcon, title: "Menu Bar Icon",
                        subtitle: "The icon AuraLoop shows in the menu bar") {
                        GlassDropdown(width: 170, align: .trailing, options: {
                            MenuBarIconStyle.allCases.map { style in
                                MenuOption(
                                    title: style.title,
                                    checked: currentMenuBarIcon == style,
                                    icon: style.menuBarImage()
                                ) { menuBarIcon = style.rawValue }
                            }
                        }) {
                            HStack(spacing: 6) {
                                Image(nsImage: currentMenuBarIcon.menuBarImage(size: 16))
                                    .renderingMode(.template)
                                    .foregroundStyle(Color.AuraLoopInk)
                                    .frame(width: 16, height: 16)
                                Text(currentMenuBarIcon.title)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                            }
                            .padding(.leading, 9)
                            .padding(.trailing, 12)
                            .padding(.vertical, 4.65)
                            .glassCapsule(fill: 0.09, stroke: 0.15)
                        }
                    }
                }

                section("PLAYBACK") {
                    row(icon: .playbackSpeed, title: "Playback Speed",
                        subtitle: "How fast wallpapers play") {
                        GlassDropdown(width: 120, align: .trailing, options: {
                            [0.5, 0.75, 1.0, 1.25, 1.5].map { speed in
                                MenuOption(
                                    title: speedLabel(speed),
                                    checked: abs(store.playbackSpeed - speed) < 0.01
                                ) { store.setPlaybackSpeed(speed) }
                            }
                        }) {
                            HStack(spacing: 6) {
                                Text(speedLabel(store.playbackSpeed))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 5.5)
                            .glassCapsule(fill: 0.09, stroke: 0.15)
                        }
                    }
                    divider
                    row(icon: .defaultQuality, title: "Default Quality",
                        subtitle: "Efficient caps at 30 fps for lower CPU") {
                        CapsuleSegments(
                            options: [("Smooth", "smooth"), ("Efficient", "efficient")],
                            selection: $defaultMode
                        )
                    }
                    divider
                    row(icon: .pauseAfter, title: "Pause After",
                        subtitle: pauseAfterSubtitle) {
                        GlassDropdown(width: 150, align: .trailing, options: {
                            SettingsView.pauseAfterChoices.map { seconds in
                                MenuOption(
                                    title: seconds == 0 ? "Off" : durationLabel(seconds),
                                    checked: store.pauseAfterSeconds == seconds
                                ) { store.setPauseAfter(seconds) }
                            } + [.divider, MenuOption(title: "Custom") { customPauseAfter = true }]
                        }) {
                            HStack(spacing: 6) {
                                Text(store.pauseAfterSeconds == 0
                                     ? "Off" : durationLabel(store.pauseAfterSeconds))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 5.5)
                            .glassCapsule(fill: 0.09, stroke: 0.15)
                        }
                        .anchoredCard(isPresented: $customPauseAfter, width: 300, align: .trailing) {
                            CustomDurationPicker(seconds: Binding(
                                get: { max(10, store.pauseAfterSeconds) },
                                set: { store.setPauseAfter($0) }
                            )) { customPauseAfter = false }
                        }
                    }
                    // Issue #22. Replay on Clear Desktop belongs to Pause After,
                    // so no divider sits between the two, it sits closer to
                    // Pause After than rows sit to each other, and an arrow down
                    // from Pause After stands where its icon would be. A box
                    // around the pair was tried first: it pushed both rows in,
                    // out of line with every other icon and control.
                    subRow(title: "Replay on Clear Desktop", subtitle: replaySubtitle) {
                        Toggle("", isOn: Binding(
                            get: { store.replayOnClearDesktop },
                            set: { store.setReplayOnClearDesktop($0) }
                        ))
                        .toggleStyle(.switch).tint(Color.AuraLoopSwitch).labelsHidden()
                    }
                    divider
                    // Apple's setting, offered here so a Mac running AuraLoop as
                    // its screen saver never needs System Settings opened for
                    // the one number that decides when it runs. AuraLoop writes
                    // the same key Apple's own panel writes, and loginwindow
                    // picks it up at its next idle check with nothing to
                    // restart. See AuraLoopKit/ScreenSaverDelay.swift.
                    row(icon: .screenSaver, title: "Start Screen Saver",
                        subtitle: screenSaverSubtitle) {
                        GlassDropdown(width: 150, align: .trailing, options: {
                            ScreenSaverDelay.choices.map { seconds in
                                MenuOption(
                                    title: ScreenSaverDelay.label(seconds),
                                    checked: screenSaverDelay == seconds
                                ) {
                                    screenSaverDelay = ScreenSaverDelay.set(seconds)
                                    screenSaverDelayJustChanged = true
                                }
                            }
                        }) {
                            HStack(spacing: 6) {
                                Text(ScreenSaverDelay.label(screenSaverDelay))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundStyle(Color.AuraLoopInk.opacity(0.6))
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 5.5)
                            .glassCapsule(fill: 0.09, stroke: 0.15)
                        }
                    }
                    divider
                    row(icon: .audio, title: "Wallpaper Audio",
                        subtitle: "Play sound and audio tracks from live wallpapers") {
                        HStack(spacing: 10) {
                            if store.audioEnabled {
                                Slider(value: Binding(
                                    get: { store.audioVolume },
                                    set: { store.setAudioVolume($0) }
                                ), in: 0...1)
                                .controlSize(.small)
                                .frame(width: 80)
                            }
                            Toggle("", isOn: Binding(
                                get: { store.audioEnabled },
                                set: { store.setAudioEnabled($0) }
                            ))
                            .toggleStyle(.switch)
                            .tint(Color.AuraLoopSwitch)
                            .labelsHidden()
                        }
                    }
                }

                section("ENERGY") {
                    row(icon: .lowPower, title: "Auto-pause in Low Power Mode",
                        subtitle: "Freeze while saving energy") {
                        Toggle("", isOn: Binding(
                            get: { store.autoPauseLowPower },
                            set: { store.setAutoPauseLowPower($0) }
                        ))
                        .toggleStyle(.switch).tint(Color.AuraLoopSwitch).labelsHidden()
                    }
                    divider
                    row(icon: .lowBattery, title: "Auto-pause below 20% battery",
                        subtitle: "Resumes automatically on power") {
                        Toggle("", isOn: Binding(
                            get: { store.autoPauseBattery },
                            set: { store.setAutoPauseBattery($0) }
                        ))
                        .toggleStyle(.switch).tint(Color.AuraLoopSwitch).labelsHidden()
                    }
                    divider
                    row(icon: .covered, title: "Auto-pause when covered",
                        subtitle: "Freeze when a window or full screen app covers it") {
                        Toggle("", isOn: Binding(
                            get: { store.autoPauseFullScreen },
                            set: { store.setAutoPauseFullScreen($0) }
                        ))
                        .toggleStyle(.switch).tint(Color.AuraLoopSwitch).labelsHidden()
                    }
                    divider
                    // Issue #22. Any app window open on a screen freezes that
                    // screen's wallpaper, and a clear desktop plays it.
                    row(icon: .desktopOnly, title: "Play only on desktop",
                        subtitle: "Freeze while a window is open on that screen") {
                        Toggle("", isOn: Binding(
                            get: { store.playOnlyOnDesktop },
                            set: { store.setPlayOnlyOnDesktop($0) }
                        ))
                        .toggleStyle(.switch).tint(Color.AuraLoopSwitch).labelsHidden()
                    }
                }

                section("DISPLAYS") {
                    ForEach(Array(store.displays.enumerated()), id: \.element.id) { index, display in
                        if index > 0 { divider }
                        row(icon: display.isBuiltIn ? .builtInDisplay : .externalDisplay,
                            title: display.displayName,
                            subtitle: "\(display.kindLabel) display") {
                            Text("\(display.pixelsW) × \(display.pixelsH)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color.AuraLoopSecondary)
                        }
                    }
                }

                section("STORAGE") {
                    row(icon: .storage, title: "Clear Cache",
                        subtitle: store.clearStatus ?? "Delete downloaded wallpapers to free disk space") {
                        HStack(spacing: 12) {
                            Text(formatSize(store.libraryBytes))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color.AuraLoopSecondary)
                            Button("Clear Cache") { confirmClear = true }
                                .buttonStyle(.plain)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Color.red.opacity(0.9))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 5.5)
                                .glassCapsule(fill: 0.09, stroke: 0.15)
                                .pointingCursor()
                        }
                    }
                    if store.appleDownloadBytes > 0 {
                        subRow(title: "Apple Downloads",
                               subtitle: "Aerials and pictures") {
                            Text(formatSize(store.appleDownloadBytes))
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color.AuraLoopSecondary)
                        }
                    }

                    // An "Auto-clear memory: Manual / Daily / Weekly" row used
                    // to sit here. Nothing ever read it, and the RAM it claimed
                    // to free is not RAM AuraLoop holds, so it was removed rather
                    // than given a fake implementation.
                }

                // The wallpaper catalog URL is baked in (AppStore
                // .defaultCatalogURL) and not shown here — a normal user never
                // needs to change it, and a bad value only breaks their own
                // Explore. Still overridable via `defaults write … catalogURL`
                // for the owner's own testing.

                section("ABOUT") {
                    row(icon: .softwareUpdate,
                        title: "Software Update",
                        subtitle: updateSubtitle) {
                        updateControl
                    }
                    divider
                    row(icon: .support,
                        title: "Support AuraLoop",
                        subtitle: "AuraLoop is free. Sponsoring keeps it that way.") {
                        sponsorControl
                    }
                }

                Spacer(minLength: 24)
            }
            .padding(.horizontal, 34)
            }
            .onReceive(NotificationCenter.default.publisher(
                for: NSWindow.willCloseNotification
            )) { note in
                if (note.object as? NSWindow)?.title == AuraLoopWindow.settings {
                    scrollToTopOnNextOpen = true
                }
            }
            .onReceive(NotificationCenter.default.publisher(
                for: NSWindow.didBecomeKeyNotification
            )) { note in
                guard scrollToTopOnNextOpen,
                      (note.object as? NSWindow)?.title == AuraLoopWindow.settings else { return }
                scrollToTopOnNextOpen = false
                proxy.scrollTo("settings-top", anchor: .top)
            }
            // Separate from the scroll handler above on purpose: that one only
            // runs on a reopen, and this has to run every time the window is
            // brought forward, including straight after a trip to System
            // Settings, or the row would keep showing a value macOS no longer
            // holds.
            .onReceive(NotificationCenter.default.publisher(
                for: NSWindow.didBecomeKeyNotification
            )) { note in
                guard (note.object as? NSWindow)?.title == AuraLoopWindow.settings else { return }
                screenSaverDelay = ScreenSaverDelay.current()
                screenSaverDelayJustChanged = false
            }
            }

            // Pinned top titlebar to protect traffic light controls during scroll
            HStack(spacing: 0) {
                Color.clear.frame(width: 78, height: 44)
                Spacer()
                Text("Settings")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.85))
                Spacer()
                Color.clear.frame(width: 78, height: 44)
            }
            .frame(height: 46)
            .background(.ultraThinMaterial.opacity(0.92))
            .overlay(alignment: .bottom) {
                Divider().opacity(0.15)
            }
        }
        .frame(width: 780, height: 490)
        .menuHost()
        .background(SettingsWindowConfigurator())

        .alert("Clear Downloaded Wallpapers?", isPresented: $confirmClear) {
            Button("Cancel", role: .cancel) {}
            Button("Delete Cache", role: .destructive) { store.clearDownloadedCache() }
        } message: {
            Text("This will delete locally cached wallpapers (\(formatSize(store.libraryBytes))) from your Mac. You can re-download them anytime from Explore.")
        }
    }

    /// Issue #3: a fast wallpaper is distracting, so let it move for a while
    /// and then hold on a frame.
    static let pauseAfterChoices = [0, 10, 30, 60, 120, 300, 900, 3600]

    static func pauseAfterLabel(_ seconds: Int) -> String {
        seconds <= 0 ? "Off" : durationLabel(seconds)
    }

    private var pauseAfterSubtitle: String {
        store.pauseAfterSeconds == 0
            ? "Wallpapers keep playing"
            : "Plays for \(durationLabel(store.pauseAfterSeconds)), then holds on a frame"
    }

    /// Says what macOS will do, not what the menu is called. "System default"
    /// is the honest answer on a Mac where the preference has never been set:
    /// there is no system-wide plist to read it from and loginwindow does not
    /// publish the number it falls back to.
    private var screenSaverSubtitle: String {
        // Said once, right after a change, because it is the moment it matters
        // and it is the difference between "this is broken" and "this is how
        // macOS works". Measured on the owner's Mac on 2026-09-10: the delay
        // was set to 10 minutes at 18:36:51, macOS read it and armed a timer
        // for the full 600 seconds, and did not look at the setting again
        // until 18:46:51. Two further changes in between were ignored. This is
        // not AuraLoop: `loginwindow` reads the preference only when its own timer
        // fires or when the screen is locked, and there is no notification,
        // XPC message or public API that makes it look sooner. Apple's own
        // Settings panel writes the same key the same way and behaves
        // identically.
        // Never needs no explanation of when it takes effect: it already
        // has. "Saved. macOS uses it after the current wait ends..." read
        // oddly under Never (full check, 2026-10-01).
        if screenSaverDelayJustChanged, let seconds = screenSaverDelay, seconds > 0 {
            return "Saved. macOS uses it after the current wait ends, or now if you lock the screen."
        }
        guard let seconds = screenSaverDelay else {
            return "macOS is deciding. Pick a time to set it."
        }
        return seconds <= 0
            ? "The screen saver never starts"
            : "Starts after \(durationLabel(seconds)) with no activity"
    }

    /// Says what is about to happen in counts, and names the part that cannot
    /// be taken back. "Except applied or playlist items" told the user the
    /// rules and left them to work out the consequence.
    private var clearMessage: String {
        let plan = store.clearPlan
        guard !plan.isEmpty else {
            return plan.keptForSchedules > 0
                ? "Nothing to clear. Every wallpaper here is playing, or in a playlist or an automation."
                : "Nothing to clear. The only wallpapers here are the ones in use."
        }
        let count = plan.removed.count + plan.apple.count
        var text = "This removes \(count) "
            + (count == 1 ? "wallpaper" : "wallpapers")
            + " and frees about \(formatSize(plan.bytes + plan.appleBytes))."
        if !plan.apple.isEmpty {
            text += plan.apple.count == 1
                ? " 1 of them is an Apple download."
                : " \(plan.apple.count) of them are Apple downloads."
        }
        let keptPlaying = plan.kept - plan.keptForSchedules
        if keptPlaying > 0 {
            text += keptPlaying == 1
                ? " The one that is playing stays."
                : " The \(keptPlaying) in use stay."
        }
        if plan.keptForSchedules > 0 {
            text += plan.keptForSchedules == 1
                ? " The one in your playlists and automations stays."
                : " The \(plan.keptForSchedules) in your playlists and automations stay."
        }
        if plan.personal > 0 {
            text += plan.personal == 1
                ? " 1 of them is your own video and cannot be recovered."
                : " \(plan.personal) of them are your own videos and cannot be recovered."
        }
        return text
    }

    // MARK: - Pieces

    private var header: some View {
        VStack(spacing: 12) {
            AuraLoopAppIcon()
                .frame(width: 64, height: 64)
                .shadow(color: Color.black.opacity(0.28), radius: 10, x: 0, y: 4)
            AuraLoopWordmark(color: Color.AuraLoopInk)
                .frame(height: 24)
        }
        .padding(.vertical, 14)
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .tracking(1.4)
                .foregroundStyle(Color.AuraLoopSecondary.opacity(0.85))
                .padding(.leading, 4)
            VStack(spacing: 0) { content() }
                .liquidGlass(cornerRadius: 16, tint: 0.16, stroke: 0.12)
        }
        .padding(.top, 22)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.AuraLoopInk.opacity(0.06))
            .frame(height: 1)
            .padding(.leading, 66)
    }

    /// A setting that only changes the row above it. Placed straight after
    /// that row with no divider, it keeps every measurement of `row`, so its
    /// arrow, title and control line up with every other row. Only its top
    /// padding is shorter, which pulls it towards the row it belongs to.
    private func subRow(
        title: String, subtitle: String, @ViewBuilder control: () -> some View
    ) -> some View {
        HStack(spacing: 14) {
            SettingsIconView(icon: .replay)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopInk)
                Text(subtitle)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Color.AuraLoopSecondary)
            }
            Spacer(minLength: 16)
            control()
        }
        .padding(.horizontal, 18)
        .padding(.top, 4)
        .padding(.bottom, 14)
    }

    /// Replay has nothing to replay without a time, so it says so while
    /// Settings has none. A wallpaper with its own Pause After time still
    /// replays that one.
    private var replaySubtitle: String {
        store.pauseAfterSeconds == 0
            ? "Works with a Pause After time"
            : "Plays \(durationLabel(store.pauseAfterSeconds)) again each time the desktop clears"
    }

    // MARK: - Software update

    private var updateSubtitle: String {
        switch store.updateCheck {
        case .idle:      return "AuraLoop \(AppStore.appVersion)"
        case .checking:  return "Checking GitHub…"
        case .upToDate:  return "AuraLoop \(AppStore.appVersion) is the latest version"
        case .available(let version, _):
            return "Version \(version) is available on GitHub"
        case .failed:    return "Couldn't check. Check your connection."
        }
    }

    @ViewBuilder private var updateControl: some View {
        switch store.updateCheck {
        case .checking:
            ProgressView()
                .controlSize(.small)
                .frame(width: 96)
        case .available:
            // AuraLoop is not self-updating, so this hands over the DMG itself
            // when the release has one and the release page when it does not.
            Button("Download ↗") { store.downloadUpdate() }
                .buttonStyle(.plain)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.AuraLoopOnAccent)
                .padding(.horizontal, 14)
                .padding(.vertical, 5.5)
                .background(Capsule().fill(Color.AuraLoopAccent))
        default:
            Button("Check Now") {
                Task { await store.checkForUpdates(userInitiated: true) }
            }
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Color.AuraLoopInk)
            .padding(.horizontal, 14)
            .padding(.vertical, 5.5)
            .glassCapsule(fill: 0.09, stroke: 0.15)
        }
    }

    /// The only place in Settings that asks for anything.
    ///
    /// One ordinary row, built with the same helper as every other, so it sits
    /// in the list rather than shouting over it. It is already the only warm
    /// colour among the blues and teals and the only heart among the gears,
    /// which is contrast enough; a glowing or pulsing treatment would be a nag
    /// wearing a nicer outfit, and the reason people trust AuraLoop is that it
    /// never does that. Nothing here is gated, nothing is withheld, and
    /// ignoring it costs the user nothing.
    private var sponsorControl: some View {
        // Ko-fi came out (owner, 2026-10-01): the page cannot take money until
        // a bank is linked, and a button that leads nowhere is worse than one
        // way to give that works.
        HStack(spacing: 8) {
            supportPill("GitHub ↗", AppStore.sponsorURL)
        }
    }

    /// Both ways to give wear the same capsule, so neither one is pushed.
    private func supportPill(_ title: String, _ url: URL) -> some View {
        Button(title) { NSWorkspace.shared.open(url) }
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Color.AuraLoopInk)
            .padding(.horizontal, 14)
            .padding(.vertical, 5.5)
            .glassCapsule(fill: 0.09, stroke: 0.15)
    }

    /// What the menu bar row says underneath itself.
    ///
    /// Turning Launch at Login on used to switch the menu bar icon back on,
    /// because at the time the icon really was the only way back into a
    /// running AuraLoop. `applicationShouldHandleReopen` fixed that: Launchpad,
    /// Spotlight and Finder all reopen the gallery now. The force outlived its
    /// reason and took the choice away from exactly the people who want AuraLoop
    /// out of the way, which is issue #31.
    ///
    /// So it is gone, and the row says where AuraLoop is instead, on the one
    /// combination where nothing on screen leads back to it.
    private var menuBarSubtitle: String {
        showMenuBarIcon || showDockIcon
            ? "Quick controls from the menu bar"
            : "Open AuraLoop from Launchpad or Spotlight"
    }

    private var currentMenuBarIcon: MenuBarIconStyle {
        MenuBarIconStyle(rawValue: menuBarIcon) ?? .standard
    }

    /// The glass capsule the Clear button uses, for the rows beside it.
    private func settingsPill(_ title: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Color.AuraLoopInk)
            .padding(.horizontal, 14)
            .padding(.vertical, 5.5)
            .glassCapsule(fill: 0.09, stroke: 0.15)
    }

    private func row(
        icon: SettingsIcon, title: String, subtitle: String,
        @ViewBuilder control: () -> some View
    ) -> some View {
        HStack(spacing: 14) {
            SettingsIconView(icon: icon)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopInk)
                Text(subtitle)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Color.AuraLoopSecondary)
            }
            Spacer(minLength: 16)
            control()
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 13)
    }

    private func setLaunchAtLogin(_ enabled: Bool) {
        do {
            if enabled {
                try SMAppService.mainApp.register()
                UserDefaults.standard.set(false, forKey: "launchAtLoginDisabledByUser")
            } else {
                try SMAppService.mainApp.unregister()
                UserDefaults.standard.set(true, forKey: "launchAtLoginDisabledByUser")
            }
        } catch {
            launchAtLogin = SMAppService.mainApp.status == .enabled
        }
    }
}

// MARK: - Frosted-glass window chrome

/// NSVisualEffectView bridge — the translucent blurred "liquid glass" base
/// behind the Settings content.
struct VisualEffectBackground: NSViewRepresentable {
    var material: NSVisualEffectView.Material = .hudWindow

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = .behindWindow
        view.state = .active
        return view
    }

    func updateNSView(_ view: NSVisualEffectView, context: Context) {
        view.material = material
    }
}

/// Only touches the window chrome: transparent, full-size-content,
/// separator-less titlebar so the SwiftUI glass background shows through it
/// seamlessly. It does NOT insert any view (that previously covered the
/// content and blanked the window).
struct SettingsWindowConfigurator: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async { configure(view.window) }
        return view
    }

    func updateNSView(_ view: NSView, context: Context) {
        DispatchQueue.main.async { configure(view.window) }
    }

    private func configure(_ window: NSWindow?) {
        guard let window else { return }
        window.isOpaque = false
        window.backgroundColor = .clear
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.styleMask.insert(.fullSizeContentView)
        window.titlebarSeparatorStyle = .none
        window.isMovableByWindowBackground = true
    }
}
