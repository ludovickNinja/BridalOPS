const FACTORIES = ["Factory 1", "Factory 2", "Factory 3", "In House"];

const orders = [
  {
    uid: "A10041",
    sku: "BR-4471",
    karat: "14K",
    color: "Yellow",
    settingCenterStone: "Yes",
    factory: "Factory 1",
    shipDate: "2026-04-02",
    bpoDateNeeded: "2026-03-31"
  },
  {
    uid: "A10033",
    sku: "ER-2120",
    karat: "18K",
    color: "White",
    settingCenterStone: "Provide and Set",
    factory: "In House",
    shipDate: "2026-04-01",
    bpoDateNeeded: "2026-04-03"
  },
  {
    uid: "A10058",
    sku: "BR-9908",
    karat: "14K",
    color: "Rose",
    settingCenterStone: "No",
    factory: "Factory 3",
    shipDate: "2026-04-04",
    bpoDateNeeded: "2026-03-29"
  },
  {
    uid: "A10039",
    sku: "NE-8882",
    karat: "10K",
    color: "White",
    settingCenterStone: "Yes",
    factory: "Factory 2",
    shipDate: "2026-04-03",
    bpoDateNeeded: "2026-04-02"
  },
  {
    uid: "A10065",
    sku: "ER-5548",
    karat: "18K",
    color: "Yellow",
    settingCenterStone: "Provide and Set",
    factory: "Factory 1",
    shipDate: "2026-04-05",
    bpoDateNeeded: "2026-04-04"
  }
];

const selectedFactories = new Set(FACTORIES);

const filtersContainer = document.getElementById("factory-filters");
const toggleAllButton = document.getElementById("toggle-all");
const tableBody = document.getElementById("orders-table-body");

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric"
});

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function renderFilters() {
  filtersContainer.innerHTML = "";

  FACTORIES.forEach((factory) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = factory;
    chip.setAttribute("aria-pressed", String(selectedFactories.has(factory)));

    chip.addEventListener("click", () => {
      if (selectedFactories.has(factory)) {
        selectedFactories.delete(factory);
      } else {
        selectedFactories.add(factory);
      }

      updateToggleAllLabel();
      renderFilters();
      renderTable();
    });

    filtersContainer.appendChild(chip);
  });
}

function updateToggleAllLabel() {
  toggleAllButton.textContent =
    selectedFactories.size === FACTORIES.length ? "Clear All" : "Select All";
}

function renderTable() {
  const filteredOrders = orders
    .filter((order) => selectedFactories.has(order.factory))
    .sort((a, b) => toDate(a.shipDate) - toDate(b.shipDate));

  if (filteredOrders.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">No orders match the selected factory filters.</td></tr>';
    return;
  }

  tableBody.innerHTML = filteredOrders
    .map((order) => {
      const shipDate = toDate(order.shipDate);
      const bpoDate = toDate(order.bpoDateNeeded);
      const isLateBpo = bpoDate > shipDate;

      return `
        <tr>
          <td>${order.uid}</td>
          <td>${order.sku}</td>
          <td>${order.karat}</td>
          <td>${order.color}</td>
          <td>${order.settingCenterStone}</td>
          <td>${order.factory}</td>
          <td>${fmtDate.format(shipDate)}</td>
          <td>
            <span class="badge ${isLateBpo ? "badge--danger" : ""}">
              ${fmtDate.format(bpoDate)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

toggleAllButton.addEventListener("click", () => {
  if (selectedFactories.size === FACTORIES.length) {
    selectedFactories.clear();
  } else {
    FACTORIES.forEach((factory) => selectedFactories.add(factory));
  }

  updateToggleAllLabel();
  renderFilters();
  renderTable();
});

updateToggleAllLabel();
renderFilters();
renderTable();
