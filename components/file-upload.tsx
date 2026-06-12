"use client";

import { useRef, useState } from "react";
import { Icon } from "./ui";
import { uploadFile } from "./use-submit";

/* Real file picker behind the design's .upload-zone. Uploads immediately via
   /api/uploads (signed URL into the private `uploads` bucket) and reports the
   stored paths up to the parent form. */
export function FileUpload({
  label = "Upload file",
  hint,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  multiple = false,
  onChange,
}: {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onChange: (paths: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const nextPaths = multiple ? [...paths] : [];
    const nextNames = multiple ? [...names] : [];
    for (const file of Array.from(files).slice(0, 10)) {
      const { path, error: err } = await uploadFile(file);
      if (err) {
        setError(err);
        continue;
      }
      // path is null in dev without storage — still show the file as attached.
      if (path) nextPaths.push(path);
      nextNames.push(file.name);
    }
    setPaths(nextPaths);
    setNames(nextNames);
    onChange(nextPaths);
    setBusy(false);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="upload-zone"
        style={{ width: "100%", cursor: "pointer" }}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <Icon name="upload" size={24} />
        <div style={{ fontWeight: 700, marginTop: 6 }}>{busy ? "Uploading…" : label}</div>
        {hint && <p className="faint" style={{ fontSize: ".8rem" }}>{hint}</p>}
        {names.length > 0 && (
          <p className="faint" style={{ fontSize: ".82rem", marginTop: 6 }}>
            <Icon name="check" size={13} /> {names.join(", ")}
          </p>
        )}
      </button>
      {error && (
        <span className="field-error" style={{ marginTop: 6 }}>
          <Icon name="warning" size={13} /> {error}
        </span>
      )}
    </div>
  );
}
