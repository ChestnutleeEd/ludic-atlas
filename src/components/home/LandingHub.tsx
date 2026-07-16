"use client";

import Image from "next/image";
import { useState } from "react";

type LandingHubProps = {
  totalGames: number;
  yearRange: {
    min: number;
    max: number;
  };
  onOpenArchive: () => void;
  onOpenEarth: () => void;
};

export function LandingHub({
  totalGames,
  yearRange,
  onOpenArchive,
  onOpenEarth
}: LandingHubProps) {
  const [earthImageFailed, setEarthImageFailed] = useState(false);
  const [chronicleImageFailed, setChronicleImageFailed] = useState(false);

  return (
    <section className="ludic-atlas-hub" aria-labelledby="hub-title">
      <div className="hub-ambient" aria-hidden="true" />
      <div className="hub-content">
        <header className="hub-masthead">
          <div className="hub-brand-lockup">
            <p className="hub-kicker">世界游戏档案馆</p>
            <h1 id="hub-title">
              <span>Ludic Atlas</span>
              <span className="hub-title-zh">游戏星图</span>
            </h1>
            <p className="hub-subtitle">
              以地球为空间，以年代为线索，探索全球游戏文化。
            </p>
          </div>

          <dl className="hub-collection-context" aria-label="馆藏概览">
            <div>
              <dt>馆藏游戏</dt>
              <dd>{totalGames}</dd>
            </div>
            <div>
              <dt>馆藏年份</dt>
              <dd>
                {yearRange.min}—{yearRange.max}
              </dd>
            </div>
          </dl>
        </header>

        <div className="hub-portal-grid">
          <button
            className="portal-card portal-card-earth"
            data-image-state={earthImageFailed ? "error" : "ready"}
            onClick={onOpenEarth}
            type="button"
          >
            <span className="portal-visual" aria-hidden="true">
              <Image
                alt=""
                className="portal-image"
                fill
                onError={() => setEarthImageFailed(true)}
                preload
                sizes="(max-width: 900px) 100vw, 58vw"
                src="/images/home/earth-explorer-archive.webp"
              />
            </span>
            <span className="portal-copy">
              <span className="portal-label">Earth Explorer</span>
              <strong>地球探索</strong>
              <span className="portal-description">
                在 3D 地球上探索游戏文化地图
              </span>
              <span className="portal-action">
                进入地球探索
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </button>

          <button
            className="portal-card portal-card-chronicle"
            data-image-state={chronicleImageFailed ? "error" : "ready"}
            onClick={onOpenArchive}
            type="button"
          >
            <span className="portal-visual" aria-hidden="true">
              <Image
                alt=""
                className="portal-image"
                fill
                onError={() => setChronicleImageFailed(true)}
                sizes="(max-width: 900px) 100vw, 42vw"
                src="/images/home/game-chronicle-archive.webp"
              />
            </span>
            <span className="portal-copy">
              <span className="portal-label">Game Chronicle</span>
              <strong>游戏编年馆</strong>
              <span className="portal-description">
                沿着 {yearRange.min}-{yearRange.max} 的时间线浏览高分游戏馆藏
              </span>
              <span className="portal-action">
                进入游戏编年馆
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
