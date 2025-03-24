#!/bin/bash

# Test data generation and import script
# Usage: ./setupTestData.sh [event_count]

# Set default values
NUM_EVENTS=${1:-20}
OUTPUT_FILE="testEvents.json"

# Display current and script directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "Script directory: $SCRIPT_DIR"
echo "Current directory: $(pwd)"

echo "===== Starting Test Data Setup ====="
echo "Generating $NUM_EVENTS events and related donors..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found, please install Node.js before running this script"
    exit 1
fi

# Check if script files exist
if [ ! -f "$SCRIPT_DIR/generateTestEvents.js" ]; then
    echo "Error: generateTestEvents.js file not found"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/importTestEvents.js" ]; then
    echo "Error: importTestEvents.js file not found"
    exit 1
fi

# Ensure scripts have execution permissions
chmod +x "$SCRIPT_DIR/generateTestEvents.js"
chmod +x "$SCRIPT_DIR/importTestEvents.js"

# Step 1: Generate test data
echo "Step 1: Generating test data..."
node "$SCRIPT_DIR/generateTestEvents.js" $NUM_EVENTS > "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Failed to generate test data"
    exit 1
fi

echo "Test data generated and saved to $OUTPUT_FILE"

# Step 2: Import test data to database
echo "Step 2: Importing test data to database..."
echo "Warning: This will add new data to the database. Make sure you are connected to the correct database environment (development/test)."
read -p "Continue with importing data? (y/n): " -n 1 -r
echo    # New line

if [[ $REPLY =~ ^[Yy]$ ]]; then
    node "$SCRIPT_DIR/importTestEvents.js" "$OUTPUT_FILE"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to import test data"
        exit 1
    fi
    
    echo "Data import completed!"
else
    echo "Data import skipped. To import manually, run:"
    echo "node $SCRIPT_DIR/importTestEvents.js $OUTPUT_FILE"
fi

echo "===== Test Data Setup Completed ====="

# Ask whether to keep the generated JSON file
read -p "Keep the generated JSON file $OUTPUT_FILE? (y/n): " -n 1 -r
echo    # New line

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    rm "$OUTPUT_FILE"
    echo "Deleted $OUTPUT_FILE"
else
    echo "Kept $OUTPUT_FILE"
fi 