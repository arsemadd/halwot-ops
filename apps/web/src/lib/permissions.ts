export const hasPermission = (
  permissions: string[] | undefined,
  permission: string | string[],
): boolean => {
  if (!permissions?.length) return false
  const needed = Array.isArray(permission) ? permission : [permission]
  return needed.some((p) => permissions.includes(p))
}

export const isMemberOnly = (roles: string[] | undefined, permissions: string[] | undefined) => {
  if (!roles?.length) return false
  const staffRoles = ['Super Admin', 'Church Admin', 'Ministry Leader', 'Finance', 'Media/Asset Manager']
  const hasStaffRole = roles.some((role) => staffRoles.includes(role))
  if (hasStaffRole) return false
  return roles.includes('Member') || hasPermission(permissions, 'portal.access')
}
