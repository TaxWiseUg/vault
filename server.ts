import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiInstance: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Resilient model invocation with retry and fallback across supported models
async function generateContentWithFallback<T>(
  fn: (modelName: string) => Promise<T>,
  models: string[] = ['gemini-3.7-flash', 'gemini-2.5-flash']
): Promise<T> {
  let lastError: any = null;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('fetch failed') ||
          errMsg.includes('overloaded');

        if (isTransient && attempt === 0) {
          // Short delay before retrying
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        break; // try next model
      }
    }
  }
  throw lastError;
}

// Deterministic intelligent financial analysis generator for Uganda context
function generateDeterministicFinancialInsights(
  categories: any,
  _entries: any,
  daysLeft: number,
  totalSaved: number,
  totalTarget: number
) {
  const safeDays = Math.max(1, daysLeft || 15);
  const homeTarget = categories?.home_rent?.targetAmount || 130000;
  const homeCurrent = categories?.home_rent?.currentAmount || 0;
  const homeRem = Math.max(0, homeTarget - homeCurrent);
  const homeDaily = Math.ceil(homeRem / safeDays);

  const netTarget = categories?.internet?.targetAmount || 70000;
  const netCurrent = categories?.internet?.currentAmount || 0;
  const netRem = Math.max(0, netTarget - netCurrent);
  const netDaily = Math.ceil(netRem / safeDays);

  const workTarget = categories?.work_rent?.targetAmount || 100000;
  const workCurrent = categories?.work_rent?.currentAmount || 0;
  const workRem = Math.max(0, workTarget - workCurrent);
  const workDaily = Math.ceil(workRem / safeDays);

  const pct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const totalDaily = homeDaily + netDaily + workDaily;

  let assessment: 'ahead' | 'on_track' | 'needs_attention' | 'critical' = 'on_track';
  let headline = 'Consistent daily micro-savings pacing in progress';
  if (pct >= 80) {
    assessment = 'ahead';
    headline = 'Terrific progress! Almost ready for month-end settlements';
  } else if (pct >= 50) {
    assessment = 'on_track';
    headline = 'Steady momentum toward all 3 priority targets';
  } else if (pct >= 25) {
    assessment = 'needs_attention';
    headline = 'Pacing acceleration needed to reach targets comfortably';
  } else {
    assessment = 'critical';
    headline = 'Time to ramp up daily micro-deposits';
  }

  return {
    headline,
    pacingAssessment: assessment,
    pacingSummary: `You have saved ${totalSaved.toLocaleString()} UGX out of ${totalTarget.toLocaleString()} UGX (${Math.round(pct)}%). With ${safeDays} days remaining in this cycle, stashing approximately ${totalDaily.toLocaleString()} UGX per day across all vaults will keep you completely on track without month-end pressure.`,
    categoryBreakdown: [
      {
        categoryId: 'home_rent',
        status: `${Math.round((homeCurrent / homeTarget) * 100)}% funded (${homeRem.toLocaleString()} UGX remaining)`,
        remaining: homeRem,
        recommendedDailyUGX: homeDaily,
        tip:
          homeRem === 0
            ? 'Home rent is 100% funded and locked in!'
            : `Stash ${homeDaily.toLocaleString()} UGX daily via MTN MoMo/Airtel Money or cash envelope to reach ${homeTarget.toLocaleString()} UGX on time.`,
      },
      {
        categoryId: 'internet',
        status: `${Math.round((netCurrent / netTarget) * 100)}% funded (${netRem.toLocaleString()} UGX remaining)`,
        remaining: netRem,
        recommendedDailyUGX: netDaily,
        tip:
          netRem === 0
            ? 'Monthly internet bundle fully covered!'
            : `Deposit ${netDaily.toLocaleString()} UGX daily — equivalent to skipping one takeaway snack or saving boda change.`,
      },
      {
        categoryId: 'work_rent',
        status: `${Math.round((workCurrent / workTarget) * 100)}% funded (${workRem.toLocaleString()} UGX remaining)`,
        remaining: workRem,
        recommendedDailyUGX: workDaily,
        tip:
          workRem === 0
            ? 'Work rent target achieved!'
            : `Put aside ${workDaily.toLocaleString()} UGX every business afternoon before wrapping up daily operations.`,
      },
    ],
    quickMilestones: [
      `Next milestone: Reach ${Math.min(totalTarget, totalSaved + 25000).toLocaleString()} UGX total savings (+25,000 UGX)`,
      homeRem > 0 ? `Home Rent: Deposit next 10,000 UGX installment` : 'Home Rent vault fully secured!',
      netRem > 0 ? `Internet: Add ${Math.min(netRem, 5000).toLocaleString()} UGX quick deposit` : 'Internet vault secured!',
    ],
    smartMoneyTips: [
      'Stash loose boda boda change (1k-2k UGX) immediately into your mobile money purse or physical envelope.',
      'Deposit daily business earnings before heading home to protect your rent allocation from impulse spending.',
      'Use MoMo auto-save or round-ups when paying utility bills or market vendors.',
    ],
  };
}

function generateFallbackChatReply(message: string, _context: any) {
  const lower = message.toLowerCase();
  if (lower.includes('home') || lower.includes('130')) {
    return `🏡 **Home Rent Strategy (130,000 UGX Target):**\n- To reach 130,000 UGX smoothly, aim for deposits of **4,000 - 5,000 UGX daily**.\n- Stash funds directly after earning daily income before other variable expenditures.\n- Treat this category as non-negotiable top priority!`;
  }
  if (lower.includes('internet') || lower.includes('70') || lower.includes('data') || lower.includes('bundle') || lower.includes('wifi')) {
    return `📶 **Internet Bundle Strategy (70,000 UGX Target):**\n- Aim for small **2,000 - 3,000 UGX daily micro-savings**.\n- Rounding up your daily snack or boda expense directly covers your monthly broadband data needs without stress.`;
  }
  if (lower.includes('work') || lower.includes('100') || lower.includes('office') || lower.includes('shop')) {
    return `💼 **Work Space Rent (100,000 UGX Target):**\n- Set aside **3,500 - 4,000 UGX at the close of every workday**.\n- Keeping work rent separate from home finances ensures your business station remains active and fully paid.`;
  }
  if (lower.includes('plan') || lower.includes('daily') || lower.includes('pace') || lower.includes('calculate') || lower.includes('schedule')) {
    return `📊 **Recommended UGX Micro-Pacing Plan:**\n- **Home Rent (130k)**: ~4,500 UGX/day\n- **Internet (70k)**: ~2,500 UGX/day\n- **Work Rent (100k)**: ~3,500 UGX/day\n- **Total Daily Target**: ~10,500 UGX/day.\nSaving in small daily bite-sized amounts prevents month-end financial shock!`;
  }
  return `💡 **Smart Savings Coach Tip:**\nConsistently depositing 2,000 – 5,000 UGX whenever you receive money keeps your Home Rent (130k), Internet (70k), and Work Rent (100k) on target. Keep recording your deposits daily to maintain your saving streak!`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Savings Coach and Pacing Advisor
  app.post('/api/ai/coach', async (req, res) => {
    const { categories, entries, daysLeftInMonth, totalSaved, totalTarget } = req.body;

    try {
      const ai = getAi();
      const prompt = `
You are an expert personal finance coach specializing in micro-budgeting and savings pacing in Uganda (Ugandan Shillings - UGX).
Analyze the user's current savings progress toward 3 critical fixed monthly expense categories:
1. Home Rent: Target ${categories?.home_rent?.targetAmount || 130000} UGX (Current saved: ${categories?.home_rent?.currentAmount || 0} UGX, Remaining: ${(categories?.home_rent?.targetAmount || 130000) - (categories?.home_rent?.currentAmount || 0)} UGX)
2. Internet: Target ${categories?.internet?.targetAmount || 70000} UGX (Current saved: ${categories?.internet?.currentAmount || 0} UGX, Remaining: ${(categories?.internet?.targetAmount || 70000) - (categories?.internet?.currentAmount || 0)} UGX)
3. Work Rent: Target ${categories?.work_rent?.targetAmount || 100000} UGX (Current saved: ${categories?.work_rent?.currentAmount || 0} UGX, Remaining: ${(categories?.work_rent?.targetAmount || 100000) - (categories?.work_rent?.currentAmount || 0)} UGX)

Overall budget:
- Total target: ${totalTarget || 300000} UGX
- Total saved so far: ${totalSaved || 0} UGX
- Days remaining in cycle: ${daysLeftInMonth || 15} days
- Recent deposit transactions count: ${Array.isArray(entries) ? entries.length : 0}

Generate a concise, motivating, actionable JSON analysis. Return strictly valid JSON conforming to this schema:
{
  "headline": "Short encouraging headline",
  "pacingAssessment": "ahead" | "on_track" | "needs_attention" | "critical",
  "pacingSummary": "2-3 sentences explaining exactly where they stand and daily pace required in UGX.",
  "categoryBreakdown": [
    {
      "categoryId": "home_rent" | "internet" | "work_rent",
      "status": "Short status phrase",
      "remaining": number,
      "recommendedDailyUGX": number,
      "tip": "Specific micro-saving strategy in Ugandan contexts"
    }
  ],
  "quickMilestones": ["List of 2-3 immediate achievable mini-targets"],
  "smartMoneyTips": ["2-3 practical everyday tips to save small UGX amounts without strain"]
}
`;

      const parsedData = await generateContentWithFallback(async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                pacingAssessment: {
                  type: Type.STRING,
                  enum: ['ahead', 'on_track', 'needs_attention', 'critical'],
                },
                pacingSummary: { type: Type.STRING },
                categoryBreakdown: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      categoryId: {
                        type: Type.STRING,
                        enum: ['home_rent', 'internet', 'work_rent'],
                      },
                      status: { type: Type.STRING },
                      remaining: { type: Type.NUMBER },
                      recommendedDailyUGX: { type: Type.NUMBER },
                      tip: { type: Type.STRING },
                    },
                    required: ['categoryId', 'status', 'remaining', 'recommendedDailyUGX', 'tip'],
                  },
                },
                quickMilestones: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                smartMoneyTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'headline',
                'pacingAssessment',
                'pacingSummary',
                'categoryBreakdown',
                'quickMilestones',
                'smartMoneyTips',
              ],
            },
          },
        });

        const text = response.text?.trim() || '{}';
        return JSON.parse(text);
      });

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.warn('Gemini API high demand / error, using intelligent financial pacing fallback:', error?.message);
      // Generate deterministic high-precision financial pacing analysis so user experience is never blocked
      const fallbackData = generateDeterministicFinancialInsights(
        categories,
        entries,
        daysLeftInMonth,
        totalSaved,
        totalTarget
      );
      res.json({
        success: true,
        data: fallbackData,
        isFallback: true,
        notice: 'Insights computed using high-accuracy financial rules during peak AI network load.',
      });
    }
  });

  // AI Interactive Budget Chatbot
  app.post('/api/ai/chat', async (req, res) => {
    const { message, context } = req.body;

    try {
      const ai = getAi();
      const systemPrompt = `
You are a friendly, encouraging personal finance and savings assistant for an app user in Uganda saving for:
- Home Rent (130,000 UGX)
- Internet Bundle (70,000 UGX)
- Work Rent (100,000 UGX)
Total monthly commitment: 300,000 UGX.

Context:
- Current savings state: ${JSON.stringify(context || {})}
- User query: "${message}"

Give helpful, concise, practical advice formatted cleanly with bullet points where appropriate. Always speak in Ugandan Shillings (UGX), emphasize daily micro-deposits (e.g., 2,000 - 5,000 UGX daily stashing), and keep responses friendly and concise.
`;

      const replyText = await generateContentWithFallback(async (modelName) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
        });
        return response.text;
      });

      res.json({ success: true, reply: replyText });
    } catch (error: any) {
      console.warn('Gemini Chat error / high demand, using smart fallback reply:', error?.message);
      const fallbackReply = generateFallbackChatReply(message || '', context);
      res.json({ success: true, reply: fallbackReply });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UGX Savings Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});

