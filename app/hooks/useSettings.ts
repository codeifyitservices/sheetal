"use client";
import { useState, useEffect } from "react";
import { getSettings } from "../services/settingsService";

let cachedSettings: any = null;
let promise: Promise<any> | null = null;

export const useSettings = (initialSettings?: any) => {
  if (initialSettings && !cachedSettings) {
    cachedSettings = initialSettings;
  }
  const [settings, setSettings] = useState<any>(initialSettings || cachedSettings);
  const [loading, setLoading] = useState(!initialSettings && !cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setLoading(false);
      return;
    }

    if (!promise) {
      promise = getSettings().then((data) => {
        cachedSettings = data;
        return data;
      });
    }

    promise.then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
};
