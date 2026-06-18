"use client";

import { useMemo, useState } from "react";
import {
  getGenreLabel,
  getRegionLabel
} from "@/lib/localization";
import { getCountryStats } from "@/lib/stats";
import type { Country, Game } from "@/types/game";

type CountryPanelProps = {
  countries: Country[];
  games: Game[];
  activeRegionLabel: string;
  selectedCountryCode: string | null;
  onSelectCountry: (countryCode: string) => void;
};

export function CountryPanel({
  countries,
  games,
  activeRegionLabel,
  selectedCountryCode,
  onSelectCountry
}: CountryPanelProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const countryStatsByCode = useMemo(
    () =>
      new Map(
        countries.map((country) => [country.code, getCountryStats(country, games)])
      ),
    [countries, games]
  );
  const maxGameCount = useMemo(
    () =>
      Math.max(
        1,
        ...countries.map(
          (country) =>
            countryStatsByCode.get(country.code)?.gameCount ??
            getCountryStats(country, games).gameCount
        )
      ),
    [countries, countryStatsByCode, games]
  );
  const visibleCountries = useMemo(() => {
    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter((country) => {
      return (
        country.name.toLocaleLowerCase().includes(normalizedQuery) ||
        country.nameZh.toLocaleLowerCase().includes(normalizedQuery) ||
        country.code.toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }, [countries, normalizedQuery]);
  const visibleGameCount = useMemo(
    () =>
      countries.reduce(
        (count, country) =>
          count + (countryStatsByCode.get(country.code)?.gameCount ?? 0),
        0
      ),
    [countries, countryStatsByCode]
  );

  return (
    <section
      aria-labelledby="country-overview-title"
      className="country-overview-panel"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            className="text-lg font-semibold text-[#F5EFE3]"
            id="country-overview-title"
          >
            国家与地区
          </h2>
          <p className="mt-1 text-xs text-[#A99D8B]">
            当前区域：{activeRegionLabel} / {visibleGameCount} 款游戏
          </p>
        </div>
        <span className="text-xs text-[#A99D8B]">
          显示 {visibleCountries.length}/{countries.length} 个
        </span>
      </div>
      <p className="mt-3 border border-white/10 bg-black/30 p-2 text-xs leading-5 text-[#A99D8B]">
        行内条形表示该国家在当前筛选中的游戏数量；点击国家后，地球会聚焦到对应区域。
      </p>
      <label className="mt-4 block">
        <span className="sr-only">搜索国家或地区</span>
        <input
          aria-label="搜索国家、地区或国家代码"
          className="country-search-input"
          name="country-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索中文 / English / 国家代码…"
          type="search"
          value={query}
        />
      </label>
      <div
        aria-label="国家与地区列表"
        className="mt-3 grid max-h-[640px] gap-1.5 overflow-y-auto pr-1"
      >
        {visibleCountries.length === 0 ? (
          <p className="border border-white/12 bg-black/70 p-3 text-sm text-cyan-50/55">
            未找到匹配国家。
          </p>
        ) : null}
        {visibleCountries.map((country) => {
          const stats = countryStatsByCode.get(country.code) ?? getCountryStats(country, games);
          const isSelected = country.code === selectedCountryCode;
          const gameCountRatio = Math.round(
            (stats.gameCount / maxGameCount) * 100
          );

          return (
            <button
              aria-label={`选择 ${country.nameZh} ${country.name}，${stats.gameCount} 款游戏，平均评分 ${stats.averageRating.toFixed(
                1
              )}`}
              aria-pressed={isSelected}
              className={`country-overview-row ${
                isSelected
                  ? "is-selected"
                  : ""
              }`}
              key={country.code}
              onClick={() => onSelectCountry(country.code)}
              type="button"
            >
              <div className="min-w-0">
                <h3>{country.nameZh}</h3>
                <p>{country.name} / {getRegionLabel(country.region)}</p>
                <span className="country-count-bar" aria-hidden="true">
                  <span style={{ width: `${gameCountRatio}%` }} />
                </span>
              </div>
              <dl>
                <div>
                  <dt>游戏</dt>
                  <dd>{stats.gameCount}</dd>
                </div>
                <div>
                  <dt>评分</dt>
                  <dd>{stats.averageRating.toFixed(1)}</dd>
                </div>
                <div className="min-w-0">
                  <dt>类型</dt>
                  <dd>{stats.topGenre ? getGenreLabel(stats.topGenre) : "暂无"}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </section>
  );
}
