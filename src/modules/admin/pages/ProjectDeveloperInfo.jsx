import { useEffect, useState } from "react";
import { fetchJurisdictionPack } from "../api/approvals-config.api";

function displayFor(pack) {
  if (!pack) return { value: "Not set", hint: null };
  const value = pack.communityAuthorityName || pack.name || "Not set";
  const hint = pack.communityAuthorityName && pack.name && pack.communityAuthorityName !== pack.name
    ? pack.name
    : null;
  return { value, hint };
}

export default function ProjectDeveloperInfo({ jurisdictionPackId, variant = "cell" }) {
  const [pack, setPack] = useState(null);
  const [loadState, setLoadState] = useState(jurisdictionPackId ? "loading" : "empty");

  useEffect(() => {
    if (!jurisdictionPackId) {
      setPack(null);
      setLoadState("empty");
      return undefined;
    }
    let cancelled = false;
    setLoadState("loading");
    fetchJurisdictionPack(jurisdictionPackId)
      .then((row) => {
        if (cancelled) return;
        setPack(row || null);
        setLoadState(row ? "loaded" : "empty");
      })
      .catch(() => {
        if (!cancelled) {
          setPack(null);
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [jurisdictionPackId]);

  const { value, hint } = displayFor(pack);
  const shown = loadState === "loading" ? "…" : loadState === "error" ? "Could not load" : value;

  if (variant === "header") {
    const tooltip = loadState === "loaded" && hint ? `${shown} · ${hint}` : shown;
    return (
      <div className="min-w-0 max-w-xs text-left sm:text-right">
        <p className="text-xs text-muted-foreground">Developer</p>
        <p className="truncate text-sm font-medium" title={tooltip}>{shown}</p>
        {loadState === "loaded" && hint ? (
          <p className="truncate text-[11px] text-muted-foreground" title={hint}>{hint}</p>
        ) : null}
      </div>
    );
  }

  if (variant === "infoItem") {
    return (
      <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
        <span className="w-36 shrink-0 text-xs text-muted-foreground">Developer</span>
        <span className="text-sm font-medium">
          {shown}
          {loadState === "loaded" && hint ? (
            <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
          ) : null}
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium leading-9">{shown}</p>
      {loadState === "loaded" && hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
