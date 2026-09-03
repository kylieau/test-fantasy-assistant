export function BpaNeedSlider({
  weight,
  onChange,
}: {
  weight: number;
  onChange: (weight: number) => void;
}) {
  return (
    <label className="bpa-need-slider">
      <span className="bpa-need-slider__labels">
        <span>Best Player Available</span>
        <span>Fill a Need</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={weight}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
