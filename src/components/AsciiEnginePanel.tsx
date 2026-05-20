import { useState } from 'react'
import { runASCIIEngine, type ASCIIMode } from '../ascii-engine/runASCIIEngine'
import { useProjectStore } from '../store/projectStore'

export function AsciiEnginePanel() {
  const open = useProjectStore((s) => s.asciiPanelOpen)
  const setOpen = useProjectStore((s) => s.setAsciiPanelOpen)
  const model = useProjectStore((s) => s.model)
  const [output, setOutput] = useState('')
  const [stats, setStats] = useState({ chars: 0, lines: 0, tokens: 0 })
  const [mode, setMode] = useState<ASCIIMode>('dense')
  const [cellSizeMm, setCellSizeMm] = useState(500)

  if (!open) return null

  const generate = () => {
    const result = runASCIIEngine(model, {
      mode,
      cellSizeMm,
      width: 64,
      height: 32,
    })
    setOutput(result.text)
    setStats({ chars: result.chars, lines: result.lines, tokens: result.tokens })
  }

  const download = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name.replace(/\s+/g, '_')}_ascii.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l shadow-xl"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-panel)',
        }}
      >
        <header
          className="flex items-center justify-between border-b px-3 py-2"
          style={{ borderColor: 'var(--border-panel)' }}
        >
          <span className="font-semibold">ASCII Engine</span>
          <button
            type="button"
            className="hover:text-[var(--accent)]"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </header>
        <div className="space-y-2 border-b p-3" style={{ borderColor: 'var(--border-panel)' }}>
          <label className="block text-xs">
            Mode
            <select
              className="mt-0.5 w-full rounded border px-1 py-0.5"
              value={mode}
              onChange={(e) => setMode(e.target.value as ASCIIMode)}
            >
              <option value="dense">Dense ASCII</option>
              <option value="lightweight">Lightweight ASCII</option>
              <option value="training">Training (tokens)</option>
              <option value="symbolic">Symbolic (Unicode)</option>
            </select>
          </label>
          <label className="block text-xs">
            Scale
            <select
              className="mt-0.5 w-full rounded border px-1 py-0.5"
              value={cellSizeMm}
              onChange={(e) => setCellSizeMm(Number(e.target.value))}
            >
              <option value={500}>Cell = 500mm</option>
              <option value={1000}>Cell = 1000mm</option>
            </select>
          </label>
          <button
            type="button"
            className="w-full rounded py-1 text-xs hover:bg-[var(--btn-active)]"
            style={{ background: 'var(--btn-active)', border: '1px solid var(--btn-active-border)' }}
            onClick={generate}
          >
            Generate
          </button>
        </div>
        <pre
          className="flex-1 overflow-auto p-2 font-mono text-[10px] leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {output || '(click Generate — export only, does not affect canvas)'}
        </pre>
        <footer
          className="flex items-center justify-between border-t p-2 text-[10px]"
          style={{ borderColor: 'var(--border-panel)', color: 'var(--text-secondary)' }}
        >
          <span>
            Chars: {stats.chars} Lines: {stats.lines} Tokens: ~{stats.tokens}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border px-2 py-0.5 hover:bg-[var(--btn-hover)]"
              style={{ borderColor: 'var(--border-panel)' }}
              onClick={() => navigator.clipboard.writeText(output)}
              disabled={!output}
            >
              Copy
            </button>
            <button
              type="button"
              className="rounded border px-2 py-0.5 hover:bg-[var(--btn-hover)]"
              style={{ borderColor: 'var(--border-panel)' }}
              onClick={download}
              disabled={!output}
            >
              Download .txt
            </button>
          </div>
        </footer>
      </aside>
    </>
  )
}
