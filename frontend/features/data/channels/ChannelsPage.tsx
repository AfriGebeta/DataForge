"use client";

import { ChannelList } from "./ChannelList";
import { pageConfig } from "./config";

export default function ChannelsPage() {
  return (
    <div>
      <div className="page-hd">
        <h2>Channels</h2>
        <p>Configure and monitor data ingestion channels.</p>
      </div>
      <div className="ch">
        <span></span>
        <button className="btn p" data-open="m-channel">
          <i className="ti ti-plus"></i>Create channel
        </button>
      </div>
      <div className="card">
        <ChannelList />
      </div>
    </div>
  );
}
