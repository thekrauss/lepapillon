package wmail

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const TypeMailSend = "mail:send"

func NewMailSendTask(to []string, subject, template string, vars map[string]string) (*asynq.Task, error) {
	payload, err := json.Marshal(MailTaskPayload{
		To:        to,
		Subject:   subject,
		Template:  template,
		Variables: vars,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal mail payload: %w", err)
	}
	return asynq.NewTask(TypeMailSend, payload, asynq.Queue("default")), nil
}

func NewWelcomeEmailTask(email, name, baseURL string) (*asynq.Task, error) {
	vars := map[string]string{
		"Name": name,
		"URL":  baseURL,
	}
	return NewMailSendTask([]string{email}, "Bienvenue sur LePapillon", "welcome.html", vars)
}

func NewOrderConfirmationTask(email, orderID, amount, pickupCode string) (*asynq.Task, error) {
	vars := map[string]string{
		"OrderID":    orderID,
		"Amount":     amount,
		"PickupCode": pickupCode,
	}
	return NewMailSendTask([]string{email}, "Confirmation de commande", "order_conf.html", vars)
}

func NewPrestationReminderTask(email, name, date, timeSlot, address string) (*asynq.Task, error) {
	vars := map[string]string{
		"Name":     name,
		"Date":     date,
		"TimeSlot": timeSlot,
		"Address":  address,
	}
	return NewMailSendTask([]string{email}, "Rappel - Prestation demain", "prestation_reminder.html", vars)
}

func NewOrderReadyTask(email, orderID, pickupCode string) (*asynq.Task, error) {
	vars := map[string]string{
		"OrderID":    orderID,
		"PickupCode": pickupCode,
	}
	return NewMailSendTask([]string{email}, "Votre commande est prête !", "order_ready.html", vars)
}
