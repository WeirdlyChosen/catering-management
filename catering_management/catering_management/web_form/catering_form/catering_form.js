frappe.ready(() => {
    console.log("✅ Catering Web Form loaded!");

    // --------------------------------------------------------
    // 🗓 DATE HANDLING SECTION
    // --------------------------------------------------------

    // Get the next Monday from today
    function getNextMonday() {
        const today = new Date();
        const day = today.getDay(); // Sunday=0, Monday=1, ... Saturday=6
        const daysUntilMonday = (8 - day) % 7 || 7; // always between 1–7
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        return nextMonday;
    }

    // Get the Friday of the same week as given Monday
    function getNextFriday(fromDate) {
        const day = fromDate.getDay(); // ensure we always go to Friday in the same week
        const daysUntilFriday = (5 - day + 7) % 7; // Friday = 5
        const friday = new Date(fromDate);
        friday.setDate(fromDate.getDate() + daysUntilFriday);
        return friday;
    }

    // Format date to yyyy-mm-dd (for Frappe fields)
    function formatDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const date = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${date}`;
    }

    // Prefill "Date From" and "Date Until"
    const dateFromField = frappe.web_form.get_field("date_from");
    if (dateFromField) {
        const nextMonday = getNextMonday();
        const nextFriday = getNextFriday(nextMonday);
        frappe.web_form.set_value("date_from", formatDate(nextMonday));
        frappe.web_form.set_value("date_until", formatDate(nextFriday));
    }

    // When "Date From" changes → update "Date Until"
    frappe.web_form.on("date_from", (field, value) => {
        if (!value) return;
        const fromDate = new Date(value);
        const nextFriday = getNextFriday(fromDate);
        frappe.web_form.set_value("date_until", formatDate(nextFriday));
    });

    // --------------------------------------------------------
    // 🍱 DAILY ORDER SECTION (SENIN)
    // --------------------------------------------------------

    function setSeninFields(readOnly, clearValues = false) {
        const seninFields = [
            "porsi_senin",
            "jumlah_senin",
            "telur_senin",
            "buah_senin",
            "juice_senin",
            "extra_size_senin"
        ];

        seninFields.forEach(fieldname => {
            const field = frappe.web_form.get_field(fieldname);
            if (!field) return;

            // toggle read-only
            field.df.read_only = readOnly;
            field.refresh();

            // clear or set values
            if (clearValues) {
                frappe.web_form.set_value(fieldname, "");
            } else if (!readOnly) {
                if (fieldname === "jumlah_senin") {
                    frappe.web_form.set_value(fieldname, 1);
                }
                if (fieldname === "porsi_senin") {
                    frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_order_type"));
                }
                if (fieldname === "telur_senin") {
                    frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_telur"));
                }
                if (fieldname === "buah_senin") {
                    frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_buah"));
                }
                if (fieldname === "juice_senin") {
                    frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_juice"));
                }
                if (fieldname === "extra_size_senin") {
                    frappe.web_form.set_value(fieldname, frappe.web_form.get_value("default_addon_extra_size"));
                }
            }
        });
    }

    // Watch checkbox toggle for Catering Senin
    frappe.web_form.on("catering_senin", (field, value) => {
        if (value) {
            // checked → enable & fill defaults
            setSeninFields(false, false);
        } else {
            // unchecked → clear & lock
            setSeninFields(true, true);
        }
    });

    // Validate before save
    frappe.web_form.validate = () => {
        const cateringSenin = frappe.web_form.get_value("catering_senin");
        const jumlahSenin = frappe.web_form.get_value("jumlah_senin");

        if (cateringSenin && (!jumlahSenin || jumlahSenin == 0)) {
            frappe.msgprint("⚠️ Jumlah Senin tidak boleh kosong atau 0 jika Catering Senin aktif.");
            throw new Error("Validation failed: jumlah_senin is required when catering_senin is active.");
        }

        return true;
    };
});
