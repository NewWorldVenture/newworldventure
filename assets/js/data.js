const TRIPNEST_DEFAULT_DATA = [
  {
    id: "atlantic_city",
    name: "2025 Destination - Atlantic City",
    region: "North America",
    budget: "$$$",
    image: "assets/img/atlantic_city.jpeg",
    highlights: ["Northern lights", "Hot springs", "Road trips"],
    tags: ["adventure", "nature", "photography"],
    blurb: "A cozy capital with big nature energy — waterfalls, glaciers, and geothermal pools.",
    sampleDays: ["Golden Circle day tour", "Blue Lagoon soak", "South Coast waterfalls"]
  },
  {
    id: "cancun",
    name: "2025 Destination - Cancún",
    region: "Caribbean",
    budget: "$$",
    image: "assets/img/cancun.jpeg",
    highlights: ["Beaches", "All-inclusive", "Day trips"],
    tags: ["beach", "family", "relaxed"],
    blurb: "Easy beach time with great food, cenotes, and quick excursions.",
    sampleDays: ["Beach & tacos", "Isla Mujeres day trip", "Cenote swim"]
  },
  {
    id: "disney",
    name: "2025 Destination - Disney World",
    region: "North America",
    budget: "$$$",
    image: "assets/img/disney.jpeg",
    highlights: ["Temples", "Food", "Culture"],
    tags: ["culture", "food", "walkable"],
    blurb: "Historic streets, incredible meals, and peaceful gardens.",
    sampleDays: ["Fushimi Inari sunrise walk", "Tea district stroll", "Nishiki Market bites"]
  },
  {
    id: "greece",
    name: "2025 Destination - Greece",
    region: "Europe",
    budget: "$$",
    image: "assets/img/greece.jpeg",
    highlights: ["Views", "Seafood", "Day trips"],
    tags: ["food", "culture", "city"],
    blurb: "A laid-back city with great coffee, pastel buildings, and ocean breezes.",
    sampleDays: ["Tram ride + miradouros", "Belém pastries", "Sintra day trip"]
  },
  {
    id: "bermuda",
    name: "2025 Destination - Bermuda",
    region: "North America",
    budget: "$$$",
    image: "assets/img/bermuda.jpeg",
    highlights: ["Lakes", "Hiking", "Scenic drives"],
    tags: ["nature", "adventure", "mountains"],
    blurb: "Iconic turquoise lakes and mountain scenery — perfect for fresh-air trips.",
    sampleDays: ["Lake Louise sunrise", "Icefields Parkway drive", "Hot springs evening"]
  },
  {
    id: "philly",
    name: "2025 Destination - Philadelphia",
    region: "North America",
    budget: "$",
    image: "assets/img/philly.jpeg",
    highlights: ["Weekend trips", "Food", "Walkable"],
    tags: ["weekend", "food", "relaxed"],
    blurb: "Charming squares, easy walking, and comfort food — great for a quick reset.",
    sampleDays: ["Historic district walk", "River Street bites", "Coffee + parks"]
  },
  {
    id: "new york",
    name: "2025 Destination - New York",
    region: "North America",
    budget: "$$",
    image: "assets/img/newyork.jpeg",
    highlights: ["Views", "Wine", "Coast"],
    tags: ["nature", "city", "food"],
    blurb: "Table Mountain, coastal drives, and world-class wine country nearby.",
    sampleDays: ["Table Mountain cable car", "Cape Peninsula drive", "Stellenbosch tasting"]
  },
  {
    id: "dominican",
    name: "2025 Destination - Dominican Republic",
    region: "Caribbean",
    budget: "$$$",
    image: "assets/img/dominican.jpeg",
    highlights: ["Adventure", "Lakes", "Scenery"],
    tags: ["adventure", "nature", "thrills"],
    blurb: "A postcard town built for big views and bigger outdoor days.",
    sampleDays: ["Lake cruise", "Day hike", "Adventure activity"]
  }
];

function getTripnestData() {
  try {
    const raw = localStorage.getItem("tripnestDestinations");
    if (!raw) return TRIPNEST_DEFAULT_DATA;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return TRIPNEST_DEFAULT_DATA;

    return parsed;
  } catch (error) {
    return TRIPNEST_DEFAULT_DATA;
  }
}

window.TRIPNEST_DEFAULT_DATA = TRIPNEST_DEFAULT_DATA;
window.TRIPNEST_DATA = getTripnestData();
