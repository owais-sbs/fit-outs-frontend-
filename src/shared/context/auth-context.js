import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ROLES, ROLE_PERMISSIONS } from "../constants/roles";
import axiosInstance from "@/lib/axiosInstance";

const AuthContext = createContext(null);

const VALID_PORTAL_ROLES = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.BUSINESS_OWNER,
  ROLES.PROJECT_MANAGER,
  ROLES.DESIGNER,
  ROLES.QAS,
  ROLES.QS,
  ROLES.SENIOR_QS,
  ROLES.FINANCE,
  ROLES.SUBCONTRACTOR,
  ROLES.CLIENT,
  ROLES.SALES,
  ROLES.EMPLOYEE,
  ROLES.SITE_ENGINEER,
]);

function normalizeRole(role) {
  if (typeof role === "string") return role.toLowerCase().replace(/_/g, "-");
  if (role && typeof role === "object") {
    if (typeof role.name === "string") return normalizeRole(role.name);
    if (typeof role.value === "string") return normalizeRole(role.value);
  }
  return String(role ?? "").toLowerCase().replace(/_/g, "-");
}

async function fetchCurrentUser() {
  const { data } = await axiosInstance.get("/auth/me");
  return data?.data ?? null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyUserSession = (userData) => {
      const rawRoles = userData.roles || [];
      const normalizedRoles = rawRoles.map(normalizeRole);

      setUser({
        id: userData.id,
        name: userData.fullName,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        companyId: userData.companyId,
        companyName: userData.companyName,
        roles: normalizedRoles,
      });
      setRoles(normalizedRoles);

      const validRoles = normalizedRoles.filter((r) => VALID_PORTAL_ROLES.has(r));
      if (validRoles.length > 0) {
        const savedRole = localStorage.getItem("selectedRole");
        if (savedRole && validRoles.includes(savedRole)) {
          setRole(savedRole);
          setPermissions(ROLE_PERMISSIONS[savedRole] || []);
        } else if (validRoles.length === 1) {
          const singleRole = validRoles[0];
          setRole(singleRole);
          setPermissions(ROLE_PERMISSIONS[singleRole] || []);
          localStorage.setItem("selectedRole", singleRole);
        } else {
          setRole(null);
          setPermissions([]);
        }
        setIsAuthenticated(true);
      } else {
        setRole(null);
        setPermissions([]);
        setIsAuthenticated(false);
      }
    };

    const checkSession = async () => {
      try {
        let userData = null;
        try {
          userData = await fetchCurrentUser();
        } catch (error) {
          if (!error.response || error.response.status >= 500) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            userData = await fetchCurrentUser();
          } else if (error.response.status === 400 || error.response.status === 401) {
            userData = null;
          } else {
            throw error;
          }
        }

        if (cancelled) return;

        if (userData) {
          applyUserSession(userData);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Session check failed:", error);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      const responseData = data?.data;
      if (!responseData || responseData.status !== "AUTHENTICATED") {
        throw new Error(responseData?.message || "Login failed");
      }

      const token = responseData.token || responseData.accessToken || responseData.jwt || responseData.jwtToken;
      if (token) {
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
      }

      const userData = responseData.user;
      const rawRoles = userData?.roles || [];
      const normalizedRoles = rawRoles.map(normalizeRole);

      setUser({
        id: userData.id,
        name: userData.fullName,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        companyId: userData.companyId,
        companyName: userData.companyName,
        roles: normalizedRoles,
      });
      setRoles(normalizedRoles);

      const validRoles = normalizedRoles.filter((r) => VALID_PORTAL_ROLES.has(r));

      if (validRoles.length === 0) {
        setIsLoading(false);
        setPermissions([]);
        setRole(null);
        setIsAuthenticated(false);
        return { noValidRole: true, message: "Your account does not have access to any available portal." };
      }

      if (validRoles.length === 1) {
        const singleRole = validRoles[0];
        setRole(singleRole);
        setPermissions(ROLE_PERMISSIONS[singleRole] || []);
        setIsAuthenticated(true);
        localStorage.setItem("selectedRole", singleRole);
        setIsLoading(false);
        return { singleRole, user: userData };
      }

      setRole(null);
      setPermissions([]);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { multipleRoles: true, roles: validRoles, user: userData };
    } catch (error) {
      setIsLoading(false);
      const message = error?.response?.data?.message || error.message || "Login failed";
      throw new Error(message);
    }
  }, []);

  const selectRole = useCallback((selectedRole) => {
    const normalized = normalizeRole(selectedRole);
    setRole(normalized);
    setPermissions(ROLE_PERMISSIONS[normalized] || []);
    setIsAuthenticated(true);
    localStorage.setItem("selectedRole", normalized);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      // ignore
    }
    setUser(null);
    setRole(null);
    setRoles([]);
    setPermissions([]);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("selectedRole");
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (role === ROLES.SUPER_ADMIN) return true;
      return permissions.includes(permission);
    },
    [role, permissions]
  );

  const hasRole = useCallback(
    (targetRole) => role === normalizeRole(targetRole),
    [role]
  );

  const value = {
    user,
    role,
    roles,
    permissions,
    isAuthenticated,
    isLoading,
    login,
    selectRole,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
