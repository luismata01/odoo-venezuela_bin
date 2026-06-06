/** @odoo-module */

import { PosPayment } from "@point_of_sale/app/models/pos_payment";
import { patch } from "@web/core/utils/patch";

patch(PosPayment.prototype, {
  setup(vals) {
    super.setup(...arguments);
    this.include_igtf = vals.include_igtf || false;
    this.igtf_amount = vals.igtf_amount || 0;
    this.foreign_igtf_amount = vals.foreign_igtf_amount || 0;
  },
  set_include_igtf(value) {
    this.include_igtf = value;
  },
  set_igtf_amount(amount) {
    this.igtf_amount = amount;
  },
  set_foreign_igtf_amount(amount) {
    this.foreign_igtf_amount = amount;
  },
  serializeForORM(opts = {}) {
    const data = super.serializeForORM(...arguments);
    data.include_igtf = this.include_igtf;
    data.igtf_amount = this.igtf_amount;
    data.foreign_igtf_amount = this.foreign_igtf_amount;
    return data;
  },
});
