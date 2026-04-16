FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -trimpath -o /app/server ./cmd/server

FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

COPY --from=builder /app/server /server

COPY --from=builder /app/internal/core/config/config.yaml /internal/core/config/config.yaml
COPY --from=builder /app/internal/infras/database/migrations /internal/infras/database/migrations
COPY --from=builder /app/internal/modules/mail/templates /internal/modules/mail/templates

ENV TZ=Europe/Paris
ENV CONFIG_PATH=internal/core/config/config.yaml

EXPOSE 8080

ENTRYPOINT ["/server"]
