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

    @api.model
    def _get_usd_rate(self, company=None):
        company = company or self.env.company
        usd = self.env.ref("base.USD")
        if not company.currency_id or usd == company.currency_id:
            return 1.0
        rate_rec = self.env["res.currency.rate"].search([
            ("currency_id", "=", usd.id),
            ("company_id", "=", company.id),
            ("name", "<=", date.today()),
        ], limit=1)
        return rate_rec.inverse_company_rate if rate_rec else 1.0

    @api.onchange("list_price_usd")
    def onchange_price_bs(self):
        company = self.env.company
        if not company:
            return
        self.list_price = self.list_price_usd * self._get_usd_rate(company)

    @api.model
    def create(self, vals):
        if 'list_price_usd' in vals and 'list_price' not in vals:
            vals['list_price'] = vals['list_price_usd'] * self._get_usd_rate()
        return super().create(vals)

    def write(self, vals):
        if 'list_price_usd' in vals and 'list_price' not in vals:
            for record in self:
                company = record.company_id or self.env.company
                record.list_price = vals['list_price_usd'] * self._get_usd_rate(company)
        return super().write(vals)
