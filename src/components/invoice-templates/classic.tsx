
'use client';
import type { InvoiceData } from '@/lib/sample-data';

export default function ClassicTemplate({ invoiceData }: { invoiceData: InvoiceData }) {
  const {
    orderId,
    invoiceDate,
    dueDate,
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
    <div className="bg-green-50 p-8 rounded-lg max-w-4xl mx-auto text-sm text-black font-sans shadow-lg border border-green-200">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-700">INVOICE</h1>
          <div className="mt-6">
            <h2 className="font-bold text-gray-600 mb-1">BILLED TO</h2>
            <p className="font-semibold">{clientName}</p>
            <p>{clientAddress}</p>
            <p>{clientPhone}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-bold text-xl mb-2">{companyName}</h2>
          <p>{companyAddress}</p>
          <p>{companyPhone}</p>
          <div className="mt-6 text-left p-3 rounded-md bg-white border border-gray-200">
            <h2 className="font-bold text-gray-600 mb-2">Invoice Details</h2>
            <p className="flex justify-between"><span className="font-semibold">Order ID:</span> <span>{orderId}</span></p>
            <p className="flex justify-between"><span className="font-semibold">Invoice Date:</span> <span>{invoiceDate}</span></p>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-left mb-8">
        <thead className="bg-green-600 text-white">
          <tr>
            <th className="p-3 font-semibold">Item Description</th>
            <th className="p-3 font-semibold text-center">Qty</th>
            <th className="p-3 font-semibold text-right">Rate</th>
            <th className="p-3 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-green-200 bg-white">
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
            <div className="flex justify-between text-xl font-bold text-green-700">
                <span>Total Due:</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
        </div>
      </div>

      <p className="text-center text-gray-500 text-xs mt-10">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  );
}
