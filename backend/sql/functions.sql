-- =========================================================
-- USERS MODULE - PostgreSQL Functions & Procedures
-- Database: task
-- Safe to run multiple times (CREATE OR REPLACE)
-- =========================================================


-- =====================================
-- 1) Check if user exists by email
-- =====================================
CREATE OR REPLACE FUNCTION fn_user_exists_by_email(p_email text)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users WHERE email = p_email
  );
$$;


-- =====================================
-- 2) Create user and return ID
-- =====================================
CREATE OR REPLACE FUNCTION fn_create_user_returning_id(
  p_name text,
  p_email text,
  p_role text
)
RETURNS integer
LANGUAGE sql
AS $$
  INSERT INTO users(name, email, password_hash, role)
  VALUES (p_name, p_email, NULL, p_role)
  RETURNING id;
$$;


-- =====================================
-- 3) Insert password invite
-- =====================================
CREATE OR REPLACE PROCEDURE sp_insert_password_invite(
  p_user_id integer,
  p_token text
)
LANGUAGE sql
AS $$
  INSERT INTO password_invites(user_id, token, created_at, is_used)
  VALUES (p_user_id, p_token, now(), false);
$$;


-- =====================================
-- 4) Count users
-- =====================================
CREATE OR REPLACE FUNCTION fn_users_count()
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT COUNT(*) FROM users;
$$;


-- =====================================
-- 5) List users with pagination
-- =====================================
CREATE OR REPLACE FUNCTION fn_list_users_page(
  p_limit integer,
  p_offset integer
)
RETURNS TABLE (
  id integer,
  name text,
  email text,
  role text,
  created_at timestamp without time zone
)
LANGUAGE sql
AS $$
  SELECT u.id, u.name, u.email, u.role, u.created_at
  FROM users u
  ORDER BY u.id ASC
  LIMIT p_limit OFFSET p_offset;
$$;


-- =====================================
-- 6) Get user ID by email
-- =====================================
CREATE OR REPLACE FUNCTION fn_get_user_id_by_email(p_email text)
RETURNS integer
LANGUAGE sql
AS $$
  SELECT id FROM users WHERE email = p_email LIMIT 1;
$$;


-- =====================================
-- 7) Mark all active invites as used
-- =====================================
CREATE OR REPLACE PROCEDURE sp_mark_active_invites_used(p_user_id integer)
LANGUAGE sql
AS $$
  UPDATE password_invites
  SET is_used = true
  WHERE user_id = p_user_id
    AND is_used = false;
$$;


-- =====================================
-- 8) Get invite by token hash
-- =====================================
CREATE OR REPLACE FUNCTION fn_get_invite_by_token(p_token text)
RETURNS TABLE (
  invite_id integer,
  user_id integer,
  is_used boolean,
  created_at timestamp without time zone
)
LANGUAGE sql
AS $$
  SELECT pi.id, pi.user_id, pi.is_used, pi.created_at
  FROM password_invites pi
  WHERE pi.token = p_token;
$$;


-- =====================================
-- 9) Update user password hash
-- =====================================
CREATE OR REPLACE PROCEDURE sp_update_user_password_hash(
  p_user_id integer,
  p_password_hash text
)
LANGUAGE sql
AS $$
  UPDATE users
  SET password_hash = p_password_hash
  WHERE id = p_user_id;
$$;


-- =====================================
-- 10) Mark invite used
-- =====================================
CREATE OR REPLACE PROCEDURE sp_mark_invite_used(p_invite_id integer)
LANGUAGE sql
AS $$
  UPDATE password_invites
  SET is_used = true
  WHERE id = p_invite_id;
$$;


-- =====================================
-- 11) Check if user exists by ID
-- =====================================
CREATE OR REPLACE FUNCTION fn_user_exists_by_id(p_user_id integer)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users WHERE id = p_user_id
  );
$$;


-- =====================================
-- 12) Delete user
-- =====================================
CREATE OR REPLACE PROCEDURE sp_delete_user(p_user_id integer)
LANGUAGE sql
AS $$
  DELETE FROM users
  WHERE id = p_user_id;
$$;


-- =========================================================
-- END OF USERS MODULE FUNCTIONS
-- =========================================================

-- =========================================================
-- TASKS MODULE - PostgreSQL Functions & Procedures (ONE FILE)
-- Database: task
-- Safe to run multiple times (CREATE OR REPLACE)
-- =========================================================


-- =========================
-- A) PROCEDURES (writes)
-- =========================

-- 1) Create task (ADMIN)
-- Called by Django: CALL sp_create_task(title, desc, assigned_by, assigned_to, due_date)
CREATE OR REPLACE PROCEDURE sp_create_task(
  p_title text,
  p_description text,
  p_assigned_by integer,
  p_assigned_to integer,
  p_due_date date
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO tasks(
      title,
      description,
      status,
      assigned_by,
      assigned_to,
      due_date,
      created_at,
      updated_at
  )
  VALUES (
      p_title,
      p_description,
      'PENDING',
      p_assigned_by,
      p_assigned_to,
      p_due_date,
      now(),
      now()
  );
END;
$$;


-- 2) User update own task status
-- Called by Django: CALL sp_user_update_task_status(task_id, user_id, status)
CREATE OR REPLACE PROCEDURE sp_user_update_task_status(
  p_task_id integer,
  p_user_id integer,
  p_status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tasks
  SET status = p_status,
      updated_at = now()
  WHERE id = p_task_id
    AND assigned_to = p_user_id;
END;
$$;


-- 3) Admin update full task
CREATE OR REPLACE PROCEDURE sp_update_task_admin(
  p_task_id integer,
  p_title text,
  p_description text,
  p_status text,
  p_assigned_to integer,
  p_due_date date
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tasks
  SET title = p_title,
      description = p_description,
      status = p_status,
      assigned_to = p_assigned_to,
      due_date = p_due_date,
      updated_at = now()
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found', p_task_id;
  END IF;
END;
$$;


-- 4) Admin delete task
CREATE OR REPLACE PROCEDURE sp_delete_task(p_task_id integer)
LANGUAGE sql
AS $$
  DELETE FROM tasks WHERE id = p_task_id;
$$;


-- Insert attachment 
CREATE OR REPLACE PROCEDURE sp_insert_task_attachment(
  p_task_id integer,
  p_original_name text,
  p_stored_name text,
  p_file_path text,
  p_mime_type text
)
LANGUAGE sql
AS $$
  INSERT INTO task_attachments(task_id, original_name, stored_name, file_path, mime_type)
  VALUES (p_task_id, p_original_name, p_stored_name, p_file_path, p_mime_type);
$$;

CREATE OR REPLACE PROCEDURE sp_tasks_update(
  IN p_task_id int,
  IN p_title text,
  IN p_description text,
  IN p_status text,
  IN p_due_date date,
  IN p_assigned_to int
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tasks
  SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    due_date = COALESCE(p_due_date, due_date),
    assigned_to = COALESCE(p_assigned_to, assigned_to),
    updated_at = NOW()
  WHERE id = p_task_id;
END;
$$;


-- read (to return response)
CREATE OR REPLACE FUNCTION fn_tasks_get_by_id(p_task_id int)
RETURNS TABLE (
  id int,
  title text,
  description text,
  status text,
  due_date date,
  assigned_to int,
  assigned_by int,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT id, title, description, status, due_date, assigned_to, assigned_by, created_at, updated_at
  FROM tasks
  WHERE id = p_task_id
$$;

-- =========================
-- B) FUNCTIONS (reads)
-- =========================

-- 5) Admin: count tasks
CREATE OR REPLACE FUNCTION fn_tasks_count_admin()
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT COUNT(*) FROM tasks;
$$;


-- 6) User: count own tasks
CREATE OR REPLACE FUNCTION fn_tasks_count_user(p_user_id integer)
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT COUNT(*) FROM tasks WHERE assigned_to = p_user_id;
$$;


-- 7) Admin: list tasks page
CREATE OR REPLACE FUNCTION fn_list_tasks_admin(p_limit integer, p_offset integer)
RETURNS TABLE (
  id integer,
  title text,
  description text,
  status text,
  assigned_by integer,
  assigned_to integer,
  due_date date,
  created_at timestamp without time zone,
  updated_at timestamp without time zone
)
LANGUAGE sql
AS $$
  SELECT id, title, description, status,
         assigned_by, assigned_to, due_date,
         created_at, updated_at
  FROM tasks
  ORDER BY id DESC
  LIMIT p_limit OFFSET p_offset;
$$;


-- 8) User: list own tasks page
CREATE OR REPLACE FUNCTION fn_list_tasks_user(p_user_id integer, p_limit integer, p_offset integer)
RETURNS TABLE (
  id integer,
  title text,
  description text,
  status text,
  assigned_by integer,
  assigned_to integer,
  due_date date,
  created_at timestamp without time zone,
  updated_at timestamp without time zone
)
LANGUAGE sql
AS $$
  SELECT id, title, description, status,
         assigned_by, assigned_to, due_date,
         created_at, updated_at
  FROM tasks
  WHERE assigned_to = p_user_id
  ORDER BY id DESC
  LIMIT p_limit OFFSET p_offset;
$$;


-- 9) Get task by id (ADMIN)
CREATE OR REPLACE FUNCTION fn_get_task_by_id_admin(p_task_id integer)
RETURNS TABLE (
  id integer,
  title text,
  description text,
  status text,
  assigned_by integer,
  assigned_to integer,
  due_date date
)
LANGUAGE sql
AS $$
  SELECT id, title, description, status, assigned_by, assigned_to, due_date
  FROM tasks
  WHERE id = p_task_id;
$$;


-- 10) Get task by id (USER must own)
CREATE OR REPLACE FUNCTION fn_get_task_by_id_user(p_task_id integer, p_user_id integer)
RETURNS TABLE (
  id integer,
  title text,
  description text,
  status text,
  assigned_by integer,
  assigned_to integer,
  due_date date
)
LANGUAGE sql
AS $$
  SELECT id, title, description, status, assigned_by, assigned_to, due_date
  FROM tasks
  WHERE id = p_task_id
    AND assigned_to = p_user_id;
$$;


-- 11) Attachments for multiple task IDs 
CREATE OR REPLACE FUNCTION fn_list_attachments_for_tasks(p_task_ids integer[])
RETURNS TABLE (
  id integer,
  task_id integer,
  original_name text,
  mime_type text,
  uploaded_at timestamp without time zone
)
LANGUAGE sql
AS $$
  SELECT id, task_id, original_name, mime_type, uploaded_at
  FROM task_attachments
  WHERE task_id = ANY(p_task_ids)
  ORDER BY id ASC;
$$;


--  Create task and RETURN id 
CREATE OR REPLACE FUNCTION fn_create_task_returning_id(
  p_title text,
  p_description text,
  p_assigned_by integer,
  p_assigned_to integer,
  p_due_date date
)
RETURNS integer
LANGUAGE sql
AS $$
  INSERT INTO tasks(
      title, description, status, assigned_by, assigned_to, due_date, created_at, updated_at
  )
  VALUES (
      p_title, p_description, 'PENDING', p_assigned_by, p_assigned_to, p_due_date, now(), now()
  )
  RETURNING id;
$$;


--  Get old values for update 
CREATE OR REPLACE FUNCTION fn_get_task_old_values(p_task_id integer)
RETURNS TABLE (
  title text,
  description text,
  status text,
  assigned_to integer,
  due_date date
)
LANGUAGE sql
AS $$
  SELECT title, description, status, assigned_to, due_date
  FROM tasks
  WHERE id = p_task_id;
$$;


-- Get status for user 
CREATE OR REPLACE FUNCTION fn_get_task_status_for_user(p_task_id integer, p_user_id integer)
RETURNS text
LANGUAGE sql
AS $$
  SELECT status
  FROM tasks
  WHERE id = p_task_id
    AND assigned_to = p_user_id;
$$;




-- =========================================================
-- ADMIN STATS (reads)
-- =========================================================

-- A) Tasks count by status
CREATE OR REPLACE FUNCTION fn_admin_stats_by_status()
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
AS $$
  SELECT status, COUNT(*)
  FROM tasks
  GROUP BY status
  ORDER BY status;
$$;


-- B) Tasks count by user (assigned_to)
CREATE OR REPLACE FUNCTION fn_admin_stats_by_user()
RETURNS TABLE (
  name text,
  count bigint
)
LANGUAGE sql
AS $$
  SELECT u.name, COUNT(*)
  FROM tasks t
  JOIN users u ON u.id = t.assigned_to
  GROUP BY u.name
  ORDER BY COUNT(*) DESC;
$$;

-- =========================================================
-- COMMENTS + ME PAGES (reads/writes)
-- =========================================================

-- TASK COMMENTS: list
CREATE OR REPLACE FUNCTION fn_task_comments_list(p_task_id integer)
RETURNS TABLE (
  id integer,
  task_id integer,
  user_id integer,
  user_name text,
  comment text,
  created_at timestamp without time zone
)
LANGUAGE sql
AS $$
  SELECT c.id, c.task_id, c.user_id, u.name, c.comment, c.created_at
  FROM task_comments c
  JOIN users u ON u.id = c.user_id
  WHERE c.task_id = p_task_id
  ORDER BY c.id ASC;
$$;

-- TASK COMMENTS: create (returns id + created_at)
CREATE OR REPLACE FUNCTION fn_task_comment_create(p_task_id integer, p_user_id integer, p_comment text)
RETURNS TABLE (
  id integer,
  created_at timestamp without time zone
)
LANGUAGE sql
AS $$
  INSERT INTO task_comments(task_id, user_id, comment)
  VALUES (p_task_id, p_user_id, p_comment)
  RETURNING task_comments.id, task_comments.created_at;
$$;

-- ME ATTACHMENTS: admin (all)
CREATE OR REPLACE FUNCTION fn_me_attachments_admin()
RETURNS TABLE (
  id integer,
  task_id integer,
  original_name text,
  mime_type text,
  uploaded_at timestamp without time zone,
  task_title text
)
LANGUAGE sql
AS $$
  SELECT
    ta.id,
    ta.task_id,
    ta.original_name,
    ta.mime_type,
    ta.uploaded_at,
    t.title
  FROM task_attachments ta
  JOIN tasks t ON t.id = ta.task_id
  ORDER BY ta.id DESC;
$$;

-- ME ATTACHMENTS: user (only assigned_to = user)
CREATE OR REPLACE FUNCTION fn_me_attachments_user(p_user_id integer)
RETURNS TABLE (
  id integer,
  task_id integer,
  original_name text,
  mime_type text,
  uploaded_at timestamp without time zone,
  task_title text
)
LANGUAGE sql
AS $$
  SELECT
    ta.id,
    ta.task_id,
    ta.original_name,
    ta.mime_type,
    ta.uploaded_at,
    t.title
  FROM task_attachments ta
  JOIN tasks t ON t.id = ta.task_id
  WHERE t.assigned_to = p_user_id
  ORDER BY ta.id DESC;
$$;

-- ME COMMENTS: admin (all)
CREATE OR REPLACE FUNCTION fn_me_comments_admin()
RETURNS TABLE (
  id integer,
  task_id integer,
  user_id integer,
  user_name text,
  comment text,
  created_at timestamp without time zone,
  task_title text
)
LANGUAGE sql
AS $$
  SELECT
    c.id,
    c.task_id,
    c.user_id,
    u.name,
    c.comment,
    c.created_at,
    t.title
  FROM task_comments c
  JOIN users u ON u.id = c.user_id
  JOIN tasks t ON t.id = c.task_id
  ORDER BY c.id DESC;
$$;

-- ME COMMENTS: user (only tasks assigned_to = user)
CREATE OR REPLACE FUNCTION fn_me_comments_user(p_user_id integer)
RETURNS TABLE (
  id integer,
  task_id integer,
  user_id integer,
  user_name text,
  comment text,
  created_at timestamp without time zone,
  task_title text
)
LANGUAGE sql
AS $$
  SELECT
    c.id,
    c.task_id,
    c.user_id,
    u.name,
    c.comment,
    c.created_at,
    t.title
  FROM task_comments c
  JOIN users u ON u.id = c.user_id
  JOIN tasks t ON t.id = c.task_id
  WHERE t.assigned_to = p_user_id
  ORDER BY c.id DESC;
$$;

-- =========================================================
-- TASK ATTACHMENTS
-- =========================================================

CREATE OR REPLACE FUNCTION fn_task_attachments_get(p_att_id int)
RETURNS TABLE (
  task_id int,
  file_path text,
  original_name text
)
LANGUAGE sql
AS $$
  SELECT task_id, file_path, original_name
  FROM task_attachments
  WHERE id = p_att_id
$$;

CREATE OR REPLACE FUNCTION fn_task_attachments_list(p_task_id int)
RETURNS TABLE (
  id int,
  task_id int,
  original_name text,
  mime_type text,
  uploaded_at timestamp
)
LANGUAGE sql
AS $$
  SELECT id, task_id, original_name, mime_type, uploaded_at
  FROM task_attachments
  WHERE task_id = p_task_id
  ORDER BY id ASC
$$;

CREATE OR REPLACE PROCEDURE sp_task_attachments_create(
  IN  p_task_id integer,
  IN  p_original_name text,
  IN  p_stored_name text,
  IN  p_file_path text,
  IN  p_mime_type text,
  OUT o_id int
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO task_attachments(task_id, original_name, stored_name, file_path, mime_type)
  VALUES (p_task_id, p_original_name, p_stored_name, p_file_path, p_mime_type)
  RETURNING id INTO o_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_admin_activity_count(
  p_task_id  int,
  p_actor_id int,
  p_action   text,
  p_q        text
)
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT COUNT(*)
  FROM activity_logs al
  LEFT JOIN users u ON u.id = al.actor_id
  LEFT JOIN tasks t ON t.id = al.task_id
  WHERE (p_task_id IS NULL OR al.task_id = p_task_id)
    AND (p_actor_id IS NULL OR al.actor_id = p_actor_id)
    AND (p_action IS NULL OR p_action = '' OR al.action = p_action)
    AND (
      p_q IS NULL OR p_q = '' OR
      LOWER(COALESCE(al.message, '')) LIKE '%' || LOWER(p_q) || '%'
      OR LOWER(COALESCE(t.title, '')) LIKE '%' || LOWER(p_q) || '%'
      OR LOWER(COALESCE(u.name, '')) LIKE '%' || LOWER(p_q) || '%'
    );
$$;

CREATE OR REPLACE FUNCTION fn_admin_activity_list(
  p_task_id  int,
  p_actor_id int,
  p_action   text,
  p_q        text,
  p_limit    int,
  p_offset   int
)
RETURNS TABLE (
  id int,
  task_id int,
  task_title text,
  actor_id int,
  actor_name text,
  action varchar(40),
  message text,
  meta jsonb,
  created_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT
    al.id,
    al.task_id,
    t.title AS task_title,
    al.actor_id,
    u.name AS actor_name,
    al.action,
    al.message,
    al.meta,
    al.created_at
  FROM activity_logs al
  LEFT JOIN users u ON u.id = al.actor_id
  LEFT JOIN tasks t ON t.id = al.task_id
  WHERE (p_task_id IS NULL OR al.task_id = p_task_id)
    AND (p_actor_id IS NULL OR al.actor_id = p_actor_id)
    AND (p_action IS NULL OR p_action = '' OR al.action = p_action)
    AND (
      p_q IS NULL OR p_q = '' OR
      LOWER(COALESCE(al.message, '')) LIKE '%' || LOWER(p_q) || '%'
      OR LOWER(COALESCE(t.title, '')) LIKE '%' || LOWER(p_q) || '%'
      OR LOWER(COALESCE(u.name, '')) LIKE '%' || LOWER(p_q) || '%'
    )
  ORDER BY al.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
-- =========================================================
-- TASK ACTIVITY (ADMIN VIEW PER TASK)
-- =========================================================

CREATE OR REPLACE FUNCTION fn_tasks_exists(p_task_id int)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS(SELECT 1 FROM tasks WHERE id = p_task_id)
$$;


CREATE OR REPLACE FUNCTION fn_task_activity_count(p_task_id int)
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT COUNT(*) FROM activity_logs WHERE task_id = p_task_id
$$;


CREATE OR REPLACE FUNCTION fn_task_activity_list(
  p_task_id int,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  id int,
  task_id int,
  actor_id int,
  actor_name text,
  action varchar(40),
  message text,
  meta jsonb,
  created_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT
    al.id,
    al.task_id,
    al.actor_id,
    u.name,
    al.action,
    al.message,
    al.meta,
    al.created_at
  FROM activity_logs al
  LEFT JOIN users u ON u.id = al.actor_id
  WHERE al.task_id = p_task_id
  ORDER BY al.created_at DESC
  LIMIT p_limit OFFSET p_offset
$$;

-- =========================================================
-- AUTH / USERS LOOKUPS
-- =========================================================

-- Read for login
CREATE OR REPLACE FUNCTION fn_auth_user_by_email(p_email text)
RETURNS TABLE (
  id int,
  name text,
  email text,
  password_hash text,
  role text
)
LANGUAGE sql
AS $$
  SELECT id, name, email, password_hash, role
  FROM users
  WHERE lower(email) = lower(p_email)
$$;

-- Read for refresh validation
CREATE OR REPLACE FUNCTION fn_auth_user_exists(p_user_id int)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id)
$$;

-- Write for logout: revoke refresh token
CREATE OR REPLACE PROCEDURE sp_auth_revoke_refresh_token(IN p_token_hash text)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE refresh_tokens
  SET is_revoked = TRUE
  WHERE token_hash = p_token_hash;
END;
$$;

-- =========================================================
-- GOOGLE AUTH - USER LOOKUP / CREATE
-- =========================================================

CREATE OR REPLACE FUNCTION fn_auth_user_basic_by_email(p_email text)
RETURNS TABLE (
  id int,
  name text,
  email text,
  role text
)
LANGUAGE sql
AS $$
  SELECT id, name, email, role
  FROM users
  WHERE lower(email) = lower(p_email)
$$;


CREATE OR REPLACE PROCEDURE sp_auth_create_google_user(
  IN  p_name text,
  IN  p_email text,
  IN  p_role text,
  OUT o_id int
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO users (name, email, role, password_set)
  VALUES (p_name, lower(p_email), p_role, TRUE)
  RETURNING id INTO o_id;
END;
$$;

-- =========================================================
-- ACTIVITY LOGGER (WRITE)
-- =========================================================

CREATE OR REPLACE PROCEDURE sp_activity_logs_insert(
  IN p_task_id int,
  IN p_actor_id int,
  IN p_action varchar(40),
  IN p_message text,
  IN p_meta_text text
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO activity_logs (task_id, actor_id, action, message, meta, created_at)
  VALUES (
    p_task_id,
    p_actor_id,
    p_action,
    COALESCE(p_message,''),
    COALESCE(p_meta_text,'{}')::jsonb,
    NOW()
  );
END;
$$;