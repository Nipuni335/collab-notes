// src/hooks/useDebounce.js
import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

// src/hooks/useAutoSave.js — kept in same file for brevity, export separately
import { useEffect, useRef, useCallback } from "react";

/**
 * useAutoSave — calls saveFn after `delay` ms of inactivity.
 * Returns a { saving } state and a manual `save` trigger.
 */
export const useAutoSave = (value, saveFn, delay = 1500) => {
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // keep track of mount state to avoid setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!saveFn) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      setSaving(true);
      try {
        await saveFn(value);
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, saveFn, delay]);

  const save = useCallback(async () => {
    if (!saveFn) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaving(true);
    try { await saveFn(value); }
    finally { if (mountedRef.current) setSaving(false); }
  }, [saveFn, value]);

  return { saving, save };
};
