/** @odoo-module **/

import { ProductCard } from "@point_of_sale/app/components/product_card/product_card";
import { patch } from "@web/core/utils/patch";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";

patch(ProductCard.prototype, {
  setup() {
    super.setup();
    this.pos = usePos();
  },

  get show_free_qty() {
    const val = this.pos?.config?.pos_show_free_qty;
    if (val === undefined) {
      console.warn("[l10n_ve_pos] pos_show_free_qty is undefined in pos.config");
    }
    return val ?? false;
  },

  get free_qty() {
    const val = this.props.product?.free_qty;
    if (val === undefined) {
      console.warn("[l10n_ve_pos] free_qty is undefined for product", this.props.product?.id);
    }
    return val ?? 0;
  },

  get foreignPriceDisplay() {
    const product = this.props.product;
    const config = this.pos?.config;
    if (!config?.foreign_currency_id) {
      return "";
    }
    const local_price = product?.list_price || product?.lst_price || 0;
    const display_rate = config?.foreign_rate || 0;
    const rate = config?.foreign_inverse_rate || (display_rate ? 1.0 / display_rate : 0);
    const foreign_price = local_price * rate;
    return this.env.utils.formatForeignCurrency(foreign_price);
  },
});
