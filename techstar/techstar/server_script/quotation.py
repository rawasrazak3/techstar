import frappe
import json

@frappe.whitelist()
def get_bom_cost_popup(item_code, qty):

    from frappe.utils import flt

    # Get default BOM
    bom_no = frappe.db.get_value("BOM", {"item": item_code, "is_default": 1}, "name")
    if not bom_no:
        frappe.throw(f"No default BOM found for {item_code}")

    bom = frappe.get_doc("BOM", bom_no)

    raw_materials = []
    raw_material_total = 0

    for item in bom.items:
        rm_qty = flt(item.qty) * flt(qty)
        amount = rm_qty * flt(item.rate)

        raw_material_total += amount

        raw_materials.append({
            "item_code": item.item_code,
            "qty": rm_qty,
            "rate": item.rate,
            "amount": amount
        })

    operating_cost = flt(bom.operating_cost) * flt(qty)
    total_cost = raw_material_total + operating_cost

    return {
        "item_code": item_code,
        "qty": qty,
        "raw_materials": raw_materials,
        "raw_material_total": raw_material_total,
        "operating_cost": operating_cost,
        "total_cost": total_cost
    }
