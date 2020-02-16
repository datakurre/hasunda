import React from "react";
import { parse } from "query-string";
import {
  Create,
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextField,
  EditButton,
  TextInput
} from "react-admin";
import FormBuilderInput from "./FormBuilderInput";

export const FormList = props => {
  return (
    <List {...props}>
      <Datagrid>
        <TextField source="id" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export const FormCreate = props => {
  const { id, processDefinitionId } = parse(props.location.search);
  const redirect = processDefinitionId
    ? `/processDefinition/${processDefinitionId}/show`
    : "list";
  return (
    <Create {...props}>
      <SimpleForm defaultValue={{ id }} redirect={redirect}>
        <TextInput source="id" label="Form key" />
        <FormBuilderInput source="schema" label="Form schema" />
      </SimpleForm>
    </Create>
  );
};

export const FormEdit = props => {
  const { processDefinitionId } = parse(props.location.search);
  const redirect = processDefinitionId
    ? `/processDefinition/${processDefinitionId}/show`
    : "list";
  return (
    <Edit {...props}>
      <SimpleForm redirect={redirect}>
        <TextInput source="id" label="Form key" />
        <FormBuilderInput source="schema" label="Form schema" />
      </SimpleForm>
    </Edit>
  );
};
