/** @odoo-module */

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { useService } from "@web/core/utils/hooks";
import { SelectionPopup } from "@point_of_sale/app/components/popups/selection_popup/selection_popup";
import { useEnv } from "@odoo/owl";

// New orders are now associated with the current table, if any.
patch(PaymentScreen.prototype, {

  // NO sobreescribir setup() porque en Odoo 19 patch() no preserva el método original
  // y super.setup() llama a Component.prototype.setup en vez de PaymentScreen.prototype.setup.
  // El dialog ya está disponible como this.dialog desde el core.
  // useEnv().utils se accede directamente en los métodos que lo necesitan.
  shouldDownloadInvoice() {
    return false;
  },
  updateSelectedPaymentline(amount = false) {
    console.log("[l10n_ve_pos] updateSelectedPaymentline called:", { amount, hasSelectedLine: !!this.selectedPaymentLine, paymentMethod: this.selectedPaymentLine?.payment_method_id?.name, is_foreign_currency: this.selectedPaymentLine?.payment_method_id?.is_foreign_currency });
    if (this.paymentLines.every((line) => line.paid)) {
      this.currentOrder.addPaymentline(this.payment_methods_from_config[0]);
    }
    if (!this.selectedPaymentLine) {
      return;
    } // do nothing if no selected payment line

    // >>  BINAURAL
    if (!this.selectedPaymentLine.payment_method_id?.is_foreign_currency) {
      console.log("[l10n_ve_pos] Not foreign currency, delegating to super");
      return super.updateSelectedPaymentline(amount);
    }

    if (amount === false) {
      if (this.numberBuffer.get() === null) {
        amount = null;
      } else if (this.numberBuffer.get() === "") {
        amount = 0;
      } else {
        amount = this.numberBuffer.getFloat();
      }
    }
    console.log("[l10n_ve_pos] Foreign currency amount:", amount);

    // disable changing amount on paymentlines with running or done payments on a payment terminal
    const payment_terminal = this.selectedPaymentLine.payment_method_id?.payment_terminal;
    const hasCashPaymentMethod = this.payment_methods_from_config.some(
      (method) => method.type === "cash"
    );
    if (
      !hasCashPaymentMethod &&
      amount > this.currentOrder.remainingDue + this.selectedPaymentLine.amount
    ) {
      this.selectedPaymentLine.setAmount(0);
      this.numberBuffer.set(this.currentOrder.remainingDue.toString());
      amount = this.currentOrder.remainingDue;
      this.showMaxValueError();
    }
    if (
      payment_terminal &&
      !["pending", "retry"].includes(this.selectedPaymentLine.getPaymentStatus())
    ) {
      return;
    }
    if (amount === null) {
      this.deletePaymentLine(this.selectedPaymentLine.uuid);
    } else {
      if (this.selectedPaymentLine.payment_method_id?.is_foreign_currency) {
        console.log("[l10n_ve_pos] Calling set_foreign_amount:", amount);
        this.selectedPaymentLine.set_foreign_amount(amount);
      } else {
        this.selectedPaymentLine.setAmount(amount);
      }
    }
  },
  async _isOrderValid(isForceValidate) {
    let res = await super._isOrderValid(isForceValidate)
    if (!this.currentOrder) {
      return res
    }

    let amounts = this.currentOrder.payment_ids.map((el) => el.amount)
    if (!amounts.every((el) => el != 0 && this.currentOrder.totalDue !== 0)) {
      this.dialog.add(AlertDialog, {
        title: _t('Empty Paymentline'),
        body: _t(
          "You can't validate with empty payment lines"),
      })
      return false
    }
    return res
  },
  async showPaymentsOrigin() {
    let id = []
    if (!this.pos.toRefundLines || Object.values(this.pos.toRefundLines).length == 0) {
      return
    }
    Object.values(this.pos.toRefundLines).forEach(el => {
      id = el.orderline.orderBackendId
    })

    const payments = await this.pos.orm.call('pos.order', 'get_payments_order_refund', [id]);

    let payment_list = payments.map(el => {
      return {
        id: el.id,
        label: el.payment_method_id[1] + " " + el.display_name + " / " + this.env.utils.formatForeignCurrency(el.foreign_amount),
        isSelected: false,
        item: el,
      }

    })
    await this.dialog.add(
      SelectionPopup,
      {
        title: _t("Payments"),
        list: payment_list,
      }
    )
  }
})
