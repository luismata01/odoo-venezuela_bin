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
        company = self.env.company
        if not company:
            return
        usd = self.env.ref("base.USD")
        target = company.currency_id
        if not target or usd == target:
            self.list_price = self.list_price_usd
            return
        rate = usd._get_conversion_rate(usd, target, company, date.today())
        self.list_price = self.list_price_usd * (rate or 1)
