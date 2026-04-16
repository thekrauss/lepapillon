package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"time"
)

type MailEvent struct {
	To        string            `json:"to"`
	Subject   string            `json:"subject"`
	Template  string            `json:"template"`
	Variables map[string]string `json:"variables"`
}

type MailPublisher struct {
	pubsub EventPublisher
	topic  string
}

type EventPublisher interface {
	Publish(ctx context.Context, topic string, payload []byte) error
}

func NewMailPublisher(ps EventPublisher, topic string) *MailPublisher {
	return &MailPublisher{pubsub: ps, topic: topic}
}

func (p *MailPublisher) SendAsync(to, subject, template string, vars map[string]string) {
	if p == nil || p.pubsub == nil || strings.TrimSpace(p.topic) == "" {
		return
	}

	event := MailEvent{
		To:        to,
		Subject:   subject,
		Template:  template,
		Variables: vars,
	}
	data, err := json.Marshal(event)
	if err != nil {
		slog.Error("mail publish marshal failed", "error", err, "to", to, "template", template)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := p.pubsub.Publish(ctx, p.topic, data); err != nil {
		slog.Error("mail publish failed", "error", err, "to", to, "template", template)
	}
}
