import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrencySoles } from '../data/initialData';
import { Printer, Share2, Copy, Check, X, Phone, MapPin, Calendar, Clock, DollarSign, Store } from 'lucide-react';
import logoImg from '../assets/images/distribuidora_logo_1792434315123.jpg';

export const TicketModal: React.FC = () => {
  const { activeTicketOrder, closeTicketModal, companyConfig } = useApp();
  const [copied, setCopied] = useState(false);

  if (!activeTicketOrder) return null;

  const order = activeTicketOrder;

  // Format date nicely
  const orderDateObj = new Date(order.createdAt);
  const formattedDateTime = `${orderDateObj.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${orderDateObj.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    let msg = `*TICKET DE PEDIDO - ${companyConfig.tradeName}*\n`;
    msg += `📄 *N° Pedido:* ${order.orderNumber}\n`;
    msg += `🗓️ *Fecha:* ${formattedDateTime}\n`;
    msg += `👤 *Preventista:* ${order.sellerName || companyConfig.sellerName}\n`;
    msg += `--------------------------------\n`;
    msg += `🏪 *DATOS DEL CLIENTE:*\n`;
    msg += `• *Código:* ${order.customerCode}\n`;
    msg += `• *Cliente:* ${order.customerName}\n`;
    msg += `• *Titular:* ${order.customerOwner}\n`;
    msg += `• *Doc (${order.customerDocumentType}):* ${order.customerDocumentNumber}\n`;
    msg += `• *Dirección de Entrega:* ${order.customerAddress} (${order.customerDistrict})\n`;
    if (order.customerReference) {
      msg += `• *Ref:* ${order.customerReference}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `📦 *DETALLE DE PRODUCTOS:*\n`;

    order.items.forEach((item, index) => {
      msg += `${index + 1}. [${item.productCode}] ${item.productName}\n`;
      msg += `   Cant: ${item.quantity} ${item.unit} x ${formatCurrencySoles(item.unitPrice)} = *${formatCurrencySoles(item.subtotal)}*\n`;
    });

    msg += `--------------------------------\n`;
    if (order.discount > 0) {
      msg += `Subtotal: ${formatCurrencySoles(order.subtotal)}\n`;
      msg += `Descuento: -${formatCurrencySoles(order.discount)}\n`;
    }
    msg += `💰 *TOTAL A COBRAR EN ENTREGA: ${formatCurrencySoles(order.total)}*\n`;
    msg += `💳 *Método de Pago:* ${order.paymentMethod}\n`;
    if (order.cashChangeFor) {
      const vuelto = Math.max(0, order.cashChangeFor - order.total);
      msg += `💵 *Paga con:* ${formatCurrencySoles(order.cashChangeFor)} (Vuelto: ${formatCurrencySoles(vuelto)})\n`;
    }
    msg += `🚚 *Programación Entrega:* ${order.deliveryDate} - ${order.deliveryTimeSlot}\n`;
    if (order.notes) {
      msg += `📝 *Nota:* ${order.notes}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `${companyConfig.receiptFooterMessage}`;

    return msg;
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppMessage());
    let cleanPhone = order.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 9) {
      cleanPhone = `51${cleanPhone}`;
    }
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const cashChangeAmount = order.cashChangeFor
    ? Math.max(0, order.cashChangeFor - order.total)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Ticket de Venta Generado</h2>
              <p className="text-xs text-slate-300">
                N° {order.orderNumber} · {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={closeTicketModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar ticket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable Receipt View */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 flex justify-center">
          
          {/* Printable Ticket Area */}
          <div
            id="printable-ticket"
            className="w-full max-w-[380px] bg-white p-5 sm:p-6 rounded-xl border border-slate-300/80 shadow-md text-slate-800 font-mono-numbers text-[12px] leading-relaxed"
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-2">
                <img
                  src={logoImg}
                  alt="Distribuidora Logo"
                  className="w-14 h-14 object-contain rounded-md"
                  onError={(e) => {
                    // Fallback to stylized box
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <p className="font-extrabold text-sm tracking-tight uppercase text-slate-900">
                {companyConfig.companyName}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">{companyConfig.tradeName}</p>
              <p className="text-[11px] text-slate-500">RUC: {companyConfig.ruc}</p>
              <p className="text-[10px] text-slate-500">{companyConfig.address}</p>
              <p className="text-[10px] text-slate-500">{companyConfig.city} · Tel: {companyConfig.phone}</p>
              
              <div className="mt-3 pt-2 border-t border-dashed border-slate-200">
                <p className="font-bold text-slate-900 text-[13px]">NOTA DE PEDIDO / PREVENTA</p>
                <p className="font-bold text-emerald-700 text-xs tracking-wider">{order.orderNumber}</p>
                <p className="text-[11px] text-slate-500">{formattedDateTime}</p>
              </div>
            </div>

            {/* Seller & Route Day */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span>Preventista:</span>
                <span className="font-semibold text-slate-800">{order.sellerName || companyConfig.sellerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Ruta Programada:</span>
                <span className="font-bold text-indigo-700 uppercase">{order.routeDay}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="py-3 border-b border-dashed border-slate-300 text-[11px]">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                DATOS DEL CLIENTE
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-xs mb-0.5">
                <span>{order.customerName}</span>
                <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">
                  {order.customerCode}
                </span>
              </div>
              <div className="text-slate-600">Titular: {order.customerOwner}</div>
              <div className="text-slate-600">
                {order.customerDocumentType}: <span className="font-semibold text-slate-700">{order.customerDocumentNumber}</span>
              </div>
              <div className="text-slate-600 flex items-start gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 font-semibold">{order.customerAddress}</strong>
                  <br />
                  <span className="text-slate-500">{order.customerDistrict}</span>
                </span>
              </div>
              {order.customerReference && (
                <div className="text-[10px] text-slate-500 italic mt-0.5 bg-slate-50 p-1 rounded">
                  Ref: {order.customerReference}
                </div>
              )}
              <div className="text-slate-600 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{order.customerPhone}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                DETALLE DE PRODUCTOS
              </div>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-500">
                    <th className="pb-1 text-left font-semibold">Cant</th>
                    <th className="pb-1 text-left font-semibold">Producto</th>
                    <th className="pb-1 text-right font-semibold">P.Unit</th>
                    <th className="pb-1 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1.5 font-bold text-slate-900 pr-1">
                        {item.quantity} <span className="text-[9px] text-slate-500 font-normal">{item.unit.substring(0, 3)}</span>
                      </td>
                      <td className="py-1.5 pr-1">
                        <div className="font-medium text-slate-800 leading-tight">
                          {item.productName}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Cód: {item.productCode}
                        </div>
                      </td>
                      <td className="py-1.5 text-right text-slate-600 tabular-nums">
                        {formatCurrencySoles(item.unitPrice).replace('S/ ', '')}
                      </td>
                      <td className="py-1.5 text-right font-bold text-slate-900 tabular-nums">
                        {formatCurrencySoles(item.subtotal).replace('S/ ', '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
              {order.discount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="tabular-nums">{formatCurrencySoles(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento aplicado:</span>
                    <span className="tabular-nums">-{formatCurrencySoles(order.discount)}</span>
                  </div>
                </>
              )}
              
              {/* Grand Total to be collected on arrival */}
              <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                    TOTAL A COBRAR
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    (Al entregar pedido)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-emerald-700 tabular-nums tracking-tight">
                    {formatCurrencySoles(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Delivery Info */}
            <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-1.5 bg-slate-50/80 p-2.5 rounded-lg my-2">
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Forma de Pago:</span>
                <span className="font-bold text-slate-800 text-right">{order.paymentMethod}</span>
              </div>
              {order.cashChangeFor && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Paga con:</span>
                  <span>{formatCurrencySoles(order.cashChangeFor)} (Vuelto: {formatCurrencySoles(cashChangeAmount)})</span>
                </div>
              )}
              <div className="flex items-start justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Fecha Entrega:</span>
                <span className="font-semibold text-slate-800">{order.deliveryDate}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Turno:</span>
                <span className="font-semibold text-slate-800">{order.deliveryTimeSlot}</span>
              </div>
              {order.notes && (
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-600">
                  <span className="font-bold text-slate-700">Nota: </span>
                  {order.notes}
                </div>
              )}
            </div>

            {/* Barcode representation */}
            <div className="py-3 text-center">
              <div className="inline-block tracking-widest font-mono text-2xl font-bold text-slate-800 scale-y-125 select-none opacity-85">
                ||| | |||| | ||| |||| | |||
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-wider">
                *{order.orderNumber}*
              </p>
            </div>

            {/* Footer message */}
            <div className="text-center pt-2 text-[10px] text-slate-500 italic">
              {companyConfig.receiptFooterMessage}
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={closeTicketModal}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
