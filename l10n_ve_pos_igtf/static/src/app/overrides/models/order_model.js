/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";
import {
  roundPrecision as round_pr,
} from "@web/core/utils/numbers";

patch(PosOrder.prototype, {
  setup(vals) {
    super.setup(...arguments);
    this.igtf_amount = 0;
    this.foreign_igtf_amount = 0;
    this.bi_igtf = 0;
    this.foreign_bi_igtf = 0;
    this.update_igtf();
  },
  update_igtf() {
    var rounding = this.currency.rounding;
    const paymentlines = this.payment_ids;
    let igtf_payment_methods = paymentlines.filter(
      (payment) => payment.payment_method_id.apply_igtf,
    );
    let last_igtf_amount = 0;
    let last_foreign_igtf_amount = 0;

    if (paymentlines.length > 0) {
      last_igtf_amount = this.igtf_amount;
      last_foreign_igtf_amount = this.foreign_igtf_amount;
    }

    let is_return = this.priceIncl < 0;

    this.igtf_amount = 0;
    this.foreign_igtf_amount = 0;
    this.bi_igtf = 0;
    this.foreign_bi_igtf = 0;

    let bi_igtf = 0;
    let foreign_bi_igtf = 0;
    let bi_payments = [];

    let igtf_amount = 0;
    let foreign_igtf_amount = 0;

    paymentlines.forEach((payment) => {
      payment.set_include_igtf(false);
    });

    if (!this.to_invoice) {
      return;
    }

    paymentlines.forEach((payment) => {
      let is_change = false;
      if (!is_return) {
        is_change = payment.amount < 0;
      } else {
        is_change = payment.amount > 0;
      }

      if (
        payment.payment_method_id.apply_igtf &&
        last_igtf_amount == payment.amount
      ) {
        return;
      }

      if (
        !payment.payment_method_id.apply_igtf &&
        igtf_payment_methods.length <= 0
      ) {
        foreign_bi_igtf = this.get_foreign_total_without_igtf();
        igtf_amount = 0;
        foreign_igtf_amount = 0;

        let payment_without_change = paymentlines.filter((payment) => {
          if (!bi_payments.includes(payment.cid)) {
            return false;
          }

          let is_change = false;
          if (!is_return) {
            is_change = payment.amount < 0;
          } else {
            is_change = payment.amount > 0;
          }

          if (is_change) {
            return false;
          }

          return true;
        });

        if (payment_without_change.length > 0) {
          payment_without_change.forEach((payment) => {
            if (!payment.include_igtf) {
              payment.set_igtf_amount(
                igtf_amount / payment_without_change.length,
              );
              payment.set_foreign_igtf_amount(
                foreign_igtf_amount / payment_without_change.length,
              );
            }
          });
        }
        return;
      }

      bi_igtf += round_pr(payment.amount, rounding);
      foreign_bi_igtf += round_pr(payment.get_foreign_amount(), rounding);
      bi_payments.push(payment.cid);

      if (payment.payment_method_id.apply_igtf) {
        payment.set_include_igtf(true);
      }
      let amount_to_pay = payment.amount;
      let foreign_amount_to_pay = payment.get_foreign_amount();

      if (
        (payment.amount > this.priceIncl && !is_return) ||
        (payment.amount < this.priceIncl && is_return)
      ) {
        amount_to_pay = this.priceIncl;
        foreign_amount_to_pay = this.get_foreign_total_with_tax();
      }

      if (!is_change) {
        payment.set_igtf_amount(this.compute_igtf_amount(amount_to_pay));
        payment.set_foreign_igtf_amount(
          this.compute_igtf_amount(foreign_amount_to_pay),
        );

        igtf_amount += payment.igtf_amount;
        foreign_igtf_amount += payment.foreign_igtf_amount;
      } else {
        payment.set_include_igtf(false);
      }
    });

    if (
      bi_igtf !== 0 &&
      bi_igtf >= this.priceIncl &&
      !is_return
    ) {
      bi_igtf = this.priceIncl;
      foreign_bi_igtf = this.get_foreign_total_without_igtf();
      igtf_amount = this.compute_igtf_amount(bi_igtf);
      foreign_igtf_amount = this.compute_igtf_amount(foreign_bi_igtf);

      let payment_without_change = paymentlines.filter((payment) => {
        if (!bi_payments.includes(payment.cid)) {
          return false;
        }

        let is_change = false;
        if (!is_return) {
          is_change = payment.amount < 0;
        } else {
          is_change = payment.amount > 0;
        }

        if (is_change) {
          return false;
        }

        return true;
      });

      if (payment_without_change.length > 0) {
        payment_without_change.forEach((payment) => {
          if (!payment.include_igtf) {
            return;
          }
        });
      }
    }

    if (igtf_payment_methods.length > 0) {
      let amount_sum = 0;
      let foreign_amount_sum = 0;
      let igtf_amount_sum = 0;
      let foreign_igtf_amount_sum = 0;

      for (let payments of igtf_payment_methods) {
        amount_sum += payments.amount;
        foreign_amount_sum += payments.foreign_amount;
        igtf_amount_sum += payments.igtf_amount;
        foreign_igtf_amount_sum += payments.foreign_igtf_amount;
      }
      this.bi_igtf = amount_sum;
      this.foreign_bi_igtf = foreign_amount_sum;
      this.igtf_amount = igtf_amount_sum;
      this.foreign_igtf_amount = foreign_igtf_amount_sum;
    }
    return this.igtf_amount;
  },
  compute_igtf_amount(amount) {
    var rounding = this.currency.rounding;
    return round_pr(amount * (this.config.igtf_percentage / 100), rounding);
  },

  get_bi_igtf() {
    return this.bi_igtf;
  },

  get_total_without_igtf() {
    return this.priceIncl;
  },
  get_foreign_total_without_igtf() {
    return this.get_foreign_total_with_tax();
  },

  get_foreign_due() {
    const total = this.get_foreign_total_with_tax();
    const paid = this.payment_ids.reduce(function (sum, paymentLine) {
      if (paymentLine.isDone() && !paymentLine.is_change) {
        sum += paymentLine.get_foreign_amount();
      }
      return sum;
    }, 0);
    return total - paid;
  },

  addPaymentline(payment_method) {
    let is_return = this.priceIncl < 0;
    let is_change = is_return ? this.remainingDue > 0 : this.remainingDue < 0;

    if (
      !payment_method.apply_igtf ||
      this.remainingDue <= this.get_igtf_amount() ||
      is_change
    ) {
      let res = super.addPaymentline(...arguments);
      this.update_igtf();
      return res;
    }
    let res_igtf = this.add_paymentline_without_igtf(...arguments);
    this.update_igtf();
    return res_igtf;
  },

  add_paymentline_without_igtf(payment_method) {
    this.assertEditable();
    if (this.electronicPaymentInProgress()) {
      return {
        status: false,
      };
    }
    var newPaymentline = this.models["pos.payment"].create({
      pos_order_id: this,
      payment_method_id: payment_method,
    });
    this.selectPaymentline(newPaymentline);

    // Set foreign_amount first with only=true so setAmount below
    // does not recalculate and overwrite it with a non-IGTF-excluded value
    newPaymentline.set_foreign_amount(
      this.get_foreign_due() - this.get_foreign_igtf_amount(),
      true,
    );
    newPaymentline.setAmount(this.remainingDue - this.get_igtf_amount(), true);
    return {
      status: true,
      data: newPaymentline,
    };
  },

  get_igtf_amount() {
    return this.igtf_amount;
  },

  get_foreign_igtf_amount() {
    return this.foreign_igtf_amount;
  },

  serializeForORM(opts = {}) {
    const data = super.serializeForORM(...arguments);
    data.igtf_amount = this.igtf_amount;
    data.bi_igtf = this.bi_igtf;
    return data;
  },
});
