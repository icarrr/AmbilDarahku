export function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  const international = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

export function donorNotificationMessage(
  donorName: string,
  patientName: string,
  hospital: string,
  bloodType: string,
  requestId: string,
  appUrl: string
): string {
  return `Halo ${donorName}, ada permintaan darah ${bloodType} untuk ${patientName} di ${hospital}. Detail: ${appUrl}/requests/share/${requestId}`;
}

export function requesterShareMessage(
  requestId: string,
  patientName: string,
  hospital: string,
  bloodType: string,
  urgency: string,
  appUrl: string
): string {
  const urgencyText = urgency === "critical" ? "🚨 KRITIS" : urgency === "urgent" ? "⚠️ URGENT" : "📋 Normal";
  return `${urgencyText} — Darah ${bloodType} dibutuhkan untuk ${patientName} di ${hospital}. Bantu sebarkan: ${appUrl}/requests/share/${requestId}`;
}
