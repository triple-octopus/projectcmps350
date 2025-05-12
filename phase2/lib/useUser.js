"use client";

import useSWR from "swr";

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: "same-origin" });
  const text = await res.text();
  if (!text) return null;            // empty body → not signed in
  try {
    return JSON.parse(text);
  } catch {
    return null;                      // non‐JSON → treat as not signed in
  }
};

export default function useUser() {
  // data === undefined while loading, null if no user, or user object
  const { data } = useSWR("/api/auth/me", fetcher);
  return data;
}
