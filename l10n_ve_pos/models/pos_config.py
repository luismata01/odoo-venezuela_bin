from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

# Integra 16 tiene varios campos con readonly=True, revisar para migrar


class PosConfig(models.Model):
    _inherit = "pos.config"

    foreign_currency_id = fields.Many2one(
        "res.currency", related="company_id.foreign_currency_id"
    )

    foreign_inverse_rate = fields.Float(
        help="Rate that will be used as factor to multiply of the foreign currency for moves.",
        compute="_compute_rate",
        digits=(16, 15),
        default=0.0,
        readonly=False,
    )
    foreign_rate = fields.Float(
        compute="_compute_rate",
        digits="Tasa",
        default=0.0,
        readonly=False,
    )
    pos_show_free_qty = fields.Boolean(related="company_id.pos_show_free_qty")
    sell_kit_from_another_store = fields.Boolean(default=False)
    pos_show_just_products_with_available_qty = fields.Boolean(
        related="company_id.pos_show_just_products_with_available_qty"
    )
    pos_search_cne = fields.Boolean(related="company_id.pos_search_cne")
    amount_to_zero = fields.Boolean("Amount to zero")
    activate_barcode_strict_mode = fields.Boolean(
        help="Activate product entry with barcode in strict mode"
    )
    validate_phone_in_pos = fields.Boolean(default=False)

    @api.depends("session_ids")
    def _compute_last_session(self):
        PosSession = self.env["pos.session"]
        for pos_config in self:
            session = PosSession.search_read(
                [("config_id", "=", pos_config.id), ("state", "=", "closed")],
                ["cash_register_balance_end_real", "stop_at"],
                order="stop_at desc",
                limit=1,
            )
            if session and session[0].get("stop_at"):
                timezone = self.env.tz
                pos_config.last_session_closing_date = (
                    session[0]["stop_at"].astimezone(timezone).date()
                )
                pos_config.last_session_closing_cash = session[0][
                    "cash_register_balance_end_real"
                ]
            else:
                pos_config.last_session_closing_cash = 0
                pos_config.last_session_closing_date = False

    @api.depends("foreign_currency_id")
    def _compute_rate(self):
        """
        Compute the rate of the pos using the compute_rate method of the res.currency.rate model.
        """
        rate = self.env["res.currency.rate"]
        for config in self:
            rate_values = rate.compute_rate(
                config.foreign_currency_id.id, fields.Date.today()
            )
            config.update(rate_values)

    def _load_pos_data_fields(self, config):
        return []  # Load all fields (our custom fields are auto-included)

    def _action_to_open_ui(self):
        res = super()._action_to_open_ui()
        if (
            not self.current_session_id.foreign_currency_id
            or not self.current_session_id.foreign_currency_id.active
        ):
            raise ValidationError(
                _("The session must have a foreign currency or active")
            )
        return res
