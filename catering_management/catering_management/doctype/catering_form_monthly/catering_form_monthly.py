# Copyright (c) 2025, HomeAutomator.id and contributors 
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CateringFormMonthly(Document):
    pass


# @frappe.whitelist()
# def get_menu_for_day(porsi, date):
#     """
#     Returns the menu for a given date and porsi ('Kids' or 'Adult').
#     """
#     menu = frappe.db.get_value("Daily Menu", {"porsi": porsi, "date": date}, "menu")
#     return menu or ""

    # return {"menu": menu_doc or ""}

@frappe.whitelist(allow_guest=True)
def get_menus_in_range(porsi, date_start, date_end):
    from datetime import datetime

    # Convert incoming strings to date objects
    start = datetime.strptime(date_start, "%Y-%m-%d").date()
    end = datetime.strptime(date_end, "%Y-%m-%d").date()

    menus = frappe.get_all(
        "Catering Menu",
        filters={
            "date": ["between", [start, end]],
            "menu_group": ["like", f"{porsi}%"]
        },
        fields=["date", "menu"]
    )

    # Return as dictionary { 'YYYY-MM-DD': 'Menu Name' }
    result = {m["date"].strftime("%Y-%m-%d"): m["menu"] for m in menus}
    return result
