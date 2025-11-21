"""
PR Portal - Feature Verification Test
Run this to verify all new features are properly configured
"""

import json
import os

def check_file_exists(path, description):
    exists = os.path.exists(path)
    status = "✅" if exists else "❌"
    print(f"{status} {description}: {path}")
    return exists

def check_json_structure(path, required_keys, description):
    if not os.path.exists(path):
        print(f"❌ {description}: File not found")
        return False
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        missing = [key for key in required_keys if key not in data]
        if missing:
            print(f"⚠️  {description}: Missing keys: {missing}")
            return False
        else:
            print(f"✅ {description}: All required keys present")
            return True
    except json.JSONDecodeError:
        print(f"❌ {description}: Invalid JSON")
        return False
    except Exception as e:
        print(f"❌ {description}: Error - {e}")
        return False

print("=" * 60)
print("PR PORTAL - FEATURE VERIFICATION")
print("=" * 60)
print()

print("📁 CHECKING FILES...")
print("-" * 60)
check_file_exists("templates/pr_portal_light.html", "PR Portal Template")
check_file_exists("static/js/pr_portal_light.js", "PR Portal JavaScript")
check_file_exists("static/css/admin.css", "Admin CSS")
print()

print("📊 CHECKING DATA STRUCTURES...")
print("-" * 60)
check_json_structure("data/pr_staff.json", ["staff", "stations"], "PR Staff Data")
check_json_structure("data/shift_knowledge.json", [], "Shift Knowledge") # Can be empty initially
check_json_structure("data/doctors.json", ["doctors"], "Doctor Data")
print()

print("🔍 CHECKING PR STAFF STRUCTURE...")
print("-" * 60)
try:
    with open("data/pr_staff.json", 'r', encoding='utf-8') as f:
        pr_data = json.load(f)
    
    staff_count = len(pr_data.get("staff", []))
    print(f"✅ Total staff: {staff_count}")
    
    if staff_count > 0:
        sample = pr_data["staff"][0]
        has_roles = "roles" in sample or "role" in sample
        has_stations = "stations" in sample
        has_active = "active" in sample
        
        print(f"{'✅' if has_roles else '❌'} Staff have roles field")
        print(f"{'✅' if has_stations else '❌'} Staff have stations field")
        print(f"{'✅' if has_active else '❌'} Staff have active field")
        
        clinical_count = sum(1 for s in pr_data["staff"] if "clinical" in (s.get("roles", []) or [s.get("role", "")]))
        front_count = sum(1 for s in pr_data["staff"] if "front" in (s.get("roles", []) or [s.get("role", "")]))
        trainer_count = sum(1 for s in pr_data["staff"] if "trainer" in (s.get("roles", []) or [s.get("role", "")]))
        
        print(f"   🏥 Clinical: {clinical_count}")
        print(f"   🎯 Front Desk: {front_count}")
        print(f"   🎓 Trainers: {trainer_count}")
    
    clinical_stations = len(pr_data.get("stations", {}).get("clinical", []))
    front_stations = len(pr_data.get("stations", {}).get("front", []))
    print(f"✅ Clinical stations: {clinical_stations}")
    print(f"✅ Front desk stations: {front_stations}")
    
except Exception as e:
    print(f"❌ Error reading PR staff: {e}")

print()

print("🤖 CHECKING AI CONFIGURATION...")
print("-" * 60)
try:
    with open("data/shift_knowledge.json", 'r', encoding='utf-8') as f:
        shift_data = json.load(f)
    
    has_pr = "pr" in shift_data
    has_doctor_opd = "doctor_opd" in shift_data
    
    print(f"{'✅' if has_pr else '⚠️ '} PR shift templates: {'Present' if has_pr else 'Not configured yet'}")
    print(f"{'✅' if has_doctor_opd else '⚠️ '} Doctor OPD info: {'Present' if has_doctor_opd else 'Not configured yet'}")
    
    if has_pr:
        pr = shift_data["pr"]
        has_clinical = "clinical" in pr
        has_front = "front" in pr
        print(f"   {'✅' if has_clinical else '❌'} Clinical team templates")
        print(f"   {'✅' if has_front else '❌'} Front desk team templates")
    
except FileNotFoundError:
    print("⚠️  shift_knowledge.json not found (will be created on first save)")
except Exception as e:
    print(f"❌ Error: {e}")

print()

print("📝 CHECKING ROUTE CONFIGURATION...")
print("-" * 60)
try:
    with open("app.py", 'r', encoding='utf-8') as f:
        app_content = f.read()
    
    routes_to_check = [
        ("/pr-portal", "PR Portal route"),
        ("/api/pr/staff", "PR Staff API"),
        ("/api/shift-knowledge", "Shift Knowledge API"),
        ("/api/pr/generate-roster", "AI Roster Generator"),
        ("/api/doctors", "Doctor Schedule API"),
        ("/pr-schedule-fullscreen", "Fullscreen Schedule"),
        ("/pr_schedule_fullscreen", "Fullscreen Schedule (alt)")
    ]
    
    for route, description in routes_to_check:
        exists = route in app_content
        print(f"{'✅' if exists else '❌'} {description}: {route}")
    
except Exception as e:
    print(f"❌ Error checking routes: {e}")

print()
print("=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
print()
print("🚀 TO USE THE NEW FEATURES:")
print("1. Open browser and go to: http://127.0.0.1:5000")
print("2. Login as ADMIN")
print("3. Click 'Open PR Portal'")
print("4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)")
print("5. Check Staff Directory for new filter bar and compact cards")
print("6. Try Add Staff wizard with multiple roles")
print("7. Go to AI Generator and check readiness dashboard")
print("8. Configure Shift Knowledge in AI Configuration tab")
print()
print("📖 Full feature guide: PR_PORTAL_FEATURES.md")
print()
