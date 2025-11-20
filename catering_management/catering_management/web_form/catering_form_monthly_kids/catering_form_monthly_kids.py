# catering_form_monthly_kids.py

import frappe
from catering_management.catering_management.web_form.catering_form_monthly_kids import catering_form_monthly_kids


@frappe.whitelist()
def get_rate_from_web_form(porsi):
    """Proxy to call the web_form get_rate"""
    return catering_form_monthly_kids.get_rate(porsi)

def get_context(context):
    """
    Required by Web Form loader
    """
    return context

@frappe.whitelist(allow_guest=True)
def get_rate(porsi):
    """
    Fetch the rate for the given porsi from 'Porsi Catering'.
    """
    if not porsi:
        return 0

    # Look up the rate field from the linked 'Porsi Catering' DocType
    rate = frappe.db.get_value("Porsi Catering", porsi, "rate")
    return rate or 0
