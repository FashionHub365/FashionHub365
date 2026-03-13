const normalizeRole = (value) => String(value || "").trim().toLowerCase();

export const ADMIN_TIER_ROLE_SLUGS = new Set(["super-admin", "admin", "staff", "operator", "finance", "cs"]);
const SELLER_ROLE_SLUGS = new Set(["seller", "store-owner"]);

const isObject = (value) => typeof value === "object" && value !== null;
const isMongoIdLike = (value) => /^[a-f0-9]{24}$/i.test(String(value || ""));

const getRoleSlug = (roleLike, roleById = new Map()) => {
  if (isObject(roleLike)) {
    return normalizeRole(roleLike.slug || roleLike.name || roleLike.code);
  }
  if (typeof roleLike === "string") {
    const normalized = normalizeRole(roleLike);
    if (!normalized) return "";
    if (isMongoIdLike(normalized)) {
      return normalizeRole(roleById.get(normalized)?.slug);
    }
    return normalized;
  }
  return "";
};

export const extractRawRoleSlugs = (user, roleById = new Map()) => {
  const roles = new Set();
  const directRole = normalizeRole(user?.role);
  if (directRole) roles.add(directRole);

  const globalRoles = Array.isArray(user?.global_role_ids) ? user.global_role_ids : [];
  globalRoles.forEach((roleLike) => {
    const slug = getRoleSlug(roleLike, roleById);
    if (slug) roles.add(slug);
  });

  return Array.from(roles);
};

export const extractRoleIdsFromUser = (user, roleBySlug = new Map()) => {
  const roleIds = new Set();
  const directRole = normalizeRole(user?.role);
  if (directRole && roleBySlug.has(directRole)) {
    roleIds.add(roleBySlug.get(directRole)._id);
  }

  const globalRoles = Array.isArray(user?.global_role_ids) ? user.global_role_ids : [];
  globalRoles.forEach((roleLike) => {
    if (isObject(roleLike) && roleLike._id) {
      roleIds.add(roleLike._id);
      return;
    }

    if (typeof roleLike !== "string") return;
    const normalized = normalizeRole(roleLike);
    if (!normalized) return;

    if (isMongoIdLike(normalized)) {
      roleIds.add(normalized);
      return;
    }

    if (roleBySlug.has(normalized)) {
      roleIds.add(roleBySlug.get(normalized)._id);
    }
  });

  return Array.from(roleIds);
};

export const getUserRoleSlugs = (user) => {
  if (!user) return [];
  const roles = new Set(extractRawRoleSlugs(user));

  const normalizedList = Array.from(roles);
  if (normalizedList.some((role) => ADMIN_TIER_ROLE_SLUGS.has(role))) {
    roles.add("admin");
  }
  if (normalizedList.some((role) => SELLER_ROLE_SLUGS.has(role))) {
    roles.add("seller");
  }
  if (roles.size === 0) {
    roles.add("user");
  }
  return Array.from(roles);
};

export const hasAnyRole = (user, allowedRoles = []) => {
  const allowed = new Set((allowedRoles || []).map((role) => normalizeRole(role)));
  const userRoles = getUserRoleSlugs(user);
  return userRoles.some((role) => allowed.has(normalizeRole(role)));
};

export const getDefaultRouteByRole = (user) => {
  const roles = getUserRoleSlugs(user);
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("seller")) return "/seller/dashboard";
  return "/";
};

export const getAccountType = (roleSlugs) => {
  if (roleSlugs.includes("super-admin")) return "SUPER_ADMIN";
  if (roleSlugs.some((role) => ADMIN_TIER_ROLE_SLUGS.has(role))) return "ADMIN";
  if (roleSlugs.some((role) => SELLER_ROLE_SLUGS.has(role))) return "SELLER";
  return "USER";
};

export const getStatusDisplay = (statusStr) => {
  const s = `${statusStr || ""}`.toUpperCase();
  if (s === "ACTIVE") return { color: "bg-emerald-500", text: "Active" };
  if (s === "BANNED" || s === "LOCKED") return { color: "bg-amber-500", text: "Temporarily Locked" };
  if (s === "DELETED") return { color: "bg-rose-500", text: "Soft Deleted" };
  return { color: "bg-slate-300", text: "Not Activated" };
};
