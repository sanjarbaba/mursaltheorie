Add-Type -AssemblyName System.Drawing
$folder=Join-Path $PSScriptRoot '../images/product'
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object MimeType -eq 'image/jpeg'
$settings=[System.Drawing.Imaging.EncoderParameters]::new(1)
$settings.Param[0]=[System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]87)
foreach($name in @('lessons','exam','dashboard')){
 $image=[System.Drawing.Image]::FromFile((Join-Path $folder "$name.png"))
 try{$image.Save((Join-Path $folder "$name.jpg"),$codec,$settings)}finally{$image.Dispose()}
}
$settings.Dispose()
Get-ChildItem -LiteralPath $folder | Select-Object Name,Length
