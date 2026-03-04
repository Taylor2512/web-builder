param(
  [string]$Root = (Get-Location).Path
)

# Lista de carpetas a crear (relativas a $Root)
$folders = @(
  "src\app",                 # configuración app (providers, routes)
  "src\editor\canvas",       # render del árbol
  "src\editor\blocks",       # librería de bloques (Hero, Button, Section...)
  "src\editor\dnd",          # lógica drag/drop (adapters, sensors)
  "src\editor\inspector",    # panel derecho (props/styles)
  "src\editor\layers",       # árbol de nodos (panel izquierdo)
  "src\editor\state",        # store (selección, árbol, historial)
  "src\editor\utils",        # helpers (id, schema, css)
  "src\editor\types",        # tipos del schema
  "src\shared",              # componentes UI reutilizables
  "src\styles"               # tokens globales
)

Write-Output "Root: $Root"
foreach ($rel in $folders) {
  $full = Join-Path $Root $rel
  if (-not (Test-Path $full)) {
    New-Item -ItemType Directory -Path $full -Force | Out-Null
    # crear .gitkeep para que Git rastree carpetas vacías
    New-Item -Path (Join-Path $full ".gitkeep") -ItemType File -Force | Out-Null
    Write-Output "Creado: $full"
  } else {
    Write-Output "Ya existe: $full"
  }
}

Write-Output "Finalizado."
