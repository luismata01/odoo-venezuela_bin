/** @odoo-module */
import { PaymentScreenStatus } from "@point_of_sale/app/screens/payment_screen/payment_status/payment_status";
import { patch } from "@web/core/utils/patch";

patch(PaymentScreenStatus.prototype, {
  get foreignTotalDueText() {
    if (!this.props.order) return '0.00';
    return this.env.utils.formatForeignCurrency(
      this.props.order.get_foreign_total_with_tax() || 0
    );
  },
});