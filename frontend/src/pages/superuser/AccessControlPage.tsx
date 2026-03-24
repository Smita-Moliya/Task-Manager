import React, { useEffect, useMemo, useState } from "react";
import {
  FiShield,
  FiUserCheck,
  FiUsers,
  FiGrid,
  FiFolder,
  FiCheckSquare,
  FiBarChart2,
  FiActivity,
  FiMessageSquare,
  FiPaperclip,
  FiTrendingUp,
  FiSave,
  FiRefreshCw,
} from "react-icons/fi";
import { getAccessControl, updateAccessControl, type RoleKey } from "../../api/accessControl";
import "../../css/accessControl.css";

type PageAccessItem = {
  page_key: string;
  label: string;
  description: string;
  allowed: boolean;
};

type RoleAccessMap = Record<RoleKey, PageAccessItem[]>;

const roleMeta: Record<
  RoleKey,
  { title: string; subtitle: string; icon: React.ReactNode }
> = {
  ADMIN: {
    title: "Admin",
    subtitle: "Manage which admin pages are visible and accessible.",
    icon: <FiUserCheck />,
  },
  USER: {
    title: "User",
    subtitle: "Manage which user pages are visible and accessible.",
    icon: <FiUsers />,
  },
};

function getPageIcon(pageKey: string) {
  if (pageKey.includes("dashboard")) return <FiGrid />;
  if (pageKey.includes("users")) return <FiUsers />;
  if (pageKey.includes("projects")) return <FiFolder />;
  if (pageKey.includes("tasks")) return <FiCheckSquare />;
  if (pageKey.includes("analytics")) return <FiBarChart2 />;
  if (pageKey.includes("activity")) return <FiActivity />;
  if (pageKey.includes("comments")) return <FiMessageSquare />;
  if (pageKey.includes("attachments")) return <FiPaperclip />;
  if (pageKey.includes("insights")) return <FiTrendingUp />;
  return <FiShield />;
}

export default function AccessControlPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>("ADMIN");
  const [accessMap, setAccessMap] = useState<RoleAccessMap>({
    ADMIN: [],
    USER: [],
  });
  const [initialMap, setInitialMap] = useState<RoleAccessMap>({
    ADMIN: [],
    USER: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    loadAccessControl();
  }, []);

  async function loadAccessControl() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getAccessControl();

      const nextMap: RoleAccessMap = {
        ADMIN: data.roles.find((r) => r.role === "ADMIN")?.pages || [],
        USER: data.roles.find((r) => r.role === "USER")?.pages || [],
      };

      setAccessMap(nextMap);
      setInitialMap({
        ADMIN: nextMap.ADMIN.map((item) => ({ ...item })),
        USER: nextMap.USER.map((item) => ({ ...item })),
      });
    } catch (error) {
      console.error(error);
      setPageError("Failed to load access control data.");
    } finally {
      setLoading(false);
    }
  }

  const activePages = accessMap[activeRole];

  const enabledCount = useMemo(
    () => activePages.filter((page) => page.allowed).length,
    [activePages]
  );

  const totalCount = activePages.length;
  const disabledCount = totalCount - enabledCount;

  function handleToggle(pageKey: string) {
    setAccessMap((prev) => ({
      ...prev,
      [activeRole]: prev[activeRole].map((page) =>
        page.page_key === pageKey
          ? { ...page, allowed: !page.allowed }
          : page
      ),
    }));
  }

  function handleToggleAll(value: boolean) {
    setAccessMap((prev) => ({
      ...prev,
      [activeRole]: prev[activeRole].map((page) => ({
        ...page,
        allowed: value,
      })),
    }));
  }

  function handleReset() {
    setAccessMap((prev) => ({
      ...prev,
      [activeRole]: initialMap[activeRole].map((page) => ({ ...page })),
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setPageError("");

      await updateAccessControl({
        role: activeRole,
        pages: accessMap[activeRole].map((page) => ({
          page_key: page.page_key,
          allowed: page.allowed,
        })),
      });

      setInitialMap((prev) => ({
        ...prev,
        [activeRole]: accessMap[activeRole].map((page) => ({ ...page })),
      }));

      alert(`${roleMeta[activeRole].title} page access updated successfully.`);
    } catch (error) {
      console.error(error);
      setPageError("Failed to save page access.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="acPage">
        <div className="acPanel">
          <div className="acEmptyState">Loading access control...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="acPage">
      <section className="acHero">
        <div className="acHeroContent">
          <div className="acEyebrow">Super Admin</div>
          <h1 className="acTitle">Access Control</h1>
          <p className="acSubtitle">
            Turn pages on or off for Admin and User roles. This controls which
            pages each role can open inside the system.
          </p>
        </div>

        <div className="acHeroStats">
          <div className="acStatCard">
            <span className="acStatLabel">Selected Role</span>
            <strong>{roleMeta[activeRole].title}</strong>
          </div>
          <div className="acStatCard">
            <span className="acStatLabel">Pages Enabled</span>
            <strong>{enabledCount}</strong>
          </div>
          <div className="acStatCard">
            <span className="acStatLabel">Pages Disabled</span>
            <strong>{disabledCount}</strong>
          </div>
        </div>
      </section>

      <section className="acRoleTabs">
        {(Object.keys(roleMeta) as RoleKey[]).map((role) => {
          const meta = roleMeta[role];
          const isActive = activeRole === role;

          return (
            <button
              key={role}
              type="button"
              className={`acRoleTab ${isActive ? "active" : ""}`}
              onClick={() => setActiveRole(role)}
            >
              <div className="acRoleTabIcon">{meta.icon}</div>
              <div className="acRoleTabText">
                <span className="acRoleTabTitle">{meta.title}</span>
                <span className="acRoleTabSubtitle">{meta.subtitle}</span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="acPanel">
        <div className="acPanelHeader">
          <div className="acPanelTitleWrap">
            <div className="acPanelIcon">{roleMeta[activeRole].icon}</div>
            <div>
              <h2 className="acPanelTitle">{roleMeta[activeRole].title} Pages</h2>
              <p className="acPanelSubtitle">
                Enable or disable page access for the {roleMeta[activeRole].title.toLowerCase()} role.
              </p>
            </div>
          </div>

          <div className="acPanelActions">
            <button
              type="button"
              className="acBtn acBtnGhost"
              onClick={() => handleToggleAll(true)}
            >
              Enable All
            </button>
            <button
              type="button"
              className="acBtn acBtnGhost"
              onClick={() => handleToggleAll(false)}
            >
              Disable All
            </button>
            <button
              type="button"
              className="acBtn acBtnGhost"
              onClick={handleReset}
            >
              <FiRefreshCw />
              Reset
            </button>
            <button
              type="button"
              className="acBtn acBtnPrimary"
              onClick={handleSave}
              disabled={saving}
            >
              <FiSave />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {pageError ? <div className="acError">{pageError}</div> : null}

        <div className="acList">
          {activePages.map((page) => (
            <div className="acRow" key={page.page_key}>
              <div className="acRowLeft">
                <div className="acRowIcon">{getPageIcon(page.page_key)}</div>

                <div className="acRowText">
                  <div className="acRowTop">
                    <h3 className="acRowTitle">{page.label}</h3>
                    <span
                      className={`acStatusBadge ${
                        page.allowed ? "isAllowed" : "isBlocked"
                      }`}
                    >
                      {page.allowed ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p className="acRowDescription">{page.description}</p>
                  <span className="acRowKey">{page.page_key}</span>
                </div>
              </div>

              <label className="acSwitchWrap">
                <input
                  type="checkbox"
                  checked={page.allowed}
                  onChange={() => handleToggle(page.page_key)}
                />
                <span className={`acSwitch ${page.allowed ? "on" : ""}`} />
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}