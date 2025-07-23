
'use client';
import type { InvoiceData } from '@/lib/sample-data';

export default function ModernTemplate({ invoiceData }: { invoiceData: InvoiceData }) {
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
    <div className="w-full max-w-4xl mx-auto p-8 border rounded-lg bg-white text-black font-sans shadow-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700 mb-2">INVOICE</h1>
          <p className="text-sm text-gray-600">Order ID: {orderId}</p>
          <p className="text-sm text-gray-600">Invoice Date: {invoiceDate}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">{companyName}</h2>
          <p className="text-sm">{companyAddress}</p>
          <p className="text-sm">{companyPhone}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
        <div>
          <h3 className="font-bold text-gray-700 mb-1">BILLED BY</h3>
          <p className="text-sm">{companyName}</p>
          <p className="text-sm">{companyAddress}</p>
          <p className="text-sm">{companyPhone}</p>
        </div>
        <div className="text-right sm:text-left">
          <h3 className="font-bold text-gray-700 mb-1">BILLED TO</h3>
          <p className="text-sm">{clientName}</p>
          <p className="text-sm">{clientAddress}</p>
          <p className="text-sm">{clientPhone}</p>
        </div>
      </div>

      <table className="w-full text-left mb-8">
        <thead className="bg-purple-700 text-white">
          <tr>
            <th className="p-3 font-semibold">Item Description</th>
            <th className="p-3 font-semibold text-center">Qty</th>
            <th className="p-3 font-semibold text-right">Rate</th>
            <th className="p-3 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="p-3">{item.description}</td>
              <td className="p-3 text-center">{item.qty}</td>
              <td className="p-3 text-right">{currencySymbol}{item.rate.toFixed(2)}</td>
              <td className="p-3 text-right">{currencySymbol}{(item.qty * item.rate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-right">
            <div className="flex justify-between">
                <span className="text-gray-600">Sub Total:</span>
                <span className="font-semibold">{currencySymbol}{total.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-600">Tax (0%):</span>
                <span className="font-semibold">{currencySymbol}0.00</span>
            </div>
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between text-xl font-bold text-purple-700">
                <span>Total:</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
        </div>
      </div>
       <div className="mt-12 text-center text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p>Please make payment to the account details mentioned above.</p>
      </div>
    </div>
  );
}
