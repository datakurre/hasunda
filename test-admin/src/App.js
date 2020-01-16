// in src/App.js
import React, { Component } from 'react';
import { Admin, Resource, ListGuesser } from 'react-admin';
import buildHasuraProvider from 'ra-data-hasura-graphql';

class App extends Component {
  constructor() {
    super();
    this.state = { dataProvider: null };
  }
  componentDidMount() {
    buildHasuraProvider({
      clientOptions: {
         uri: 'http://localhost:9000/v1/graphql'
      }
    }).then(dataProvider => this.setState({ dataProvider }));
  }

  render() {
    const { dataProvider } = this.state;

    if (!dataProvider) {
      return <div>Loading</div>;
    }

    return (
      <Admin dataProvider={dataProvider}>
        <Resource name="User" list={ListGuesser} />
      </Admin>
    );
  }
}

export default App;
