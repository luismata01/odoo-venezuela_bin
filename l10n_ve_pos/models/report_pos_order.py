from odoo import fields, models


class ReportPosOrder(models.Model):
    _inherit = "report.pos.order"

    foreign_currency_id = fields.Many2one(
        "res.currency", related="company_id.foreign_currency_id"
    )
    foreign_price_total = fields.Float(string="Total (USD)", readonly=True)

    def _select(self):
        # pos_order_line.foreign_price is never populated in practice, so the
        # order's captured foreign_amount_total (its real USD total at the
        # rate in effect when it was sold) is prorated across its lines by
        # each line's share of the order's company-currency total. Summed
        # back over an order's lines, this reconstructs foreign_amount_total
        # exactly, so it aggregates safely in pivots without double counting.
        return super()._select() + """
            , ((SIGN(l.qty) * SIGN(l.price_unit) * ABS(l.price_subtotal_incl)) / NULLIF(s.amount_total, 0)) * s.foreign_amount_total AS foreign_price_total
        """
