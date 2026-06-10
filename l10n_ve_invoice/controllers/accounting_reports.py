from datetime import datetime
from odoo import http
from odoo.exceptions import UserError

class AccountingReportsController(http.Controller):
    @http.route("/web/download_sales_book", type="http", auth="user")
    def download_sales_book(self, **kw):
        wizard_id = kw.get("id")
        if not wizard_id:
            raise UserError("ID del wizard no proporcionado")

        company_id = int(kw.get("company_id", 1))
        wizard = http.request.env["wizard.accounting.reports"].sudo().browse(int(wizard_id))
        if not wizard.exists():
            raise UserError("Wizard no encontrado")

        file = wizard.generate_sales_book(company_id)

        return http.request.make_response(
            file,
            headers=[
                (
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
                (
                    "Content-Disposition",
                    "attachment;filename=Libro_de_venta.xlsx"
                )
            ]
        )

    @http.route("/web/download_purchase_book", type="http", auth="user")
    def download_purchase_book(self, **kw):
        wizard_id = kw.get("id")
        if not wizard_id:
            raise UserError("ID del wizard no proporcionado")

        company_id = int(kw.get("company_id", 1))
        wizard = http.request.env["wizard.accounting.reports"].sudo().browse(int(wizard_id))
        if not wizard.exists():
            raise UserError("Wizard no encontrado")

        file = wizard.generate_purchases_book(company_id)

        return http.request.make_response(
            file,
            headers=[
                (
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
                (
                    "Content-Disposition",
                    "attachment;filename=Libro_de_compra.xlsx"
                )
            ]
        )