# Copyright (c) 2025, HomeAutomator.id and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs

class CateringFormItem(Document):
	pass

def get_catering_items(doctype, txt, searchfield, start, page_len, filters):
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
    like_conditions = " OR ".join([f"item_name LIKE '%{d}%'" for d in days])

    return frappe.db.sql(f"""
        SELECT name, item_name
        FROM `tabItem`
        WHERE ({like_conditions})
        AND item_name LIKE %(txt)s
        ORDER BY item_name ASC
        LIMIT %(start)s, %(page_len)s
    """, {"txt": f"%{txt}%", "start": start, "page_len": page_len})