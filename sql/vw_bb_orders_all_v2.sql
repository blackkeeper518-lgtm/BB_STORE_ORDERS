-- BB ONLY
-- Read-only order source for the BB deployment.
-- No ST references, shared order tables, guessed columns, or data writes.

do $$
begin
  if to_regclass('public.vw_bb_orders_all_v2') is null then
    execute $view$
      create view public.vw_bb_orders_all_v2 as
      select o.*
      from public.bb_orders as o
    $view$;
  else
    execute $view$
      create or replace view public.vw_bb_orders_all_v2 as
      select o.*
      from public.bb_orders as o
    $view$;
  end if;
end
$$;

comment on view public.vw_bb_orders_all_v2 is
  'BB-only read view over public.bb_orders; source for the BB web deployment.';

-- Apply the SELECT grant only if the BB Supabase project requires it.
-- grant select on public.vw_bb_orders_all_v2 to anon, authenticated;
