"use client";

import { useMemo, useState } from "react";
import {
  getCountryDisplayName,
  getGenreLabel,
  getRegionLabel
} from "@/lib/localization";
import { getCountryStats } from "@/lib/stats";
import type { Country, Game } from "@/types/game";

type CountryPanelProps = {
  countries: Country[];
  games: Game[];
  selectedCountryCode: string | null;
  onSelectCountry: (countryCode: string) => void;
};

export function CountryPanel({
  countries,
  games,
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
  const visibleCountries = useMemo(() => {
    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter((country) => {
      const displayName = getCountryDisplayName(country).toLocaleLowerCase();

      return (
        displayName.includes(normalizedQuery) ||
        country.name.toLocaleLowerCase().includes(normalizedQuery) ||
        country.nameZh.toLocaleLowerCase().includes(normalizedQuery) ||
        country.code.toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }, [countries, normalizedQuery]);

  return (
    <section className="country-overview-panel">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-cyan-50">
            国家 / 地区总览
          </h2>
          <p className="mt-1 text-xs text-cyan-50/45">
            搜索或选择国家后，地球会聚焦到对应区域。
          </p>
        </div>
        <span className="text-xs text-cyan-50/50">共 {countries.length} 个</span>
      </div>
      <label className="mt-4 block">
        <span className="sr-only">搜索国家或地区</span>
        <input
          className="country-search-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索中文 / English / 国家代码"
          type="search"
          value={query}
        />
      </label>
      <div className="mt-3 grid max-h-[640px] gap-1.5 overflow-y-auto pr-1">
        {visibleCountries.length === 0 ? (
          <p className="border border-white/12 bg-black/70 p-3 text-sm text-cyan-50/55">
            未找到匹配国家。
          </p>
        ) : null}
        {visibleCountries.map((country) => {
          const stats = countryStatsByCode.get(country.code) ?? getCountryStats(country, games);
          const isSelected = country.code === selectedCountryCode;

          return (
            <button
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
                <h3>{getCountryDisplayName(country)}</h3>
                <p>{getRegionLabel(country.region)}</p>
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
