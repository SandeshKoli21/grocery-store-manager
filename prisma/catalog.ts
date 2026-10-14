// Generates a ~1000-product sample catalog for the seed: every type × brand × size
// in each group below. Prices are ₹ per pack/piece (or per kg for loose items),
// stock and low-stock levels are display quantities. Output is deterministic.

// [name, category, unit, price ₹ per unit, stock, low-stock level], same shape as seed.ts.
export type CatalogProduct = [string, string, string, string, string, string];

type Size = [label: string, unit: "kg" | "L" | "pcs" | "pack", priceFactor: number];

type Group = {
  category: string;
  /** [type name, base price ₹ for a priceFactor of 1] */
  types: [string, number][];
  /** "" means no brand (loose / unbranded). */
  brands: string[];
  sizes: Size[];
};

const PACK = (label: string, factor: number): Size => [label, "pack", factor];
const PCS = (label: string, factor: number): Size => [label, "pcs", factor];
const LOOSE: Size = ["", "kg", 1];

const GROUPS: Group[] = [
  // ---- Grains ----
  {
    category: "Grains",
    types: [
      ["Basmati Rice", 120], ["Dubar Basmati Rice", 95], ["Tibar Basmati Rice", 105], ["Mogra Basmati Rice", 80],
      ["Sona Masoori Rice", 65], ["Kolam Rice", 58], ["Ponni Rice", 62], ["Brown Rice", 110],
      ["Jeerakasala Rice", 140], ["Indrayani Rice", 75], ["Idli Rice", 50], ["Matta Rice", 70],
      ["Gobindobhog Rice", 130], ["Ambemohar Rice", 125], ["Red Rice", 115], ["Black Rice", 220],
    ],
    brands: ["India Gate", "Daawat", "Kohinoor", "Fortune", "Tata Sampann"],
    sizes: [PACK("1kg", 1), PACK("5kg", 4.7)],
  },
  {
    category: "Grains",
    types: [
      ["Basmati Rice", 95], ["Sona Masoori Rice", 55], ["Kolam Rice", 50], ["Indrayani Rice", 65],
      ["Idli Rice", 42], ["Broken Rice", 35], ["Wheat", 32], ["Jowar", 45], ["Bajra", 38], ["Ragi", 55],
    ],
    brands: ["Loose"],
    sizes: [LOOSE],
  },
  {
    category: "Grains",
    types: [
      ["Whole Wheat Atta", 50], ["Multigrain Atta", 72], ["Chakki Atta", 48], ["Maida", 45], ["Besan", 95],
      ["Sooji", 50], ["Thick Poha", 58], ["Thin Poha", 60], ["Dalia", 55], ["Ragi Flour", 80],
      ["Jowar Flour", 70], ["Bajra Flour", 65], ["Rice Flour", 55], ["Sabudana", 90], ["Rolled Oats", 190],
    ],
    brands: ["Aashirvaad", "Pillsbury", "Fortune", "24 Mantra Organic"],
    sizes: [PACK("1kg", 1), PACK("5kg", 4.7)],
  },
  {
    category: "Grains",
    types: [["Sugar", 46], ["Jaggery", 70], ["Rock Salt", 60], ["Iodised Salt", 28]],
    brands: ["Tata", "Madhur", "Dhampur"],
    sizes: [PACK("1kg", 1)],
  },

  // ---- Pulses ----
  {
    category: "Pulses",
    types: [
      ["Toor Dal", 165], ["Moong Dal", 140], ["Whole Moong", 130], ["Chana Dal", 105], ["Kabuli Chana", 150],
      ["Kala Chana", 95], ["Masoor Dal", 115], ["Whole Masoor", 105], ["Urad Dal", 150], ["Whole Urad", 140],
      ["Chitra Rajma", 160], ["Jammu Rajma", 190], ["Lobia", 120], ["Matki", 130], ["Hara Vatana", 110],
      ["Kulith", 120],
    ],
    brands: ["Tata Sampann", "24 Mantra Organic", "Fortune", "Rajdhani"],
    sizes: [PACK("500g", 0.52), PACK("1kg", 1)],
  },
  {
    category: "Pulses",
    types: [
      ["Toor Dal", 150], ["Moong Dal", 128], ["Chana Dal", 95], ["Masoor Dal", 105], ["Urad Dal", 138],
      ["Kabuli Chana", 140], ["Rajma", 150], ["Matki", 120], ["Lobia", 110], ["Peanuts", 140],
    ],
    brands: ["Loose"],
    sizes: [LOOSE],
  },

  // ---- Dairy ----
  {
    category: "Dairy",
    types: [["Full Cream Milk", 68], ["Toned Milk", 56], ["Double Toned Milk", 50], ["Cow Milk", 58], ["Buffalo Milk", 74]],
    brands: ["Amul", "Mother Dairy", "Gokul", "Chitale", "Nandini"],
    sizes: [PACK("500ml", 0.5), PACK("1L", 1)],
  },
  {
    category: "Dairy",
    types: [["Curd", 90], ["Paneer", 420], ["Butter", 560], ["Cheese Slices", 640], ["Fresh Cream", 260], ["Lassi", 100], ["Buttermilk", 40], ["Shrikhand", 300]],
    brands: ["Amul", "Mother Dairy", "Gokul", "Britannia"],
    sizes: [PACK("200g", 0.2), PACK("500g", 0.5)],
  },
  {
    category: "Dairy",
    types: [["Desi Ghee", 650], ["Cow Ghee", 700]],
    brands: ["Amul", "Gowardhan", "Patanjali", "Nandini", "Mother Dairy"],
    sizes: [PACK("500ml", 0.5), PACK("1L", 1)],
  },

  // ---- Vegetables (loose, per kg) ----
  {
    category: "Vegetables",
    types: [
      ["Onion", 40], ["Potato", 30], ["Tomato", 35], ["Green Chilli", 80], ["Ginger", 120], ["Garlic", 200],
      ["Cauliflower", 50], ["Cabbage", 30], ["Brinjal", 45], ["Bhindi", 60], ["Capsicum", 80], ["Carrot", 50],
      ["Beetroot", 45], ["Cucumber", 35], ["Bottle Gourd", 35], ["Bitter Gourd", 60], ["Ridge Gourd", 55],
      ["Pumpkin", 30], ["Drumstick", 90], ["French Beans", 80], ["Cluster Beans", 70], ["Green Peas", 100],
      ["Spinach", 40], ["Methi", 60], ["Radish", 35], ["Sweet Potato", 50], ["Raw Banana", 40],
      ["Lemon", 100], ["Spring Onion", 80], ["Mushroom", 250], ["Baby Corn", 180], ["Broccoli", 200],
      ["Zucchini", 160], ["Red Cabbage", 120], ["Lettuce", 150], ["Celery", 180], ["Colocasia", 60],
      ["Yam", 55], ["Tindora", 60], ["Parwal", 70],
    ],
    brands: ["", "Organic"],
    sizes: [LOOSE],
  },

  // ---- Fruits (loose, per kg) ----
  {
    category: "Fruits",
    types: [
      ["Apple (Shimla)", 180], ["Apple (Kashmir)", 160], ["Apple (Fuji)", 260], ["Banana (Robusta)", 50],
      ["Banana (Elaichi)", 80], ["Orange (Nagpur)", 90], ["Mosambi", 70], ["Pomegranate", 160],
      ["Papaya", 45], ["Watermelon", 25], ["Muskmelon", 40], ["Pineapple", 70], ["Guava", 80],
      ["Chikoo", 90], ["Grapes (Green)", 110], ["Grapes (Black)", 130], ["Mango (Alphonso)", 450],
      ["Mango (Kesar)", 250], ["Mango (Totapuri)", 90], ["Pear", 150], ["Kiwi", 300], ["Custard Apple", 140],
      ["Jamun", 160], ["Strawberry", 350], ["Dragon Fruit", 280], ["Plum", 220], ["Peach", 240],
      ["Litchi", 200], ["Coconut", 50], ["Avocado", 400],
    ],
    brands: ["", "Organic", "Premium"],
    sizes: [LOOSE],
  },

  // ---- Snacks ----
  {
    category: "Snacks",
    types: [
      ["Marie Biscuits", 30], ["Cream Crackers", 35], ["Digestive Biscuits", 60], ["Bourbon Biscuits", 35],
      ["Glucose Biscuits", 10], ["Butter Cookies", 50], ["Cashew Cookies", 60], ["Choco Chip Cookies", 55],
      ["Coconut Cookies", 30], ["Jeera Biscuits", 25],
    ],
    brands: ["Britannia", "Parle", "Sunfeast", "Unibic", "Priyagold"],
    sizes: [PACK("Small", 1), PACK("Family Pack", 3.2)],
  },
  {
    category: "Snacks",
    types: [["Classic Salted Chips", 20], ["Magic Masala Chips", 20], ["Cream & Onion Chips", 20], ["Tomato Chips", 20], ["Peri Peri Chips", 20]],
    brands: ["Lay's", "Bingo", "Balaji", "Pringles"],
    sizes: [PACK("Small", 1), PACK("Large", 2.5)],
  },
  {
    category: "Snacks",
    types: [
      ["Aloo Bhujia", 55], ["Moong Dal Namkeen", 50], ["Navratan Mix", 55], ["Khatta Meetha", 50],
      ["Bhujia Sev", 55], ["Chana Jor Garam", 45], ["Masala Peanuts", 45], ["Cornflakes Mixture", 50],
    ],
    brands: ["Haldiram's", "Bikaji", "Balaji", "Bikano"],
    sizes: [PACK("200g", 1), PACK("400g", 1.9)],
  },
  {
    category: "Snacks",
    types: [["Masala Noodles", 14], ["Atta Noodles", 25], ["Cup Noodles", 50], ["Pasta", 40], ["Vermicelli", 35]],
    brands: ["Maggi", "Yippee", "Ching's", "Knorr"],
    sizes: [PACK("Single", 1), PACK("4 Pack", 3.8)],
  },

  // ---- Beverages ----
  {
    category: "Beverages",
    types: [["Tea", 280], ["Green Tea", 350]],
    brands: ["Tata Tea Gold", "Red Label", "Taj Mahal", "Wagh Bakri", "Society"],
    sizes: [PACK("250g", 0.5), PACK("500g", 1), PACK("1kg", 1.95)],
  },
  {
    category: "Beverages",
    types: [["Instant Coffee", 150], ["Filter Coffee", 120]],
    brands: ["Bru", "Nescafe", "Continental", "Sunrise"],
    sizes: [PACK("50g", 0.5), PACK("100g", 1), PACK("200g", 1.9)],
  },
  {
    category: "Beverages",
    types: [
      ["Coca-Cola", 40], ["Pepsi", 40], ["Sprite", 40], ["Thums Up", 40], ["Fanta", 40], ["Limca", 40],
      ["Mountain Dew", 40], ["7Up", 40], ["Mirinda", 40], ["Maaza", 42], ["Frooti", 42], ["Slice", 42],
    ],
    brands: [""],
    sizes: [PCS("250ml", 0.5), PCS("750ml", 1), PCS("2L", 2.4)],
  },
  {
    category: "Beverages",
    types: [
      ["Mixed Fruit Juice", 120], ["Orange Juice", 120], ["Apple Juice", 125], ["Guava Juice", 110],
      ["Mango Juice", 110], ["Litchi Juice", 115], ["Pomegranate Juice", 150], ["Cranberry Juice", 140],
    ],
    brands: ["Real", "Tropicana", "B Natural"],
    sizes: [PCS("200ml", 0.25), PCS("1L", 1)],
  },
  {
    category: "Beverages",
    types: [["Health Drink", 260]],
    brands: ["Bournvita", "Horlicks", "Boost", "Complan", "Protinex"],
    sizes: [PACK("500g", 1), PACK("1kg", 1.9)],
  },

  // ---- Household ----
  {
    category: "Household",
    types: [["Detergent Powder", 140]],
    brands: ["Surf Excel", "Ariel", "Tide", "Rin", "Wheel", "Ghadi", "Nirma"],
    sizes: [PACK("500g", 0.52), PACK("1kg", 1), PACK("4kg", 3.8)],
  },
  {
    category: "Household",
    types: [["Liquid Detergent", 220], ["Detergent Bar", 30]],
    brands: ["Surf Excel", "Ariel", "Tide", "Rin"],
    sizes: [PACK("Regular", 1), PACK("Value Pack", 2.8)],
  },
  {
    category: "Household",
    types: [["Dishwash Bar", 10], ["Dishwash Liquid", 105], ["Dishwash Gel", 120]],
    brands: ["Vim", "Pril", "Exo", "Pitambari"],
    sizes: [PCS("Small", 1), PCS("Large", 2.6)],
  },
  {
    category: "Household",
    types: [["Citrus Floor Cleaner", 99], ["Floral Floor Cleaner", 99], ["Pine Floor Cleaner", 99], ["Lavender Floor Cleaner", 99], ["Toilet Cleaner", 99]],
    brands: ["Lizol", "Domex", "Harpic"],
    sizes: [PCS("500ml", 1), PCS("1L", 1.85)],
  },
  {
    category: "Household",
    types: [["Sandal Agarbatti", 45], ["Rose Agarbatti", 45], ["Jasmine Agarbatti", 45], ["Lavender Agarbatti", 45], ["Mogra Agarbatti", 45]],
    brands: ["Cycle", "Mangaldeep", "Zed Black", "Hem"],
    sizes: [PACK("", 1)],
  },
  {
    category: "Household",
    types: [["Mosquito Repellent Refill", 85], ["Mosquito Coil", 45], ["Insect Spray", 199]],
    brands: ["Good Knight", "All Out", "Mortein"],
    sizes: [PCS("", 1)],
  },
  {
    category: "Household",
    types: [["Garbage Bags", 99], ["Aluminium Foil", 110], ["Cling Wrap", 120], ["Kitchen Towels", 90], ["Tissue Box", 80], ["Scrub Pad", 25], ["Matchbox Pack", 10], ["Camphor", 60], ["Candles", 40]],
    brands: ["Home Pro", "Freshwrapp", "Ezee"],
    sizes: [PACK("", 1)],
  },

  // ---- Personal Care ----
  {
    category: "Personal Care",
    types: [["Soap", 38]],
    brands: ["Lux", "Lifebuoy", "Dove", "Pears", "Santoor", "Cinthol", "Dettol", "Hamam", "Medimix", "Godrej No.1"],
    sizes: [PCS("100g", 1), PACK("4 x 100g", 3.7)],
  },
  {
    category: "Personal Care",
    types: [["Shampoo", 180], ["Conditioner", 200]],
    brands: ["Clinic Plus", "Head & Shoulders", "Sunsilk", "Dove", "Pantene", "TRESemme"],
    sizes: [PCS("180ml", 1), PCS("340ml", 1.8), PCS("650ml", 3.2)],
  },
  {
    category: "Personal Care",
    types: [["Toothpaste", 95]],
    brands: ["Colgate Strong Teeth", "Colgate MaxFresh", "Pepsodent", "Close-Up", "Sensodyne", "Dabur Red", "Patanjali Dant Kanti"],
    sizes: [PCS("100g", 0.55), PCS("200g", 1)],
  },
  {
    category: "Personal Care",
    types: [["Hair Oil", 105]],
    brands: ["Parachute", "Dabur Amla", "Bajaj Almond Drops", "Navratna", "Clinic Plus", "Indulekha"],
    sizes: [PCS("100ml", 0.5), PCS("200ml", 1), PCS("500ml", 2.3)],
  },
  {
    category: "Personal Care",
    types: [["Handwash", 99], ["Handwash Refill", 160], ["Body Wash", 250], ["Face Wash", 150], ["Body Lotion", 230]],
    brands: ["Dettol", "Lifebuoy", "Himalaya", "Nivea", "Pond's"],
    sizes: [PCS("Regular", 1), PCS("Large", 1.8)],
  },
  {
    category: "Personal Care",
    types: [["Soft Toothbrush", 40], ["Medium Toothbrush", 40], ["Shaving Cream", 90], ["Deodorant", 220], ["Talcum Powder", 120], ["Sanitary Pads", 99]],
    brands: ["Colgate", "Oral-B", "Gillette", "Nivea", "Whisper"],
    sizes: [PCS("", 1)],
  },
];

/** Small deterministic PRNG (mulberry32) so every seed run builds the same catalog. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds the catalog, skipping any name already in `existingNames`. */
export function buildCatalog(existingNames: Iterable<string>): CatalogProduct[] {
  const random = rng(42);
  const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const seen = new Set(existingNames);
  const products: CatalogProduct[] = [];

  for (const { category, types, brands, sizes } of GROUPS) {
    for (const [typeName, basePrice] of types) {
      for (const brand of brands) {
        for (const [sizeLabel, unit, factor] of sizes) {
          const name = [brand, typeName, sizeLabel].filter(Boolean).join(" ");
          if (seen.has(name)) continue;
          seen.add(name);

          const premium = brand === "Organic" || brand === "Premium" ? 1.4 : 1;
          const price = Math.max(1, Math.round(basePrice * factor * premium * (0.9 + random() * 0.2)));
          const lowStockLevel = unit === "kg" || unit === "L" ? between(2, 8) : between(3, 12);
          // About 1 in 12 products starts at or below its low-stock level.
          const stock = random() < 1 / 12 ? between(0, lowStockLevel) : between(lowStockLevel + 5, lowStockLevel + 80);
          products.push([name, category, unit, String(price), String(stock), String(lowStockLevel)]);
        }
      }
    }
  }
  return products;
}
