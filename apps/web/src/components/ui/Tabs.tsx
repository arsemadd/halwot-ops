import clsx from 'clsx'
import { createContext, useContext, useState, type ReactNode } from 'react'

type TabsContextValue = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

type TabsProps = {
  defaultTab: string
  children: ReactNode
  className?: string
}

export const Tabs = ({ defaultTab, children, className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

type TabListProps = {
  children: ReactNode
}

export const TabList = ({ children }: TabListProps) => (
  <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-surface/70 p-1.5" role="tablist">
    {children}
  </div>
)

type TabProps = {
  value: string
  children: ReactNode
}

export const Tab = ({ value, children }: TabProps) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  const handleClick = () => setActiveTab(value)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveTab(value)
    }
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        isActive
          ? 'bg-accent text-white shadow-[0_6px_18px_rgba(244,121,32,0.35)]'
          : 'text-ink-muted hover:bg-accent-light hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

type TabPanelProps = {
  value: string
  children: ReactNode
  className?: string
}

export const TabPanel = ({ value, children, className }: TabPanelProps) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used within Tabs')

  if (context.activeTab !== value) return null

  return (
    <div role="tabpanel" className={clsx('pt-6', className)}>
      {children}
    </div>
  )
}
