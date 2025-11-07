#!/bin/bash
# Script to clear the MongoDB database for DueStack

echo "Clearing DueStack database..."

# Delete the data directory to clear all data
rm -rf /tmp/testdb_*

echo "✅ Database cleared! Restart your backend server."

