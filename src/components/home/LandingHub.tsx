"use client";

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
  return (
    <section className="ludic-atlas-hub min-h-[calc(100vh-40px)] overflow-hidden">
      <div className="hub-ambient" aria-hidden="true" />
      <div className="hub-content">
        <header className="hub-masthead">
          <p className="hub-kicker">Ludic Atlas / 游戏星图</p>
          <h1>Ludic Atlas</h1>
          <p className="hub-title-zh">游戏星图</p>
          <p className="hub-subtitle">
            Explore games through space and time.
            <span>以地球为空间，以年代为线索，探索全球游戏文化。</span>
          </p>
        </header>

        <div className="hub-portal-grid">
          <button
            className="portal-card portal-card-earth"
            onClick={onOpenEarth}
            type="button"
          >
            <span className="portal-visual portal-earth-visual" aria-hidden="true">
              <span className="portal-planet" />
              <span className="portal-orbit portal-orbit-one" />
              <span className="portal-orbit portal-orbit-two" />
            </span>
            <span className="portal-copy">
              <span className="portal-label">Earth Explorer</span>
              <strong>地球探索</strong>
              <span>在 3D 地球上探索游戏文化地图</span>
            </span>
          </button>

          <button
            className="portal-card portal-card-chronicle"
            onClick={onOpenArchive}
            type="button"
          >
            <span className="portal-visual portal-chronicle-visual" aria-hidden="true">
              <span className="portal-cabinet">
                <span className="portal-cabinet-top">
                  <span className="portal-cabinet-plaque" />
                  <span className="portal-cabinet-handle" />
                </span>
                <span className="portal-cabinet-drawers">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className="portal-cabinet-rail">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              </span>
              <span className="portal-cover-strip">
                <span />
                <span />
                <span />
              </span>
            </span>
            <span className="portal-copy">
              <span className="portal-label">Game Chronicle</span>
              <strong>游戏编年馆</strong>
              <span>
                沿着 {yearRange.min}-{yearRange.max} 的时间线浏览高分游戏馆藏
              </span>
            </span>
          </button>
        </div>

        <dl className="hub-collection-strip">
          <div>
            <dt>馆藏游戏</dt>
            <dd>{totalGames}</dd>
          </div>
          <div>
            <dt>时间范围</dt>
            <dd>
              {yearRange.min}-{yearRange.max}
            </dd>
          </div>
          <div>
            <dt>入口</dt>
            <dd>Earth / Chronicle</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
