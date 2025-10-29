frappe.ready(() => {
    console.log("✅ Catering Web Form loaded!");

    // --------------------------------------------------------
    // 🗓 DATE HANDLING SECTION
    // --------------------------------------------------------

    function getNextMonday() {
        const today = new Date();
        const day = today.getDay(); // Sunday=0, Monday=1, ...
        const daysUntilMonday = (8 - day) % 7 || 7;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        return nextMonday;
    }

    function getNextFriday(fromDate) {
        const day = fromDate.getDay();
        const daysUntilFriday = (5 - day + 7) % 7;
        const friday = new Date(fromDate);
        friday.setDate(fromDate.getDate() + daysUntilFriday);
        return friday;
    }

    function formatDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const date = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${date}`;
    }

    const dateFromField = frappe.web_form.get_field("date_from");
    if (dateFromField) {
        const nextMonday = getNextMonday();
        const nextFriday = getNextFriday(nextMonday);
        frappe.web_form.set_value("date_from", formatDate(nextMonday));
        frappe.web_form.set_value("date_until", formatDate(nextFriday));
    }

    frappe.web_form.on("date_from", (field, value) => {
        if (!value) return;
        const fromDate = new Date(value);
        frappe.web_form.set_value("date_until", formatDate(getNextFriday(fromDate)));
    });

    // --------------------------------------------------------
    // 🍱 DAILY ORDER HANDLER
    // --------------------------------------------------------

    // Reusable helper for all weekdays
    function handleDay(day) {
        const prefix = day.toLowerCase();
        const checkbox = `catering_${prefix}`;
        const fields = [
            `porsi_${prefix}`,
            `jumlah_${prefix}`,
            `telur_${prefix}`,
            `buah_${prefix}`,
            `juice_${prefix}`,
            `extra_size_${prefix}`,
        ];

        function setFields(readOnly, clearValues = false) {
            fields.forEach(fieldname => {
                const field = frappe.web_form.get_field(fieldname);
                if (!field) return;

                field.df.read_only = readOnly;
                field.refresh();

                if (clearValues) {
                    frappe.web_form.set_value(fieldname, "");
                    return;
                }

                if (!readOnly) {
                    if (fieldname === `jumlah_${prefix}`) {
                        frappe.web_form.set_value(fieldname, 1);
                    }
                    if (fieldname === `porsi_${prefix}`) {
                        frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_order_type"));
                    }
                    if (fieldname === `telur_${prefix}`) {
                        frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_telur"));
                    }
                    if (fieldname === `buah_${prefix}`) {
                        frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_buah"));
                    }
                    if (fieldname === `juice_${prefix}`) {
                        frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_juice"));
                    }
                    if (fieldname === `extra_size_${prefix}`) {
                        frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_extra_size"));
                    }
                }
            });
        }

        // Checkbox change
        frappe.web_form.on(checkbox, (field, value) => {
            if (value) {
                setFields(false, false);
            } else {
                setFields(true, true);
            }
        });

        // Initialize on form load
        setTimeout(() => {
            const active = frappe.web_form.get_value(checkbox);
            if (active) {
                setFields(false, false);
            } else {
                setFields(true, true);
            }
        }, 800);

        // Add validation for this day
        frappe.web_form.validate = (frappe.web_form.validate || function () { return true; });
        const oldValidate = frappe.web_form.validate;
        frappe.web_form.validate = () => {
            const ok = oldValidate();
            const active = frappe.web_form.get_value(checkbox);
            const jumlah = frappe.web_form.get_value(`jumlah_${prefix}`);
            if (active && (!jumlah || jumlah == 0)) {
                frappe.msgprint(`⚠️ Jumlah ${day} tidak boleh kosong atau 0 jika Catering ${day} aktif.`);
                throw new Error(`Validation failed: jumlah_${prefix} required`);
            }
            return ok;
        };
    }

    // Apply to all days
    ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].forEach(handleDay);
});
