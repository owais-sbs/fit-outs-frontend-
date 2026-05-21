import { createContext, useContext, useState, useCallback } from "react";
import { ROLES, ROLE_PERMISSIONS } from "../constants/roles";

const AuthContext = createContext(null);

const initialState = {
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialState);

  const login = useCallback(async (credentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Mock API call response
      const response = {
        user: { name: credentials.email.split("@")[0], email: credentials.email },
        role: credentials.role || null,
      };
      setAuthState({
        user: response.user,
        role: response.role,
        permissions: response.role ? ROLE_PERMISSIONS[response.role] || [] : [],
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const selectRole = useCallback((role) => {
    setAuthState((prev) => ({
      ...prev,
      role: role,
      permissions: ROLE_PERMISSIONS[role] || [],
      isAuthenticated: true, // Ensure authenticated when role is selected
      user: prev.user || { name: "Demo User", email: "demo@onepath.com" },
    }));
  }, []);

  const logout = useCallback(() => {
    setAuthState(initialState);
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (authState.role === ROLES.SUPER_ADMIN) return true;
      return authState.permissions.includes(permission);
    },
    [authState.role, authState.permissions]
  );

  const hasRole = useCallback(
    (role) => {
      return authState.role === role;
    },
    [authState.role]
  );

  const value = {
    ...authState,
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
