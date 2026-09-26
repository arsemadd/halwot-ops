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
  <div className="flex gap-1 border-b border-border" role="tablist">
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
        'px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        isActive
          ? 'border-b-2 border-accent text-accent'
          : 'text-ink-muted hover:text-ink',
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
