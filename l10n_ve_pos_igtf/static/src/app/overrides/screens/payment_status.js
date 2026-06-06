/** @odoo-module */

import { PaymentScreenStatus } from "@point_of_sale/app/screens/payment_screen/payment_status/payment_status";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";
import { patch } from "@web/core/utils/patch";
import {
  roundPrecision as round_pr,
} from "@web/core/utils/numbers";

patch(PaymentScreenStatus.prototype, {
  setup() {
    super.setup(...arguments);
    this.pos = usePos();
  },
  get igtfAmount() {
    if (!this.props.order) return '0.00';
    return this.env.utils.formatCurrency(this.props.order.get_igtf_amount(), 'Product Price');
  },
  get biAmount() {
    if (!this.props.order) return '0.00';
    return this.env.utils.formatCurrency(this.props.order.get_bi_igtf(), 'Product Price');
  },
  get igtfForeignAmount() {
    if (!this.props.order) return '0.00';
    return this.env.utils.formatForeignCurrency(this.props.order.get_foreign_igtf_amount(), 'Product Price');
  },
  get isIgtf() {
    if (!this.props.order) return false;
    let payment_lines = this.props.order.payment_ids;
    let is_igtf = false;
    payment_lines.forEach(function(payment_line) {
      if (payment_line.payment_method_id.apply_igtf) {
        is_igtf = true;
      }
    });
    return is_igtf;
  },
  get amountIGTF() {
    if (!this.props.order || !this.pos) return '0.00';
    let payment_lines = this.props.order.payment_ids;
    let hasIgtfMethod = false;
    payment_lines.forEach(payment_line => {
      if (payment_line.payment_method_id && payment_line.payment_method_id.apply_igtf) {
        hasIgtfMethod = true;
      }
    });

    if (!hasIgtfMethod) {
      return this.env.utils.formatCurrency(0, 'Product Price');
    }

    const totalWithTax = this.props.order.priceIncl;
    const roundingApplied = this.props.order.appliedRounding || 0;
    const igtfAmount = (totalWithTax * (this.pos.config.igtf_percentage / 100)) + roundingApplied;

    return this.env.utils.formatCurrency(igtfAmount, 'Product Price');
  },
  get suggestedIgtf() {
    if (!this.props.order || !this.pos) return '0.00';
    var rounding = this.pos.currency.rounding;
    var result = round_pr(this.props.order.priceIncl * (this.pos.config.igtf_percentage / 100), rounding);
    return this.env.utils.formatCurrency(result);
  },
  get foreignTotalDueTextWithIGTF() {
    if (!this.props.order || !this.pos) return '0.00';
    return this.env.utils.formatForeignCurrency(
      (this.props.order.get_foreign_total_with_tax() * ((this.pos.config.igtf_percentage / 100) + 1))
    );
  },
  get totalDueTextWithIGTF() {
    if (!this.props.order) return '0.00';
    let payment_lines = this.props.order.payment_ids;

    if (payment_lines.length > 0) {
      return this.env.utils.formatCurrency(
        (this.props.order.priceIncl));
    } else {
      return this.env.utils.formatCurrency(
        (this.props.order.get_total_without_igtf())
      );
    }
  },
  get totalDueTextWithIGTFDisplay() {
    if (!this.props.order || !this.pos) return '0.00';
    var rounding = this.pos.currency.rounding;
    var result = round_pr(this.props.order.priceIncl * (this.pos.config.igtf_percentage / 100), rounding);
    return this.env.utils.formatCurrency(
      (this.props.order.priceIncl + result)
    );
  },
  get totalDueText() {
    if (!this.props.order) return '0.00';
    return this.env.utils.formatCurrency(
      this.props.order.get_total_without_igtf()
    );
  },
});
