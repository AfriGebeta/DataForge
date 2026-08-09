type Props = {
  staleDaysThreshold: number;
  onChange: (value: number) => void;
};

export default function OutdatedPlacesCard({ staleDaysThreshold, onChange }: Props) {
  return (
    <div className="card">
      <div className="ch">
        <span className="ct">
          <i className="ti ti-clock-exclamation" style={{ fontSize: 14, marginRight: 5 }} />
          Outdated Places
        </span>
      </div>
      <div className="fg">
        <div className="fl">
          Days since last refresh before a place counts as outdated
        </div>
        <input
          type="number"
          min={1}
          max={3650}
          value={staleDaysThreshold}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="fh">
          Drives the &ldquo;outdated places&rdquo; stat and filter on Place → List.
        </div>
      </div>
    </div>
  );
}
