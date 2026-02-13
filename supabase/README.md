# Supabase Migrations

Este directorio es el **origen de verdad** de migraciones y configuración de Supabase para **expensify-next**. No depende de otros repos; todo se ejecuta desde aquí.

- Migraciones: `supabase/migrations/`
- Tipos TypeScript generados: `../types/database.ts`

## Tablas

1. **expensify_budgets** – Presupuestos
2. **expensify_tx_budget_assignments** – Asignación transacción ↔ presupuesto
3. **expensify_transactions** – Transacciones
4. **expensify_cards** – Tarjetas/cuentas
5. **expensify_banks** – Bancos (referencia para cards/transactions)

## Uso (todo desde expensify-next)

### Vincular proyecto (solo la primera vez)

Desde la raíz de **expensify-next**:

```bash
npm run supabase:link
# o: npx supabase link --project-ref <tu-project-ref>
```

Te pedirá la contraseña de la base de datos. El link queda guardado en este proyecto.

### Aplicar migraciones

```bash
npm run migrate
```

### Regenerar tipos (`types/database.ts`)

Después de cambiar el schema o aplicar nuevas migraciones:

```bash
npm run supabase:types
```

### Otros

- `npm run migrate:status` – Ver qué migraciones están aplicadas
- `npm run migrate:reset` – Reset local (solo con Supabase local)

## Notas

- Las migraciones son idempotentes donde se indica.
- Todo se hace desde **expensify-next**; no hace falta usar expensify-frontend para Supabase.
