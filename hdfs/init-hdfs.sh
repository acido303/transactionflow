#!/bin/bash
set -e

NAMENODE="${NAMENODE_URL:-hdfs://hdfs-namenode:9000}"

echo "Waiting for HDFS NameNode at $NAMENODE ..."
until hdfs dfs -ls / > /dev/null 2>&1; do
  echo "HDFS not ready, retrying..."
  sleep 5
done

echo "Creating HDFS directory structure..."

hdfs dfs -mkdir -p /data/transactionflow/raw/transactions
hdfs dfs -mkdir -p /data/transactionflow/rejected/transactions
hdfs dfs -mkdir -p /data/transactionflow/processed/transactions
hdfs dfs -mkdir -p /data/transactionflow/checkpoints

hdfs dfs -chmod -R 777 /data

echo "HDFS directories created:"
hdfs dfs -ls -R /data/transactionflow
