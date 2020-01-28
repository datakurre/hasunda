import React from "react";
import FormBuilder from "react-form-builder2";
import { useForm } from "react-final-form";

const FormBuilderInput = ({ id, record }) => {
  const form = useForm();
  return (
    <FormBuilder.ReactFormBuilder
      data={JSON.parse(record[id] || "[]")}
      onPost={({ task_data }) => form.change(id, JSON.stringify(task_data))}
    />
  );
};

export default FormBuilderInput;
