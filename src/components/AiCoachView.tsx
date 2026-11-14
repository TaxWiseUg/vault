import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Send,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Bot,
  Rocket,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { AICoachResponse, CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { formatUGX } from '../lib/constants';

interface AiCoachViewProps {
  categories: Record<CategoryId, CategoryGoal>;
  entries: SavingsEntry[];
  daysLeftInMonth: number;
  totalSaved: number;
  totalTarget: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  categories,
  entries,
  daysLeftInMonth,
  totalSaved,
  totalTarget,
}) => {
  const [insights, setInsights] = useState<AICoachResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Gemini AI Budget Advisor. I analyze your daily mini-savings across Home Rent (130k UGX), Internet (70k UGX), and Work Rent (100k UGX). How can I help you reach your goals faster?",
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const fetchAiCoachInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          entries: entries.slice(0, 15),
          daysLeftInMonth,
          totalSaved,
          totalTarget,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setInsights(data.data);
        if (data.notice) {
          setNotice(data.notice);
        } else {
          setNotice(null);
        }
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
    } catch (err: any) {
      console.error('Error loading AI coach:', err);
      setError('AI Advisor is currently busy or reconnecting. Please click Retry in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAiCoachInsights();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isChatSending) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userInput.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsChatSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: {
            categories,
            daysLeftInMonth,
            totalSaved,
            totalTarget,
            recentEntriesCount: entries.length,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: data.reply,
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to receive reply');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I had trouble thinking of an answer. Please verify your connection and try again.',
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div id="ai-coach-view" className="space-y-6 px-4 sm:px-6 pb-28 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gemini AI Advisor</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Pacing forecast & micro-saving strategies</p>
          </div>
        </div>

        <button
          id="refresh-ai-btn"
          onClick={fetchAiCoachInsights}
          disabled={isLoading}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 transition-colors shadow-sm"
          title="Refresh AI Insights"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Main AI Insights Card */}
      <div className="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Analyzing savings pace and generating personalized UGX strategies...
            </p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{error}</p>
            <button
              onClick={fetchAiCoachInsights}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-200 dark:shadow-none"
            >
              Retry
            </button>
          </div>
        ) : insights ? (
          <>
            {/* Headline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center gap-1.5">
                  {insights.pacingAssessment === 'ahead' ? (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Ahead of Schedule</span>
                    </>
                  ) : insights.pacingAssessment === 'on_track' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>On Track</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Pace Acceleration Needed</span>
                    </>
                  )}
                </span>
                {notice && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                    • {notice}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {insights.headline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{insights.pacingSummary}</p>
            </div>

            {/* Category recommendations */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recommended Daily Micro-Targets
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {insights.categoryBreakdown?.map((cat) => {
                  const goal = categories[cat.categoryId] || categories.home_rent;
                  const isHome = cat.categoryId === 'home_rent';
                  const isInternet = cat.categoryId === 'internet';

                  return (
                    <div
                      key={cat.categoryId}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900 dark:text-slate-100">{goal.name}</span>
                        <span className={`font-mono-num font-black ${
                          isHome ? 'text-orange-600 dark:text-orange-400' : isInternet ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatUGX(cat.recommendedDailyUGX)}/d
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{cat.tip}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Money Tips */}
            {insights.smartMoneyTips?.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Practical Micro-Saving Tips</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {insights.smartMoneyTips.map((tip, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-base leading-none">•</span>
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Interactive AI Chat Assistant */}
      <div className="rounded-[32px] sm:rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Ask Your Savings Advisor
          </span>
        </div>

        {/* Chat message bubbles */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 text-xs ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl max-w-[82%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-none font-medium shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isChatSending && (
            <div className="flex gap-2.5 text-xs justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 text-slate-400 dark:text-slate-500 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Suggestion prompt chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            'How to reach 130k Home Rent faster?',
            'Suggest a 5-day saving plan',
            'Internet 70k budgeting tips',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setUserInput(prompt);
              }}
              className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2">
          <input
            id="ai-chat-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about saving in UGX..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isChatSending}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
