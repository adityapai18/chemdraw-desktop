import { useState, useEffect, useRef } from 'react'
import type { AppScreen, CompoundRow, PipelineEvent } from './types'
import { HomeScreen } from './components/HomeScreen'
import { ProcessingScreen } from './components/ProcessingScreen'
import { ResultsScreen } from './components/ResultsScreen'

declare global {
  interface Window {
    api: {
      selectCdxFile: () => Promise<string | null>
      selectOutputFolder: () => Promise<string | null>
      openPath: (p: string) => Promise<void>
      checkChemDraw: () => Promise<{ available: boolean; version?: string }>
      startProcessing: (cdxPath: string, outputDir: string) => Promise<void>
      cancelProcessing: () => Promise<void>
      onPipelineEvent: (cb: (e: PipelineEvent) => void) => () => void
    }
  }
}

export default function App(): JSX.Element {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [cdxPath, setCdxPath] = useState<string | null>(null)
  const [outputDir, setOutputDir] = useState<string | null>(null)
  const [chemDrawAvailable, setChemDrawAvailable] = useState<boolean | null>(null)

  // Processing state
  const [currentStage, setCurrentStage] = useState(0)
  const [stageMessage, setStageMessage] = useState('')
  const [compounds, setCompounds] = useState<CompoundRow[]>([])
  const [totalCompounds, setTotalCompounds] = useState(0)
  const [logs, setLogs] = useState<{ level: string; text: string }[]>([])

  // Results state
  const [excelPath, setExcelPath] = useState<string | null>(null)
  const [finalOutputDir, setFinalOutputDir] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    window.api.checkChemDraw().then((r) => setChemDrawAvailable(r.available))
  }, [])

  const addLog = (level: string, text: string): void => {
    setLogs((prev) => [...prev.slice(-300), { level, text }])
  }

  const handleStart = async (): Promise<void> => {
    if (!cdxPath || !outputDir) return

    setScreen('processing')
    setCurrentStage(0)
    setStageMessage('')
    setCompounds([])
    setTotalCompounds(0)
    setLogs([])
    setExcelPath(null)
    setFinalOutputDir(null)
    setErrorMessage(null)

    unsubRef.current = window.api.onPipelineEvent((event: PipelineEvent) => {
      switch (event.type) {
        case 'stage':
          setCurrentStage(event.stage)
          setStageMessage(event.message)
          addLog('info', `[Stage ${event.stage}/${event.total}] ${event.message}`)
          break
        case 'compound':
          setTotalCompounds(event.total)
          setCompounds((prev) => [...prev, { name: event.name, match: event.match, index: event.index }])
          addLog('info', `  ${event.match}  ${event.name}`)
          break
        case 'log':
          addLog(event.level, event.message)
          break
        case 'result':
          setExcelPath(event.excelPath)
          setFinalOutputDir(event.outputDir)
          setScreen('results')
          break
        case 'error':
          setErrorMessage(event.message)
          setScreen('results')
          break
      }
    })

    try {
      await window.api.startProcessing(cdxPath, outputDir)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
      setScreen('results')
    } finally {
      unsubRef.current?.()
    }
  }

  const handleCancel = async (): Promise<void> => {
    await window.api.cancelProcessing()
    unsubRef.current?.()
    setScreen('home')
  }

  const handleReset = (): void => {
    setScreen('home')
    setCdxPath(null)
    setCompounds([])
    setLogs([])
  }

  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-slate-200">
      {/* Titlebar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 shrink-0 select-none">
        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_theme(colors.brand.500)]" />
        <span className="text-sm font-semibold tracking-wide text-slate-300">ChemDraw Processor</span>
        {chemDrawAvailable === true && (
          <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            ChemDraw detected
          </span>
        )}
        {chemDrawAvailable === false && (
          <span className="ml-auto text-xs text-red-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
            ChemDraw not found
          </span>
        )}
      </div>

      {/* Screen */}
      <div className="flex-1 min-h-0">
        {screen === 'home' && (
          <HomeScreen
            cdxPath={cdxPath}
            outputDir={outputDir}
            chemDrawAvailable={chemDrawAvailable}
            onSelectCdx={async () => {
              const p = await window.api.selectCdxFile()
              if (p) setCdxPath(p)
            }}
            onSelectOutput={async () => {
              const p = await window.api.selectOutputFolder()
              if (p) setOutputDir(p)
            }}
            onStart={handleStart}
          />
        )}
        {screen === 'processing' && (
          <ProcessingScreen
            cdxPath={cdxPath!}
            currentStage={currentStage}
            stageMessage={stageMessage}
            compounds={compounds}
            totalCompounds={totalCompounds}
            logs={logs}
            onCancel={handleCancel}
          />
        )}
        {screen === 'results' && (
          <ResultsScreen
            excelPath={excelPath}
            outputDir={finalOutputDir}
            compounds={compounds}
            errorMessage={errorMessage}
            onOpenExcel={() => excelPath && window.api.openPath(excelPath)}
            onOpenFolder={() => finalOutputDir && window.api.openPath(finalOutputDir)}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}
