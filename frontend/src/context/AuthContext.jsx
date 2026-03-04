// src/context/AuthContext.jsx
// Global auth state — exposes user, loading flag, and auth actions.
// Token stored in HTTP-only cookie (primary) + localStorage (Bearer fallback).

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

const initialState = { user: null, loading: true, error: null };

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":     return { ...state, user: action.payload, loading: false, error: null };
    case "CLEAR_USER":   return { ...state, user: null, loading: false, error: null };
    case "SET_LOADING":  return { ...state, loading: action.payload };
    case "SET_ERROR":    return { ...state, error: action.payload, loading: false };
    default:             return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Bootstrap: check session on mount ──────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await authAPI.getMe();
        dispatch({ type: "SET_USER", payload: data.user });
      } catch {
        dispatch({ type: "CLEAR_USER" });
      }
    };
    bootstrap();
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const { data } = await authAPI.register(formData);
    localStorage.setItem("token", data.token);
    dispatch({ type: "SET_USER", payload: data.user });
    return data;
  }, []);

  const login = useCallback(async (formData) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const { data } = await authAPI.login(formData);
    localStorage.setItem("token", data.token);
    dispatch({ type: "SET_USER", payload: data.user });
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout().catch(() => {}); // always clear locally
    localStorage.removeItem("token");
    dispatch({ type: "CLEAR_USER" });
  }, []);

  const updateProfile = useCallback(async (formData) => {
    const { data } = await authAPI.updateProfile(formData);
    dispatch({ type: "SET_USER", payload: data.user });
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
