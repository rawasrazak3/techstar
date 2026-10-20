frappe.ui.form.on('Delivery Note', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 1 && frm.doc.status !== "Completed" && !frm.doc.is_return) {
            frm.add_custom_button(__('Create Partial Invoice'), function () {
                // Dialog to get Purpose, Percentage and Is Final
                let d = new frappe.ui.Dialog({
                    title: 'Create Sales Invoice',
                    fields: [
                        {
                            label: 'Purpose',
                            fieldname: 'purpose',
                            fieldtype: 'Select',
                            options: ['', 'Delivery', 'Fitting', 'Final Payment'],
                            reqd: 1
                        },
                        {
                            label: 'Percentage',
                            fieldname: 'percentage',
                            fieldtype: 'Float',
                            reqd: 0,
                            depends_on: 'eval:!doc.is_final',
                            description: 'Enter percentage of quantity to invoice (e.g. 50)'
                        },
                        {
                            label: 'Is Final',
                            fieldname: 'is_final',
                            fieldtype: 'Check',
                            description: 'Check if this is the final invoice for the remaining quantity'
                        }
                    ],
                    primary_action_label: 'Create',
                    primary_action(values) {

                        if (!values.is_final && (!values.percentage || values.percentage <= 0)) {
                            frappe.msgprint(__('Please enter a valid Percentage'));
                            return;
                        }

                        frappe.call({
                            method: "techstar.api.make_sales_invoice_from_dn",
                            args: {
                                source_name: frm.doc.name,
                                purpose: values.purpose,
                                percentage: values.percentage,
                                is_final: values.is_final ? 1 : 0
                            },
                            freeze: true,
                            callback: function (r) {
                                if (r.message) {
                                    var doc = frappe.model.sync(r.message);
                                    frappe.set_route("Form", r.message.doctype, r.message.name);
                                }
                                d.hide();
                            }
                        });
                    }
                });
                d.show();
            });
        }
    }
});
