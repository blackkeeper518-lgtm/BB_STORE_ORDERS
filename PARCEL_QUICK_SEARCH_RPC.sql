-- Search parcels for the admin room.
-- Called through the authenticated server procedure using Supabase service_role.
-- SECURITY INVOKER preserves the role/RLS of the caller; do not grant anon access.

CREATE OR REPLACE FUNCTION public.search_parcels_quick(
  p_search text,
  p_mode text DEFAULT 'auto',
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  tracking_number text,
  pickup_date text,
  consignee text,
  phone_number text,
  address text,
  cod_amount text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH args AS (
    SELECT
      NULLIF(pg_catalog.btrim(COALESCE(p_search, '')), '') AS term,
      pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g') AS digits,
      CASE
        WHEN pg_catalog.left(
          pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g'),
          2
        ) = '66'
        THEN '0' || pg_catalog.substr(
          pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g'),
          3
        )
        ELSE pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g')
      END AS local_digits,
      pg_catalog.lower(COALESCE(p_mode, 'auto')) AS mode,
      GREATEST(1, LEAST(COALESCE(p_limit, 100), 200)) AS row_limit
  )
  SELECT
    p.tracking_number::text,
    p.pickup_date::text,
    p.consignee::text,
    p.phone_number::text,
    p.address::text,
    p.cod_amount::text
  FROM public.parcels AS p
  CROSS JOIN args AS a
  WHERE a.term IS NOT NULL
    AND (
      (
        a.mode = 'tracking'
        AND COALESCE(p.tracking_number::text, '') ILIKE '%' || a.term || '%'
      )
      OR (
        a.mode = 'name'
        AND COALESCE(p.consignee::text, '') ILIKE '%' || a.term || '%'
      )
      OR (
        a.mode = 'phone'
        AND a.digits <> ''
        AND (
          pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
            LIKE '%' || a.digits || '%'
          OR pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
            LIKE '%' || a.local_digits || '%'
        )
      )
      OR (
        a.mode = 'address'
        AND COALESCE(p.address::text, '') ILIKE '%' || a.term || '%'
      )
      OR (
        a.mode NOT IN ('tracking', 'name', 'phone', 'address')
        AND (
          COALESCE(p.tracking_number::text, '') ILIKE '%' || a.term || '%'
          OR COALESCE(p.consignee::text, '') ILIKE '%' || a.term || '%'
          OR COALESCE(p.address::text, '') ILIKE '%' || a.term || '%'
          OR (
            a.digits <> ''
            AND (
              pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
                LIKE '%' || a.digits || '%'
              OR pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
                LIKE '%' || a.local_digits || '%'
            )
          )
        )
      )
    )
  ORDER BY p.pickup_date DESC NULLS LAST, p.tracking_number
  LIMIT (SELECT row_limit FROM args);
$function$;

REVOKE ALL ON FUNCTION public.search_parcels_quick(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_parcels_quick(text, text, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
