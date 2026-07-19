"use client";

import { useEffect, useState } from "react";
import { fetchChannels } from "./api";
import type { ChannelConfig } from "./types";

export function ChannelList() {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels()
      .then((data) => {
        setChannels(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch channels:", err); // Debug log
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading channels...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <table>
      <colgroup>
        <col style={{ width: "28%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "10%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>Channel</th>
          <th>Type</th>
          <th>Schedule</th>
          <th>Status</th>
          <th>Last msg</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {channels.map((ch) => (
          <tr key={ch.id}>
            <td>
              <span style={{ fontWeight: 500 }}>
                {ch.channel_name || ch.channel_id}
              </span>
              <br />
              <span className="mono">
                {ch.default_message_type || "TEXT"} ·{" "}
                {ch.default_language || "en"}
              </span>
            </td>
            <td>
              <span className="tag">{ch.channel}</span>
            </td>
            <td>
              {ch.schedule_type === "INTERVAL" && ch.poll_interval_sec
                ? `INTERVAL ${ch.poll_interval_sec}s`
                : ch.schedule_type === "CRON" && ch.cron_expr
                  ? `CRON ${ch.cron_expr}`
                  : ch.schedule_type}
            </td>
            <td>
              <span className={`bx ${ch.is_active ? "s" : "w"}`}>
                {ch.is_active ? "Active" : "Inactive"}
              </span>
            </td>
            <td style={{ color: "var(--text-muted)" }}>
              {ch.last_message_at
                ? new Date(ch.last_message_at).toLocaleString()
                : "Never"}
            </td>
            <td>
              <button className="btn sm">
                <i className="ti ti-cursor-text"></i>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
