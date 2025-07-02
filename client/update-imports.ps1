# PowerShell script để update tất cả import useAuth
$clientPath = "c:\Users\ADMIN\Documents\GitHub\Backend_SWP\client\src"

# Danh sách các file cần update
$files = @(
    "page\EmailVerification.jsx",
    "page\coach\CoachDashboard.jsx", 
    "page\coach\CoachBookings.jsx",
    "page\BookAppointment.jsx",
    "page\Blog.jsx",
    "page\AccessDenied.jsx",
    "components\AuthDebugger.jsx",
    "components\AppointmentList_broken.jsx",
    "components\AppointmentList.jsx",
    "components\ApiTestComponent.jsx",
    "page\MembershipPackage.jsx",
    "page\Notification.jsx",
    "components\CoachLayout.jsx",
    "components\CoachRedirect.jsx",
    "page\Pay.jsx",
    "page\PaymentSuccess.jsx",
    "page\Progress.jsx",
    "components\CommunityPost.jsx"
)

Write-Host "🔄 Updating useAuth imports..." -ForegroundColor Yellow

foreach ($file in $files) {
    $fullPath = Join-Path $clientPath $file
    if (Test-Path $fullPath) {
        try {
            # Đọc nội dung file
            $content = Get-Content $fullPath -Raw
            
            # Thay thế import cũ bằng import mới
            $updatedContent = $content -replace "import \{ useAuth \} from ['\`"]\.\.\/context\/AuthContext['\`"];?", "import { useAuth } from '../hooks/useAuth.js';"
            $updatedContent = $updatedContent -replace "import \{ useAuth \} from ['\`"]\.\.\/\.\.\/context\/AuthContext['\`"];?", "import { useAuth } from '../../hooks/useAuth.js';"
            
            # Ghi lại file nếu có thay đổi
            if ($content -ne $updatedContent) {
                Set-Content $fullPath -Value $updatedContent -NoNewline
                Write-Host "✅ Updated: $file" -ForegroundColor Green
            }
            else {
                Write-Host "⏭️  Skipped: $file (no changes needed)" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "❌ Failed: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Orange
    }
}

Write-Host "`n🎉 Import updates completed!" -ForegroundColor Green
