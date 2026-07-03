/** Modal markup owned by this page. */
export const modalsHtml = `<div id="m-channel" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);align-items:center;justify-content:center;z-index:100" data-close-overlay="m-channel">
  <div style="background:var(--surface-2);border:1px solid var(--border-strong);border-radius:12px;width:460px;max-height:88vh;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)">
      <span style="font-size:14px;font-weight:600">Create channel config</span>
      <button class="btn sm ghost" data-close="m-channel"><i class="ti ti-x"></i></button>
    </div>
    <div style="padding:18px">
      <div class="fr">
        <div class="fg">
          <label class="fl">Channel ID <span>*</span></label>
          <input type="text" placeholder="telegram_news_feed" name="channel_id" required />
        </div>
        <div class="fg">
          <label class="fl">Display name</label>
          <input type="text" placeholder="Telegram News Feed" name="channel_name" />
        </div>
      </div>
      <div class="fr">
        <div class="fg">
          <label class="fl">Channel type <span>*</span></label>
          <select class="glass-select" name="channel" required>
            <option value="TELEGRAM">TELEGRAM</option>
            <option value="REST_API">REST_API</option>
            <option value="BATCH_IMPORT">BATCH_IMPORT</option>
            <option value="MANUAL">MANUAL</option>
          </select>
        </div>
        <div class="fg">
          <label class="fl">Default message type</label>
          <select class="glass-select" name="default_message_type">
            <option value="TEXT">TEXT</option>
            <option value="POI">POI</option>
            <option value="ROAD">ROAD</option>
            <option value="TRANSIT">TRANSIT</option>
            <option value="NATURAL">NATURAL</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </div>
        <div class="fg">
          <label class="fl">Default language</label>
          <input type="text" value="en" name="default_language" />
        </div>
        <div class="fg">
          <label class="fl">Default source type</label>
          <select class="glass-select" name="default_source_type" required>
            <option value="WEBHOOK">WEBHOOK</option>
            <option value="USER_SUBMISSION">USER_SUBMISSION</option>
            <option value="PARTNER_IMPORT">PARTNER_IMPORT</option>
            <option value="MANUAL_ENTRY">MANUAL_ENTRY</option>
          </select>
        </div>
      </div>
      <div class="fr">
        <div class="fg">
          <label class="fl">Price bracket</label>
          <input type="text" placeholder="FREE" name="price_bracket" />
        </div>
        <div class="fg">
          <label class="fl">Expected frequency (hours)</label>
          <input type="number" min="1" placeholder="2" name="expected_frequency_hours" />
        </div>
      </div>
      <div class="fr">
        <div class="fg">
          <label class="fl">Webhook URL</label>
          <input type="url" placeholder="https://api.example.com/webhooks/telegram" name="webhook_url" />
        </div>
        <div class="fg">
          <label class="fl">Timezone <span>*</span></label>
          <input type="text" value="UTC" name="timezone" required />
        </div>
      </div>
      <div class="fr">
        <div class="fg">
          <label class="fl">Schedule type <span>*</span></label>
          <select class="glass-select" id="sched" name="schedule_type" required>
            <option value="WEBHOOK">WEBHOOK</option>
            <option value="INTERVAL">INTERVAL</option>
            <option value="CRON">CRON</option>
            <option value="MANUAL">MANUAL</option>
          </select>
        </div>
        <div class="fg" id="si">
          <label class="fl">Poll interval (s)</label>
          <input type="number" value="30" min="5" name="poll_interval_sec" />
        </div>
      </div>
      <div id="sc" style="display:none" class="fg">
        <label class="fl">Cron expression</label>
        <input type="text" placeholder="*/15 * * * *" name="cronExpr" />
      </div>
      <div class="fr">
        <div class="fg">
          <label class="fl">Expected schema ID</label>
          <input type="text" placeholder="UUID from schemas list" name="expected_schema_id" />
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--border)">
      <button class="btn" data-close="m-channel">Cancel</button>
      <button class="btn p" data-close="m-channel" data-toast="Channel created"><i class="ti ti-check"></i>Create channel</button>
    </div>
  </div>
</div>`;
