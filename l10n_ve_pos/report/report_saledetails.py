from odoo import api, fields, models


class ReportSaleDetails(models.AbstractModel):
    _inherit = "report.point_of_sale.report_saledetails"

    @api.model
    def get_sale_details(
        self, date_start=False, date_stop=False, config_ids=False, session_ids=False, **kwargs
    ):
        data = super().get_sale_details(
            date_start=date_start, date_stop=date_stop,
            config_ids=config_ids, session_ids=session_ids, **kwargs
        )

        domain = self._get_domain(date_start, date_stop, config_ids, session_ids, **kwargs)
        orders = self.env["pos.order"].search(domain)

        user_currency = self.env.company.currency_id

        f_total = 0.0
        for order in orders:
            if user_currency != order.pricelist_id.currency_id:
                f_total += order.pricelist_id.currency_id._convert(
                    order.foreign_amount_total,
                    user_currency,
                    order.company_id,
                    order.date_order or fields.Date.today(),
                )
            else:
                f_total += order.foreign_amount_total

        data["foreign_total_paid"] = user_currency.round(f_total)
        data["foreign_currency"] = self.env.company.foreign_currency_id

        payment_ids = self.env["pos.payment"].search(
            [("pos_order_id", "in", orders.ids)]
        ).ids
        if payment_ids:
            self.env.cr.execute(
                """
                SELECT method.id, payment.session_id,
                       sum(foreign_amount) f_total
                FROM pos_payment AS payment,
                     pos_payment_method AS method
                WHERE payment.payment_method_id = method.id
                    AND payment.id IN %s
                GROUP BY method.id, payment.session_id
            """,
                (tuple(payment_ids),),
            )
            f_payments = {}
            for r in self.env.cr.dictfetchall():
                f_payments[(r["id"], r["session_id"])] = r["f_total"]
            for payment in data["payments"]:
                payment["f_total"] = f_payments.get(
                    (payment.get("id"), payment.get("session")), 0.0
                )

        return data
