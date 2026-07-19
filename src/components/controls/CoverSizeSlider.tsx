import {
  COVER_SIZE_MAX,
  COVER_SIZE_MIN,
  COVER_SIZE_STEP,
  snapCoverSizeToStep
} from "@/lib/coverSize";

type CoverSizeSliderProps = {
  coverSize: number;
  onChange: (coverSize: number) => void;
  onCommit: () => void;
};

export function CoverSizeSlider({ coverSize, onChange, onCommit }: CoverSizeSliderProps) {
  const updateByStep = (direction: -1 | 1) => {
    onChange(snapCoverSizeToStep(coverSize + direction * COVER_SIZE_STEP));
    onCommit();
  };

  return (
    <div aria-labelledby="cover-size-label" className="earth-cover-size-control">
      <div className="flex items-center justify-between gap-3">
        <label
          className="block text-sm text-[#F0B65A]"
          htmlFor="cover-size"
          id="cover-size-label"
        >
          封面尺寸
        </label>
        <span className="text-xs text-[#A99D8B]" id="cover-size-value">
          {coverSize}px
        </span>
      </div>
      <div className="atlas-control-box earth-cover-size-row mt-2 text-sm" role="group">
        <button
          aria-label="减小封面尺寸"
          className="earth-cover-size-step"
          disabled={coverSize <= COVER_SIZE_MIN}
          onClick={() => updateByStep(-1)}
          type="button"
        >
          −
        </button>
        <input
          aria-describedby="cover-size-value cover-size-help"
          aria-valuetext={`游戏封面高度 ${coverSize} 像素`}
          className="atlas-range-input min-w-0 w-full"
          id="cover-size"
          max={COVER_SIZE_MAX}
          min={COVER_SIZE_MIN}
          onBlur={onCommit}
          onChange={(event) => onChange(Number(event.target.value))}
          onKeyUp={(event) => {
            if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") onCommit();
          }}
          onPointerUp={onCommit}
          step={COVER_SIZE_STEP}
          type="range"
          value={coverSize}
        />
        <button
          aria-label="放大封面尺寸"
          className="earth-cover-size-step"
          disabled={coverSize >= COVER_SIZE_MAX}
          onClick={() => updateByStep(1)}
          type="button"
        >
          +
        </button>
      </div>
      <div className="mt-2 text-[#A99D8B] text-xs" id="cover-size-help">
        调整地球上游戏封面的显示高度。
      </div>
    </div>
  );
}
