type CoverSizeSliderProps = {
  coverSize: number;
  onChange: (coverSize: number) => void;
};

export function CoverSizeSlider({ coverSize, onChange }: CoverSizeSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm text-[#F0B65A]" htmlFor="cover-size">
          封面大小
        </label>
        <span className="text-xs text-[#A99D8B]">{coverSize}px</span>
      </div>
      <div className="atlas-control-box mt-2 text-sm">
        <input
          className="atlas-range-input w-full"
          id="cover-size"
          max={96}
          min={28}
          onChange={(event) => onChange(Number(event.target.value))}
          step={4}
          type="range"
          value={coverSize}
        />
        <div className="mt-3 text-[#A99D8B]">{coverSize}px</div>
      </div>
    </div>
  );
}
