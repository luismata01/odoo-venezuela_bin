from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class ResCurrencyRate(models.Model):
    _inherit = "res.currency.rate"

    @api.model
    def compute_rate(self, foreign_currency_id, rate_date):
        """
        Compute the rate and inverse rate for the given currency and date.

        The foreign_rate is the rate shown to the user (e.g., 549.37 VEF per USD).
        The foreign_inverse_rate is the exact reciprocal (e.g., 0.00182 USD per VEF),
        computed as 1 / foreign_rate to ensure consistency regardless of rounding
        differences in the stored company_rate / inverse_company_rate fields.

        Parameters
        ----------
        foreign_currency_id : int
            The id of the foreign currency.
        rate_date : date
            The date of the rate that is gonna be searched for the given currency
            (foreign_currency_id).

        Returns
        -------
        dict
            A dictionary with the rate and inverse rate for the given currency and date.
        """
        rate = self.env["res.currency.rate"].search(
            [
                ("currency_id", "=", foreign_currency_id),
                ("company_id", "=", self.env.company.id),
                ("name", "<=", rate_date),
            ],
            order="name DESC", limit=1,
        )
        if not rate:
            return {}

        vef_id = self.env.company.currency_id.id
        if vef_id == foreign_currency_id:
            foreign_rate = rate.company_rate or 0.0
        else:
            foreign_rate = rate.inverse_company_rate or 0.0

        # Ensure foreign_inverse_rate is the exact reciprocal of foreign_rate
        # to avoid inconsistencies when multiplying / dividing in the frontend.
        foreign_inverse_rate = 1.0 / foreign_rate if foreign_rate else 0.0

        return {
            "foreign_rate": foreign_rate,
            "foreign_inverse_rate": foreign_inverse_rate,
        }

    @api.model
    def compute_inverse_rate(self, rate):
        """
        Compute the inverse rate for the given rate.
        The inverse rate will be the inverse of the given rate if the foreign currency is USD, else
        the inverse rate will be the same as the given rate.

        Parameters
        ----------
        rate : float
            The rate that is gonna be used to compute the inverse rate.

        Returns
        -------
        float
            The inverse rate for the given rate.
        """
        base_usd_id = self.env["ir.model.data"]._xmlid_to_res_id(
            "base.USD", raise_if_not_found=False
        )
        foreign_currency_id = self.env.company.foreign_currency_id.id or False
        inverse_rate = (1 / rate) if rate and foreign_currency_id == base_usd_id else rate
        return inverse_rate
