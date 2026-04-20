CREATE TABLE IF NOT EXISTS public.tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done')),
  event_id BIGINT NOT NULL,
  employee_id BIGINT,
  CONSTRAINT chk_tasks_deadline_after_start
    CHECK (deadline IS NULL OR start_date IS NULL OR deadline >= start_date),
  CONSTRAINT fk_tasks_event
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tasks_employee
    FOREIGN KEY (employee_id)
    REFERENCES public.employees(id)
    ON DELETE SET NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_tasks" ON public.tasks;

CREATE POLICY "dev_full_access_tasks"
ON public.tasks
FOR ALL
USING (true)
WITH CHECK (true);
