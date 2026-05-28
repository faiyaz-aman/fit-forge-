import { NextResponse } from "next/server";

// Fallback high-fidelity preset router for mock mode
const getMockResponse = (prompt: string) => {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("deload")) {
    return {
      text: "Based on your fatigue analytics (consecutive RPE > 9.1, volume drop of 12%), a **Deload Week** is critical. We want to reduce intensity and active volume by ~40-50% to allow the nervous system and connective tissues to fully recover while maintaining motor patterns.\n\nHere is your custom **Deload Hypertrophy Split** which reduces load weight and sets, but keeps perfect technical execution:",
      card: {
        type: "workout",
        title: "Active Recovery Deload Split",
        exercises: [
          { name: "Incline DB Press (Controlled)", sets: "2 Sets", reps: "8-10 reps (RPE 6)", rest: "90s" },
          { name: "Lat Pulldown (Focus Lat Stretch)", sets: "2 Sets", reps: "10-12 reps (RPE 6)", rest: "90s" },
          { name: "Leg Press (Slow eccentrics)", sets: "2 Sets", reps: "10-12 reps (RPE 5)", rest: "120s" },
          { name: "DB Lateral Raise (Strict tempo)", sets: "2 Sets", reps: "12-15 reps (RPE 6)", rest: "60s" }
        ]
      }
    };
  }

  if (normalized.includes("macro") || normalized.includes("nutrition") || normalized.includes("diet")) {
    return {
      text: "I've structured a premium clean-bulking macro profile for you. We are targeting a small caloric surplus (~250-300 kcal above maintenance TDEE) to maximize muscle protein synthesis while keeping fat accumulation to a absolute minimum.\n\nHere is your daily athletic nutrition target breakdown:",
      card: {
        type: "macros",
        calories: 2800,
        protein: 180,
        carbs: 340,
        fat: 80
      }
    };
  }

  if (normalized.includes("body fat") || normalized.includes("profile") || normalized.includes("measurement")) {
    return {
      text: "Analyzing your latest profile parameters (83kg, 16.2% body fat calculated via Navy Circumference Formula):\n\nYour metabolic profile indicates a healthy conditioning state. You have successfully entered a **lean body recomposition trend** (down 2% body fat, while maintaining structural muscle load). To accelerate fat mobilization while keeping strength reserves, ensure your protein ceiling stays elevated at 180g+.",
      card: {
        type: "recomp",
        title: "Recomposition Analysis",
        stats: [
          { name: "Current Weight", value: "82.7 kg", target: "80.0 kg" },
          { name: "Navy Body Fat %", value: "16.2 %", target: "14.0 %" },
          { name: "Fat Mass Index", value: "13.4 kg", target: "11.2 kg" }
        ]
      }
    };
  }

  // General default response
  return {
    text: "Forge your limits, champ! I am your real-time **FitForge AI Performance Coach**. I analyze your live training logs, volume trends, fatigue indexes, and macro diaries to deliver strict athletic guidance.\n\nAsk me about:\n- **Designing custom splits** (Push/Pull/Legs, Upper/Lower, Bro Splits)\n- **CNS Fatigue alerts** & generating deload workout schemes\n- **Athletic nutritional protocols** & custom macro templates\n- **Fixing lifting form** and posture safety",
    card: null
  };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Check Gemini API integration
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes("dummy") && geminiKey.trim() !== "") {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `You are FitForge AI, a elite athletic performance coach. Provide scientific, highly specific training advice (mention RPE, tempo, hypertrophy principles). Keep answers structured and concise using markdown. Here is the user prompt: ${prompt}` }]
            }]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const aiText = resData.candidates[0].content.parts[0].text;
          
          let cardData = null;
          const lower = prompt.toLowerCase();
          if (lower.includes("deload")) {
            cardData = {
              type: "workout",
              title: "Active Recovery Deload Split",
              exercises: [
                { name: "Incline DB Press (Controlled)", sets: "2 Sets", reps: "8-10 reps (RPE 6)", rest: "90s" },
                { name: "Lat Pulldown (Focus Lat Stretch)", sets: "2 Sets", reps: "10-12 reps (RPE 6)", rest: "90s" },
                { name: "Leg Press (Slow eccentrics)", sets: "2 Sets", reps: "10-12 reps (RPE 5)", rest: "120s" },
                { name: "DB Lateral Raise (Strict tempo)", sets: "2 Sets", reps: "12-15 reps (RPE 6)", rest: "60s" }
              ]
            };
          } else if (lower.includes("macro") || lower.includes("nutrition") || lower.includes("diet")) {
            cardData = {
              type: "macros",
              calories: 2800,
              protein: 180,
              carbs: 340,
              fat: 80
            };
          } else if (lower.includes("body fat") || lower.includes("recomp")) {
            cardData = {
              type: "recomp",
              title: "Recomposition Analysis",
              stats: [
                { name: "Current Weight", value: "82.7 kg", target: "80.0 kg" },
                { name: "Navy Body Fat %", value: "16.2 %", target: "14.0 %" }
              ]
            };
          }

          return NextResponse.json({
            success: true,
            text: aiText,
            card: cardData
          });
        }
      } catch (err) {
        console.error("Gemini Chat call failed:", err);
      }
    }

    // Direct integration with OpenAI API if process.env.OPENAI_API_KEY is defined
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== "sk-..." && apiKey.trim() !== "") {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are FitForge AI, a elite athletic performance coach. Provide scientific, highly specific training advice (mention RPE, tempo, hypertrophy principles). If the user asks for macro targets or workouts, structure the response nicely. Use markdown.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const aiText = aiData.choices[0].message.content;
          
          return NextResponse.json({
            success: true,
            text: aiText,
            card: null
          });
        }
      } catch (err) {
        console.error("OpenAI call failed, falling back to local simulator:", err);
      }
    }

    // Wait slightly to simulate server analysis
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockResponse = getMockResponse(prompt);
    return NextResponse.json({
      success: true,
      text: mockResponse.text,
      card: mockResponse.card
    });
  } catch (error: any) {
    console.error("AI Coach Chat handler failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
