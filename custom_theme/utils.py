import frappe

@frappe.whitelist()
def get_active_theme_color():
    color = frappe.db.get_value("Theme Primary Color", {"is_active": 1}, "color_code")
    return color or "#2e86de"
