import React, { useEffect, useState } from "react";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import {
  Button,
  Datagrid,
  Error,
  Link,
  List,
  Loading,
  ReferenceManyField,
  Show,
  SimpleShowLayout,
  TextField,
  useDataProvider
} from "react-admin";
import BpmnField from "../BpmnField";

export const ProcessDefinitionList = props => {
  return (
    <List {...props}>
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
      </Datagrid>
    </List>
  );
};

export const AddOrShowFormButton = ({ record }) => {
  const id = `${record["$parent"].id}:${record.id}`;
  const dataProvider = useDataProvider();
  const [context, setContext] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    dataProvider
      .getOne("form", { id: id })
      .then(({ data }) => {
        setContext(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [dataProvider, id]);

  if (loading) return <Loading />;
  if (error) return <Error error={error} />;
  if (!context || !context.id) {
    return (
      <Link
        to={{
          pathname: "/form/create",
          search: `?id=${id}&processDefinitionId=${record.processDefinitionId}`
        }}
      >
        <Button label="Add form">
          <AddIcon />
        </Button>
      </Link>
    );
  } else {
    return (
      <Link
        to={{
          pathname: `/form/${id}`,
          search: `?processDefinitionId=${record.processDefinitionId}`
        }}
      >
        <Button label="Edit form">
          <EditIcon />
        </Button>
      </Link>
    );
  }
};

export const ProcessDefinitionShow = props => {
  const { id } = props;
  const dataProvider = useDataProvider();
  const [context, setContext] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    dataProvider
      .getOne("processDefinition", { id: id })
      .then(({ data }) => {
        setContext(data);
        setLoading(false);
      })
      .catch(error => {
        if (
          error.toString() ===
          "TypeError: (destructured parameter) is undefined"
        ) {
        } else {
          setError(error);
          setLoading(false);
        }
      });
  }, [dataProvider, id]);

  if (loading) return <Loading />;
  if (error) return <Error />;
  if (!context) return null;

  return (
    <Show {...props}>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="name" />
        <BpmnField source="diagram" />
        <ReferenceManyField
          label="User tasks"
          reference="processDefinitionUserTask"
          target="id"
        >
          <Datagrid>
            <TextField source="name" />
            <AddOrShowFormButton />
          </Datagrid>
        </ReferenceManyField>
      </SimpleShowLayout>
    </Show>
  );
};
