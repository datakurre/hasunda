import React from "react";
import {
  Create,
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextField,
  TextInput
} from "react-admin";
import FormBuilderInput from "./FormBuilderInput";

export const FormList = props => {
  return (
    <List {...props}>
      <Datagrid>
        <TextField source="id" />
      </Datagrid>
    </List>
  );
};

export const FormCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="id" label="Form key" />
      <FormBuilderInput source="schema" label="Form schema" />
    </SimpleForm>
  </Create>
);

export const FormEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" label="Form key" />
      <FormBuilderInput source="schema" label="Form schema" />
    </SimpleForm>
  </Edit>
);
