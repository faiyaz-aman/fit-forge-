import { NextResponse } from "next/server";

// Plan Parser Prompt Template
const SYSTEM_PROMPT = `
You are a world-class strength coach analyzing a workout plan document.
Extract a fully structured JSON of the program.
Be extremely precise — never invent exercises, sets, or reps not in the source text.
If a detail (like rest times or tempos) is not specified, assign a standard default (e.g., 90 seconds rest for compounds, 60 seconds for isolations).

Output format MUST be strict JSON matching this exact structure:
{
  "planName": "Name of the program",
  "splitType": "Push-Pull-Legs / Full Body / Bro Split",
  "durationWeeks": 12,
  "days": [
    {
      "dayNumber": 1,
      "name": "Day Focus Name (e.g. Push A)",
      "focus": "Target muscle groups",
      "exercises": [
        {
          "name": "Standardized Exercise Name",
          "sets": 4,
          "repMin": 8,
          "repMax": 10,
          "rest": 90,
          "notes": "Tempo or eccentric cues"
        }
      ]
    }
  ]
}
`;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let rawText = "";
    let fileBase64 = "";
    let fileMimeType = "";

    // Parse incoming payload (Multipart Form or Direct JSON)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textParam = formData.get("text") as string | null;

      if (file) {
        // Convert file directly to base64 inline data for Gemini
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fileBase64 = buffer.toString("base64");
        fileMimeType = file.type;
        rawText = `[File Uploaded: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes]`;
      } else if (textParam) {
        rawText = textParam;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      rawText = body.text || "";
    }

    if (!rawText && !fileBase64) {
      return NextResponse.json(
        { success: false, error: "No plan content or file provided." },
        { status: 400 }
      );
    }

    // Check Gemini API integration
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes("dummy") && geminiKey.trim() !== "") {
      try {
        const parts: any[] = [];
        parts.push({ text: SYSTEM_PROMPT });

        if (fileBase64 && fileMimeType) {
          parts.push({
            inlineData: {
              mimeType: fileMimeType,
              data: fileBase64
            }
          });
          parts.push({ text: "Please parse this uploaded workout document (image/pdf) and extract its complete structured split program." });
        } else if (rawText) {
          parts.push({ text: `Here is the raw extracted text of my program:\n\n${rawText}` });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Gemini Plan Parser API call failed with status ${response.status}:`, errText);
        } else {
          const resData = await response.json();
          const parsedText = resData.candidates[0].content.parts[0].text;
          const parsedPlan = JSON.parse(parsedText);
          
          // Post-process to guarantee days have orderIndex and dayNumber
          if (parsedPlan && Array.isArray(parsedPlan.days)) {
            parsedPlan.days = parsedPlan.days.map((day: any, idx: number) => ({
              ...day,
              orderIndex: day.orderIndex !== undefined ? day.orderIndex : idx,
              dayNumber: day.dayNumber !== undefined ? day.dayNumber : idx + 1
            }));
          }
          return NextResponse.json({ success: true, parsed: parsedPlan, mode: "gemini" });
        }
      } catch (err) {
        console.error("Gemini Plan Parser call failed:", err);
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // IF OpenAI API Key is missing or placeholder, run our high-fidelity mock engine
    if (!apiKey || apiKey.includes("dummy-") || apiKey.includes("sk-...") || apiKey.startsWith("sk-dummy")) {
      console.warn("⚠️ OpenAI API: API Key missing or placeholder. Running high-fidelity local plan parser simulator.");
      
      // Simulate small dynamic variation based on user text keywords
      let splitName = "Custom AI Spliter";
      let splitType = "Push-Pull-Legs (PPL)";
      
      if (rawText.toLowerCase().includes("bro")) {
        splitName = "Bro Split Hypertrophy";
        splitType = "5-Day Bro Split";
      } else if (rawText.toLowerCase().includes("upper") || rawText.toLowerCase().includes("lower")) {
        splitName = "Upper-Lower Strength Split";
        splitType = "4-Day Upper/Lower";
      } else if (rawText.toLowerCase().includes("full")) {
        splitName = "Full Body Athletic Split";
        splitType = "3-Day Full Body";
      }

      // High-fidelity structured mock response
      const mockParsedPlan = {
        planName: splitName,
        splitType: splitType,
        durationWeeks: 12,
        days: [
          {
            dayNumber: 1,
            name: "Day 1: Upper A",
            focus: "Chest, Upper Back, Shoulders",
            orderIndex: 0,
            exercises: [
              { name: "Barbell Bench Press", sets: 4, repMin: 6, repMax: 8, rest: 90, notes: "Focus on driving heels into the floor" },
              { name: "Weighted Pull-Up", sets: 4, repMin: 6, repMax: 8, rest: 120, notes: "Pause 1s at absolute full contraction" },
              { name: "Dumbbell Shoulder Press", sets: 3, repMin: 8, repMax: 10, rest: 90, notes: "Keep elbows tucked in the scapular plane" },
              { name: "Dumbbell Lateral Raise", sets: 4, repMin: 12, repMax: 15, rest: 60, notes: "Resist the eccentric lowering under control" }
            ]
          },
          {
            dayNumber: 2,
            name: "Day 2: Lower A",
            focus: "Quads, Hamstrings, Glutes",
            orderIndex: 1,
            exercises: [
              { name: "Barbell Back Squat", sets: 4, repMin: 6, repMax: 8, rest: 120, notes: "Inhale, brace abdominal wall before lowering" },
              { name: "Romanian Deadlift", sets: 3, repMin: 8, repMax: 10, rest: 90, notes: "Push glutes back, maintain neutral neck" },
              { name: "Leg Press", sets: 3, repMin: 10, repMax: 12, rest: 90, notes: "Avoid knee valgus (collapsing inwards)" },
              { name: "Calf Raise", sets: 4, repMin: 12, repMax: 15, rest: 45, notes: "Full stretch at bottom range of motion" }
            ]
          }
        ]
      };

      return NextResponse.json({ success: true, parsed: mockParsedPlan, mode: "mocked" });
    }

    // REAL OPENAI API GPT-4o INVOCATION
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Here is the raw extracted text of my program:\n\n${rawText}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenAI API call failed:", errBody);
      throw new Error(`OpenAI HTTP Error: ${response.status}`);
    }

    const resJson = await response.json();
    const parsedText = resJson.choices[0]?.message?.content || "";
    const parsedPlan = JSON.parse(parsedText);

    return NextResponse.json({ success: true, parsed: parsedPlan, mode: "production" });

  } catch (error: any) {
    console.error("API error inside parse-plan Route:", error);
    return NextResponse.json(
      { success: false, error: "Internal parsing error. Please check plan formats." },
      { status: 500 }
    );
  }
}
