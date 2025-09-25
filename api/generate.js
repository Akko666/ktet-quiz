// File: /api/generate.js

// This is a Vercel Serverless Function that acts as a secure backend.
export default async function handler(req, res) {
    // 1. --- SECURITY AND INPUT VALIDATION ---
    // We only accept POST requests.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    // Get the API key from Vercel's environment variables.
    // It's crucial this is NOT exposed to the front-end.
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is not configured on the server.');
        return res.status(500).json({ error: 'API credentials are not configured on the server.' });
    }

    // Allow the model to be configured via environment variables, with a fallback to the free Mistral model.
    // You can now set `OPENROUTER_MODEL` in Vercel to "gemma-7b-it:free", "google/gemini-pro", etc.
    const AI_MODEL = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";

    const { topic = 'General Knowledge', count = 10, subject = 'KTET Exam' } = req.body;

    // Log the incoming request for debugging purposes on Vercel.
    console.log(`Received request for topic: "${topic}"`);


    // 2. --- CONSTRUCT THE AI PROMPT (Based on your "Power Prompt") ---
    // This prompt is very specific to ensure the AI returns clean JSON every time.
    const prompt = `
      You are an expert question generator for the Kerala Teacher Eligibility Test (KTET).
      Your task is to generate exactly ${count} multiple-choice questions.

      CRITICAL INSTRUCTIONS:
      1. The topic for these questions MUST be: <topic>${topic}</topic>. Do NOT generate questions on any other topic.
      2. The subject context is: <subject>${subject}</subject>.
      3. You MUST respond with ONLY a valid JSON object. Do not include any text, greetings, explanations, or markdown fences like \`\`\`json before or after the JSON object.
      4. The JSON structure MUST be: { "questions": [ ... ] }.
      5. Each question object inside the "questions" array must have these exact keys: "id" (a unique number), "question" (string), "options" (an array of exactly 4 strings), "correctIndex" (a number from 0 to 3), and "explanation" (a string explaining the correct answer).

      Now, generate the questions for the topic: <topic>${topic}</topic>.
    `;

    // 3. --- CALL THE OPENROUTER AI API ---
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { "role": "system", "content": "You are a helpful assistant that only responds in valid, raw JSON format without any extra text or markdown." },
                    { "role": "user", "content": prompt }
                ]
            })
        });

        // Check for errors from the AI service itself.
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API Error (using model ${AI_MODEL}):`, errorText);
            return res.status(response.status).json({
                error: `The AI service failed to generate questions. Please try again later.`,
                details: errorText
            });
        }

        const aiData = await response.json();
        const jsonString = aiData.choices[0].message.content;

        // 4. --- PARSE AND RESPOND ---
        // Attempt to parse the AI's response as JSON.
        try {
            const questionsJson = JSON.parse(jsonString);
            console.log(`Successfully generated and parsed ${questionsJson.questions.length} questions for topic "${topic}".`);
            return res.status(200).json(questionsJson);
        } catch (parseError) {
            console.error('Failed to parse JSON from AI response:', parseError);
            console.error('Raw AI Response was:', jsonString); // Log the bad response for debugging
            return res.status(500).json({
                error: 'The AI returned an invalid format. Could not parse the questions.',
                details: jsonString
            });
        }

    } catch (error) {
        console.error('Failed to fetch from OpenRouter API:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred while contacting the AI service.',
            details: error.message
        });
    }
}