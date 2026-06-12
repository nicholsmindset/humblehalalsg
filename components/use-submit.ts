"use client";

import { useState } from "react";

/* Shared submission plumbing for the intake forms (suggest / claim / report /
   add-listing / host-event). Mirrors the newsletter form's status handling:
   success navigation only happens when the API confirms, otherwise the form
   stays put and shows an inline error. */

export type SubmissionBody = {
  type: "suggest" | "claim" | "report" | "listing" | "event";
  listingRef?: string;
  name?: string;
  email?: string;
  phone?: string;
  payload?: Record<string, unknown>;
  filePaths?: string[];
};

export function useSubmission() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(body: SubmissionBody): Promise<boolean> {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return true;
      setError(data.error || "Something went wrong — please try again");
      return false;
    } catch {
      setError("Network error — please check your connection and try again");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, error, submit, clearError: () => setError("") };
}

/** Uploads a file via a signed URL from /api/uploads.
    Returns the storage path, or null with an error message. */
export async function uploadFile(file: File): Promise<{ path: string | null; error?: string }> {
  if (file.size > 5 * 1024 * 1024) return { path: null, error: "File must be under 5MB" };
  try {
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, size: file.size }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { path: null, error: data.error || "Upload failed" };
    // Dev without storage configured — accept the form without the attachment.
    if (data.simulated || !data.uploadUrl) return { path: null };
    const up = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!up.ok) return { path: null, error: "Upload failed — please try again" };
    return { path: data.path };
  } catch {
    return { path: null, error: "Upload failed — please try again" };
  }
}
