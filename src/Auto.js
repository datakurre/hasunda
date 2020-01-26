import React from "react";
import { Create, SimpleForm, TextInput } from "react-admin";

export const AutoCreate = (resource, introspection) => {
  const schema = introspection.types.filter(
    type => type.name === `${resource}_insert_input`
  )[0];
  return props => (
    <Create {...props}>
      <SimpleForm>
        {schema.inputFields.map(field => (
          <TextInput key={field.name} source={field.name} label={field.name} />
        ))}
      </SimpleForm>
    </Create>
  );
};
