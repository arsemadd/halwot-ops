export const unwrapData = <T>(payload: { data: T } | T): T =>
  payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: T }).data : payload as T

export const unwrapList = <T>(payload: unknown): T[] => {
  const inner = unwrapData(payload as { data: unknown })
  if (Array.isArray(inner)) return inner as T[]
  if (inner && typeof inner === 'object' && Array.isArray((inner as { data: T[] }).data)) {
    return (inner as { data: T[] }).data
  }
  return []
}
