FROM golang:1.23-alpine AS development
WORKDIR /app
COPY . .
RUN go mod tidy && gofmt -w cmd internal && go build -o /server ./cmd/api
EXPOSE 8080
CMD ["/server"]
