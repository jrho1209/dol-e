import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('DOL-E Content')
    .items([
      // ── Restaurants ──────────────────────────────────────────────────────
      S.listItem()
        .title('🍽️ Restaurants')
        .child(
          S.list()
            .title('Restaurants')
            .items([
              S.listItem()
                .title('🇰🇷 한식 Korean')
                .child(
                  S.documentList()
                    .title('Korean Restaurants')
                    .filter('_type == "place" && category == "restaurant" && cuisine_type == "korean"')
                ),
              S.listItem()
                .title('🇯🇵 일식 Japanese')
                .child(
                  S.documentList()
                    .title('Japanese Restaurants')
                    .filter('_type == "place" && category == "restaurant" && cuisine_type == "japanese"')
                ),
              S.listItem()
                .title('🇨🇳 중식 Chinese')
                .child(
                  S.documentList()
                    .title('Chinese Restaurants')
                    .filter('_type == "place" && category == "restaurant" && cuisine_type == "chinese"')
                ),
              S.listItem()
                .title('🍝 양식 Western')
                .child(
                  S.documentList()
                    .title('Western Restaurants')
                    .filter('_type == "place" && category == "restaurant" && cuisine_type == "western"')
                ),
              S.listItem()
                .title('🍴 기타 Other')
                .child(
                  S.documentList()
                    .title('Other Restaurants')
                    .filter('_type == "place" && category == "restaurant" && (cuisine_type == "other" || !defined(cuisine_type))')
                ),
              S.divider(),
              S.listItem()
                .title('전체 All Restaurants')
                .child(
                  S.documentList()
                    .title('All Restaurants')
                    .filter('_type == "place" && category == "restaurant"')
                ),
            ])
        ),

      // ── Cafes ────────────────────────────────────────────────────────────
      S.listItem()
        .title('☕ Cafes')
        .child(
          S.documentList()
            .title('Cafes')
            .filter('_type == "place" && category == "cafe"')
        ),

      // ── Attractions ──────────────────────────────────────────────────────
      S.listItem()
        .title('🏛️ Attractions')
        .child(
          S.documentList()
            .title('Attractions')
            .filter('_type == "place" && category == "attraction"')
        ),

      // ── Accommodations ───────────────────────────────────────────────────
      S.listItem()
        .title('🏨 Accommodations')
        .child(
          S.documentList()
            .title('Accommodations')
            .filter('_type == "place" && category == "accommodation"')
        ),

      // ── Shopping ─────────────────────────────────────────────────────────
      S.listItem()
        .title('🛍️ Shopping')
        .child(
          S.documentList()
            .title('Shopping')
            .filter('_type == "place" && category == "shopping"')
        ),

      S.divider(),

      // ── All Places ───────────────────────────────────────────────────────
      S.listItem()
        .title('📋 All Places')
        .child(
          S.documentList()
            .title('All Places')
            .filter('_type == "place"')
        ),
    ])
