const STORAGE_KEY = "player-pay-calculator-v1";
const MAX_FW = 4;
const FW_PERCENT = 10;
const DEFAULT_ACTIVITY_BONUS = [3000000, 2000000, 1000000];

const state = loadState();

const els = {
  factionForm: document.querySelector("#factionForm"),
  factionName: document.querySelector("#factionName"),
  factionsList: document.querySelector("#factionsList"),

  playerForm: document.querySelector("#playerForm"),
  playerName: document.querySelector("#playerName"),
  playerFaction: document.querySelector("#playerFaction"),
  playersList: document.querySelector("#playersList"),

  itemForm: document.querySelector("#itemForm"),
  itemName: document.querySelector("#itemName"),
  itemPrice: document.querySelector("#itemPrice"),
  itemsList: document.querySelector("#itemsList"),

  paymentForm: document.querySelector("#paymentForm"),
  paymentPlayer: document.querySelector("#paymentPlayer"),
  paymentItem: document.querySelector("#paymentItem"),
  paymentQuantity: document.querySelector("#paymentQuantity"),

  payrollForm: document.querySelector("#payrollForm"),
  payrollPlayer: document.querySelector("#payrollPlayer"),
  payrollRole: document.querySelector("#payrollRole"),
  payrollFixedSalary: document.querySelector("#payrollFixedSalary"),
  payrollFixedSalaryHint: document.querySelector("#payrollFixedSalaryHint"),
  fwChecks: Array.from(document.querySelectorAll("[data-fw-index]")),

  bonusSettingsForm: document.querySelector("#bonusSettingsForm"),
  bonusEnabled: document.querySelector("#bonusEnabled"),
  bonusFirst: document.querySelector("#bonusFirst"),
  bonusSecond: document.querySelector("#bonusSecond"),
  bonusThird: document.querySelector("#bonusThird"),
  activityBonusList: document.querySelector("#activityBonusList"),

  playersReport: document.querySelector("#playersReport"),
  playerSearch: document.querySelector("#playerSearch"),
  factionFilter: document.querySelector("#factionFilter"),

  statFactions: document.querySelector("#statFactions"),
  statPlayers: document.querySelector("#statPlayers"),
  statItems: document.querySelector("#statItems"),
  statTotal: document.querySelector("#statTotal"),
  grandTotal: document.querySelector("#grandTotal"),

  resetAllBtn: document.querySelector("#resetAllBtn"),
  toast: document.querySelector("#toast"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFileInput: document.querySelector("#importFileInput")
};

function defaultState() {
  return {
    factions: [],
    players: [],
    items: [],
    payments: [],
    settings: {
      activityBonusEnabled: true,
      activityBonus: [...DEFAULT_ACTIVITY_BONUS]
    }
  };
}

function createDefaultPlayer(raw = {}) {
  const fwCount = Number.isInteger(raw.fwCount) ? clamp(raw.fwCount, 0, MAX_FW) : 0;
  const fwFlags = Array.isArray(raw.fwFlags)
    ? Array.from({ length: MAX_FW }, (_, i) => Boolean(raw.fwFlags[i]))
    : Array.from({ length: MAX_FW }, (_, i) => i < fwCount);

  return {
    ...raw,
    role: raw.role === "subleader" ? "subleader" : "member",
    fixedSalary: toMoneyNumber(raw.fixedSalary),
    fwFlags,
    paid: Boolean(raw.paid)
  };
}

function normalizeState(raw) {
  const fallback = defaultState();
  if (!raw || typeof raw !== "object") return fallback;

  const source = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const settings = source.settings && typeof source.settings === "object" ? source.settings : {};

  const bonusSource = Array.isArray(settings.activityBonus) ? settings.activityBonus : DEFAULT_ACTIVITY_BONUS;

  return {
    factions: Array.isArray(source.factions) ? source.factions : [],
    players: Array.isArray(source.players) ? source.players.map(createDefaultPlayer) : [],
    items: Array.isArray(source.items) ? source.items : [],
    payments: Array.isArray(source.payments) ? source.payments : [],
    settings: {
      activityBonusEnabled: settings.activityBonusEnabled !== false,
      activityBonus: Array.from({ length: 3 }, (_, i) => toMoneyNumber(bonusSource[i] ?? DEFAULT_ACTIVITY_BONUS[i]))
    }
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState();
    return normalizeState(JSON.parse(saved));
  } catch (error) {
    console.error("خطا در بارگذاری اطلاعات:", error);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toMoneyNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function money(value) {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFaction(id) {
  return state.factions.find(f => f.id === id);
}

function getPlayer(id) {
  return state.players.find(p => p.id === id);
}

function getItem(id) {
  return state.items.find(i => i.id === id);
}

function getFwCount(player) {
  return Array.isArray(player.fwFlags) ? player.fwFlags.filter(Boolean).length : 0;
}

function playerActivityTotal(playerId) {
  return state.payments
    .filter(p => p.playerId === playerId)
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);
}

function playerBaseSalary(player) {
  const activityTotal = playerActivityTotal(player.id);
  return player.role === "subleader"
    ? toMoneyNumber(player.fixedSalary) + activityTotal
    : activityTotal;
}

function playerFwDeduction(player) {
  return playerBaseSalary(player) * getFwCount(player) * (FW_PERCENT / 100);
}

function getActivityRanking() {
  if (!state.settings.activityBonusEnabled) return [];

  return state.players
    .filter(player => player.role !== "subleader")
    .map(player => ({ player, activitySalary: playerActivityTotal(player.id) }))
    .filter(entry => entry.activitySalary > 0)
    .sort((a, b) => {
      const totalDiff = b.activitySalary - a.activitySalary;
      if (totalDiff !== 0) return totalDiff;
      return String(a.player.name).localeCompare(String(b.player.name), "fa");
    })
    .slice(0, 3);
}

function getActivityBonus(playerId) {
  const ranking = getActivityRanking();
  const index = ranking.findIndex(entry => entry.player.id === playerId);
  return index >= 0 ? toMoneyNumber(state.settings.activityBonus[index]) : 0;
}

function playerFinalSalary(player) {
  const base = playerBaseSalary(player);
  const deduction = playerFwDeduction(player);
  const bonus = player.role === "member" ? getActivityBonus(player.id) : 0;
  return Math.max(0, base - deduction + bonus);
}

function overallTotal() {
  return state.players.reduce((sum, player) => sum + playerFinalSalary(player), 0);
}

function exportState() {
  const payload = {
    app: "player-pay-calculator",
    version: 3,
    exportedAt: new Date().toISOString(),
    data: state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `player-pay-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("فایل خروجی دانلود شد.");
}

function normalizeImportedData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const source = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const requiredArrays = ["factions", "players", "items", "payments"];
  if (!requiredArrays.every(key => Array.isArray(source[key]))) return null;

  return normalizeState(source);
}

function importStateFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    let parsed;

    try {
      parsed = JSON.parse(reader.result);
    } catch (error) {
      showToast("فایل انتخاب‌شده یک JSON معتبر نیست.", "error");
      return;
    }

    const normalized = normalizeImportedData(parsed);
    if (!normalized) {
      showToast("ساختار فایل با این برنامه سازگار نیست.", "error");
      return;
    }

    if (!confirm("وارد کردن این فایل تمام اطلاعات فعلی را جایگزین می‌کند. ادامه می‌دهید؟")) return;

    Object.assign(state, normalized);
    saveState();
    renderAll();
    syncPayrollForm();
    syncBonusSettingsForm();
    showToast("اطلاعات با موفقیت وارد شد.");
  };

  reader.onerror = () => showToast("خطا در خواندن فایل.", "error");
  reader.readAsText(file);
}

function showToast(message, type = "success") {
  els.toast.textContent = message;
  els.toast.className = `toast show ${type}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.className = "toast";
  }, 2500);
}

function renderAll() {
  renderStats();
  renderFactions();
  renderPlayers();
  renderItems();
  renderSelects();
  syncPayrollForm();
  syncBonusSettingsForm();
  renderActivityBonus();
  renderReport();
}

function renderStats() {
  els.statFactions.textContent = money(state.factions.length);
  els.statPlayers.textContent = money(state.players.length);
  els.statItems.textContent = money(state.items.length);
  els.statTotal.textContent = money(overallTotal());
  els.grandTotal.textContent = money(overallTotal());
}

function renderFactions() {
  if (!state.factions.length) {
    els.factionsList.innerHTML = `<div class="empty">هنوز فکشنی اضافه نشده است.</div>`;
    return;
  }

  els.factionsList.innerHTML = state.factions.map(faction => {
    const count = state.players.filter(p => p.factionId === faction.id).length;

    return `
      <div class="list-item">
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(faction.name)}</div>
          <div class="list-item-sub">${money(count)} پلیر</div>
        </div>
        <button class="btn btn-danger btn-small" data-delete-faction="${faction.id}">حذف</button>
      </div>
    `;
  }).join("");
}

function roleLabel(player) {
  return player.role === "subleader" ? "ساب‌لیدر" : "ممبر";
}

function renderPlayers() {
  if (!state.players.length) {
    els.playersList.innerHTML = `<div class="empty">هنوز پلیری اضافه نشده است.</div>`;
    return;
  }

  els.playersList.innerHTML = state.players.map(player => {
    const faction = getFaction(player.factionId);
    const activity = playerActivityTotal(player.id);
    const finalSalary = playerFinalSalary(player);

    return `
      <div class="list-item player-list-item">
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(player.name)}</div>
          <div class="list-item-sub">
            ${escapeHtml(faction?.name || "بدون فکشن")} · ${roleLabel(player)} · FW: ${getFwCount(player)}/${MAX_FW} · حقوق نهایی: ${money(finalSalary)}
          </div>
        </div>
        <div class="list-item-actions">
          <button
            class="payment-status-btn ${player.paid ? "is-paid" : "is-unpaid"}"
            type="button"
            title="${player.paid ? "علامت‌گذاری به‌عنوان پرداخت‌نشده" : "علامت‌گذاری به‌عنوان پرداخت‌شده"}"
            aria-label="${player.paid ? "علامت‌گذاری به‌عنوان پرداخت‌نشده" : "علامت‌گذاری به‌عنوان پرداخت‌شده"}"
            data-toggle-paid="${player.id}"
          >
            <span class="payment-status-icon">${player.paid ? "✓" : "!"}</span>
            <span>${player.paid ? "پرداخت شد" : "پرداخت نشده"}</span>
          </button>
          <button class="btn btn-secondary btn-small" data-edit-player="${player.id}">تنظیم حقوق</button>
          <button class="btn btn-danger btn-small" data-delete-player="${player.id}">حذف</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderItems() {
  if (!state.items.length) {
    els.itemsList.innerHTML = `<div class="empty">هنوز آیتمی اضافه نشده است.</div>`;
    return;
  }

  els.itemsList.innerHTML = state.items.map(item => `
    <div class="list-item">
      <div class="list-item-main">
        <div class="list-item-title">${escapeHtml(item.name)}</div>
        <div class="list-item-sub">${money(item.unitPrice)} برای هر عدد</div>
      </div>
      <button class="btn btn-danger btn-small" data-delete-item="${item.id}">حذف</button>
    </div>
  `).join("");
}

function renderSelects() {
  const selectedFaction = els.playerFaction.value;
  const selectedPaymentPlayer = els.paymentPlayer.value;
  const selectedItem = els.paymentItem.value;
  const selectedPayrollPlayer = els.payrollPlayer.value;
  const currentFilter = els.factionFilter.value;

  els.playerFaction.innerHTML = state.factions.length
    ? state.factions.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("")
    : `<option value="">ابتدا یک فکشن اضافه کنید</option>`;

  els.paymentPlayer.innerHTML = state.players.length
    ? state.players.map(p => {
        const faction = getFaction(p.factionId);
        return `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(faction?.name || "بدون فکشن")}</option>`;
      }).join("")
    : `<option value="">ابتدا یک پلیر اضافه کنید</option>`;

  els.paymentItem.innerHTML = state.items.length
    ? state.items.map(i => `<option value="${i.id}">${escapeHtml(i.name)} — ${money(i.unitPrice)}</option>`).join("")
    : `<option value="">ابتدا یک آیتم اضافه کنید</option>`;

  els.payrollPlayer.innerHTML = state.players.length
    ? state.players.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")
    : `<option value="">ابتدا یک پلیر اضافه کنید</option>`;

  if (selectedFaction && state.factions.some(f => f.id === selectedFaction)) {
    els.playerFaction.value = selectedFaction;
  }

  if (selectedPaymentPlayer && state.players.some(p => p.id === selectedPaymentPlayer)) {
    els.paymentPlayer.value = selectedPaymentPlayer;
  }

  if (selectedItem && state.items.some(i => i.id === selectedItem)) {
    els.paymentItem.value = selectedItem;
  }

  if (selectedPayrollPlayer && state.players.some(p => p.id === selectedPayrollPlayer)) {
    els.payrollPlayer.value = selectedPayrollPlayer;
  }

  els.factionFilter.innerHTML = `
    <option value="all">همه فکشن‌ها</option>
    ${state.factions.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("")}
  `;

  if (state.factions.some(f => f.id === currentFilter)) {
    els.factionFilter.value = currentFilter;
  }
}

function syncPayrollForm() {
  const player = getPlayer(els.payrollPlayer.value);

  if (!player) {
    els.payrollRole.value = "member";
    els.payrollFixedSalary.value = 0;
    els.payrollFixedSalary.disabled = true;
    els.payrollFixedSalaryHint.textContent = "برای ممبر، حقوق از فعالیت‌ها محاسبه می‌شود.";
    els.fwChecks.forEach(check => {
      check.checked = false;
      check.disabled = true;
    });
    return;
  }

  els.payrollRole.value = player.role;
  els.payrollFixedSalary.value = toMoneyNumber(player.fixedSalary);
  els.payrollFixedSalary.disabled = player.role !== "subleader";
  els.payrollFixedSalaryHint.textContent = player.role === "subleader"
    ? "حقوق ثابت ساب‌لیدر را وارد کنید؛ فعالیت‌های ثبت‌شده نیز به حقوق او اضافه می‌شوند، اما در بست اکتیویتی رتبه‌بندی نمی‌شود."
    : "مبلغ حقوق ممبر از فعالیت‌ها به‌دست می‌آید؛ این فیلد برای ممبر استفاده نمی‌شود.";

  els.fwChecks.forEach((check, index) => {
    check.disabled = false;
    check.checked = Boolean(player.fwFlags?.[index]);
  });
}

function renderActivityBonus() {
  const ranking = getActivityRanking();

  if (!state.settings.activityBonusEnabled) {
    els.activityBonusList.innerHTML = `
      <div class="empty">
        بست اکتیویتی غیرفعال است.
      </div>
    `;
    return;
  }

  if (!ranking.length) {
    els.activityBonusList.innerHTML = `
      <div class="empty">
        هنوز ممبری با درآمد فعالیتی ثبت نشده است.
      </div>
    `;
    return;
  }

  els.activityBonusList.innerHTML = ranking.map((entry, index) => {
    const bonus = toMoneyNumber(state.settings.activityBonus[index]);
    const faction = getFaction(entry.player.factionId);

    return `
      <div class="bonus-row">
        <div class="bonus-rank">${index + 1}</div>
        <div class="bonus-player">
          <strong>${escapeHtml(entry.player.name)}</strong>
          <span>${escapeHtml(faction?.name || "بدون فکشن")} · درآمد فعالیتی: ${money(entry.activitySalary)}</span>
        </div>
        <div class="bonus-amount">+${money(bonus)}</div>
      </div>
    `;
  }).join("");
}

function syncBonusSettingsForm() {
  els.bonusEnabled.checked = state.settings.activityBonusEnabled !== false;
  els.bonusFirst.value = toMoneyNumber(state.settings.activityBonus[0]);
  els.bonusSecond.value = toMoneyNumber(state.settings.activityBonus[1]);
  els.bonusThird.value = toMoneyNumber(state.settings.activityBonus[2]);
}

function renderReport() {
  const query = els.playerSearch.value.trim().toLowerCase();
  const filter = els.factionFilter.value;

  const players = state.players.filter(player => {
    const matchesFaction = filter === "all" || player.factionId === filter;
    const matchesQuery = !query || player.name.toLowerCase().includes(query);
    return matchesFaction && matchesQuery;
  });

  if (!players.length) {
    els.playersReport.innerHTML = `<div class="empty">پلیر مطابق فیلتر فعلی پیدا نشد.</div>`;
    return;
  }

  els.playersReport.innerHTML = players.map(player => {
    const faction = getFaction(player.factionId);
    const payments = state.payments.filter(p => p.playerId === player.id);
    const activity = playerActivityTotal(player.id);
    const base = playerBaseSalary(player);
    const fwCount = getFwCount(player);
    const deduction = playerFwDeduction(player);
    const bonus = getActivityBonus(player.id);
    const finalSalary = playerFinalSalary(player);
    const ranking = getActivityRanking().findIndex(entry => entry.player.id === player.id);

    const rows = payments.length
      ? payments.map(payment => `
          <tr>
            <td>${escapeHtml(payment.itemName)}</td>
            <td>${money(payment.quantity)}</td>
            <td>${money(payment.unitPrice)}</td>
            <td>${money(payment.total)}</td>
            <td><button class="btn btn-danger btn-small" data-delete-payment="${payment.id}">حذف</button></td>
          </tr>
        `).join("")
      : `<tr><td colspan="5" class="muted">هنوز فعالیتی برای این پلیر ثبت نشده است.</td></tr>`;

    const bonusLabel = bonus > 0
      ? `<span class="salary-chip salary-bonus">بست اکتیویتی +${money(bonus)}</span>`
      : `<span class="salary-chip">بدون بست اکتیویتی</span>`;

    const roleChip = player.role === "subleader"
      ? `<span class="salary-chip salary-role">ساب‌لیدر · ثابت + فعالیت</span>`
      : `<span class="salary-chip salary-role">ممبر · فعالیتی${ranking >= 0 ? ` · رتبه ${ranking + 1}` : ""}</span>`;

    return `
      <article class="player-card">
        <div class="player-summary">
          <div class="player-info">
            <div class="player-name-row">
              <h3>${escapeHtml(player.name)}</h3>
              <button
                class="payment-status-icon-btn ${player.paid ? "is-paid" : "is-unpaid"}"
                type="button"
                title="${player.paid ? "علامت‌گذاری به‌عنوان پرداخت‌نشده" : "علامت‌گذاری به‌عنوان پرداخت‌شده"}"
                aria-label="${player.paid ? "علامت‌گذاری به‌عنوان پرداخت‌نشده" : "علامت‌گذاری به‌عنوان پرداخت‌شده"}"
                data-toggle-paid="${player.id}"
              >${player.paid ? "✓" : "!"}</button>
              <span class="payment-status-text ${player.paid ? "is-paid" : "is-unpaid"}">${player.paid ? "پرداخت شده" : "پرداخت نشده"}</span>
            </div>
            <span>${escapeHtml(faction?.name || "بدون فکشن")} · ${escapeHtml(roleLabel(player))} · ${money(payments.length)} رکورد</span>
          </div>
          <div class="player-total">${money(finalSalary)}</div>
        </div>

        <div class="salary-breakdown">
          <div class="salary-box">
            <span>مبنای حقوق</span>
            <strong>${money(base)}</strong>
            <small>${player.role === "subleader" ? `حقوق ثابت: ${money(toMoneyNumber(player.fixedSalary))} + فعالیت‌ها: ${money(activity)}` : `جمع فعالیت‌ها: ${money(activity)}`}</small>
          </div>
          <div class="salary-box">
            <span>FW</span>
            <strong>${money(deduction)}</strong>
            <small>${fwCount}/${MAX_FW} × ${FW_PERCENT}%</small>
          </div>
          <div class="salary-box">
            <span>بست اکتیویتی</span>
            <strong>${money(bonus)}</strong>
            <small>${player.role === "subleader" ? "برای ساب‌لیدر محاسبه نمی‌شود" : "فقط برای ۳ ممبر اول"}</small>
          </div>
          <div class="salary-box salary-box-final">
            ${roleChip}
            ${bonusLabel}
            <span>حقوق نهایی</span>
            <strong>${money(finalSalary)}</strong>
          </div>
        </div>

        <table class="payment-table">
          <thead>
            <tr>
              <th>فعالیت</th>
              <th>تعداد</th>
              <th>مبلغ واحد</th>
              <th>جمع</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </article>
    `;
  }).join("");
}

function updatePayrollPlayer(playerId) {
  if (!playerId) return;
  els.payrollPlayer.value = playerId;
  syncPayrollForm();
  els.payrollForm?.scrollIntoView({ behavior: "smooth", block: "center" });
}

els.factionForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = els.factionName.value.trim();
  if (!name) return;

  if (state.factions.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    showToast("این فکشن قبلاً وجود دارد.", "error");
    return;
  }

  state.factions.push({ id: uid("f"), name });
  saveState();
  els.factionForm.reset();
  renderAll();
  showToast("فکشن اضافه شد.");
});

els.playerForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = els.playerName.value.trim();
  const factionId = els.playerFaction.value;

  if (!name || !factionId) {
    showToast("نام پلیر و فکشن را وارد کنید.", "error");
    return;
  }

  state.players.push({
    id: uid("p"),
    name,
    factionId,
    role: "member",
    fixedSalary: 0,
    fwFlags: Array(MAX_FW).fill(false),
    paid: false
  });

  saveState();
  els.playerForm.reset();
  renderAll();
  showToast("پلیر اضافه شد؛ می‌توانید نقش، حقوق ثابت و FW او را تنظیم کنید.");
});

els.itemForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = els.itemName.value.trim();
  const unitPrice = Number(els.itemPrice.value);

  if (!name || !Number.isFinite(unitPrice) || unitPrice < 0) {
    showToast("نام آیتم و مبلغ معتبر وارد کنید.", "error");
    return;
  }

  if (state.items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
    showToast("این آیتم قبلاً وجود دارد.", "error");
    return;
  }

  state.items.push({ id: uid("i"), name, unitPrice });
  saveState();
  els.itemForm.reset();
  renderAll();
  showToast("آیتم اضافه شد.");
});

els.paymentForm.addEventListener("submit", event => {
  event.preventDefault();

  const playerId = els.paymentPlayer.value;
  const itemId = els.paymentItem.value;
  const quantity = Number(els.paymentQuantity.value);
  const player = getPlayer(playerId);
  const item = getItem(itemId);

  if (!player || !item || !Number.isInteger(quantity) || quantity <= 0) {
    showToast("پلیر، آیتم و تعداد معتبر وارد کنید.", "error");
    return;
  }

  state.payments.push({
    id: uid("pay"),
    playerId,
    itemId,
    itemName: item.name,
    unitPrice: item.unitPrice,
    quantity,
    total: item.unitPrice * quantity,
    createdAt: new Date().toISOString()
  });

  saveState();
  els.paymentQuantity.value = 1;
  renderAll();
  showToast(`فعالیت برای ${player.name} ثبت شد.`);
});

els.payrollPlayer.addEventListener("change", syncPayrollForm);

els.payrollRole.addEventListener("change", () => {
  const isSubleader = els.payrollRole.value === "subleader";
  els.payrollFixedSalary.disabled = !isSubleader;
  els.payrollFixedSalaryHint.textContent = isSubleader
    ? "حقوق ثابت ساب‌لیدر را وارد کنید؛ فعالیت‌های ثبت‌شده نیز به حقوق او اضافه می‌شوند، اما در بست اکتیویتی رتبه‌بندی نمی‌شود."
    : "مبلغ حقوق ممبر از فعالیت‌ها به‌دست می‌آید؛ این فیلد برای ممبر استفاده نمی‌شود.";
});

els.payrollForm.addEventListener("submit", event => {
  event.preventDefault();

  const player = getPlayer(els.payrollPlayer.value);
  if (!player) {
    showToast("ابتدا یک پلیر را انتخاب کنید.", "error");
    return;
  }

  const role = els.payrollRole.value === "subleader" ? "subleader" : "member";
  const fixedSalary = Number(els.payrollFixedSalary.value);

  if (!Number.isFinite(fixedSalary) || fixedSalary < 0) {
    showToast("حقوق ثابت باید یک مبلغ معتبر باشد.", "error");
    return;
  }

  player.role = role;
  player.fixedSalary = fixedSalary;
  player.fwFlags = els.fwChecks.map(check => check.checked);

  saveState();
  renderAll();
  els.payrollPlayer.value = player.id;
  syncPayrollForm();
  showToast(`تنظیمات حقوق ${player.name} ذخیره شد.`);
});

els.bonusSettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  const amounts = [els.bonusFirst, els.bonusSecond, els.bonusThird].map(input => Number(input.value));

  if (amounts.some(value => !Number.isFinite(value) || value < 0)) {
    showToast("مبلغ‌های بست اکتیویتی باید معتبر باشند.", "error");
    return;
  }

  state.settings.activityBonusEnabled = els.bonusEnabled.checked;
  state.settings.activityBonus = amounts;

  saveState();
  renderAll();
  showToast("تنظیمات بست اکتیویتی ذخیره شد.");
});

document.addEventListener("click", event => {
  const target = event.target instanceof Element ? event.target : null;
  const deleteFactionId = target?.dataset.deleteFaction;
  const deletePlayerId = target?.dataset.deletePlayer;
  const editPlayerId = target?.dataset.editPlayer;
  const deleteItemId = target?.dataset.deleteItem;
  const deletePaymentId = target?.dataset.deletePayment;
  const paidToggle = target?.closest("[data-toggle-paid]");
  const togglePaidPlayerId = paidToggle?.dataset.togglePaid;

  if (togglePaidPlayerId) {
    const player = getPlayer(togglePaidPlayerId);
    if (!player) return;

    player.paid = !player.paid;
    saveState();
    renderAll();
    showToast(player.paid ? `پرداخت ${player.name} ثبت شد.` : `وضعیت ${player.name} به پرداخت‌نشده تغییر کرد.`);
    return;
  }

  if (editPlayerId) {
    updatePayrollPlayer(editPlayerId);
    return;
  }

  if (deleteFactionId) {
    const faction = getFaction(deleteFactionId);
    const relatedPlayers = state.players.filter(p => p.factionId === deleteFactionId);

    if (relatedPlayers.length) {
      showToast("ابتدا پلیرهای این فکشن را حذف کنید.", "error");
      return;
    }

    state.factions = state.factions.filter(f => f.id !== deleteFactionId);
    saveState();
    renderAll();
    showToast(`فکشن ${faction?.name || ""} حذف شد.`);
  }

  if (deletePlayerId) {
    const player = getPlayer(deletePlayerId);
    if (!player) return;

    if (!confirm(`پلیر «${player.name}» و تمام فعالیت‌های او حذف شود؟`)) return;

    state.players = state.players.filter(p => p.id !== deletePlayerId);
    state.payments = state.payments.filter(p => p.playerId !== deletePlayerId);
    saveState();
    renderAll();
    showToast("پلیر حذف شد.");
  }

  if (deleteItemId) {
    const item = getItem(deleteItemId);
    if (!item) return;

    if (state.payments.some(p => p.itemId === deleteItemId)) {
      showToast("این آیتم در سوابق قبلی استفاده شده و حذف نشد.", "error");
      return;
    }

    state.items = state.items.filter(i => i.id !== deleteItemId);
    saveState();
    renderAll();
    showToast("آیتم حذف شد.");
  }

  if (deletePaymentId) {
    state.payments = state.payments.filter(p => p.id !== deletePaymentId);
    saveState();
    renderAll();
    showToast("رکورد فعالیت حذف شد.");
  }
});

els.playerSearch.addEventListener("input", renderReport);
els.factionFilter.addEventListener("change", renderReport);

els.exportBtn.addEventListener("click", exportState);
els.importBtn.addEventListener("click", () => els.importFileInput.click());

els.importFileInput.addEventListener("change", () => {
  const file = els.importFileInput.files && els.importFileInput.files[0];
  if (file) importStateFromFile(file);
  els.importFileInput.value = "";
});

els.resetAllBtn.addEventListener("click", () => {
  if (!confirm("تمام فکشن‌ها، پلیرها، آیتم‌ها، سوابق پرداخت و تنظیمات حقوق حذف شوند؟ این عملیات قابل بازگشت نیست.")) {
    return;
  }

  Object.assign(state, defaultState());
  saveState();
  renderAll();
  showToast("همه داده‌ها پاک شدند.");
});

renderAll();
