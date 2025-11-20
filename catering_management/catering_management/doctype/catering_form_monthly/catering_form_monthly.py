# Copyright (c) 2025, HomeAutomator.id and contributors 
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CateringFormMonthly(Document):
    def validate(self):
        # Own fields
        nama = self.nama_lengkap or ""
        alamat_kelas = self.alamat__kelas or ""
        no_whatsapp_orang_tua = self.no_whatsapp_orang_tua or ""

        # Initialize linked school fields
        sekolah_name = ""
        sekolah_alamat = ""

        if self.sekolah:
            # Fetch linked fields from Sekolah DocType
            sekolah_doc = frappe.get_doc("Sekolah", self.sekolah)
            sekolah_name = sekolah_doc.name or ""
            sekolah_alamat = sekolah_doc.alamat or ""

        # Concatenate everything into alamat_lengkap
        # Each part on a new line
        self.alamat_lengkap = "\n".join(filter(None, [
            nama,
            alamat_kelas,
            sekolah_name,
            sekolah_alamat,
            no_whatsapp_orang_tua
        ]))


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
            "porsi": ["like", f"{porsi}%"]
        },
        fields=["date", "menu"]
    )

    # Return as dictionary { 'YYYY-MM-DD': 'Menu Name' }
    result = {m["date"].strftime("%Y-%m-%d"): m["menu"] for m in menus}
    return result
