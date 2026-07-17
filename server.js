import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.post('/api/generate', async (req, res) => {
  try {
    const { notes, mode, chaos } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'Notes are required' });
    }

    // --- CHAOS MODE: Force malformed responses to test UI resilience ---
    if (chaos) {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      
      const rand = Math.random();
      if (rand < 0.2) {
        // Return non-JSON completely
        return res.status(200).send("Gateway timeout - unexpected error 503");
      }
      
      if (rand < 0.4) {
        // Return valid JSON but completely wrong shape
        return res.json({ success: true, message: "Here is your data", data: "N/A" });
      }

      // Return mostly valid JSON but with mangled fields + new features
      const badData = {
        flashcards: [
          { front: "What is Chaos Mode?", back: "A way to test error handling." },
          { front: "Mitochondria", back: "The powerhouse of the cell.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Animal_mitochondrion_diagram_en_%28edit%29.svg/512px-Animal_mitochondrion_diagram_en_%28edit%29.svg.png" },
          { front: "This card is missing a back." }, // Malformed
          null, // Malformed array item
          { back: "This card is missing a front." } // Malformed
        ],
        quiz: [
          {
            type: "multiple-choice",
            question: "Is the UI resilient?",
            options: ["Yes", "No", "Maybe", "Crash"],
            answerIndex: 0,
            explanation: "It recovers from partial errors!"
          },
          {
            type: "true-false",
            question: "React is a backend framework.",
            options: ["True", "False"],
            answerIndex: 1,
            explanation: "React is a frontend library for building user interfaces."
          },
          {
            question: "This question has no options or answer.",
          }
        ]
      };
      
      return res.json(badData);
    }

    // --- NORMAL MODE ---
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env on the server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const schema = {
      type: Type.OBJECT,
      properties: {
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              imageUrl: { type: Type.STRING, nullable: true, description: "Optional URL to a public image/diagram illustrating the concept" }
            },
            required: ["front", "back"]
          }
        },
        quiz: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "'multiple-choice' or 'true-false'" },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["type", "question", "options", "answerIndex", "explanation"]
          }
        }
      }
    };

    let prompt = `Create study materials based on the following notes.`;
    if (mode === 'flashcards') prompt += ` I only need flashcards.`;
    else if (mode === 'quiz') prompt += ` I only need a multiple choice quiz.`;
    else prompt += ` I need both flashcards and a quiz.`;
    prompt += `\n\nNotes:\n${notes}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2
      }
    });

    const data = JSON.parse(response.text());
    res.json(data);

  } catch (error) {
    console.error("AI Generation error:", error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini Proxy running on http://localhost:${PORT}`);
});
