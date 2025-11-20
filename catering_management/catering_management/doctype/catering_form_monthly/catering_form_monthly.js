frappe.ui.form.on('Catering Form Monthly', {
    onload(frm) {
        update_week_dates_and_menu(frm);
    },

    bulan(frm) {
        update_week_dates_and_menu(frm);
    },

    tahun(frm) {
        update_week_dates_and_menu(frm);
    },

    porsi(frm) {
        update_week_dates_and_menu(frm);
        update_rate(frm);
    },

    refresh(frm) {
        update_total_check(frm);
    },

    // checkbox triggers
    senin_week1: update_total_check,
    selasa_week1: update_total_check,
    rabu_week1: update_total_check,
    kamis_week1: update_total_check,
    jumat_week1: update_total_check,

    senin_week2: update_total_check,
    selasa_week2: update_total_check,
    rabu_week2: update_total_check,
    kamis_week2: update_total_check,
    jumat_week2: update_total_check,

    senin_week3: update_total_check,
    selasa_week3: update_total_check,
    rabu_week3: update_total_check,
    kamis_week3: update_total_check,
    jumat_week3: update_total_check,

    senin_week4: update_total_check,
    selasa_week4: update_total_check,
    rabu_week4: update_total_check,
    kamis_week4: update_total_check,
    jumat_week4: update_total_check,

    senin_week5: update_total_check,
    selasa_week5: update_total_check,
    rabu_week5: update_total_check,
    kamis_week5: update_total_check,
    jumat_week5: update_total_check,

	rate: update_amount,
    jumlah: update_amount,
});

function update_total_check(frm) {
    let total = 0;
    Object.keys(frm.doc).forEach(field => {
        if (field.match(/^(senin|selasa|rabu|kamis|jumat)_week\d+$/)) {
            if (frm.doc[field]) total++;
        }
    });
    frm.set_value('jumlah', total);
}

function update_amount(frm) {
    const jumlah = frm.doc.jumlah || 0;
    const rate = frm.doc.rate || 0;
    frm.set_value('amount', jumlah * rate);
}

function update_rate(frm) {
    // Example logic — adjust as needed
    const porsi = frm.doc.porsi || "";
    let rate = 0;

    if (porsi.includes("Kids")) {
        rate = 20000;
    } else if (porsi.includes("Adult")) {
        rate = 30000;
    }

    frm.set_value("rate", rate);
}

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

// 🔹 Helper: fetch single menu by date
async function fetchMenuForDate(porsi, dateStr) {
    try {
        // console.log(`📞 Fetching menu for ${dateStr}, porsi: ${porsi}`);
        const res = await frappe.call({
            method: "catering_management.catering_management.doctype.catering_form_monthly.catering_form_monthly.get_menu_for_day",
            args: { porsi, date: dateStr }
        });
        return res.message || "";
    } catch (e) {
        console.error(`❌ Error fetching menu for ${dateStr}:`, e);
        return "";
    }
}

async function update_week_dates_and_menu(frm) {
    const bulan = frm.doc.bulan;
    const tahun = frm.doc.tahun;
    const raw_porsi = frm.doc.porsi || "";
    const porsi = raw_porsi.includes("Kids") ? "Kids" : "Adult";

    // console.log("bulan:", bulan, "tahun:", tahun, "porsi:", raw_porsi, "→ using:", porsi);

    if (!bulan || !tahun) return;

    const mondays = getMondaysOfMonth(tahun, bulan);
    if (!mondays.length) return;

    // STEP 1: Clear all dates & menus first
    for (let i = 1; i <= 5; i++) {
        ["senin", "selasa", "rabu", "kamis", "jumat"].forEach(day => {
            frm.set_value(`date_${day}_week${i}`, "");
            frm.set_value(`menu_${day}_week${i}`, "");
        });
    }

    // STEP 2: Fill only date fields
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
            frm.set_value(`date_${dayName}_week${week}`, dateStr);
        }
    }

    // --- STEP 2.5: Hide or show Week 5 section ---
    const hasWeek5 = mondays.length >= 5 && mondays[4].getMonth() + 1 === parseInt(bulan);

    const week5_fields = [
        "senin_week5", "selasa_week5", "rabu_week5", "kamis_week5", "jumat_week5",
        "date_senin_week5", "date_selasa_week5", "date_rabu_week5", "date_kamis_week5", "date_jumat_week5",
        "menu_senin_week5", "menu_selasa_week5", "menu_rabu_week5", "menu_kamis_week5", "menu_jumat_week5"
    ];

    week5_fields.forEach(fieldname => {
        frm.toggle_display(fieldname, hasWeek5);
    });

    if (!hasWeek5) {
        // clear any leftover week5 data
        week5_fields.forEach(fieldname => frm.set_value(fieldname, ""));
    }

    // --- STEP 3: Fetch menus AFTER all dates are filled
    const firstMonday = mondays[0];
    const lastMonday = mondays[mondays.length - 1];
    const lastFriday = new Date(lastMonday);
    lastFriday.setDate(lastFriday.getDate() + 4);

    // --- STEP 4: Fill menu_* fields
    let allMenus = {};
    try {
        // console.log("📡 Fetching menus from backend (range call)...");
        const res = await frappe.call({
            method: "catering_management.catering_management.doctype.catering_form_monthly.catering_form_monthly.get_menus_in_range",
            args: {
                porsi,
                date_start: frappe.datetime.obj_to_str(firstMonday),
                date_end: frappe.datetime.obj_to_str(lastFriday)
            }
        });
        allMenus = res.message || {};
        // console.log("✅ Menus received:", allMenus);
    } catch (e) {
        console.error("❌ Failed to fetch menus:", e);
    }

    // STEP 5: Fill menu fields using the returned dictionary
    for (let i = 0; i < 5; i++) {
        const week = i + 1;
        for (let d = 0; d < 5; d++) {
            const dayName = ["senin", "selasa", "rabu", "kamis", "jumat"][d];
            const dateStr = frm.doc[`date_${dayName}_week${week}`];
            if (!dateStr) continue;

            const menu = allMenus[dateStr] || "";
            frm.set_value(`menu_${dayName}_week${week}`, menu);
            // console.log(`📅 ${dateStr} (${dayName}_week${week}) → ${menu || "[no menu]"}`);
        }
    }
}
