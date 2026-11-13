param([int]$X=-1,[int]$Y=-1,[string]$Image='fenetre.png',[int]$Attente=2000)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public class WG { [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r); [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint f); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow(); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c); [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e); [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y); [DllImport("user32.dll")] public static extern bool GetCursorPos(out PT p); [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, UIntPtr e); public struct RECT { public int L, T, R, B; } public struct PT { public int X, Y; } }
'@
$p = Get-Process NGUIdle -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $p) { "jeu absent"; exit 1 }
for ($k = 0; $k -lt 20 -and $p.MainWindowHandle -eq 0; $k++) { Start-Sleep -Milliseconds 500; $p = Get-Process NGUIdle | Select-Object -First 1 }
$h = $p.MainWindowHandle
$r = New-Object WG+RECT; [void][WG]::GetWindowRect($h, [ref]$r)
if ($X -ge 0) {
  for ($i = 0; $i -lt 12 -and [WG]::GetForegroundWindow() -ne $h; $i++) {
    [WG]::keybd_event(0x12,0,0,[UIntPtr]::Zero); [void][WG]::ShowWindow($h, 9); [void][WG]::SetForegroundWindow($h); [WG]::keybd_event(0x12,0,2,[UIntPtr]::Zero); Start-Sleep -Milliseconds 400
  }
  if ([WG]::GetForegroundWindow() -ne $h) { "CLIC ANNULE : NGU Idle n'est pas au premier plan"; exit 2 }
  $c = New-Object WG+PT; [void][WG]::GetCursorPos([ref]$c)
  [void][WG]::SetCursorPos($r.L + $X, $r.T + $Y); Start-Sleep -Milliseconds 200
  [WG]::mouse_event(2,0,0,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 90; [WG]::mouse_event(4,0,0,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 150
  [void][WG]::SetCursorPos($c.X, $c.Y)
  Start-Sleep -Milliseconds $Attente
}
$w = $r.R - $r.L; $hh = $r.B - $r.T; $bmp = New-Object System.Drawing.Bitmap $w, $hh; $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc(); [void][WG]::PrintWindow($h, $dc, 2); $g.ReleaseHdc($dc)
$bmp.Save((Join-Path $PSScriptRoot $Image)); "fenetre ${w}x${hh} clic $X,$Y"
