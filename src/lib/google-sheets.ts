import * as XLSX from "xlsx";

export interface GoogleSheetsSyncPayload {
  organizationName: string;
  syncedAt: string;
  fabrics: Array<{
    sku: string;
    name: string;
    category: string;
    mill: string;
    unit: string;
    purchaseCost: number;
    sellingPrice: number;
    marginPercent: string;
    minimumStock: number;
    description: string;
  }>;
  stock: Array<{
    sku: string;
    fabricName: string;
    storeName: string;
    quantityMeters: number;
    averageCost: number;
    totalValue: number;
  }>;
  sales: Array<{
    invoiceNumber: string;
    saleDate: string;
    customer: string;
    channel: string;
    subtotal: number;
    discount: number;
    grandTotal: number;
    paidAmount: number;
    status: string;
  }>;
  customers: Array<{
    name: string;
    phone: string;
    email: string;
    address: string;
    creditLimit: number;
  }>;
  suppliers: Array<{
    name: string;
    phone: string;
    email: string;
    address: string;
    paymentTerms: number;
  }>;
}

/**
 * Generates an Excel (.xlsx) buffer with 5 formatted tabs that opens seamlessly
 * in Google Sheets or Microsoft Excel.
 */
export function generateGoogleSheetsWorkbook(data: GoogleSheetsSyncPayload): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. Fabrics Sheet
  const fabricsRows = data.fabrics.map((f) => ({
    "SKU Code": f.sku,
    "Fabric Name": f.name,
    "Category": f.category,
    "Mill / Brand": f.mill,
    "Unit": f.unit,
    "Purchase Cost (৳)": f.purchaseCost,
    "Selling Price (৳)": f.sellingPrice,
    "Margin (%)": f.marginPercent,
    "Min Stock Alert": f.minimumStock,
    "Description": f.description,
  }));
  const wsFabrics = XLSX.utils.json_to_sheet(fabricsRows);
  XLSX.utils.book_append_sheet(wb, wsFabrics, "🧵 Fabrics Catalog");

  // 2. Stock Balances Sheet
  const stockRows = data.stock.map((s) => ({
    "SKU": s.sku,
    "Fabric Name": s.fabricName,
    "Branch / Store": s.storeName,
    "In Stock (Meters/Units)": s.quantityMeters,
    "Avg Cost (৳)": s.averageCost,
    "Total Inventory Value (৳)": s.totalValue,
  }));
  const wsStock = XLSX.utils.json_to_sheet(stockRows);
  XLSX.utils.book_append_sheet(wb, wsStock, "📦 Stock Balances");

  // 3. Sales & Cutting Sheet
  const salesRows = data.sales.map((s) => ({
    "Invoice #": s.invoiceNumber,
    "Date": s.saleDate,
    "Customer / Boutique": s.customer,
    "Channel": s.channel,
    "Subtotal (৳)": s.subtotal,
    "Discount (৳)": s.discount,
    "Grand Total (৳)": s.grandTotal,
    "Paid Amount (৳)": s.paidAmount,
    "Status": s.status,
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, "🧾 Sales & Invoices");

  // 4. Customers Sheet
  const customerRows = data.customers.map((c) => ({
    "Customer / Boutique Name": c.name,
    "Phone Number": c.phone,
    "Email": c.email,
    "Address / Market": c.address,
    "Credit Limit (৳)": c.creditLimit,
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
  XLSX.utils.book_append_sheet(wb, wsCustomers, "👥 Boutiques & Tailors");

  // 5. Suppliers Sheet
  const supplierRows = data.suppliers.map((sp) => ({
    "Textile Mill / Supplier": sp.name,
    "Phone Number": sp.phone,
    "Email": sp.email,
    "Mill Address": sp.address,
    "Payment Terms (Days)": sp.paymentTerms,
  }));
  const wsSuppliers = XLSX.utils.json_to_sheet(supplierRows);
  XLSX.utils.book_append_sheet(wb, wsSuppliers, "🏭 Textile Mills");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Ready-to-deploy Google Apps Script code for the user's Google Sheet.
 * Allows instant 2-way sync without needing Google Cloud Console or OAuth!
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * FabricPro — Real-Time Google Sheets Storage & Sync Engine
 * ============================================================================
 * INSTRUCTIONS:
 * 1. Open your Google Sheet in your free Google Drive (15 GB).
 * 2. Click Extensions > Apps Script in the top menu.
 * 3. Delete any code in the editor, and paste this entire code.
 * 4. Click "Deploy" (top right) > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "FabricPro Sync".
 * 7. Set "Execute as": "Me".
 * 8. Set "Who has access": "Anyone".
 * 9. Click "Deploy", authorize permissions, and copy the Web App URL!
 * 10. Paste the Web App URL into FabricPro Settings > Google Sheets.
 * ============================================================================
 */

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : null;
    if (!raw) {
      return responseJSON({ status: "error", message: "No data payload received" });
    }
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Full Synchronization of All Fabric Data
    if (data.action === "SYNC_ALL") {
      writeSheet(ss, "🧵 Fabrics", [
        ["SKU", "Fabric Name", "Category", "Mill / Brand", "Unit", "Cost (৳)", "Price (৳)", "Margin (%)", "Min Stock", "Description"]
      ].concat(data.fabrics.map(function(f) {
        return [f.sku, f.name, f.category, f.mill, f.unit, f.purchaseCost, f.sellingPrice, f.marginPercent, f.minimumStock, f.description];
      })));

      writeSheet(ss, "📦 Stock Balances", [
        ["SKU", "Fabric Name", "Store / Branch", "Stock (Meters)", "Avg Cost (৳)", "Inventory Value (৳)"]
      ].concat(data.stock.map(function(s) {
        return [s.sku, s.fabricName, s.storeName, s.quantityMeters, s.averageCost, s.totalValue];
      })));

      writeSheet(ss, "🧾 Sales & Invoices", [
        ["Invoice #", "Sale Date", "Customer / Boutique", "Channel", "Subtotal (৳)", "Discount (৳)", "Grand Total (৳)", "Paid (৳)", "Status"]
      ].concat(data.sales.map(function(sl) {
        return [sl.invoiceNumber, sl.saleDate, sl.customer, sl.channel, sl.subtotal, sl.discount, sl.grandTotal, sl.paidAmount, sl.status];
      })));

      writeSheet(ss, "👥 Boutiques & Tailors", [
        ["Name", "Phone", "Email", "Address", "Credit Limit (৳)"]
      ].concat(data.customers.map(function(c) {
        return [c.name, c.phone, c.email, c.address, c.creditLimit];
      })));

      writeSheet(ss, "🏭 Textile Mills", [
        ["Mill / Supplier", "Phone", "Email", "Address", "Terms (Days)"]
      ].concat(data.suppliers.map(function(sp) {
        return [sp.name, sp.phone, sp.email, sp.address, sp.paymentTerms];
      })));

      return responseJSON({
        status: "success",
        message: "Successfully synchronized " + data.fabrics.length + " fabrics, " + data.sales.length + " sales to Google Sheets!",
        syncedAt: new Date().toISOString()
      });
    }

    // Append a single new Sale / Fabric Cut in real time
    if (data.action === "APPEND_SALE") {
      var sale = data.sale;
      var sheet = getOrCreateSheet(ss, "🧾 Sales & Invoices");
      sheet.appendRow([
        sale.invoiceNumber,
        sale.saleDate || new Date().toISOString(),
        sale.customer,
        sale.channel || "POS",
        sale.subtotal,
        sale.discount || 0,
        sale.grandTotal,
        sale.paidAmount,
        sale.status || "COMPLETED"
      ]);
      return responseJSON({ status: "success", message: "Sale appended to Google Sheet" });
    }

    return responseJSON({ status: "error", message: "Unknown action: " + data.action });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("🧵 Fabrics");
    if (!sheet) {
      return responseJSON({ status: "success", fabrics: [], message: "No Fabrics sheet found yet" });
    }
    var rows = sheet.getDataRange().getValues();
    var fabrics = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] && r[1]) {
        fabrics.push({
          sku: String(r[0]),
          name: String(r[1]),
          category: String(r[2] || ""),
          mill: String(r[3] || ""),
          unit: String(r[4] || "m"),
          purchaseCost: Number(r[5] || 0),
          sellingPrice: Number(r[6] || 0),
          minimumStock: Number(r[8] || 10),
          description: String(r[9] || "")
        });
      }
    }
    return responseJSON({
      status: "success",
      count: fabrics.length,
      fabrics: fabrics
    });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function writeSheet(ss, name, rows) {
  var sheet = getOrCreateSheet(ss, name);
  sheet.clear();
  if (rows && rows.length > 0) {
    var range = sheet.getRange(1, 1, rows.length, rows[0].length);
    range.setValues(rows);

    // Format Header Row
    var header = sheet.getRange(1, 1, 1, rows[0].length);
    header.setBackground("#1E3A8A");
    header.setFontColor("#FFFFFF");
    header.setFontWeight("bold");
    sheet.setFrozenRows(1);

    // Auto-fit column widths
    for (var c = 1; c <= rows[0].length; c++) {
      sheet.autoResizeColumn(c);
    }
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
