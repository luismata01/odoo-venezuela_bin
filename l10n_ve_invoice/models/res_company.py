import logging

from odoo import fields, models

_logger = logging.getLogger(__name__)


class ResCompany(models.Model):
    _inherit = "res.company"

    max_product_invoice = fields.Integer(default=23)
    group_sales_invoicing_series = fields.Boolean()
    show_total_on_usd_invoice = fields.Boolean(default=True)
    show_tag_on_usd_invoice = fields.Boolean(default=True)
    show_column_default_code_free_form = fields.Boolean(default=True)
    auto_select_debit_note_journal = fields.Boolean(default=False) 
    block_invoice_display_date_upper_than_date = fields.Boolean()
    free_form_reserve_header_logo = fields.Boolean(
        string="Reservar espacio para logo pre-impreso en Factura Libre",
        default=False,
        help="Deja en blanco el bloque superior izquierdo del encabezado de la Factura Libre "
             "(10.5 x 3.7 cm) para talonarios con logo y datos de la compañía pre-impresos. "
             "Los datos del cliente y de la factura se muestran en el lado derecho.",
    )
