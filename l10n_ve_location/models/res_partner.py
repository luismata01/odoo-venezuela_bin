from odoo import api, fields, models


class ResCountryParishBinauralLocalizacion(models.Model):
    _inherit = "res.partner"

    city_id = fields.Many2one("res.country.city", string="City")

    city = fields.Char(string="City related",
                       related="city_id.name", store=True)

    municipality = fields.Many2one("res.country.municipality", "Municipality")

    parish_id = fields.Many2one(
        "res.country.parish", domain="[('municipality_id', '=', municipality)]"
    )

    require_full_address = fields.Boolean(
        compute="_compute_require_full_address",
    )

    @api.depends_context("company")
    def _compute_require_full_address(self):
        for partner in self:
            partner.require_full_address = self.env.company.require_full_address
