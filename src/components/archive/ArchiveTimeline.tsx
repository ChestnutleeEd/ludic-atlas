"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { ArchiveYearGroup, ArchiveYearKey } from "@/lib/archiveModel";
import styles from "./GameArchiveView.module.css";

export type { ArchiveYearGroup } from "@/lib/archiveModel";

type ArchiveTimelineProps = {
  activeYearKey: ArchiveYearKey;
  groups: ArchiveYearGroup[];
  onPreviewYear?: (key: ArchiveYearKey) => void;
  onSelectYear: (key: ArchiveYearKey) => void;
};

export function ArchiveTimeline({
  activeYearKey,
  groups,
  onPreviewYear,
  onSelectYear
}: ArchiveTimelineProps) {
  const itemRefs = useRef(new Map<ArchiveYearKey, HTMLButtonElement>());
  const [focusKey, setFocusKey] = useState<ArchiveYearKey>(activeYearKey);
  const activeIndex = groups.findIndex((group) => group.key === activeYearKey);
  const tabKey = groups.some((group) => group.key === focusKey)
    ? focusKey
    : activeYearKey;

  function focusAt(index: number) {
    const group = groups[Math.max(0, Math.min(index, groups.length - 1))];
    if (!group) return;
    setFocusKey(group.key);
    itemRefs.current.get(group.key)?.focus();
    itemRefs.current.get(group.key)?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest"
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? index + 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? groups.length - 1
              : null;

    if (nextIndex === null) return;
    event.preventDefault();
    focusAt(nextIndex);
  }

  function selectAndFocus(index: number) {
    const group = groups[index];
    if (!group) return;
    onSelectYear(group.key);
    requestAnimationFrame(() => focusAt(index));
  }

  return (
    <nav aria-label="年份索引" className={styles.timeline} data-archive-region="timeline">
      <div className={styles.timelineHeading}>
        <div>
          <p>Chronology</p>
          <h2>年份索引</h2>
        </div>
        <span>{groups.length} 年</span>
      </div>
      <div className={styles.yearBoundaryControls}>
        <button
          disabled={activeIndex <= 0}
          onClick={() => selectAndFocus(activeIndex - 1)}
          type="button"
        >
          较新年份
        </button>
        <button
          disabled={activeIndex < 0 || activeIndex >= groups.length - 1}
          onClick={() => selectAndFocus(activeIndex + 1)}
          type="button"
        >
          较早年份
        </button>
      </div>
      <div className={styles.yearList} role="list">
        {groups.map((group, index) => {
          const isActive = group.key === activeYearKey;

          return (
            <button
              aria-controls={`archive-year-panel-${group.key}`}
              aria-current={isActive ? "true" : undefined}
              className={`${styles.yearButton} ${isActive ? styles.yearButtonActive : ""}`}
              key={group.key}
              onClick={() => onSelectYear(group.key)}
              onFocus={() => {
                setFocusKey(group.key);
                onPreviewYear?.(group.key);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPointerEnter={() => onPreviewYear?.(group.key)}
              ref={(element) => {
                if (element) itemRefs.current.set(group.key, element);
                else itemRefs.current.delete(group.key);
              }}
              tabIndex={group.key === tabKey ? 0 : -1}
              type="button"
            >
              <span>{group.label}</span>
              <small>{group.games.length}</small>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
