import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Invoice, InvoiceItem, PaymentMethod } from "@/lib/types";

// Register Inter font with Cyrillic support
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.woff2",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Inter",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  orgName: {
    fontSize: 20,
    fontFamily: "Inter", fontWeight: 700,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Inter", fontWeight: 700,
    color: "#666666",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#666666",
    textAlign: "right",
    marginTop: 4,
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Inter", fontWeight: 700,
  },
  billTo: {
    marginBottom: 30,
  },
  billToLabel: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  billToName: {
    fontSize: 12,
    fontFamily: "Inter", fontWeight: 700,
  },
  billToEmail: {
    fontSize: 10,
    color: "#666666",
    marginTop: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  colDescription: {
    flex: 5,
  },
  colQty: {
    flex: 1.5,
    textAlign: "right",
  },
  colUnitPrice: {
    flex: 2,
    textAlign: "right",
  },
  colAmount: {
    flex: 2,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: "#1a1a1a",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    flex: 8.5,
    textAlign: "right",
    fontSize: 12,
    fontFamily: "Inter", fontWeight: 700,
    paddingRight: 10,
  },
  totalValue: {
    flex: 2,
    textAlign: "right",
    fontSize: 14,
    fontFamily: "Inter", fontWeight: 700,
  },
  paymentSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 10,
    fontFamily: "Inter", fontWeight: 700,
    marginBottom: 8,
    color: "#333333",
  },
  paymentMethod: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  paymentLabel: {
    fontSize: 9,
    fontFamily: "Inter", fontWeight: 700,
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
  },
  paymentValue: {
    fontSize: 9,
    color: "#333333",
    marginTop: 2,
  },
  noteSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  noteLabel: {
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#cccccc",
  },
});

interface Props {
  invoice: Invoice;
  orgName: string;
  paymentMethods: PaymentMethod[];
  formatAmount: (amount: number) => string;
}

export function InvoicePDF({ invoice, orgName, paymentMethods, formatAmount }: Props) {
  const items = (invoice.items || []) as InvoiceItem[];
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{orgName}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.metaSection}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Issued</Text>
            <Text style={styles.metaValue}>
              {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>
              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Bill To */}
        {(invoice.client_name || invoice.client_email) && (
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To</Text>
            {invoice.client_name && <Text style={styles.billToName}>{invoice.client_name}</Text>}
            {invoice.client_email && <Text style={styles.billToEmail}>{invoice.client_email}</Text>}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>

          {/* Rows */}
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{formatAmount(Number(item.unit_price))}</Text>
              <Text style={styles.colAmount}>{formatAmount(Number(item.amount))}</Text>
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatAmount(total)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        {paymentMethods.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Methods</Text>
            {paymentMethods.map((pm) => (
              <View key={pm.id} style={styles.paymentMethod}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.paymentLabel}>{pm.label}</Text>
                  <Text style={styles.paymentType}>{pm.type}</Text>
                </View>
                <Text style={styles.paymentValue}>{pm.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        {invoice.note && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{invoice.note}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Generated by codeforfood</Text>
      </Page>
    </Document>
  );
}
