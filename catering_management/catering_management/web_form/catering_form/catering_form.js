/*
Add to client script field for this web form, do not run from js file.

// To get field names
const waitForForm = setInterval(() => {
    if (frappe.web_form && frappe.web_form.set_value) {
        clearInterval(waitForForm);

        console.log("Frappe Web Form object:", frappe.web_form);
        console.log("Frappe Web Form fields:", frappe.web_form.fields);

        // Your existing params logic
        const urlParams = new URLSearchParams(window.location.search);
        const week_number = urlParams.get('week_number');
        const customer_name = urlParams.get('customer_name');

        if (week_number) {
            frappe.web_form.set_value('week_number', week_number);
        }
        if (customer_name) {
            frappe.web_form.set_value('customer_name', customer_name);
        }
    }
    console.log("Fields list:", frappe.web_form.fields.map(f => f.df.fieldname));

}, 100);

// URL test: https://coba.homeautomator.id/weekly-catering-form?week_number=40&customer_name=Jason


https://coba.homeautomator.id/weekly-catering-form/new?
week_number=40&
customer=Jason&
contact=Jason-Jason&
address=Jason-Shipping&
default_order_type=Kids&
default_addon_telur=1&
default_addon_buah=1&
default_addon_juice=1&
default_addon_extra_size=1
*/

