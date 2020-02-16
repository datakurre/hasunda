import React, { Component } from "react";
import { createMuiTheme } from "@material-ui/core/styles";
import "./App.css";
import { Admin, ListGuesser, Loading, Resource } from "react-admin";
import authProvider, { getUser } from "./authProvider";
import LoginPage from "./LoginPage";
import buildCamundaProvider from "./Camunda/Provider";
import { User } from "oidc-client";
import { HttpLink } from "apollo-client-preset";

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
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      camundaDataProvider: null
    };
  }
  async componentDidMount() {
    try {
      await authProvider.checkAuth();
    } catch {
      await authProvider.login();
    }
    const user = getUser();
    this.setState({
      ...this.state,
      camundaDataProvider: await buildCamundaProvider({
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
      })
    });
  }
  dataProvider(type: string, resource: string, params: any) {
    const { camundaDataProvider } = this.state;
    switch (resource) {
      case "processDefinition":
      case "processDefinitionUserTask":
      default:
        return camundaDataProvider(type, resource, params);
    }
  }
  render() {
    const { camundaDataProvider } = this.state;
    return camundaDataProvider ? (
      <Admin
        theme={theme}
        authProvider={authProvider}
        loginPage={LoginPage}
        dataProvider={(type: string, resource: string, params: any) =>
          this.dataProvider(type, resource, params)
        }
      >
        <Resource name="processDefinition" list={ListGuesser} />
      </Admin>
    ) : (
      <Loading />
    );
  }
}

export default App;
