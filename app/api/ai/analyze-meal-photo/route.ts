import { NextResponse } from "next/server";

// Meal Photo Analyzer System Prompt
const SYSTEM_PROMPT = `
You are an expert sports nutritionist. Analyze the food in this image.
Estimate the portion size (in grams) and calculate:
- foodName
- estimatedGrams
- calories (kcal)
- protein (g)
- carbs (g)
- fat (g)

Be extremely conservative. If you are highly uncertain, flag it or provide safe average estimates.
Output MUST be strict JSON matching this exact structure:
{
  "foodName": "Descriptive name of the meal",
  "estimatedGrams": 350,
  "calories": 450,
  "protein": 30.5,
  "carbs": 42.0,
  "fat": 15.2,
  "confidenceScore": 85
}
`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const imageBase64 = body.image; // Base64 data-URI string of the meal photo
    const fileName = body.fileName || "";

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "No base64 image data supplied." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes("dummy") && geminiKey.trim() !== "") {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `You are an expert sports nutritionist. Analyze the food in this image. Estimate the portion size (in grams) and calculate calories, protein, carbs, and fat. Output MUST be strict JSON matching this exact structure:
                {
                  "foodName": "Descriptive name of the meal",
                  "estimatedGrams": 350,
                  "calories": 450,
                  "protein": 30.5,
                  "carbs": 42.0,
                  "fat": 15.2,
                  "confidenceScore": 85
                }` },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                  }
                }
              ]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Gemini Vision API call failed with status ${response.status}:`, errText);
        } else {
          const resData = await response.json();
          const parsedText = resData.candidates[0].content.parts[0].text;
          const parsedMeal = JSON.parse(parsedText);
          return NextResponse.json({ success: true, parsed: parsedMeal, mode: "gemini" });
        }
      } catch (err) {
        console.error("Gemini Vision call failed:", err);
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // IF OpenAI key is missing or is a placeholder, run our high-fidelity mock image parser
    if ((!apiKey || apiKey.includes("dummy-") || apiKey.includes("sk-...") || apiKey.startsWith("sk-dummy")) && (!geminiKey || geminiKey.includes("dummy"))) {
      console.warn("⚠️ OpenAI API: API Key missing or placeholder. Running high-fidelity local meal photo parser simulator.");
      
      // Analyze file name or generate a standard balanced meal template
      const lowerFile = fileName.toLowerCase();
      let foodName = "Grilled Chicken Breast with Quinoa & Broccoli";
      let grams = 400;
      let calories = 520;
      let protein = 45;
      let carbs = 55;
      let fat = 12;

      if (lowerFile.includes("egg") || lowerFile.includes("breakfast") || lowerFile.includes("steak")) {
        foodName = "Sirloin Steak & Sunny-Side-Up Eggs";
        grams = 350;
        calories = 680;
        protein = 52;
        carbs = 3;
        fat = 50;
      } else if (lowerFile.includes("shake") || lowerFile.includes("smoothie") || lowerFile.includes("protein")) {
        foodName = "Whey Protein Shake with Oats & Banana";
        grams = 500;
        calories = 420;
        protein = 35;
        carbs = 58;
        fat = 6;
      } else if (lowerFile.includes("salad") || lowerFile.includes("salmon")) {
        foodName = "Baked Atlantic Salmon with Avocado Salad";
        grams = 380;
        calories = 580;
        protein = 38;
        carbs = 10;
        fat = 42;
      }

      // Dynamic structure
      const mockResult = {
        foodName,
        estimatedGrams: grams,
        calories,
        protein,
        carbs,
        fat,
        confidenceScore: 90
      };

      return NextResponse.json({ success: true, parsed: mockResult, mode: "mocked" });
    }

    // REAL OPENAI GPT-4 VISION COMPLETION CALL
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // GPT-4o supports vision and JSON format natively
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Please estimate the macros of the food shown in this photo." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenAI Vision call failed:", errBody);
      throw new Error(`OpenAI HTTP Error: ${response.status}`);
    }

    const resJson = await response.json();
    const parsedText = resJson.choices[0]?.message?.content || "";
    const parsedMeal = JSON.parse(parsedText);

    return NextResponse.json({ success: true, parsed: parsedMeal, mode: "production" });

  } catch (error: any) {
    console.error("API error inside analyze-meal-photo Route:", error);
    return NextResponse.json(
      { success: false, error: "Internal meal parsing error. Please check image format." },
      { status: 500 }
    );
  }
}
