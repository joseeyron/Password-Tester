/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Eye, 
  EyeOff, 
  RefreshCcw,
  Zap,
  ShieldPlus,
  Clock,
  Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Define the response type for clear typing
interface AnalysisResult {
  strength: 'Weak' | 'Medium' | 'Strong';
  explanation: string;
  suggestions: string[];
  timeToCrack: string;
}

const SYSTEM_PROMPT = `You are a password strength analyzer. Your role is to evaluate user-provided passwords and classify them into one of three categories: Weak, Medium, or Strong. 

Evaluation Criteria:
- Weak: Passwords shorter than 8 characters OR containing only letters/numbers without variety.
- Medium: Passwords at least 8 characters long with some variety (letters + numbers OR letters + symbols).
- Strong: Passwords 12+ characters long with a mix of uppercase, lowercase, numbers, and symbols.

Output Format:
Return a JSON object with:
{
  "strength": "Weak/Medium/Strong",
  "explanation": "Brief reason for classification",
  "suggestions": ["List of specific, actionable advice"],
  "timeToCrack": "Estimate of how long it would take an attacker to crack this password (e.g., 'Instantly', '2 hours', '400 years', '10+ Decades')"
}`;

export default function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  const analyzePassword = async () => {
    if (!password.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: password,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strength: { type: Type.STRING, enum: ['Weak', 'Medium', 'Strong'] },
              explanation: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              timeToCrack: { type: Type.STRING }
            },
            required: ['strength', 'explanation', 'suggestions', 'timeToCrack']
          }
        },
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data as AnalysisResult);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError('Evaluation failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getIntensity = (strength: string) => {
    switch (strength) {
      case 'Strong': return 94;
      case 'Medium': return 62;
      case 'Weak': return 28;
      default: return 0;
    }
  };

  const getHexColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return '#00FF94';
      case 'Medium': return '#FFD600';
      case 'Weak': return '#FF4D4D';
      default: return '#808085';
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark font-sans text-text-main flex items-center justify-center p-4 selection:bg-accent-strong selection:text-bg-dark">
      <div className="w-full max-w-[1024px] relative py-12">
        {/* Header - Brand Mark */}
        <div className="absolute top-0 left-0 font-mono text-[10px] tracking-[0.4em] text-text-dim uppercase hidden md:block">
          PASSWORD // SECURITY_VERIFIER // {new Date().toLocaleDateString()}
        </div>

        {/* Global Heading */}
        <div className="mb-12 border-b border-[#2A2A2E] pb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2 uppercase">
            <span className="text-accent-strong">Password Tester</span>
          </h1>
          <p className="text-text-dim text-sm max-w-xl leading-relaxed">
            Enter your password below to receive an AI-powered security analysis, 
            time-to-crack estimation, and professional hardening advice.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* Main Analysis Panel */}
          <div className="flex flex-col justify-start">
             <div className="mb-8">
                <span className="text-[10px] uppercase tracking-[0.3em] text-text-dim block mb-3 font-bold">Overall Strength</span>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={result?.strength || 'idle'}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{ color: getHexColor(result?.strength || '') }}
                    className="text-7xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8 transition-colors"
                  >
                    {result?.strength || 'READY'}
                  </motion.div>
                </AnimatePresence>

                {/* Input Area */}
                <div className="relative mb-10 group bg-surface shadow-xl">
                   <div 
                    className="absolute inset-y-0 left-0 w-1 transition-colors duration-500" 
                    style={{ backgroundColor: getHexColor(result?.strength || '') }}
                   />
                   <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type your password here..."
                    className="w-full py-8 pl-10 pr-36 font-mono text-xl sm:text-2xl tracking-[0.15em] border-none focus:ring-1 focus:ring-accent-strong/30 transition-all outline-none bg-transparent placeholder:text-text-dim/20"
                    onKeyDown={(e) => e.key === 'Enter' && analyzePassword()}
                   />
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-text-dim hover:text-white transition-colors p-3"
                        title={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                      <button
                        onClick={analyzePassword}
                        disabled={isAnalyzing || !password.trim()}
                        className="text-text-dim hover:text-white disabled:opacity-10 transition-all p-3 bg-white/5 rounded-sm"
                        title="Analyze Strength"
                      >
                        <RefreshCcw className={`w-8 h-8 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      </button>
                   </div>
                </div>

                {/* Diagnostic Report */}
                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div 
                      key={result.explanation}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-md bg-white/5 p-6 rounded-sm border-l-2 border-accent-medium"
                    >
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-dim font-bold mb-4 flex items-center gap-2">
                        <Zap size={14} className="text-accent-medium" /> Security Summary
                      </h3>
                      <p className="text-lg text-[#E0E0E5] leading-relaxed font-light text-balance">
                        {result.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {error && (
                  <div className="text-accent-weak font-mono text-sm mt-4 border border-accent-weak/20 p-4 bg-accent-weak/5 rounded">
                    [!] ERROR: {error}
                  </div>
                )}
             </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="bg-surface border border-[#2A2A2E] p-8 md:p-10 flex flex-col gap-10 shadow-2xl">
             {/* Feature: Time to Compromise */}
             <div className="space-y-3 pb-8 border-b border-[#2A2A2E]/50">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-text-dim font-bold">
                   <Clock size={12} /> Time to Crack
                </div>
                <div className="flex items-center gap-4">
                   <Skull className={`w-8 h-8 ${result?.strength === 'Weak' ? 'text-accent-weak animate-pulse' : 'text-text-dim'}`} />
                   <div className="font-mono text-2xl font-bold tracking-tight">
                      {result ? (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ color: getHexColor(result.strength) }}
                        >
                          {result.timeToCrack}
                        </motion.span>
                      ) : (
                        <span className="text-text-dim/20">Not Calculated</span>
                      )}
                   </div>
                </div>
             </div>

             {/* Metric: Security Score */}
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-baseline">
                   <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim font-bold">Security Score</span>
                   <span className="font-mono text-sm font-black" style={{ color: getHexColor(result?.strength || '') }}>
                      {result ? getIntensity(result.strength) : '00'}/100
                   </span>
                </div>
                <div className="h-2 bg-black/40 w-full relative rounded-none border border-[#2A2A2E]">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result ? getIntensity(result.strength) : 0}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    className="h-full relative overflow-hidden"
                    style={{ backgroundColor: getHexColor(result?.strength || '') }}
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                   </motion.div>
                </div>
             </div>

             {/* Metric: Quality */}
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-baseline">
                   <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim font-bold">Quality Level</span>
                   <span className="font-mono text-xs font-black uppercase" style={{ color: getHexColor(result?.strength || '') }}>
                      {result?.strength === 'Strong' ? 'EXCELLENT' : result?.strength === 'Medium' ? 'ADEQUATE' : result?.strength === 'Weak' ? 'POOR' : 'IDLE'}
                   </span>
                </div>
                <div className="h-2 bg-black/40 w-full relative rounded-none border border-[#2A2A2E]">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result ? Math.max(10, getIntensity(result.strength) * 0.9) : 0}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.1 }}
                    className="h-full relative overflow-hidden"
                    style={{ backgroundColor: getHexColor(result?.strength || '') }}
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                   </motion.div>
                </div>
             </div>

             {/* Improvement Steps */}
             <AnimatePresence>
               {result && result.suggestions.length > 0 && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="space-y-4 pt-6 border-t border-[#2A2A2E]/40"
                 >
                   <h4 className="text-[10px] uppercase tracking-[0.2em] text-text-dim font-bold flex items-center gap-2">
                     <ShieldPlus size={14} className="text-accent-strong" /> How to Improve
                   </h4>
                   <ul className="space-y-3">
                     {result.suggestions.map((suggestion, i) => (
                       <li key={i} className="flex items-start gap-4 text-[12px] text-[#A0A0A5] leading-snug group">
                         <div className="w-1 h-1 rounded-full bg-accent-strong mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                         {suggestion}
                       </li>
                     ))}
                   </ul>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* App Status Footer */}
             <div className="mt-auto pt-8 border-t border-[#2A2A2E]/50">
                <div className="text-[9px] uppercase tracking-[0.2em] text-text-dim mb-3 font-bold">App Status</div>
                <div className="font-mono text-[10px] text-accent-strong flex items-center gap-2">
                   <motion.div 
                    animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent-strong" 
                   />
                   SECURE & READY // {password.length} CHARS
                </div>
             </div>
          </div>
        </div>

        {/* Footer Stamp */}
        <div className="absolute -bottom-10 right-0 font-mono text-[9px] text-[#2A2A2E] hidden md:block uppercase tracking-widest opacity-50">
          UID: VALT-882-SYS | AIS_POWERED 
        </div>
      </div>
    </div>
  );
}
