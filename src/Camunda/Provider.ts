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

const processDefinitionDataProvider: CamundaDataProvider = (
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
            processDefinitions {
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
            data: response.data.processDefinitions.slice(
              (getListParams.pagination.page - 1) *
                getListParams.pagination.perPage,
              getListParams.pagination.page * getListParams.pagination.perPage
            ),
            total: response.data.processDefinitions.length
          };
        }
      };
    case RaFetchType.GET_ONE:
      const getOneParams = params as GetOneParams;
      return {
        query: gql`
          query processDefinition($id: String!) {
            processDefinition(id: $id) {
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
            data: response.data.processDefinition
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

const processDefinitionUserTaskDataProvider: CamundaDataProvider = (
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
            processDefinition(id: $id) {
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
            const { id, diagram } = response.data.processDefinition;
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

const processInstanceDataProvider: CamundaDataProvider = (
  introspectionResults,
  raFetchType,
  resource,
  params
) => {
  switch (raFetchType) {
    case RaFetchType.CREATE:
      const createParams = params as CreateParams;
      return {
        query: gql`
          mutation StartProcessInstanceByKey($key: String!) {
            startProcessInstanceByKey(key: $key) {
              businessKey
              caseInstanceId
              isEnded
              processInstanceId
              tenantId
              processDefinitionId
              id
              variables {
                key
                value
                valueType
              }
            }
          }
        `,
        variables: { key: createParams.data.key },
        parseResponse: (response: any) => {
          return {
            data: response.data.startProcessInstanceByKey
          };
        }
      };
    case RaFetchType.GET_LIST:
    case RaFetchType.GET_MANY:
    case RaFetchType.GET_MANY_REFERENCE:
      const getListParams = params as GetListParams;
      return {
        query: gql`
          query processInstances {
            processInstances {
              variables {
                key
                value
                valueType
              }
              tenantId
              processInstanceId
              processDefinitionId
              isEnded
              id
              caseInstanceId
              businessKey
            }
          }
        `,
        variables: {},
        parseResponse: (response: any) => {
          return {
            data: response.data.processInstances.slice(
              (getListParams.pagination.page - 1) *
                getListParams.pagination.perPage,
              getListParams.pagination.page * getListParams.pagination.perPage
            ),
            total: response.data.processInstances.length
          };
        }
      };
    case RaFetchType.GET_ONE:
      const getOneParams = params as GetOneParams;
      return {
        query: gql`
          query processInstance($id: String!) {
            processInstance(id: $id) {
              variables {
                key
                value
                valueType
              }
              tenantId
              processInstanceId
              processDefinitionId
              isEnded
              id
              caseInstanceId
              businessKey
            }
          }
        `,
        variables: {
          id: `${getOneParams.id}`
        },
        parseResponse: (response: any) => {
          return {
            data: response.data.processInstance
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

const processInstanceUserTaskDataProvider: CamundaDataProvider = (
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
          query userTasks {
            tasks {
              assignee {
                email
                firstName
                id
                lastName
              }
              caseDefinitionId
              caseExecutionId
              caseInstanceId
              contextPath
              createTime
              description
              executionEntity {
                id
                isEnded
                tenantId
                processInstanceId
                isSuspended
              }
              executionId
              id
              formKey
              isSuspended
              variables {
                value
                valueType
                key
              }
              processInstanceId
              taskDefinitionKey
              tenantId
              processDefinitionId
              priority
              parentTaskId
              owner
              name
            }
          }
        `,
        variables: {},
        parseResponse: (response: any) => {
          return {
            data: response.data.tasks.slice(
              (getListParams.pagination.page - 1) *
                getListParams.pagination.perPage,
              getListParams.pagination.page * getListParams.pagination.perPage
            ),
            total: response.data.tasks.length
          };
        }
      };
    case RaFetchType.GET_ONE:
      const getOneParams = params as GetOneParams;
      return {
        query: gql`
          query userTask($id: String!) {
            task(id: $id) {
              assignee {
                email
                firstName
                id
                lastName
              }
              caseDefinitionId
              caseExecutionId
              caseInstanceId
              contextPath
              createTime
              description
              executionEntity {
                id
                isEnded
                tenantId
                processInstanceId
                isSuspended
              }
              executionId
              id
              formKey
              isSuspended
              variables {
                value
                valueType
                key
              }
              processInstanceId
              taskDefinitionKey
              tenantId
              processDefinitionId
              priority
              parentTaskId
              owner
              name
            }
          }
        `,
        variables: {
          id: `${getOneParams.id}`
        },
        parseResponse: (response: any) => {
          return {
            data: response.data.task
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
      return processDefinitionDataProvider(
        introspectionResults,
        raFetchType,
        resource,
        params
      );
    case "processDefinitionUserTask":
      return processDefinitionUserTaskDataProvider(
        introspectionResults,
        raFetchType,
        resource,
        params
      );
    case "processInstance":
      return processInstanceDataProvider(
        introspectionResults,
        raFetchType,
        resource,
        params
      );
    case "processInstanceUserTask":
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
