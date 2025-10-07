# catering_management/api.py
import frappe

@frappe.whitelist(allow_guest=True)
def get_customer_info(customer_name):
    """
    Fetch customer details for pre-filling the web form.
    """
    customer = frappe.get_doc("Customer", customer_name)
    
    customer_display_name = customer.customer_name or customer.name
    phone_number = customer.mobile_no

    # Fetch primary address from linked Address
    address_line1 = None
    if customer.primary_address:
        address_doc = frappe.get_doc("Address", customer.primary_address)
        address_line1 = address_doc.address_line1

    return {
        "customer_name": customer_display_name,
        "phone_number": phone_number,
        "complete_address": address_line1
    }
