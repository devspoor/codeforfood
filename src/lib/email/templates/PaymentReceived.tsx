import { Html, Head, Body, Container, Text, Hr } from "@react-email/components";

interface PaymentReceivedProps {
  projectName: string;
  milestoneName: string;
  amountReceived: string;
  remainingBalance: string;
}

export function PaymentReceived({ projectName, milestoneName, amountReceived, remainingBalance }: PaymentReceivedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0a0a0a", fontFamily: "sans-serif", color: "#e5e5e5" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#22c55e", marginBottom: "4px" }}>
            Payment Received
          </Text>
          <Hr style={{ borderColor: "#262626", margin: "20px 0" }} />
          <Text style={{ fontSize: "14px", lineHeight: "1.6" }}>
            A payment of <strong>{amountReceived}</strong> has been received.
          </Text>
          <Text style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: "1.6" }}>
            Milestone: {milestoneName}
          </Text>
          <Text style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: "1.6" }}>
            Project: {projectName}
          </Text>
          <Text style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: "1.6" }}>
            Remaining balance: {remainingBalance}
          </Text>
          <Hr style={{ borderColor: "#262626", margin: "20px 0" }} />
          <Text style={{ fontSize: "11px", color: "#525252", textAlign: "center" as const }}>Sent via codeforfood</Text>
        </Container>
      </Body>
    </Html>
  );
}
