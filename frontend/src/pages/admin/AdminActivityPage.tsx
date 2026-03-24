import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/api";

type ActivityRow = {
  id: number;
  task_id: number;
  task_title: string;
  actor_id: number;
  actor_name: string;
  action: string;
  message: string;
  created_at: string | null;
};

function niceDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AdminActivityPage() {
  const [items, setItems] = useState<ActivityRow[]>([]);

  // filters
  const [q, setQ] = useState("");
  const [taskId, setTaskId] = useState("");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  // ui
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const params = useMemo(() => {
    return {
      page,
      page_size: pageSize,
      q: q.trim() || undefined,
      task_id: taskId || undefined,
      actor_id: actorId || undefined,
      action: action || undefined,
    };
  }, [page, pageSize, q, taskId, actorId, action]);

  // export should use filters only, not pagination
  const exportParams = useMemo(() => {
    return {
      q: q.trim() || undefined,
      task_id: taskId || undefined,
      actor_id: actorId || undefined,
      action: action || undefined,
    };
  }, [q, taskId, actorId, action]);

  // detect filter changes only (not page)
  const filterKey = useMemo(() => {
    return `${q.trim()}|${taskId}|${actorId}|${action}`;
  }, [q, taskId, actorId, action]);

  async function load(p = params) {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/admin/activity/", { params: p });

      setItems(res.data?.results || []);

      const tp = Number(res.data?.total_pages || 1);
      setTotalPages(Number.isFinite(tp) && tp > 0 ? tp : 1);

      const serverPage = Number(res.data?.page || p.page || 1);
      if (Number.isFinite(serverPage) && serverPage > 0) setPage(serverPage);
    } catch (e: any) {
      setItems([]);
      setTotalPages(1);
      setMsg(e?.response?.data?.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  async function downloadLogs(format: "pdf" | "excel") {
    try {
      if (format === "pdf") setExportingPdf(true);
      else setExportingExcel(true);

      const res = await api.get("/admin/activity/export/", {
        params: {
          ...exportParams,
          format,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        format === "pdf" ? "activity_logs.pdf" : "activity_logs.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (e: any) {
      setMsg("Failed to export logs");
    } finally {
      if (format === "pdf") setExportingPdf(false);
      else setExportingExcel(false);
    }
  }


  // Debounce only on filter changes, and reset to page 1
  useEffect(() => {
    setPage(1);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      load({
        page: 1,
        page_size: pageSize,
        q: q.trim() || undefined,
        task_id: taskId || undefined,
        actor_id: actorId || undefined,
        action: action || undefined,
      });
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Immediate load when page changes
  useEffect(() => {
    load(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function clearFilters() {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setQ("");
    setTaskId("");
    setActorId("");
    setAction("");
    setPage(1);
  }

  const hasAnyFilter = !!(q.trim() || taskId || actorId || action);

  return (
    <div className="logsCard">
      <div className="logsHead">
        <div className="logsTitleBlock">
          <h3 className="logsTitle">Activity Logs</h3>
          <p className="logsSub">Track task events, comments, and attachments.</p>
        </div>
        <div className="logsActions" ref={exportMenuRef} style={{ position: "relative" }}>
          <button
            className="btn primary"
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={exportingPdf || exportingExcel || loading}
          >
            {exportingPdf || exportingExcel ? "Downloading..." : "Download"}
          </button>

          {showExportMenu && (
            <div className="exportDropdown">
              <button className="btn ghost exportItem borderBottom"  >
                As PDF
              </button>
              <button className="btn ghost exportItem borderBottom"  >
                As Excel
              </button>
            </div>
          )}
        </div>


      </div>

      <div className="logsFilters">
        <input
          className="input logsSearch"
          placeholder="Search message / task / user..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <input
          className="input logsMini"
          placeholder="Task ID"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value.replace(/\D/g, ""))}
        />

        <input
          className="input logsMini"
          placeholder="Actor ID"
          value={actorId}
          onChange={(e) => setActorId(e.target.value.replace(/\D/g, ""))}
        />

        <select
          className="input logsSelect"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">All actions</option>
          <option value="TASK_CREATED">TASK_CREATED</option>
          <option value="TASK_UPDATED">TASK_UPDATED</option>
          <option value="STATUS_CHANGED">STATUS_CHANGED</option>
          <option value="TASK_DELETED">TASK_DELETED</option>
          <option value="COMMENT_ADDED">COMMENT_ADDED</option>
          <option value="COMMENT_DELETED">COMMENT_DELETED</option>
          <option value="ATTACHMENT_UPLOADED">ATTACHMENT_UPLOADED</option>
          <option value="ATTACHMENT_DELETED">ATTACHMENT_DELETED</option>
        </select>

        <button
          className="btn ghost"
          onClick={clearFilters}
          disabled={loading || !hasAnyFilter}
        >
          Clear
        </button>
      </div>

      {msg ? <div className="alert error logsAlert">{msg}</div> : null}

      <div className="logsTableWrap">
        <table className="logsTable">
          <thead>
            <tr>
              <th>Time</th>
              <th>Task</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Message</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="logsEmpty">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="logsEmpty">No logs</td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id}>
                  <td>{niceDate(a.created_at)}</td>
                  <td>
                    <div>#{a.task_id}</div>
                    <div className="logsMuted">{a.task_title || "—"}</div>
                  </td>
                  <td>
                    <div>{a.actor_name}</div>
                    <div className="logsMuted">#{a.actor_id}</div>
                  </td>
                  <td>
                    <span className={`logsActionPill action-${(a.action || "").toLowerCase()}`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="logsMsg">{a.message || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pg">
        <button
          className="pgBtn"
          disabled={loading || page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>

        <span className="pgInfo">
          Page {page} / {totalPages}
        </span>

        <button
          className="pgBtn"
          disabled={loading || page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}