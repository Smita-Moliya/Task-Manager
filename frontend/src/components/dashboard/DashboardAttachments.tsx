import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { Attachment } from "../../types/dashboard";

type DuplicateConflict = {
  existing_attachment_id: number;
  file_name: string;
};

export default function DashboardAttachments({ taskId }: { taskId: number }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [showDuplicateBox, setShowDuplicateBox] = useState(false);
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);

  async function load() {
    try {
      const res = await api.get(`/tasks/${taskId}/attachments/`);
      setItems(res.data?.attachments || []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load attachments");
    }
  }

  useEffect(() => {
    setMsg("");
    load();
  }, [taskId]);

  async function doUpload(duplicateAction?: "keep" | "replace") {
    if (!file) {
      setMsg("Please choose a file");
      return;
    }

    setMsg("");
    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("files", file);

      if (duplicateAction) {
        fd.append("duplicate_action", duplicateAction);
      }

      const res = await api.post(`/tasks/${taskId}/attachments/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg(res.data?.message || "Uploaded ✅");
      setFile(null);
      setShowDuplicateBox(false);
      setDuplicateConflicts([]);
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      if (status === 409 && data?.duplicate) {
        setShowDuplicateBox(true);
        setDuplicateConflicts(data?.conflicts || []);
        setMsg(data?.message || "File already exists");
      } else {
        setShowDuplicateBox(false);
        setDuplicateConflicts([]);
        setMsg(data?.message || "Upload failed");
      }
    } finally {
      setBusy(false);
    }
  }

  function cancelDuplicateFlow() {
    setShowDuplicateBox(false);
    setDuplicateConflicts([]);
    setMsg("Upload cancelled");
  }

  return (
    <div>
      {msg ? (
        <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>
          {msg}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setShowDuplicateBox(false);
            setDuplicateConflicts([]);
            setMsg("");
          }}
        />

        <button className="btn" onClick={() => doUpload()} disabled={busy}>
          {busy ? "Uploading..." : "Upload"}
        </button>

        <button className="btn" onClick={load} disabled={busy}>
          Refresh
        </button>
      </div>

      {showDuplicateBox ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff8e8",
          }}
        >
          <div style={{ marginBottom: 10, fontWeight: 600 }}>
            This file already exists. Do you want to keep both files or replace the existing one?
          </div>

          {duplicateConflicts.length > 0 ? (
            <ul style={{ marginTop: 0, paddingLeft: 18 }}>
              {duplicateConflicts.map((c) => (
                <li key={c.existing_attachment_id}>{c.file_name}</li>
              ))}
            </ul>
          ) : null}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn" onClick={() => doUpload("keep")} disabled={busy}>
              Keep both
            </button>

            <button className="btn" onClick={() => doUpload("replace")} disabled={busy}>
              Replace
            </button>

            <button className="btn" onClick={cancelDuplicateFlow} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 10 }}>
        {items.length === 0 ? (
          <div className="muted">No attachments</div>
        ) : (
          <ul>
            {items.map((a) => (
              <li key={a.id}>
                <a
                  href={`http://127.0.0.1:8000${a.download_url}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.original_name}
                </a>
                {a.uploaded_at ? <span className="muted"> • {a.uploaded_at}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}