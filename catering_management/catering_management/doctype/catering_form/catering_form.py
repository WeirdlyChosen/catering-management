# Copyright (c) 2025, HomeAutomator.id and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class CateringForm(Document):
	def validate(self):
		# Automatically compute summary fields for each day
		self.set_daily_summaries()

	def set_daily_summaries(self):
		# Define all weekdays you use in your form
		days = ["senin", "selasa", "rabu", "kamis", "jumat"]

		for day in days:
			# Example: porsi_senin, jumlah_senin, telur_senin, buah_senin, etc.
			porsi = getattr(self, f"porsi_{day}", None)

			if not porsi:
				setattr(self, f"summary_{day}", "")
				continue

			# Build add-ons text
			addons = []
			if getattr(self, f"telur_{day}", 0):
				addons.append("+telur")
			if getattr(self, f"buah_{day}", 0):
				addons.append("+buah")
			if getattr(self, f"juice_{day}", 0):
				addons.append("+juice")
			if getattr(self, f"extra_size_{day}", 0):
				addons.append("+extra size")

			# Combine all parts into readable summary
			addons_text = " ".join(addons)
			if addons_text:
				summary = f"{porsi} {addons_text}"
			else:
				summary = f"{porsi}"

			setattr(self, f"summary_{day}", summary)

