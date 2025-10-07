import frappe
from frappe import _
def get_context(context):
	# do your magic here
	pass

def before_load(web_form):
    import urllib.parse
    # Extract query params from request
    week_number = frappe.local.request.args.get("week_number")
    customer_name = frappe.local.request.args.get("customer_name")

    if week_number:
        web_form.doc.week_number = week_number
    if customer_name:
        web_form.doc.customer_name = customer_name
