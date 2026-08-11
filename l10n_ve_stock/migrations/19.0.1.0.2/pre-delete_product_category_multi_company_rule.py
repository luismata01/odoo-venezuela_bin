def migrate(cr, version):
    # product_category_multi_company_rule was declared with noupdate="1", so
    # removing it from the module's XML does not auto-delete it on upgrade.
    # It references product_category.company_id, which this version removes,
    # so the stale rule must be dropped explicitly or it breaks any read of
    # product.category (e.g. loading the POS).
    cr.execute(
        """
        DELETE FROM ir_rule
        WHERE id IN (
            SELECT res_id FROM ir_model_data
            WHERE module = 'l10n_ve_stock'
            AND name = 'product_category_multi_company_rule'
            AND model = 'ir.rule'
        )
        """
    )

    cr.execute(
        """
        DELETE FROM ir_model_data
        WHERE module = 'l10n_ve_stock'
        AND name = 'product_category_multi_company_rule'
        AND model = 'ir.rule'
        """
    )
