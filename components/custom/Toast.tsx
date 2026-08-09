type Props = {
  message: string;
  visible: boolean;
};

export default function Toast({ message, visible }: Props) {
  return (
    <div className="toast" style={{ opacity: visible ? 1 : 0 }}>
      <i className="ti ti-check" style={{ color: "var(--text-success)" }} />
      <span>{message}</span>
    </div>
  );
}