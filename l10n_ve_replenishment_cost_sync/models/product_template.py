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
        self._sync_list_price_from_usd()

    def _sync_list_price_from_usd(self):
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

    @api.model
    def create(self, vals):
        if 'list_price_usd' in vals and 'list_price' not in vals:
            usd = self.env.ref("base.USD")
            company = self.env.company
            target = company.currency_id
            if target and usd != target:
                rate = usd._get_conversion_rate(usd, target, company, date.today())
                vals['list_price'] = vals['list_price_usd'] * (rate or 1)
            else:
                vals['list_price'] = vals['list_price_usd']
        return super().create(vals)

    def write(self, vals):
        if 'list_price_usd' in vals and 'list_price' not in vals:
            usd = self.env.ref("base.USD")
            for record in self:
                company = record.company_id or self.env.company
                target = company.currency_id
                if target and usd != target:
                    rate = usd._get_conversion_rate(usd, target, company, date.today())
                    record.list_price = vals['list_price_usd'] * (rate or 1)
                else:
                    record.list_price = vals['list_price_usd']
        return super().write(vals)
