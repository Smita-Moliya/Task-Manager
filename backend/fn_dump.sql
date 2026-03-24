CREATE OR REPLACE FUNCTION public.fn_list_activity_logs_for_export(p_q text DEFAULT NULL::text, p_task_id integer DEFAULT NULL::integer, p_actor_id integer DEFAULT NULL::integer, p_action text DEFAULT NULL::text)
 RETURNS TABLE(id integer, task_id integer, task_title text, actor_id integer, actor_name text, action text, message text, created_at timestamp without time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.task_id,
        t.title AS task_title,
        a.actor_id,
        u.name AS actor_name,
        a.action,
        a.message,
        a.created_at
    FROM activity_logs a
    LEFT JOIN tasks t ON a.task_id = t.id
    LEFT JOIN users u ON a.actor_id = u.id
    WHERE
        (
            p_q IS NULL
            OR LOWER(a.message) LIKE '%' || LOWER(p_q) || '%'
            OR LOWER(t.title) LIKE '%' || LOWER(p_q) || '%'
            OR LOWER(u.name) LIKE '%' || LOWER(p_q) || '%'
        )
        AND (p_task_id IS NULL OR a.task_id = p_task_id)
        AND (p_actor_id IS NULL OR a.actor_id = p_actor_id)
        AND (p_action IS NULL OR a.action = p_action)
    ORDER BY a.created_at DESC;
END;
$function$
