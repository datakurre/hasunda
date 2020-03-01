import React from "react";
import { parse } from "query-string";
import {
  Create,
  Datagrid,
  List,
  SimpleForm,
  TextField,
  TextInput
} from "react-admin";

export const ProcessInstanceList = props => {
  return (
    <List {...props}>
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
      </Datagrid>
    </List>
  );
};

export const ProcessInstanceCreate = props => {
  const { processDefinitionId } = parse(props.location.search);
  return (
    <Create {...props}>
      <SimpleForm defaultValue={{ key: processDefinitionId }}>
        <TextInput source="key" label="Process definition" />
      </SimpleForm>
    </Create>
  );
};
