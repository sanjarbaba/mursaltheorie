Add-Type -AssemblyName System.Drawing
$folder=Join-Path $PSScriptRoot '../images'
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object MimeType -eq 'image/jpeg'
$settings=[System.Drawing.Imaging.EncoderParameters]::new(1)
$settings.Param[0]=[System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]82)
foreach($item in @(@{source='mursal-theorie-hoofdfoto.jpeg';name='mursal-theorie-hoofdfoto-optimized.jpg';width=1024},@{source='mursal-theorie-hoofdfoto.jpeg';name='mursal-theorie-hoofdfoto-mobile.jpg';width=640},@{source='mursal-logo.jpg';name='mursal-logo-optimized.jpg';width=296})){
 $source=[System.Drawing.Image]::FromFile((Join-Path $folder $item.source))
 $width=[Math]::Min($source.Width,$item.width)
 $height=[int][Math]::Round($source.Height*$width/$source.Width)
 $bitmap=[System.Drawing.Bitmap]::new($width,$height)
 $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
 $graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 try{$graphics.DrawImage($source,0,0,$width,$height);$bitmap.Save((Join-Path $folder $item.name),$codec,$settings);Write-Output "$($item.name) $width x $height"}finally{$graphics.Dispose();$bitmap.Dispose();$source.Dispose()}
}
$settings.Dispose()
Get-ChildItem -LiteralPath $folder -Filter '*optimized.jpg' | Select-Object Name,Length
