#!/bin/bash
# Quick server health check script

echo "🔍 Testing NoSmoke Backend Health..."
echo "=================================="
echo

# Test if server is running
echo "1. Testing server health endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:5000/health)
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    echo "✅ Server is running and healthy"
    echo "Response: ${response%???}"
else
    echo "❌ Server health check failed (HTTP: $http_code)"
    echo "Make sure server is running on port 5000"
    exit 1
fi

echo
echo "2. Testing CORS headers..."
cors_response=$(curl -s -I -H "Origin: http://localhost:5173" http://localhost:5000/health)
if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
else
    echo "⚠️ CORS headers missing"
fi

echo
echo "3. Testing API routes..."
routes=("/api/packages" "/api/achievements" "/api/coaches")

for route in "${routes[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000$route")
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
        echo "✅ Route $route accessible"
    else
        echo "❌ Route $route failed (HTTP: $status)"
    fi
done

echo
echo "4. Testing auth endpoints..."
# Test registration endpoint (should return validation error)
reg_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/register)
if [ "$reg_status" = "400" ] || [ "$reg_status" = "422" ]; then
    echo "✅ Registration endpoint responding"
else
    echo "❌ Registration endpoint issue (HTTP: $reg_status)"
fi

echo
echo "✅ Basic health check completed!"
