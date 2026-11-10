import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = req.body || (await parseRequestBody(req));
    const { messages, auditSummary, questionCount = 0 } = payload;

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey ? { apiKey } : undefined);

    const systemInstruction = `
You are the Senior Institutional Quality Assurance (QA) Partner for St. John Paul II College of Davao (SJPIIC), College of Information and Communications Technology (CICT).
You are holding a supportive, constructive Quality Audit consultation with an instructor regarding their recent course audit.

=== AUDIT CONTEXT ===
${JSON.stringify(auditSummary, null, 2)}

=== RULES OF ENGAGEMENT ===
1. Listen empathetically, acknowledge institutional constraints, and provide professional pedagogical insights.
2. Ask at most 2 to 3 clarifying questions across the dialogue, strictly ONE AT A TIME.
3. Current clarifying questions asked so far: ${questionCount}.
4. If ${questionCount} < 2, offer an insightful observation and ask ONE thoughtful clarifying question.
5. If ${questionCount} >= 2, provide a comprehensive QA synthesis, brainstorming suggestions, and reflective commendation.
`;

    if (apiKey) {
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      let botReply = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction
          }
        });
        botReply = response.text || '';
      } catch (chatErr) {
        console.warn('Gemini chat notice (Vercel serverless):', chatErr);
      }

      if (botReply) {
        return sendJson(res, 200, {
          success: true,
          reply: botReply
        });
      }
    }

    let reply = '';
    if (questionCount === 0) {
      reply = `Thank you for sharing that context. In CICT courses like this, balancing theoretical lecture concepts with practical programming labs is always challenging. Looking closely at your results, how did you handle students who began falling behind in their laboratory submissions before the Midterm exam?`;
    } else if (questionCount === 1) {
      reply = `That provides valuable insight into your classroom dynamic. Given that hands-on mastery is essential for CHED OBE compliance, what kind of institutional support or instructional adjustments do you feel would make the biggest difference for your students next term?`;
    } else {
      reply = `Based on our consultation and your thoughtful reflections, here is our QA Synthesis:\n\n1. **Core Strength:** You maintained rigorous assessment integrity while actively identifying students struggling with complex topics.\n2. **Immediate Action:** Implementing early code clinics and lab milestones will catch at-risk students before the Midterm dropoff.\n3. **Institutional Recommendation:** We will endorse scheduling dedicated open-lab assistance hours for CICT students to support your teaching strategy.\n\nThank you for your dedication to student success at SJPIIC CICT!`;
    }

    return sendJson(res, 200, { success: true, reply });
  } catch (err: any) {
    console.error('Vercel Chat API error:', err);
    return sendJson(res, 500, { error: err.message || 'Chat consultation failed' });
  }
}
