#!/usr/bin/env python3
"""
⭐⭐⭐ MBBank Checker Status Monitor
Monitor the status and health of the MBBank transaction checker
"""

import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List

def read_log_file(log_file: str = 'mbbank_real_checker.log', lines: int = 50) -> List[str]:
    """Read last N lines from log file"""
    try:
        if not os.path.exists(log_file):
            return ["Log file not found"]
        
        with open(log_file, 'r', encoding='utf-8') as f:
            return f.readlines()[-lines:]
    except Exception as e:
        return [f"Error reading log: {e}"]

def read_processed_transactions() -> Dict:
    """Read processed transactions data"""
    try:
        if os.path.exists('processed_transactions.json'):
            with open('processed_transactions.json', 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        return {"error": str(e)}

def check_checker_health() -> Dict:
    """Check overall health of the checker"""
    health = {
        "status": "unknown",
        "last_activity": None,
        "processed_count": 0,
        "issues": []
    }
    
    # Check log for recent activity
    log_lines = read_log_file(lines=100)
    recent_logs = [line for line in log_lines if line.strip()]
    
    if recent_logs:
        # Parse last log entry timestamp
        try:
            last_line = recent_logs[-1]
            if ' - ' in last_line:
                timestamp_str = last_line.split(' - ')[0]
                health["last_activity"] = timestamp_str
                
                # Check if last activity was recent (within 10 minutes)
                last_time = datetime.fromisoformat(timestamp_str.replace(',', '.'))
                if datetime.now() - last_time < timedelta(minutes=10):
                    health["status"] = "running"
                else:
                    health["status"] = "stale"
                    health["issues"].append("No recent activity detected")
        except Exception as e:
            health["issues"].append(f"Error parsing log timestamp: {e}")
    
    # Check processed transactions
    proc_data = read_processed_transactions()
    if proc_data and 'total_processed' in proc_data:
        health["processed_count"] = proc_data["total_processed"]
    
    # Check for errors in recent logs
    error_count = sum(1 for line in recent_logs if '❌' in line or 'ERROR' in line)
    if error_count > 0:
        health["issues"].append(f"{error_count} errors found in recent logs")
    
    # Check for login failures
    login_failures = sum(1 for line in recent_logs if 'login failed' in line.lower())
    if login_failures > 0:
        health["issues"].append(f"{login_failures} login failures detected")
    
    return health

def print_status_report():
    """Print comprehensive status report"""
    print("🏥 MBBank Checker Health Report")
    print("=" * 50)
    
    # Health check
    health = check_checker_health()
    
    status_emoji = {
        "running": "✅",
        "stale": "⚠️",
        "unknown": "❓"
    }
    
    print(f"\n📊 Overall Status: {status_emoji.get(health['status'], '❓')} {health['status'].upper()}")
    
    if health['last_activity']:
        print(f"🕒 Last Activity: {health['last_activity']}")
    
    print(f"📈 Processed Transactions: {health['processed_count']}")
    
    if health['issues']:
        print(f"\n⚠️ Issues Found ({len(health['issues'])}):")
        for i, issue in enumerate(health['issues'], 1):
            print(f"   {i}. {issue}")
    else:
        print("\n✅ No issues detected")
    
    # Recent logs
    print(f"\n📋 Recent Log Entries:")
    print("-" * 30)
    recent_logs = read_log_file(lines=10)
    for line in recent_logs[-10:]:
        if line.strip():
            print(f"   {line.strip()}")
    
    # Processed transactions summary
    proc_data = read_processed_transactions()
    if proc_data and 'last_updated' in proc_data:
        print(f"\n💾 Processed Transactions File:")
        print(f"   Last Updated: {proc_data['last_updated']}")
        print(f"   Total Count: {proc_data.get('total_processed', 0)}")
    
    # Configuration check
    print(f"\n⚙️ Configuration:")
    env_file = ".env.mbbank"
    if os.path.exists(env_file):
        print(f"   ✅ Environment file exists: {env_file}")
    else:
        print(f"   ❌ Environment file missing: {env_file}")
    
    # File sizes
    files_to_check = [
        'mbbank_real_checker.log',
        'processed_transactions.json',
        '.env.mbbank'
    ]
    
    print(f"\n📁 File Status:")
    for file_name in files_to_check:
        if os.path.exists(file_name):
            size = os.path.getsize(file_name)
            size_str = f"{size:,} bytes" if size < 1024 else f"{size/1024:.1f} KB"
            print(f"   ✅ {file_name}: {size_str}")
        else:
            print(f"   ❌ {file_name}: Not found")

def tail_logs(lines: int = 20):
    """Show recent log entries"""
    print(f"📋 Last {lines} log entries:")
    print("=" * 50)
    
    log_lines = read_log_file(lines=lines)
    for line in log_lines:
        if line.strip():
            print(line.strip())

def show_processed_transactions():
    """Show processed transactions details"""
    proc_data = read_processed_transactions()
    
    if not proc_data:
        print("📝 No processed transactions found")
        return
    
    print("📝 Processed Transactions Summary:")
    print("=" * 50)
    
    if 'total_processed' in proc_data:
        print(f"Total Processed: {proc_data['total_processed']}")
    
    if 'last_updated' in proc_data:
        print(f"Last Updated: {proc_data['last_updated']}")
    
    if 'transactions' in proc_data:
        transactions = proc_data['transactions']
        print(f"\nTransaction IDs ({len(transactions)}):")
        for i, txn_id in enumerate(transactions[-10:], 1):  # Show last 10
            print(f"   {i}. {txn_id}")
        
        if len(transactions) > 10:
            print(f"   ... and {len(transactions) - 10} more")

def main():
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "status":
            print_status_report()
        elif command == "logs":
            lines = int(sys.argv[2]) if len(sys.argv) > 2 else 20
            tail_logs(lines)
        elif command == "transactions":
            show_processed_transactions()
        elif command == "health":
            health = check_checker_health()
            print(json.dumps(health, indent=2))
        else:
            print("❌ Unknown command. Available: status, logs, transactions, health")
    else:
        print_status_report()

if __name__ == "__main__":
    main()
