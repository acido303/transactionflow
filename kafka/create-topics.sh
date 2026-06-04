#!/bin/bash
set -e

KAFKA_BROKER="${KAFKA_BROKER:-kafka:9092}"

echo "Waiting for Kafka at $KAFKA_BROKER ..."
until kafka-topics.sh --bootstrap-server "$KAFKA_BROKER" --list > /dev/null 2>&1; do
  sleep 2
done

echo "Creating Kafka topics..."

kafka-topics.sh --bootstrap-server "$KAFKA_BROKER" \
  --create --if-not-exists \
  --topic transactions.raw \
  --partitions 3 \
  --replication-factor 1

kafka-topics.sh --bootstrap-server "$KAFKA_BROKER" \
  --create --if-not-exists \
  --topic transactions.validated \
  --partitions 3 \
  --replication-factor 1

kafka-topics.sh --bootstrap-server "$KAFKA_BROKER" \
  --create --if-not-exists \
  --topic transactions.rejected \
  --partitions 3 \
  --replication-factor 1

echo "Topics created:"
kafka-topics.sh --bootstrap-server "$KAFKA_BROKER" --list
