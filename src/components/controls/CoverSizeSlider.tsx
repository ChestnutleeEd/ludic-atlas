type CoverSizeSliderProps = {
  coverSize: number;
  onChange: (coverSize: number) => void;
};

export function CoverSizeSlider({ coverSize, onChange }: CoverSizeSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm text-emerald-300" htmlFor="cover-size">
          Cover size
        </label>
        <span className="text-xs text-emerald-50/60">{coverSize}px</span>
      </div>
      <div className="mt-2 border border-emerald-500/30 p-3 text-sm text-emerald-50/70">
        <input
          className="w-full accent-emerald-400"
          id="cover-size"
          max={96}
          min={28}
          onChange={(event) => onChange(Number(event.target.value))}
          step={4}
          type="range"
          value={coverSize}
        />
        <div className="mt-3 text-emerald-50/60">
        {coverSize}px
        </div>
      </div>
    </div>
  );
}
