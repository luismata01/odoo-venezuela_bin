from odoo import models, fields, api
from datetime import date


class ProductTemplate(models.Model):
    _inherit = "product.template"

    def _set_currency_usd_id(self):
        return self.env.ref("base.USD")

    list_price_usd = fields.Float(
        "Sale Price USD", digits="Product Price", required=True, default=0.0
    )
    currency_usd_id = fields.Many2one(
        "res.currency", "USD", default=_set_currency_usd_id
    )

    @api.onchange("list_price_usd")
    def onchange_price_bs(self):
        rate = (
            self.env["res.currency.rate"]
            .search([
                ("name", "<=", date.today()),
                ("currency_id", "=", self.currency_usd_id.id),
            ], limit=1)
            .rate
        )
        self.list_price = self.list_price_usd * (rate or 1)
