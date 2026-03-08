import React, { useEffect, useState } from 'react';
import { RECEIVE_SOURCE_TYPES } from '../constants/kanbanConfig';

export default function ReceiveMaterialModal({ isOpen, initialValues, stockItems, stores, onClose, onSubmit }) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialValues);
  }, [initialValues, isOpen]);

  useEffect(() => {
    if (!isOpen || !form.skuCode) return;

    const matchedItem = stockItems.find(
      (item) => item.skuCode === form.skuCode && (!form.storeId || item.storeId === form.storeId)
    );

    if (!matchedItem) return;

    setForm((current) => ({
      ...current,
      storeId: matchedItem.storeId,
      binId: matchedItem.binId,
      itemName: matchedItem.itemName,
      uom: matchedItem.uom,
    }));
  }, [form.skuCode, form.storeId, isOpen, stockItems]);

  if (!isOpen) return null;

  const skuOptions = stockItems.filter((item) => !form.storeId || item.storeId === form.storeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-[#07111f] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Frontend Receive Flow</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Receive Material into Kanban Store</h3>
            <p className="mt-2 text-sm text-slate-400">This phase updates local state only. Structure is ready for future API integration.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white">Close</button>
        </div>

        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Receipt ID</span>
            <input className="input-dark text-sm" value={form.receiptId} readOnly />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Date / Time</span>
            <input type="datetime-local" className="input-dark text-sm" value={form.receivedAt} onChange={(event) => setForm((current) => ({ ...current, receivedAt: event.target.value }))} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Kanban Store</span>
            <select className="select-dark text-sm" value={form.storeId} onChange={(event) => setForm((current) => ({ ...current, storeId: event.target.value }))}>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Bin / Location</span>
            <input className="input-dark text-sm" value={form.binId} onChange={(event) => setForm((current) => ({ ...current, binId: event.target.value }))} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Source Type</span>
            <select className="select-dark text-sm" value={form.sourceType} onChange={(event) => setForm((current) => ({ ...current, sourceType: event.target.value }))}>
              {RECEIVE_SOURCE_TYPES.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Source Reference Number</span>
            <input className="input-dark text-sm" value={form.sourceReferenceNumber} onChange={(event) => setForm((current) => ({ ...current, sourceReferenceNumber: event.target.value }))} placeholder="REQ / challan / transfer ref" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">SKU Code</span>
            <select className="select-dark text-sm" value={form.skuCode} onChange={(event) => setForm((current) => ({ ...current, skuCode: event.target.value }))}>
              <option value="">Select SKU</option>
              {skuOptions.map((item) => <option key={item.id} value={item.skuCode}>{item.skuCode} - {item.itemName}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Item Name</span>
            <input className="input-dark text-sm" value={form.itemName} readOnly />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Received Qty</span>
            <input type="number" min="0" step="1" className="input-dark text-sm" value={form.receivedQty} onChange={(event) => setForm((current) => ({ ...current, receivedQty: event.target.value }))} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">UOM</span>
            <input className="input-dark text-sm" value={form.uom} readOnly />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Batch / Lot</span>
            <input className="input-dark text-sm" value={form.batchLot} onChange={(event) => setForm((current) => ({ ...current, batchLot: event.target.value }))} placeholder="Optional lot / batch" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Received By</span>
            <input className="input-dark text-sm" value={form.receivedBy} onChange={(event) => setForm((current) => ({ ...current, receivedBy: event.target.value }))} />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Remarks</span>
            <textarea className="input-dark min-h-[96px] text-sm" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} placeholder="Add receipt remarks or transfer note" />
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline px-4 py-2 text-xs">Cancel</button>
            <button type="submit" className="btn-success px-4 py-2 text-xs">Post Receipt Locally</button>
          </div>
        </form>
      </div>
    </div>
  );
}
