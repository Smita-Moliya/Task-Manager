import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { api } from "../api/api";

export default function EditTaskPage() {
  const { id } = useParams();
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    api.get(`/tasks/${id}/one/`).then((res) => {
      setTask(res.data.task);
    });
  }, [id]);

  if (!task) return <div>Loading...</div>;

  return (
    <Formik
      initialValues={task}
      enableReinitialize
      onSubmit={async (values) => {
        await api.patch(`/tasks/${id}/admin/`, values);
        alert("Updated ");
      }}
    >
      <Form className="form">
        <Field name="title" />
        <Field name="description" />
        <Field name="status" as="select">
          <option value="PENDING">PENDING</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </Field>

        <button type="submit">Update Task</button>
      </Form>
    </Formik>
  );
}
