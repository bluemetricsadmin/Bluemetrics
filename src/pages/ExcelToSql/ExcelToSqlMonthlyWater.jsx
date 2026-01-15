import { useState } from 'react';
import { DashboardHeader } from "../../components/dashboard-header"
import { DashboardSidebar } from "../../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { RedirectIfNotAuth } from '../../components/RedirectIfNotAuth'
import * as XLSX from 'xlsx'
import { 
  FileSpreadsheetIcon, 
  DownloadIcon, 
  UploadIcon, 
  DatabaseIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  CopyIcon,
  CalendarIcon
} from 'lucide-react'
import { excelToSqlConfigs } from '../../config/excelToSqlConfigs';

export default function ExcelToSqlMonthlyWater() {
  const [excelData, setExcelData] = useState(null)
  const [sqlOutput, setSqlOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)
  
  // Tipo de tabla a generar
  const [targetTable, setTargetTable] = useState('lecturas') // 'lecturas' o 'consumo'
  
  // Obtener configuración según el tipo seleccionado
  const getConfig = () => {
    return targetTable === 'consumo' 
      ? excelToSqlConfigs.agua_mensual_consumo 
      : excelToSqlConfigs.agua_mensual_lecturas;
  }

  // Procesar archivo Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)
    setSqlOutput('')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (!jsonData || jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío')
      }

      console.log('📊 Datos del Excel:', jsonData)
      setExcelData(jsonData)
      
      // Generar SQL automáticamente
      generateSql(jsonData)
      
      setSuccess(`✅ Archivo procesado: ${jsonData.length} registros encontrados`)
    } catch (err) {
      console.error('❌ Error al procesar Excel:', err)
      setError(err.message || 'Error al procesar el archivo Excel')
    } finally {
      setLoading(false)
    }
  }

  // Generar SQL INSERT
  const generateSql = (data) => {
    const config = getConfig()
    const tableName = config.nombreTabla
    
    let sql = `-- ============================================================\n`
    sql += `-- ${config.titulo}\n`
    sql += `-- Generado automáticamente desde Excel\n`
    sql += `-- Tabla: ${tableName}\n`
    sql += `-- Registros: ${data.length}\n`
    sql += `-- ============================================================\n\n`

    data.forEach((row, index) => {
      const columns = []
      const values = []

      // Procesar cada campo de la configuración
      config.campos.forEach(campo => {
        const campoLower = campo.toLowerCase()
        
        // Buscar el valor en la fila (case insensitive)
        let valor = null
        for (const key of Object.keys(row)) {
          if (key.toLowerCase() === campoLower || key.toLowerCase() === campo.toLowerCase().replace('l_', '')) {
            valor = row[key]
            break
          }
        }

        if (valor !== null && valor !== undefined && valor !== '') {
          columns.push(campoLower)
          
          // Formatear valor según tipo
          if (typeof valor === 'string') {
            values.push(`'${valor.replace(/'/g, "''")}'`)
          } else if (typeof valor === 'number') {
            values.push(valor)
          } else {
            values.push(`'${valor}'`)
          }
        }
      })

      if (columns.length > 0) {
        sql += `-- Registro ${index + 1}: Año ${row.anio || row.Anio || '?'}, Mes ${row.mes || row.Mes || '?'}\n`
        sql += `INSERT INTO ${tableName} (${columns.join(', ')})\n`
        sql += `VALUES (${values.join(', ')});\n\n`
      }
    })

    setSqlOutput(sql)
  }

  // Regenerar SQL cuando cambia el tipo de tabla
  const handleTargetChange = (newTarget) => {
    setTargetTable(newTarget)
    if (excelData) {
      // Regenerar con nueva configuración
      setTimeout(() => {
        const config = newTarget === 'consumo' 
          ? excelToSqlConfigs.agua_mensual_consumo 
          : excelToSqlConfigs.agua_mensual_lecturas;
        
        const tableName = config.nombreTabla
        
        let sql = `-- ============================================================\n`
        sql += `-- ${config.titulo}\n`
        sql += `-- Generado automáticamente desde Excel\n`
        sql += `-- Tabla: ${tableName}\n`
        sql += `-- Registros: ${excelData.length}\n`
        sql += `-- ============================================================\n\n`

        excelData.forEach((row, index) => {
          const columns = []
          const values = []

          config.campos.forEach(campo => {
            const campoLower = campo.toLowerCase()
            
            let valor = null
            for (const key of Object.keys(row)) {
              if (key.toLowerCase() === campoLower || key.toLowerCase() === campo.toLowerCase().replace('l_', '')) {
                valor = row[key]
                break
              }
            }

            if (valor !== null && valor !== undefined && valor !== '') {
              columns.push(campoLower)
              
              if (typeof valor === 'string') {
                values.push(`'${valor.replace(/'/g, "''")}'`)
              } else if (typeof valor === 'number') {
                values.push(valor)
              } else {
                values.push(`'${valor}'`)
              }
            }
          })

          if (columns.length > 0) {
            sql += `-- Registro ${index + 1}: Año ${row.anio || row.Anio || '?'}, Mes ${row.mes || row.Mes || '?'}\n`
            sql += `INSERT INTO ${tableName} (${columns.join(', ')})\n`
            sql += `VALUES (${values.join(', ')});\n\n`
          }
        })

        setSqlOutput(sql)
      }, 0)
    }
  }

  // Copiar SQL al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  // Descargar archivo SQL
  const downloadSql = () => {
    const config = getConfig()
    const blob = new Blob([sqlOutput], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = config.nombreArchivoSql
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Descargar plantilla de Excel
  const downloadTemplate = () => {
    const config = getConfig()
    const templateData = []
    
    // Crear fila de ejemplo para cada mes de un año
    for (let mes = 1; mes <= 12; mes++) {
      const row = { anio: 2026, mes: mes }
      // Agregar columnas de puntos de medición con valor 0
      config.campos.forEach(campo => {
        if (campo !== 'anio' && campo !== 'mes') {
          row[campo] = 0
        }
      })
      templateData.push(row)
    }

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Mensuales')
    
    // Hoja de instrucciones
    const instrucciones = [
      { 'INSTRUCCIONES': `Plantilla para ${config.titulo}` },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📋 INSTRUCCIONES:' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '1. La columna "anio" debe contener el año (ej: 2025, 2026)' },
      { 'INSTRUCCIONES': '2. La columna "mes" debe contener el número del mes (1-12)' },
      { 'INSTRUCCIONES': '3. Las demás columnas son los puntos de medición' },
      { 'INSTRUCCIONES': '4. Complete los valores en m³' },
      { 'INSTRUCCIONES': '5. Cada fila representa un mes' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': `📊 Total de columnas: ${config.campos.length}` }
    ]
    
    const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones')
    
    XLSX.writeFile(wb, `Plantilla_${targetTable === 'consumo' ? 'Consumo' : 'Lecturas'}_Mensual_Agua.xlsx`)
  }

  const config = getConfig()

  return (
    <RedirectIfNotAuth>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  Excel a SQL - Lecturas Mensuales de Agua
                </h1>
              </div>
              <p className="text-muted-foreground">
                Convierte datos de Excel a sentencias SQL INSERT para lecturas o consumo mensual
              </p>
            </div>

            {/* Selector de tipo de tabla */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DatabaseIcon className="h-5 w-5 text-primary" />
                    <span className="font-medium">Generar SQL para tabla de:</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={targetTable === 'lecturas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTargetChange('lecturas')}
                      className={targetTable === 'lecturas' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      <DatabaseIcon className="h-4 w-4 mr-2" />
                      Lecturas
                    </Button>
                    <Button
                      variant={targetTable === 'consumo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTargetChange('consumo')}
                      className={targetTable === 'consumo' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                      Consumo
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tabla destino: <code className="bg-muted px-2 py-1 rounded">{config.nombreTabla}</code>
                </p>
              </CardContent>
            </Card>

            {/* Mensajes de estado */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de carga de Excel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Cargar Archivo Excel</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Sube un archivo Excel con datos mensuales
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={loading}
                      />
                      <Button asChild disabled={loading}>
                        <span>
                          {loading ? (
                            <>
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <UploadIcon className="h-4 w-4 mr-2" />
                              Seleccionar Excel
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {/* Info y plantilla */}
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                          📋 Formato esperado:
                        </p>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                          <li>• Columna <code>anio</code>: Año (2025, 2026...)</li>
                          <li>• Columna <code>mes</code>: Mes (1-12)</li>
                          <li>• Columnas de puntos: l_pozo_11, l_pozo_12...</li>
                          <li>• Cada fila = 1 mes de datos</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <DownloadIcon className="h-4 w-4 mr-1" />
                        Plantilla
                      </Button>
                    </div>
                  </div>

                  {/* Preview de datos */}
                  {excelData && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Vista previa ({excelData.length} registros)</h4>
                      <div className="max-h-48 overflow-auto border rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              <th className="p-2 text-left">Año</th>
                              <th className="p-2 text-left">Mes</th>
                              <th className="p-2 text-left">Columnas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {excelData.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2">{row.anio || row.Anio || '-'}</td>
                                <td className="p-2">{row.mes || row.Mes || '-'}</td>
                                <td className="p-2 text-muted-foreground">
                                  {Object.keys(row).length} cols
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Panel de salida SQL */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DatabaseIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Salida SQL</h3>
                    </div>
                    {sqlOutput && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                        >
                          {copied ? (
                            <>
                              <CheckCircle2Icon className="h-4 w-4 mr-1 text-green-500" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <CopyIcon className="h-4 w-4 mr-1" />
                              Copiar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadSql}
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Descargar .sql
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {sqlOutput ? (
                    <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs max-h-[500px] overflow-auto">
                      <pre className="whitespace-pre-wrap">{sqlOutput}</pre>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <DatabaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Carga un archivo Excel para generar las sentencias SQL
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}
