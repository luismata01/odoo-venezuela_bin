/** @odoo-module */

import { PosPayment } from "@point_of_sale/app/models/pos_payment";
import { patch } from "@web/core/utils/patch";
import { roundPrecision } from "@web/core/utils/numbers";

patch(PosPayment.prototype, {
    setup(vals) {
        super.setup(...arguments);
        this.foreign_amount = vals.foreign_amount || 0;
        this.foreign_rate = vals.foreign_rate || 0;
    },

    get_foreign_amount() {
        return this.foreign_amount || 0;
    },

    setAmount(value, only = false) {
        const amount = parseFloat(value) || 0;
        const config = this.pos_order_id?.config;
        const isDue = Math.abs(amount - this.pos_order_id.remainingDue) < 0.01;
        
        super.setAmount(amount);
        
        if (!only) {
            if (isDue && config?.foreign_currency_id) {
                this.set_foreign_amount(this.pos_order_id.get_foreign_total_with_tax(), true);
            } else if (config?.foreign_currency_id) {
                const display_rate = config?.foreign_rate || 0;
                const rate = config?.foreign_inverse_rate || (display_rate ? 1.0 / display_rate : 0);
                this.foreign_amount = amount * rate;
            }
        }
    },

    set_foreign_amount(amount, only = false) {
        const foreign_amount = parseFloat(amount) || 0;
        const config = this.pos_order_id?.config;
        
        this.foreign_amount = foreign_amount;
        
        if (!only && config?.foreign_currency_id) {
            const display_rate = config?.foreign_rate || 0;
            const rate = config?.foreign_inverse_rate || (display_rate ? 1.0 / display_rate : 0);
            // Convert foreign amount to local amount using the rate
            const local_amount = rate ? foreign_amount / rate : 0;
            this.setAmount(local_amount, true);
        }
    },

    serializeForORM(opts = {}) {
        const data = super.serializeForORM(opts);
        data.foreign_amount = this.foreign_amount;
        data.foreign_rate = this.foreign_rate || this.pos_order_id?.config?.foreign_rate || 0;
        return data;
    },
});
