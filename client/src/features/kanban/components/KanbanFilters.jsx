import React from 'react';
import {
  BuildingStorefrontIcon,
  CircleStackIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

function FilterField({ label, children, icon: Icon }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

export default function KanbanFilters({ draftFilters, options, onChange, onApply, onReset }) {
  return (
    <section className="card-dark">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-400">Kanban Filters</p>
          <h2 className="mt-1 text-sm font-semibold text-white">Filter line-side stock by plant, line, category, or specific SKU</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onReset} className="btn-outline px-3 py-2 text-xs">Reset</button>
          <button onClick={onApply} className="btn-primary px-4 py-2 text-xs">Apply Filters</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <FilterField label="Plant" icon={BuildingStorefrontIcon}>
          <select className="select-dark text-sm" value={draftFilters.plant} onChange={(event) => onChange('plant', event.target.value)}>
            <option value="">All Plants</option>
            {options.plants.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
          </select>
        </FilterField>

        <FilterField label="Shop" icon={BuildingStorefrontIcon}>
          <select className="select-dark text-sm" value={draftFilters.shop} onChange={(event) => onChange('shop', event.target.value)}>
            <option value="">All Shops</option>
            {options.shops.map((shop) => <option key={shop} value={shop}>{shop}</option>)}
          </select>
        </FilterField>

        <FilterField label="Line" icon={Squares2X2Icon}>
          <select className="select-dark text-sm" value={draftFilters.lineId} onChange={(event) => onChange('lineId', event.target.value)}>
            <option value="">All Lines</option>
            {options.lineOptions.map((line) => <option key={line.value} value={line.value}>{line.label}</option>)}
          </select>
        </FilterField>

        <FilterField label="Machine Group" icon={Squares2X2Icon}>
          <select className="select-dark text-sm" value={draftFilters.machineGroup} onChange={(event) => onChange('machineGroup', event.target.value)}>
            <option value="">All Groups</option>
            {options.machineGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </FilterField>

        <FilterField label="Kanban Store / Zone" icon={CircleStackIcon}>
          <select className="select-dark text-sm" value={draftFilters.storeId} onChange={(event) => onChange('storeId', event.target.value)}>
            <option value="">All Stores</option>
            {options.storeOptions.map((store) => <option key={store.value} value={store.value}>{store.label}</option>)}
          </select>
        </FilterField>

        <FilterField label="Category" icon={CircleStackIcon}>
          <select className="select-dark text-sm" value={draftFilters.categoryId} onChange={(event) => onChange('categoryId', event.target.value)}>
            <option value="">All Categories</option>
            {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </FilterField>

        <div className="md:col-span-2 xl:col-span-2">
          <FilterField label="Item / SKU Search" icon={MagnifyingGlassIcon}>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="input-dark w-full pl-10 text-sm"
                placeholder="Search SKU, item, bin, or line..."
                value={draftFilters.search}
                onChange={(event) => onChange('search', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onApply();
                }}
              />
            </div>
          </FilterField>
        </div>
      </div>
    </section>
  );
}
