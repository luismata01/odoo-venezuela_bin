/** @odoo-module */
import { PaymentScreenStatus } from "@point_of_sale/app/screens/payment_screen/payment_status/payment_status";
import { patch } from "@web/core/utils/patch";

patch(PaymentScreenStatus.prototype, {
  get foreignTotalDueText() {
    // Simplified for Odoo 19: payment foreign amount methods are not available yet
    return this.env.utils.formatForeignCurrency(
      this.props.order.get_foreign_total_with_tax()
    );
  },
  get foreignRemainingText() {
    return this.env.utils.formatForeignCurrency(0);
  },
  get foreignChangeText() {
    return this.env.utils.formatForeignCurrency(0);
  },
});