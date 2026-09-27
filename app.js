const STORAGE_KEY = "player-pay-calculator-v1";

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

  playersReport: document.querySelector("#playersReport"),
  playerSearch: document.querySelector("#playerSearch"),
  factionFilter: document.querySelector("#factionFilter"),

  statFactions: document.querySelector("#statFactions"),
  statPlayers: document.querySelector("#statPlayers"),
  statItems: document.querySelector("#statItems"),
  statTotal: document.querySelector("#statTotal"),
  grandTotal: document.querySelector("#grandTotal"),

  resetAllBtn: document.querySelector("#resetAllBtn"),
  toast: document.querySelector("#toast")
};

function defaultState() {
  return {
    factions: [],
    players: [],
    items: [],
    payments: []
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState();

    const parsed = JSON.parse(saved);
    return {
      factions: Array.isArray(parsed.factions) ? parsed.factions : [],
      players: Array.isArray(parsed.players) ? parsed.players : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : []
    };
  } catch (error) {
    console.error("Could not load data:", error);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
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

function playerTotal(playerId) {
  return state.payments
    .filter(p => p.playerId === playerId)
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);
}

function overallTotal() {
  return state.payments.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
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
  renderReport();
}

function renderStats() {
  els.statFactions.textContent = state.factions.length;
  els.statPlayers.textContent = state.players.length;
  els.statItems.textContent = state.items.length;
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
          <div class="list-item-sub">${count} پلیر</div>
        </div>
        <button class="btn btn-danger btn-small" data-delete-faction="${faction.id}">حذف</button>
      </div>
    `;
  }).join("");
}

function renderPlayers() {
  if (!state.players.length) {
    els.playersList.innerHTML = `<div class="empty">هنوز پلیری اضافه نشده است.</div>`;
    return;
  }

  els.playersList.innerHTML = state.players.map(player => {
    const faction = getFaction(player.factionId);
    const total = playerTotal(player.id);
    return `
      <div class="list-item">
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(player.name)}</div>
          <div class="list-item-sub">
            ${escapeHtml(faction?.name || "بدون فکشن")} · ${money(total)}
          </div>
        </div>
        <button class="btn btn-danger btn-small" data-delete-player="${player.id}">حذف</button>
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
        <div class="list-item-sub">${money(item.unitPrice)} برای هر واحد</div>
      </div>
      <button class="btn btn-danger btn-small" data-delete-item="${item.id}">حذف</button>
    </div>
  `).join("");
}

function renderSelects() {
  const selectedFaction = els.playerFaction.value;
  const selectedPlayer = els.paymentPlayer.value;
  const selectedItem = els.paymentItem.value;

  els.playerFaction.innerHTML = state.factions.length
    ? state.factions.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("")
    : `<option value="">ابتدا یک فکشن بسازید</option>`;

  els.paymentPlayer.innerHTML = state.players.length
    ? state.players.map(p => {
        const faction = getFaction(p.factionId);
        return `<option value="${p.id}">${escapeHtml(p.name)} — ${escapeHtml(faction?.name || "بدون فکشن")}</option>`;
      }).join("")
    : `<option value="">ابتدا یک پلیر بسازید</option>`;

  els.paymentItem.innerHTML = state.items.length
    ? state.items.map(i => `<option value="${i.id}">${escapeHtml(i.name)} — ${money(i.unitPrice)}</option>`).join("")
    : `<option value="">ابتدا یک آیتم بسازید</option>`;

  if (selectedFaction && state.factions.some(f => f.id === selectedFaction)) {
    els.playerFaction.value = selectedFaction;
  }
  if (selectedPlayer && state.players.some(p => p.id === selectedPlayer)) {
    els.paymentPlayer.value = selectedPlayer;
  }
  if (selectedItem && state.items.some(i => i.id === selectedItem)) {
    els.paymentItem.value = selectedItem;
  }

  const currentFilter = els.factionFilter.value;
  els.factionFilter.innerHTML = `
    <option value="all">همه فکشن‌ها</option>
    ${state.factions.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("")}
  `;
  if (state.factions.some(f => f.id === currentFilter)) {
    els.factionFilter.value = currentFilter;
  }
}

function renderReport() {
  const query = els.playerSearch.value.trim().toLowerCase();
  const filter = els.factionFilter.value;

  const players = state.players.filter(player => {
    const factionMatch = filter === "all" || player.factionId === filter;
    const queryMatch = !query || player.name.toLowerCase().includes(query);
    return factionMatch && queryMatch;
  });

  if (!players.length) {
    els.playersReport.innerHTML = `<div class="empty">پلیر مطابق فیلتر فعلی پیدا نشد.</div>`;
    return;
  }

  els.playersReport.innerHTML = players.map(player => {
    const faction = getFaction(player.factionId);
    const payments = state.payments.filter(p => p.playerId === player.id);
    const total = playerTotal(player.id);

    const rows = payments.length
      ? payments.map(payment => `
        <tr>
          <td>${escapeHtml(payment.itemName)}</td>
          <td>${payment.quantity}</td>
          <td>${money(payment.unitPrice)}</td>
          <td>${money(payment.total)}</td>
          <td>
            <button
              class="btn btn-danger btn-small"
              data-delete-payment="${payment.id}"
              title="حذف این فعالیت"
            >حذف</button>
          </td>
        </tr>
      `).join("")
      : `
        <tr>
          <td colspan="5" class="muted">هنوز فعالیتی برای این پلیر ثبت نشده است.</td>
        </tr>
      `;

    return `
      <article class="player-card">
        <div class="player-summary">
          <div class="player-info">
            <h3>${escapeHtml(player.name)}</h3>
            <span>${escapeHtml(faction?.name || "بدون فکشن")} · ${payments.length} رکورد</span>
          </div>
          <div class="player-total">${money(total)}</div>
        </div>
        <table class="payment-table">
          <thead>
            <tr>
              <th>فعالیت</th>
              <th>تعداد</th>
              <th>قیمت واحد</th>
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

els.factionForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = els.factionName.value.trim();
  if (!name) return;

  const exists = state.factions.some(f => f.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    showToast("این فکشن قبلاً وجود دارد.", "error");
    return;
  }

  state.factions.push({
    id: uid("f"),
    name
  });

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
    factionId
  });

  saveState();
  els.playerForm.reset();
  renderAll();
  showToast("پلیر اضافه شد.");
});

els.itemForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = els.itemName.value.trim();
  const unitPrice = Number(els.itemPrice.value);

  if (!name || !Number.isFinite(unitPrice) || unitPrice < 0) {
    showToast("نام آیتم و قیمت معتبر وارد کنید.", "error");
    return;
  }

  const exists = state.items.some(i => i.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    showToast("این آیتم قبلاً وجود دارد.", "error");
    return;
  }

  state.items.push({
    id: uid("i"),
    name,
    unitPrice
  });

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

  // قیمت در همان لحظه ثبت ذخیره می‌شود؛ تغییر قیمت آیتم در آینده
  // روی رکوردهای قبلی اثر نمی‌گذارد.
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

document.addEventListener("click", event => {
  const deleteFactionId = event.target.dataset.deleteFaction;
  const deletePlayerId = event.target.dataset.deletePlayer;
  const deleteItemId = event.target.dataset.deleteItem;
  const deletePaymentId = event.target.dataset.deletePayment;

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

    const ok = confirm(`پلیر "${player.name}" و تمام فعالیت‌های او حذف شود؟`);
    if (!ok) return;

    state.players = state.players.filter(p => p.id !== deletePlayerId);
    state.payments = state.payments.filter(p => p.playerId !== deletePlayerId);
    saveState();
    renderAll();
    showToast("پلیر حذف شد.");
  }

  if (deleteItemId) {
    const item = getItem(deleteItemId);
    if (!item) return;

    const used = state.payments.some(p => p.itemId === deleteItemId);
    if (used) {
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

els.resetAllBtn.addEventListener("click", () => {
  const ok = confirm(
    "تمام فکشن‌ها، پلیرها، آیتم‌ها و سوابق پرداخت حذف شوند؟ این عملیات قابل بازگشت نیست."
  );

  if (!ok) return;

  Object.assign(state, defaultState());
  saveState();
  renderAll();
  showToast("همه داده‌ها پاک شدند.");
});

renderAll();
