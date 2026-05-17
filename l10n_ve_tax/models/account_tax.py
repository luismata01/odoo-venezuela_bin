from odoo.tools.float_utils import float_round
from odoo import api, models, _
from odoo.exceptions import ValidationError
from odoo.tools.misc import formatLang

import logging

_logger = logging.getLogger(__name__)


class AccountTax(models.Model):
    _inherit = "account.tax"

    @api.model
    def _get_tax_totals_summary(
        self, base_lines, currency, company, cash_rounding=None
    ):
        """
        This function adds the alternate currency tax amounts to tax_totals.
        """
        res = super()._get_tax_totals_summary(
            base_lines, currency, company, cash_rounding
        )

        foreign_currency = company.foreign_currency_id or False
        if not foreign_currency:
            return res

        # Base Currency calculations (discount, subtotals, etc.)
        res_without_discount = res.copy()
        has_discount = not currency.is_zero(sum([line.get("discount", 0.0) for line in base_lines if line]))

        if has_discount:
            base_without_discount = [line.copy() for line in base_lines if line]
            for base_line in base_without_discount:
                base_line["discount"] = 0

            # Recalculate base without discount
            self._add_tax_details_in_base_lines(base_without_discount, company)
            self._round_base_lines_tax_details(base_without_discount, company)

            res_without_discount = super()._get_tax_totals_summary(
                base_without_discount,
                currency,
                company,
                cash_rounding,
            )

        foreign_base_lines, _ = self.get_foreign_base_tax_lines(
            base_lines, None, foreign_currency
        )

        # Recalculate tax details and round for foreign base lines
        self._add_tax_details_in_base_lines(foreign_base_lines, company)
        self._round_base_lines_tax_details(foreign_base_lines, company)

        # Foreign Currency calculations
        foreign_taxes = super()._get_tax_totals_summary(
            foreign_base_lines,
            foreign_currency,
            company,
            cash_rounding,
        )

        foreign_taxes_without_discount = foreign_taxes.copy()
        if has_discount:
            foreign_without_discount = [line.copy() for line in foreign_base_lines if line]
            for foreign_base_line in foreign_without_discount:
                foreign_base_line["discount"] = 0

            self._add_tax_details_in_base_lines(foreign_without_discount, company)
            self._round_base_lines_tax_details(foreign_without_discount, company)

            foreign_taxes_without_discount = super()._get_tax_totals_summary(
                foreign_without_discount,
                foreign_currency,
                company,
                cash_rounding,
            )

        # Populate legacy fields for frontend / backward compatibility
        res["groups_by_foreign_subtotal"] = {}
        for subtotal in foreign_taxes.get("subtotals", []):
            res["groups_by_foreign_subtotal"][subtotal["name"]] = subtotal.get("tax_groups", [])

        res["foreign_subtotals"] = foreign_taxes.get("subtotals", [])
        res["foreign_amount_untaxed"] = foreign_taxes.get("base_amount_currency", 0.0)
        res["foreign_amount_total"] = foreign_taxes.get("total_amount_currency", 0.0)
        res["foreign_formatted_amount_untaxed"] = formatLang(self.env, res["foreign_amount_untaxed"], currency_obj=foreign_currency)
        res["foreign_formatted_amount_total"] = formatLang(self.env, res["foreign_amount_total"], currency_obj=foreign_currency)

        res["show_discount"] = company.show_discount_on_moves

        res["subtotal"] = res_without_discount.get("base_amount_currency", 0.0)
        res["formatted_subtotal"] = formatLang(self.env, res["subtotal"], currency_obj=currency)

        res["foreign_subtotal"] = foreign_taxes_without_discount.get("base_amount_currency", 0.0)
        res["foreign_formatted_subtotal"] = formatLang(
            self.env, res["foreign_subtotal"], currency_obj=foreign_currency
        )

        res["discount_amount"] = res.get("base_amount_currency", 0.0) - res_without_discount.get("base_amount_currency", 0.0)
        res["formatted_discount_amount"] = formatLang(
            self.env, res["discount_amount"], currency_obj=currency
        )
        res["foreign_discount_amount"] = (
            foreign_taxes.get("base_amount_currency", 0.0) - foreign_taxes_without_discount.get("base_amount_currency", 0.0)
        )
        res["foreign_formatted_discount_amount"] = formatLang(
            self.env, res["foreign_discount_amount"], currency_obj=foreign_currency
        )
        return res

    def get_foreign_base_tax_lines(self, base_lines, tax_lines, currency):
        foreign_base_lines = []
        for line in base_lines:
            if not line:
                continue
            base_line = line.copy()
            record = base_line.get("record")
            is_exists_foreign_price = False
            if record:
                if isinstance(record, dict):
                    is_exists_foreign_price = "foreign_price" in record
                elif hasattr(record, '_fields'):
                    is_exists_foreign_price = "foreign_price" in record._fields

            if is_exists_foreign_price:
                price_unit = record.foreign_price if not isinstance(record, dict) else record.get("foreign_price", 0.0)
                price_subtotal = record.foreign_subtotal if not isinstance(record, dict) else record.get("foreign_subtotal", 0.0)
                base_line["price_unit"] = price_unit
                base_line["price_subtotal"] = price_subtotal
                base_line["currency_id"] = currency
                base_line["currency"] = currency
            else:
                price_unit = record.price_unit if not isinstance(record, dict) else record.get("price_unit", 0.0)
                price_subtotal = record.price_subtotal if not isinstance(record, dict) else record.get("price_subtotal", 0.0)
                base_line["price_unit"] = price_unit
                base_line["price_subtotal"] = price_subtotal
                base_line["currency_id"] = record.currency_id if not isinstance(record, dict) else record.get("currency_id")
                base_line["currency"] = base_line["currency_id"]

            base_line.pop("tax_details", None)
            foreign_base_lines.append(base_line)

        return foreign_base_lines, None
