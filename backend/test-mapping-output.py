# Quick test - Run this in Django shell
# python manage.py shell

from dashboard.services.mapping_service import MappingService  
from tenants.models import Tenant

print("\n=== Testing MappingService Output ===\n")

tenant = Tenant.objects.get(tenant_uuid='a-cx-d8bf4')
print(f"Tenant: {tenant.name}\n")

stats = MappingService.get_mapping_stats(tenant)

print(f"Return type: {type(stats)}")
print(f"\nFull output:\n{stats}\n")

if isinstance(stats, dict):
    print("Keys available:")
    for key in stats.keys():
        print(f"  - {key}: {stats[key]}")
else:
    print(f"Not a dict, it's: {type(stats)}")

print("\n=== Test Complete ===")
