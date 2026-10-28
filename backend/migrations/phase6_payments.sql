-- ============================================================
-- Phase 6: Transaction Payment Tracking
-- Run this file in the Supabase SQL editor (SQL Editor > New query).
-- Safe to re-run (idempotent).
-- ============================================================

-- 1) Transaction total ------------------------------------------------------
-- total_amount is NULL for legacy transactions whose payment state cannot be
-- established; those rows are never marked paid or unpaid (they render as
-- "not tracked"). New transactions always receive a value.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS total_amount integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_total_amount_check'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_total_amount_check CHECK (total_amount >= 0);
  END IF;
END $$;

-- 2) Payments table ---------------------------------------------------------
-- One row per payment (initial payment or later installment), always linked
-- to the original transaction. A later payment never creates a new sale.
CREATE TABLE IF NOT EXISTS public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  amount          integer NOT NULL CHECK (amount > 0),
  payment_mode    text NOT NULL CHECK (payment_mode IN ('cash', 'online')),
  note            text,
  paid_at         timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_transaction_id
  ON public.payments (transaction_id);

-- Match the access model of the existing tables: the backend connects with the
-- anon key and existing tables are not RLS-restricted for it. Some Supabase
-- setups enable RLS by default on newly created tables, which would reject
-- every payment insert (42501) while silently hiding rows from SELECT.
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;

-- 3) Atomic sale + initial payment ------------------------------------------
-- Inserts the transaction and its initial payment in ONE database transaction:
-- either both rows exist or neither does. paid = 0 inserts no payment row and
-- requires no payment mode. Raises (rolling everything back) on any violation.
CREATE OR REPLACE FUNCTION public.create_transaction_with_payment(
  p_transaction_id  text,
  p_customer_id     uuid,
  p_customer_name   text,
  p_empty_cylinder  text,
  p_filled_cylinder text,
  p_remarks         text,
  p_source          text,
  p_queue_date      timestamptz,
  p_total_amount    integer,
  p_paid_amount     integer DEFAULT 0,
  p_payment_mode    text DEFAULT NULL,
  p_payment_note    text DEFAULT NULL
) RETURNS public.transactions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_tx public.transactions;
BEGIN
  IF p_total_amount IS NULL OR p_total_amount < 0 THEN
    RAISE EXCEPTION 'Transaction total is required and cannot be negative';
  END IF;

  IF p_paid_amount IS NULL OR p_paid_amount < 0 THEN
    RAISE EXCEPTION 'Paid amount cannot be negative';
  END IF;

  IF p_paid_amount > p_total_amount THEN
    RAISE EXCEPTION 'Paid amount cannot exceed the transaction total';
  END IF;

  IF p_paid_amount > 0 AND p_payment_mode IS NULL THEN
    RAISE EXCEPTION 'Payment mode is required when amount paid is greater than zero';
  END IF;

  IF p_payment_mode IS NOT NULL AND p_payment_mode NOT IN ('cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment mode: %', p_payment_mode;
  END IF;

  INSERT INTO public.transactions (
    transaction_id, customer_id, customer_name,
    empty_cylinder, filled_cylinder, remarks,
    source, queue_date, total_amount
  ) VALUES (
    p_transaction_id, p_customer_id, p_customer_name,
    p_empty_cylinder, p_filled_cylinder, p_remarks,
    p_source, p_queue_date, p_total_amount
  )
  RETURNING * INTO v_tx;

  IF p_paid_amount > 0 THEN
    INSERT INTO public.payments (transaction_id, amount, payment_mode, note, paid_at)
    VALUES (v_tx.id, p_paid_amount, p_payment_mode, p_payment_note, now());
  END IF;

  RETURN v_tx;
END;
$$;

-- 4) Atomic later payment with row lock -------------------------------------
-- Locks the transaction row (FOR UPDATE), re-sums all existing payments, and
-- rejects any amount above the outstanding balance. Concurrent calls on the
-- same transaction serialize on the lock, so the balance cannot be overpaid:
-- the second caller re-reads SUM(amount) only after the first commits.
CREATE OR REPLACE FUNCTION public.record_payment(
  p_transaction_id uuid,
  p_amount         integer,
  p_mode           text,
  p_note           text DEFAULT NULL
) RETURNS public.payments
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_total integer;
  v_paid  integer;
  v_row   public.payments;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_mode IS NULL OR p_mode NOT IN ('cash', 'online') THEN
    RAISE EXCEPTION 'Invalid payment mode: %', COALESCE(p_mode, '(missing)');
  END IF;

  SELECT t.total_amount INTO v_total
  FROM public.transactions t
  WHERE t.id = p_transaction_id
  FOR UPDATE;  -- serializes concurrent payment attempts on this transaction

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF v_total IS NULL THEN
    RAISE EXCEPTION 'This transaction has no tracked total (legacy record)';
  END IF;

  SELECT COALESCE(SUM(p.amount), 0) INTO v_paid
  FROM public.payments p
  WHERE p.transaction_id = p_transaction_id;

  IF p_amount > (v_total - v_paid) THEN
    RAISE EXCEPTION 'Payment exceeds outstanding balance (balance: %)', (v_total - v_paid);
  END IF;

  INSERT INTO public.payments (transaction_id, amount, payment_mode, note, paid_at)
  VALUES (p_transaction_id, p_amount, p_mode, p_note, now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Backend connects with the anon key; make execution explicit.
GRANT EXECUTE ON FUNCTION public.create_transaction_with_payment TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_payment TO anon, authenticated, service_role;
