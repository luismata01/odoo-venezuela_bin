/** @odoo-module **/

import { formatMonetary } from "@web/views/fields/formatters";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { registry } from "@web/core/registry";
import { toRaw } from "@odoo/owl";

import { TaxTotalsComponent } from "@account/components/tax_totals/tax_totals";

export class TaxTotalsComponents extends TaxTotalsComponent {
  get readonly() {
    return true;
  }

  formatData(props) {
    let totals = JSON.parse(JSON.stringify(toRaw(props.record.data[this.props.name])));
    if (!totals) {
      return;
    }
    const foreignCurrencyFmtOpts = {
      currencyId: props.record.data.foreign_currency_id && props.record.data.foreign_currency_id[0],
    };
    const currencyFmtOpts = {
      currencyId: props.record.data.currency_id && props.record.data.currency_id[0],
    };

    if (totals.foreign_subtotals && Array.isArray(totals.foreign_subtotals)) {
      for (let subtotal of totals.foreign_subtotals) {
        subtotal.formatted_base_amount_foreign_currency = formatMonetary(
          subtotal.base_amount_foreign_currency,
          foreignCurrencyFmtOpts
        );
        subtotal.formatted_base_amount_currency = formatMonetary(
          subtotal.base_amount_currency,
          currencyFmtOpts
        );
      }
    }
    totals.formatted_total_amount_foreign_currency = formatMonetary(
      totals.foreign_amount_total,
      foreignCurrencyFmtOpts
    );
    totals.formatted_total_amount_currency = formatMonetary(
      totals.total_amount_currency,
      currencyFmtOpts
    );

    this.totals = totals;
  }
}
TaxTotalsComponents.template = "l10n_ve_tax.TaxForeignTotalsField";
TaxTotalsComponents.props = {
  ...standardFieldProps,
};

export const taxTotalsComponent = {
  component: TaxTotalsComponents,
};

const fieldsRegistry = registry.category("fields");

if (!fieldsRegistry.contains("account-tax-foreign-totals-field")) {
    fieldsRegistry.add("account-tax-foreign-totals-field", taxTotalsComponent);
}