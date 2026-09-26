import Button from '../ui/Button.jsx';
import { controlClass } from '../ui/Form.jsx';
import { formatQty, productLabel } from '../../utils/format.js';

let keySeq = 0;
/** New empty line. `key` is a client-only id for React lists. */
export const newLine = (fields = {}) => ({ key: `line-${++keySeq}`, product: '', quantity: '', ...fields });

/**
 * Product lines table from the mockup: Product | Quantity, with "Add a product".
 *   lines:        [{ key, product (id), quantity, ...extra }]
 *   products:     { options, byId } from useProductOptions()
 *   quantityKey:  field edited in the quantity column ("quantity" or "countedQuantity")
 *   extraColumns: [{ header, render(line), align }] shown after quantity
 *   lineErrors:   { [key]: message } per-line error text
 *   rowTone(line):'danger' to highlight a line (e.g. not in stock)
 */
export default function LinesEditor({
  lines,
  onChange,
  products,
  readOnly = false,
  quantityKey = 'quantity',
  quantityLabel = 'Quantity',
  extraColumns = [],
  lineErrors = {},
  rowTone,
  error,
}) {
  const update = (key, patch) => onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const remove = (key) => onChange(lines.filter((l) => l.key !== key));
  const used = new Set(lines.map((l) => l.product));

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-3 py-2 text-left font-medium">Product</th>
              <th className="w-36 px-3 py-2 text-right font-medium">{quantityLabel}</th>
              {extraColumns.map((c) => (
                <th key={c.header} className={`px-3 py-2 font-medium ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {c.header}
                </th>
              ))}
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const product = products.byId[line.product] ?? line.productRef;
              const danger = rowTone?.(line) === 'danger';
              return (
                <tr key={line.key} className={`border-b border-border last:border-b-0 align-top ${danger ? 'bg-danger/10' : ''}`}>
                  <td className="px-3 py-2">
                    {readOnly ? (
                      <span className={danger ? 'text-danger' : 'text-text-strong'}>{productLabel(product)}</span>
                    ) : (
                      <select
                        aria-label="Product"
                        className={controlClass(lineErrors[line.key] && !line.product)}
                        value={line.product}
                        onChange={(e) => update(line.key, { product: e.target.value })}
                      >
                        <option value="">Select a product…</option>
                        {products.options.map((o) => (
                          <option key={o.value} value={o.value} disabled={used.has(o.value) && o.value !== line.product}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {lineErrors[line.key] && <p className="mt-1 text-xs text-danger">{lineErrors[line.key]}</p>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {readOnly ? (
                      <span className={danger ? 'text-danger' : ''}>
                        {formatQty(line[quantityKey])} {product?.uom}
                      </span>
                    ) : (
                      <input
                        aria-label={quantityLabel}
                        type="number"
                        min="0"
                        step="any"
                        className={`${controlClass(false)} text-right`}
                        value={line[quantityKey]}
                        onChange={(e) => update(line.key, { [quantityKey]: e.target.value })}
                      />
                    )}
                  </td>
                  {extraColumns.map((c) => (
                    <td key={c.header} className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : ''}`}>
                      {c.render(line)}
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-1 py-2 text-right">
                      <Button variant="ghost" size="sm" icon="trash" onClick={() => remove(line.key)} aria-label="Remove line" />
                    </td>
                  )}
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={3 + extraColumns.length} className="px-3 py-6 text-center text-sm text-muted">
                  No products added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {!readOnly && (
        <Button variant="ghost" size="sm" icon="plus" className="mt-2 text-accent" onClick={() => onChange([...lines, newLine()])}>
          Add a product
        </Button>
      )}
    </div>
  );
}
