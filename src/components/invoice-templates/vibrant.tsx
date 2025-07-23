
'use client';
import type { InvoiceData } from '@/lib/sample-data';

export default function VibrantTemplate({ invoiceData }: { invoiceData: InvoiceData }) {
  const {
    orderId,
    invoiceDate,
    companyName,
    companyAddress,
    companyPhone,
    clientName,
    clientAddress,
    clientPhone,
    items,
    currencySymbol,
  } = invoiceData;

  const total = items.reduce((acc, item) => acc + item.qty * item.rate, 0);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg text-black font-sans text-sm border border-orange-200">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-orange-600 mb-2">INVOICE</h1>
           <h2 className="font-bold text-xl mt-1">{companyName}</h2>
          <p className="text-gray-600">{companyAddress}</p>
          <p className="text-gray-600">{companyPhone}</p>
        </div>
        <div className="text-right">
          <p><strong>Order ID:</strong> {orderId}</p>
          <p><strong>Invoice Date:</strong> {invoiceDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <h3 className="font-semibold text-orange-700 mb-2">Billed From</h3>
          <p>{companyName}</p>
          <p>{companyAddress}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <h3 className="font-semibold text-orange-700 mb-2">Billed To</h3>
          <p>{clientName}</p>
          <p>{clientAddress}</p>
          <p>{clientPhone}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-left mb-8">
        <thead className="bg-orange-600 text-white">
          <tr>
            <th className="p-3 font-semibold">Item Description</th>
            <th className="p-3 font-semibold text-center">Qty</th>
            <th className="p-3 font-semibold text-right">Rate</th>
            <th className="p-3 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-orange-100">
              <td className="p-3">{item.description}</td>
              <td className="p-3 text-center">{item.qty}</td>
              <td className="p-3 text-right">{currencySymbol}{item.rate.toFixed(2)}</td>
              <td className="p-3 text-right">{currencySymbol}{(item.qty * item.rate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
         <div className="w-full max-w-xs space-y-2 bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex justify-between">
                <span className="text-gray-600">Sub Total:</span>
                <span className="font-semibold">{currencySymbol}{total.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-600">Tax (0%):</span>
                <span className="font-semibold">{currencySymbol}0.00</span>
            </div>
            <div className="border-t border-orange-200 my-2"></div>
            <div className="flex justify-between text-xl font-bold text-orange-600">
                <span>Total:</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
