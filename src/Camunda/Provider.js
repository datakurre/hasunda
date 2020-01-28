import merge from "lodash/merge";
import gql from "graphql-tag";
import buildDataProvider from "ra-data-graphql";

const buildQuery = introspectionResults => (
  raFetchType,
  resourceName,
  params
) => {
  if (resourceName !== "processDefinition") {
    throw new Error(`Unknown resource ${resourceName}.`);
  }
  switch (raFetchType) {
    case "GET_LIST":
    case "GET_MANY":
    case "GET_MANY_REFERENCE":
      return {
        query: gql`
          query processDefinitions {
            data: processDefinitions {
              id
              versionTag
              name
              description
              key
              diagram
              isSuspended
              contextPath
              startFormKey
            }
          }
        `,
        variables: {},
        parseResponse: response => {
          return {
            ...response.data,
            total: response.data.data.length
          };
        }
      };
    case "GET_ONE":
      return {
        query: gql`
          query processDefinition($id: String!) {
            data: processDefinition(id: $id) {
              contextPath
              description
              diagram
              id
              isSuspended
              key
              name
              startFormKey
              versionTag
            }
          }
        `,
        variables: {
          id: `${params.id}`
        },
        parseResponse: response => response.data
      };
    default:
      debugger;
      return {};
  }
};

const defaultOptions = {
  buildQuery
};

export default options => {
  return buildDataProvider(merge({}, defaultOptions, options)).then(
    dataProvider => {
      return (fetchType, resource, params) => {
        return dataProvider(fetchType, resource, params);
      };
    }
  );
};

export const processDefinitionUserTaskProvider = {
  getList: (resource, params) =>
    new Promise((resolve, reject) => {
      if (resource !== "processDefinitionUserTask") {
        throw new Error(`Unknown resource ${resource}.`);
      }
    })
  // getOne: (resource, params) => Promise,
  // getMany: (resource, params) => Promise,
  // getManyReference: (resource, params) => Promise,
  // create: (resource, params) => Promise,
  // update: (resource, params) => Promise,
  // updateMany: (resource, params) => Promise,
  // delete: (resource, params) => Promise,
  // deleteMany: (resource, params) => Promise
};
