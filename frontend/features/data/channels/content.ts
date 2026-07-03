/** Static markup for channels. Replace with data-driven components when wiring the API. */
export const content = `    <div class="page-hd"><h2>Channels</h2><p>Configure and monitor data ingestion channels.</p></div>
    <div class="ch"><span></span><button class="btn p" data-open="m-channel"><i class="ti ti-plus"></i>Create channel</button></div>
    <div class="card">
      <table>
        <colgroup><col style="width:28%"><col style="width:18%"><col style="width:20%"><col style="width:12%"><col style="width:12%"><col style="width:10%"></colgroup>
        <thead><tr><th>Channel</th><th>Type</th><th>Schedule</th><th>Status</th><th>Last msg</th><th></th></tr></thead>
        <tbody>
          <tr><td><span style="font-weight:500">telegram_news_feed</span><br><span class="mono">TEXT · en</span></td><td><span class="tag">TELEGRAM</span></td><td>WEBHOOK</td><td><span class="bx s">Active</span></td><td style="color:var(--text-muted)">2m ago</td><td><button class="btn sm"><i class="ti ti-cursor-text"></i></button></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ===== CHANNELS ===== -->`;
