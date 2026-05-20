import { AsciiEnginePanel } from './components/AsciiEnginePanel'
import { SnapSettingsDialog } from './components/dialogs/SnapSettingsDialog'
import { TypePropertiesDialog } from './components/dialogs/TypePropertiesDialog'
import { LeftPanel } from './components/LeftPanel'
import { OptionsBar } from './components/OptionsBar'
import { Ribbon } from './components/Ribbon'
import { StatusBar } from './components/StatusBar'
import { TitleBar } from './components/TitleBar'
import { ViewControlBar } from './components/ViewControlBar'
import { Viewport } from './components/Viewport'
import { useKeyboard } from './hooks/useKeyboard'

export default function App() {
  useKeyboard()

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-app)' }}>
      <TitleBar />
      <Ribbon />
      <OptionsBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <div className="flex min-w-0 flex-1 flex-col">
          <Viewport />
          <ViewControlBar />
        </div>
      </div>
      <StatusBar />
      <AsciiEnginePanel />
      <TypePropertiesDialog />
      <SnapSettingsDialog />
    </div>
  )
}
