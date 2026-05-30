package services

import (
	"fmt"
	"net/url"
)

type WhatsAppTemplate struct {
	DonorName      string
	RequesterName  string
	PatientName    string
	BloodType      string
	Rhesus         string
	Bags           int
	Hospital       string
	Urgency        string
	ContactPhone   string
	RequestLink    string
}

func GenerateWhatsAppLink(phone string, message string) string {
	return fmt.Sprintf("https://wa.me/%s?text=%s", phone, url.QueryEscape(message))
}

func DonorNotificationMessage(t *WhatsAppTemplate) string {
	return fmt.Sprintf(`Halo %s,

Ada permintaan donor darah yang membutuhkan bantuan Anda:

🩸 Pasien: %s
🩸 Golongan Darah: %s %s
🩸 Jumlah: %d kantong
🏥 Rumah Sakit: %s
⚠️ Urgensi: %s

Silakan hubungi pemohon melalui nomor WhatsApp berikut:
%s

Atau lihat detail permintaan:
%s

Terima kasih atas partisipasi Anda!`,
		t.DonorName, t.PatientName, t.BloodType, t.Rhesus, t.Bags,
		t.Hospital, t.Urgency, t.ContactPhone, t.RequestLink)
}

func RequesterShareMessage(t *WhatsAppTemplate) string {
	return fmt.Sprintf(`Halo, saya %s membutuhkan donor darah:

🩸 Pasien: %s
🩸 Golongan Darah: %s %s
🩸 Jumlah: %d kantong
🏥 Rumah Sakit: %s
⚠️ Urgensi: %s

Jika Anda bersedia donor, silakan hubungi:
%s

 atau lihat detail permintaan:
%s

Bantu sebarkan! Terima kasih.`,
		t.RequesterName, t.PatientName, t.BloodType, t.Rhesus, t.Bags,
		t.Hospital, t.Urgency, t.ContactPhone, t.RequestLink)
}
