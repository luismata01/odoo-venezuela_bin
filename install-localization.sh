#!/bin/bash
# Install the full Venezuelan localization (l10n_ve) for Odoo 19.0
# Excludes all POS modules: point_of_sale, l10n_ve_pos, l10n_ve_pos_igtf, l10n_ve_pos_mf

set -e

# List of modules to install (comma-separated, no spaces)
MODULES="account,account_accountant,account_fiscal_year_closing,calendar,contacts,crm,l10n_ve_account_fiscalyear_closing,l10n_ve_accountant,l10n_ve_auditlog,l10n_ve_base,l10n_ve_binaural,l10n_ve_contact,l10n_ve_currency_rate_live,l10n_ve_donation,l10n_ve_filter_partner,l10n_ve_fiscal_lock_days,l10n_ve_igtf,l10n_ve_invoice,l10n_ve_invoice_digital,l10n_ve_invoice_loyalty,l10n_ve_iot_mf,l10n_ve_location,l10n_ve_payment_extension,l10n_ve_price_list,l10n_ve_purchase,l10n_ve_rate,l10n_ve_ref_bank,l10n_ve_sale,l10n_ve_stock_account,l10n_ve_stock_purchase,l10n_ve_stock_reports,l10n_ve_studio,l10n_ve_tax,l10n_ve_tax_payer,l10n_ve_tools,mail,purchase,sale_management,stock"

docker compose run --rm odoo click-odoo-initdb \
  -n devel_demo \
  -m "$MODULES" \
  --no-demo \
  --no-cache

echo "✅ Venezuelan localization installed successfully on database 'devel_demo'"
