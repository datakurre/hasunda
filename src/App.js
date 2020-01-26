// in src/App.js
import React, { Component } from "react";
import { Admin, ListGuesser, Resource } from "react-admin";
import buildCamundaProvider from "./Camunda/Provider";
import buildHasuraProvider, { buildQuery } from "ra-data-hasura-graphql";
import { AutoCreate } from "./Auto";
import {
  ProcessDefinitionEdit,
  ProcessDefinitionList
} from "./Camunda/ProcessDefinition";
import { FormCreate, FormEdit, FormList } from "./Form";

class App extends Component {
  constructor() {
    super();
    this.state = {
      introspectionResults: null,
      hasuraDataProvider: null,
      camundaDataProvider: null,
      dataProvider: (type, resource, params) => {
        switch (resource) {
          case "processDefinition":
            return this.state.camundaDataProvider(type, resource, params);
          default:
            return this.state.hasuraDataProvider(type, resource, params);
        }
      }
    };
  }
  componentDidMount() {
    buildCamundaProvider({
      clientOptions: {
        uri: "http://localhost:9000/v1/graphql"
      }
    }).then(camundaDataProvider =>
      this.setState({ ...this.state, camundaDataProvider })
    );
    buildHasuraProvider({
      buildQuery: introspectionResults => {
        this.setState({ ...this.state, introspectionResults });
        return buildQuery(introspectionResults);
      },
      clientOptions: {
        uri: "http://localhost:9000/v1/graphql"
      }
    }).then(hasuraDataProvider => {
      this.setState({ ...this.state, hasuraDataProvider });
    });
  }

  render() {
    const {
      dataProvider,
      camundaDataProvider,
      hasuraDataProvider,
      introspectionResults
    } = this.state;

    if (!hasuraDataProvider || !camundaDataProvider) {
      return <div>Loading</div>;
    }

    const resources = introspectionResults.resources
      .map(r => r.type.name)
      .filter(name => !name.match(/^form$/))
      .filter(name => !name.match(/_aggregate$/));

    return (
      <Admin dataProvider={dataProvider}>
        {resources.map(name => (
          <Resource
            key={name}
            name={name}
            list={ListGuesser}
            create={AutoCreate(name, introspectionResults)}
          />
        ))}
        <Resource
          name="form"
          list={FormList}
          create={FormCreate}
          edit={FormEdit}
        />
        <Resource
          name="processDefinition"
          list={ProcessDefinitionList}
          //          edit={ProcessDefinitionEdit}
        />
      </Admin>
    );
  }
}

export default App;
