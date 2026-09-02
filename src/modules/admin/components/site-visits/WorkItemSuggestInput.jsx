import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchWorkItems } from "../../api/work-item.api";
import { searchRenovationCatalogItems } from "../../data/renovationChecklist";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 280;

function mergeSuggestions(catalogItems = [], apiItems = [], excludeLabels = []) {
  const exclude = new Set(excludeLabels.map((l) => l.trim().toLowerCase()));
  const seen = new Set();
  const merged = [];

  const push = (entry) => {
    const key = entry.label.trim().toLowerCase();
    if (!key || exclude.has(key) || seen.has(key)) return;
    seen.add(key);
    merged.push(entry);
  };

  catalogItems.forEach(push);
  apiItems.forEach((item) =>
    push({
      id: item.id,
      label: item.workItemName || "",
      category: item.workItemMasterName || item.category || "Work item",
      source: "catalog",
    })
  );

  return merged.slice(0, 10);
}

export default function WorkItemSuggestInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Describe additional work found on site…",
  label = "Add work item",
  excludeLabels = [],
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const excludeKey = excludeLabels
    .map((label) => label.trim().toLowerCase())
    .sort()
    .join("\0");

  useEffect(() => {
    const query = value.trim();
    if (query.length < MIN_QUERY) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return undefined;
    }

    const catalogMatches = searchRenovationCatalogItems(query, 6);
    setSuggestions(mergeSuggestions(catalogMatches, [], excludeLabels));
    setOpen(true);
    setHighlightIndex(-1);
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetchWorkItems({ search: query, active: true }, 0, 10);
        const apiItems = res?.content ?? [];
        setSuggestions(mergeSuggestions(catalogMatches, apiItems, excludeLabels));
      } catch (err) {
        console.error(err);
        setSuggestions(mergeSuggestions(catalogMatches, [], excludeLabels));
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- excludeKey stabilizes excludeLabels
  }, [value, excludeKey]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectSuggestion = (entry) => {
    onChange(entry.label);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        onSubmit?.();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        selectSuggestion(suggestions[highlightIndex]);
      } else {
        onSubmit?.();
      }
    }
  };

  const showList = open && value.trim().length >= MIN_QUERY;

  return (
    <div ref={rootRef} className="relative space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= MIN_QUERY && suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md"
        >
          {loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">Searching jobs…</li>
          ) : null}
          {!loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No matching jobs — press Add to use your text
            </li>
          ) : null}
          {suggestions.map((entry, index) => (
            <li key={entry.id} role="option" aria-selected={highlightIndex === index}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  highlightIndex === index && "bg-muted"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(entry)}
              >
                <span className="font-medium leading-snug">{entry.label}</span>
                <span className="text-[11px] text-muted-foreground">{entry.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
