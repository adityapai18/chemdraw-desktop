import { useEffect, useRef } from 'react'
import { XCircle, Loader2 } from 'lucide-react'
import type { CompoundRow } from '../types'

const STAGE_LABELS = [
  { label: 'CDX → CDXML', desc: 'Opening ChemDraw and converting file' },
  { label: 'Split Molecules', desc: 'Extracting individual structures' },
  { label: 'Process & Enrich', desc: 'RDKit + PubChem enrichment' }
]

interface Props {
  cdxPath: string
  currentStage: number
  stageMessage: string
  compounds: CompoundRow[]
  totalCompounds: number
  logs: { level: string; text: string }[]
  onCancel: () => void
}

export function ProcessingScreen({
  cdxPath, currentStage, stageMessage, compounds, totalCompounds, logs, onCancel
}: Props): JSX.Element {
  const logEndRef = useRef<HTMLDivElement>(null)
  const filename = cdxPath.split(/[\\/]/).pop()

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const matched = compounds.filter((c) => c.match === '✅').length
  const failed = compounds.filter((c) => c.match === '❌').length

  return (
    <div className="flex flex-col h-full px-6 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-white">Processing</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{filename}</p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-900/20"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>

      {/* Stages */}
      <div className="flex gap-2 shrink-0">
        {STAGE_LABELS.map((s, i) => {
          const stageNum = i + 1
          const state =
            currentStage > stageNum ? 'done' :
            currentStage === stageNum ? 'active' : 'pending'
          return (
            <div
              key={i}
              className={`flex-1 rounded-xl px-3 py-2.5 border transition-all duration-300 ${
                state === 'done' ? 'border-emerald-700/50 bg-emerald-900/20' :
                state === 'active' ? 'border-brand-500/60 bg-brand-900/20' :
                'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  state === 'done' ? 'bg-emerald-500 text-white' :
                  state === 'active' ? 'bg-brand-500 text-white' :
                  'bg-slate-700 text-slate-500'
                }`}>
                  {state === 'done' ? '✓' : stageNum}
                </div>
                {state === 'active' && <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />}
                <span className={`text-xs font-semibold ${
                  state === 'done' ? 'text-emerald-400' :
                  state === 'active' ? 'text-brand-300' :
                  'text-slate-600'
                }`}>{s.label}</span>
              </div>
              <p className={`text-[10px] leading-snug ${
                state === 'active' ? 'text-slate-400' : 'text-slate-600'
              }`}>{s.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Current operation */}
      {stageMessage && (
        <div className="shrink-0 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Loader2 className="w-3 h-3 text-brand-400 animate-spin shrink-0" />
          {stageMessage}
        </div>
      )}

      {/* Compound progress */}
      {totalCompounds > 0 && (
        <div className="shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Compounds: {compounds.length} / {totalCompounds}</span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">{matched} matched</span>
              {failed > 0 && <span className="text-red-400">{failed} unmatched</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (compounds.length / totalCompounds) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Live log */}
      <div className="flex-1 min-h-0 rounded-xl bg-[#080b10] border border-slate-800 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-slate-800 shrink-0">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Live Log</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed space-y-0.5">
          {logs.map((log, i) => (
            <p
              key={i}
              className={
                log.level === 'error' ? 'text-red-400' :
                log.level === 'warn' ? 'text-amber-400' :
                'text-slate-400'
              }
            >
              {log.text}
            </p>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
