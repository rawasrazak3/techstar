frappe.ui.form.on("Quotation Item", {
    custom_bom_cost(frm, cdt, cdn) {

        let row = locals[cdt][cdn];

        if (!row.item_code) {
            frappe.msgprint("Please select an Item Code first.");
            return;
        }

        frappe.call({
            method: "techstar.techstar.server_script.quotation.get_bom_cost_popup",
            args: {
                item_code: row.item_code,
                qty: row.qty
            },
            callback(r) {
                if (r.message) {
                    show_bom_cost_popup(r.message);
                }
            }
        });
    }
});

function show_bom_cost_popup(data) {

    let rm_html = `<table class="table table-bordered">
        <thead>
            <tr>
                <th>Raw Material</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>`;

    data.raw_materials.forEach(i => {
        rm_html += `<tr>
            <td>${i.item_code}</td>
            <td>${i.qty}</td>
            <td>${i.rate}</td>
            <td>${i.amount}</td>
        </tr>`;
    });

    rm_html += `</tbody></table>`;

    let dialog = new frappe.ui.Dialog({
        title: `BOM Cost Details – ${data.item_code}`,
        size: "large",
        fields: [
            {
                fieldtype: "HTML",
                fieldname: "raw_material_table",
                label: "Raw Materials",
            },
            {
                fieldtype: "HTML",
                fieldname: "summary",
                label: "Cost Summary"
            }
        ]
    });

    dialog.fields_dict.raw_material_table.$wrapper.html(rm_html);

    let summary_html = `
        <div style="padding-top: 15px;">
            <h4><b>Cost Summary</b></h4>
            <p><b>Raw Material Cost:</b> ${data.raw_material_total}</p>
            <p><b>Operating Cost:</b> ${data.operating_cost}</p>
            <hr>
            <h3><b>Total Cost: ${data.total_cost}</b></h3>
        </div>
    `;

    dialog.fields_dict.summary.$wrapper.html(summary_html);

    dialog.show();
}
