import frappe

@frappe.whitelist(allow_guest=True)
def get_customer_info(customer_name):
    """
    Fetch customer's phone and address safely (without throwing UI popups).
    """
    # Prepare response defaults
    result = {
        "customer_name": None,
        "phone_number": None,
        "complete_address": None
    }

    if not customer_name:
        return result

    # Fetch customer safely
    if not frappe.db.exists("Customer", customer_name):
        return result

    customer = frappe.get_doc("Customer", customer_name)
    result["customer_name"] = customer.name
    result["phone_number"] = getattr(customer, "mobile_no", None)

    # Get address only if linked and valid
    address_name = getattr(customer, "customer_primary_address", None)
    if address_name and frappe.db.exists("Address", address_name):
        address_doc = frappe.get_doc("Address", address_name)
        result["complete_address"] = getattr(address_doc, "address_line1", None)

    # Clear any queued messages (just in case)
    frappe.local.message_log = []
    frappe.clear_messages()

    return result
