frappe.ready(() => {
    console.log("Catering Web Form loaded!");

    const porsi = frappe.web_form.get_value("porsi");
    console.log("Porsi value on load:", porsi);

    if (porsi) {
        frappe.call({
            method: "catering_management.catering_management.api.catering_form_monthly_kids.get_rate",
            args: { porsi: porsi },
            callback: function(r) {
                if (r.message) {
                    console.log("Rate fetched:", r.message);
                    frappe.web_form.set_value("rate", r.message);
                } else {
                    console.log("No rate found for porsi:", porsi);
                }
            },
            error: function(err) {
                console.error("Error fetching rate:", err);
            }
        });
    } else {
        console.log("No porsi value on load; skipping rate fetch.");
    }

        // Attach event listeners for weekday checkboxes
    const weekdays = ["senin", "selasa", "rabu", "kamis", "jumat"];
    const weeks = [1, 2, 3, 4, 5];

    weekdays.forEach(day => {
        weeks.forEach(week => {
            const field = `${day}_week${week}`;
            frappe.web_form.on(field, (fieldname, value) => {
                update_total_check();
            });
        });
    });

    // Also trigger when rate or jumlah changes
    frappe.web_form.on("rate", update_amount);
    frappe.web_form.on("jumlah", update_amount);

    function update_total_check() {
        let total = 0;

        weekdays.forEach(day => {
            weeks.forEach(week => {
                const field = `${day}_week${week}`;
                if (frappe.web_form.get_value(field)) total++;
            });
        });

        frappe.web_form.set_value("jumlah", total);
        update_amount();
    }

    function update_amount() {
        const jumlah = frappe.web_form.get_value("jumlah") || 0;
        const rate = frappe.web_form.get_value("rate") || 0;
        const amount = jumlah * rate;

        frappe.web_form.set_value("amount", amount);
        // console.log(`Amount updated: ${jumlah} × ${rate} = ${amount}`);
    }

    // 👇 Recalculate once on initial load
    setTimeout(() => {
        update_total_check();
    }, 500);
});

frappe.ready(async () => {
    console.log("Catering Web Form (Kids) loaded!");

    // 🔹 Utility: get all Mondays of a month
    function getMondaysOfMonth(year, month) {
        const mondays = [];
        const date = new Date(year, month - 1, 1);
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }
        while (date.getMonth() === month - 1) {
            mondays.push(new Date(date));
            date.setDate(date.getDate() + 7);
        }
        return mondays;
    }

    // 🔹 Core logic
    async function update_week_dates_and_menu() {
        const bulan = frappe.web_form.get_value("bulan");
        const tahun = frappe.web_form.get_value("tahun");
        const raw_porsi = frappe.web_form.get_value("porsi") || "";
        const porsi = raw_porsi.includes("Kids") ? "Kids" : "Adult";

        if (!bulan || !tahun) {
            console.log("Bulan or tahun missing, skipping update.");
            return;
        }

        const mondays = getMondaysOfMonth(tahun, bulan);
        if (!mondays.length) {
            console.log("No Mondays found for this month.");
            return;
        }

        // STEP 1: Clear all date & menu fields
        for (let i = 1; i <= 5; i++) {
            ["senin", "selasa", "rabu", "kamis", "jumat"].forEach(day => {
                const dateField = `date_${day}_week${i}`;
                const menuField = `menu_${day}_week${i}`;

                // Always clear date immediately
                if (frappe.web_form.fields_dict[dateField]) {
                    frappe.web_form.set_value(dateField, "");
                }

                // For menu fields (which may be Link/Autocomplete), defer clearing
                if (frappe.web_form.fields_dict[menuField]) {
                    setTimeout(() => {
                        try {
                            frappe.web_form.set_value(menuField, "");
                        } catch (e) {
                            console.warn(`Skipping reset for ${menuField}:`, e.message);
                        }
                    }, 300);
                }
            });
        };

        // STEP 2: Fill dates week by week
        for (let i = 0; i < 5; i++) {
            const week = i + 1;
            const monday = mondays[i];
            if (!monday) continue;

            for (let d = 0; d < 5; d++) {
                const current = new Date(monday);
                current.setDate(current.getDate() + d);
                if (i === 4 && current.getMonth() + 1 > bulan) continue;

                const dayName = ["senin", "selasa", "rabu", "kamis", "jumat"][d];
                const dateStr = frappe.datetime.obj_to_str(current);
                frappe.web_form.set_value(`date_${dayName}_week${week}`, dateStr);
            }
        }

        // STEP 3: Hide or show Week 5 section only
        const hasWeek5 = mondays.length >= 5 && mondays[4].getMonth() + 1 === parseInt(bulan, 10);

        // Change this to match your actual fieldname in the Web Form JSON
        const week5_section_fieldname = "week_5_section";

        // Locate the section wrapper element
        const sectionWrapper = document.querySelector(`[data-fieldname="${week5_section_fieldname}"]`);

        if (sectionWrapper) {
            sectionWrapper.style.display = hasWeek5 ? "" : "none";
            console.log(`Week 5 section ${hasWeek5 ? "shown" : "hidden"}`);
        }

        // If there’s no Week 5, clear all Week 5 fields
        if (!hasWeek5) {
            const week5_fields = [
                "senin_week5", "selasa_week5", "rabu_week5", "kamis_week5", "jumat_week5",
                "date_senin_week5", "date_selasa_week5", "date_rabu_week5", "date_kamis_week5", "date_jumat_week5",
                "menu_senin_week5", "menu_selasa_week5", "menu_rabu_week5", "menu_kamis_week5", "menu_jumat_week5"
            ];
            week5_fields.forEach(fieldname => frappe.web_form.set_value(fieldname, ""));
            console.log("Week 5 field values cleared (month has only 4 weeks)");
        }

        // STEP 4: Fetch menus for all dates in range
        const firstMonday = mondays[0];
        const lastMonday = mondays[mondays.length - 1];
        const lastFriday = new Date(lastMonday);
        lastFriday.setDate(lastFriday.getDate() + 4);

        let allMenus = {};
        try {
            // console.log("Fetching menus for range:", firstMonday, "to", lastFriday);
            const res = await frappe.call({
                method: "catering_management.catering_management.doctype.catering_form_monthly.catering_form_monthly.get_menus_in_range",
                args: {
                    porsi,
                    date_start: frappe.datetime.obj_to_str(firstMonday),
                    date_end: frappe.datetime.obj_to_str(lastFriday)
                }
            });
            allMenus = res.message || {};
            // console.log("Menus received:", allMenus);
        } catch (e) {
            console.error("Failed to fetch menus:", e);
        }

        // STEP 5: Match menus to each weekday
        for (let i = 0; i < 5; i++) {
            const week = i + 1;
            for (let d = 0; d < 5; d++) {
                const dayName = ["senin", "selasa", "rabu", "kamis", "jumat"][d];
                const dateStr = frappe.web_form.get_value(`date_${dayName}_week${week}`);
                if (!dateStr) continue;

                const menu = allMenus[dateStr] || "";
                frappe.web_form.set_value(`menu_${dayName}_week${week}`, menu);
                // console.log(`${dateStr} (${dayName}_week${week}) → ${menu || "[no menu]"}`);


                        // 🔹 Update day label dynamically
                const dayField = `${dayName}_week${week}`;
                const field = frappe.web_form.get_field(dayField);
                
                if (field && field.df) {
                    const originalLabel = field.df.original_label || field.df.label;
                    field.df.original_label = originalLabel;  // store original
                    field.set_label(menu ? `${originalLabel} - ${menu}` : originalLabel);
                }
            }
        }
    }

    // 🔹 Trigger logic whenever month or year changes
    frappe.web_form.on("bulan", update_week_dates_and_menu);
    frappe.web_form.on("tahun", update_week_dates_and_menu);

    // 🔹 Optional: auto-run if both bulan & tahun already set
    const bulanNow = frappe.web_form.get_value("bulan");
    const tahunNow = frappe.web_form.get_value("tahun");
    if (bulanNow && tahunNow) {
        await update_week_dates_and_menu();
    }
});
