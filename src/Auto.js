import React from "react";
import { Create, Edit, SimpleForm, DateInput, TextInput } from "react-admin";

export const AutoCreate = (resource, introspection) => {
  const schema = introspection.types.filter(
    type => type.name === `${resource}_insert_input`
  )[0];
  return props => (
    <Create {...props}>
      <SimpleForm>
        {schema.inputFields.map(field =>
          field.type.name === "date" ? (
            <DateInput
              key={field.name}
              source={field.name}
              label={field.name}
            />
          ) : (
            <TextInput
              key={field.name}
              source={field.name}
              label={field.name}
            />
          )
        )}
      </SimpleForm>
    </Create>
  );
};

export const AutoEdit = (resource, introspection) => {
  const schema = introspection.types.filter(
    type => type.name === `${resource}_insert_input`
  )[0];
  return props => (
    <Edit {...props}>
      <SimpleForm>
        {schema.inputFields.map(field =>
          field.type.name === "date" ? (
            <DateInput
              key={field.name}
              source={field.name}
              label={field.name}
            />
          ) : (
            <TextInput
              key={field.name}
              source={field.name}
              label={field.name}
            />
          )
        )}
      </SimpleForm>
    </Edit>
  );
};
