"use client";

import { useState, useCallback } from "react";
import { Terminal, Copy, Check, RotateCcw, Sparkles, AlertTriangle, ChevronRight, Zap, BookOpen, Shield } from "lucide-react";

interface ShellResult {
  input: string; shell: string;
  suggestions: Array<{ command: string; explanation: string; safe: boolean }>;
  matchedCommands: Array<{ command: string; description: string; example: string; category: string; danger: boolean }>;
  warning: string | null;
}

const QUICK_QUERIES = [
  "Find large files over 100MB",
  "Check what's using port 8080",
  "Monitor disk space usage",
  "Compress a directory",
  "Download a file from URL",
  "List running processes",
];

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ShellResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
  }, [input]);

  const handleCopy = (cmd: string) => { navigator.clipboard.writeText(cmd); setCopied(cmd); setTimeout(() => setCopied(null), 2000); };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800/60 bg-[#080c10]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center"><Terminal size={16} className="text-white" /></div>
            <div><h1 className="text-base font-bold text-white tracking-tight">ShellForge</h1><p className="text-[10px] text-slate-500 uppercase tracking-widest">AI Shell Command Builder</p></div>
          </div>
          <button onClick={() => { setInput(""); setResult(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"><RotateCcw size={12} /> Clear</button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Quick Queries */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-slate-500 self-center">Quick:</span>
          {QUICK_QUERIES.map(q => (
            <button key={q} onClick={() => { setInput(q); }} className="px-3 py-1 rounded-md text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">{q}</button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-sm">$</span>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGenerate()} placeholder="Describe what you want to do in plain English..." className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono" />
          </div>
          <button onClick={handleGenerate} disabled={isProcessing || !input.trim()} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold text-sm hover:from-cyan-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={14} />}
            Build
          </button>
        </div>

        {/* Warning */}
        {result?.warning && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            <AlertTriangle size={16} /> {result.warning}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Suggestions */}
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5"><Sparkles size={14} className="text-cyan-400" /> Suggested Commands</h3>
            {result.suggestions.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 border ${s.safe ? "bg-slate-800/30 border-slate-700/50" : "bg-red-500/5 border-red-500/20"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{s.command}</code>
                      {!s.safe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-0.5"><AlertTriangle size={8} /> DANGER</span>}
                    </div>
                    <p className="text-xs text-slate-400">{s.explanation}</p>
                  </div>
                  <button onClick={() => handleCopy(s.command)} className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors shrink-0">
                    {copied === s.command ? <Check size={10} /> : <Copy size={10} />} {copied === s.command ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))}

            {/* Related Commands */}
            {result.matchedCommands.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-3"><BookOpen size={14} className="text-cyan-400" /> Related Commands</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.matchedCommands.map((cmd, i) => (
                    <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight size={10} className="text-cyan-400" />
                        <code className="text-xs font-mono text-white font-bold">{cmd.command}</code>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{cmd.category}</span>
                        {cmd.danger && <Shield size={10} className="text-amber-400" />}
                      </div>
                      <p className="text-xs text-slate-500 ml-4">{cmd.description}</p>
                      <p className="text-[10px] text-slate-600 font-mono ml-4 mt-1">{cmd.example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/40 py-4">
        <p className="text-center text-[10px] text-slate-600">ShellForge — Built with MiMo v2 • Next.js 15 • Tailwind CSS</p>
      </footer>
    </div>
  );
}
