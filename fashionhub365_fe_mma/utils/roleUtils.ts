/**
 * Utility functions for handling user roles in the mobile app.
 * Mirroring logic from the website's roleUtils.js
 */

const normalizeRole = (value: any) => String(value || "").trim().toLowerCase();

export const ADMIN_TIER_ROLE_SLUGS = new Set(["super-admin", "admin", "staff", "operator", "finance", "cs"]);
const SELLER_ROLE_SLUGS = new Set(["seller", "store-owner"]);

/**
 * Extracts all unique role slugs for a user from both 'role' and 'global_role_ids' fields.
 */
export const getUserRoleSlugs = (user: any): string[] => {
  if (!user) return [];
  
  const roles = new Set<string>();
  
  // 1. Check direct 'role' field (legacy/compatibility)
  const directRole = normalizeRole(user.role);
  if (directRole) roles.add(directRole);
  
  // 2. Check 'global_role_ids' which can be an array of IDs or populated objects
  const globalRoles = Array.isArray(user.global_role_ids) ? user.global_role_ids : [];
  globalRoles.forEach((roleLike: any) => {
    if (!roleLike) return;
    
    if (typeof roleLike === 'string') {
      // It's just an ID, we can't get the slug from it unless we have a lookup map.
      // However, usually the backend populates these for the 'me' request.
      const normalized = normalizeRole(roleLike);
      if (normalized) roles.add(normalized);
    } else {
      // It's a populated object (like { _id, slug, name ... })
      const slug = normalizeRole(roleLike.slug || roleLike.name || roleLike.code);
      if (slug) roles.add(slug);
    }
  });

  // 3. Normalize into high-level categories ('admin', 'seller')
  if (Array.from(roles).some(r => ADMIN_TIER_ROLE_SLUGS.has(r))) {
    roles.add("admin");
  }
  if (Array.from(roles).some(r => SELLER_ROLE_SLUGS.has(r))) {
    roles.add("seller");
  }

  // Fallback to 'user' if no roles found
  if (roles.size === 0) {
    roles.add("user");
  }

  return Array.from(roles);
};

/**
 * Check if the user has admin or seller privileges.
 */
export const isPrivilegedCommerceUser = (user: any): boolean => {
  const roles = getUserRoleSlugs(user);
  return roles.includes("admin") || roles.includes("seller");
};
