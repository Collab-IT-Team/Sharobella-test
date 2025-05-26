class CustomProductCard extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector("form");
    if (!this.form) return;
    this.form.addEventListener("submit", this.onSubmitHandler.bind(this));

    this.addButtonWrapper = this.form.querySelector(".product-form__button");
    this.quantityControls = this.form.querySelector(
      ".product-form__quantity-controls"
    );
    this.quantityInput = this.form.querySelector('input[name="quantity"]');
    this.quantityDisplay = this.form.querySelector(
      ".quantity-controls__display"
    );

    this.cart =
      document.querySelector("cart-notification") ||
      document.querySelector("cart-drawer");
    this.submitButton = this.querySelector('[type="submit"]');

    if (document.querySelector("cart-drawer"))
      this.submitButton.setAttribute("aria-haspopup", "dialog");

    this.timeoutId = null;

    this.increaseBtn = this.querySelector(".quantity-controls__increase");
    this.decreaseBtn = this.querySelector(".quantity-controls__decrease");

    this.increaseBtn?.addEventListener("click", () => this.updateQuantity(1));
    this.decreaseBtn?.addEventListener("click", () => this.updateQuantity(-1));
  }

  onSubmitHandler(evt) {
    evt.preventDefault();

    this.addButtonWrapper.classList.add("hidden");
    this.quantityControls.classList.remove("hidden");

    this.startSubmitTimer(evt);
  }

  updateQuantity(change) {
    const current = parseInt(this.quantityInput.value) || 1;
    const updated = Math.max(1, current + change);

    this.quantityInput.value = updated;
    this.quantityDisplay.textContent = `${updated} шт`;

    this.startSubmitTimer(new Event("quantity-change"));
  }

  startSubmitTimer(evt) {
    this.clearSubmitTimer();
    this.timeoutId = setTimeout(() => {
      this.submitForm(evt || new Event("auto-submit"));
    }, 3000);
  }

  clearSubmitTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  clearSubmitTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  submitForm(evt) {
    const config = fetchConfig("javascript");
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    delete config.headers["Content-Type"];

    const formData = new FormData(this.form);

    if (this.cart) {
      formData.append(
        "sections",
        this.cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append("sections_url", window.location.pathname);
      this.cart.setActiveElement(document.activeElement);
    }
    config.body = formData;

    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          publish(PUB_SUB_EVENTS.cartError, {
            source: "product-form",
            productVariantId: formData.get("id"),
            errors: response.errors || response.description,
            message: response.message,
          });

          this.error = true;
          return;
        } else if (!this.cart) {
          window.location = window.routes.cart_url;
          return;
        }

        const startMarker = CartPerformance.createStartingMarker(
          "add:wait-for-subscribers"
        );

        if (!this.error)
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: "product-form",
            productVariantId: formData.get("id"),
            cartData: response,
          }).then(() => {
            CartPerformance.measureFromMarker(
              "add:wait-for-subscribers",
              startMarker
            );
          });

        this.error = false;
        CartPerformance.measure("add:paint-updated-sections", () => {
          this.cart.renderContents(response);
        });
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        if (this.cart && this.cart.classList.contains("is-empty"))
          this.cart.classList.remove("is-empty");

        this.quantityInput.value = "1";
        this.quantityDisplay.textContent = "1 шт";

        this.quantityControls.classList.add("hidden");
        this.addButtonWrapper.classList.remove("hidden");

        CartPerformance.measureFromEvent("add:user-action", evt);

        fetch("/cart.js")
          .then((res) => res.json())
          .then((cart) => {
            this.updateCartQuantitiesInCards(cart);
          })
          .catch(console.error);
      });
  }

  updateCartQuantitiesInCards(cart) {
    document.querySelectorAll("custom-product-card").forEach((card) => {
      const productFormButton = card.querySelector(
        ".product-form__button button"
      );
      const variantInput = card.querySelector(".product-variant-id");
      const currentQtySpan = card.querySelector(
        ".product-form__button-current-qty"
      );

      if (!variantInput || !currentQtySpan) return;

      const variantId = parseInt(variantInput.value);
      const cartItem = cart.items.find((item) => item.variant_id === variantId);

      if (cartItem) {
        currentQtySpan.textContent = `${cartItem.quantity}`;
        productFormButton.classList.add("has-qty");
      } else {
        currentQtySpan.textContent = "";
        productFormButton.classList.remove("has-qty");
      }
    });
  }
}

if (!customElements.get("custom-product-card")) {
  customElements.define("custom-product-card", CustomProductCard);
}
