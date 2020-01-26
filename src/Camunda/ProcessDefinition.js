import React from "react";
import BpmnModdle from "bpmn-moddle";
import {
  Datagrid,
  Edit,
  EditButton,
  List,
  ListButton,
  SimpleForm,
  TextField,
  TextInput,
  TopToolbar
} from "react-admin";

export const ProcessDefinitionList = props => {
  return (
    <List {...props}>
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

const ProcessDefinitionEditActions = ({ basePath, data }) => {
  if (data) {
    const moddle = new BpmnModdle();
    moddle.fromXML(data.diagram, function(err, definitions) {
      let rootElements = definitions.get("rootElements");
      console.log(rootElements);
      for (let i = 0; i < rootElements[1].flowElements.length; i++) {
        if (rootElements[1].flowElements[i].$type === "bpmn:UserTask") {
          console.log("UserTask: ");
          console.log(definitions.rootElements[1].flowElements[i]);
        }
      }
    });
  }
  return (
    <TopToolbar>
      <ListButton basePath={basePath} record={data} label="Back" />
    </TopToolbar>
  );
};

export const ProcessDefinitionEdit = props => {
  return (
    <Edit actions={<ProcessDefinitionEditActions />} {...props}>
      <SimpleForm>
        <TextInput disabled source="name" label="ProcessDefinition name" />
      </SimpleForm>
    </Edit>
  );
};
