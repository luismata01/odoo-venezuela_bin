/** @odoo-module **/

// DESACTIVADO para Odoo 19: en Odoo 19 los componentes Owl usan `static props`
// y no se pueden extender de esta forma con `patch(Clase, { props: {...} })`.
// Además, el template order_display.xml referencia props (conversion_rate, foreign_total,
// foreign_tax, quantity_products) que ningún componente padre pasa en Odoo 19.

// import { OrderDisplay } from "@point_of_sale/app/components/order_display/order_display";
// import { patch } from "@web/core/utils/patch";
//
// patch(OrderDisplay, {
//   props: {
//     ...OrderDisplay.props,
//     conversion_rate: { optional: true },
//     foreign_total: { type: String, optional: true },
//     foreign_tax: { type: String, optional: true },
//     quantity_products: { optional: true },
//   },
// });
