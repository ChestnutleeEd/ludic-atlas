type CoverSizeSliderProps = {
  coverSize: number;
  onChange: (coverSize: number) => void;
};

export function CoverSizeSlider({ coverSize, onChange }: CoverSizeSliderProps) {
  return (
    <div aria-labelledby="cover-size-label">
      <div className="flex items-center justify-between gap-3">
        <label
          className="block text-sm text-[#F0B65A]"
          htmlFor="cover-size"
          id="cover-size-label"
        >
          marker 大小
        </label>
        <span className="text-xs text-[#A99D8B]" id="cover-size-value">
          {coverSize}px
        </span>
      </div>
      <div className="atlas-control-box mt-2 text-sm" role="group">
        <input
          aria-describedby="cover-size-value cover-size-help"
          aria-valuetext={`游戏封面 marker ${coverSize} 像素`}
          className="atlas-range-input w-full"
          id="cover-size"
          max={96}
          min={28}
          onChange={(event) => onChange(Number(event.target.value))}
          step={4}
          type="range"
          value={coverSize}
        />
        <div className="mt-3 text-[#A99D8B]" id="cover-size-help">
          调整地球上游戏封面 marker 的显示尺寸。
        </div>
      </div>
    </div>
  );
}
