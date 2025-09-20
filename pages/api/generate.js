export default async function handler(req, res) {
  // We only accept POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subject = 'KTET Exam', topic = 'General Knowledge', count = 10 } = req.body;

  // --- IMPROVED AI PROMPT ---
  // We are making the instructions much more direct and structured to prevent the AI from ignoring the topic.
  const prompt = `
    You are an expert question generator for the Kerala Teacher Eligibility Test (KTET).
    Your task is to generate exactly ${count} multiple-choice questions.

    CRITICAL INSTRUCTIONS:
    1.  The topic for these questions MUST be: <topic>${topic}</topic>. Do NOT generate questions on any other topic.
    2.  The subject context is: <subject>${subject}</subject>.
    3.  You MUST respond with ONLY a valid JSON object. Do not include any text, greetings, or explanations before or after the JSON object.
    4.  The JSON structure must be: { "questions": [ ... ] }.
    5.  Each question object inside the "questions" array must have these exact keys: "id", "question", "options" (an array of 4 strings), "correctIndex" (a number from 0 to 3), and "explanation".

    Example of a single question object:
    {
      "id": 1,
      "question": "Sample question text related to the topic?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Brief reason why the correct answer is right."
    }

    Now, generate the questions for the topic: <topic>${topic}</topic>.
  `;

  // --- SECURE API CALL (This part remains the same) ---
  const AI_API_URL = process.env.AI_API_URL;
  const AI_API_KEY = process.env.AI_API_KEY;

  if (!AI_API_URL || !AI_API_KEY) {
    return res.status(500).json({ error: 'API credentials are not configured on the server.' });
  }

  try {
    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      // The body structure depends on your AI provider (Gemini, DeepSeek, etc.).
      // This is a common structure. Adjust if your provider requires something different (e.g., 'messages' array).
      body: JSON.stringify({
        model: "deepseek-chat", // Example model, change if needed
        messages: [
            { "role": "system", "content": "You are a helpful assistant that only responds in valid JSON." },
            { "role": "user", "content": prompt }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return res.status(aiResponse.status).json({ error: `AI provider error: ${errorText}` });
    }

    const aiData = await aiResponse.json();
    
    // --- PARSE AND RESPOND (This part remains the same) ---
    // The exact path to the content may vary by AI provider.
    // For DeepSeek/OpenAI: aiData.choices[0].message.content
    // For Gemini: aiData.candidates[0].content.parts[0].text
    let jsonString = aiData.choices[0].message.content;

    // Clean up markdown formatting if the AI includes it
    jsonString = jsonString.replace(/```json\n|\n```/g, '');
    
    const questionsJson = JSON.parse(jsonString);
    
    res.status(200).json(questionsJson);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate or parse AI response.', details: error.message });
  }
}
