from datetime import datetime

from odoo import http, _
from odoo.exceptions import UserError


class BinauralNominaReportes(http.Controller):
    @http.route("/web/binary/download_sales_book", type="http", auth="user")
    def download_sales_book(self, id, date_from, date_to):
        sales_book = http.request.env["wizard.sales.book"].browse(int(id))
        if not sales_book.exists():
            raise UserError(_("Wizard record not found. Please try again."))
        file = sales_book.generate_sales_book(
            datetime.strptime(date_from, "%Y-%m-%d"), datetime.strptime(date_to, "%Y-%m-%d")
        )
        return http.request.make_response(
            file,
            headers=[
                (
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ),
                ("Content-Disposition", "attachment;filename=Libro_de_venta.xlsx"),
            ],
        )
