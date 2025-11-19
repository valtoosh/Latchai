#!/bin/bash
# Quick script to check import progress

echo "=== Rizz Dataset Import Progress ==="
echo ""

if pgrep -f "node scripts/import-rizz-dataset.js" > /dev/null; then
    echo "✅ Import is RUNNING"
    echo ""
    tail -5 /tmp/rizz-import.log
    echo ""
    
    # Check file size
    if [ -f "scripts/rizz-examples.json" ]; then
        SIZE=$(du -h scripts/rizz-examples.json | cut -f1)
        LINES=$(wc -l < scripts/rizz-examples.json)
        echo "Current file: $SIZE ($LINES lines)"
    fi
else
    echo "⏹️  Import is NOT running"
    echo ""
    echo "Last 10 lines of log:"
    tail -10 /tmp/rizz-import.log
    
    if [ -f "scripts/rizz-examples.json" ]; then
        EXAMPLES=$(grep -o '"prompt"' scripts/rizz-examples.json | wc -l)
        SIZE=$(du -h scripts/rizz-examples.json | cut -f1)
        echo ""
        echo "✅ COMPLETED: $EXAMPLES examples imported ($SIZE)"
    fi
fi
