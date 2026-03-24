import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiFile,
  FiFileText,
  FiImage,
  FiPaperclip,
  FiRefreshCw,
  FiUpload,
  FiXCircle,
} from "react-icons/fi";
import { api } from "../../api/api";
import { Attachment } from "../../types/dashboard";

type DuplicateConflict = {
  existing_attachment_id: number;
  file_name: string;
};

export default function TaskAttachments({
  taskId,
  reloadKey,
  onUploaded,
}: {
  taskId: number;
  reloadKey: number;
  onUploaded: () => void;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [showDuplicateBox, setShowDuplicateBox] = useState(false);
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);

  async function load() {
    setMsg("");
    try {
      const res = await api.get(`/tasks/${taskId}/attachments/`);
      setItems(res.data?.attachments || []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load attachments");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, reloadKey]);

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

      const res = await api.post(`/tasks/${taskId}/attachments/`, fd);

      setMsg(res.data?.message || "Uploaded ✅");
      setFile(null);
      setShowDuplicateBox(false);
      setDuplicateConflicts([]);

      await load();
      onUploaded();
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

  function getFileIcon(name?: string) {
    const value = (name || "").toLowerCase();

    if (
      value.endsWith(".png") ||
      value.endsWith(".jpg") ||
      value.endsWith(".jpeg") ||
      value.endsWith(".gif") ||
      value.endsWith(".webp") ||
      value.endsWith(".svg")
    ) {
      return <FiImage />;
    }

    if (
      value.endsWith(".pdf") ||
      value.endsWith(".doc") ||
      value.endsWith(".docx") ||
      value.endsWith(".txt")
    ) {
      return <FiFileText />;
    }

    return <FiFile />;
  }

  return (
    <div className="taskModalAttachments">
      {msg ? (
        <div
          className={`taskModalInlineAlert ${
            msg.includes("✅") ? "success" : "error"
          }`}
        >
          {msg}
        </div>
      ) : null}

      <div className="taskModalUploadPanel">
        <div className="taskModalUploadLeft">
          <label className="taskModalFilePicker">
            <input
              type="file"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setShowDuplicateBox(false);
                setDuplicateConflicts([]);
                setMsg("");
              }}
            />
            <span className="taskModalFilePickerBtn">
              <FiPaperclip />
              Choose File
            </span>
            <span className="taskModalFileName">
              {file ? file.name : "No file selected"}
            </span>
          </label>
        </div>

        <button
          type="button"
          className="taskModalPrimaryBtn"
          onClick={() => doUpload()}
          disabled={busy}
        >
          {busy ? (
            <>
              <FiRefreshCw className="spin" />
              Uploading...
            </>
          ) : (
            <>
              <FiUpload />
              Upload
            </>
          )}
        </button>
      </div>

      {showDuplicateBox ? (
        <div className="taskModalDuplicateBox">
          <div className="taskModalDuplicateHead">
            <span className="taskModalDuplicateIcon">
              <FiAlertTriangle />
            </span>
            <div>
              <h4>Duplicate file detected</h4>
              <p>
                This file already exists. Choose whether to keep both files or
                replace the existing one.
              </p>
            </div>
          </div>

          {duplicateConflicts.length > 0 ? (
            <div className="taskModalDuplicateList">
              {duplicateConflicts.map((c) => (
                <div
                  key={c.existing_attachment_id}
                  className="taskModalDuplicateItem"
                >
                  <FiFile />
                  <span>{c.file_name}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="taskModalDuplicateActions">
            <button
              type="button"
              className="taskModalPrimaryBtn"
              onClick={() => doUpload("keep")}
              disabled={busy}
            >
              Keep both
            </button>

            <button
              type="button"
              className="taskModalSecondaryBtn"
              onClick={() => doUpload("replace")}
              disabled={busy}
            >
              <FiRefreshCw />
              Replace
            </button>

            <button
              type="button"
              className="taskModalGhostBtn"
              onClick={cancelDuplicateFlow}
              disabled={busy}
            >
              <FiXCircle />
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="taskModalListWrap">
        {items.length === 0 ? (
          <div className="taskModalEmptyState">No attachments uploaded yet.</div>
        ) : (
          <div className="taskModalAttachmentList">
            {items.map((a) => (
              <a
                key={a.id}
                className="taskModalAttachmentItem"
                href={`http://127.0.0.1:8000${a.download_url}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="taskModalAttachmentIcon">
                  {getFileIcon(a.original_name)}
                </span>

                <span className="taskModalAttachmentContent">
                  <span className="taskModalAttachmentName">
                    {a.original_name}
                  </span>
                  <span className="taskModalAttachmentMeta">
                    {a.uploaded_at || "Uploaded file"}
                  </span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}