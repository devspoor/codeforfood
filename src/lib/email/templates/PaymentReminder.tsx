import { Html, Head, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

interface PaymentReminderProps {
  orgName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate?: string;
  isOverdue: boolean;
  invoiceUrl: string;
}

export function PaymentReminder({ orgName, invoiceNumber, totalAmount, dueDate, isOverdue, invoiceUrl }: PaymentReminderProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0a0a0a", fontFamily: "sans-serif", color: "#e5e5e5" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#facc15", marginBottom: "4px" }}>
            {orgName}
          </Text>
          <Text style={{ fontSize: "14px", color: "#a3a3a3", marginTop: "0" }}>
            {isOverdue ? "Overdue Invoice" : "Payment Reminder"}
          </Text>
          <Hr style={{ borderColor: "#262626", margin: "20px 0" }} />
          <Text style={{ fontSize: "14px", lineHeight: "1.6" }}>
            {isOverdue
              ? <>Invoice <strong>{invoiceNumber}</strong> for <strong>{totalAmount}</strong> is overdue.</>
              : <>Friendly reminder: invoice <strong>{invoiceNumber}</strong> for <strong>{totalAmount}</strong> is due{dueDate ? ` on ${dueDate}` : " soon"}.</>
            }
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
