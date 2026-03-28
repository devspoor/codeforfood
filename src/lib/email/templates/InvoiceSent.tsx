import { Html, Head, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

interface InvoiceSentProps {
  orgName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate?: string;
  invoiceUrl: string;
}

export function InvoiceSent({ orgName, invoiceNumber, totalAmount, dueDate, invoiceUrl }: InvoiceSentProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0a0a0a", fontFamily: "sans-serif", color: "#e5e5e5" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#facc15", marginBottom: "4px" }}>
            {orgName}
          </Text>
          <Text style={{ fontSize: "14px", color: "#a3a3a3", marginTop: "0" }}>New Invoice</Text>
          <Hr style={{ borderColor: "#262626", margin: "20px 0" }} />
          <Text style={{ fontSize: "14px", lineHeight: "1.6" }}>
            Invoice <strong>{invoiceNumber}</strong> has been issued for <strong>{totalAmount}</strong>.
          </Text>
          {dueDate && (
            <Text style={{ fontSize: "14px", color: "#a3a3a3" }}>Due by: {dueDate}</Text>
          )}
          <Section style={{ textAlign: "center" as const, margin: "30px 0" }}>
            <Button
              href={invoiceUrl}
              style={{ backgroundColor: "#facc15", color: "#0a0a0a", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", textDecoration: "none" }}
            >
              View Invoice
            </Button>
          </Section>
          <Hr style={{ borderColor: "#262626", margin: "20px 0" }} />
          <Text style={{ fontSize: "11px", color: "#525252", textAlign: "center" as const }}>Sent via codeforfood</Text>
        </Container>
      </Body>
    </Html>
  );
}
