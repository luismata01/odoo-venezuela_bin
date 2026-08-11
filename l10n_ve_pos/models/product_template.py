from odoo import api, models


class ProductTemplate(models.Model):
    _inherit = "product.template"

    @api.model
    def _load_pos_data_fields(self, config_id):
        res = super()._load_pos_data_fields(config_id)
        res += ['list_price_usd', 'free_qty']
        return res
