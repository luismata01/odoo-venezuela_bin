/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";

patch(ProductScreen.prototype, {
  getNumpadButtons() {
    const buttons = super.getNumpadButtons();
    const isManager = this.pos.getCashier()._role === "manager";

    const quantityButton = buttons.find((button) => button.value === "quantity");
    if (quantityButton && !isManager) {
      quantityButton.disabled = true;
    }

    const priceButton = buttons.find((button) => button.value === "price");
    if (priceButton && !isManager) {
      priceButton.disabled = true;
    }

    return buttons;
  },

  async _canRemoveLine() {
    return Promise.resolve({ auth: true });
  },
  async _setValue(val) {
    const { numpadMode } = this.pos;
    let selectedLine = this.currentOrder.get_selected_orderline();
    if (!selectedLine) {
      this.numberBuffer.reset();
    }
    if (
      !selectedLine &&
      this.currentOrder.get_orderlines().length > 0 &&
      (val == "" || val == "remove")
    ) {
      let orderlines = this.currentOrder.get_orderlines();
      this.currentOrder.select_orderline(orderlines[orderlines.length - 1]);
      return;
    }
    if (selectedLine && numpadMode === "quantity") {
      if (val === "0" || val == "" || val === "remove") {
        const { auth } = await this._canRemoveLine();
        if (!auth) {
          this.numberBuffer.reset();
          this.currentOrder.deselect_orderline();
          return;
        }
        this.numberBuffer.reset();
        this.currentOrder.removeOrderline(selectedLine);
        this.currentOrder.deselect_orderline();
        return;
      }
    }
    return await super._setValue(val);
  },
  //Inherit
  get productsToDisplay() {

    let list = super.productsToDisplay
    
    // Filtrar productos si la configuración lo requiere
    if (!this.pos.config.pos_show_just_products_with_available_qty) {
      return list;
    }

    list = list.filter(product => {
      if (product.type === 'service' || product.type === 'consu') {
        return true;
      }
      return product.qty_available > 0;
    });

    return list;
  },
});
