import logging

from datetime import date

from odoo import api, models

_logger = logging.getLogger(__name__)


class ResCompany(models.Model):
    _inherit = "res.company"

    def update_currency_rates(self):
        result = super().update_currency_rates()
        bcv_companies = self.filtered(lambda c: c.currency_provider == "bcv")
        if bcv_companies:
            bcv_companies._sync_replenishment_costs()
            bcv_companies._sync_prices_from_usd()
        return result

    def _sync_replenishment_costs(self):
        for company in self:
            products = self.env["product.template"].search([
                ("company_id", "in", [company.id, False]),
                ("replenishment_cost_type", "in", [
                    "supplier_price", "last_supplier_price", "manual", "bom",
                ]),
            ])

            affected = products.filtered(
                lambda p: self._is_cost_in_foreign_currency(p, company)
            )

            if affected:
                _logger.info(
                    "Syncing replenishment costs for company %s: %d products",
                    company.name, len(affected),
                )
                affected = affected.with_company(company=company).with_context(
                    bypass_base_automation=True,
                    tracking_disable=True,
                )
                affected._compute_replenishment_cost()
                affected._compute_replenishment_cost()
                affected._update_cost_from_replenishment_cost()

    def _sync_prices_from_usd(self):
        for company in self:
            usd = self.env.ref("base.USD")
            rate_rec = self.env["res.currency.rate"].search([
                ("currency_id", "=", usd.id),
                ("company_id", "=", company.id),
                ("name", "<=", date.today()),
            ], limit=1)
            if not rate_rec:
                _logger.warning("No USD rate record found for company %s", company.name)
                continue
            rate = rate_rec.inverse_company_rate
            products = self.env["product.template"].search([
                ("company_id", "in", [company.id, False]),
                ("list_price_usd", ">", 0),
            ])
            if products:
                _logger.info(
                    "Syncing USD prices for company %s: %d products, rate=%s",
                    company.name, len(products), rate,
                )
                products = products.with_company(company=company).with_context(
                    bypass_base_automation=True,
                    tracking_disable=True,
                )
                for p in products:
                    p.list_price = p.list_price_usd * rate
        self.env.cr.commit()

    @api.model
    def _is_cost_in_foreign_currency(self, product, company):
        if product.replenishment_cost_type == "bom":
            return True
        elif product.replenishment_cost_type in ["supplier_price", "last_supplier_price"]:
            base_currency = product.supplier_currency_id
        elif product.replenishment_cost_type == "manual":
            base_currency = product.replenishment_base_cost_currency_id
        else:
            return False
        return bool(base_currency) and base_currency != product.currency_id
