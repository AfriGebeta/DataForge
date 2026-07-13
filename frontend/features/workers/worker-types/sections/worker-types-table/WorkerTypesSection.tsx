import type { WorkerType } from "../../types";

type Props = {
  workerTypes: WorkerType[];
  loading: boolean;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onRegister: () => void;
};

export default function WorkerTypesSection({
  workerTypes,
  loading,
  onToggleStatus,
  onRegister,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Worker Types</h2>
        <p>Register and manage worker capabilities.</p>
      </div>

      <div className="ch">
        <span />
        <button className="btn p" onClick={onRegister}>
          <i className="ti ti-plus" />
          Register worker
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Loading...
          </p>
        ) : workerTypes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            No worker types found.
          </p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Capabilities</th>
                <th>Max concurrency</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {workerTypes.map((worker) => (
                <tr key={worker.id}>
                  <td style={{ fontWeight: 500 }}>{worker.name}</td>
                  <td>{worker.version}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {worker.capabilities.map((cap) => (
                        <span key={cap} className="tag">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{worker.max_concurrency}</td>
                  <td>
                    {worker.is_active ? (
                      <span className="bx s">Active</span>
                    ) : (
                      <span className="bx w">Inactive</span>
                    )}
                  </td>
                  <td>
                    {worker.is_active ? (
                      <button
                        className="btn sm d"
                        onClick={() => onToggleStatus(worker.id, false)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="btn sm"
                        onClick={() => onToggleStatus(worker.id, true)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}