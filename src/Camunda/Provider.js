import React from "react";
import BpmnModdle from "bpmn-moddle";
import buildDataProvider from "ra-data-graphql";
import gql from "graphql-tag";
import merge from "lodash/merge";

const processInstanceDataProvider = (
  introspectionResults,
  raFetchType,
  resourceName,
  params
) => {
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
            data: response.data.data.slice(
              (params.pagination.page - 1) * params.pagination.perPage,
              params.pagination.page * params.pagination.perPage
            ),
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
        parseResponse: response => {
          return response.data;
        }
      };
    default:
      throw new Error(`Unsupported fetch type ${raFetchType}`);
  }
};

const moddle = new BpmnModdle();

const getUserTasks = (id, diagram) =>
  new Promise((resolve, reject) => {
    moddle.fromXML(diagram, function(err, definitions) {
      const rootElements = definitions.get("rootElements");
      const tasks = [];
      for (let i = 0; i < rootElements.length; i++) {
        if (!rootElements[i].flowElements) {
          continue;
        }
        for (let j = 0; j < rootElements[i].flowElements.length; j++) {
          if (rootElements[i].flowElements[j].$type === "bpmn:UserTask") {
            let task = definitions.rootElements[i].flowElements[j];
            task.processDefinitionId = id;
            tasks.push(task);
          }
        }
      }
      resolve(tasks);
    });
  });

const processInstanceUserTaskDataProvider = (
  introspectionResults,
  raFetchType,
  resourceName,
  params
) => {
  if (!params.id) {
    throw new Error('Missing parameter "id".');
  }
  switch (raFetchType) {
    case "GET_MANY_REFERENCE":
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
        variables: { id: params.id },
        parseResponse: response =>
          new Promise((resolve, reject) => {
            const { id, diagram } = response.data.data;
            getUserTasks(id, diagram).then(tasks => {
              resolve({
                data: tasks,
                total: tasks.length
              });
            });
          })
      };
    default:
      throw new Error(`Unsupported fetch type ${raFetchType}`);
  }
};

const buildQuery = introspectionResults => (
  raFetchType,
  resourceName,
  params
) => {
  switch (resourceName) {
    case "processDefinition":
      return processInstanceDataProvider(
        introspectionResults,
        raFetchType,
        resourceName,
        params
      );
    case "processDefinitionUserTask":
      return processInstanceUserTaskDataProvider(
        introspectionResults,
        raFetchType,
        resourceName,
        params
      );
    default:
      throw new Error(`Unknown resource ${resourceName}.`);
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
