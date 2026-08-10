from odoo import fields, models


class ResCompany(models.Model):
    _inherit = "res.company"

    require_full_address = fields.Boolean(
        default=True,
        string='Exigir dirección fiscal completa en contactos',
        help="If active, País, Estado, Ciudad, Municipio y Parroquia son obligatorios al crear/editar contactos, "
             "para cumplir con la homologación fiscal del SENIAT. Desactívalo para relajar esa exigencia en esta compañía.",
    )
