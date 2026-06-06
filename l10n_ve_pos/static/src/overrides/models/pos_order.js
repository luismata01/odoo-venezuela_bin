/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { PosOrderAccounting } from "@point_of_sale/app/models/accounting/pos_order_accounting";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import {
  roundDecimals as round_di,
  roundPrecision as round_pr,
} from "@web/core/utils/numbers";

patch(PosOrderAccounting.prototype, {
  _doRecomputeAllPrices() {
    if (!this.company) {
      this._pricesDirty = true;
      return;
    }
    super._doRecomputeAllPrices();
  },
});

patch(PosOrder.prototype, {
  get_foreign_currency() {
    return this.config.foreign_currency_id;
  },
  get_display_rate() {
    return this.config.foreign_rate || this.config.foreign_inverse_rate || 0;
  },

  get init_conversion_rate() {
    if (this.currency.name == "VEF") {
      return this.config.foreign_inverse_rate;
    }
    if (this.currency.name == "USD") {
      return this.config.foreign_rate;
    }
  },

  get_foreign_total_with_tax() {
    return this.get_foreign_total_without_tax() + this.get_foreign_total_tax();
  },
  get_foreign_total_without_tax() {
    const lines = this.getOrderlines();
    const foreign_currency = this.get_foreign_currency();
    if (!foreign_currency) return 0;
    return round_pr(
      lines.reduce(function (sum, orderLine) {
        if (typeof orderLine.get_foreign_price_without_tax === "function") {
          return sum + orderLine.get_foreign_price_without_tax();
        }
        return sum;
      }, 0),
      foreign_currency.rounding,
    );
  },
  get_foreign_total_tax() {
    const orderlines = this.getOrderlines();
    const foreign_currency = this.get_foreign_currency();
    if (!foreign_currency) return 0;
    if (this.company && this.company.tax_calculation_rounding_method === "round_globally") {
      var groupTaxes = {};
      orderlines.forEach(function (line) {
        if (typeof line.get_foreign_tax_details !== "function") return;
        var taxDetails = line.get_foreign_tax_details();
        var taxIds = Object.keys(taxDetails);
        for (var t = 0; t < taxIds.length; t++) {
          var taxId = taxIds[t];
          if (!(taxId in groupTaxes)) {
            groupTaxes[taxId] = 0;
          }
          groupTaxes[taxId] += taxDetails[taxId].amount;
        }
      });
      var sum = 0;
      var taxIds = Object.keys(groupTaxes);
      for (var j = 0; j < taxIds.length; j++) {
        var taxAmount = groupTaxes[taxIds[j]];
        sum += round_pr(taxAmount, foreign_currency.rounding);
      }
      return sum;
    } else {
      return round_pr(
        orderlines.reduce(function (sum, orderLine) {
          if (typeof orderLine.get_foreign_tax === "function") {
            return sum + orderLine.get_foreign_tax();
          }
          return sum;
        }, 0),
        foreign_currency.rounding,
      );
    }
  },

  serializeForORM(opts = {}) {
    const data = super.serializeForORM(opts);
    data.foreign_amount_total = this.get_foreign_total_with_tax();
    data.foreign_currency_rate = this.get_display_rate();
    return data;
  },

  get_qty_products() {
    let qty = 0;
    const lines = this.getOrderlines();
    for (let i = 0; i < lines.length; i++) {
      qty += lines[i].qty;
    }
    return qty;
  },
});
