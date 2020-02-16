import BpmnModdle, { Definitions } from "bpmn-moddle";
import gql from "graphql-tag";
import merge from "lodash/merge";
import {
  CreateParams,
  CreateResult,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult
} from "ra-core";
// @ts-ignore
import buildDataProvider from "ra-data-graphql";

enum RaFetchType {
  GET_LIST = "GET_LIST",
  GET_ONE = "GET_ONE",
  GET_MANY = "GET_MANY",
  GET_MANY_REFERENCE = "GET_MANY_REFERENCE",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  UPDATE_MANY = "UPDATE_MANY",
  DELETE = "DELETE",
  DELETE_MANY = "DELETE_MANY"
}

type GraphQLDataProvider = (
  raFetchType: RaFetchType,
  resource: string,
  params:
    | GetOneParams
    | GetListParams
    | GetManyParams
    | GetManyReferenceParams
    | UpdateParams
    | UpdateManyParams
    | CreateParams
    | DeleteParams
    | DeleteManyParams
) =>
  | GetOneResult
  | GetListResult
  | GetManyResult
  | GetManyReferenceResult
  | UpdateResult
  | UpdateManyResult
  | CreateResult
  | DeleteResult
  | DeleteManyResult;

type CamundaDataProvider = (
  introspectionResults: any,
  raFetchType: RaFetchType,
  resource: string,
  params:
    | GetListParams
    | GetManyParams
    | GetManyReferenceParams
    | UpdateParams
    | UpdateManyParams
    | CreateParams
    | DeleteParams
    | DeleteManyParams
) =>
  | GetListResult
  | GetManyResult
  | GetManyReferenceResult
  | UpdateResult
  | UpdateManyResult
  | CreateResult
  | DeleteResult
  | DeleteManyResult;

const processInstanceDataProvider: CamundaDataProvider = (
  introspectionResults,
  raFetchType,
  resource,
  params
) => {
  switch (raFetchType) {
    case RaFetchType.GET_LIST:
    case RaFetchType.GET_MANY:
    case RaFetchType.GET_MANY_REFERENCE:
      const getListParams = params as GetListParams;
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
        parseResponse: (response: any) => {
          return {
            data: response.data.data.slice(
              (getListParams.pagination.page - 1) *
                getListParams.pagination.perPage,
              getListParams.pagination.page * getListParams.pagination.perPage
            ),
            total: response.data.data.length
          };
        }
      };
    case RaFetchType.GET_ONE:
      const getOneParams = params as GetOneParams;
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
          id: `${getOneParams.id}`
        },
        parseResponse: (response: any) => {
          return {
            data: response.data.data
          };
        }
      };
    default:
      console.error(`Unsupported fetch type ${raFetchType}`);
      return {
        data: []
      };
  }
};

const moddle = new BpmnModdle();

const getUserTasks = (id: string, diagram: string) =>
  new Promise((resolve, reject) => {
    moddle.fromXML(diagram, function(err, definitions: Definitions) {
      const rootElements = definitions.rootElements;
      const tasks = [];
      for (let i = 0; i < rootElements.length; i++) {
        // @ts-ignore
        if (!rootElements[i].flowElements) {
          continue;
        }
        // @ts-ignore
        for (let j = 0; j < rootElements[i].flowElements.length; j++) {
          // @ts-ignore
          if (rootElements[i].flowElements[j].$type === "bpmn:UserTask") {
            // @ts-ignore
            let task = definitions.rootElements[i].flowElements[j];
            task.processDefinitionId = id;
            tasks.push(task);
          }
        }
      }
      resolve(tasks);
    });
  });

const processInstanceUserTaskDataProvider: CamundaDataProvider = (
  introspectionResults,
  raFetchType,
  resource,
  params
) => {
  switch (raFetchType) {
    case RaFetchType.GET_MANY_REFERENCE:
      const params_ = params as GetManyReferenceParams;
      if (!params_.id) {
        throw new Error('Missing parameter "id".');
      }
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
        variables: { id: params_.id },
        parseResponse: (response: any) =>
          new Promise((resolve, reject) => {
            const { id, diagram } = response.data.data;
            getUserTasks(id, diagram).then((tasks: any) => {
              resolve({
                data: tasks,
                total: tasks.length
              });
            });
          })
      };
    default:
      console.error(`Unsupported fetch type ${raFetchType}`);
      return {
        data: []
      };
  }
};

const buildQuery = (introspectionResults: any) => (
  raFetchType: RaFetchType,
  resource: string,
  params:
    | GetListParams
    | GetManyParams
    | GetManyReferenceParams
    | UpdateParams
    | UpdateManyParams
    | CreateParams
    | DeleteParams
    | DeleteManyParams
) => {
  switch (resource) {
    case "processDefinition":
      return processInstanceDataProvider(
        introspectionResults,
        raFetchType,
        resource,
        params
      );
    case "processDefinitionUserTask":
      return processInstanceUserTaskDataProvider(
        introspectionResults,
        raFetchType,
        resource,
        params
      );
    default:
      throw new Error(`Unknown resource ${resource}.`);
  }
};

const defaultOptions = {
  buildQuery
};

export default async (options: any) => {
  const dataProvider = await buildDataProvider(
    merge({}, defaultOptions, options)
  );
  const dataProviderImpl: GraphQLDataProvider = (
    raFetchType,
    resource,
    params
  ) => {
    return dataProvider(raFetchType, resource, params);
  };
  return dataProviderImpl;
};
