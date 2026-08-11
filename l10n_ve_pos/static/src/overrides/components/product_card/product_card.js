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
    return val ?? false;
  },

  get free_qty() {
    const val = this.props.product?.free_qty;
    return val ?? 0;
  },

  get foreignPriceDisplay() {
    try {
      const product = this.props.product;
      const config = this.pos?.config;
      if (!config?.foreign_currency_id) {
        return "";
      }
      let foreign_price;
      if (product?.list_price_usd) {
        foreign_price = product.list_price_usd;
      } else {
        const order = this.pos.getOrder?.();
        const pricelist = order?.pricelist_id || config.pricelist_id;
        const local_price =
          pricelist && typeof product?.getPrice === "function"
            ? product.getPrice(pricelist, 1)
            : product?.list_price || product?.lst_price || 0;
        const display_rate = config?.foreign_rate || 0;
        const rate = config?.foreign_inverse_rate || (display_rate ? 1.0 / display_rate : 0);
        foreign_price = local_price * rate;
      }
      if (typeof this.env.utils?.formatForeignCurrency !== "function") {
        return "";
      }
      return this.env.utils.formatForeignCurrency(foreign_price);
    } catch (e) {
      console.warn("[l10n_ve_pos] foreignPriceDisplay error:", e);
      return "";
    }
  },
});
