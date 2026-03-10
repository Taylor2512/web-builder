import type { NodeRenderer } from './types'
import { ErrorFallback } from './ErrorFallback'
import type { DataTableColumn, Node as BuilderNode } from '../../types/schema'

const formatValue = (value: unknown, format: string) => {
  if (format === 'currency' && typeof value === 'number') return `$${value.toFixed(2)}`
  if (format === 'date' && typeof value === 'string') return new Date(value).toLocaleDateString()
  return String(value ?? '')
}

export const dataTableRenderer: NodeRenderer = ({ node, mode }) => {
  const props = (node as Extract<BuilderNode, { type: 'dataTable' }>).props
  const issues: string[] = []
  if (props.columns.length === 0) issues.push('at least one column is required')
  if (props.pageSize < 1) issues.push('pageSize must be greater than 0')
  if (props.source === 'dataSource') {
    if (!props.dataSourceId?.trim()) issues.push('dataSourceId is required for data-driven mode')
    if (!props.dataPath?.trim()) issues.push('dataPath is required for data-driven mode')
  }

  if (issues.length) return { content: <ErrorFallback title='Invalid dataTable props' issues={issues} /> }

  const rows = props.rows
  const searchedRows = rows
  const pageRows = props.pagination ? searchedRows.slice(0, props.pageSize) : searchedRows

  return {
    content: (
      <div style={{ display: 'grid', gap: 8 }}>
        {(props.searchable || props.pagination) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569' }}>
            {props.searchable && <span>Search enabled</span>}
            {props.pagination && <span>Page 1 · size {props.pageSize}</span>}
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: props.dense ? 12 : 13 }}>
          <thead>
            <tr>
              {props.columns.map((col: DataTableColumn) => (
                <th key={col.id} style={{ borderBottom: '1px solid #cbd5e1', textAlign: col.align, padding: 8 }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row: Record<string, unknown>, index: number) => (
              <tr key={index} style={{ background: props.striped && index % 2 === 1 ? '#f8fafc' : 'transparent' }}>
                {props.columns.map((col: DataTableColumn) => (
                  <td key={col.id} style={{ textAlign: col.align, padding: props.dense ? 6 : 8, borderBottom: '1px solid #e2e8f0' }}>
                    {formatValue(row[col.accessor], col.format)}
                  </td>
                ))}
              </tr>
            ))}
            {mode === 'preview' && props.source === 'dataSource' && pageRows.length === 0 && (
              <tr>
                <td colSpan={props.columns.length} style={{ padding: 10, textAlign: 'center', color: '#64748b' }}>
                  Waiting for data source rows…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    ),
  }
}
