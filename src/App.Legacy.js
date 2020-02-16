// in src/App.js
import React, { Component } from "react";
import { Admin, ListGuesser, Loading, Resource } from "react-admin";
import buildCamundaProvider from "./Camunda/Provider";
import buildHasuraProvider, { buildQuery } from "ra-data-hasura-graphql";
import { AutoCreate, AutoEdit } from "./Auto";
import {
  ProcessDefinitionList,
  ProcessDefinitionShow
} from "./Camunda/ProcessDefinition";
import { FormCreate, FormEdit, FormList } from "./Form";
import authProvider from "./authProvider";

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
          case "processDefinitionUserTask":
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
        uri: "http://localhost:8900/v1/graphql"
      }
    })
      .then(camundaDataProvider =>
        this.setState({ ...this.state, camundaDataProvider })
      )
      .catch(() => {});
    buildHasuraProvider({
      buildQuery: introspectionResults => {
        this.setState({ ...this.state, introspectionResults });
        return buildQuery(introspectionResults);
      },
      clientOptions: {
        uri: "http://localhost:8900/v1/graphql"
      }
    })
      .then(hasuraDataProvider => {
        this.setState({ ...this.state, hasuraDataProvider });
      })
      .catch(() => {});
  }

  render() {
    const {
      dataProvider,
      camundaDataProvider,
      hasuraDataProvider,
      introspectionResults
    } = this.state;

    if (!hasuraDataProvider || !camundaDataProvider) {
      return <Loading />;
    }

    const resources = introspectionResults.resources
      .map(r => r.type.name)
      .filter(name => !name.match(/^form$/))
      .filter(name => !name.match(/_aggregate$/));

    return (
      <Admin authProvider={authProvider} dataProvider={dataProvider}>
        {resources.map(name => (
          <Resource
            key={name}
            name={name}
            list={ListGuesser}
            create={AutoCreate(name, introspectionResults)}
            edit={AutoEdit(name, introspectionResults)}
          />
        ))}
        <Resource
          name="form"
          create={FormCreate}
          edit={FormEdit}
          list={FormList}
        />
        <Resource
          name="processDefinition"
          list={ProcessDefinitionList}
          show={ProcessDefinitionShow}
        />
        <Resource name="processDefinitionUserTask" />
      </Admin>
    );
  }
}

export default App;
