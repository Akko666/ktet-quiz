// File: /api/generate.js

// This is a Vercel Serverless Function that acts as a secure backend.
export default async function handler(req, res) {
    // 1. --- SECURITY AND INPUT VALIDATION ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
        console.error('CRITICAL: OPENROUTER_API_KEY environment variable is not set.');
        return res.status(500).json({ 
            error: 'API Key Not Configured',
            details: 'The server is missing the required OPENROUTER_API_KEY. Please ensure this environment variable is set in your Vercel project settings.'
        });
    }

    // Allow the model to be configured via environment variables.
    // Note: Free models can be slower and less reliable. If you face persistent timeout or format errors,
    // consider upgrading to a paid model on OpenRouter (e.g., "google/gemini-pro", "anthropic/claude-3-haiku").
    const AI_MODEL = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";

    const { topic = 'General Knowledge', count = 10, subject = 'KTET Exam' } = req.body;
    console.log(`Received request for topic: "${topic}" using model: ${AI_MODEL}`);

    if (topic === 'KTET Syllabus') {
        console.warn('Attempted to generate a quiz for the syllabus category. This is not supported.');
        return res.status(400).json({
            error: 'Invalid Category: "KTET Syllabus" is not a quiz topic.',
            details: 'Please select a valid quiz topic.'
        });
    }

    // 2. --- CONSTRUCT THE AI PROMPT ---
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

    // 3. --- CALL THE OPENROUTER AI API WITH TIMEOUT ---
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000); // 9-second timeout

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal, // Attach the abort signal
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

        clearTimeout(timeoutId);

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
        try {
            const questionsJson = JSON.parse(jsonString);
            console.log(`Successfully generated and parsed ${questionsJson.questions.length} questions for topic "${topic}".`);
            return res.status(200).json(questionsJson);
        } catch (parseError) {
            console.error('Failed to parse JSON from AI response:', parseError);
            console.error('Raw AI Response was:', jsonString);
            return res.status(500).json({
                error: 'The AI returned an invalid format. Could not parse the questions.',
                details: jsonString
            });
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('API request timed out after 9 seconds.');
            return res.status(504).json({
                error: 'Gateway Timeout',
                details: 'The request to the AI service took too long to respond. This might be due to a slow model or high traffic. Try again later or consider using a faster model.'
            });
        }
        console.error('Failed to fetch from OpenRouter API:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred while contacting the AI service.',
            details: error.message
        });
    }
}
