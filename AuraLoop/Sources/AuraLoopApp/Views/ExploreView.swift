import SwiftUI
import AuraLoopKit

/// Explore, rebuilt in the 3.0 language (2026-08-24).
///
/// It used to sit straight on the window's flat black with its controls
/// scattered along one line: category chips crowded into the left corner and
/// two small dropdowns pushed to the right. Next to the redesigned Library it
/// read as a different app. It is now the same page the Library is: the
/// coloured background, the inset glass tray, one centred glass control for
/// the categories, and a second line for the filters that narrow them.
struct ExploreView: View {
    @EnvironmentObject var store: AppStore
    @State private var category = "All"
    /// Which way the last category change went, read off the order of the
    /// pills themselves, so the grid leaves towards the pill you came from.
    /// A resolution or FPS change leaves it alone: those are not a direction,
    /// so they reuse whichever way the row last moved.
    @State private var categoryShift: CGFloat = 1
    @State private var resolution = "All"
    @State private var fps = "All"

    private let gridColumns = [
        GridItem(.flexible(), spacing: 24),
        GridItem(.flexible(), spacing: 24),
        GridItem(.flexible(), spacing: 24)
    ]

    /// Real values present in the catalog/library — the dropdowns only
    /// offer resolutions and frame rates that actually exist.
    private var resolutionOptions: [String] {
        let present = Set(store.exploreItems.map(\.resolutionLabel))
        return ["4K", "1440p", "1080p"].filter(present.contains)
    }

    private var fpsOptions: [String] {
        Set(store.exploreItems.map { "\(standardFrameRate($0.fps))" })
            .sorted { (Int($0) ?? 0) > (Int($1) ?? 0) }
    }

    /// Newest publish first, so a drop lands at the top of the grid instead of
    /// behind however many wallpapers this user happens to have downloaded.
    /// The category tabs and the two filters narrow this order rather than
    /// replacing it, so a fresh batch is at the top of Cars as well as of All.
    private var filtered: [WallpaperItem] {
        store.exploreItems.filter { item in
            if category == "Premium" {
                if !item.isPremium && !item.category.localizedCaseInsensitiveContains("premium") { return false }
            } else if category == "All" {
                if item.isPremium || item.category.localizedCaseInsensitiveContains("premium") { return false }
            } else {
                if item.category != category || item.isPremium { return false }
            }
            if resolution != "All", item.resolutionLabel != resolution { return false }
            if fps != "All", "\(standardFrameRate(item.fps))" != fps { return false }
            if !store.searchText.isEmpty,
               !item.title.localizedCaseInsensitiveContains(store.searchText),
               !item.category.localizedCaseInsensitiveContains(store.searchText) {
                return false
            }
            return true
        }
    }

    private var narrowed: Bool { resolution != "All" || fps != "All" }

    /// Changing any of the three re-makes the grid, which is what gives the
    /// crossfade something to fade between. Search is left out on purpose: it
    /// filters on every keystroke and should not restart an animation each
    /// time.
    private var filterKey: String { "\(category)|\(resolution)|\(fps)" }

    var body: some View {
        ZStack {
            AuraLoopPageBackground()
            GlassTray {
                VStack(alignment: .leading, spacing: 0) {
                    categoryRow
                        .padding(.horizontal, 40)
                        .padding(.top, 30)
                    filterRow
                        .padding(.horizontal, 40)
                        .padding(.top, 14)
                    // A new scroll view for each category and filter, so a
                    // new one always starts at its top instead of at the
                    // depth the last one was scrolled to (owner, 2026-09-30).
                    // Overlaid in a ZStack, so the two pass through each other
                    // in place while the transition runs.
                    ZStack {
                        ScrollView(.vertical, showsIndicators: false) {
                            Group {
                                if filtered.isEmpty {
                                    emptyState
                                } else {
                                    VStack(spacing: 22) {
                                        catalogNotice
                                        grid
                                    }
                                }
                            }
                            .padding(.horizontal, 40)
                            .padding(.top, 22)
                            .padding(.bottom, 40)
                        }
                        .scrollFade(top: 22, bottom: 46)
                        .id(filterKey)
                        .transition(.AuraLoopPage(shift: categoryShift))
                    }
                    .animation(.AuraLoopPage, value: filterKey)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .padding(.horizontal, 20)
            .padding(.top, 88)
            .padding(.bottom, 20)
        }
        // A category the catalog no longer has would leave the page filtered
        // to nothing, with no lit segment to say why.
        .onChange(of: store.categories) { _, list in
            if category != "All" && category != "Premium", !list.contains(category) { category = "All" }
        }
    }

    // MARK: - Categories

    private var categoryOptions: [PillOption] {
        let nonPremium = store.categories.filter { !$0.localizedCaseInsensitiveContains("premium") }
        return [PillOption("All", "All")] + nonPremium.map { PillOption($0, $0) }
    }

    private var categorySegments: some View {
        PillSegments(
            options: categoryOptions,
            selection: Binding(
                get: { category == "Premium" ? "" : category },
                set: { new in
                    guard new != category else { return }
                    // Direction first, and outside the animation: the
                    // transition is built as the view re-renders, so it has to
                    // already know which way this one is going.
                    let order = categoryOptions.map(\.id)
                    if let from = order.firstIndex(of: category),
                       let to = order.firstIndex(of: new) {
                        categoryShift = to >= from ? 1 : -1
                    }
                    category = new
                }
            ),
            height: 42,
            labelSize: 13.5,
            horizontalPadding: 16
        )
    }

    private var isPremiumActive: Bool { category == "Premium" }

    private var premiumPill: some View {
        Button(action: {
            if isPremiumActive {
                categoryShift = -1
                category = "All"
            } else {
                categoryShift = 1
                category = "Premium"
            }
        }) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 11.5, weight: .semibold))
                Text("Premium")
                    .font(.system(size: 13.5, weight: .semibold))
                    .lineLimit(1)
            }
            .foregroundStyle(isPremiumActive ? Color.AuraLoopOnInk : Color.AuraLoopInk.opacity(0.82))
            .padding(.horizontal, 18)
            .frame(height: 42)
            .background {
                if isPremiumActive {
                    Capsule()
                        .fill(Color.AuraLoopInk)
                        .shadow(color: .black.opacity(0.35), radius: 4, x: 0, y: 2)
                }
            }
            .background(Capsule().fill(Color.AuraLoopInk.opacity(0.06)))
            .overlay(
                Capsule()
                    .strokeBorder(
                        isPremiumActive
                            ? Color.clear
                            : Color.AuraLoopInk.opacity(0.13),
                        lineWidth: 1
                    )
            )
            .shadow(color: .black.opacity(0.30), radius: 9, x: 0, y: 4)
        }
        .buttonStyle(.plain)
        .animation(.spring(response: 0.34, dampingFraction: 0.86), value: isPremiumActive)
    }

    /// Centred like the Library's tabs. A library has four tabs and always
    /// fits; a catalog can grow a category at any time, so the row falls back
    /// to scrolling sideways rather than pushing its ends under the tray's
    /// edges.
    private var categoryRow: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 10) {
                Spacer(minLength: 0)
                categorySegments
                premiumPill
                Spacer(minLength: 0)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    categorySegments
                    premiumPill
                }
                .padding(.horizontal, 2)
                .padding(.vertical, 3)
            }
        }
        .frame(height: 58)
    }

    // MARK: - Filters

    private var filterRow: some View {
        HStack(spacing: 10) {
            if store.searchActive {
                SearchField()
            } else {
                Text(countLine)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(Color.AuraLoopSecondary)
            }
            Spacer(minLength: 12)
            if narrowed { clearFilters }
            FilterDropdown(
                title: "Resolution",
                value: resolution,
                width: 190,
                options: { pickOptions(all: resolutionOptions, selection: resolution) { resolution = $0 } }
            )
            FilterDropdown(
                title: "FPS",
                value: fps,
                width: 160,
                options: { pickOptions(all: fpsOptions, selection: fps) { fps = $0 } }
            )
        }
        .frame(height: 44)
        .animation(.easeOut(duration: 0.18), value: narrowed)
    }

    private var countLine: String {
        let count = filtered.count
        let noun = count == 1 ? "wallpaper" : "wallpapers"
        if category == "All" { return "\(count) \(noun)" }
        return "\(count) \(noun) in \(category)"
    }

    private var clearFilters: some View {
        Button {
            resolution = "All"
            fps = "All"
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "xmark")
                    .font(.system(size: 9.5, weight: .semibold))
                Text("Clear filters")
                    .font(.system(size: 12, weight: .semibold))
            }
            .foregroundStyle(Color.AuraLoopAccent)
            .padding(.horizontal, 14)
            .frame(height: 42)
            .background(Capsule().fill(Color.AuraLoopAccent.opacity(0.13)))
            .overlay(Capsule().strokeBorder(Color.AuraLoopAccent.opacity(0.28), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .transition(.opacity.combined(with: .scale(scale: 0.94)))
    }

    private func pickOptions(
        all: [String], selection: String, choose: @escaping (String) -> Void
    ) -> [MenuOption] {
        (["All"] + all).map { value in
            MenuOption(title: value, checked: selection == value) { choose(value) }
        }
    }

    // MARK: - Grid

    /// Cards carry the Library's trash button rather than a right-click menu.
    /// A wallpaper you downloaded can be sent away from here the same way it
    /// can from the Library, through the same confirmation, and the menu that
    /// used to be the only route to it is gone (owner, 2026-08-24).
    private var grid: some View {
        LazyVGrid(columns: gridColumns, spacing: 24) {
            ForEach(filtered) { item in
                WallpaperCard(item: item, persistentTitle: true, showsDelete: true)
            }
        }
    }

    // MARK: - Empty states

    /// The network got in the way rather than the filters, and there is
    /// genuinely nothing to show. Someone with downloads still has a grid, and
    /// gets `catalogNotice` above it instead of this.
    private var connectionProblem: CatalogError? {
        store.catalog.isEmpty ? store.catalogError : nil
    }

    /// Three different reasons a page can be empty, and each one deserves its
    /// own answer. Saying "Nothing matches that" to someone whose connection
    /// is blocked sends them to fiddle with filters that were never the
    /// problem, which is what a user reported.
    @ViewBuilder private var emptyState: some View {
        if !store.catalogLoaded, store.catalog.isEmpty {
            loadingState
        } else if let problem = connectionProblem {
            connectionState(problem)
        } else {
            noMatchesState
        }
    }

    private var loadingState: some View {
        VStack(spacing: 14) {
            ProgressView()
                .controlSize(.large)
                .tint(Color.AuraLoopAccent)
            Text("Loading wallpapers…")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.AuraLoopSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 84)
    }

    private func connectionState(_ problem: CatalogError) -> some View {
        VStack(spacing: 12) {
            emptyIcon(symbol(for: problem))
            Text(problem.title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.AuraLoopInk)
            Text(problem.detail)
                .font(.system(size: 12.5))
                .foregroundStyle(Color.AuraLoopSecondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 380)
            retryButton
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 70)
    }

    private var noMatchesState: some View {
        VStack(spacing: 12) {
            emptyIcon("sparkle.magnifyingglass")
            Text("Nothing matches that")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.AuraLoopInk)
            Text(store.searchText.isEmpty
                 ? "Try another category, or widen the resolution and frame rate."
                 : "No wallpaper called \(store.searchText). Try another word.")
                .font(.system(size: 12.5))
                .foregroundStyle(Color.AuraLoopSecondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 360)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 70)
    }

    /// The catalog is missing but the user's own downloads still fill the
    /// grid. Without this the page looks complete and nothing says that most
    /// of Explore is absent.
    @ViewBuilder private var catalogNotice: some View {
        if let problem = connectionProblem {
            HStack(spacing: 13) {
                Image(systemName: symbol(for: problem))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopAccent)
                VStack(alignment: .leading, spacing: 2) {
                    Text(problem.title)
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(Color.AuraLoopInk)
                    Text("Only the wallpapers you have already downloaded are showing.")
                        .font(.system(size: 11.5))
                        .foregroundStyle(Color.AuraLoopSecondary)
                }
                Spacer(minLength: 12)
                retryButton
            }
            .padding(.leading, 18)
            .padding(.trailing, 14)
            .padding(.vertical, 13)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.glassSheen(0.11, 0.04))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.AuraLoopInk.opacity(0.13), lineWidth: 1)
            )
        }
    }

    private var retryButton: some View {
        Button {
            store.retryCatalog()
        } label: {
            HStack(spacing: 7) {
                if store.catalogRefreshing {
                    ProgressView()
                        .controlSize(.small)
                        .tint(Color.AuraLoopAccent)
                } else {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 11, weight: .semibold))
                }
                Text(store.catalogRefreshing ? "Checking…" : "Try Again")
                    .font(.system(size: 12.5, weight: .semibold))
            }
            .foregroundStyle(Color.AuraLoopAccent)
            .padding(.horizontal, 18)
            .frame(height: 40)
            .background(Capsule().fill(Color.AuraLoopAccent.opacity(0.13)))
            .overlay(Capsule().strokeBorder(Color.AuraLoopAccent.opacity(0.28), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .disabled(store.catalogRefreshing)
    }

    private func emptyIcon(_ systemName: String) -> some View {
        Image(systemName: systemName)
            .font(.system(size: 22, weight: .medium))
            .foregroundStyle(Color.AuraLoopAccent)
            .frame(width: 54, height: 54)
            .background(Circle().fill(.glassSheen(0.14, 0.05)))
            .overlay(Circle().strokeBorder(Color.AuraLoopInk.opacity(0.16), lineWidth: 1))
    }

    private func symbol(for problem: CatalogError) -> String {
        switch problem {
        case .unreachable: return "wifi.slash"
        case .server: return "exclamationmark.icloud"
        case .unreadable: return "exclamationmark.shield"
        }
    }
}

/// A filter that opens a glass menu. Bigger than the pair Explore used to
/// carry (the owner asked for both the bubbles and the segments above them to
/// grow), and split into a grey name and a white value so the current setting
/// is the part you read.
struct FilterDropdown: View {
    var title: String
    var value: String
    var width: CGFloat = 190
    var options: () -> [MenuOption]

    @State private var hovering = false

    private var set: Bool { value != "All" }

    var body: some View {
        // Both of these sit at the right edge of the page, so the menu hangs
        // from their right edge. Anchored on the left it opened wider than the
        // pill and crossed the tray's edge.
        GlassDropdown(width: width, align: .trailing, options: options) {
            HStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(Color.AuraLoopSecondary)
                Text(value)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(set ? Color.AuraLoopAccent : Color.AuraLoopInk)
                Image(systemName: "chevron.down")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(Color.AuraLoopInk.opacity(0.55))
            }
            .lineLimit(1)
            .fixedSize()
            .padding(.horizontal, 18)
            .frame(height: 42)
            .background(Capsule().fill(.glassSheen(hovering ? 0.14 : 0.10, hovering ? 0.06 : 0.045)))
            .overlay(
                Capsule().strokeBorder(
                    set ? Color.AuraLoopAccent.opacity(0.35) : Color.AuraLoopInk.opacity(hovering ? 0.2 : 0.13),
                    lineWidth: 1
                )
            )
            .shadow(color: .black.opacity(0.28), radius: 8, x: 0, y: 3)
            .onHover { hovering = $0 }
            .animation(.easeOut(duration: 0.16), value: hovering)
        }
    }
}
