import { createContext, useCallback, useContext, useMemo, useState } from "react"

const STORAGE_KEY = "fitouts-table-density"
const DEFAULT_DENSITY = "comfortable"

const DensityContext = createContext(null)

function readStoredDensity() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === "comfortable" || raw === "compact") return raw
  } catch {
    /* ignore quota / private mode */
  }
  return DEFAULT_DENSITY
}

function writeStoredDensity(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* ignore */
  }
}

function DensityProvider({ children }) {
  const [density, setDensityState] = useState(readStoredDensity)

  const setDensity = useCallback((next) => {
    const value = next === "compact" ? "compact" : "comfortable"
    setDensityState(value)
    writeStoredDensity(value)
  }, [])

  const toggleDensity = useCallback(() => {
    setDensityState((prev) => {
      const next = prev === "compact" ? "comfortable" : "compact"
      writeStoredDensity(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ density, setDensity, toggleDensity }),
    [density, setDensity, toggleDensity]
  )

  return (
    <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
  )
}

/** Throws if used outside DensityProvider. */
function useDensity() {
  const ctx = useContext(DensityContext)
  if (!ctx) {
    throw new Error("useDensity must be used within a DensityProvider")
  }
  return ctx
}

/** Returns null outside provider — safe for Table primitive. */
function useDensityOptional() {
  return useContext(DensityContext)
}

export {
  DensityProvider,
  useDensity,
  useDensityOptional,
  DEFAULT_DENSITY,
  STORAGE_KEY,
}
