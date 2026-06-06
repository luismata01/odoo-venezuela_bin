import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";
import { patch } from "@web/core/utils/patch";
import { accountTaxHelpers } from "@account/helpers/account_tax";
import {
  roundDecimals as round_di,
  roundPrecision as round_pr,
} from "@web/core/utils/numbers";

patch(PosOrderline.prototype, {
  // NO asignar foreign_price en setUnitPrice porque en Odoo 19 el modelo PosOrderline
  // se instancia desde IndexedDB sin order_id resuelto, y asignar un campo con setter
  // dispara triggerRecomputeAllPrices() que falla porque las relaciones no están listas.
  // El cálculo se hace on-demand en get_foreign_unit_price().

  get_foreign_currency() {
    const config = this.models["pos.config"].getFirst();
    return config?.foreign_currency_id;
  },

  get_foreign_price_without_tax() {
    const foreign_currency = this.get_foreign_currency();
    return round_pr(
      this.get_foreign_unit_price() * this.getQuantity(),
      foreign_currency?.rounding || 0.01,
    );
  },

  get_foreign_tax_details() {
    return this.get_all_foreign_prices().taxDetails;
  },

  get_foreign_price_with_tax() {
    return this.get_all_foreign_prices().priceWithTax;
  },

  get_foreign_tax() {
    return this.get_all_foreign_prices().tax;
  },

  get_foreign_unit_price() {
    const foreign_currency = this.get_foreign_currency();
    if (!foreign_currency) {
      return 0;
    }
    const config = this.models["pos.config"].getFirst();
    const display_rate = config?.foreign_rate || 0;
    // Use the exact reciprocal of the display rate to ensure consistency.
    // If foreign_inverse_rate is available and consistent, prefer it; otherwise compute it.
    let rate = config?.foreign_inverse_rate || 0;
    if (!rate && display_rate) {
      rate = 1.0 / display_rate;
    }
    const digits = foreign_currency.decimal_places || 2;
    const foreign_price = this.price_unit * rate;
    return parseFloat(
      round_di(foreign_price, digits).toFixed(digits),
    );
  },

  get_all_foreign_prices(qty = this.getQuantity()) {
    const foreign_currency = this.get_foreign_currency();
    if (!foreign_currency) {
      return {
        priceWithTax: 0,
        priceWithoutTax: 0,
        priceWithTaxBeforeDiscount: 0,
        priceWithoutTaxBeforeDiscount: 0,
        tax: 0,
        taxDetails: {},
        taxesData: [],
      };
    }

    const company = this.order_id?.company_id;
    const product = this.getProduct();
    const taxes = this.tax_ids || product.taxes_id;

    const baseLine = accountTaxHelpers.prepare_base_line_for_taxes_computation(
        this,
        this.prepareBaseLineForTaxesComputationExtraValues({
            quantity: qty,
            tax_ids: taxes,
            price_unit: this.get_foreign_unit_price(),
            currency: foreign_currency,
        })
    );
    accountTaxHelpers.add_tax_details_in_base_line(baseLine, company);
    accountTaxHelpers.round_base_lines_tax_details([baseLine], company);

    const baseLineNoDiscount = accountTaxHelpers.prepare_base_line_for_taxes_computation(
        this,
        this.prepareBaseLineForTaxesComputationExtraValues({
            quantity: qty,
            tax_ids: taxes,
            discount: 0.0,
            price_unit: this.get_foreign_unit_price(),
            currency: foreign_currency,
        })
    );
    accountTaxHelpers.add_tax_details_in_base_line(baseLineNoDiscount, company);
    accountTaxHelpers.round_base_lines_tax_details([baseLineNoDiscount], company);

    const taxDetails = {};
    for (const taxData of baseLine.tax_details.taxes_data) {
        taxDetails[taxData.tax.id] = {
            amount: taxData.tax_amount_currency,
            base: taxData.base_amount_currency,
        };
    }

    return {
        priceWithTax: baseLine.tax_details.total_included_currency,
        priceWithoutTax: baseLine.tax_details.total_excluded_currency,
        priceWithTaxBeforeDiscount: baseLineNoDiscount.tax_details.total_included_currency,
        priceWithoutTaxBeforeDiscount: baseLineNoDiscount.tax_details.total_excluded_currency,
        tax:
            baseLine.tax_details.total_included_currency -
            baseLine.tax_details.total_excluded_currency,
        taxDetails: taxDetails,
        taxesData: baseLine.tax_details.taxes_data,
    };
  },
});
