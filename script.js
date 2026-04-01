const FACTORIES = ["Factory 1", "Factory 2", "Factory 3", "In House"];

const ORDER_PROFILES = [
  "Re-Order",
  "Repair",
  "Replacement",
  "Stock Replenishment",
  "Memo",
  "Opening Order",
  "Add On",
  "Stock Balance",
  "Buyout",
  "Payable Buyout",
  "Memo - Short Term",
  "Memo - Long Term",
  "Sold Memo",
  "Miscellaneous",
  "Marketing"
];

let orders = [];

const selectedFactories = new Set(FACTORIES);
const selectedOrderProfiles = new Set(ORDER_PROFILES);

const factoryFiltersContainer = document.getElementById("factory-filters");
const orderProfileFiltersContainer = document.getElementById("order-profile-filters");
const toggleAllFactoriesButton = document.getElementById("toggle-all-factories");
const toggleAllProfilesButton = document.getElementById("toggle-all-profiles");
const clearDateRangeButton = document.getElementById("clear-date-range");
const shipDateStartInput = document.getElementById("ship-date-start");
const shipDateEndInput = document.getElementById("ship-date-end");
const tableBody = document.getElementById("orders-table-body");

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
});

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function getBpoBadgeVariant(shipDate, bpoDate) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysBeforeShip = Math.round((shipDate - bpoDate) / MS_PER_DAY);

  if (daysBeforeShip <= 5) {
    return "badge--danger";
  }

  if (daysBeforeShip <= 7) {
    return "badge--warning";
  }

  return "badge--success";
}

function createFilterChip(value, selectedSet, onChange) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.textContent = value;
  chip.setAttribute("aria-pressed", String(selectedSet.has(value)));

  chip.addEventListener("click", () => {
    if (selectedSet.has(value)) {
      selectedSet.delete(value);
    } else {
      selectedSet.add(value);
    }

    onChange();
  });

  return chip;
}

function renderFactoryFilters() {
  factoryFiltersContainer.innerHTML = "";

  FACTORIES.forEach((factory) => {
    const chip = createFilterChip(factory, selectedFactories, () => {
      updateToggleAllLabel(toggleAllFactoriesButton, selectedFactories, FACTORIES);
      renderFactoryFilters();
      renderTable();
    });

    factoryFiltersContainer.appendChild(chip);
  });
}

function renderOrderProfileFilters() {
  orderProfileFiltersContainer.innerHTML = "";

  ORDER_PROFILES.forEach((orderProfile) => {
    const chip = createFilterChip(orderProfile, selectedOrderProfiles, () => {
      updateToggleAllLabel(toggleAllProfilesButton, selectedOrderProfiles, ORDER_PROFILES);
      renderOrderProfileFilters();
      renderTable();
    });

    orderProfileFiltersContainer.appendChild(chip);
  });
}

function updateToggleAllLabel(button, selectedSet, options) {
  button.textContent = selectedSet.size === options.length ? "Clear All" : "Select All";
}

function setAllFilters(selectedSet, options, shouldSelectAll) {
  if (shouldSelectAll) {
    options.forEach((value) => selectedSet.add(value));
    return;
  }

  selectedSet.clear();
}

function renderTable() {
  const startDate = shipDateStartInput.value ? toDate(shipDateStartInput.value) : null;
  const endDate = shipDateEndInput.value ? toDate(shipDateEndInput.value) : null;

  const filteredOrders = orders
    .filter((order) => selectedFactories.has(order.factory))
    .filter((order) => selectedOrderProfiles.has(order.orderProfile))
    .filter((order) => {
      const shipDate = toDate(order.shipDate);

      if (startDate && shipDate < startDate) {
        return false;
      }

      if (endDate && shipDate > endDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => toDate(a.shipDate) - toDate(b.shipDate));

  if (filteredOrders.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No orders match the selected filters.</td></tr>';
    return;
  }

  let lastShipDate = null;

  tableBody.innerHTML = filteredOrders
    .map((order) => {
      const shipDate = toDate(order.shipDate);
      const bpoDate = toDate(order.bpoDateNeeded);
      const bpoBadgeVariant = getBpoBadgeVariant(shipDate, bpoDate);
      const isNewShipDateGroup = order.shipDate !== lastShipDate;
      lastShipDate = order.shipDate;

      const dateGroupDivider = isNewShipDateGroup
        ? `
        <tr class="ship-date-divider-row">
          <td colspan="9" class="ship-date-divider">
            ${fmtDate.format(shipDate)}
          </td>
        </tr>
      `
        : "";

      return `
        ${dateGroupDivider}
        <tr>
          <td>${order.uid}</td>
          <td>${order.sku}</td>
          <td>${order.karat}</td>
          <td>${order.color}</td>
          <td>${order.settingCenterStone}</td>
          <td>${order.factory}</td>
          <td>${order.orderProfile}</td>
          <td>${fmtDate.format(shipDate)}</td>
          <td>
            <span class="badge ${bpoBadgeVariant}">
              ${fmtDate.format(bpoDate)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

toggleAllFactoriesButton.addEventListener("click", () => {
  const shouldSelectAll = selectedFactories.size !== FACTORIES.length;
  setAllFilters(selectedFactories, FACTORIES, shouldSelectAll);
  updateToggleAllLabel(toggleAllFactoriesButton, selectedFactories, FACTORIES);
  renderFactoryFilters();
  renderTable();
});

toggleAllProfilesButton.addEventListener("click", () => {
  const shouldSelectAll = selectedOrderProfiles.size !== ORDER_PROFILES.length;
  setAllFilters(selectedOrderProfiles, ORDER_PROFILES, shouldSelectAll);
  updateToggleAllLabel(toggleAllProfilesButton, selectedOrderProfiles, ORDER_PROFILES);
  renderOrderProfileFilters();
  renderTable();
});

shipDateStartInput.addEventListener("change", renderTable);
shipDateEndInput.addEventListener("change", renderTable);

clearDateRangeButton.addEventListener("click", () => {
  shipDateStartInput.value = "";
  shipDateEndInput.value = "";
  renderTable();
});

async function loadOrders() {
  try {
    const response = await fetch("./orders.json");

    if (!response.ok) {
      throw new Error(`Failed to load orders: ${response.status}`);
    }

    orders = await response.json();
    return true;
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">Unable to load orders data.</td></tr>';
    return false;
  }
}

async function initializeApp() {
  updateToggleAllLabel(toggleAllFactoriesButton, selectedFactories, FACTORIES);
  updateToggleAllLabel(toggleAllProfilesButton, selectedOrderProfiles, ORDER_PROFILES);
  renderFactoryFilters();
  renderOrderProfileFilters();
  const hasLoadedOrders = await loadOrders();

  if (hasLoadedOrders) {
    renderTable();
  }
}

initializeApp();
