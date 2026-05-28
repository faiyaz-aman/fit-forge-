import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  // CHEST
  {
    name: "Barbell Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Shoulders", "Triceps"],
    equipment: "Barbell",
    category: "Strength",
    gifUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-training-with-barbell-in-gym-43093-large.mp4", // Premium sample placeholder
    instructions: [
      "Lie flat on the bench with your feet flat on the floor.",
      "Grip the barbell with hands slightly wider than shoulder-width.",
      "Unrack the bar and lower it under control to your mid-chest.",
      "Push the bar back up powerfully by driving your feet into the floor and extending your arms.",
      "Lock out your elbows at the top without shrugging your shoulders."
    ]
  },
  {
    name: "Dumbbell Incline Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Shoulders", "Triceps"],
    equipment: "Dumbbell",
    category: "Hypertrophy",
    instructions: [
      "Sit on an incline bench angled at 30-45 degrees, holding dumbbells on your thighs.",
      "Kick the weights up to your shoulders and lie back.",
      "Press the weights up to arms' length, keeping your shoulders retracted.",
      "Lower the dumbbells slowly until they reach your upper chest level.",
      "Press the weights back up to the starting position."
    ]
  },
  // LEGS
  {
    name: "Barbell Back Squat",
    primaryMuscle: "Quads",
    secondaryMuscles: ["Glutes", "Hamstrings", "Lower Back"],
    equipment: "Barbell",
    category: "Strength",
    instructions: [
      "Rest the barbell on your upper back/traps, feet shoulder-width apart.",
      "Brace your core, inhale, and begin the descent by breaking at your hips and knees.",
      "Squat down until your thighs are at least parallel to the floor.",
      "Drive back up to the starting position by pushing the floor away, keeping your chest up.",
      "Exhale as you reach the top lockout."
    ]
  },
  {
    name: "Romanian Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back", "Forearms"],
    equipment: "Barbell",
    category: "Hypertrophy",
    instructions: [
      "Stand tall holding a barbell at hip height with an overhand grip.",
      "Hinge at your hips, pushing your glutes backward while keeping a flat back.",
      "Lower the bar close to your shins until you feel a deep stretch in your hamstrings.",
      "Drive your hips forward and contract your glutes to return to a standing position.",
      "Maintain a neutral spine throughout the entire range of motion."
    ]
  },
  // BACK
  {
    name: "Barbell Deadlift",
    primaryMuscle: "Lower Back",
    secondaryMuscles: ["Hamstrings", "Glutes", "Upper Back", "Forearms"],
    equipment: "Barbell",
    category: "Strength",
    instructions: [
      "Stand with your mid-foot under the barbell, feet hip-width apart.",
      "Bend over and grab the bar with a shoulder-width grip, keeping your shins touching the bar.",
      "Flatten your back, drop your hips slightly, and brace your core.",
      "Pull the bar off the floor in a straight line by driving with your legs and hinging your hips.",
      "Lock out fully at the top, standing straight without hyperextending your lower back."
    ]
  },
  {
    name: "Weighted Pull-Up",
    primaryMuscle: "Lats",
    secondaryMuscles: ["Biceps", "Upper Back", "Core"],
    equipment: "Bodyweight",
    category: "Strength",
    instructions: [
      "Hang from a pull-up bar with an overhand grip, hands slightly wider than shoulder-width.",
      "Depress your shoulder blades and brace your core.",
      "Pull yourself up by driving your elbows down toward your ribs until your chin clears the bar.",
      "Pause briefly, then lower yourself under control back to a full dead hang."
    ]
  },
  // SHOULDERS
  {
    name: "Dumbbell Shoulder Press",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Triceps", "Upper Chest"],
    equipment: "Dumbbell",
    category: "Strength",
    instructions: [
      "Sit tall on a bench with back support, holding dumbbells at shoulder level.",
      "Keep your elbows tucked slightly forward (scapular plane).",
      "Press the dumbbells overhead until your arms are fully extended.",
      "Lower the weights slowly and under control back to shoulder height."
    ]
  },
  {
    name: "Dumbbell Lateral Raise",
    primaryMuscle: "Shoulders",
    secondaryMuscles: ["Traps"],
    equipment: "Dumbbell",
    category: "Hypertrophy",
    instructions: [
      "Stand tall holding dumbbells at your sides, leaning slightly forward.",
      "Raise your arms out to the sides in a wide arc, leading with your elbows.",
      "Stop when the dumbbells reach shoulder height, palms facing down.",
      "Lower the weights slowly, resisting the load on the eccentric phase."
    ]
  },
  // ARMS
  {
    name: "Incline Dumbbell Bicep Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Dumbbell",
    category: "Hypertrophy",
    instructions: [
      "Sit back on an incline bench set to 45 degrees, arms hanging straight down with dumbbells.",
      "Keep your elbows pinned in position and curl the weights up.",
      "Squeeze your biceps hard at the top of the range of motion.",
      "Lower the dumbbells slowly to the starting position for a deep stretch."
    ]
  },
  {
    name: "Tricep Overhead Extension",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Shoulders"],
    equipment: "Cable",
    category: "Hypertrophy",
    instructions: [
      "Attach a rope to a low pulley cable station and face away from the machine.",
      "Hold the rope behind your head with elbows tucked close to your ears.",
      "Extend your arms overhead, flaring the rope outwards at lockout.",
      "Lower the weight slowly, keeping your upper arms stationary."
    ]
  }
];

const tips = [
  {
    category: "Hypertrophy",
    sourceAuthor: "Jeff Nippard",
    content: "The key to hypertrophy is mechanical tension and progressive overload, focusing on controlled eccentrics.",
    explanation: "Mechanical tension is the primary driver of muscle growth. It occurs when a muscle contracts against a heavy load throughout a full range of motion.",
    application: "Aim for a 2-3 second eccentric (lowering) phase on all major lifts, ensuring you control the weight rather than letting gravity pull it down."
  },
  {
    category: "Hypertrophy",
    sourceAuthor: "Dr. Mike Israetel",
    content: "Train close to failure (1-3 RIR) for optimal muscle recruitment.",
    explanation: "To stimulate the high-threshold motor units responsible for growth, sets must be taken close to muscular failure.",
    application: "Rate your sets using RPE (Rate of Perceived Exertion). An RPE of 8-9 means you had 1-2 reps left in the tank. Keep most sets here."
  },
  {
    category: "Strength",
    sourceAuthor: "Greg Nuckols",
    content: "Consistency and high specificity are the ultimate drivers of strength gains.",
    explanation: "Strength is as much a neural adaptation as it is muscular. To get strong at a lift, you must practice that specific lift frequently.",
    application: "If your goal is to bench press more, bench press 2-3 times per week, maintaining high quality and low fatigue levels."
  },
  {
    category: "Nutrition",
    sourceAuthor: "Dr. Layne Norton",
    content: "Energy balance dictates weight change, but protein intake preserves lean mass.",
    explanation: "You must eat in a calorie deficit to lose fat and a surplus to gain mass, but protein is the macronutrient that signals muscle preservation.",
    application: "Ensure you consume 1.8g to 2.2g of protein per kilogram of bodyweight daily, regardless of whether you are cutting or bulking."
  },
  {
    category: "Mindset",
    sourceAuthor: "Arnold Schwarzenegger",
    content: "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.",
    explanation: "Mental focus and intent dictate performance. A strong mind-muscle connection leads to better muscular recruitment.",
    application: "Visualize your set before you touch the barbell. Focus on the target muscle contracting throughout every single repetition."
  },
  {
    category: "Recovery",
    sourceAuthor: "Matthew Walker",
    content: "Sleep is the single most effective thing we can do to reset our brain and body health.",
    explanation: "Growth hormone peaks during deep sleep. Depriving yourself of sleep directly impairs recovery, strength gains, and fat loss.",
    application: "Prioritize 7-9 hours of high-quality sleep per night. Avoid screen time or heavy meals 2 hours before bed."
  }
];

async function main() {
  console.log("🌱 Start seeding FitForge database...");

  // Seed Exercises
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: exercise,
      create: exercise
    });
  }
  console.log(`✅ Seeded ${exercises.length} Exercises`);

  // Seed Tips
  await prisma.tip.deleteMany({}); // Reset tips
  for (const tip of tips) {
    await prisma.tip.create({
      data: tip
    });
  }
  console.log(`✅ Seeded ${tips.length} Tips`);

  console.log("🏁 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
