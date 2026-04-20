CREATE TABLE IF NOT EXISTS public.employees (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  job_title TEXT,
  organization_id BIGINT NOT NULL CHECK (organization_id > 0),
  CONSTRAINT fk_employees_organization
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_employees" ON public.employees;

CREATE POLICY "dev_full_access_employees"
ON public.employees
FOR ALL
USING (true)
WITH CHECK (true);
