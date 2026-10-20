import frappe
from frappe.model.mapper import get_mapped_doc

@frappe.whitelist()
def make_sales_invoice_from_dn(source_name, purpose, percentage=0, is_final=0):
    def update_item(source, target, source_parent):
        target.qty = 0 # Preset to 0, will be calculated below
        
    def set_missing_values(source, target):
        target.remarks = f"{purpose} - {source.name}"
        if purpose:
            target.remarks = f"Purpose: {purpose}\nReference: {source.name}"
            
        doc = frappe.get_doc("Delivery Note", source.name)
        
        # Filter items to remove those that are fully billed
        items_to_remove = []
        
        for item in target.items:
            # Find corresponding source item
            source_item = next((i for i in doc.items if i.name == item.dn_detail), None)
            
            if source_item:
                pending_qty = source_item.qty - source_item.billed_qty
                
                if pending_qty <= 0:
                    items_to_remove.append(item)
                    continue

                if int(is_final) == 1:
                    item.qty = pending_qty
                else:
                    item.qty = source_item.qty * (float(percentage) / 100)
                    if item.qty > pending_qty:
                        item.qty = pending_qty
                        frappe.msgprint(f"Quantity for item {item.item_code} capped at pending quantity {pending_qty}", alert=True)

    target_doc = get_mapped_doc("Delivery Note", source_name, {
        "Delivery Note": {
            "doctype": "Sales Invoice",
            "validation": {
                "docstatus": ["=", 1]
            }
        },
        "Delivery Note Item": {
            "doctype": "Sales Invoice Item",
            "field_map": {
                "name": "dn_detail",
                "parent": "delivery_note",
                "qty": "qty" # This is overridden in postprocess but mapped primarily
            },
            "postprocess": update_item
        }
    }, target_doc=None, postprocess=set_missing_values)
    
    # Remove fully billed items from the object before returning (if mapping didn't handle it perfectly)
    # The get_mapped_doc mapping might copy them, so we clean up in set_missing_values or here.
    # It's cleaner to handle removing items in set_missing_values by physically removing from target.items list
    # but modifying list while iterating is tricky. Let's do a pass here if needed, or rely on set_missing_values logic?
    # Actually, set_missing_values modifies the `target` doc in place.
    
    # Let's clean up items with 0 or negative qty just in case
    target_doc.items = [item for item in target_doc.items if item.qty > 0]
    
    return target_doc
