import React, {Component} from "react";
import {createMuiTheme} from "@material-ui/core/styles";
import "./App.css";
import {Admin, ListGuesser, Loading, Resource} from "react-admin";
import authProvider, {getUser} from "./authProvider";
import LoginPage from "./LoginPage";
import buildCamundaProvider from "./Camunda/Provider";
import {User} from "oidc-client";
import {HttpLink} from "apollo-client-preset";
import {ProcessDefinitionList} from "./Camunda/ProcessDefinition";
import {ProcessInstanceList} from "./Camunda/ProcessInstance";
import {UserTaskList} from "./Camunda/UserTask";
import buildHasuraProvider, {buildQuery} from "ra-data-hasura-graphql";

interface HasuraDataProviderAndIntrospection {
  hasuraIntrospectionResults: any,
  hasuraDataProvider: any
}

const buildHasuraProviderWithIntrospection = async (options: any) : Promise<HasuraDataProviderAndIntrospection> =>  {
  return new Promise((resolve, reject) => {
    let hasuraIntrospectionResults: any;
    buildHasuraProvider({
      buildQuery: (introspectionResults: any) => {
        hasuraIntrospectionResults = introspectionResults;
        return buildQuery(introspectionResults);
      },
      ...options
    })
      .then((hasuraDataProvider: any) => {
        resolve({
          hasuraIntrospectionResults,
          hasuraDataProvider
        });
      })
      .catch((error: any) => reject(error));
  });
};

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#002957" // main: "#f1563f"
    },
    secondary: {
      main: "#002957"
    }
  }
});

interface AppProps {}

interface AppState {
  camundaDataProvider: any | null;
  hasuraDataProvider: any | null;
  hasuraIntrospectionResults: any | null;
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      camundaDataProvider: null,
      hasuraDataProvider: null,
      hasuraIntrospectionResults: null
    };
  }
  async componentDidMount() {
    try {
      await authProvider.checkAuth();
    } catch {
      await authProvider.login();
    }
    const user = getUser();
    const camundaDataProvider = await buildCamundaProvider({
      clientOptions: {
        link: new HttpLink({
          uri: "http://localhost:8900/v1/graphql",
          headers: {
            Authorization:
              user !== null
                ? `Bearer ${((user as unknown) as User).access_token}`
                : ""
          }
        })
      }
    });
    const { hasuraDataProvider, hasuraIntrospectionResults } = await buildHasuraProviderWithIntrospection({
      clientOptions: {
        link: new HttpLink({
          uri: "http://localhost:8900/v1/graphql",
          headers: {
            Authorization:
              user !== null
                ? `Bearer ${((user as unknown) as User).access_token}`
                : ""
          }
        })
      }
    });

    this.setState({
      ...this.state,
      camundaDataProvider,
      hasuraDataProvider,
      hasuraIntrospectionResults,
    });
  }

  dataProvider(type: string, resource: string, params: any) {
    const { camundaDataProvider, hasuraDataProvider } = this.state;
    switch (resource) {
      case "processDefinition":
      case "processDefinitionUserTask":
      case "processInstance":
      case "processInstanceUserTask":
        return camundaDataProvider(type, resource, params);
      default:
        return hasuraDataProvider(type, resource, params);
    }
  }

  render() {
    const {
      camundaDataProvider,
      hasuraDataProvider,
      hasuraIntrospectionResults
    } = this.state;

    const resources = hasuraIntrospectionResults ? hasuraIntrospectionResults.resources
      .map((r: any) => r.type.name)
    //  .filter((name: string) => !name.match(/^form$/))
      .filter((name: string) => !name.match(/_aggregate$/)) : [];
    console.log("HasuraIntrospection");
    console.log(hasuraIntrospectionResults);
    console.log(resources);

    return camundaDataProvider &&
      hasuraDataProvider &&
      hasuraIntrospectionResults ? (
      <Admin
        theme={theme}
        authProvider={authProvider}
        loginPage={LoginPage}
        dataProvider={(type: string, resource: string, params: any) =>
          this.dataProvider(type, resource, params)
        }
      >
        {resources.map((name : string) => (
          <Resource
            key={name}
            name={name}
            list={ListGuesser}
            // create={AutoCreate(name, introspectionResults)}
            // edit={AutoEdit(name, introspectionResults)}
          />
        ))}
        <Resource name="processDefinition" list={ProcessDefinitionList} />
        <Resource name="processInstance" list={ProcessInstanceList} />
        <Resource name="processInstanceUserTask" list={UserTaskList} />
      </Admin>
    ) : (
      <Loading />
    );
  }
}

export default App;
