from odoo import api, models


class ProductTemplate(models.Model):
    _inherit = "product.template"

    @api.depends(
        "currency_id",
        "supplier_price",
        "supplier_currency_id",
        "replenishment_cost_type",
        "replenishment_base_cost",
        "replenishment_base_cost_currency_id",
        "replenishment_cost_rule_id",
        "supplier_currency_id.rate_ids.rate",
        "replenishment_base_cost_currency_id.rate_ids.rate",
    )
    @api.depends_context("company")
    def _compute_replenishment_cost(self):
        return super()._compute_replenishment_cost()
