// Standalone examples use local UI state. The catalog and bag never send data.
for (const demo of document.querySelectorAll("[data-filter]")) {
  const options = [...demo.querySelectorAll("[data-choice]")];
  const buttons = [...demo.querySelectorAll("[data-filter-value]")];
  const select = demo.querySelector("[data-filter-select]");
  const status = demo.querySelector("[data-filter-status]");

  function applyFilter(value) {
    let visible = 0;
    for (const item of options) {
      item.hidden = value !== "all" && item.dataset.choice !== value;
      if (!item.hidden) visible++;
    }
    for (const button of buttons)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filterValue === value),
      );
    if (status) {
      const nouns =
        status.dataset.filterStatus === "class"
          ? ["class", "classes"]
          : ["item", "items"];
      status.textContent = `${visible} ${nouns[visible === 1 ? 0 : 1]} shown`;
    }
  }

  select?.addEventListener("change", () => applyFilter(select.value));
  for (const button of buttons)
    button.addEventListener("click", () =>
      applyFilter(button.dataset.filterValue),
    );
}

const cart = document.querySelector("[data-cart]");
if (cart) {
  // The catalog markup owns the product names and prices.
  const products = new Map(
    [...cart.querySelectorAll("[data-add]")].map((button) => {
      const product = button.closest("article");
      return [
        button.dataset.add,
        {
          button,
          name: product.querySelector("h3").textContent,
          price: Number(product.querySelector("data").value),
        },
      ];
    }),
  );
  const bag = new Map();
  const items = cart.querySelector("[data-bag-items]");
  const total = cart.querySelector("[data-bag-total]");
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  cart.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    const remove = event.target.closest("[data-remove]");
    if (!add && !remove) return;
    const id = add?.dataset.add ?? remove.dataset.remove;
    const product = products.get(id);
    const count = (bag.get(id) ?? 0) + (add ? 1 : -1);
    if (count > 0) bag.set(id, count);
    else bag.delete(id);

    const existing = items.querySelector(`[data-product="${id}"]`);
    if (!count) {
      existing?.remove();
      product.button.focus();
    } else if (existing) {
      existing.firstElementChild.textContent = `${product.name} ×${count}`;
    } else {
      const row = document.createElement("li");
      row.dataset.product = id;
      const label = document.createElement("span");
      label.textContent = `${product.name} ×${count}`;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.remove = id;
      button.textContent = "Remove One";
      button.setAttribute("aria-label", `Remove one ${product.name}`);
      row.append(label, button);
      items.append(row);
    }

    const subtotal = [...bag].reduce(
      (sum, [key, quantity]) => sum + products.get(key).price * quantity,
      0,
    );
    total.textContent = subtotal
      ? `Sample subtotal ${currency.format(subtotal)}`
      : "Your bag is empty.";
  });
}
