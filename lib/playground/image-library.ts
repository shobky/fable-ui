/**
 * A small, verified photo library for live mode. Models cannot see the web
 * here, so they search this list instead of inventing URLs — the same
 * pattern a real app uses with its own media or search tool.
 */

const url = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80&auto=format&fit=crop`

const LIBRARY = [
  { id: "1536663815808-535e2280d2c2", alt: "Terracotta rooftops of an old European city by a river", tags: "lisbon portugal city rooftops travel europe old town" },
  { id: "1585208798174-6cedd86e019a", alt: "A yellow tram on a steep cobbled street", tags: "lisbon tram street travel portugal transport" },
  { id: "1513735492246-483525079686", alt: "A riverside city at sunset", tags: "city sunset river travel europe golden hour" },
  { id: "1558370781-d6196949e317", alt: "A narrow street lined with old buildings", tags: "street old town europe travel walking" },
  { id: "1555881400-74d7acaacd8b", alt: "Colorful houses along a river with boats", tags: "porto portugal river houses travel" },
  { id: "1507525428034-b723cf961d3e", alt: "A calm beach at sunset", tags: "beach sea ocean sunset summer vacation" },
  { id: "1469474968028-56623f02e42e", alt: "Mountains and a valley in soft light", tags: "mountains nature landscape hiking outdoors" },
  { id: "1476514525535-07fb3b4ae5f1", alt: "A wooden boat on a turquoise mountain lake", tags: "lake mountains boat nature travel switzerland alps" },
  { id: "1501785888041-af3ef285b470", alt: "A lake surrounded by mountains at dusk", tags: "lake mountains landscape nature calm" },
  { id: "1586023492125-27b2c045efd7", alt: "Living room with a yellow armchair and wall art", tags: "interior living room chair design home minimal" },
  { id: "1618221195710-dd6b41faaea6", alt: "Long living room with a low sofa and wood details", tags: "interior living room sofa design home warm" },
  { id: "1567016432779-094069958ea5", alt: "Orange sofa with a pink cushion", tags: "interior sofa color furniture home" },
  { id: "1616486338812-3dadae4b4ace", alt: "Bright living room in white and beige", tags: "interior living room neutral bright home" },
  { id: "1600210492486-724fe5c67fb0", alt: "Living room with plants and natural light", tags: "interior plants living room home light" },
  { id: "1484154218962-a197022b5858", alt: "A white kitchen with an island and pendant lights", tags: "kitchen interior home white modern" },
  { id: "1600585154340-be6161a56a0c", alt: "A modern house with large windows at dusk", tags: "house architecture modern home exterior real estate" },
  { id: "1504674900247-0877df9cc836", alt: "Plates of colorful food on a dark table", tags: "food dinner meal table restaurant" },
  { id: "1512621776951-a57141f2eefd", alt: "A colorful vegetable bowl", tags: "food salad healthy vegetarian vegan bowl" },
  { id: "1546069901-ba9599a7e63c", alt: "A salmon and vegetable bowl", tags: "food salmon healthy bowl lunch" },
  { id: "1540189549336-e6e99c3679fe", alt: "A salad with vegetables on a dark plate", tags: "food salad dinner vegetarian" },
  { id: "1414235077428-338989a2e8c0", alt: "A plated restaurant dish with wine glasses", tags: "restaurant dinner food fine dining wine" },
  { id: "1517248135467-4c7edcad34c4", alt: "A restaurant interior with warm lights", tags: "restaurant cafe interior dining" },
  { id: "1497366216548-37526070297c", alt: "An open-plan office with desks", tags: "office workplace interior work" },
  { id: "1522071820081-009f0129c71c", alt: "A team working together around a table with laptops", tags: "team work meeting collaboration startup office" },
  { id: "1521737604893-d14cc237f11d", alt: "People in a meeting around a wooden table", tags: "team meeting work office people" },
  { id: "1460925895917-afdab827c52f", alt: "A laptop showing analytics charts", tags: "analytics data dashboard laptop business charts" },
  { id: "1551288049-bebda4e38f71", alt: "Analytics dashboards on a screen", tags: "dashboard data analytics charts metrics" },
  { id: "1531297484001-80022131f5a1", alt: "A laptop glowing in the dark", tags: "technology laptop computer software dark" },
  { id: "1523275335684-37898b6baf30", alt: "A white watch on a yellow background", tags: "product watch accessory minimal" },
  { id: "1505740420928-5e560c06d30e", alt: "Headphones on a yellow background", tags: "product headphones audio music" },
  { id: "1542291026-7eec264c27ff", alt: "A red sneaker on a red background", tags: "product sneaker shoe fashion" },
] as const

export function searchImages(query: string, limit = 6) {
  const words = query.toLowerCase().split(/\W+/).filter((word) => word.length > 2)
  return LIBRARY.map((image) => ({
    image,
    score: words.reduce((total, word) => total + (image.tags.includes(word) ? 2 : image.alt.toLowerCase().includes(word) ? 1 : 0), 0),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Math.max(limit, 1), 12))
    .map(({ image }) => ({ src: url(image.id), alt: image.alt, credit: "Unsplash" }))
}
