from odoo import fields, models, api, _
from odoo.exceptions import ValidationError


class ResCountryCityBinauralLocalizacion(models.Model):
    _name = "res.country.city"
    _rec_name = "name"
    _description = "City"

    country_id = fields.Many2one("res.country", string="Country", required=True)

    state_id = fields.Many2one("res.country.state", string="State", required=True)

    name = fields.Char(string="City", required=True)

    @api.constrains("name", "country_id", "state_id")
    def _check_unique_city(self):
        for city in self:
            existing = self.search([
                ("name", "=", city.name),
                ("country_id", "=", city.country_id.id),
                ("state_id", "=", city.state_id.id),
                ("id", "!=", city.id),
            ])
            if existing:
                raise ValidationError(_(
                    "You cannot register a city with the same name for the selected state and country"
                ))
