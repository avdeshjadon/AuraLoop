import SwiftUI
import AuraLoopKit

struct FavoritesView: View {
    @EnvironmentObject var store: AppStore

    private let gridColumns = [
        GridItem(.flexible(), spacing: 24),
        GridItem(.flexible(), spacing: 24),
        GridItem(.flexible(), spacing: 24)
    ]

    private func matchesSearch(_ item: WallpaperItem) -> Bool {
        store.searchText.isEmpty
            || item.title.localizedCaseInsensitiveContains(store.searchText)
            || item.category.localizedCaseInsensitiveContains(store.searchText)
    }

    private var items: [WallpaperItem] {
        store.likedItems.filter(matchesSearch)
    }

    var body: some View {
        ZStack {
            AuraLoopPageBackground()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    header
                        .padding(.top, 96)
                        .padding(.horizontal, 64)
                        .padding(.bottom, 24)

                    if items.isEmpty {
                        emptyState
                            .frame(maxWidth: .infinity)
                            .padding(.top, 80)
                    } else {
                        LazyVGrid(columns: gridColumns, spacing: 24) {
                            ForEach(items) { item in
                                WallpaperCard(item: item, persistentTitle: true)
                                    .pointingCursor()
                            }
                        }
                        .padding(.horizontal, 64)
                        .padding(.bottom, 48)
                    }
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 10) {
                    Text("Favorites")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(Color.AuraLoopInk)
                    Text("\(items.count)")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.AuraLoopSecondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.AuraLoopInk.opacity(0.08)))
                }
                Text("Wallpapers you have marked with a heart")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.AuraLoopSecondary)
            }
            Spacer()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.slash")
                .font(.system(size: 48, weight: .light))
                .foregroundStyle(Color.AuraLoopSecondary.opacity(0.6))
            Text("No favorites yet")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color.AuraLoopInk)
            Text("Tap the heart icon on any wallpaper in Home or Explore to add it to your favorites.")
                .font(.system(size: 13, weight: .regular))
                .foregroundStyle(Color.AuraLoopSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 380)
        }
        .padding(40)
    }
}
