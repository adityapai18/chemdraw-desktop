import { useRef, useState } from 'react'
import { FileUp, FolderOpen, Play, FlaskConical, AlertTriangle } from 'lucide-react'

interface Props {
  cdxPath: string | null
  outputDir: string | null
  chemDrawAvailable: boolean | null
  onSelectCdx: () => void
  onSelectOutput: () => void
  onStart: () => void
}

export function HomeScreen({ cdxPath, outputDir, chemDrawAvailable, onSelectCdx, onSelectOutput, onStart }: Props): JSX.Element {
  const [dragging, setDragging] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const filename = cdxPath ? cdxPath.split(/[\\/]/).pop() : null
  const canStart = !!cdxPath && !!outputDir && chemDrawAvailable !== false

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (): void => setDragging(false)

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.toLowerCase().endsWith('.cdx')) {
      // Electron gives us the path via the File object's path property
      const path = (file as { path?: string }).path
      if (path) {
        // Trigger re-render via custom event since we can't call setCdxPath directly
        // The parent already wired onSelectCdx but for drag-drop we need a different mechanism.
        // We'll just click the button programmatically — but here we have direct file path.
        // Pass up via a synthetic mechanism.
        window.dispatchEvent(new CustomEvent('cdx-dropped', { detail: path }))
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">
      {/* Hero */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 rounded-2xl bg-brand-600/20 border border-brand-500/30">
            <FlaskConical className="w-10 h-10 text-brand-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">ChemDraw Processor</h1>
        <p className="text-slate-400 text-sm max-w-md">
          Drop a ChemDraw file (.cdx) to extract molecular structures, generate SMILES, and enrich with PubChem data — all in one click.
        </p>
      </div>

      {/* Warning if ChemDraw not found */}
      {chemDrawAvailable === false && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-sm max-w-lg w-full">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>ChemDraw is not installed or not detectable. Stage 1 (CDX → CDXML) and Stage 3 (MOL export) require ChemDraw.</span>
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-lg space-y-3">
        {/* Drop zone */}
        <div
          ref={dropRef}
          onClick={onSelectCdx}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8
            flex flex-col items-center justify-center gap-3 group
            ${dragging
              ? 'border-brand-400 bg-brand-500/10'
              : cdxPath
                ? 'border-emerald-500/60 bg-emerald-900/10'
                : 'border-slate-700 bg-slate-900/50 hover:border-brand-500/60 hover:bg-brand-900/10'
            }
          `}
        >
          <FileUp className={`w-8 h-8 transition-colors ${cdxPath ? 'text-emerald-400' : 'text-slate-500 group-hover:text-brand-400'}`} />
          {cdxPath ? (
            <>
              <p className="text-sm font-semibold text-emerald-300">{filename}</p>
              <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{cdxPath}</p>
              <p className="text-xs text-slate-600">Click to change file</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-300">Drop your .cdx file here</p>
              <p className="text-xs text-slate-500">or click to browse</p>
            </>
          )}
        </div>

        {/* Output folder */}
        <button
          onClick={onSelectOutput}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left
            ${outputDir
              ? 'border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-500'
              : 'border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-600 hover:text-slate-400'
            }
          `}
        >
          <FolderOpen className={`w-4 h-4 shrink-0 ${outputDir ? 'text-amber-400' : 'text-slate-600'}`} />
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Output folder</p>
            <p className="text-sm font-medium truncate">
              {outputDir ? outputDir : 'Select where to save results…'}
            </p>
          </div>
        </button>

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${canStart
              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/40 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }
          `}
        >
          <Play className="w-4 h-4" />
          Start Processing
        </button>

        {!cdxPath && (
          <p className="text-center text-xs text-slate-600">Select a .cdx file and output folder to begin</p>
        )}
        {cdxPath && !outputDir && (
          <p className="text-center text-xs text-amber-600">Choose an output folder to continue</p>
        )}
      </div>
    </div>
  )
}
