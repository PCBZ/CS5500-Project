#!/usr/bin/env python3
"""
Seed script: generates Users, Donors, and Events via the API.
Usage:
    python seed_data.py                          # targets localhost:3000
    API_URL=https://cs5500-project.onrender.com python seed_data.py
"""

import os
import json
import random
import requests
from datetime import datetime, timedelta

API_URL = os.environ.get("API_URL", "http://localhost:3000")

# ── helpers ──────────────────────────────────────────────────────────────────

def post(path, payload, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.post(f"{API_URL}{path}", json=payload, headers=headers)
    r.raise_for_status()
    return r.json()

def future_date(days_from_now):
    return (datetime.utcnow() + timedelta(days=days_from_now)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

# ── seed data ─────────────────────────────────────────────────────────────────

USERS = [
    {"name": "Alice Chen",    "email": "alice@example.com",   "password": "Password123!", "role": "pmm"},
    {"name": "Bob Nguyen",    "email": "bob@example.com",     "password": "Password123!", "role": "smm"},
    {"name": "Carol Davis",   "email": "carol@example.com",   "password": "Password123!", "role": "vmm"},
    {"name": "David Kim",     "email": "david@example.com",   "password": "Password123!", "role": "pmm"},
    {"name": "Emma Wilson",   "email": "emma@example.com",    "password": "Password123!", "role": "smm"},
]

FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
               "William", "Barbara", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah"]
LAST_NAMES  = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
               "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor"]
CITIES      = ["Vancouver", "Toronto", "Calgary", "Ottawa", "Edmonton", "Montreal", "Winnipeg", "Halifax"]
APPEALS     = ["Annual Fund", "Major Gift", "Planned Giving", "Capital Campaign", "Emergency Fund"]
TAGS_POOL   = ["VIP", "Board Member", "Alumni", "Corporate", "Foundation", "Recurring", "Lapsed"]

EVENT_TYPES = ["Major Donor Event", "Annual Gala", "Golf Tournament", "Luncheon", "Stewardship Dinner"]
LOCATIONS   = ["Vancouver", "Toronto", "Calgary", "Ottawa", "Montreal"]
FOCUSES     = ["Healthcare", "Education", "Arts", "Community", "Research"]

def make_donor(i):
    first = random.choice(FIRST_NAMES)
    last  = random.choice(LAST_NAMES)
    total = round(random.uniform(500, 500_000), 2)
    largest = round(total * random.uniform(0.1, 0.6), 2)
    last_amt = round(random.uniform(100, largest), 2)

    base_date = datetime(2010, 1, 1) + timedelta(days=random.randint(0, 4000))
    last_date = base_date + timedelta(days=random.randint(0, 2000))

    return {
        "firstName":              first,
        "lastName":               last,
        "nickName":               first[:3],
        "organizationName":       f"{last} Foundation" if random.random() < 0.2 else None,
        "pmm":                    random.choice(["Alice Chen", "David Kim", None]),
        "smm":                    random.choice(["Bob Nguyen", "Emma Wilson", None]),
        "vmm":                    random.choice(["Carol Davis", None]),
        "excluded":               False,
        "deceased":               False,
        "totalDonations":         total,
        "totalPledges":           round(total * random.uniform(0, 0.5), 2),
        "largestGift":            largest,
        "largestGiftAppeal":      random.choice(APPEALS),
        "firstGiftDate":          base_date.strftime("%Y-%m-%dT00:00:00.000Z"),
        "lastGiftDate":           last_date.strftime("%Y-%m-%dT00:00:00.000Z"),
        "lastGiftAmount":         last_amt,
        "lastGiftRequest":        random.choice(APPEALS),
        "lastGiftAppeal":         random.choice(APPEALS),
        "addressLine1":           f"{random.randint(100,9999)} Main St",
        "city":                   random.choice(CITIES),
        "communicationPreference": random.choice(["Email", "Phone", "Mail"]),
        "tags":                   ", ".join(random.sample(TAGS_POOL, k=random.randint(0, 3))),
    }

def make_event(i, creator_id):
    days = random.randint(30, 365)
    return {
        "name":                      f"{random.choice(FOCUSES)} {random.choice(EVENT_TYPES)} {2025 + i // 5}",
        "type":                      random.choice(EVENT_TYPES),
        "date":                      future_date(days),
        "location":                  random.choice(LOCATIONS),
        "capacity":                  random.randint(20, 300),
        "focus":                     random.choice(FOCUSES),
        "criteriaMinGivingLevel":    random.choice([0, 1000, 5000, 10000, 25000]),
        "timelineListGenerationDate": future_date(days - 60),
        "timelineReviewDeadline":    future_date(days - 30),
        "timelineInvitationDate":    future_date(days - 14),
    }

# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== Seeding database ===\n")

    # 1. Register users
    print("Creating users...")
    tokens = {}
    for u in USERS:
        try:
            post("/api/user/register", u)
            print(f"  ✓ Registered {u['email']}")
        except requests.HTTPError as e:
            if "already exists" in e.response.text:
                print(f"  - {u['email']} already exists, skipping")
            else:
                print(f"  ✗ {u['email']}: {e.response.text}")

    # Login first user to get token
    login_resp = post("/api/user/login", {"email": USERS[0]["email"], "password": USERS[0]["password"]})
    token = login_resp["token"]
    print(f"\nLogged in as {USERS[0]['email']}\n")

    # 2. Create donors in batches of 50
    NUM_DONORS = 200
    print(f"Creating {NUM_DONORS} donors...")
    donors_data = [make_donor(i) for i in range(NUM_DONORS)]

    # Use import endpoint expects CSV — use individual creates if batch not available
    # Fall back to one-by-one via a helper route; here we use /api/donors/batch
    # which only reads, so we POST individually using any available create route.
    # Check if there's a direct POST /api/donors endpoint first.
    created_donors = 0
    for i, donor in enumerate(donors_data):
        try:
            r = requests.post(
                f"{API_URL}/api/donors",
                json=donor,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            )
            if r.status_code in (200, 201):
                created_donors += 1
            elif r.status_code == 404:
                print("  ✗ POST /api/donors not available — use the CSV import endpoint instead.")
                print("    Run: python seed_data.py --csv  to generate a CSV file for import.")
                break
        except Exception as e:
            print(f"  ✗ donor {i}: {e}")
        if (i + 1) % 50 == 0:
            print(f"  ... {i+1}/{NUM_DONORS}")

    print(f"  ✓ Created {created_donors} donors\n")

    # 3. Create events
    NUM_EVENTS = 10
    print(f"Creating {NUM_EVENTS} events...")
    created_events = 0
    for i in range(NUM_EVENTS):
        try:
            resp = post("/api/events", make_event(i, 1), token=token)
            created_events += 1
            print(f"  ✓ Event: {resp.get('name', resp)}")
        except requests.HTTPError as e:
            print(f"  ✗ event {i}: {e.response.text}")

    print(f"\n=== Done: {len(USERS)} users, {created_donors} donors, {created_events} events ===")

    # ── CSV fallback ──────────────────────────────────────────────────────────
    # If direct donor creation failed, generate a CSV for manual import
    import sys
    if "--csv" in sys.argv or created_donors == 0:
        import csv, pathlib
        out = pathlib.Path(__file__).parent / "seed_donors.csv"
        fieldnames = [
            "First Name", "Nick Name", "Last Name", "Organization Name",
            "PMM", "SMM", "VMM",
            "Total Donations", "Total Pledges", "Largest Gift", "Largest Gift Appeal",
            "First Gift Date", "Last Gift Date", "Last Gift Amount",
            "Last Gift Request", "Last Gift Appeal",
            "Address Line1", "City",
            "Communication Preference", "Tags",
        ]
        with open(out, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            for d in donors_data:
                w.writerow({
                    "First Name": d["firstName"],
                    "Nick Name": d["nickName"],
                    "Last Name": d["lastName"],
                    "Organization Name": d.get("organizationName") or "",
                    "PMM": d.get("pmm") or "",
                    "SMM": d.get("smm") or "",
                    "VMM": d.get("vmm") or "",
                    "Total Donations": d["totalDonations"],
                    "Total Pledges": d["totalPledges"],
                    "Largest Gift": d["largestGift"],
                    "Largest Gift Appeal": d["largestGiftAppeal"],
                    "First Gift Date": d["firstGiftDate"][:10],
                    "Last Gift Date": d["lastGiftDate"][:10],
                    "Last Gift Amount": d["lastGiftAmount"],
                    "Last Gift Request": d["lastGiftRequest"],
                    "Last Gift Appeal": d["lastGiftAppeal"],
                    "Address Line1": d["addressLine1"],
                    "City": d["city"],
                    "Communication Preference": d["communicationPreference"],
                    "Tags": d["tags"],
                })
        print(f"\n✓ CSV written to {out}")
        print("  Upload it via the app's donor import feature or POST /api/donors/import")

if __name__ == "__main__":
    main()
