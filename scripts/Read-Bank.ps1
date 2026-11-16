param([Parameter(Mandatory)][string]$Document)
$ErrorActionPreference = 'Stop'
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Document).Path)
$temp = [IO.Path]::GetTempFileName()
try {
    $reader = [IO.StreamReader]::new($archive.GetEntry('word/document.xml').Open())
    try { [xml]$xml = $reader.ReadToEnd() }
    finally { $reader.Dispose() }
    $namespace = [Xml.XmlNamespaceManager]::new($xml.NameTable)
    $namespace.AddNamespace('w', $xml.DocumentElement.NamespaceURI)
    $rows = foreach ($paragraph in $xml.SelectNodes('//w:body//w:p', $namespace)) {
        $style = $paragraph.SelectSingleNode('./w:pPr/w:pStyle/@w:val', $namespace).Value
        $text = ($paragraph.SelectNodes('.//w:t', $namespace) | ForEach-Object InnerText) -join ''
        if ($text.Trim()) { @{ style = $style; text = $text } }
    }
    ConvertTo-Json -InputObject @($rows) -Depth 4 -Compress | Set-Content -LiteralPath $temp -Encoding utf8
    node (Join-Path $PSScriptRoot 'import-bank.mjs') $temp
    if ($LASTEXITCODE -ne 0) { throw 'Importen mislyktes.' }
} finally {
    $archive.Dispose()
    Remove-Item -LiteralPath $temp
}
