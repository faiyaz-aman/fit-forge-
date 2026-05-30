const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

// Self-sufficient environment loader for CLI execution
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL is missing in environment variables. Check your .env file!");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Dynamic mock cards fallback (including user's custom template and original tips upgraded)
const fallbackTips = [
  {
    id: "muscle-growth-mechanisms-beginner",
    category: "Training Science",
    subcategory: "Muscle growth mechanisms",
    tier: "beginner",
    tags: ["hypertrophy", "muscle growth", "mechanisms", "training", "beginner", "Chest", "Quads"],
    title: "How Muscles Actually Grow: The Basics",
    hook: "Your muscles don't grow during your workout — they grow because of it, and understanding this distinction changes everything.",
    summary: "Muscle growth (hypertrophy) is triggered by training stress and completed during recovery. Three mechanisms drive it: mechanical tension, metabolic stress, and muscle damage — and mechanical tension is king.",
    whatIsIt: "Muscle hypertrophy is the increase in the cross-sectional size of individual muscle fibers. When you lift weights, you create a biological stress signal that tells your body to rebuild those fibers bigger and stronger so they can handle that load in the future. This is not fat turning into muscle — it's the literal enlargement of the contractile proteins inside each fiber.",
    whyItMatters: "If you understand what triggers growth, you stop wasting time on methods that don't work and start training with intention. Most beginners train randomly, hoping soreness or sweat means progress. Knowing the three mechanisms lets you evaluate every exercise choice against what actually builds muscle.",
    howItWorks: "Three overlapping mechanisms drive hypertrophy: (1) Mechanical tension — the primary driver. When a muscle contracts against a load, especially at its lengthened (stretched) position, it activates the mTOR signaling pathway, which initiates muscle protein synthesis. (2) Metabolic stress — secondary driver. High-rep work causes buildup of metabolites (lactate, hydrogen ions, inorganic phosphate) that create a hormonal environment favorable to growth. (3) Muscle damage — least important driver. Eccentric contractions cause micro-tears in myofibrils; chasing soreness leads to prolonged recovery without added benefit.",
    howToApply: {
      beginner: "Do 3 sets of 8–12 reps of compound exercises (squat, hinge, press, row) 2–3x per week per muscle group. Control the lowering phase for 2 seconds. Use weights that make the last 2–3 reps genuinely hard.",
      intermediate: "Prioritize exercises that load muscles at long lengths (e.g. Romanian deadlifts over leg curls). Full range of motion is non-negotiable. Add 2–5% load every 1–2 weeks.",
      advanced: "Periodize blocks: tension-dominant phases (4–8 rep heavy compounds, 3–4 min rest) and metabolic-stress phases (10–20 reps, shorter rest, more volume)."
    },
    commonMistakes: [
      "Chasing soreness as a proxy for progress: DOMS reflects muscle damage (the least important mechanism).",
      "Rushing the eccentric (lowering) phase: Dropping the weight quickly eliminates the primary mechanical tension signal.",
      "Only training for 'the pump': Metabolic stress matters, but relying solely on high-rep sets without heavy loads produces suboptimal results."
    ],
    mythVsReality: {
      myth: "If you feel the burn and get a pump, your workout worked. If you don't, it didn't.",
      reality: "Mechanical tension from heavy compound lifts can drive significant hypertrophy with minimal burn or pump.",
      whyPeopleBelieveIt: "The burn and pump are immediate, visceral feedback signals. The discomfort feels productive, but it is an unreliable proxy."
    },
    example: "Alex, a beginner, does 3x10 squats at 80kg with a 3-second lowering phase (Workout A). Bill does 4x25 goblet squats at 20kg for a pump (Workout B). Workout A delivers far greater mechanical tension and results.",
    visualConcept: "Venn diagram: 'Mechanical Tension' (largest), 'Metabolic Stress' (medium), 'Muscle Damage' (smallest). Overlap zone = Maximum Hypertrophy.",
    relatedCards: ["progressive-overload-beginner", "training-to-failure-vs-rir"],
    keyTakeaway: "Mechanical tension — moving challenging weight through full range of motion with control — is the primary driver of muscle growth; everything else is secondary.",
    author: "Brad Schoenfeld, PhD",
    references: [
      "Schoenfeld BJ, Journal of Strength and Conditioning Research, 2010",
      "Schoenfeld BJ, Science and Development of Muscle Hypertrophy, Human Kinetics, 2020"
    ],
    evidenceLevel: "strong"
  },
  {
    id: "leucine-trigger-protein-distribution",
    category: "Nutrition Science",
    subcategory: "Anabolic protein spacing",
    tier: "beginner",
    tags: ["Protein", "Nutrition", "Diet", "Bulk", "Satiety"],
    title: "The Leucine Trigger & Protein Spacing",
    hook: "Consuming one single huge protein meal is less anabolic than spacing protein intake every 3 to 4 hours.",
    summary: "Muscle protein synthesis (MPS) is maximized when a meal contains sufficient essential amino acids—specifically Leucine (approx. 3g)—to cross the 'Leucine Trigger' threshold.",
    whatIsIt: "Leucine is the key amino acid that acts as a chemical switch to trigger muscle building via the mTOR pathway.",
    whyItMatters: "Spacing protein intake prevents catabolic muscle breakdown and keeps muscle protein synthesis optimized during high training load cycles.",
    howItWorks: "Reaching the Leucine Trigger initiates the mTORC1 pathway, turning on cellular machinery for muscle repair.",
    howToApply: {
      beginner: "Target 30g to 40g of high-quality protein (Whey, Chicken, Eggs) every 3-4 hours.",
      intermediate: "Calculate protein needs exactly: 0.4g/kg of bodyweight per meal across 4 daily meals.",
      advanced: "Optimize pre and post workout protein timing, consuming 40g of slow-digesting protein before sleep."
    },
    commonMistakes: [
      "Eating all protein in a single massive dinner.",
      "Allowing fasting windows to exceed 5 hours during training cycles."
    ],
    mythVsReality: {
      myth: "The human body can only absorb 30g of protein per meal.",
      reality: "Your body absorbs all of it, but muscle protein synthesis caps out around 40g per meal; the rest is used for general energy.",
      whyPeopleBelieveIt: "Early studies showed protein oxidation rates increase beyond 30g, but total anabolic response is still supported."
    },
    example: "Consuming 120g of protein in one meal at night triggers MPS once. Consuming 40g three times across the day triggers MPS three times.",
    visualConcept: "Spikes chart showing protein synthesis triggering three times vs. once.",
    relatedCards: ["nutrition-fundamentals", "pre-workout-protocols"],
    keyTakeaway: "Target 30g to 45g of protein every 3-4 hours to cross the Leucine Trigger and keep anabolic repair pathways active.",
    author: "Dr. Mike Israetel",
    references: [
      "Morton et al., British Journal of Sports Medicine, 2018",
      "Israetel, Scientific Principles of Strength Training, 2019"
    ],
    evidenceLevel: "strong"
  }
];

async function runSafeMigrations() {
  console.log("🛠️ Running safe, non-destructive PostgreSQL migrations on Supabase...");
  
  // Safe Create Table Query mapping the new model
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "Tip" (
      "id" text NOT NULL,
      "category" text NOT NULL,
      "subcategory" text NOT NULL DEFAULT '',
      "tier" text NOT NULL DEFAULT 'beginner',
      "tags" text[] DEFAULT ARRAY[]::text[],
      "title" text NOT NULL DEFAULT '',
      "hook" text NOT NULL DEFAULT '',
      "summary" text NOT NULL DEFAULT '',
      "whatIsIt" text NOT NULL DEFAULT '',
      "whyItMatters" text NOT NULL DEFAULT '',
      "howItWorks" text NOT NULL DEFAULT '',
      "howToApply" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "commonMistakes" text[] DEFAULT ARRAY[]::text[],
      "mythVsReality" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "example" text NOT NULL DEFAULT '',
      "visualConcept" text NOT NULL DEFAULT '',
      "relatedCards" text[] DEFAULT ARRAY[]::text[],
      "keyTakeaway" text NOT NULL DEFAULT '',
      "author" text NOT NULL DEFAULT '',
      "references" text[] DEFAULT ARRAY[]::text[],
      "evidenceLevel" text NOT NULL DEFAULT 'strong',
      CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
    )
  `;

  try {
    await prisma.$executeRawUnsafe(createTableQuery);
    console.log("✅ Tip table created successfully or verified as existing!");
  } catch (e) {
    console.error("❌ Failed to run create table migration:", e.message);
    throw e;
  }
}

async function prewarmRedis(tipsList) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn("⚠️ Upstash credentials missing. Skipping cache pre-warming.");
    return;
  }

  console.log("⚡ Pre-warming Upstash Redis cache...");
  try {
    const res = await fetch(`${redisUrl}/set/scientific_tips:all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}` },
      body: JSON.stringify(tipsList)
    });
    const result = await res.json();
    console.log("✅ Upstash Redis Pre-warming status:", result.result === "OK" ? "SUCCESS" : "FAILED", result);
  } catch (error) {
    console.error("❌ Redis Pre-warming failed:", error);
  }
}

async function main() {
  await runSafeMigrations();

  // Load from scientific_tips.json if it exists at root
  const jsonPath = path.resolve(__dirname, '../scientific_tips.json');
  let tipsToImport = fallbackTips;

  if (fs.existsSync(jsonPath)) {
    console.log("📂 Found 'scientific_tips.json' at project root. Loading cards...");
    try {
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const loaded = JSON.parse(rawData);
      if (Array.isArray(loaded) && loaded.length > 0) {
        tipsToImport = loaded;
        console.log(`📊 Successfully parsed ${loaded.length} cards from JSON file.`);
      } else {
        console.warn("⚠️ JSON file is empty or not an array. Falling back to default mock tips.");
      }
    } catch (e) {
      console.error("❌ Error reading or parsing JSON file:", e);
      console.log("ℹ️ Falling back to default mock tips.");
    }
  } else {
    console.log("ℹ️ No 'scientific_tips.json' found at project root. Seeding rich scientific fallback templates...");
  }

  console.log(`💾 Upserting ${tipsToImport.length} tips into Supabase database...`);
  
  for (const tip of tipsToImport) {
    const tipId = tip.id || tip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const preparedTip = {
      id: tipId,
      category: tip.category,
      subcategory: tip.subcategory || "",
      tier: tip.tier || "beginner",
      tags: tip.tags || [],
      title: tip.title,
      hook: tip.hook || "",
      summary: tip.summary || "",
      whatIsIt: tip.whatIsIt || "",
      whyItMatters: tip.whyItMatters || "",
      howItWorks: tip.howItWorks || "",
      howToApply: tip.howToApply || {},
      commonMistakes: tip.commonMistakes || [],
      mythVsReality: tip.mythVsReality || {},
      example: tip.example || "",
      visualConcept: tip.visualConcept || "",
      relatedCards: tip.relatedCards || [],
      keyTakeaway: tip.keyTakeaway || "",
      author: tip.author || "Unknown Sports Scientist",
      references: tip.references || [],
      evidenceLevel: tip.evidenceLevel || "strong"
    };

    await prisma.tip.upsert({
      where: { id: tipId },
      update: preparedTip,
      create: preparedTip
    });
  }

  console.log("✅ Seeded/Imported tips inside Supabase successfully!");

  // Pre-warm the cache
  await prewarmRedis(tipsToImport);
  console.log("🏁 Database Sync and Cache Pre-warming finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Migration/Seeding script failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Safely close the pool
  });
