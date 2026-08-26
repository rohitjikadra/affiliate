import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { assertNotProductionSeed } from "../src/lib/production-guard.ts";

assertNotProductionSeed();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function amazonUrl(asin) {
  return `https://www.amazon.in/dp/${asin}`;
}

function amazonImage(asin) {
  return `https://m.media-amazon.com/images/P/${asin}.jpg`;
}

async function seed() {
  await prisma.priceAlert.deleteMany();
  await prisma.priceEvent.deleteMany();
  await prisma.job.deleteMany();
  await prisma.workerHeartbeat.deleteMany();
  await prisma.productIdentifier.deleteMany();
  await prisma.comparisonItem.deleteMany();
  await prisma.comparison.deleteMany();
  await prisma.guideProduct.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.affiliateClick.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.slugRedirect.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.category.deleteMany();
  await prisma.merchant.deleteMany();

  const amazon = await prisma.merchant.create({
    data: {
      slug: "amazon",
      name: "Amazon",
      kind: "MARKETPLACE",
      network: "AMAZON",
      websiteUrl: "https://www.amazon.in",
      isActive: true,
      defaultTag: process.env.AMAZON_ASSOCIATE_TAG?.trim() || null,
      integrationKey: "AMAZON_IN",
      hostAllowlist: ["amazon.in", "www.amazon.in", "amzn.in", "amzn.to", "amazon.com", "www.amazon.com"],
      fetchEnabled: false,
      rateLimitPerSecond: 1,
      disclosure: "As an Amazon Associate we earn from qualifying purchases.",
    },
  });

  const kitchen = await prisma.category.create({
    data: {
      slug: "kitchen-appliances",
      name: "Kitchen Appliances",
      description: "Countertop kitchen appliances for Indian homes, roughly ₹800–₹8,000.",
      imageUrl: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=80",
    },
  });

  const products = [
    {
      slug: "prestige-iris-750w-mixer-grinder",
      title: "Prestige Iris 750W Mixer Grinder (4 jars)",
      brand: "Prestige",
      asin: "B08CFJBZRK",
      description:
        "A 750W home mixer with three stainless-steel jars plus a juicer jar. It is a typical Indian wet-and-dry mixie, not a silent blender. Expect motor noise, and give masala and coconut time in short pulses rather than one long run.",
      bestFor: "Families who want a 750W 4-jar mixie for daily chutney, masala, and the occasional juice.",
      pros: "750W motor listed by the manufacturer\nFour jars including a juicer jar\nISI certified with a 2-year manufacturer warranty",
      cons: "Noisier than a blender\nPlastic body like most mixies in this price band\nJuicer jar is extra bulk if you will not juice",
      faq: "Is 750W enough for wet grinding?\nFor home chutney and masala, yes, if you pulse and add water. It is not a commercial wet grinder.\n\nDoes the warranty cover the motor?\nAmazon lists a 2-year manufacturer warranty on this Iris 4-jar black listing. Confirm the card in the box.",
      warranty: "2-year manufacturer warranty (as listed on Amazon.in)",
      specs: [
        { label: "Wattage", value: "750 W" },
        { label: "Jars", value: "4 (3 stainless steel + 1 juicer)" },
        { label: "Jar material", value: "Stainless steel (main jars)" },
        { label: "Colour", value: "Black" },
      ],
      scoreBreakdown: [
        { label: "Daily grinding", score: 8.2 },
        { label: "Jar setup", score: 8.0 },
        { label: "Noise / bulk", score: 6.5 },
        { label: "Value", score: 8.1 },
      ],
      ourScore: "8.1",
      featured: true,
      seoTitle: "Prestige Iris 750W mixer grinder review — jars, noise, who it is for",
      seoDescription: "Editorial take on the Prestige Iris 750W 4-jar mixer for Indian kitchens, with a tracked Amazon offer.",
      offerTitle: "4-jar black listing",
    },
    {
      slug: "bajaj-rex-500w-mixer-grinder",
      title: "Bajaj Rex 500W Mixer Grinder (3 jars)",
      brand: "Bajaj",
      asin: "B00HVXS7WC",
      description:
        "A 500W, 3-jar mixie aimed at smaller kitchens and lighter loads. 500W is enough for chutney and batter if you work in batches. It will struggle if you expect 750W-class dry grinding of large masala loads.",
      bestFor: "Budget buyers who mostly make chutney and small wet batches, not heavy dry grinding.",
      pros: "Lower wattage and a simpler 3-jar set\nStainless-steel jars (1.2L, 0.8L, 0.3L as listed)\nLong-running, easy-to-find model",
      cons: "500W is slower on dry masala\n1-year warranty on the white listing we tracked\nABS body, not a premium motor housing",
      faq: "Should I buy 500W to save money?\nOnly if your grinding is light. For daily coconut chutney plus dry spices, 750W is less frustrating.\n\nHow many jars?\nThree stainless-steel jars on this listing.",
      warranty: "1-year manufacturer warranty (white listing on Amazon.in)",
      specs: [
        { label: "Wattage", value: "500 W" },
        { label: "Jars", value: "3 stainless steel" },
        { label: "Jar sizes", value: "1.2L, 0.8L, 0.3L" },
        { label: "Speed control", value: "3 speeds + inching" },
      ],
      scoreBreakdown: [
        { label: "Daily grinding", score: 6.8 },
        { label: "Jar setup", score: 7.2 },
        { label: "Noise / bulk", score: 7.0 },
        { label: "Value", score: 8.4 },
      ],
      ourScore: "7.2",
      seoTitle: "Bajaj Rex 500W mixer grinder — when 500W is enough",
      seoDescription: "Who should buy a 500W 3-jar Bajaj Rex mixie, and when to step up to 750W.",
      offerTitle: "3-jar white listing",
    },
    {
      slug: "preethi-blue-leaf-gold-750w",
      title: "Preethi Blue Leaf Gold 5.0 750W Mixer Grinder",
      brand: "Preethi",
      asin: "B0098ZXJ4C",
      description:
        "A 750W, 3-jar Preethi mixie with a flexi lid (three jars, four capacities). Preethi is known in South Indian kitchens for wet grinding. This is still a mixie: loud, with stainless jars, not a smoothie blender.",
      bestFor: "Cooks who want 750W wet grinding and a longer motor warranty than typical mixies.",
      pros: "750W motor\nFlexi lid gives a fourth capacity without a fourth jar\n5-year motor / 2-year product warranty as listed",
      cons: "Three physical jars, not four\nHeavier and pricier than a basic 500W mixie\nService quality varies by city",
      faq: "What does flexi lid mean?\nThe same jars cover more fill levels. You still get three jars in the box (about 1.7L, 0.75L, 0.5L).\n\nMotor warranty?\nThe Amazon listing states 5-year motor warranty and 2-year product guarantee. Keep the invoice.",
      warranty: "5-year motor warranty and 2-year product guarantee (as listed on Amazon.in)",
      specs: [
        { label: "Wattage", value: "750 W" },
        { label: "Jars", value: "3 (flexi lid, 4 capacities)" },
        { label: "Jar sizes", value: "1.7L, 0.75L, 0.5L chutney" },
        { label: "Jar material", value: "Stainless steel" },
      ],
      scoreBreakdown: [
        { label: "Daily grinding", score: 8.6 },
        { label: "Jar setup", score: 8.3 },
        { label: "Noise / bulk", score: 6.4 },
        { label: "Value", score: 7.8 },
      ],
      ourScore: "8.4",
      featured: true,
      seoTitle: "Preethi Blue Leaf Gold 750W mixer — jars and warranty",
      seoDescription: "Editorial score for Preethi Blue Leaf Gold 5.0, a 750W 3-jar mixie for Indian wet grinding.",
      offerTitle: "Blue Leaf Gold 5.0 listing",
    },
    {
      slug: "philips-hd9252-air-fryer",
      title: "Philips HD9252/90 Digital Airfryer (4.1L)",
      brand: "Philips",
      asin: "B097RJ867P",
      description:
        "A 4.1L digital basket air fryer with Rapid Air, 7 presets, and 1400W. Useful for frozen snacks, roasted vegetables, and small batches of chicken. It will not replace a full OTG for large baking trays.",
      bestFor: "Households of 2–4 who want a basket air fryer with presets, not the cheapest plastic unit.",
      pros: "4.1L basket and 1400W as listed\n7 presets plus keep-warm\nDishwasher-safe parts called out on the listing",
      cons: "Priced above budget 4L fryers\nBasket size is still small for a big family\nYou still need oil for some Indian snacks",
      faq: "Can it replace an OTG?\nFor fries, tikki, and small roasts, often yes. For large cakes and multiple trays, no.\n\nWattage?\n1400W on the Amazon listing.",
      warranty: "2-year worldwide warranty (as listed on Amazon.in)",
      specs: [
        { label: "Capacity", value: "4.1 L" },
        { label: "Power", value: "1400 W" },
        { label: "Presets", value: "7 + keep warm" },
        { label: "Controls", value: "Digital touch panel" },
      ],
      scoreBreakdown: [
        { label: "Cooking evenness", score: 8.7 },
        { label: "Capacity", score: 7.6 },
        { label: "Ease of cleaning", score: 8.2 },
        { label: "Value", score: 7.4 },
      ],
      ourScore: "8.3",
      featured: true,
      seoTitle: "Philips HD9252 air fryer review — 4.1L for Indian snacks",
      seoDescription: "Who the Philips HD9252/90 4.1L air fryer is for, versus a cheaper 4.2L basket.",
      offerTitle: "HD9252/90 4.1L listing",
    },
    {
      slug: "pigeon-healthifry-4-2l-air-fryer",
      title: "Pigeon Healthifry Digital Air Fryer (4.2L)",
      brand: "Pigeon",
      asin: "B0B8XNPQPN",
      description:
        "A 4.2L, 1200W digital basket air fryer. Capacity is similar to mid-range 4L units; power is lower than the Philips 1400W listing. Treat it as a budget basket for snacks, not a heavy daily oven replacement.",
      bestFor: "Buyers who want a 4L-class air fryer without paying for a premium brand.",
      pros: "4.2L non-stick basket\n1200W with digital controls\n2-year warranty as listed",
      cons: "1200W is slower than 1400W class fryers\nBuild and coating are typical of the budget band\nCustomer ratings on Amazon are mixed",
      faq: "Is 4.2L enough?\nFor 2–3 people, usually. For a joint family dinner, you will batch.\n\nWarranty?\nThe listing states 2 years. Confirm in the box.",
      warranty: "2-year manufacturer warranty (as listed on Amazon.in)",
      specs: [
        { label: "Capacity", value: "4.2 L" },
        { label: "Power", value: "1200 W" },
        { label: "Controls", value: "Digital" },
        { label: "Basket", value: "Non-stick" },
      ],
      scoreBreakdown: [
        { label: "Cooking evenness", score: 7.2 },
        { label: "Capacity", score: 7.8 },
        { label: "Ease of cleaning", score: 7.0 },
        { label: "Value", score: 8.5 },
      ],
      ourScore: "7.5",
      seoTitle: "Pigeon Healthifry 4.2L air fryer — budget 4L basket",
      seoDescription: "When a 1200W Pigeon Healthifry makes sense versus a 1400W Philips basket.",
      offerTitle: "Healthifry 4.2L listing",
    },
    {
      slug: "prestige-pic-20-induction-cooktop",
      title: "Prestige PIC 20 1600W Induction Cooktop",
      brand: "Prestige",
      asin: "B00YMJ0OI8",
      description:
        "A portable 1600W induction with push-button controls and Indian menu presets (pressure cook, dosa, curry, and similar). Use only induction-compatible steel/iron cookware. The glass top needs a flat, dry pan.",
      bestFor: "Renters and small kitchens that need one extra burner with Indian presets.",
      pros: "1600W with Indian presets listed\nPush buttons (easier with wet hands than some touch panels)\n1-year warranty and BIS mention on the listing",
      cons: "Single zone — not a replacement for a 2-burner stove\nNeeds induction-ready cookware\nFan noise while running",
      faq: "Will my aluminium kadai work?\nUsually no. The pan must be magnetic. Test with a magnet on the base.\n\nPresets?\nThe listing describes 8 Indian menu options including dosa/chapati and pressure cook.",
      warranty: "1-year manufacturer warranty (as listed on Amazon.in)",
      specs: [
        { label: "Wattage", value: "1600 W" },
        { label: "Controls", value: "Push button" },
        { label: "Presets", value: "8 Indian menu options" },
        { label: "Zones", value: "1" },
      ],
      scoreBreakdown: [
        { label: "Heat control", score: 7.8 },
        { label: "Indian presets", score: 8.2 },
        { label: "Build", score: 7.4 },
        { label: "Value", score: 8.0 },
      ],
      ourScore: "7.9",
      featured: true,
      seoTitle: "Prestige PIC 20 induction review — 1600W for Indian cooking",
      seoDescription: "Push-button Prestige PIC 20 1600W induction: presets, cookware, and who should skip it.",
      offerTitle: "PIC 20 1600W listing",
    },
    {
      slug: "pigeon-favourite-1800w-induction",
      title: "Pigeon Favourite 1800W Induction Cooktop",
      brand: "Pigeon",
      asin: "B012VFOQDI",
      description:
        "An 1800W portable induction with a crystal glass top. Higher wattage than the Prestige PIC 20 1600W listing, so boils can be quicker if your wiring and cookware keep up. Still one zone, still induction-only pans.",
      bestFor: "People who want more wattage than 1600W on a single portable plate.",
      pros: "1800W as listed\nCrystal glass portable plate\nCommon spare-parts brand in India",
      cons: "Confirm current preset list on the live Amazon page\nInduction cookware required\n1-year warranty class for this model line",
      faq: "Is 1800W always faster?\nOn paper yes. On a weak 5A circuit you may trip the MCB. Use a proper 15A socket.\n\nWarranty?\nThis model line is commonly sold with a 1-year warranty. Verify on the listing before you buy.",
      warranty: null,
      specs: [
        { label: "Wattage", value: "1800 W" },
        { label: "Type", value: "Portable induction cooktop" },
        { label: "Top", value: "Crystal glass" },
        { label: "Zones", value: "1" },
      ],
      scoreBreakdown: [
        { label: "Heat control", score: 7.6 },
        { label: "Power headroom", score: 8.4 },
        { label: "Build", score: 7.1 },
        { label: "Value", score: 8.2 },
      ],
      ourScore: "7.7",
      seoTitle: "Pigeon Favourite 1800W induction — when extra wattage helps",
      seoDescription: "1800W Pigeon Favourite vs 1600W Prestige PIC 20 for a single extra burner.",
      offerTitle: "Favourite 1800W listing",
    },
    {
      slug: "prestige-pkoss-15l-kettle",
      title: "Prestige PKOSS 1.5L Electric Kettle",
      brand: "Prestige",
      asin: "B00YD54UIC",
      description:
        "A 1.5L stainless-steel kettle in the common 1500W class for tea, instant noodles, and boiling water. Automatic cut-off and a 360° base are the features to look for on the live listing. Descale if your water is hard.",
      bestFor: "Office desks and small kitchens that boil water several times a day.",
      pros: "1.5L stainless body in a widely sold PKOSS line\n1500W-class boil for tea and Maggi\nAutomatic cut-off on typical PKOSS listings",
      cons: "Not a temperature-controlled pour-over kettle\nScale build-up in hard water\nConfirm wattage and warranty on the current Amazon page",
      faq: "Can I boil milk?\nMost dry-boil kettles are meant for water. Milk scorching is common. Use a saucepan.\n\nCapacity?\n1.5 litres on this PKOSS listing.",
      warranty: "1-year manufacturer warranty (typical PKOSS listing; confirm on Amazon)",
      specs: [
        { label: "Capacity", value: "1.5 L" },
        { label: "Wattage", value: "1500 W" },
        { label: "Body", value: "Stainless steel" },
      ],
      scoreBreakdown: [
        { label: "Boil speed", score: 8.0 },
        { label: "Ease of use", score: 8.3 },
        { label: "Durability", score: 7.2 },
        { label: "Value", score: 8.1 },
      ],
      ourScore: "7.8",
      seoTitle: "Prestige PKOSS 1.5L kettle — for tea and instant meals",
      seoDescription: "Editorial notes on the Prestige PKOSS 1.5L kettle for Indian home and office use.",
      offerTitle: "PKOSS 1.5L listing",
    },
    {
      slug: "philips-hr2533-hand-blender",
      title: "Philips Daily Collection Hand Blender HR2533",
      brand: "Philips",
      asin: "B07DJ5B3X8",
      description:
        "A stick blender for dal tadka smoothness, milkshakes, and small soups — not for dry masala or idli batter. Confirm the live Amazon title still matches HR2533 before you rely on accessory counts (whisk/chopper vary by SKU).",
      bestFor: "People who already own a mixie and want a stick blender for wet blending in a pot.",
      pros: "Stick blender for wet blending in the same pot\nPhilips Daily Collection motor class\nEasier to wash than a full jar mixie",
      cons: "Will not replace a mixer grinder for chutney and dry spices\nAccessory packs differ by ASIN\nConfirm wattage on the live listing",
      faq: "Can this grind masala?\nNo. Use a mixer grinder for dry spices and coconut chutney.\n\nWarranty?\nPhilips Daily Collection hand blenders are often sold with a 2-year guarantee. Verify on the listing.",
      warranty: null,
      specs: [
        { label: "Type", value: "Hand blender" },
        { label: "Series", value: "Philips Daily Collection HR2533" },
      ],
      scoreBreakdown: [
        { label: "Wet blending", score: 8.0 },
        { label: "Replacing a mixie", score: 3.5 },
        { label: "Cleanup", score: 8.4 },
        { label: "Value", score: 7.5 },
      ],
      ourScore: "7.4",
      seoTitle: "Philips HR2533 hand blender — mixie vs stick blender",
      seoDescription: "When a Philips stick blender helps in an Indian kitchen, and when you still need a mixie.",
      offerTitle: "HR2533 listing",
    },
    {
      slug: "prestige-pgmfb-sandwich-toaster",
      title: "Prestige PGMFB 800 Watt Grill Sandwich Toaster with Fixed Grill Plates, Black",
      brand: "Prestige",
      asin: "B00935MGKK",
      description:
        "An 800W fixed-plate grill sandwich toaster with non-stick plates. It makes two toasted sandwiches. It is not a toaster oven and not a grill for large batches of vegetables.",
      features:
        "POWERFUL 800W PERFORMANCE: Equipped with an 800-watt heating element that ensures grilling giving you perfectly crisp sandwiches in minutes.\nNON-STICK GRILL PLATES: Durable die-cast non-stick heating plates allow easy release of food, require minimal oil for healthier sandwiches, and make cleaning effortless after every use.\nHEAT-RESISTANT BAKELITE BODY: Elegant black finish body made from high-quality heat-resistant Bakelite ensures safe handling even during high-temperature operation, while adding a sleek look to your kitchen.\nAUTO CUT-OFF FEATURE: Automatically switches off when the food is cooked, preventing overheating and ensuring energy efficiency for safe, worry-free usage.\nPOWER & READY INDICATOR LIGHTS: Convenient indicator lights show when the device is powered on and when it’s ready to cook, ensuring precise timing for perfect grilling.\nERGONOMIC HANDLE & EASY STORAGE: Cool-touch ergonomic handle provides a firm grip while operating; compact design makes it easy to store vertically or horizontally.\nEASY TO CLEAN: Smooth non-stick plates and sleek body design enable quick cleaning with minimal effort after each use.\nWARRANTY & CERTIFICATION: Comes with a 1-year manufacturer warranty for reliable performance; ISI certified for quality, durability, and safety compliance.",
      bestFor: "Breakfast sandwiches for 1–2 people who want a cheap dedicated toaster.",
      pros: "800W with non-stick grill plates\n1-year warranty and ISI mention on the listing\nSmall footprint",
      cons: "Fixed plates — you cannot swap waffle plates on this model\nEasy to overfill and leak filling\nNot for a large family breakfast rush",
      faq: "Oil needed?\nThe listing highlights non-stick plates. A light brush of oil still helps some breads.\n\nWarranty?\n1-year manufacturer warranty as listed.\n\nDoes it have interchangeable plates?\nNo. PGMFB has fixed grill plates.\n\nHow many sandwiches at a time?\nTwo slices, as listed. It is for 1–2 people, not a family breakfast rush.",
      warranty: "1-year manufacturer warranty (Customer care: 080-46824000)",
      specs: [
        { label: "Model", value: "PGMFB" },
        { label: "Wattage", value: "800 W" },
        { label: "Voltage", value: "230 V" },
        { label: "Slice capacity", value: "2" },
        { label: "Plates", value: "Fixed die-cast non-stick grill" },
        { label: "Body", value: "Heat-resistant Bakelite" },
        { label: "Colour", value: "Black" },
        { label: "Material", value: "Aluminium" },
        { label: "Special feature", value: "Non-stick coating" },
        { label: "Dimensions", value: "9.4 × 10.6 × 11.8 cm" },
        { label: "Item weight", value: "1.19 kg" },
        { label: "Included", value: "Sandwich maker" },
        { label: "Country of origin", value: "India" },
        { label: "Manufacturer", value: "TTK Prestige Pvt Ltd" },
        { label: "Part number", value: "41467" },
        { label: "ASIN", value: "B00935MGKK" },
      ],
      scoreBreakdown: [
        { label: "Toast quality", score: 7.6 },
        { label: "Cleanup", score: 7.3 },
        { label: "Flexibility", score: 5.5 },
        { label: "Value", score: 8.2 },
      ],
      ourScore: "7.3",
      seoTitle: "Prestige PGMFB sandwich toaster — 800W fixed plates",
      seoDescription: "What the Prestige PGMFB 800W sandwich toaster is good for, and what it cannot replace.",
      offerTitle: "PGMFB 800W listing",
    },
  ];

  const editorial: Record<string, { modelNumber: string; whoShouldAvoid: string }> = {
    "prestige-iris-750w-mixer-grinder": {
      modelNumber: "Iris 750W 4 Jar",
      whoShouldAvoid: "Skip this if you need a quiet smoothie blender or a stone wet grinder for large dosa batter batches.",
    },
    "bajaj-rex-500w-mixer-grinder": {
      modelNumber: "Rex 500W 3 Jar",
      whoShouldAvoid: "Not for daily dry masala grinding in large loads — 500W is for light chutney and small wet batches.",
    },
    "preethi-blue-leaf-gold-750w": {
      modelNumber: "Blue Leaf Gold 5.0",
      whoShouldAvoid: "Avoid if you want four physical jars or a silent blender; this is still a loud 3-jar mixie.",
    },
    "philips-hd9252-air-fryer": {
      modelNumber: "HD9252/90",
      whoShouldAvoid: "Too small as a full OTG replacement for large baking trays or a joint-family dinner in one batch.",
    },
    "pigeon-healthifry-4-2l-air-fryer": {
      modelNumber: "Healthifry 4.2L",
      whoShouldAvoid: "Skip if you cook daily at 1400W-class speed; 1200W is slower and the coating is budget-grade.",
    },
    "prestige-pic-20-induction-cooktop": {
      modelNumber: "PIC 20",
      whoShouldAvoid: "Will not heat aluminium or non-magnetic cookware, and it is not a replacement for a 2-burner stove.",
    },
    "pigeon-favourite-1800w-induction": {
      modelNumber: "Favourite 1800W",
      whoShouldAvoid: "Needs a circuit that can take 1800W and induction-ready pans; still one zone only.",
    },
    "prestige-pkoss-15l-kettle": {
      modelNumber: "PKOSS 1.5L",
      whoShouldAvoid: "Not for large family tea rounds or milk that can boil over; 1.5L water-only use is the fit.",
    },
    "philips-hr2533-hand-blender": {
      modelNumber: "HR2533",
      whoShouldAvoid: "Cannot replace a mixie for dry spices or chutney; it is a stick blender for wet pots.",
    },
    "prestige-pgmfb-sandwich-toaster": {
      modelNumber: "PGMFB",
      whoShouldAvoid: "Fixed plates cannot grill paneer tikka or toast a family loaf; it is a two-slice sandwich toaster.",
    },
  };

  // Current MANUAL street-price observations for V1 tagged /go links. Not price history.
  const seedPrices: Record<string, number> = {
    B08CFJBZRK: 4299,
    B00HVXS7WC: 2199,
    B0098ZXJ4C: 5499,
    B097RJ867P: 7999,
    B0B8XNPQPN: 4499,
    B00YMJ0OI8: 2499,
    B012VFOQDI: 1899,
    B00YD54UIC: 899,
    B07DJ5B3X8: 1799,
    B00935MGKK: 1099,
  };

  const productIds = new Map<string, string>();
  const observedAt = new Date();

  for (const item of products) {
    const record = await prisma.product.create({
      data: {
        slug: item.slug,
        title: item.title,
        brand: item.brand,
        modelNumber: editorial[item.slug]?.modelNumber,
        whoShouldAvoid: editorial[item.slug]?.whoShouldAvoid,
        description: item.description,
        bestFor: item.bestFor,
        pros: item.pros,
        cons: item.cons,
        faq: item.faq,
        features: "features" in item ? item.features : undefined,
        warranty: item.warranty,
        specs: item.specs,
        scoreBreakdown: item.scoreBreakdown,
        imageUrl: amazonImage(item.asin),
        images: [amazonImage(item.asin)],
        ourScore: item.ourScore,
        currency: "INR",
        source: "AMAZON",
        sourceId: item.asin,
        featured: Boolean(item.featured),
        isActive: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId: kitchen.id,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        identifiers: {
          create: {
            type: "ASIN",
            value: item.asin,
            merchantId: amazon.id,
          },
        },
        offers: {
          create: {
            merchantId: amazon.id,
            title: item.offerTitle,
            currency: "INR",
            price: seedPrices[item.asin],
            affiliateUrl: amazonUrl(item.asin),
            productUrl: amazonUrl(item.asin),
            externalId: item.asin,
            inStock: true,
            isPrimary: true,
            availability: "IN_STOCK",
            lastCheckedAt: observedAt,
            nextFetchAt: observedAt,
            fetchStatus: "NEVER",
          },
        },
      },
    });
    productIds.set(item.slug, record.id);
  }

  async function seedBestOf(input) {
    const guide = await prisma.guide.create({
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        kind: "BEST_OF",
        published: true,
        methodology: input.methodology,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        categoryId: kitchen.id,
        body: input.body,
      },
    });
    await prisma.guideProduct.createMany({
      data: input.items.map((row) => ({
        guideId: guide.id,
        productId: productIds.get(row.slug)!,
        rank: row.rank,
        badge: row.badge,
        notes: row.notes,
      })),
    });
  }

  await seedBestOf({
    slug: "best-mixer-grinders-in-india",
    title: "Best Mixer Grinders in India",
    excerpt: "750W vs 500W, jar count, and which mixie to buy for chutney and masala — not a silent blender.",
    seoTitle: "Best mixer grinders in India (2026)",
    seoDescription: "Editorial ranking of mixer grinders for Indian kitchens: 500W vs 750W, jars, and honest downsides.",
    methodology: "We rank for Indian wet grinding (chutney, masala), jar setup, and warranty as listed. Rankings are editorial, not paid placements or lab tests.",
    body: `These are editorial picks for a home mixie, not a commercial wet grinder.

## How we ranked

Wattage, jar count, and warranty as listed by the seller. We did not run noise or RPM lab tests. A mixie will be loud.

## Best overall

Preethi Blue Leaf Gold if you wet-grind often and want the longer motor warranty. Prestige Iris if you want a fourth juicer jar.

## Skip if

You actually want a stick blender for dal and shakes. That is a different tool.`,
    items: [
      { slug: "preethi-blue-leaf-gold-750w", rank: 1, badge: "BEST_OVERALL", notes: "750W with a longer motor warranty for wet grinding." },
      { slug: "prestige-iris-750w-mixer-grinder", rank: 2, badge: "BEST_PREMIUM", notes: "4-jar setup including a juicer jar." },
      { slug: "bajaj-rex-500w-mixer-grinder", rank: 3, badge: "BEST_BUDGET", notes: "500W 3-jar mixie for light loads." },
    ],
  });

  await seedBestOf({
    slug: "best-mixer-grinders-under-5000",
    title: "Best Mixer Grinders Under ₹5,000",
    excerpt: "What to buy when the budget is under five thousand: 500W vs 750W, and which jars actually matter.",
    seoTitle: "Best mixer grinders under ₹5,000 (India)",
    seoDescription: "Editorial guide to mixer grinders in the under-₹5,000 band for Indian chutney and masala.",
    methodology: "We look at wattage and jars, not live Amazon sale prices. Confirm the current price on Amazon; sale prices move.",
    body: `Under ₹5,000 you are choosing a home mixie, not a silent blender.

Prices on Amazon move every week. Use **Check price on Amazon** rather than treating any figure on this page as a live deal.

## 500W vs 750W

500W is fine for chutney in small batches. 750W is less painful for dry masala and coconut if you cook every day.

## Our pick in this band

Prestige Iris or Preethi Blue Leaf Gold when they sit under ₹5,000 on Amazon. Bajaj Rex if you only need light loads and the lowest listing.`,
    items: [
      { slug: "prestige-iris-750w-mixer-grinder", rank: 1, badge: "BEST_OVERALL", notes: "Buy when the 4-jar 750W listing is under ₹5,000." },
      { slug: "bajaj-rex-500w-mixer-grinder", rank: 2, badge: "BEST_BUDGET", notes: "Light grinding only." },
      { slug: "preethi-blue-leaf-gold-750w", rank: 3, badge: "RELATED", notes: "Often sits near the top of this budget — confirm live price." },
    ],
  });

  await seedBestOf({
    slug: "best-air-fryers-under-8000",
    title: "Best Air Fryers Under ₹8,000",
    excerpt: "4L-class baskets for Indian snacks: 1200W budget vs 1400W Philips, and what an air fryer cannot do.",
    seoTitle: "Best air fryers under ₹8,000 in India",
    seoDescription: "Philips HD9252 vs Pigeon Healthifry for Indian kitchens under ₹8,000.",
    methodology: "Capacity and listed wattage. We did not cook every frozen snack. Rankings are editorial.",
    body: `A 4L basket is for 2–4 people. It will not roast a large chicken the way a big OTG can.

## Philips vs Pigeon

Philips HD9252 lists 1400W and 4.1L with more presets. Pigeon Healthifry lists 1200W and 4.2L at a lower typical street price. Pay extra for Philips if you will use it most days; pick Pigeon if you want to try air-frying without a premium brand.

Confirm live prices — both move in and out of ₹8,000.`,
    items: [
      { slug: "philips-hd9252-air-fryer", rank: 1, badge: "BEST_OVERALL", notes: "4.1L, 1400W, digital presets." },
      { slug: "pigeon-healthifry-4-2l-air-fryer", rank: 2, badge: "BEST_BUDGET", notes: "4.2L, 1200W budget basket." },
    ],
  });

  await seedBestOf({
    slug: "best-induction-cooktops-for-indian-cooking",
    title: "Best Induction Cooktops for Indian Cooking",
    excerpt: "1600W vs 1800W portable plates, Indian presets, and the cookware you actually need.",
    seoTitle: "Best induction cooktops for Indian cooking",
    seoDescription: "Prestige PIC 20 vs Pigeon Favourite 1800W for dosa, curry, and a single extra burner.",
    methodology: "Listed wattage, control type, and Indian-use fit. Not a thermal lab test.",
    body: `These are single-zone portable plates. They do not replace a 2-burner gas stove.

Use a 15A socket. Cheap extension cords are how these units fail.

## Prestige PIC 20

Push buttons and Indian presets (dosa, curry, pressure-cook style menus as listed). 1600W.

## Pigeon Favourite

1800W on paper. Confirm presets on the live listing. Better if you boil large kadhais of water often and your wiring can take it.`,
    items: [
      { slug: "prestige-pic-20-induction-cooktop", rank: 1, badge: "BEST_OVERALL", notes: "Indian presets and push buttons." },
      { slug: "pigeon-favourite-1800w-induction", rank: 2, badge: "BEST_PREMIUM", notes: "1800W headroom if your circuit allows it." },
    ],
  });

  await seedBestOf({
    slug: "best-electric-kettles-for-home",
    title: "Best Electric Kettles for Home",
    excerpt: "1.5L stainless kettles for tea and Maggi — and what not to boil in them.",
    seoTitle: "Best electric kettles for Indian homes",
    seoDescription: "How to choose a 1.5L kettle like the Prestige PKOSS, and why milk does not belong in it.",
    methodology: "Capacity and typical 1500W-class boil. Live price is on Amazon.",
    body: `A kettle is for water. Milk burns. Tea bags and Maggi water are the real use case.

Look for automatic cut-off and a 360° base on the live listing. Descale if you live with hard water.

Our current example is the Prestige PKOSS 1.5L line. Check the Amazon title still matches before you buy.`,
    items: [{ slug: "prestige-pkoss-15l-kettle", rank: 1, badge: "BEST_OVERALL", notes: "1.5L stainless PKOSS class kettle." }],
  });

  await seedBestOf({
    slug: "best-hand-blenders-for-indian-kitchens",
    title: "Best Hand Blenders for Indian Kitchens",
    excerpt: "A stick blender is for dal and shakes. It does not replace a mixer grinder.",
    seoTitle: "Best hand blenders for Indian kitchens",
    seoDescription: "When to buy a Philips stick blender instead of another mixie jar.",
    methodology: "Use-case fit for Indian kitchens. Accessory lists change by ASIN — confirm on Amazon.",
    body: `If you need coconut chutney and dry masala, buy a mixer grinder. A hand blender is the second tool: dal, soup, milkshake, baby food.

Confirm the live listing still matches the HR2533 title and what is in the box (beaker, whisk, chopper vary).`,
    items: [{ slug: "philips-hr2533-hand-blender", rank: 1, badge: "BEST_OVERALL", notes: "Stick blender for wet blending in a pot." }],
  });

  async function seedComparison(input) {
    const comparison = await prisma.comparison.create({
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        published: true,
        methodology: input.methodology,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        body: input.body,
        winnerProductId: input.winnerSlug ? productIds.get(input.winnerSlug) : undefined,
      },
    });
    await prisma.comparisonItem.createMany({
      data: input.items.map((row) => ({
        comparisonId: comparison.id,
        productId: productIds.get(row.slug)!,
        sortOrder: row.sortOrder,
        notes: row.notes,
      })),
    });
  }

  await seedComparison({
    slug: "750w-vs-1000w-mixer-grinder",
    title: "750W vs 1000W Mixer Grinder",
    excerpt: "For home chutney and masala, 750W is usually enough. 1000W is for heavier loads — and more noise.",
    seoTitle: "750W vs 1000W mixer grinder for Indian homes",
    seoDescription: "Whether a 1000W mixie is worth it versus a 750W Prestige or Preethi for daily grinding.",
    methodology: "Wattage as a proxy for load, not a lab RPM test. We currently list 500W and 750W models.",
    winnerSlug: "preethi-blue-leaf-gold-750w",
    body: `Most Indian homes do not need 1000W. That class is louder, heavier, and costs more.

We list 500W (Bajaj Rex) and 750W (Prestige Iris, Preethi Blue Leaf Gold). If you cook for a large joint family every day and grind wet batter often, look at 1000W on Amazon and compare warranty. For 2–4 people, 750W is the sensible ceiling.

## Verdict

Stay at 750W unless you already know you stall a 750W motor.`,
    items: [
      { slug: "preethi-blue-leaf-gold-750w", sortOrder: 0, notes: "750W reference for daily wet grinding." },
      { slug: "prestige-iris-750w-mixer-grinder", sortOrder: 1, notes: "Same wattage class, extra juicer jar." },
      { slug: "bajaj-rex-500w-mixer-grinder", sortOrder: 2, notes: "500W — below this comparison, shown for contrast." },
    ],
  });

  await seedComparison({
    slug: "mixer-grinder-vs-blender",
    title: "Mixer Grinder vs Blender",
    excerpt: "A mixie grinds masala. A stick blender smooths dal. Buying one instead of the other is the usual mistake.",
    seoTitle: "Mixer grinder vs blender in an Indian kitchen",
    seoDescription: "Mixie vs hand blender: chutney and masala versus dal and shakes.",
    methodology: "Job-to-be-done, not a shoot-out of every SKU.",
    winnerSlug: "prestige-iris-750w-mixer-grinder",
    body: `If you make coconut chutney or dry spices, you need a mixer grinder with jars and a clutch. A hand blender cannot do that job safely or well.

If you only smooth cooked dal, soups, and shakes, a stick blender is easier to wash.

## Verdict

First mixie, then blender — not the other way around.`,
    items: [
      { slug: "prestige-iris-750w-mixer-grinder", sortOrder: 0, notes: "Mixie for chutney and masala." },
      { slug: "philips-hr2533-hand-blender", sortOrder: 1, notes: "Stick blender for wet blending." },
    ],
  });

  await seedComparison({
    slug: "air-fryer-vs-otg-for-a-small-kitchen",
    title: "Air Fryer vs OTG for a Small Kitchen",
    excerpt: "A 4L air fryer wins for snacks. An OTG still wins for large baking trays. Most small kitchens should not buy both on day one.",
    seoTitle: "Air fryer vs OTG for a small Indian kitchen",
    seoDescription: "When a 4L air fryer is enough, and when you still want an OTG.",
    methodology: "Use-case comparison. We list air fryers only in V1; OTG is explained, not sold here yet.",
    winnerSlug: "philips-hd9252-air-fryer",
    body: `We do not currently list an OTG. The comparison is still worth making.

## Air fryer

Faster preheat, smaller footprint, good for frozen fries, tikki, and small protein. 4L means batches.

## OTG

Larger trays, baking, toasting many slices. Bigger, slower, hotter kitchen.

## Verdict

If counter space is tight and you mostly make snacks, start with an air fryer. Add an OTG later if you bake.`,
    items: [
      { slug: "philips-hd9252-air-fryer", sortOrder: 0, notes: "4.1L basket, 1400W." },
      { slug: "pigeon-healthifry-4-2l-air-fryer", sortOrder: 1, notes: "Budget 4.2L basket." },
    ],
  });

  await seedComparison({
    slug: "2-jar-vs-3-jar-mixer-grinder",
    title: "2-Jar vs 3-Jar Mixer Grinder",
    excerpt: "A chutney jar is the third jar you will miss. Two-jar sets look cheaper and get annoying fast.",
    seoTitle: "2-jar vs 3-jar mixer grinder",
    seoDescription: "Why a 3-jar mixie is the default for Indian kitchens, with 4-jar Prestige as extra.",
    methodology: "Jar jobs: wet, dry, chutney. Editorial.",
    winnerSlug: "bajaj-rex-500w-mixer-grinder",
    body: `Wet jar, dry jar, chutney jar. That is the 3-jar default.

A 2-jar set usually skips a dedicated chutney jar. You will wash more.

A 4-jar set (Prestige Iris on our list) adds a juicer you may never use.

## Verdict

Three jars is the floor. Four only if you will juice.`,
    items: [
      { slug: "bajaj-rex-500w-mixer-grinder", sortOrder: 0, notes: "Classic 3-jar layout." },
      { slug: "preethi-blue-leaf-gold-750w", sortOrder: 1, notes: "3 jars with flexi lid capacities." },
      { slug: "prestige-iris-750w-mixer-grinder", sortOrder: 2, notes: "4 jars if you want the juicer." },
    ],
  });

  await seedComparison({
    slug: "stainless-steel-jar-vs-plastic-jar",
    title: "Stainless Steel Jar vs Plastic Jar",
    excerpt: "Indian mixies use stainless jars for a reason. Plastic blender jars are a different product.",
    seoTitle: "Stainless steel vs plastic mixer jars",
    seoDescription: "Why mixie jars are steel, and when plastic blender jars are fine.",
    methodology: "Material vs job. Our listed mixies use stainless jars as specified by the seller.",
    winnerSlug: "preethi-blue-leaf-gold-750w",
    body: `Dry masala and hot dal do not belong in a thin plastic blender jar. Mixies ship with stainless jars for heat and abrasion.

Plastic jars show up on smoothie blenders. Those are fine for cold drinks, not for a tadka-hot grind.

All three mixies we list use stainless-steel main jars.

## Verdict

For a mixie, steel. For a cold blender, plastic is acceptable.`,
    items: [
      { slug: "preethi-blue-leaf-gold-750w", sortOrder: 0, notes: "Stainless jars, wet-grind focus." },
      { slug: "prestige-iris-750w-mixer-grinder", sortOrder: 1, notes: "Stainless main jars plus juicer jar." },
      { slug: "bajaj-rex-500w-mixer-grinder", sortOrder: 2, notes: "Three stainless jars as listed." },
    ],
  });
}

seed()
  .then(async () => {
    console.log("Seeded Kitchen Appliances catalog, best-of guides, and comparisons");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
